---
"@huaguang/block-crawler": patch
---

智能文件名生成：复用 resolveTabName 逻辑

- 将 `resolveTabName` 从 `safe-output.ts` 导出，供其他模块复用
- `AutoFileProcessor` 现在使用 `resolveTabName` 进行智能文件名生成：
  - 语言名（如 "HTML", "CSS", "JS"）→ 输出为 `index.html`, `index.css`, `index.js`
  - 文件名（如 "index.html", "App.tsx"）→ 直接使用该文件名
- 与 safeOutput 的行为保持一致
- 解决了之前所有文件都输出为语言名（HTML、CSS、JS）而不是实际文件名的问题

