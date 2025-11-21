---
"@huaguang/block-crawler": patch
---

**修复：skipFree 使用 exact:true 导致无法匹配的问题**

**问题：**
使用 `.skipFree("FREE")` 时，即使页面上明确存在 "FREE" 文本，也无法被识别和跳过。

**根本原因：**
`getByText('FREE', { exact: true })` 要求**元素的全部文本内容**与 "FREE" 完全一致。如果元素包含其他文本（如空格、换行或其他内容），则无法匹配。

**修复方案：**
移除 `exact: true` 参数，使用 Playwright 的默认子串匹配行为：
```typescript
// 之前（无法匹配）
await target.getByText(skipFree, { exact: true }).count();

// 现在（可以匹配）
await target.getByText(skipFree).count();
```

**测试验证：**
```typescript
// 测试不同匹配方式的结果
getByText("FREE", { exact: true }): 0 个  ❌
getByText("FREE", { exact: false }): 1 个 ✅
getByText("FREE"): 1 个                    ✅ (默认行为)
```

**使用体验：**
现在 `.skipFree("FREE")` 能够正确识别和跳过包含 "FREE" 文本的 blocks：
```
📦 找到 10 个 Block

🆓 跳过 Free Block: Portfolio 1
Portfolio 9
Portfolio 10
...

⏭️  已跳过 1 个 Free Block：
   1. Portfolio 1
```

