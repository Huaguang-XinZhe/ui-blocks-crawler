---
"@huaguang/block-crawler": patch
---

重构：抽象通用的信号处理器

- 创建 `SignalHandler` 通用类，封装 SIGINT/SIGTERM 信号处理逻辑
- `ProcessingMode` 和 `TestMode` 现在使用统一的 `SignalHandler`
- 消除重复代码，提高可维护性
- 信号处理行为保持不变，但代码更简洁和可复用

