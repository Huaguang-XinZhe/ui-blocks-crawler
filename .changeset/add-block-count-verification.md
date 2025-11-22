---
"@huaguang/block-crawler": minor
---

feat: 添加组件数量验证机制

- 新增 `MismatchRecorder` 用于记录组件数量不一致的页面
- `CollectionLink.blockCount` 现在会传递到 `BlockProcessor` 进行验证
- 如果实际定位到的组件数与预期不一致，跳过该页面并记录到 `mismatch.json`
- 避免因页面滚动加载不完全导致的数据不完整问题
- 修复统计显示：成功数只显示本次处理的页面数，不包含之前完成的
- 修复 `isComponentFile` 识别范围，包含 `.html` 和 `.css` 文件

