---
"@huaguang/block-crawler": minor
---

统一 skipPageFree 和 skipBlockFree 为 skipFree

**破坏性变更：**
- 移除 `skipPageFree` 配置
- 移除 `skipBlockFree` 配置
- 新增统一的 `skipFree` 配置

**新设计：**

`skipFree` 会根据模式自动适配：

**Page 模式：**
- 检查页面是否有 Free 标志
- 有则跳过整个页面

**Block 模式：**
1. 先检查整个页面是否有 Free 标志（说明单个 block 没有 Free 标志）
2. 如果页面有 Free 标志，跳过所有 block
3. 如果页面没有 Free 标志，再检查单个 block 是否有 Free 标志

**迁移指南：**

之前：
```typescript
{
  skipPageFree: "FREE",  // Page 模式
  skipBlockFree: "FREE", // Block 模式
}
```

之后：
```typescript
{
  skipFree: "FREE"  // 自动适配两种模式
}
```

**其他变更：**
- 时间格式：`startTime` 从 ISO 格式改为本地时间格式（`2025/11/14 22:49:49`）

**优点：**
- 统一配置，简化使用
- Block 模式智能处理：页面级 Free 标志会跳过所有 block
- 更符合实际使用场景

