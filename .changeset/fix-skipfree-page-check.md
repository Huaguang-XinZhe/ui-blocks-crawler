---
"@huaguang/block-crawler": patch
---

**Bug 修复：修复 skipFree 在 block 模式下错误地跳过页面的问题**

**问题：**

当使用 `.block().skipFree()` 配置时，应该只跳过 Free Block，但实际上会错误地跳过包含 "free" 文本的整个页面。

**根本原因：**

`LinkExecutor` 中只要 `skipFree` 有值就会检查页面是否为 Free，没有区分是 page 模式还是 block 模式。

**修复内容：**

1. **添加 `skipFreeMode` 到 `ExtendedExecutionConfig`**
   - 明确标识 skipFree 是在 "page" 还是 "block" 级别生效

2. **修复 `LinkExecutor` 的判断逻辑**
   - 只在 `skipFreeMode === "page"` 时才检查页面是否为 Free
   - block 模式下不再检查页面

3. **更新配置传递逻辑**
   - `ProcessingMode` 和 `TestMode` 中同时传递 `skipFreeMode` 和 `skipFree`

**现在的正确行为：**

```typescript
// ✅ Page 模式 - 跳过 Free 页面
await crawler
    .page(async ({ page }) => { ... })
    .skipFree()  // 跳过包含 "free" 的页面
    .run();

// ✅ Block 模式 - 只跳过 Free Block（不跳过页面）
await crawler
    .block('...', async ({ block }) => { ... })
    .skipFree()  // 只跳过包含 "free" 的 Block
    .run();
```

**技术细节：**

- `ExtendedExecutionConfig` 新增 `skipFreeMode?: "page" | "block"` 字段
- `LinkExecutor` 检查条件改为：`skipFreeMode === "page" && skipFree`
- 确保 page 和 block 两种模式的 skipFree 功能互不干扰

