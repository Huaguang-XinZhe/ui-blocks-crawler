---
"@huaguang/block-crawler": patch
---

fix: 修复信号处理器异步保存问题

- 将信号处理器改为同步函数，内部使用立即执行的异步函数包装 cleanup 逻辑
- 确保在 cleanup 完成后才执行 process.exit()，避免文件未保存就退出
- 修复按 Ctrl+C 中断时 free.json 和 progress.json 未保存的问题

