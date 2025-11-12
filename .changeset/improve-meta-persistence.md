---
"block-crawler": minor
---

优化元信息持久化机制，支持多次部分运行

- ✨ Free 页面和 Free Block 现在采用追加而非覆盖策略，支持多次部分运行累积
- ✨ 添加 `isComplete` 字段标记爬虫是否完整运行（未中断/未发生错误）
- 🔄 Breaking: 移除 `startTime`、`endTime`、`duration` 字段，改用 `lastUpdate` 字段
- ✨ MetaCollector 现在会自动加载并合并已有的 Free 数据
- 🎯 正常完成时 `isComplete` 为 `true`，中断或错误时为 `false`

