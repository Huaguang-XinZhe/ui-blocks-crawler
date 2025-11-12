import type { Page } from "@playwright/test";
import pLimit from "p-limit";
import type { InternalConfig } from "./ConfigManager";
import type { TaskProgress } from "../utils/task-progress";
import { TabProcessor } from "./TabProcessor";
import { LinkCollector } from "./LinkCollector";
import { BlockProcessor } from "./BlockProcessor";
import { PageProcessor } from "./PageProcessor";
import { MetaCollector } from "./MetaCollector";
import { createI18n, type I18n } from "../utils/i18n";

/**
 * 爬虫协调器
 * 职责：协调各个模块，执行完整的爬取流程
 */
export class CrawlerOrchestrator {
  private tabProcessor: TabProcessor;
  private linkCollector: LinkCollector;
  private metaCollector: MetaCollector;
  private limit: ReturnType<typeof pLimit>;
  private i18n: I18n;

  constructor(
    private config: InternalConfig,
    private taskProgress?: TaskProgress
  ) {
    this.tabProcessor = new TabProcessor(config);
    this.linkCollector = new LinkCollector(config);
    this.metaCollector = new MetaCollector(config.startUrl, config.metaFile, config.locale);
    this.limit = pLimit(config.maxConcurrency);
    this.i18n = createI18n(config.locale);
  }

  /**
   * 执行爬取流程
   */
  async run(
    page: Page,
    blockSectionLocator: string | null,
    blockHandler: ((context: any) => Promise<void>) | null,
    pageHandler: ((context: any) => Promise<void>) | null
  ): Promise<void> {
    console.log(`\n${this.i18n.t('crawler.taskStart')}`);
    console.log(this.i18n.t('crawler.targetUrl', { url: this.config.startUrl }));
    console.log(this.i18n.t('crawler.maxConcurrency', { count: this.config.maxConcurrency }));
    console.log(this.i18n.t('crawler.outputDir', { dir: this.config.outputDir }));
    const mode = blockSectionLocator 
      ? this.i18n.t('crawler.modeBlock')
      : this.i18n.t('crawler.modePage');
    console.log(this.i18n.t('crawler.mode', { mode }));

    // 初始化任务进度
    if (this.taskProgress) {
      console.log(`\n${this.i18n.t('crawler.initProgress')}`);
      await this.taskProgress.initialize();
    }

    try {
      // 访问目标链接
      console.log(`\n${this.i18n.t('crawler.visiting')}`);
      await page.goto(this.config.startUrl, this.config.startUrlWaitOptions);
      console.log(this.i18n.t('crawler.pageLoaded'));

      // 处理 Tabs 并收集链接
      await this.processTabsAndCollectLinks(page);

      // 并发处理所有链接
      await this.processAllLinks(page, blockSectionLocator, blockHandler, pageHandler);

      console.log(`\n${this.i18n.t('crawler.allComplete')}\n`);
    } catch (error) {
      console.error(`\n${this.i18n.t('common.error')}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 清理资源（保存进度和元信息）
   * 在正常结束或中断时调用
   */
  async cleanup(): Promise<void> {
    // 保存进度
    if (this.taskProgress) {
      await this.taskProgress.saveProgress();
      console.log(
        `\n💾 进度已保存 (已完成 Block: ${this.taskProgress.getCompletedBlockCount()}, 已完成 Page: ${this.taskProgress.getCompletedPageCount()})`
      );
    }
    
    // 保存元信息
    await this.metaCollector.save();
  }

  /**
   * 处理所有 Tabs 并收集链接
   */
  private async processTabsAndCollectLinks(page: Page): Promise<void> {
    // 优先级 1：如果配置了 getAllTabSections，使用新模式（跳过 tab 点击）
    const tabSections = await this.tabProcessor.getAllTabSections(page);
    
    if (tabSections) {
      console.log(`\n${this.i18n.t('tab.gettingSections')}`);
      console.log(this.i18n.t('tab.foundSections', { count: tabSections.length }));

      console.log(`\n${this.i18n.t('tab.processingSections')}`);
      for (let i = 0; i < tabSections.length; i++) {
        const section = tabSections[i];
        console.log(`\n${this.i18n.t('tab.processingSection', { current: i + 1, total: tabSections.length, index: i + 1 })}`);
        
        // 提取 tab 文本（内部包含日志输出）
        await this.tabProcessor.extractTabText(section, i);
        
        // 收集链接
        await this.linkCollector.collectLinks(section);
      }
    } else {
      // 优先级 2：原有逻辑 - 获取 tab 元素并点击
      console.log(`\n${this.i18n.t('tab.getting')}`);
      const tabs = await this.tabProcessor.getAllTabs(page);
      console.log(this.i18n.t('tab.found', { count: tabs.length }));

      console.log(`\n${this.i18n.t('tab.processing')}`);
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        await this.tabProcessor.clickTab(tab, i);
        const tabText = (await tab.textContent()) ?? "";
        await this.handleSingleTab(page, tabText);
      }
    }

    const allLinks = this.linkCollector.getAllLinks();
    const totalBlocks = this.linkCollector.getTotalBlockCount();
    
    console.log(`\n${this.i18n.t('link.complete')}`);
    console.log(`   ${this.i18n.t('link.totalLinks', { count: allLinks.length })}`);
    
    // 只有配置了 collectionCountLocator 时才输出总组件数
    if (this.config.collectionCountLocator) {
      console.log(`   ${this.i18n.t('link.totalBlocks', { count: totalBlocks })}`);
    }
    console.log();
    
    // 将收集到的链接添加到元信息收集器
    this.metaCollector.addCollectionLinks(allLinks);
  }

  /**
   * 处理单个 Tab
   */
  private async handleSingleTab(page: Page, tabText: string): Promise<void> {
    console.log(`   ${this.i18n.t('crawler.processingCategory', { category: tabText })}`);

    const section = this.tabProcessor.getTabSection(page, tabText);
    await this.linkCollector.collectLinks(section);
    
    console.log(`   ${this.i18n.t('crawler.categoryComplete', { category: tabText })}`);
  }

  /**
   * 并发处理所有链接
   */
  private async processAllLinks(
    page: Page,
    blockSectionLocator: string | null,
    blockHandler: ((context: any) => Promise<void>) | null,
    pageHandler: ((context: any) => Promise<void>) | null
  ): Promise<void> {
    const allLinks = this.linkCollector.getAllLinks();
    const total = allLinks.length;
    let completed = 0;
    let failed = 0;

    console.log(`\n${this.i18n.t('crawler.startConcurrent', { concurrency: this.config.maxConcurrency })}`);
    console.log(`\n${this.i18n.t('crawler.startProcessing', { total })}`);

    await Promise.allSettled(
      allLinks.map((linkObj, index) =>
        this.limit(async () => {
          // 跳过已完成的页面
          const normalizedPath = linkObj.link.startsWith("/")
            ? linkObj.link.slice(1)
            : linkObj.link;

          if (this.taskProgress?.isPageComplete(normalizedPath)) {
            console.log(this.i18n.t('crawler.skipCompleted', { name: linkObj.name || normalizedPath }));
            completed++;
            return;
          }

          try {
            await this.handleSingleLink(
              page,
              linkObj.link,
              index === 0,
              blockSectionLocator,
              blockHandler,
              pageHandler
            );
            completed++;
            const progress = `${completed + failed}/${total}`;
            console.log(`${this.i18n.t('crawler.linkComplete', { progress, name: linkObj.name || linkObj.link })}\n`);
          } catch (error) {
            failed++;
            const progress = `${completed + failed}/${total}`;
            console.error(`${this.i18n.t('crawler.linkFailed', { progress, name: linkObj.name || linkObj.link })}\n`, error);
          }
        })
      )
    );

    console.log(`\n${this.i18n.t('crawler.statistics')}`);
    console.log(`   ${this.i18n.t('crawler.success', { count: completed, total })}`);
    console.log(`   ${this.i18n.t('crawler.failed', { count: failed, total })}`);
  }

  /**
   * 处理单个链接
   */
  private async handleSingleLink(
    page: Page,
    relativeLink: string,
    isFirst: boolean,
    blockSectionLocator: string | null,
    blockHandler: ((context: any) => Promise<void>) | null,
    pageHandler: ((context: any) => Promise<void>) | null
  ): Promise<void> {
    const domain = new URL(this.config.startUrl).hostname;
    const url = `https://${domain}${relativeLink}`;

    const newPage = isFirst ? page : await page.context().newPage();

    try {
      await newPage.goto(url, this.config.collectionLinkWaitOptions);

      // 根据模式决定处理方式
      if (blockSectionLocator && blockHandler) {
        const blockProcessor = new BlockProcessor(
          this.config,
          blockSectionLocator,
          blockHandler,
          this.taskProgress
        );
        const result = await blockProcessor.processBlocksInPage(newPage, relativeLink);
        
        // 记录实际组件数和 free blocks
        this.metaCollector.incrementActualCount(result.totalCount);
        result.freeBlocks.forEach(blockName => {
          this.metaCollector.addFreeBlock(blockName);
        });
      } else if (pageHandler) {
        const pageProcessor = new PageProcessor(this.config, pageHandler);
        const result = await pageProcessor.processPage(newPage, relativeLink);
        
        // 记录 free pages
        if (result.isFree) {
          this.metaCollector.addFreePage(relativeLink);
        }
      }
    } finally {
      if (!isFirst) {
        console.log(`\n${this.i18n.t('crawler.closePage', { path: relativeLink })}`);
        await newPage.close();
      }
    }
  }
}

