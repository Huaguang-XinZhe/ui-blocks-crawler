import { BlockCrawler } from "@huaguang/block-crawler";
import { Page, test } from "@playwright/test";

test("flyonui", async ({ page }) => {
	test.setTimeout(60 * 1000); // 1 分钟

	const crawler = new BlockCrawler(page, {
		startUrl: "https://flyonui.com/blocks",
	});

	await crawler
		.auth(async (page) => {
			// 登录逻辑（只在 auth.json 不存在时执行）
			await page.goto("https://flyonui.com/auth/login");
			const emailInput = page.getByRole("textbox", { name: "Email address*" });
			await emailInput.fill("jhawden@e-connect.lu");
			const passwordInput = page.getByRole("textbox", { name: "Password*" });
			await passwordInput.fill("XO1UEf!=xs4o");
			const signInButton = page.getByRole("button", {
				name: "Sign In to FlyonUI",
			});
			await signInButton.click();
		})
		.collect()
		.tabSections("//main/section")
		.name("h3")
		.count("p")
		// .open()
		// .page(async ({ currentPage }) => {
		// 	await autoScroll(currentPage);
		// })
		// .block(
		// 	'//main/div/div[3]/div/div/div[contains(@class, "flex")]',
		// 	async ({ blockName }) => {
		// 		console.log(blockName);
		// 	},
		// )
		// .skipFree("FREE")
		.run();
});

async function autoScroll(page: Page, step = 1000, interval = 500) {
	await page.evaluate(async () => {
		await new Promise<void>((resolve) => {
			let totalHeight = 0;
			const distance = step;

			const timer = setInterval(() => {
				const scrollHeight = document.body.scrollHeight;
				window.scrollBy(0, distance);
				totalHeight += distance;

				if (totalHeight >= scrollHeight) {
					clearInterval(timer);
					resolve();
				}
			}, interval);
		});
	});
}
