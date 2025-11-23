---
"@huaguang/block-crawler": patch
---

修复测试模式下的认证问题

- 测试模式（直接 `.open(url)`）现在也会执行认证流程
- 如果配置了 `.auth()`，测试模式会在访问页面前自动处理认证（复用或执行登录）
- 从 `collect.json` 中移除冗余的 `startUrl` 字段，该字段应仅在全局配置中存在

