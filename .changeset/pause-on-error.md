---
"@huaguang/block-crawler": minor
---

新增 pauseOnError 配置，遇到错误时自动暂停方便检查

**主要功能：**

1. **全局配置**
   - 添加 `pauseOnError` 配置项
   - 默认开启（`true`）
   - 生产环境可关闭

2. **错误捕获**
   - Block 处理错误时自动暂停
   - Page 处理错误时自动暂停
   - 打印详细的错误信息和类型

3. **国际化支持**
   - 中英文错误提示
   - 包含检查提示和解决建议

**使用方式：**

```typescript
// 调试时使用（默认开启）
const crawler = new BlockCrawler(page, {
  pauseOnError: true,  // 默认值
  // ... 其他配置
});

// 生产环境关闭
const crawler = new BlockCrawler(page, {
  pauseOnError: false,
  // ... 其他配置
});
```

**错误暂停示例：**

```
❌ 处理 block 失败: Button Component
TimeoutError: Timeout 10000ms exceeded.

🛑 检测到错误，页面已暂停方便检查
   类型: Block
   错误: Timeout 10000ms exceeded.

   💡 提示: 检查完成后，可以在全局配置中关闭 pauseOnError 以继续运行
```

**适用场景：**
- `--debug` 模式下自动检查问题
- 开发阶段快速定位错误
- 生产环境建议关闭，避免阻塞流程

