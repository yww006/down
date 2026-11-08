/**
 * 创建测试用 EPUB 文件
 * 用法: node scripts/create-test-epub.js
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const BOOKS_DIR = path.join(__dirname, '../books');

async function createTestEpub() {
  if (!fs.existsSync(BOOKS_DIR)) {
    fs.mkdirSync(BOOKS_DIR, { recursive: true });
  }

  const zip = new JSZip();

  // mimetype (必须第一个，不压缩)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // OEBPS/content.opf
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">test-deep-work</dc:identifier>
    <dc:title>深度工作</dc:title>
    <dc:creator>卡尔·纽波特</dc:creator>
    <dc:language>zh-CN</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch2" href="ch2.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch3" href="ch3.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch4" href="ch4.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch5" href="ch5.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1"/>
    <itemref idref="ch2"/>
    <itemref idref="ch3"/>
    <itemref idref="ch4"/>
    <itemref idref="ch5"/>
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  // OEBPS/toc.ncx
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head><meta name="dtb:uid" content="test-deep-work"/></head>
  <docTitle><text>深度工作</text></docTitle>
  <navMap>
    <navPoint id="ch1" playOrder="1"><navLabel><text>第一章：深度工作的价值</text></navLabel><content src="ch1.xhtml"/></navPoint>
    <navPoint id="ch2" playOrder="2"><navLabel><text>第二章：深度工作稀缺且意义重大</text></navLabel><content src="ch2.xhtml"/></navPoint>
    <navPoint id="ch3" playOrder="3"><navLabel><text>第三章：放弃社交媒体</text></navLabel><content src="ch3.xhtml"/></navPoint>
    <navPoint id="ch4" playOrder="4"><navLabel><text>第四章：排尽浅层工作</text></navLabel><content src="ch4.xhtml"/></navPoint>
    <navPoint id="ch5" playOrder="5"><navLabel><text>第五章：像工匠一样工作</text></navLabel><content src="ch5.xhtml"/></navPoint>
  </navMap>
</ncx>`);

  // OEBPS/nav.xhtml
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>目录</title></head>
<body>
  <nav epub:type="toc"><ol>
    <li><a href="ch1.xhtml">第一章：深度工作的价值</a></li>
    <li><a href="ch2.xhtml">第二章：深度工作稀缺且意义重大</a></li>
    <li><a href="ch3.xhtml">第三章：放弃社交媒体</a></li>
    <li><a href="ch4.xhtml">第四章：排尽浅层工作</a></li>
    <li><a href="ch5.xhtml">第五章：像工匠一样工作</a></li>
  </ol></nav>
</body>
</html>`);

  // 章节内容
  const chapters = [
    {
      file: 'ch1.xhtml',
      title: '第一章：深度工作的价值',
      content: `深度工作是指在无干扰的专注状态下进行的专业活动，这些活动能创造新价值、提升技能、难以复制。

浅层工作是指不需要太多认知要求的、常在分心状态下进行的任务，这些工作通常不会创造太多新价值，且容易被复制。

在当今经济中，深度工作变得越来越稀缺，也因此变得越来越有价值。能够掌握深度工作的人将获得巨大的竞争优势。

深度工作假设：在几乎所有职业中，深度工作能力都是核心竞争力。随着信息技术的发展，浅层工作越来越容易被自动化或外包，而深度工作所需的复杂认知技能反而更加稀缺。

作者通过多个案例说明：比尔·盖茨的"思考周"、心理学家荣格的塔楼、作家尼尔·斯蒂芬森的隔离写作环境，都证明了深度工作产出非凡成果的规律。`
    },
    {
      file: 'ch2.xhtml',
      title: '第二章：深度工作稀缺且意义重大',
      content: `为什么深度工作如此稀缺？主要有三个原因：开放办公环境、即时通讯工具、社交媒体文化。

开放式办公室号称促进协作，实则制造持续干扰。研究显示，开放办公室员工面对面交流反而减少 70%，转而使用邮件和即时消息。

即时通讯工具让"随时可达"成为常态，打破了深度工作所需的长时间不间断专注。平均每 6 分钟就被打断一次，恢复专注需 23 分钟。

社交媒体文化鼓励碎片化表达，让人习惯于浅层思考。点赞、转发、评论形成多巴胺循环，削弱长时间专注的耐受力。

尽管稀缺，深度工作意义重大：它是掌握复杂技能的前提，是产出高质量成果的基础，也是在 AI 时代保持不可替代性的关键。`
    },
    {
      file: 'ch3.xhtml',
      title: '第三章：放弃社交媒体',
      content: `社交媒体并非本质上有害，但它的设计目标是夺取你的注意力，而非创造价值。

工匠法则：只采用那些正面影响远大于负面影响的工具。对每个社交媒体平台问：它是否直接服务于我的核心目标？如果答案模糊，就戒掉。

30天数字极简主义实验：彻底戒掉所有可选技术 30 天，然后只恢复真正有价值的。实验发现，大多数人所谓的"必须用"只是习惯和恐惧。

替代方案：用高质量休闲填补时间。阅读、运动、面对面社交、手工制作、学习新技能——这些活动消耗注意力但产生更深的满足感。

关键洞察：注意力是唯一不可再生资源。社交媒体公司雇佣最聪明的工程师设计算法夺取它，你需要同等程度的策略来保护它。`
    },
    {
      file: 'ch4.xhtml',
      title: '第四章：排尽浅层工作',
      content: `浅层工作不可避免，但可以压缩。目标不是消除，而是将其压缩到最小必要量。

策略一：时间块规划。每天提前规划每小时做什么，包括深度工作块、浅层工作批处理、休息。不留空白给随机性。

策略二：固定下班时间。设定硬性截止时间（如 17:30），倒逼白天高效。帕金森定律：工作会自动膨胀填满可用时间。

策略三：拒绝非必要会议和邮件。设置自动回复、建立沟通协议、批量处理邮件（每天 2-3 次固定时段）。

策略四：量化深度工作时长。记录每天深度工作小时数，设定周目标（如 20 小时），可视化进度。

关键心法：把浅层工作视为"税收"，深度工作才是"投资"。缴税要合规但要最小化，投资要最大化。`
    },
    {
      file: 'ch5.xhtml',
      title: '第五章：像工匠一样工作',
      content: `工匠精神的核心：追求卓越不为外部奖励，只为作品本身的质量。

四种深度工作哲学：修道派（完全隔离）、双峰派（固定深度工作日）、节奏派（每天固定时段）、记者派（随时抓住缝隙）。新手建议从节奏派开始。

仪式化启动：固定地点、固定时间、固定工具、固定启动动作（如泡咖啡、整理桌面、戴降噪耳机）。降低启动阻力，建立条件反射。

大块时间保护：每周预留 2-3 个 4 小时的大块时间，拒绝一切打断。告诉同事家人：这是神圣时间。

休息的艺术：深度工作后的休息必须是真正的休息——散步、冥想、发呆、小睡，而非刷手机。大脑在休息时整理巩固神经连接。

长期坚持：深度工作像肌肉，需要渐进式超负荷。从每天 1 小时开始，逐周增加。3 个月后，4 小时深度工作将成为常态。`
    }
  ];

  for (const ch of chapters) {
    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${ch.title}</title></head>
<body>
  <h1>${ch.title}</h1>
  <div>${ch.content.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('\n')}</div>
</body>
</html>`;
    zip.file(`OEBPS/${ch.file}`, xhtml);
  }

  // 生成 EPUB
  const outputPath = path.join(BOOKS_DIR, 'deep-work.epub');
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputPath, content);
  console.log(`✅ 已生成测试 EPUB: ${outputPath}`);
}

createTestEpub().catch(console.error);