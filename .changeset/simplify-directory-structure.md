---
"ui-blocks-crawler": minor
---

重构目录结构，简化配置，移除配置文件功能

**重大变更：**

- ❌ **移除配置文件功能** - 删除 `saveConfigFile()` 和 `fromConfigFile()` 方法
- ✅ **简化目录结构** - 使用域名子目录，无哈希
  - 进度文件：`.crawler/域名/progress.json`
  - 输出目录：`output/域名/`
- 🔄 **重命名配置项** - `configDir` → `stateDir`（状态目录）

**新的目录结构：**

```
project/
├── .crawler/              # 状态目录 (stateDir)
│   ├── example-com/       # 域名子目录
│   │   └── progress.json  # 进度文件
│   └── site-a-com/
│       └── progress.json
└── output/               # 输出目录 (outputDir)
    ├── example-com/      # 域名子目录
    └── site-a-com/
```

**优势：**

- ✨ 更简洁 - 直接使用域名，无哈希
- 📁 更直观 - 目录结构一目了然
- 🎯 更专注 - 状态目录专注于进度和元信息

**迁移指南：**

1. 将 `configDir` 改为 `stateDir`（可选，默认值相同）
2. 删除所有 `saveConfigFile()` 和 `fromConfigFile()` 调用
3. 旧的进度文件会自动失效，重新运行即可生成新的

**API 变更：**

```typescript
// ❌ 已删除
await crawler.saveConfigFile();
const crawler = await BlockCrawler.fromConfigFile();

// ✅ 继续使用
const crawler = new BlockCrawler({ startUrl: "..." });
crawler.outputDir;  // 获取输出目录
crawler.stateDir;   // 获取状态目录 (原 configDir)
crawler.hostname;   // 新增：获取域名
```

