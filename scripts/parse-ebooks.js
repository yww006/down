/**
 * EPUB 解析脚本 - 使用 jszip + xml2js 直接解析
 * 用法: node scripts/parse-ebooks.js
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { parseStringPromise } = require('xml2js');

const BOOKS_DIR = path.join(__dirname, '../books');
const OUTPUT_FILE = path.join(__dirname, '../data/books.json');

// 已有的书籍元数据
const BOOK_META = {
  'deep-work': {
    title: '深度工作',
    author: '卡尔·纽波特',
    category: '效率 / 心理学',
    cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop',
    bgImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
    description: '在碎片化时代，如何重获专注力，完成高价值的深度工作。',
    rating: 4.8
  },
  'atomic-habits': {
    title: '原子习惯',
    author: '詹姆斯·克利尔',
    category: '习惯养成 / 自我提升',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop',
    bgImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80',
    description: '微小改变，巨大成就。通过 1% 的微小进步，利用复利效应实现人生质变。',
    rating: 4.9
  },
  'poor-charlies-almanack': {
    title: '穷查理宝典',
    author: '查理·芒格',
    category: '投资 / 思维模型',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=600&fit=crop',
    bgImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80',
    description: '巴菲特合伙人查理·芒格的智慧结晶。多元思维模型、反向思考、圈内能力。',
    rating: 4.9
  },
  'cognitive-awakening': {
    title: '认知觉醒',
    author: '周岭',
    category: '认知科学 / 个人成长',
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
    bgImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920&q=80',
    description: '从大脑机制出发，拆解元认知、深度学习、专注力、行动力。',
    rating: 4.7
  },
  'principles': {
    title: '原则',
    author: '瑞·达利欧',
    category: '管理 / 决策 / 人生哲学',
    cover: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=600&fit=crop',
    bgImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80',
    description: '桥水基金创始人瑞·达利欧的工作与生活原则。拥抱现实、极度透明、加权决策。',
    rating: 4.6
  }
};

// 从 HTML 中提取纯文本
function extractText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// 智能分章：按 h1/h2/h3 标签分割
function splitIntoChapters(html, bookId) {
  const chapters = [];
  let currentChapter = { title: '', content: '' };
  let inChapter = false;

  const headingRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
  let lastIndex = 0;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const title = extractText(match[1]);
    const contentBefore = html.slice(lastIndex, match.index);
    
    if (inChapter && currentChapter.content.trim()) {
      chapters.push({
        title: currentChapter.title || `第 ${chapters.length} 章`,
        content: extractText(contentBefore).trim()
      });
    }
    
    currentChapter = { title, content: '' };
    inChapter = true;
    lastIndex = match.index + match[0].length;
  }

  const remainingContent = html.slice(lastIndex);
  if (inChapter && extractText(remainingContent).trim()) {
    chapters.push({
      title: currentChapter.title || `第 ${chapters.length + 1} 章`,
      content: extractText(remainingContent).trim()
    });
  }

  if (chapters.length === 0) {
    chapters.push({
      title: '全文',
      content: extractText(html)
    });
  }

  return chapters.filter(c => c.content.length > 100);
}

// 解析单个 EPUB
async function parseEpub(filePath, bookId) {
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);

  // 1. 找到 container.xml -> opf 文件
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) throw new Error('No container.xml');

  const container = await parseStringPromise(containerXml);
  const rootfile = container.container.rootfiles[0].rootfile[0].$['full-path'];
  const opfDir = path.dirname(rootfile);
  const opsRoot = opfDir ? opfDir + '/' : '';

  // 2. 解析 OPF -> 获取 spine 顺序和 manifest
  const opfXml = await zip.file(rootfile)?.async('string');
  if (!opfXml) throw new Error('No OPF file');

  const opf = await parseStringPromise(opfXml);
  const package = opf.package;
  
  // manifest: id -> { href, media-type }
  const manifest = {};
  if (package.manifest && package.manifest[0].item) {
    for (const item of package.manifest[0].item) {
      manifest[item.$.id] = {
        href: item.$.href,
        mediaType: item.$['media-type']
      };
    }
  }

  // spine 顺序
  const spine = [];
  if (package.spine && package.spine[0].itemref) {
    for (const itemref of package.spine[0].itemref) {
      spine.push(itemref.$.idref);
    }
  }

  // 3. 按 spine 顺序读取每章内容，每个 spine 项作为一章
  const chapters = [];
  const content = {};

  for (let i = 0; i < spine.length; i++) {
    const idref = spine[i];
    const item = manifest[idref];
    if (!item || item.mediaType !== 'application/xhtml+xml') continue;

    const chapterPath = path.join(opsRoot, item.href);
    const chapterXml = await zip.file(chapterPath)?.async('string');
    if (!chapterXml) continue;

    // 提取标题和正文
    const titleMatch = chapterXml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? extractText(titleMatch[1]) : `第 ${i + 1} 章`;
    
    // 提取 body 内容
    const bodyMatch = chapterXml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : chapterXml;
    
    // 只保留 div 里的内容
    const divMatch = bodyHtml.match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const contentHtml = divMatch ? divMatch[1] : bodyHtml;
    
    const cleanText = extractText(contentHtml).trim();
    
    if (cleanText.length > 50) {
      chapters.push(title);
      content[String(i + 1)] = cleanText;
    }
  }

  return { chapters, content };
}

// 主函数
async function main() {
  console.log('📚 开始解析 EPUB 文件...\n');

  if (!fs.existsSync(BOOKS_DIR)) {
    fs.mkdirSync(BOOKS_DIR, { recursive: true });
    console.log(`📁 已创建目录: ${BOOKS_DIR}`);
    console.log('请将 .epub 文件放入该目录，文件名建议使用英文（如 deep-work.epub）');
    return;
  }

  const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.epub'));
  
  if (files.length === 0) {
    console.log('📭 未找到 .epub 文件');
    console.log(`请将电子书文件放入: ${BOOKS_DIR}`);
    return;
  }

  // 读取现有数据
  let existingData = { books: [], lastUpdated: new Date().toISOString().split('T')[0], totalDays: 0 };
  if (fs.existsSync(OUTPUT_FILE)) {
    existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  }

  const existingBooks = existingData.books || [];
  const existingByDate = Object.fromEntries(existingBooks.map(b => [b.date, b]));

  const today = new Date().toISOString().split('T')[0];

  for (const file of files) {
    const bookId = path.basename(file, '.epub').toLowerCase();
    const filePath = path.join(BOOKS_DIR, file);
    
    console.log(`📖 解析: ${file} (ID: ${bookId})`);
    
    try {
      const { chapters, content } = await parseEpub(filePath, bookId);
      console.log(`   ✅ 解出 ${chapters.length} 章`);

      const meta = BOOK_META[bookId] || {
        title: bookId,
        author: '未知作者',
        category: '其他',
        cover: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop`,
        bgImage: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80`,
        description: '暂无简介',
        rating: 4.0
      };

      // 使用文件名对应的日期，或今天
      const date = existingData.books.find(b => b.title === meta.title)?.date || today;

      const bookData = {
        id: date,
        date,
        title: meta.title,
        author: meta.author,
        category: meta.category,
        cover: meta.cover,
        bgImage: meta.bgImage,
        description: meta.description,
        progress: 100,
        chapters,
        content,
        highlights: chapters.slice(0, 3).map((c, i) => content[String(i + 1)]?.slice(0, 200) + '...' || ''),
        rating: meta.rating
      };

      // 替换或添加
      if (existingByDate[date]) {
        Object.assign(existingByDate[date], bookData);
      } else {
        existingByDate[date] = bookData;
      }
    } catch (err) {
      console.error(`   ❌ 解析失败: ${err.message}`);
    }
  }

  // 转回数组并按日期倒序
  const allBooks = Object.values(existingByDate).sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = {
    books: allBooks,
    lastUpdated: today,
    totalDays: allBooks.length
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ 已生成: ${OUTPUT_FILE}`);
  console.log(`📊 共 ${allBooks.length} 本书`);
}

main().catch(err => {
  console.error('❌ 失败:', err);
  process.exit(1);
});