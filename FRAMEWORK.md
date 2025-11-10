# Block Crawler Framework

基于 Playwright 的通用 Block 爬虫框架，支持受限并发、进度恢复、单页面或单 Block 处理模式。

## 功能特性

✨ **两种处理模式**
- **Block 模式**：传入 `blockLocator`，自动遍历页面中的所有 Block 并处理
- **页面模式**：不传 `blockLocator`，直接处理整个页面

🚀 **受限并发控制**
- 可配置最大并发数，避免过多请求导致封禁
- 使用 `p-limit` 实现优雅的并发控制

💾 **进度恢复机制**
- 自动保存爬取进度
- 意外中断后可从上次位置继续
- 支持进度文件重建

📊 **友好的日志输出**
- 树状结构展示爬取过程
- 实时显示进度统计
- 清晰的错误提示

## 安装

```bash
pnpm add block-crawler-framework
# 或
npm install block-crawler-framework
```

## 快速开始

### Block 处理模式

适用于需要处理页面中多个相似组件的场景。

```typescript
import { test } from "@playwright/test";
import { BlockCrawler, type BlockContext } from "block-crawler-framework";

test("爬取组件 Block", async ({ page }) => {
  // 创建爬虫实例
  const crawler = new BlockCrawler({
    startUrl: "https://example.com/components",
    tabListAriaLabel: "Categories", // 可选，分类标签的 aria-label
    maxConcurrency: 5, // 最大并发数
    outputDir: "output",
    progressFile: "progress.json",
    timeout: 2 * 60 * 1000,
    blockLocator: "xpath=//main/div/div/div", // Block 定位符
    enableProgressResume: true,
  });

  test.setTimeout(crawler.getConfig().timeout);

  // 设置 Block 处理器
  crawler.onBlock(async (context: BlockContext) => {
    const { page, block, blockName, blockPath, outputDir } = context;
    
    // 你的处理逻辑
    console.log(`处理 Block: ${blockName}`);
    
    // 例如：提取代码
    const code = await block.textContent();
    
    // 保存到文件
    await fse.outputFile(
      `${outputDir}/${blockPath}/code.txt`,
      code || ""
    );
  });

  // 运行爬虫
  await crawler.run(page);
});
```

### 页面处理模式

适用于需要处理整个页面内容的场景。

```typescript
import { test } from "@playwright/test";
import { BlockCrawler, type PageContext } from "block-crawler-framework";

test("爬取页面", async ({ page }) => {
  // 创建爬虫实例（不传 blockLocator）
  const crawler = new BlockCrawler({
    startUrl: "https://example.com/pages",
    maxConcurrency: 3,
    outputDir: "output-pages",
    progressFile: "progress-pages.json",
    enableProgressResume: true,
  });

  test.setTimeout(crawler.getConfig().timeout);

  // 设置页面处理器
  crawler.onPage(async (context: PageContext) => {
    const { page, currentPath, outputDir } = context;
    
    console.log(`处理页面: ${currentPath}`);
    
    // 你的处理逻辑
    const title = await page.title();
    const content = await page.locator("main").textContent();
    
    // 保存结果
    await fse.outputFile(
      `${outputDir}/${currentPath}/page.json`,
      JSON.stringify({ title, content }, null, 2)
    );
  });

  // 运行爬虫
  await crawler.run(page);
});
```

## API 文档

### CrawlerConfig

爬虫配置接口。

```typescript
interface CrawlerConfig {
  /** 起始 URL（必填） */
  startUrl: string;
  
  /** TabList 的 aria-label，用于定位分类标签（可选） */
  tabListAriaLabel?: string;
  
  /** 最大并发页面数量（默认：5） */
  maxConcurrency?: number;
  
  /** 输出目录（默认："output"） */
  outputDir?: string;
  
  /** 进度文件路径（默认："progress.json"） */
  progressFile?: string;
  
  /** 超时时间（毫秒）（默认：120000） */
  timeout?: number;
  
  /** Block 定位符（可选，不传则使用页面模式） */
  blockLocator?: string;
  
  /** 是否启用进度恢复功能（默认：true） */
  enableProgressResume?: boolean;
}
```

### PageContext

页面处理上下文。

```typescript
interface PageContext {
  /** 当前页面 */
  page: Page;
  
  /** 当前路径（相对路径） */
  currentPath: string;
  
  /** 输出目录 */
  outputDir: string;
}
```

### BlockContext

Block 处理上下文。

```typescript
interface BlockContext {
  /** 当前页面 */
  page: Page;
  
  /** Block 元素 */
  block: Locator;
  
  /** 当前路径（相对路径） */
  currentPath: string;
  
  /** Block 名称 */
  blockName: string;
  
  /** Block 完整路径 */
  blockPath: string;
  
  /** 输出目录 */
  outputDir: string;
}
```

### BlockCrawler

核心爬虫类。

#### 方法

##### `onPage(handler: PageHandler): this`

设置页面处理器（页面模式）。

```typescript
crawler.onPage(async (context: PageContext) => {
  // 处理逻辑
});
```

##### `onBlock(handler: BlockHandler): this`

设置 Block 处理器（Block 模式）。

```typescript
crawler.onBlock(async (context: BlockContext) => {
  // 处理逻辑
});
```

##### `async run(page: Page): Promise<void>`

运行爬虫。

```typescript
await crawler.run(page);
```

##### `getTaskProgress(): TaskProgress | undefined`

获取任务进度管理器。

##### `getConfig(): Readonly<Required<CrawlerConfig>>`

获取配置。

## 工作原理

1. **初始化**：加载或重建进度
2. **收集链接**：访问起始 URL，获取所有分类标签和集合链接
3. **并发处理**：
   - 按配置的并发数处理链接
   - 每个链接打开一个新页面
   - 调用用户定义的处理器
4. **进度保存**：定期保存进度，支持中断恢复

## 示例项目

查看 `tests/` 目录下的示例文件：

- `main-with-framework.spec.ts` - Block 处理模式完整示例
- `page-mode-example.spec.ts` - 页面处理模式示例
- `main.spec.ts` - 原始实现（参考对比）

## 最佳实践

1. **合理设置并发数**：根据目标网站的承受能力调整 `maxConcurrency`
2. **启用进度恢复**：长时间爬取任务建议启用 `enableProgressResume`
3. **错误处理**：在处理器中捕获可能的错误，避免单个失败影响整体
4. **日志记录**：在处理器中添加日志，便于调试和监控
5. **超时设置**：根据实际情况调整 `timeout`，避免过早超时

## 进阶用法

### 自定义 Block 名称获取逻辑

继承 `BlockCrawler` 并覆盖 `getBlockName` 方法：

```typescript
class CustomCrawler extends BlockCrawler {
  protected async getBlockName(block: Locator): Promise<string | null> {
    // 自定义获取逻辑
    return await block.locator(".custom-title").textContent();
  }
}
```

### 禁用进度恢复

```typescript
const crawler = new BlockCrawler({
  // ... 其他配置
  enableProgressResume: false,
});
```

### 手动清空进度

```typescript
const progress = crawler.getTaskProgress();
if (progress) {
  await progress.clear();
  await progress.deleteProgressFile();
}
```

## License

ISC

---

如果觉得这个框架有用，欢迎 star ⭐

