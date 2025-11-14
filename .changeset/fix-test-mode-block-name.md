---
"@huaguang/block-crawler": patch
---

修复测试模式中的 extractBlockName 方法

**问题：**
- 测试模式中 extractBlockName 方法实现过于简单，导致无法正确提取组件名称，总是返回 "Unknown"

**修复：**
- 将 BlockProcessor 中的完整默认逻辑移植到测试模式的 extractBlockName 方法
- 实现了完整的三级优先级：getBlockName 函数 > blockNameLocator > 默认逻辑
- 默认逻辑会检查 heading 内部子元素数量，智能提取组件名称

**文档更新：**
- 完善了 README.md 中 getBlockName 默认逻辑的说明
- 区分了 Block 模式和测试模式在错误处理上的差异

