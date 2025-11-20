---
"@huaguang/block-crawler": minor
---

新增自动登录功能，简化认证配置

**新增功能：**

1. **自动登录处理器** - 支持常见登录场景的自动化
   - 自动检测登录表单（2 个 textbox + 1 个 sign in button）
   - 自动填写凭据（从 `.env` 文件读取）
   - 自动提交并等待跳转
   - 超出条件自动报错，提示使用自定义 handler

2. **auth API 支持三种用法：**
   ```typescript
   // 用法 1: 只传登录 URL（最简单）
   .auth("https://example.com/login")
   
   // 用法 2: 配置对象（可指定跳转 URL）
   .auth({
     loginUrl: "https://example.com/login",
     redirectUrl: "https://example.com/*"
   })
   
   // 用法 3: 自定义处理（保留完全控制）
   .auth(async (page) => {
     // 自定义登录逻辑
   })
   ```

3. **环境变量配置** - 新增 `.env` 支持
   - 格式：`{DOMAIN}_EMAIL` 和 `{DOMAIN}_PASSWORD`
   - 例如：`FLYONUI_EMAIL`、`FLYONUI_PASSWORD`
   - 域名从登录 URL 自动提取
   - 新增 `.env.example` 模板文件

4. **国际化文案** - 新增 16+ 条自动登录相关的中英文消息

**依赖更新：**
- 新增 `dotenv` 用于读取环境变量

**文件变更：**
- 新增：`src/auth/AutoAuthHandler.ts` - 自动登录处理器
- 修改：`src/crawler/BlockCrawler.ts` - auth API 支持多种参数形式
- 修改：`src/utils/i18n.ts` - 新增国际化文案
- 新增：`.env.example` - 环境变量模板
- 修改：`.gitignore` - 忽略 `.env` 文件
- 修改：`tests/flyonui.spec.ts` - 使用新的简化 API

**使用示例：**

```typescript
// 之前：需要手动编写完整的登录逻辑
.auth(async (page) => {
  await page.goto("https://flyonui.com/auth/login");
  const emailInput = page.getByRole("textbox", { name: "Email address*" });
  await emailInput.fill("user@example.com");
  const passwordInput = page.getByRole("textbox", { name: "Password*" });
  await passwordInput.fill("password");
  const signInButton = page.getByRole("button", { name: "Sign In" });
  await signInButton.click();
  await page.waitForURL("https://flyonui.com/*");
})

// 现在：只需一行配置
.auth({
  loginUrl: "https://flyonui.com/auth/login",
  redirectUrl: "https://flyonui.com/*"
})
```

**迁移指南：**
- 现有的自定义 handler 继续工作，无需修改
- 如果登录表单符合自动处理条件，可简化为 URL 或配置对象
- 需要在 `.env` 文件中配置登录凭据

