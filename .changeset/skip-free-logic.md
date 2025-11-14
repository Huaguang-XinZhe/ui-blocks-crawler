---
"@huanguang/block-crawler": patch
---

重构 Free 跳过逻辑

**行为变更：**
- `skipPageFree`: 检测到 Free 页面时，**直接跳过** `each` handler 执行（之前会执行 handler 但传入 `isFree: true`）
- `skipBlockFree`: 检测到 Free Block 时，**直接跳过** `each` handler 执行（之前会执行 handler 但传入 `isFree: true`）
- 测试模式：**忽略** `skipPageFree` 和 `skipBlockFree` 配置（因为测试模式不使用这些 processor）

**接口变更：**
- **移除** `PageContext.isFree` 字段
- **移除** `BlockContext.isFree` 字段
- 保留 `FreeItem.isFree`（用于元数据记录）

**迁移指南：**

之前的逻辑：
```typescript
await crawler.blocks('[data-preview]').each(async ({ block, isFree }) => {
  if (isFree) {
    console.log('跳过 Free Block');
    return;
  }
  // 处理 Block
});
```

之后的逻辑：
```typescript
await crawler.blocks('[data-preview]').each(async ({ block }) => {
  // Free Block 不会进入这里，已被自动跳过
  // 直接处理 Block
});
```

**优点：**
- 更简洁：用户无需在 handler 中判断 `isFree`
- 更高效：Free 内容在进入 handler 前就被过滤
- 更直观：配置的 skip 选项真正"跳过"了处理逻辑

