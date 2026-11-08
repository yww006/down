# 每日一篇 · 电子书阅读页

> 每天一篇精选电子书推荐，配背景大图，沉浸式阅读体验。

## 🌐 在线访问
**GitHub Pages**：https://yww006.github.io/down/

## 📁 项目结构
```
down/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── app.js          # 交互逻辑
├── data/
│   └── books.json      # 书籍数据（每日更新这里）
└── images/             # 本地图片目录（可选）
```

## ✨ 功能特性
- **每日一篇**：首屏自动展示最新一期推荐
- **背景大图**：每本书配专属背景图，自动切换
- **阅读进度环**：圆环进度条直观显示完成度
- **详情弹窗**：点击卡片查看章节目录、金句摘录
- **分类筛选**：按月份/全部浏览历史推荐
- **响应式设计**：桌面端/移动端完美适配
- **零依赖**：原生 HTML/CSS/JS，无构建步骤

## 🔧 如何更新「每日一篇」

编辑 `data/books.json`，在 `books` 数组**最前面**插入新条目：

```json
{
  "id": "2026-11-08",
  "date": "2026-11-08",
  "title": "书名",
  "author": "作者",
  "category": "分类标签",
  "cover": "https://images.unsplash.com/photo-xxx?w=400&h=600&fit=crop",
  "bgImage": "https://images.unsplash.com/photo-xxx?w=1920&q=80",
  "description": "一句话简介，显示在首页和详情页",
  "progress": 100,
  "chapters": ["第一章", "第二章", "..."],
  "highlights": ["金句1", "金句2", "..."],
  "rating": 4.8
}
```

字段说明：
| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✅ | 唯一标识，建议用日期 `YYYY-MM-DD` |
| `date` | ✅ | 显示日期 |
| `title` | ✅ | 书名 |
| `author` | ✅ | 作者 |
| `category` | ✅ | 分类，用于显示和筛选 |
| `cover` | ✅ | 封面图（2:3 比例，400×600） |
| `bgImage` | ✅ | 背景大图（16:9，1920×1080） |
| `description` | ✅ | 简介 |
| `progress` | ✅ | 0-100 阅读进度 |
| `chapters` | ✅ | 章节数组 |
| `highlights` | ✅ | 金句数组 |
| `rating` | ✅ | 评分 0-5 |

> 推荐用 [Unsplash](https://unsplash.com) 搜书名/关键词获取高质量图片，直接复制图片链接即可。

## 🚀 本地预览
```bash
# 任意静态服务器均可
npx serve .
# 或
python3 -m http.server 8000
```
浏览器打开 `http://localhost:8000`

## 📦 部署
已配置 GitHub Pages，推送到 `main` 分支自动部署。

## 🎨 自定义配色
修改 `css/style.css` 顶部 `:root` 变量：
```css
:root {
  --accent: #ffd740;        /* 主强调色（金色） */
  --bg: #0a0e17;            /* 背景深色 */
  --card-bg: rgba(22,30,48,0.9);
  --font-sans: ...;         /* 无衬线字体 */
  --font-serif: ...;        /* 衬线字体 */
}
```

## 📄 许可证
MIT License — 代码结构可自由复用，书籍数据版权归原作者/出版社所有。