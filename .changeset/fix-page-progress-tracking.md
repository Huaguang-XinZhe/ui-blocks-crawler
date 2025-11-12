---
"block-crawler": patch
---

修复页面进度追踪问题并恢复 duration 字段

- 🐛 修复非 Free 页面处理完成后没有被标记到进度的严重 bug
- ✨ 恢复 `duration` 和 `startTime` 字段以记录每次运行的耗时
- 🎯 现在所有处理完成的页面（包括 Free 和非 Free）都会被正确标记到进度文件
- 📊 `duration` 显示本次运行的实际耗时（秒）

