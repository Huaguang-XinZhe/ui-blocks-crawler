---
"block-crawler": patch
---

修复 Free 页面进度记录和 pageHandler 调用问题

- 🐛 修复 Free 页面没有被标记到进度文件的问题
- 🐛 修复 pageHandler 在 Free 页面时不会被调用的问题
- ✨ pageHandler 现在始终会被调用，在 PageContext 中添加 `isFree` 标记让用户决定是否处理
- 🔧 在 CrawlerOrchestrator 中添加 `normalizePagePath` 方法用于路径标准化

