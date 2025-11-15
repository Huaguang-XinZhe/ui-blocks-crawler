---
"@huaguang/block-crawler": patch
---

修复原子写入临时文件位置，改为使用系统临时目录

**问题：**
临时文件（`.tmp`）被放在 `.crawler/域名/` 目录下，污染了工作目录。

**修复：**
- 临时文件现在放在系统临时目录（`os.tmpdir()`）
- 使用 UUID 确保临时文件名唯一性
- 临时文件格式：`block-crawler-{UUID}.tmp`
- 写入成功后通过 `move` 原子替换到目标位置
- 失败时自动清理临时文件

