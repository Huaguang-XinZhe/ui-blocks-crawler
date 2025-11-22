---
"@huaguang/block-crawler": patch
---

fix: 即时添加 Free Block 到记录中

- 在检测到 Free Block 时立即调用 freeRecorder.addFreeBlock()，而不是等到页面处理完成后再添加
- 确保在按 Ctrl+C 中断时，所有已检测到的 Free Block 都能被正确记录
- 在停止或完成时统一保存 free.json 文件

