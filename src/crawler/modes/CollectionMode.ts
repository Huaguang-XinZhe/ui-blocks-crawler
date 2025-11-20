import type { Page } from "@playwright/test";
import type { CollectResult } from "../../collectors/types";
import type { InternalConfig } from "../../config/ConfigManager";
import { createI18n, type I18n } from "../../utils/i18n";
import type { CollectionConfig } from "../utils/ConfigHelper";
import { ConfigHelper } from "../utils/ConfigHelper";

/**
 * 收集模式
 *
 * 职责：
 * - 执行链接收集
 * - 从 collect.json 加载
 */
export class CollectionMode {
	private i18n: I18n;

	constructor(
		private config: InternalConfig,
		private page: Page,
	) {
		this.i18n = createI18n(config.locale);
	}

	/**
	 * 执行收集（包含2种场景）
	 * 1. 配置了 section → 执行新收集
	 * 2. 未配置 section + 配置了 startUrl → 从 collect.json 加载
	 */
	async execute(collectionConfig: CollectionConfig): Promise<CollectResult> {
		if (!collectionConfig.startUrl) {
			throw new Error("未配置 startUrl。请在构造函数中配置 startUrl 参数。");
		}

		const hasSection = ConfigHelper.hasSection(collectionConfig);

		if (!hasSection) {
			// 场景 2: 配置了 startUrl 但未配置 section → 从文件加载
			return await this.loadFromFile(collectionConfig.startUrl);
		}

		// 场景 1: 配置了 section → 执行新收集
		return await this.performCollection(collectionConfig);
	}

	/**
	 * 执行新的收集
	 */
	private async performCollection(
		collectionConfig: CollectionConfig,
	): Promise<CollectResult> {
		const { LinkCollector } = await import("../../collectors/LinkCollector");

		const config = ConfigHelper.buildCollectorConfig(
			collectionConfig,
			this.page,
			this.config.locale,
			this.config.stateBaseDir,
		);

		const collector = new LinkCollector(config);
		return await collector.run();
	}

	/**
	 * 从 collect.json 加载已有结果
	 */
	private async loadFromFile(startUrl: string): Promise<CollectResult> {
		const { CollectResultStore } = await import(
			"../../collectors/store/CollectResultStore"
		);
		const store = new CollectResultStore(
			startUrl,
			this.config.stateBaseDir,
			this.config.locale,
		);

		const result = await store.load();
		if (!result) {
			throw new Error(
				`未找到 collect.json 文件。请先配置 section（如 .tabSections() 或 .tabSection()）来执行一次收集。`,
			);
		}

		return result;
	}
}
