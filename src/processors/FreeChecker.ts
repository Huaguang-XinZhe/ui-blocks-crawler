import type { Locator, Page } from "@playwright/test";
import type { InternalConfig } from "../config/ConfigManager";
import { createI18n } from "../utils/i18n";

/**
 * Free 内容检查器
 * 
 * 职责：
 * - 统一处理 page 和 block 级别的 free 内容检查
 * - 支持字符串和函数两种配置方式
 */
export class FreeChecker {
	/**
	 * 检查 Page 是否为 Free
	 */
	static async checkPage(
		page: Page,
		config: InternalConfig,
		skipFree?: string | ((page: Page) => Promise<boolean>),
	): Promise<boolean> {
		if (!skipFree) {
			return false;
		}

		// 字符串配置：使用 getByText 精确匹配
		if (typeof skipFree === "string") {
			const count = await page.getByText(skipFree, { exact: true }).count();

			if (count === 0) {
				return false;
			}

			if (count !== 1) {
				const i18n = createI18n(config.locale);
				throw new Error(i18n.t("page.freeError", { count, text: skipFree }));
			}

			return true;
		}

		// 函数配置：使用自定义判断逻辑
		return await skipFree(page);
	}

	/**
	 * 检查 Block 是否为 Free
	 */
	static async checkBlock(
		block: Locator,
		config: InternalConfig,
		skipFree?: string | ((locator: Locator) => Promise<boolean>),
	): Promise<boolean> {
		if (!skipFree) {
			return false;
		}

		// 字符串配置：使用 getByText 精确匹配
		if (typeof skipFree === "string") {
			const count = await block.getByText(skipFree, { exact: true }).count();

			if (count === 0) {
				return false;
			}

			if (count !== 1) {
				const i18n = createI18n(config.locale);
				throw new Error(i18n.t("block.freeError", { count, text: skipFree }));
			}

			return true;
		}

		// 函数配置：使用自定义判断逻辑
		return await skipFree(block);
	}
}

