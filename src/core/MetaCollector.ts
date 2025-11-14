import fse from "fs-extra";
import type { CollectionLink, SiteMeta } from "../types";
import { createI18n, type I18n, type Locale } from "../utils/i18n";

/**
 * 元信息收集器 - 负责收集和保存网站爬取元信息
 */
export class MetaCollector {
  private meta: SiteMeta;
  private metaFile: string;
  private i18n: I18n;
  private startTime: Date;

  constructor(startUrl: string, metaFile: string, locale?: Locale) {
    this.metaFile = metaFile;
    this.i18n = createI18n(locale);
    this.startTime = new Date();
    this.meta = {
      startUrl,
      collectionLinks: [],
      totalLinks: 0,
      displayedTotalCount: 0,
      actualTotalCount: 0,
      freePages: {
        total: 0,
        links: [],
      },
      freeBlocks: {
        total: 0,
        blockNames: [],
      },
      isComplete: false,
    };
  }

  /**
   * 初始化：加载已有的元信息（如果存在）
   */
  async initialize(): Promise<void> {
    const existingMeta = await MetaCollector.load(this.metaFile);
    if (existingMeta) {
      // 合并已有的 freePages 和 freeBlocks（去重）
      const existingFreePages = new Set(existingMeta.freePages?.links || []);
      const existingFreeBlocks = new Set(existingMeta.freeBlocks?.blockNames || []);
      
      this.meta.freePages.links = Array.from(existingFreePages);
      this.meta.freePages.total = this.meta.freePages.links.length;
      this.meta.freeBlocks.blockNames = Array.from(existingFreeBlocks);
      this.meta.freeBlocks.total = this.meta.freeBlocks.blockNames.length;
      
      console.log(this.i18n.t('meta.loaded', { 
        freePages: this.meta.freePages.total, 
        freeBlocks: this.meta.freeBlocks.total 
      }));
    }
  }

  /**
   * 添加收集到的链接
   */
  addCollectionLinks(links: CollectionLink[]): void {
    this.meta.collectionLinks.push(...links);
    // 累加展示的总数
    this.meta.displayedTotalCount += links.reduce((sum, link) => sum + (link.count || 0), 0);
  }

  /**
   * 增加实际组件数
   */
  incrementActualCount(count: number = 1): void {
    this.meta.actualTotalCount += count;
  }

  /**
   * 记录 Free 页面（去重追加）
   */
  addFreePage(link: string): void {
    if (!this.meta.freePages.links.includes(link)) {
      this.meta.freePages.links.push(link);
      this.meta.freePages.total = this.meta.freePages.links.length;
    }
  }

  /**
   * 记录 Free Block（去重追加）
   */
  addFreeBlock(blockName: string): void {
    if (!this.meta.freeBlocks.blockNames.includes(blockName)) {
      this.meta.freeBlocks.blockNames.push(blockName);
      this.meta.freeBlocks.total = this.meta.freeBlocks.blockNames.length;
    }
  }

  /**
   * 获取当前元信息
   */
  getMeta(): SiteMeta {
    return { ...this.meta };
  }

  /**
   * 保存元信息到文件
   */
  async save(isComplete: boolean = false): Promise<void> {
    // 更新时间和完成状态
    const endTime = new Date();
    this.meta.isComplete = isComplete;
    this.meta.startTime = this.startTime.toLocaleString();
    this.meta.duration = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);
    
    // 更新链接总数
    this.meta.totalLinks = this.meta.collectionLinks.length;

    // 检查是否有实际内容
    const hasContent = 
      this.meta.collectionLinks.length > 0 ||
      this.meta.freePages.links.length > 0 ||
      this.meta.freeBlocks.blockNames.length > 0 ||
      this.meta.displayedTotalCount > 0 ||
      this.meta.actualTotalCount > 0;

    // 如果没有任何内容，且已有文件存在，则不覆盖
    const existingMeta = await MetaCollector.load(this.metaFile);
    if (!hasContent && existingMeta) {
      console.log(this.i18n.t('meta.skipEmpty', { path: this.metaFile }));
      return;
    }

    // 合并已有数据（保留已有的 collectionLinks、freePages、freeBlocks）
    let finalMeta: SiteMeta;
    if (existingMeta) {
      // 合并 collectionLinks（去重）
      const existingLinks = new Map<string, CollectionLink>();
      (existingMeta.collectionLinks || []).forEach(link => {
        existingLinks.set(link.link, link);
      });
      this.meta.collectionLinks.forEach(link => {
        existingLinks.set(link.link, link);
      });

      // 合并 freePages（去重）
      const existingFreePages = new Set(existingMeta.freePages?.links || []);
      this.meta.freePages.links.forEach(link => existingFreePages.add(link));

      // 合并 freeBlocks（去重）
      const existingFreeBlocks = new Set(existingMeta.freeBlocks?.blockNames || []);
      this.meta.freeBlocks.blockNames.forEach(name => existingFreeBlocks.add(name));

      finalMeta = {
        ...this.meta,
        collectionLinks: Array.from(existingLinks.values()),
        totalLinks: existingLinks.size,
        displayedTotalCount: Math.max(
          existingMeta.displayedTotalCount || 0,
          this.meta.displayedTotalCount
        ),
        actualTotalCount: Math.max(
          existingMeta.actualTotalCount || 0,
          this.meta.actualTotalCount
        ),
        freePages: {
          total: existingFreePages.size,
          links: Array.from(existingFreePages),
        },
        freeBlocks: {
          total: existingFreeBlocks.size,
          blockNames: Array.from(existingFreeBlocks),
        },
      };
    } else {
      finalMeta = { ...this.meta };
    }

    // 使用原子写入确保数据完整性
    const tempFile = `${this.metaFile}.tmp`;
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        // 先写入临时文件
        await fse.outputJson(tempFile, finalMeta, { spaces: 2 });
        
        // 验证临时文件是否写入成功
        const tempContent = await fse.readJson(tempFile);
        if (!tempContent || Object.keys(tempContent).length === 0) {
          throw new Error('写入的文件内容为空');
        }

        // 原子性替换：将临时文件重命名为目标文件
        await fse.move(tempFile, this.metaFile, { overwrite: true });

        // 验证最终文件
        const finalContent = await fse.readJson(this.metaFile);
        if (!finalContent || Object.keys(finalContent).length === 0) {
          throw new Error('最终文件内容为空');
        }

        // 写入成功，跳出重试循环
        break;
      } catch (error) {
        lastError = error as Error;
        retries--;
        
        // 清理临时文件
        if (await fse.pathExists(tempFile)) {
          await fse.remove(tempFile).catch(() => {});
        }

        if (retries > 0) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // 所有重试都失败，抛出错误
          console.error(this.i18n.t('meta.saveFailed', { 
            path: this.metaFile, 
            error: String(lastError) 
          }));
          throw new Error(`保存 meta.json 失败: ${lastError.message}`);
        }
      }
    }
    
    console.log(`\n${this.i18n.t('meta.saved', { path: this.metaFile })}`);
    console.log(this.i18n.t('meta.stats'));
    console.log(this.i18n.t('meta.collectedLinks', { count: finalMeta.totalLinks }));
    console.log(this.i18n.t('meta.displayedTotal', { count: finalMeta.displayedTotalCount }));
    console.log(this.i18n.t('meta.actualTotal', { count: finalMeta.actualTotalCount }));
    console.log(this.i18n.t('meta.freePages', { count: finalMeta.freePages.total }));
    console.log(this.i18n.t('meta.freeBlocks', { count: finalMeta.freeBlocks.total }));
    console.log(this.i18n.t('meta.duration', { duration: finalMeta.duration }));
    const statusText = this.i18n.getLocale() === 'zh' 
      ? (isComplete ? '是' : '否')
      : (isComplete ? 'Yes' : 'No');
    console.log(this.i18n.t('meta.isComplete', { status: statusText }));
  }

  /**
   * 加载已有的元信息（用于进度恢复）
   */
  static async load(metaFile: string): Promise<SiteMeta | null> {
    try {
      if (await fse.pathExists(metaFile)) {
        return await fse.readJson(metaFile);
      }
    } catch (error) {
      const i18n = createI18n();
      console.warn(i18n.t('meta.loadFailed', { error: String(error) }));
    }
    return null;
  }

  /**
   * 从已有的 meta.json 中加载 Free 页面列表
   * 用于在不恢复进度的情况下，跳过已知的 Free 页面
   */
  static async loadFreePages(metaFile: string): Promise<string[]> {
    const meta = await this.load(metaFile);
    return meta?.freePages?.links || [];
  }
}

