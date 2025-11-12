---
"block-crawler": patch
---

修复文件写入方法和优化域名目录格式

- 🐛 修复 `fse.writeJson` 不存在的错误，改用 `fse.outputJson` 方法
- 🔄 优化域名目录格式：从横杠分隔改为保留原始点号（如 `www.untitledui.com` 而非 `www-untitledui-com`）
- ✨ 所有 JSON 写入操作现在自动确保目录存在

