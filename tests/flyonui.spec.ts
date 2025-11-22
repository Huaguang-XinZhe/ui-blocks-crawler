import { BlockCrawler } from "@huaguang/block-crawler";
import { type Locator, test } from "@playwright/test";

test("flyonui", async ({ page }) => {
	test.setTimeout(60 * 1000); // 1 分钟

	const crawler = new BlockCrawler(page, {
		startUrl: "https://flyonui.com/blocks",
	});

	await crawler
		.auth("https://flyonui.com/auth/login")
		// .collect()
		// .tabSections("//main/section")
		// .name("h3")
		// .count("p")
		// .open("https://flyonui.com/blocks/marketing-ui/portfolio") // 测试这个页面
		.open() // 并发处理
		.page({
			autoScroll: true,
		})
		.block(
			'//main/div/div[3]/div/div/div[contains(@class, "flex")]',
			async ({ block, safeOutput }) => {
				// 点击 Code 按钮
				await block.getByRole("button", { name: "Code" }).click();
				// 获取所有 fileTabs
				const fileTabs = await block
					.locator("//div[2]/div[2]/div[1]/div") // 注意，不要以单斜杠开头，尽管它是 block 内的直接子元素❗
					.getByRole("button")
					.all();

				for (let i = 0; i < fileTabs.length; i++) {
					const fileTab = fileTabs[i];
					// 先点击
					await clickFileTab(fileTab, i);
					// 后提取
					const code = await extractCodeFromBlock(block);
					// 获取 tab 名称
					const tabName = (await fileTab.textContent())?.trim();
					await safeOutput(code, tabName);
				}
			},
		)
		// 测试默认匹配（忽略大小写的 "free"）
		.skipFree()
		.run();
});

// 提取代码
async function extractCodeFromBlock(block: Locator) {
	const code = block.locator("pre");
	return (await code.textContent()) ?? "";
}

// 点击 fileTab（第一个跳过点击）
async function clickFileTab(fileTab: Locator, index: number) {
	if (index === 0) {
		return;
	}
	await fileTab.click();
}
