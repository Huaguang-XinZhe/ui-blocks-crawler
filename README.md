# Block Crawler Framework

基于 Playwright 的通用 Block 爬虫框架，支持受限并发、进度恢复、单页面或单 Block 处理模式。

## 项目结构

```
playwright-demo/
├── src/                          # 框架源代码
│   ├── index.ts                  # 主入口文件
│   ├── types.ts                  # 类型定义
│   ├── crawler.ts                # 核心爬虫类
│   └── utils/                    # 工具类
│       ├── task-progress.ts      # 进度管理
│       └── extract-code.ts       # 代码提取
├── tests/                        # 测试和示例
│   ├── main.spec.ts              # 原始实现（参考）
│   ├── main-with-framework.spec.ts  # Block 模式示例
│   └── page-mode-example.spec.ts    # 页面模式示例
├── dist/                         # 构建输出目录
├── output/                       # 爬取结果输出目录
└── FRAMEWORK.md                  # 详细的框架文档
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建框架

```bash
pnpm build
```

### 3. 运行示例

**Block 处理模式示例：**

```bash
pnpm test tests/main-with-framework.spec.ts
```

**页面处理模式示例：**

```bash
pnpm test tests/page-mode-example.spec.ts
```

**原始实现（对比参考）：**

```bash
pnpm test tests/main.spec.ts
```

## 使用方式

### Block 处理模式

适用于需要处理页面中多个相似组件的场景。

```typescript
import { test } from "@playwright/test";
import { BlockCrawler, type BlockContext } from "./src";

test("爬取组件", async ({ page }) => {
  const crawler = new BlockCrawler({
    startUrl: "https://example.com/components",
    blockLocator: "xpath=//main/div/div/div", // 指定 Block 定位符
    maxConcurrency: 5,
  });

  crawler.onBlock(async (context: BlockContext) => {
    // 自定义处理每个 Block
    console.log(`处理: ${context.blockName}`);
  });

  await crawler.run(page);
});
```

### 页面处理模式

适用于需要处理整个页面的场景。

```typescript
import { test } from "@playwright/test";
import { BlockCrawler, type PageContext } from "./src";

test("爬取页面", async ({ page }) => {
  const crawler = new BlockCrawler({
    startUrl: "https://example.com/pages",
    // 不传 blockLocator，使用页面模式
    maxConcurrency: 3,
  });

  crawler.onPage(async (context: PageContext) => {
    // 自定义处理整个页面
    console.log(`处理: ${context.currentPath}`);
  });

  await crawler.run(page);
});
```

## 核心功能

### ✨ 双模式支持

- **Block 模式**：自动遍历页面中的 Block 元素
- **页面模式**：直接处理整个页面

### 🚀 受限并发

使用 `p-limit` 实现并发控制，避免过多请求。

```typescript
{
  maxConcurrency: 5  // 最多同时打开 5 个页面
}
```

### 💾 进度恢复

自动保存进度，意外中断后可继续。

```typescript
{
  enableProgressResume: true,
  progressFile: "progress.json"
}
```

### 📊 友好日志

清晰的树状结构展示爬取过程。

```
🚀 ===== 开始执行爬虫任务 =====
📍 目标URL: https://example.com
⚙️  最大并发数: 5
📂 输出目录: output
🎯 运行模式: Block 处理模式

📑 正在获取所有分类标签...
✅ 找到 3 个分类标签

🔄 开始遍历所有分类标签...
📌 [1/3] 处理分类标签...
   🖱️  点击标签: Components
   🔍 正在处理分类: Components
      🔗 找到 5 个集合链接
      ├─ [1/5] 📦 Authentication
      │  ├─ Path: /components/authentication
      │  └─ Count: 10 blocks
...
```

## 配置选项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `startUrl` | string | - | 起始 URL（必填） |
| `blockLocator` | string? | undefined | Block 定位符（传入则启用 Block 模式） |
| `tabListAriaLabel` | string? | undefined | 分类标签的 aria-label |
| `maxConcurrency` | number | 5 | 最大并发页面数 |
| `outputDir` | string | "output" | 输出目录 |
| `progressFile` | string | "progress.json" | 进度文件路径 |
| `timeout` | number | 120000 | 超时时间（毫秒） |
| `enableProgressResume` | boolean | true | 是否启用进度恢复 |

## API 文档

详细的 API 文档请查看 [FRAMEWORK.md](./FRAMEWORK.md)

## 开发命令

```bash
# 构建框架
pnpm build

# 监听模式构建
pnpm dev

# 运行测试
pnpm test

# UI 模式运行测试
pnpm test:ui

# 调试模式
pnpm test:debug

# 有头模式（显示浏览器）
pnpm test:headed
```

## 技术栈

- **Playwright** - 浏览器自动化
- **TypeScript** - 类型安全
- **p-limit** - 并发控制
- **fs-extra** - 文件操作
- **tsup** - 快速构建工具

## 迁移指南

### 从原始实现迁移到框架

**原始实现：**

```typescript
test("test", async ({ page }) => {
  const START_URL = "https://example.com";
  const MAX_PAGE_COUNT = 5;
  
  await page.goto(START_URL);
  // ... 大量代码
});
```

**使用框架后：**

```typescript
test("test", async ({ page }) => {
  const crawler = new BlockCrawler({
    startUrl: "https://example.com",
    maxConcurrency: 5,
    blockLocator: "xpath=//main/div/div/div",
  });

  crawler.onBlock(async (context) => {
    // 只需实现 Block 处理逻辑
  });

  await crawler.run(page);
});
```

**优势：**
- ✅ 配置与逻辑分离
- ✅ 代码更简洁（从 388 行减少到 ~50 行）
- ✅ 可复用性强
- ✅ 易于维护和扩展

## 作为 npm 包使用

构建后，可以将 `dist` 目录发布为 npm 包：

```bash
# 发布到 npm
npm publish

# 或发布到私有仓库
npm publish --registry https://your-registry.com
```

其他项目中使用：

```bash
npm install block-crawler-framework
```

```typescript
import { BlockCrawler } from "block-crawler-framework";
```

## License

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！

