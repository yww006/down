/**
 * 每日一篇电子书阅读页 - 主逻辑
 * 数据源：data/books.json
 */
(function() {
  'use strict';

  // === State ===
  let books = [];
  let currentFilter = 'all';
  let currentBook = null;
  let currentModalTab = 'catalog';

  // === DOM Elements ===
    const elements = {
      bgLayer: document.getElementById('bg-layer'),
      heroCover: document.getElementById('hero-cover-img'),
      heroBadge: document.getElementById('hero-badge'),
      heroCategory: document.getElementById('hero-category'),
      heroTitle: document.getElementById('hero-title'),
      heroAuthor: document.getElementById('hero-author'),
      heroDesc: document.getElementById('hero-desc'),
      heroProgressFill: document.getElementById('hero-progress-fill'),
      heroProgressText: document.getElementById('hero-progress-text'),
      heroReadBtn: document.getElementById('hero-read-btn'),
      heroPreviewBtn: document.getElementById('hero-preview-btn'),
      booksGrid: document.getElementById('books-grid'),
      modal: document.getElementById('book-modal'),
      modalClose: document.getElementById('modal-close'),
      modalCover: document.getElementById('modal-cover'),
      modalTitle: document.getElementById('modal-title'),
      modalAuthor: document.getElementById('modal-author'),
      modalDesc: document.getElementById('modal-desc'),
      modalChapters: document.getElementById('modal-chapters'),
      modalHighlights: document.getElementById('modal-highlights'),
      modalReading: document.getElementById('modal-reading'),
      modalMeta: document.getElementById('modal-meta'),
      modalTabs: document.querySelectorAll('.modal-tab'),
      filterTabs: document.querySelectorAll('.filter-tab'),
      readingFontSmaller: document.getElementById('reading-font-smaller'),
      readingFontLarger: document.getElementById('reading-font-larger'),
      readingThemeToggle: document.getElementById('reading-theme-toggle'),
      readingProgressBar: document.getElementById('reading-progress-bar')
    };

  // === Init ===
  async function init() {
    await loadBooks();
    setupEventListeners();
    renderTodayBook();
    renderBooksGrid();
    updateBackground(books[0]?.bgImage);
  }

  // === Load Data ===
  async function loadBooks() {
    try {
      const res = await fetch('data/books.json');
      if (!res.ok) throw new Error('Failed to load books');
      const data = await res.json();
      books = data.books || [];
      // Sort by date descending
      books.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
      console.error('Load books error:', err);
      books = [];
    }
  }

  // === Render Today's Book (Hero) ===
  function renderTodayBook() {
    const today = books[0];
    if (!today) return;

    // Update background
    updateBackground(today.bgImage);

    // Hero content
    elements.heroCover.src = today.cover;
    elements.heroCover.alt = today.title;
    elements.heroBadge.textContent = '今日荐读';
    elements.heroCategory.textContent = today.category;
    elements.heroTitle.textContent = today.title;
    elements.heroAuthor.innerHTML = `作者：<strong>${today.author}</strong>`;
    elements.heroDesc.textContent = today.description;

    // Progress
    elements.heroProgressFill.style.width = `${today.progress}%`;
    elements.heroProgressText.textContent = `阅读进度：${today.progress}%`;

    // Buttons
    elements.heroReadBtn.dataset.bookId = today.id;
    elements.heroPreviewBtn.dataset.bookId = today.id;
  }

  // === Render Books Grid ===
  function renderBooksGrid(filter = 'all') {
    const filtered = filter === 'all'
      ? books
      : books.filter(b => b.id.startsWith(filter)); // Simple filter by date prefix if needed

    elements.booksGrid.innerHTML = filtered.map((book, idx) => `
      <article class="book-card" data-book-id="${book.id}" style="animation-delay: ${idx * 0.05}s">
        <div class="card-cover">
          <img src="${book.cover}" alt="${book.title}" loading="lazy">
          <span class="card-badge">${formatDate(book.date)}</span>
          <svg class="card-progress-ring" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
            <circle class="progress-ring-fill" cx="22" cy="22" r="18" fill="none" stroke="#ffd740" stroke-width="4"
              stroke-dasharray="${113.1}" stroke-dashoffset="${113.1 * (1 - book.progress / 100)}"
              transform="rotate(-90 22 22)" style="transition: stroke-dashoffset 0.6s ease;"/>
          </svg>
        </div>
        <div class="card-body">
          <time class="card-date" datetime="${book.date}">${formatDateLong(book.date)}</time>
          <h3 class="card-title">${book.title}</h3>
          <p class="card-author">${book.author}</p>
          <span class="card-category">${book.category}</span>
          <div class="card-rating">
            <span>★</span>
            <span>${book.rating}</span>
            <span style="color:var(--text-muted);font-weight:400;">/5.0</span>
          </div>
        </div>
      </article>
    `).join('');

    // Animate progress rings
    requestAnimationFrame(() => {
      document.querySelectorAll('.progress-ring-fill').forEach((el, i) => {
        const book = filtered[i];
        if (book) {
          el.style.strokeDashoffset = 113.1 * (1 - book.progress / 100);
        }
      });
    });

    // Bind click events
    document.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', () => openModal(card.dataset.bookId));
    });
  }

  // === Generate Reading Content ===
  function generateReadingContent(book) {
    // 优先使用真实内容
    if (book.content && typeof book.content === 'object') {
      return book.chapters.map((chapterTitle, i) => {
        const chapterNum = i + 1;
        const realContent = book.content[String(chapterNum)] || book.content[chapterTitle] || '';
        return `
          <article class="reading-chapter" data-chapter="${chapterNum}">
            <header class="chapter-header">
              <span class="chapter-label">第 ${chapterNum} 章</span>
              <h3 class="chapter-title">${chapterTitle}</h3>
            </header>
            <div class="chapter-content">
              ${realContent ? formatReadingContent(realContent) : generateChapterText(book, chapterTitle, chapterNum)}
            </div>
          </article>
        `;
      }).join('');
    }
    // 回退：生成内容
    return book.chapters.map((chapterTitle, i) => {
      const chapterNum = i + 1;
      return `
        <article class="reading-chapter" data-chapter="${chapterNum}">
          <header class="chapter-header">
            <span class="chapter-label">第 ${chapterNum} 章</span>
            <h3 class="chapter-title">${chapterTitle}</h3>
          </header>
          <div class="chapter-content">
            ${generateChapterText(book, chapterTitle, chapterNum)}
          </div>
        </article>
      `;
    }).join('');
  }

  // 格式化真实阅读内容：段落化、首行缩进
  function formatReadingContent(text) {
    if (!text) return '';
    // 按双换行分段，或按句号分段
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    if (paragraphs.length <= 1) {
      // 单大段：按句号分割成多段
      const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
      const chunks = [];
      for (let i = 0; i < sentences.length; i += 3) {
        chunks.push(sentences.slice(i, i + 3).join('。') + '。');
      }
      return chunks.map((p, i) => `<p style="text-indent:${i===0?'0':'2em'}">${p.trim()}</p>`).join('');
    }
    return paragraphs.map((p, i) => `<p style="text-indent:${i===0?'0':'2em'}">${p.trim()}</p>`).join('');
  }

  function generateChapterText(book, chapterTitle, chapterNum) {
    // Generate contextual reading content based on book and chapter
    const templates = [
      `在《${book.title}》的这一章中，${book.author} 深入探讨了 ${chapterTitle.replace('第', '').replace('章', '').replace('部分', '').replace('篇', '')} 的核心概念。通过大量实证研究和生动案例，作者揭示了这一原则在现实生活中的运作机制。`,
      `本章的关键洞察在于：${chapterTitle} 不仅仅是一个理论概念，更是一套可操作的实践框架。${book.author} 指出，大多数人之所以无法践行，是因为缺乏系统性的方法论而非动力不足。`,
      `通过对比成功与失败的案例，我们可以清晰地看到：掌握 ${chapterTitle} 的人，往往能在关键节点做出更优决策。这种优势是累积的，正如复利效应般在时间维度放大。`,
      `实践建议：从微小的行动开始。${book.author} 建议设立"最低可行性行动"——每天只需投入 5-10 分钟，但必须保持连续性。正是这些微不足道的坚持，最终汇聚成质变。`,
      `本章最后，${book.author} 提醒我们要警惕"虚假进步"的陷阱。看似忙碌的学习、收藏未读的文章、未执行的计划，都不是真正的 ${chapterTitle}。唯有落地执行，才能将认知转化为能力。`
    ];
    
    // Use different template for each chapter
    const template = templates[chapterNum % templates.length];
    
    // Add more paragraphs for longer reading experience
    const extraParagraphs = [
      `延伸思考：将这一原则应用到你的具体情境中。无论是职业发展、技能习得、人际关系还是健康管理，${chapterTitle} 的底层逻辑都具有通用性。尝试列出 3 个你当前面临的挑战，分析如何用本章框架拆解。`,
      `避坑指南：常见误区包括——追求完美而不敢开始、过度依赖工具而忽视本质、缺乏反馈回路导致偏离方向。建议建立"周复盘"机制，每周花 15 分钟检视执行情况并微调策略。`,
      `进阶路径：当基础习惯稳固后，可以尝试"习惯叠加"——将新习惯锚定在已有习惯后，利用神经通路的惯性降低启动阻力。例如：刷牙后冥想 2 分钟、喝咖啡后阅读 1 页、关灯前复盘 3 件事。`
    ];
    
    return `<p>${template}</p><p>${extraParagraphs[chapterNum % extraParagraphs.length]}</p><p>${extraParagraphs[(chapterNum + 1) % extraParagraphs.length]}</p>`;
  }

  // === Modal ===
  function openModal(bookId, defaultTab = 'catalog') {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    currentBook = book;
    currentModalTab = defaultTab;

    updateBackground(book.bgImage);

    elements.modalCover.src = book.cover;
    elements.modalCover.alt = book.title;
    elements.modalTitle.textContent = book.title;
    elements.modalAuthor.innerHTML = `作者：<strong>${book.author}</strong> · ${book.category}`;
    elements.modalDesc.textContent = book.description;

    // Meta tags
    elements.modalMeta.innerHTML = `
      <span class="meta-tag">${formatDateLong(book.date)}</span>
      <span class="meta-tag">进度 ${book.progress}%</span>
      <span class="meta-tag">评分 ${book.rating}/5.0</span>
    `;

    // Chapters (Catalog tab)
    elements.modalChapters.innerHTML = book.chapters.map((ch, i) => `
      <li class="chapter-item" data-chapter="${i + 1}">
        <span class="chapter-num">${i + 1}</span>
        <span>${ch}</span>
        <button class="chapter-read-btn" data-chapter="${i + 1}" aria-label="阅读第 ${i + 1} 章">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </button>
      </li>
    `).join('');

    // Highlights
    elements.modalHighlights.innerHTML = book.highlights.map(h => `
      <li class="highlight-item">${h}</li>
    `).join('');

    // Reading content
    elements.modalReading.innerHTML = generateReadingContent(book);

    // Bind chapter read buttons
    document.querySelectorAll('.chapter-read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chapterNum = parseInt(btn.dataset.chapter);
        switchToReadingTab(chapterNum);
      });
    });

    // Bind chapter items click to scroll to reading
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.addEventListener('click', () => {
        const chapterNum = parseInt(item.dataset.chapter);
        switchToReadingTab(chapterNum);
      });
    });

    // Set active tab
    setModalTab(defaultTab);
    // Re-setup modal tabs in case Rocket Loader interfered
    setupModalTabs();

    elements.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function switchToReadingTab(chapterNum = 1) {
    setModalTab('reading');
    // Scroll to chapter
    setTimeout(() => {
      const chapterEl = elements.modalReading.querySelector(`[data-chapter="${chapterNum}"]`);
      if (chapterEl) {
        chapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        chapterEl.style.animation = 'highlightPulse 1.5s ease';
        setTimeout(() => chapterEl.style.animation = '', 1500);
      }
    }, 50);
  }

  function setModalTab(tab) {
    currentModalTab = tab;
    // Update tab buttons - re-query to handle cloned nodes
    document.querySelectorAll('.modal-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    // Update panels
    document.getElementById('panel-catalog').hidden = tab !== 'catalog';
    document.getElementById('panel-highlights').hidden = tab !== 'highlights';
    document.getElementById('panel-reading').hidden = tab !== 'reading';
  }

  function closeModal() {
    elements.modal.classList.remove('open');
    document.body.style.overflow = '';
    // Restore today's background
    if (books[0]) updateBackground(books[0].bgImage);
  }

  // === Background ===
  function updateBackground(url) {
    if (!url) return;
    elements.bgLayer.style.backgroundImage = `url("${url}")`;
  }

  // === Filters ===
  function setupFilters() {
    elements.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderBooksGrid(currentFilter);
      });
    });
  }

  // Modal tabs - re-query each time to handle dynamic content
  function setupModalTabs() {
    const tabs = document.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
      // Remove existing listeners by cloning
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);
      newTab.addEventListener('click', () => setModalTab(newTab.dataset.tab));
    });
  }

  // === Event Listeners ===
  function setupEventListeners() {
    // Modal close
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', e => {
      if (e.target === elements.modal) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && elements.modal.classList.contains('open')) closeModal();
    });

    // Hero buttons - "开始阅读" goes to reading tab, "目录预览" goes to catalog
    elements.heroReadBtn.addEventListener('click', () => openModal(elements.heroReadBtn.dataset.bookId, 'reading'));
    elements.heroPreviewBtn.addEventListener('click', () => openModal(elements.heroPreviewBtn.dataset.bookId, 'catalog'));

    // Modal tabs - setup initially and re-setup when modal opens
    setupModalTabs();

    // Reading controls
    let fontSize = 17; // base px
    elements.readingFontSmaller?.addEventListener('click', () => {
      fontSize = Math.max(14, fontSize - 1);
      elements.modalReading.style.fontSize = fontSize + 'px';
    });
    elements.readingFontLarger?.addEventListener('click', () => {
      fontSize = Math.min(24, fontSize + 1);
      elements.modalReading.style.fontSize = fontSize + 'px';
    });
    elements.readingThemeToggle?.addEventListener('click', () => {
      document.body.classList.toggle('reading-light');
    });

    // Reading progress bar on scroll
    elements.modal.addEventListener('scroll', updateReadingProgress, { passive: true });
    elements.modalReading?.addEventListener('scroll', updateReadingProgress, { passive: true });

    // Filter tabs
    setupFilters();
  }

  function updateReadingProgress() {
    const panel = document.getElementById('panel-reading');
    if (!panel || panel.hidden) return;
    const content = elements.modalReading;
    if (!content) return;
    const scrollTop = content.scrollTop;
    const scrollHeight = content.scrollHeight - content.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    elements.readingProgressBar.style.setProperty('--progress', progress + '%');
    elements.readingProgressBar.querySelector('::before') || (elements.readingProgressBar.style.background = `linear-gradient(90deg, var(--accent), #ffab00) 0% ${progress}%, transparent ${progress}% 100%`);
    // Fallback: use CSS custom property
    elements.readingProgressBar.style.setProperty('--progress-width', progress + '%');
  }

  // === Helpers ===
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  }
  function formatDateLong(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  // === Start ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();