---
"@huaguang/block-crawler": patch
---

**Bug 修复：修复 skipFree() 默认模式不工作的问题**

**问题：**

调用 `.skipFree()` 不传参数时，应该使用默认匹配 `/free/i`，但实际上没有跳过任何 Free 内容。

**根本原因：**

- 默认值使用 `null` 表示，但在配置传递时，`null` 是 falsy 值
- `null ? null : undefined` 会返回 `undefined`，导致 skipFree 功能被禁用

**修复内容：**

1. **将默认值从 `null` 改为 `"default"`**
   - 更语义化，避免 `null` 的歧义
   - 类型定义更简洁（不需要 `| null`）

2. **修复配置传递逻辑**
   - 确保 `skipFree` 根据 `skipFreeMode` 正确传递：
     - `skipFree()` 在 `page()` 后 → 跳过 Free 页面
     - `skipFree()` 在 `block()` 后 → 跳过 Free Block

**使用方式（不变）：**

```typescript
// ✅ Block 模式
await crawler
    .block('...', async ({ block }) => { ... })
    .skipFree()  // 现在能正常工作了！
    .run();

// ✅ Page 模式
await crawler
    .page(async ({ page }) => { ... })
    .skipFree()  // 跳过 Free 页面
    .run();
```

**技术细节：**

- 内部实现：`.skipFree()` → `skipFreeText = "default"`
- Free 检查器：`"default"` → 使用 `/free/i` 正则匹配（忽略大小写）
- 类型定义：移除了 `| null`，使用普通 `string` 类型即可

