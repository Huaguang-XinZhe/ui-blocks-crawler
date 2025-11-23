# Block Crawler Framework

基于 Playwright 的通用 Block 爬虫框架，支持受限并发、进度恢复、灵活的链式 API。

## ✨ 特性

🎯 **灵活的链式 API** - 简洁直观的链式调用，易于使用  
🚀 **受限并发** - 可配置并发数，避免封禁  
💾 **进度恢复** - 支持中断后继续爬取，自动跳过已完成任务  
⚙️ **完全配置化** - 所有参数可配置，支持函数覆盖  
📦 **自动化管理** - 自动生成进度文件和输出目录  
🔧 **灵活扩展** - 支持配置函数覆盖，无需继承子类  
💉 **脚本注入** - 支持在并发页面中注入自定义 JavaScript 脚本  
🌍 **国际化支持** - 完整的中英文日志输出，可通过 locale 配置切换  
⚡ **渐进式加载** - 支持懒加载页面的边定位边处理，显著提升爬取效率  
🎨 **自动处理** - 自动处理文件 tabs、代码提取、变种切换等常见场景

## 📦 安装

```bash
npm install @huaguang/block-crawler
# 或
pnpm add @huaguang/block-crawler
# 或
yarn add @huaguang/block-crawler
```

## 🚀 快速开始

```typescript
import { test } from "@playwright/test";
import { BlockCrawler } from "@huaguang/block-crawler";

test("快速开始", async ({ page }) => {
  const crawler = new BlockCrawler(page, {
    startUrl: "https://example.com/blocks",
  });

  await crawler
    .open("https://example.com/blocks/portfolio")
    .block("[data-preview]", async ({ block, safeOutput, clickCode }) => {
      await clickCode(); // 点击 Code 按钮
      const code = await block.locator("pre").textContent();
      await safeOutput(code ?? ""); // 安全输出文件
    })
    .run();
});
```

## 📖 核心概念

### 链式 API

BlockCrawler 提供简洁的链式 API：

```
new BlockCrawler() → .open() → .block() → .run()
```

**可选步骤：**
- `.auth()` - 认证登录
- `.page()` - 页面级处理
- `.skipFree()` - 跳过免费项目

## 🔧 API 参考

### 1. 初始化

```typescript
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  locale: "zh", // 'zh' | 'en'，默认 'zh'
  maxConcurrency: 5,
  skipFree: "FREE", // 跳过包含 "FREE" 文本的 block
  enableProgressResume: true, // 启用进度恢复，默认 true
});
```

**核心配置项：**

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `startUrl` | `string` | - | 起始 URL（必填） |
| `locale` | `'zh' \| 'en'` | `'zh'` | 日志语言 |
| `maxConcurrency` | `number` | `5` | 最大并发数 |
| `outputDir` | `string` | `"output"` | 输出目录 |
| `stateDir` | `string` | `".crawler"` | 状态目录 |
| `skipFree` | `string \| boolean` | `false` | 跳过免费项目 |
| `enableProgressResume` | `boolean` | `true` | 启用进度恢复 |
| `useIndependentContext` | `boolean` | `false` | 使用独立浏览器上下文 |
| `pauseOnError` | `boolean` | `true` | 遇到错误时暂停 |

### 2. 认证（可选）

#### 方式一：手动登录

```typescript
await crawler
  .auth("https://example.com/login") // 访问登录页，暂停等待手动登录
  // ... 后续步骤
```

#### 方式二：自动登录

```typescript
await crawler
  .auth(async (page) => {
    await page.goto("https://example.com/login");
    await page.fill("#username", "user");
    await page.fill("#password", "pass");
    await page.click("button[type=submit]");
    await page.waitForURL("**/dashboard");
  })
  // ... 后续步骤
```

**特性：**
- ✅ 自动保存 cookies 到 `.crawler/域名/auth.json`
- ✅ 下次运行自动复用，无需重新登录

### 3. 打开页面

```typescript
await crawler
  .open("https://example.com/components/buttons")
  // ... 处理逻辑
```

**指定等待条件：**

```typescript
.open("https://example.com/components/buttons", "networkidle")
```

**等待选项：** `"load"` | `"domcontentloaded"` | `"networkidle"` | `"commit"`

### 4. 页面处理（可选）

在处理 Block 之前，先处理整个页面。

#### 方式一：自定义处理

```typescript
await crawler
  .open("https://example.com/components")
  .page(async ({ currentPage, clickAndVerify }) => {
    // 点击切换视图
    const listView = currentPage.getByRole("tab", { name: "List view" });
    if (await listView.isVisible({ timeout: 0 })) {
      await clickAndVerify(listView);
    }
  })
  .block(/* ... */)
  .run();
```

#### 方式二：自动滚动

```typescript
await crawler
  .open("https://example.com/components")
  .page({
    autoScroll: true, // 启用自动滚动，默认 step=1000, interval=500
  })
  .block(/* ... */)
  .run();
```

**自定义滚动参数：**

```typescript
.page({
  autoScroll: { step: 500, interval: 300 }
})
```

**PageContext 参数：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `currentPage` | `Page` | 当前页面实例 |
| `currentPath` | `string` | 当前 URL 路径 |
| `outputDir` | `string` | 输出目录 |
| `safeOutput` | `Function` | 安全输出函数 |
| `clickAndVerify` | `Function` | 智能点击函数 |
| `clickCode` | `Function` | 点击 Code 按钮 |

### 5. Block 处理（核心）

#### 方式一：自定义处理函数

```typescript
await crawler
  .open("https://example.com/components")
  .block("[data-preview]", async ({ block, blockName, safeOutput, clickCode }) => {
    // 点击 Code 按钮
    await clickCode();
    // 提取代码
    const code = await block.locator("pre").textContent();
    // 输出文件（默认路径：outputDir/页面路径/blockName.tsx）
    await safeOutput(code ?? "");
  })
  .run();
```

**BlockContext 参数：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `currentPage` | `Page` | 当前页面实例 |
| `block` | `Locator` | Block 元素 |
| `blockPath` | `string` | Block 路径（页面路径/blockName） |
| `blockName` | `string` | Block 名称 |
| `outputDir` | `string` | 输出目录 |
| `safeOutput` | `Function` | 安全输出函数 |
| `clickAndVerify` | `Function` | 智能点击函数 |
| `clickCode` | `Function` | 点击 Code 按钮 |

#### 方式二：自动配置（BlockAutoConfig）

框架提供自动处理文件 tabs、代码提取、变种切换等常见场景：

```typescript
await crawler
  .open("https://example.com/components")
  .block("[data-preview]", {
    // 文件 Tabs（框架会自动点击每个 tab 并提取代码）
    fileTabs: (block) => 
      block
        .getByRole("tablist", { name: "Select active file" })
        .getByRole("tab")
        .all(),
    
    // 代码提取函数（可选，默认从 pre 获取 textContent）
    extractCode: async (codeBlock) => {
      const pre = codeBlock.locator("pre").last();
      await pre.getByText("export").first().waitFor();
      return (await pre.textContent()) ?? "";
    },
    
    // 变种配置（如 TypeScript/JavaScript 切换）
    variants: [
      {
        buttonLocator: (block) =>
          block.getByRole("button", { name: "TypeScript Change theme" }),
        nameMapping: { TypeScript: "ts", JavaScript: "js" },
        // waitTime: 500, // 可选，切换后等待时间（默认 500ms）
      },
    ],
  })
  .run();
```

**BlockAutoConfig 配置项：**

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `fileTabs` | `Locator[] \| (block: Locator) => Promise<Locator[]>` | 文件 Tab 定位符或函数 |
| `extractCode` | `(codeBlock: Locator) => Promise<string>` | 代码提取函数（可选） |
| `variants` | `VariantConfig[]` | 变种配置列表（可选） |

**VariantConfig 配置项：**

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `buttonLocator` | `Locator \| (block: Locator) => Locator` | 变种按钮定位符 |
| `nameMapping` | `Record<string, string>` | 名称映射（如 `TypeScript` → `ts`） |
| `waitTime` | `number` | 切换后等待时间（可选，默认 500ms） |

#### 方式三：渐进式加载

适用于懒加载页面（如无限滚动），边滚动边处理：

```typescript
await crawler
  .open("https://example.com/lazy-load-page")
  .block(
    '//main/div[contains(@class, "component")]',
    true, // 第二个参数为 true 启用渐进式加载
    {
      fileTabs: (block) => 
        block.locator(".tabs").getByRole("button").all(),
    }
  )
  .run();
```

**工作原理：**
1. 定位当前可见的所有 block
2. 滚动到批次最后一个 block 的底部触发加载
3. 立即处理当前批次的所有 block（动态批次大小）
4. 重新定位，循环直到没有新 block

**对比：**

| 模式 | 滚动方式 | 处理方式 | 适用场景 |
|------|---------|---------|----------|
| 传统模式（`.page({ autoScroll: true })`） | 先完全滚动到底部 | 一次性定位所有 block | 静态页面 |
| 渐进式模式（`.block(selector, true, ...)`） | 边滚动边处理 | 分批定位和处理 | 懒加载页面 |

**渐进式加载也支持自定义处理函数：**

```typescript
.block(
  '//main/div',
  true, // 启用渐进式加载
  async ({ block, safeOutput, clickCode }) => {
    await clickCode();
    const code = await block.locator("pre").textContent();
    await safeOutput(code ?? "");
  }
)
```

### 6. 跳过免费项目

```typescript
await crawler
  .open("https://example.com/components")
  .block("[data-preview]", { /* ... */ })
  .skipFree() // 跳过包含 "free" 文本的 block（忽略大小写）
  .run();
```

**自定义匹配文本：**

```typescript
.skipFree("FREE") // 跳过包含 "FREE" 的 block
.skipFree("Pro")  // 跳过包含 "Pro" 的 block
```

**或者在初始化时配置：**

```typescript
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  skipFree: "FREE", // 精确匹配 "FREE"
  // skipFree: true, // 使用默认（匹配 "free"，忽略大小写）
});

await crawler
  .open("https://example.com/components")
  .block("[data-preview]", { /* ... */ })
  .run(); // 不需要再调用 .skipFree()
```

### 7. 执行

```typescript
await crawler
  // ... 链式调用
  .run();
```

## 🎯 完整示例

### 示例 1：基础使用

```typescript
import { test } from "@playwright/test";
import { BlockCrawler } from "@huaguang/block-crawler";

test("基础使用", async ({ page }) => {
  const crawler = new BlockCrawler(page, {
    startUrl: "https://example.com/blocks",
  });

  await crawler
    .open("https://example.com/blocks/portfolio")
    .block("[data-preview]", async ({ block, safeOutput, clickCode }) => {
      await clickCode();
      const code = await block.locator("pre").textContent();
      await safeOutput(code ?? "");
    })
    .run();
});
```

### 示例 2：使用自动配置

```typescript
test("自动配置", async ({ page }) => {
  const crawler = new BlockCrawler(page, {
    startUrl: "https://pro.example.com/components",
  });

  await crawler
    .open("https://pro.example.com/components/application/navbars")
    .block("//main/div/div/div", {
      fileTabs: (block) =>
        block
          .getByRole("tablist", { name: "Select active file" })
          .getByRole("tab")
          .all(),
      extractCode: async (codeBlock) => {
        const pre = codeBlock.locator("pre").last();
        await pre.getByText("export").first().waitFor();
        const rawText = (await pre.textContent()) ?? "";
        return rawText.replace(/Show more/, "").trim();
      },
      variants: [
        {
          buttonLocator: (block) =>
            block.getByRole("button", { name: "TypeScript Change theme" }),
          nameMapping: { TypeScript: "ts", JavaScript: "js" },
        },
      ],
    })
    .skipFree()
    .run();
});
```

### 示例 3：带认证和渐进式加载

```typescript
test("认证 + 渐进式加载", async ({ page }) => {
  const crawler = new BlockCrawler(page, {
    startUrl: "https://example.com/blocks",
    skipFree: "FREE",
  });

  await crawler
    .auth("https://example.com/auth/login") // 手动登录
    .open("https://example.com/blocks/marketing-ui/portfolio")
    .block(
      '//main/div/div[3]/div/div/div[contains(@class, "flex")]',
      true, // 启用渐进式加载
      {
        fileTabs: (block) =>
          block.locator("//div[2]/div[2]/div[1]/div").getByRole("button").all(),
      }
    )
    .skipFree() // 跳过免费 block
    .run();
});
```

### 示例 4：页面级处理

```typescript
test("页面级处理", async ({ page }) => {
  const crawler = new BlockCrawler(page, {
    startUrl: "https://example.com/components",
  });

  await crawler
    .open("https://example.com/components", "networkidle")
    .page(async ({ currentPage, clickAndVerify }) => {
      // 点击切换到 List view
      const listView = currentPage.getByRole("tab", { name: "List view" });
      if (await listView.isVisible({ timeout: 0 })) {
        await clickAndVerify(listView);
      }
    })
    .block("[data-preview]", async ({ block, safeOutput, clickCode }) => {
      await clickCode();
      const code = await block.locator("pre").textContent();
      await safeOutput(code ?? "");
    })
    .run();
});
```

## 🛠️ 高级功能

### 智能点击（clickAndVerify）

自动验证点击效果并重试，确保点击成功：

```typescript
// Tab 元素自动验证 aria-selected
await clickAndVerify(page.getByRole('tab', { name: 'Code' }));

// 自定义验证逻辑
await clickAndVerify(
  page.getByRole('button', { name: 'Expand' }),
  async () => await page.locator('.content').isVisible(),
  { timeout: 5000, retries: 3 }
);
```

**特性：**
- ✅ Tab 元素自动验证 `aria-selected="true"`
- ✅ 失败自动重试（默认 3 次）
- ✅ 调试模式自动暂停供检查

### 安全文件输出（safeOutput）

自动处理文件名中的非法字符：

```typescript
// 使用默认路径
await safeOutput(code); // ${outputDir}/${blockPath}.tsx

// 自定义路径
await safeOutput(code, "custom/path/file.tsx");
```

**特性：**
- ✅ 自动清理文件名（移除 `< > : " / \ | ? *` 等）
- ✅ 自动记录映射到 `.crawler/域名/filename-mapping.json`
- ✅ 跨平台兼容

### 脚本注入

在并发页面中注入自定义 JavaScript 脚本：

```typescript
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  scriptInjection: {
    script: 'custom-script.js', // 从 .crawler/域名/ 读取
    timing: 'afterPageLoad', // 'beforePageLoad' | 'afterPageLoad'
  },
});
```

**支持油猴脚本：**

```javascript
// .crawler/example.com/custom-script.js
// ==UserScript==
// @name         修改链接颜色
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
  a { color: red !important; }
`);
```

### 进度恢复

自动保存和恢复爬取进度：

```typescript
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  enableProgressResume: true, // 默认 true
});
```

**特性：**
- ✅ Block 级进度记录
- ✅ 自动从输出目录重建进度
- ✅ 中断恢复

**目录结构：**

```
project/
├── .crawler/              # 状态目录
│   └── example.com/
│       ├── progress.json  # 进度文件
│       ├── meta.json      # 元信息
│       ├── auth.json      # 认证 cookies
│       └── filename-mapping.json  # 文件名映射
└── output/               # 输出目录
    └── example.com/
        ├── component-1/
        └── component-2/
```

### 独立浏览器上下文

高并发场景下完全隔离各页面状态：

```typescript
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  useIndependentContext: true, // 开启独立 context
  maxConcurrency: 5,
});
```

**优点：**
- ✅ 完全隔离，避免状态污染
- ✅ 点击、输入等操作更稳定

**缺点：**
- ⚠️ 内存占用略高
- ⚠️ 无法共享 cookies/storage

### 调试模式

遇到错误时自动暂停：

```typescript
const crawler = new BlockCrawler(page, {
  startUrl: "https://example.com/components",
  pauseOnError: true, // 默认 true
});
```

**运行方式：**

```bash
# Debug 模式（遇到错误会自动暂停）
pnpm test:debug tests/example.spec.ts

# 非 Debug 模式（只输出提示）
pnpm test tests/example.spec.ts
```

## ⚙️ 全部配置选项

```typescript
interface BlockCrawlerConfig {
  // ===== 基础配置 =====
  startUrl: string;                    // 起始 URL（必填）
  locale?: 'zh' | 'en';                // 日志语言，默认 'zh'
  outputDir?: string;                  // 输出目录，默认 'output'
  stateDir?: string;                   // 状态目录，默认 '.crawler'
  
  // ===== 并发配置 =====
  maxConcurrency?: number;             // 最大并发数，默认 5
  useIndependentContext?: boolean;     // 使用独立上下文，默认 false
  
  // ===== 进度配置 =====
  enableProgressResume?: boolean;      // 启用进度恢复，默认 true
  
  // ===== 跳过配置 =====
  skipFree?: string | boolean;         // 跳过免费项目，默认 false
  
  // ===== 调试配置 =====
  pauseOnError?: boolean;              // 遇到错误暂停，默认 true
  
  // ===== Block 配置 =====
  blockNameLocator?: string;           // Block 名称定位符
  getAllBlocks?: (page: Page) => Promise<Locator[]>;
  getBlockName?: (block: Locator) => Promise<string | null>;
  
  // ===== 等待配置 =====
  startUrlWaitOptions?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    timeout?: number;
  };
  collectionLinkWaitOptions?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    timeout?: number;
  };
  
  // ===== 脚本注入 =====
  scriptInjection?: {
    script?: string;                   // 单个脚本文件名
    scripts?: string[];                // 多个脚本文件名
    timing?: 'beforePageLoad' | 'afterPageLoad';
  };
  
  // ===== 高级配置（函数覆盖） =====
  // 用于收集阶段（如需要并发处理多个页面）
  tabListAriaLabel?: string;           // Tab 列表的 aria-label
  getTabSection?: (page: Page, tabText: string) => Locator;
  getAllTabTexts?: (page: Page) => Promise<string[]>;
  collectionNameLocator?: string;      // 集合名称定位符
  collectionCountLocator?: string;     // 集合数量定位符
  extractBlockCount?: (text: string | null) => number;
}
```

## 🛠️ 开发命令

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

## 📦 版本管理

本项目使用 [Changesets](https://github.com/changesets/changesets) 进行版本管理。

```bash
# 1. 创建 changeset
pnpm changeset

# 2. 应用 changesets（更新版本号和 CHANGELOG）
pnpm changeset version

# 3. 发布到 npm
pnpm release
```

## 🔧 技术栈

- **Playwright** - 浏览器自动化
- **TypeScript** - 类型安全
- **p-limit** - 并发控制
- **fs-extra** - 文件操作
- **tsup** - 快速构建工具
- **changesets** - 版本管理

## 📄 License

ISC

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 链接

- [npm 包](https://www.npmjs.com/package/@huaguang/block-crawler)
- [GitHub 仓库](https://github.com/Huaguang-XinZhe/block-crawler)
- [更新日志](./CHANGELOG.md)
