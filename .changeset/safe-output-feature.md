---
"@huaguang/block-crawler": minor
---

新增 safeOutput 函数，自动处理文件名 sanitize

**功能说明：**

在 BlockContext、TestContext、PageContext 中新增 `safeOutput` 函数，用于安全地写入文件，自动处理文件名中的非法字符（如冒号、斜杠等）。

**特性：**

1. **自动文件名清理**
   - 移除或替换文件名中的非法字符（`< > : " / \ | ? *` 等）
   - 处理控制字符和空格
   - 限制文件名长度，确保跨平台兼容

2. **智能默认路径**
   - **Block 模式**：默认路径 `${outputDir}/${blockPath}.tsx`
   - **Test 模式**：默认路径 `${outputDir}/test-${blockName}.tsx`
   - **Page 模式**：需要显式传入 `filePath`

3. **路径 sanitize**
   - 所有路径（包括默认路径和用户传入的）都会自动 sanitize
   - 支持相对路径和绝对路径
   - 自动处理路径中的每个部分（目录名和文件名）

**使用示例：**

```typescript
// Test 模式 - 使用默认路径（自动 sanitize）
await crawler
  .test("https://example.com/page", "[data-preview]", 1)
  .run(async ({ section, safeOutput }) => {
    const code = await extractCode(section);
    await safeOutput(code); // 自动处理 "Step 1: Forgot password" 这样的文件名
  });

// Block 模式 - 使用默认路径
await crawler
  .blocks("[data-preview]")
  .each(async ({ block, safeOutput }) => {
    const code = await extractCode(block);
    await safeOutput(code); // 自动处理 blockPath 中的特殊字符
  });

// 自定义路径（也会自动 sanitize）
await safeOutput(code, "custom/path/to/file.tsx");
```

**解决的问题：**

- ✅ 防止文件名包含特殊字符（如 `:`、`/`）导致文件写入失败
- ✅ 自动处理组件名中的空格和特殊字符
- ✅ 确保跨平台兼容性（Windows、macOS、Linux）

