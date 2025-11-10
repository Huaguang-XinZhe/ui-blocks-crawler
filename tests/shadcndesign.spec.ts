import { test, type Page } from "@playwright/test";
import fse from "fs-extra";
import { BlockCrawler, type PageContext, type CrawlerConfig } from "../src"; // 这里的 ../ 又和 path.join 中的不同❗

test("shadcndesign", async ({ page }) => {
  // 设置超时
  test.setTimeout(60 * 1000); // 1 分钟

  // 创建 crawler 实例
  const crawler = new BlockCrawler({
    startUrl: "https://www.shadcndesign.com/pro-blocks",
    maxConcurrency: 5,
  } as CrawlerConfig);

  // 设置页面处理器并自动运行
  await crawler.onPage(page, async ({outputDir}: PageContext) => {
    const names = await getPageBlockNames(page);
    // 输出到文件
    await fse.outputFile(`${outputDir}/shadcndesign-blocks-names.json`, JSON.stringify(names, null, 2));
  });
});


// 获取页面中所有 blocks 路径
async function getPageBlockNames(page: Page) {
  const links = await page
    .getByRole("link", { name: "Open preview in fullscreen" })
    .all();

  const names = await Promise.all(
    links.map(async (link) => {
      const href = await link.getAttribute("href");
      // 取最后一段
      const name = href ? href.split("/").pop() : "";
      console.log(`🔍 name: ${name}`);
      return name;
    })
  );
  return names
}