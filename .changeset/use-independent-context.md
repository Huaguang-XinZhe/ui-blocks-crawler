---
"@huaguang/block-crawler": minor
---

新增 useIndependentContext 配置，解决并发场景下的状态污染问题

**主要功能：**

1. **独立 Context 模式**
   - 为每个并发页面创建独立的 BrowserContext
   - 完全隔离页面状态，避免互相干扰
   - 默认关闭，需手动开启

2. **解决的问题**
   - 并发场景下点击操作失效
   - 页面状态混乱、状态污染
   - 提高并发稳定性

3. **自动资源管理**
   - 页面关闭时自动清理对应的 Context
   - 避免内存泄漏

**使用方式：**

```typescript
// 并发场景开启（推荐）
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  useIndependentContext: true,  // 开启独立 context
  maxConcurrency: 5,
  // ... 其他配置
});
```

**优缺点对比：**

| 特性 | 共享 Context (默认) | 独立 Context |
|------|---------------------|--------------|
| 状态隔离 | ❌ 可能互相影响 | ✅ 完全隔离 |
| 并发稳定性 | ⚠️ 一般 | ✅ 高 |
| 内存占用 | ✅ 低 | ⚠️ 略高 |
| Cookies 共享 | ✅ 支持 | ❌ 不支持 |

**适用场景：**
- 并发爬取时遇到点击失效、状态混乱
- 需要完全隔离的页面环境
- 高并发场景（推荐）

**文档更新：**
- 添加"点击稳定性最佳实践"章节
- 提供 4 种点击稳定方案
- 包含完整的代码示例

