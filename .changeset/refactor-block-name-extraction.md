---
"@huaguang/block-crawler": patch
---

重构 block 名称提取逻辑

**优化内容：**
- 创建独立的 `BlockNameExtractor` 工具类，统一处理 block 名称提取逻辑
- `BlockProcessor` 和 `CrawlerOrchestrator` 共享同一套提取逻辑，避免重复代码
- 明确类型定义：`section` 参数从 `any` 改为 `Locator`
- 统一错误处理：测试模式和 Block 模式行为一致，结构复杂但未找到 link 时都会抛出错误

**技术改进：**
- 单一职责：提取逻辑独立封装
- 代码复用：两处调用共享同一实现
- 类型安全：移除 `any` 类型使用

