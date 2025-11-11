---
"ui-blocks-crawler": minor
---

新增 `extractBlockCount` 配置选项，支持自定义 Block 数量提取逻辑

**新增功能：**

- ✨ 新增 `extractBlockCount` 配置选项，允许自定义从文本中提取 Block 数量的逻辑
- 📝 支持处理复杂的数量文本格式（如 "1 component + 6 variants"）
- 🔧 如果配置了自定义函数，将优先使用；否则使用默认的数字匹配逻辑

**使用示例：**

```typescript
const crawler = new BlockCrawler({
  startUrl: "https://example.com",
  
  // 自定义提取逻辑，处理 "1 component + 6 variants" 格式
  extractBlockCount: (text) => {
    const match = text?.match(/(\d+)\s*component.*?(\d+)\s*variant/);
    if (match) {
      return parseInt(match[1] ?? "0") + parseInt(match[2] ?? "0");
    }
    // 回退到简单数字匹配
    const simpleMatch = text?.match(/\d+/);
    return simpleMatch ? parseInt(simpleMatch[0] ?? "0") : 0;
  },
  
  // ... 其他配置
});
```

**改进点：**

- 🎯 更灵活地处理不同网站的数量文本格式
- 📊 支持多数字组合计算（如 component + variant）
- 🔄 保持向后兼容，默认行为不变

