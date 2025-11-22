---
"@huaguang/block-crawler": patch
---

fix: 修复保存日志和状态保存相关问题

- 修改信号处理器日志为"正在保存状态..."（不仅保存进度）
- 修复进度保存日志重复输出3次的问题（避免重复调用 saveProgress）
- 优化 cleanup() 方法，支持静默模式，避免重复日志输出
- 优化 free.json 保存，对 blocks 和 pages 进行排序

