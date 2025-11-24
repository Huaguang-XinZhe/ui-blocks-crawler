import { BlockCrawler } from "@huaguang/block-crawler";
import { type Page, test } from "@playwright/test";
import fse from "fs-extra";

test("shadcndesign", async ({ page }) => {
	// 设置超时
	test.setTimeout(60 * 1000); // 1 分钟

	const names = new Set<string>();

	// 创建 shadcndesign 爬虫实例（使用配置函数，无需继承）
	const crawler = new BlockCrawler(page, {
		startUrl: "https://www.shadcndesign.com/pro-blocks",
	});

	await crawler
		.collect()
		.tabSection(async (page, tabText) => {
			return page.getByRole("tabpanel", { name: tabText });
		})
		.name("[data-slot='card-title']")
		.count("p")
		// .open()
		.open("https://www.shadcndesign.com/pro-blocks/description-lists")
		.page(async ({ currentPage }) => {
			const blockNames = await getPageBlockNames(currentPage);
			blockNames.forEach((name) => {
				names.add(name);
			});
		})
		.run();

	// 输出到文件
	await fse.outputFile(
		`${crawler.outputDir}/shadcndesign-blocks-names.json`,
		JSON.stringify(Array.from(names), null, 2),
	);
});

// 获取页面中所有 blocks 路径
async function getPageBlockNames(page: Page) {
	const links = await page
		.getByRole("link", { name: "Open preview in fullscreen" })
		.all();

	const names = await Promise.all(
		links.map(async (link) => {
			const href = await link.getAttribute("href");
			const name = href ? href.split("/").pop() : "";
			if (name) {
				console.log(`🔍 name: ${name}`);
				return name;
			}
			return null;
		}),
	);

	return names.filter((name) => name !== null);
}
