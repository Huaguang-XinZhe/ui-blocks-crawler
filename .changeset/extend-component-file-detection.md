---
"@huaguang/block-crawler": patch
---

fix: 扩展组件文件识别范围，包含 HTML 和 CSS

- `isComponentFile` 现在识别 `.html` 和 `.css` 文件
- 修复重建进度时，只有 HTML/CSS 的 Block 被误判为未完成的问题
- 从 153 个到 462 个的准确统计（flyonui 案例）

