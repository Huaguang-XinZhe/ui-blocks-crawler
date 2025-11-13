import { test } from "@playwright/test";
import fse from "fs-extra";

test("get-code-from-untitledui", async ({ page }) => {
  await page.goto("https://www.untitledui.com/react/marketing/landing-pages", {
    waitUntil: "networkidle",
  });
  // 匹配第一个 block
  const block = page.locator("[data-preview]").first();
  // 点击 Code
  await block.getByRole("tab", { name: "Code" }).click();
  // 获取内部 pre
  const pre = block.locator('pre').last();
  // 获取内部 pre 的文本
  const text = await pre.textContent() ?? "";
  // 输出到文件
  await fse.outputFile(`output/www.untitledui.com/tests/index.tsx`, text);
});