---
"@huaguang/block-crawler": minor
---

新增文件名映射功能，记录 sanitize 前后的对应关系

**功能说明：**

在 `.crawler/域名/filename-mapping.json` 文件中维护文件名映射，记录 sanitize 前后的对应关系，方便从 sanitize 后的文件名反推出原始组件名。

**特性：**

1. **自动映射记录**
   - 当文件名被 sanitize 改变时自动记录
   - 仅在文件名发生变化时记录（避免冗余）
   - 支持 Block、Test、Page 三种模式

2. **映射文件位置**
   - 存储在 `.crawler/域名/filename-mapping.json`
   - 与 `progress.json` 和 `meta.json` 在同一目录
   - 使用原子写入确保数据一致性

3. **工具函数**
   - `FilenameMappingManager.getOriginal()` - 从 sanitize 后的文件名获取原始文件名
   - `FilenameMappingManager.load()` - 加载所有映射
   - 支持实例方法和静态方法

**使用示例：**

```typescript
import { FilenameMappingManager } from "@huaguang/block-crawler";

// 从 sanitize 后的文件名获取原始文件名
const original = await FilenameMappingManager.getOriginal(
  ".crawler/www.untitledui.com",
  "test-Step_1__Forgot_password.tsx"
);
// 返回: "test-Step 1: Forgot password.tsx"

// 加载所有映射
const mapping = await FilenameMappingManager.load(".crawler/www.untitledui.com");
// 返回: { 
//   "test-Step_1__Forgot_password.tsx": "test-Step 1: Forgot password.tsx",
//   ...
// }
```

**解决的问题：**

- ✅ 当组件名包含特殊字符（如 `"Step 1: Forgot password"`）时，sanitize 后的文件名会变成 `"Step_1__Forgot_password"`，丢失了原始信息
- ✅ 通过映射文件可以轻松从 sanitize 后的文件名反推出原始组件名
- ✅ 方便后续处理和分析，保持组件名的语义信息

