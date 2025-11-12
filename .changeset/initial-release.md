---
"block-crawler": minor
---

🎉 初始发布 block-crawler

**重大变更：**

- 🔄 **包名变更** - 从 `ui-blocks-crawler` 更名为 `block-crawler`
- 🔄 **版本重置** - 从 2.4.0 重置为 0.1.0（开发版本）
- 📋 **版本策略** - 保持 major 版本为 0，直到项目完全稳定

**核心特性：**

- 🎯 **双模式支持** - Block 模式和页面模式自由切换
- 🚀 **受限并发** - 可配置并发数，避免封禁
- 💾 **进度恢复** - 支持中断后继续爬取
- ⚙️ **完全配置化** - 所有参数可配置，支持函数覆盖
- 🏗️ **模块化架构** - 单一职责原则，易于维护
- 📦 **自动化管理** - 自动生成域名子目录

**模块化架构：**

- ConfigManager - 配置生成和验证
- TabProcessor - Tab 处理
- LinkCollector - 链接收集
- BlockProcessor - Block 处理
- PageProcessor - 页面处理
- CrawlerOrchestrator - 主协调器

**自动文件管理：**

- 进度文件：`.crawler/域名/progress.json`
- 输出目录：`output/域名/`

**灵活配置：**

支持通过函数配置覆盖默认行为：
- `getAllTabSections` - 直接获取所有 sections
- `extractTabTextFromSection` - 自定义提取 tab 文本
- `getTabSection` - 自定义获取 tab section
- `getAllBlocks` - 自定义获取 Block 元素
- `getBlockName` - 自定义获取 Block 名称
- `extractBlockCount` - 自定义提取数量

**配置冲突检查：**

框架会自动检查配置冲突并提供清晰的错误提示。

**项目规则：**

- 📝 新增 `.cursorrules` 文件，规范 Changesets 使用
- ⚠️ 版本策略：始终保持 0.x.x 直到正式稳定

