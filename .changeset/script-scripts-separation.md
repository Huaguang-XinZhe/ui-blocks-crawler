---
"@huaguang/block-crawler": minor
---

重构脚本注入配置：分离单个和多个脚本

**破坏性变更：**
- `scriptInjection.scripts` 从必填变为可选
- 新增 `scriptInjection.script` 字段用于单个脚本

**新设计：**
- `script`（单数）：单个脚本，从 `.crawler/域名/` 根目录读取
- `scripts`（复数）：多个脚本，从 `.crawler/域名/scripts/` 子目录读取
- 两者互斥，必须选择其中一个

**迁移指南：**

之前：
```typescript
scriptInjection: {
  scripts: ['custom-script.js']
}
```

之后（单个脚本）：
```typescript
scriptInjection: {
  script: 'custom-script.js'  // 从 .crawler/域名/ 读取
}
```

之后（多个脚本）：
```typescript
scriptInjection: {
  scripts: ['utils.js', 'helpers.js']  // 从 .crawler/域名/scripts/ 读取
}
```

**配置验证：**
- 增加验证逻辑，防止 `script` 和 `scripts` 同时设置
- 确保至少设置其中一个
- 提供清晰的错误提示和示例

**优点：**
- 单个脚本更方便，直接放在根目录
- 多个脚本更有组织，统一放在 scripts 子目录
- 语义更清晰，单复数分明

