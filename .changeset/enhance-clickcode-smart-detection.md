---
"@huaguang/block-crawler": patch
---

增强 clickCode 的健壮性

- `clickCode` 现在支持智能检测 Code 元素类型（tab 或 button）
- 第一次检测后会缓存到 `ProcessingContext` 中，后续自动应用
- 避免硬编码假设 Code 元素始终是 tab，提高兼容性
- 精确匹配 "Code" 名称，避免误匹配 "Copy code" 等相似按钮

