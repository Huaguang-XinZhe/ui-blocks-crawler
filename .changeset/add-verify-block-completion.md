---
"@huaguang/block-crawler": minor
---

新增 Block 采集完整性验证功能（调试工具）

**新增配置：**

- `verifyBlockCompletion` (boolean, 默认 false)：开启 Block 采集完整性验证

**功能说明：**

在 --debug 模式下运行测试时，可以开启此功能确保组件采集完整：

1. 记录 sectionLocator 定位到的 block 总数（预期数量）
2. 记录实际采集的 block 数量
3. 如果两者不一致，调用 page.pause() 暂停
4. 打印详细的采集信息和已处理的 block 列表

**使用示例：**

```typescript
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  verifyBlockCompletion: true,  // 开启完整性验证
});

await crawler
  .blocks("[data-preview]")
  .each(async ({ block, safeOutput }) => {
    // 采集逻辑
  });
```

**适用场景：**
- 调试特定页面的采集问题
- 验证 sectionLocator 是否正确
- 确保所有组件都被正确采集

**注意：** 问题解决后，建议关闭此配置以避免不必要的暂停。

