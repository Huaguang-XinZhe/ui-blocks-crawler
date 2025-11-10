---
"block-crawler-framework": minor
---

🎉 首次发布 Block Crawler Framework

### 核心功能

- ✨ 双模式支持：Block 处理模式和页面处理模式
- 🚀 受限并发控制：可配置最大并发数
- 💾 进度恢复机制：支持中断后继续爬取
- ⚙️ 完全配置化：所有参数可通过配置对象设置
- 🔧 易于扩展：提供 protected 方法供子类覆盖

### 主要特性

- 支持通过 `blockLocator` 和 `blockNameLocator` 自定义定位逻辑
- 提供 `getAllBlocks()` 和 `getBlockName()` 方法供子类覆盖
- 自动管理并发和进度，简化爬虫开发
- 完整的 TypeScript 类型支持
- 基于 Playwright 的现代化爬虫解决方案

