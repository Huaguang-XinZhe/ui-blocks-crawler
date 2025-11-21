---
"@huaguang/block-crawler": minor
---

**新功能：skipFree 参数可选，默认使用忽略大小写匹配**

**1. skipFree() 参数改为可选**

现在可以不传参数，默认使用忽略大小写的 "free" 匹配：

```typescript
// 之前：必须传入参数
.skipFree("FREE")

// 现在：参数可选
.skipFree()        // 默认匹配 /free/i（忽略大小写）
.skipFree("FREE")  // 精确匹配 "FREE"
.skipFree("Pro")   // 精确匹配 "Pro"
```

**2. 添加重要注释说明**

⚠️ **关键提醒：匹配的是 DOM 中的文本内容，不是网页显示的文本**

```typescript
/**
 * Free 内容检查工具
 *
 * ⚠️ 重要说明：
 * - 匹配的是 **DOM 中的文本内容**，不是网页显示的文本
 * - CSS 可能会改变显示效果（如 text-transform、visibility 等）
 * - 建议使用浏览器开发者工具检查实际的 DOM 文本
 */
```

**为什么会有差异？**

| 场景 | DOM 文本 | 显示文本 | 原因 |
|------|---------|---------|------|
| CSS 大小写转换 | `FREE` | `free` | `text-transform: lowercase` |
| CSS 隐藏文本 | `FREE (hidden)` | `FREE` | `.hidden { display: none }` |
| HTML 实体 | `&nbsp;FREE` | ` FREE` | 空格实体 |

**3. 类型定义更新**

```typescript
// ProcessingConfig
skipFreeText?: string | null;  // null = 使用默认匹配

// ExtendedExecutionConfig
skipFree?: 
  | string                                    // 精确匹配
  | null                                      // 默认匹配 /free/i
  | ((target) => Promise<boolean>)           // 自定义逻辑
  | undefined;                                // 未启用
```

**4. 使用示例**

```typescript
// 示例 1: 默认匹配（推荐用法）
await crawler
  .block("//div[@class='card']", async ({ blockName }) => {
    console.log(blockName);
  })
  .skipFree()  // 跳过包含 "free"/"FREE"/"Free" 的 blocks
  .run();

// 示例 2: 精确匹配特定文本
await crawler
  .block("//div[@class='card']", async ({ blockName }) => {
    console.log(blockName);
  })
  .skipFree("PRO")  // 只跳过包含 "PRO" 的 blocks
  .run();

// 示例 3: 自定义判断逻辑
await crawler
  .block("//div[@class='card']", async ({ block, blockName }) => {
    console.log(blockName);
  })
  .skipFree(async (block) => {
    const text = await block.innerText();
    return text.includes("Premium") || text.includes("Enterprise");
  })
  .run();
```

**5. 迁移指南**

现有代码无需修改，完全向后兼容：

```typescript
// ✅ 旧代码仍然有效
.skipFree("FREE")

// ✅ 新代码更简洁（如果只是跳过 free 内容）
.skipFree()
```

