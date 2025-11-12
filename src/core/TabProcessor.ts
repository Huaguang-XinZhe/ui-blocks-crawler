import type { Page, Locator } from "@playwright/test";
import type { InternalConfig } from "./ConfigManager";
import { createI18n, type I18n } from "../utils/i18n";

/**
 * Tab 处理器
 * 职责：处理所有与 Tab 相关的操作
 */
export class TabProcessor {
  private i18n: I18n;
  
  constructor(private config: InternalConfig) {
    this.i18n = createI18n(config.locale);
  }

  /**
   * 获取所有的 Tab 元素
   */
  async getAllTabs(page: Page): Promise<Locator[]> {
    if (this.config.tabListAriaLabel) {
      const tabList = page.getByRole("tablist", { name: this.config.tabListAriaLabel });
      return await tabList.getByRole("tab").all();
    } else {
      // 如果没有指定 aria-label，则获取第一个 tablist
      const tabList = page.getByRole("tablist").first();
      return await tabList.getByRole("tab").all();
    }
  }

  /**
   * 点击 Tab
   */
  async clickTab(tab: Locator, index: number): Promise<void> {
    const text = await tab.textContent();

    // 第一个跳过点击（默认选中）
    if (index === 0) {
      return;
    }

    console.log(`   ${this.i18n.t('tab.clicking', { current: index + 1, total: index + 1, text })}`);
    await tab.click();
  }

  /**
   * 获取 Tab 对应的 Section 内容区域
   * 
   * 优先级：
   * 1. 配置的 getTabSection 函数
   * 2. 配置的 tabSectionLocator
   * 3. 抛出错误
   */
  getTabSection(page: Page, tabText: string): Locator {
    // 优先级 1：配置的函数
    if (this.config.getTabSection) {
      return this.config.getTabSection(page, tabText);
    }

    // 优先级 2：配置的定位符
    if (this.config.tabSectionLocator) {
      const locator = this.config.tabSectionLocator.replace("{tabText}", tabText);
      return page.locator(locator);
    }

    // 优先级 3：未配置，报错
    throw new Error(
      "未配置 getTabSection 函数、tabSectionLocator 且未重写 getTabSection 方法！\n\n" +
        "请选择以下任一方式：\n\n" +
        "方式 1：配置 getTabSection 函数（推荐，最灵活）\n" +
        "const crawler = new BlockCrawler({\n" +
        "  getTabSection: (page, tabText) => page.getByRole('tabpanel', { name: tabText }),\n" +
        "  // ... 其他配置\n" +
        "});\n\n" +
        "方式 2：配置 tabSectionLocator（简单场景）\n" +
        "const crawler = new BlockCrawler({\n" +
        '  tabSectionLocator: \'[role="tabpanel"][aria-label="{tabText}"]\',\n' +
        "  // ... 其他配置\n" +
        "});"
    );
  }

  /**
   * 获取所有 Tab Sections（如果配置了 getAllTabSections）
   * @returns Tab sections 数组或 null
   */
  async getAllTabSections(page: Page): Promise<Locator[] | null> {
    if (this.config.getAllTabSections) {
      return await this.config.getAllTabSections(page);
    }
    return null;
  }

  /**
   * 从 Tab Section 中提取 Tab 文本
   * 
   * 优先级：
   * 1. 配置的 extractTabTextFromSection 函数
   * 2. 自动查找 section 中的 heading 元素（h1-h6）
   */
  async extractTabText(section: Locator, index: number): Promise<string> {
    // 优先级 1：配置的函数
    if (this.config.extractTabTextFromSection) {
      const text = await this.config.extractTabTextFromSection(section);
      if (!text) {
        throw new Error(`Tab Section ${index + 1} 提取文本失败：extractTabTextFromSection 返回了 null`);
      }
      return text;
    }

    // 优先级 2：自动查找 heading
    
    // 尝试查找所有级别的 heading
    const headings = await section.getByRole("heading").all();
    
    if (headings.length === 0) {
      throw new Error(
        `Tab Section ${index + 1} 中未找到 heading 元素！\n\n` +
        `请配置 extractTabTextFromSection 函数来自定义提取逻辑：\n\n` +
        `const crawler = new BlockCrawler({\n` +
        `  getAllTabSections: async (page) => page.locator('section').all(),\n` +
        `  extractTabTextFromSection: async (section) => {\n` +
        `    return await section.locator('[data-tab-title]').textContent();\n` +
        `  },\n` +
        `  // ... 其他配置\n` +
        `});\n`
      );
    }

    if (headings.length > 1) {
      throw new Error(
        `Tab Section ${index + 1} 中找到 ${headings.length} 个 heading 元素，无法自动确定使用哪个！\n\n` +
        `请配置 extractTabTextFromSection 函数来明确指定：\n\n` +
        `const crawler = new BlockCrawler({\n` +
        `  getAllTabSections: async (page) => page.locator('section').all(),\n` +
        `  extractTabTextFromSection: async (section) => {\n` +
        `    // 例如：使用第一个 h2 标题\n` +
        `    return await section.getByRole('heading', { level: 2 }).first().textContent();\n` +
        `  },\n` +
        `  // ... 其他配置\n` +
        `});\n`
      );
    }

    const text = await headings[0].textContent();
    if (!text) {
      throw new Error(`Tab Section ${index + 1} 的 heading 元素文本为空`);
    }

    console.log(`    ${this.i18n.t('tab.extractingText', { text })}`);
    return text;
  }
}

