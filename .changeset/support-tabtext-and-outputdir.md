---
"@huaguang/block-crawler": minor
---

## ✨ 新增功能

1. **支持 TabSectionLocator 的 tabText 参数**
   - 🎯 新增 `TabSectionLocator` 类型，支持在 `tabSection` 回调中接收 `tabText` 参数
   - 📖 使用示例：
     ```typescript
     .tabSection(async (page, tabText) => {
         return page.getByRole("tabpanel", { name: tabText });
     })
     ```
   - ⚡ `SectionExtractor` 自动传递 `tabText` 给自定义函数
   - 🔧 向后兼容：仍支持字符串模板 `"{tabText}"`

2. **暴露 outputDir 属性**
   - 📂 添加 `BlockCrawler.outputDir` getter 属性
   - 💡 可直接访问输出目录路径：`crawler.outputDir`
   - 📝 便于在测试代码中使用输出路径

## 🔧 技术改进

- 更新 `CollectionConfig.tabSectionConfig` 类型为 `TabSectionLocator`
- 优化 `SectionExtractor.extractFromTabs()` 方法，传递 `tabText` 参数
- 添加类型导出：`TabSectionLocator` 可在用户代码中使用

