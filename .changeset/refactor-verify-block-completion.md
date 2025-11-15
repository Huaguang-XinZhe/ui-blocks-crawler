---
"@huaguang/block-crawler": minor
---

重构 Block 采集完整性验证功能，移至 blocks() 方法配置

**主要变更：**

1. **配置位置调整**
   - 从全局配置移至 `blocks()` 方法的第二个参数
   - 更符合语义，仅在 Block 模式下使用

2. **默认开启验证**
   - `verifyBlockCompletion` 默认值改为 `true`
   - 开发/调试时自动验证，生产环境手动关闭

3. **国际化支持**
   - 添加中英文日志输出
   - 验证信息支持完整的 i18n

**使用方式：**

```typescript
// 默认开启验证（推荐）
await crawler.blocks("[data-preview]").each(async ({ block }) => {
  // ...
});

// 生产环境关闭
await crawler.blocks("[data-preview]", { verifyBlockCompletion: false }).each(async ({ block }) => {
  // ...
});
```

**破坏性变更：**

如果之前在全局配置中使用了 `verifyBlockCompletion`，需要迁移到 `blocks()` 方法：

```typescript
// 之前（不再支持）
const crawler = new BlockCrawler(page, {
  verifyBlockCompletion: true
});

// 现在
const crawler = new BlockCrawler(page, {
  // ...
});
await crawler.blocks("[data-preview]", { verifyBlockCompletion: true });
```

