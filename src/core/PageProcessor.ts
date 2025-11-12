import type { Page } from "@playwright/test";
import type { PageHandler, PageContext } from "../types";
import type { InternalConfig } from "./ConfigManager";
import { createI18n, type I18n } from "../utils/i18n";

/**
 * Page 处理器
 * 职责：处理单个页面
 */
export class PageProcessor {
  private i18n: I18n;
  
  constructor(
    private config: InternalConfig,
    private pageHandler: PageHandler
  ) {
    this.i18n = createI18n(config.locale);
  }

  /**
   * 检查页面是否为 Free
   */
  private async isPageFree(page: Page): Promise<boolean> {
    if (!this.config.skipPageFree) {
      return false;
    }

    // 字符串配置：使用 getByText 精确匹配
    if (typeof this.config.skipPageFree === "string") {
      const count = await page.getByText(this.config.skipPageFree, { exact: true }).count();
      
      if (count === 0) {
        return false;
      }
      
      if (count !== 1) {
        throw new Error(this.i18n.t('page.freeError', { count, text: this.config.skipPageFree }));
      }
      
      return true;
    }
    
    // 函数配置：使用自定义判断逻辑
    return await this.config.skipPageFree(page);
  }

  /**
   * 处理单个页面
   */
  async processPage(page: Page, currentPath: string): Promise<{ isFree: boolean }> {
    // 检查是否为 Free 页面
    const isFree = await this.isPageFree(page);
    if (isFree) {
      console.log(this.i18n.t('page.skipFree', { path: currentPath }));
      return { isFree: true };
    }

    const context: PageContext = {
      currentPage: page,
      currentPath,
      outputDir: this.config.outputDir,
    };

    try {
      await this.pageHandler(context);
      return { isFree: false };
    } catch (error) {
      console.error(this.i18n.t('page.processFailed', { path: currentPath }), error);
      throw error;
    }
  }
}

