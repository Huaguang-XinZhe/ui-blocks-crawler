import type { Locator, Page } from "@playwright/test";
import type { ProcessingContext } from "../processors/ProcessingContext";
import type { ClickAndVerify, ClickCode } from "../types";
import { isDebugMode } from "./debug";
import type { Locale } from "./i18n";
import { createI18n } from "./i18n";

/**
 * 创建 clickAndVerify 函数
 * 验证点击效果，支持重试
 *
 * 如果不提供 verifyFn，将自动根据元素的 role 选择验证方式：
 * - role="tab" → 验证 aria-selected="true"
 * - 其他 role → 验证元素可见性
 *
 * @param locale 语言设置，用于国际化日志
 */
export function createClickAndVerify(locale: Locale = "zh"): ClickAndVerify {
	const i18n = createI18n(locale);
	return async (
		locator: Locator,
		verifyFn?: () => Promise<boolean>,
		options?: { timeout?: number; retries?: number },
	): Promise<void> => {
		const timeout = options?.timeout ?? 0; // 跟随外部的 timeout 设置
		const retries = options?.retries ?? 3;

		// 如果没有提供验证函数，创建默认验证函数
		const actualVerifyFn =
			verifyFn ||
			(async () => {
				// 获取元素的 role 属性
				const role = await locator.getAttribute("role");

				// 对于 tab 角色，验证 aria-selected 属性
				if (role === "tab") {
					const isSelected = await locator.getAttribute("aria-selected");
					return isSelected === "true";
				}

				// 对于其他角色，检查元素是否可见（通用验证）
				return await locator.isVisible();
			});

		for (let i = 0; i < retries; i++) {
			try {
				// 如果 timeout 为 0，不传递 timeout 参数，让 Playwright 使用默认 timeout
				if (timeout > 0) {
					await locator.click({ timeout });
				} else {
					await locator.click();
				}

				// 验证点击是否生效
				if (await actualVerifyFn()) return; // 验证通过
			} catch (error) {
				// 点击失败（超时或其他错误），继续重试
				const errorMessage =
					error instanceof Error ? error.message : String(error);

				// 如果不是最后一次重试，输出重试日志
				if (i < retries - 1) {
					console.log(
						i18n.t("click.retrying", {
							current: i + 2,
							total: retries,
							error: errorMessage,
						}),
					);
					continue;
				}

				// 最后一次重试失败，在调试模式下暂停
				if (isDebugMode()) {
					const page = locator.page();
					console.log(i18n.t("click.paused"));
					await page.pause();
				}

				throw new Error(
					i18n.t("click.failed", {
						retries,
						error: errorMessage,
					}),
				);
			}
		}

		// 所有重试都完成但验证失败，在调试模式下暂停
		if (isDebugMode()) {
			const page = locator.page();
			console.log(i18n.t("click.paused"));
			await page.pause();
		}

		throw new Error(i18n.t("click.verifyFailed", { retries }));
	};
}

/**
 * 创建 clickCode 函数
 * 内部使用 clickAndVerify 实现，会智能检测 Code 元素是 tab 还是 button
 * 第一次检测后会缓存到 ProcessingContext 中，后续自动应用
 *
 * @param pageOrBlock Page 或 Locator（Block）对象，用于获取默认的 Code 按钮定位器
 * @param clickAndVerify clickAndVerify 函数实例
 * @param processingContext 处理上下文，用于缓存 Code 元素类型
 */
export function createClickCode(
	pageOrBlock: Page | Locator,
	clickAndVerify: ClickAndVerify,
	processingContext?: ProcessingContext,
): ClickCode {
	return async (
		locator?: Locator,
		options?: { timeout?: number; retries?: number },
	): Promise<void> => {
		let targetLocator: Locator;

		// 如果提供了自定义 locator，直接使用
		if (locator) {
			targetLocator = locator;
		} else {
			// 检查缓存的 Code 元素类型
			const cachedRole = processingContext?.getCodeRole();

			if (cachedRole) {
				// 使用缓存的角色类型
				if (cachedRole === "tab") {
					targetLocator = pageOrBlock.getByRole("tab", { name: "Code" });
				} else {
					targetLocator = pageOrBlock.getByRole("button", { name: "Code" });
				}
			} else {
				// 首次执行：智能检测 Code 元素类型
				const tabLocator = pageOrBlock.getByRole("tab", { name: "Code" });
				const buttonLocator = pageOrBlock.getByRole("button", { name: "Code" });

				// 尝试检测哪个存在
				const tabExists = await tabLocator.count().then((count) => count > 0);
				const buttonExists = await buttonLocator
					.count()
					.then((count) => count > 0);

				if (tabExists) {
					targetLocator = tabLocator;
					processingContext?.setCodeRole("tab");
				} else if (buttonExists) {
					targetLocator = buttonLocator;
					processingContext?.setCodeRole("button");
				} else {
					// 都不存在，默认使用 tab（会抛出更明确的错误）
					targetLocator = tabLocator;
				}
			}
		}

		// 使用 clickAndVerify 进行点击并验证（使用自动验证）
		await clickAndVerify(targetLocator, undefined, options);
	};
}
