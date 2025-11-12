import fse from "fs-extra";
import path from "path";
import { createI18n, type I18n, type Locale } from "./i18n";

/**
 * 任务进度管理器
 * 用于记录爬取进度，支持中断恢复
 * 同时跟踪 block 级别和 page 级别的完成状态
 */
export class TaskProgress {
  private progressFile: string;
  private outputDir: string;
  private completedBlocks: Set<string>;
  private completedPages: Set<string>;
  private isDirty: boolean = false;
  private i18n: I18n;

  constructor(progressFile: string = "progress.json", outputDir: string = "output", locale?: Locale) {
    this.progressFile = progressFile;
    this.outputDir = outputDir;
    this.completedBlocks = new Set();
    this.completedPages = new Set();
    this.i18n = createI18n(locale);
  }

  /**
   * 初始化：加载或重建进度
   */
  async initialize(): Promise<void> {
    if (await fse.pathExists(this.progressFile)) {
      console.log(this.i18n.t('progress.found'));
      await this.loadProgress();
      console.log(
        this.i18n.t('progress.loaded', { blocks: this.completedBlocks.size, pages: this.completedPages.size })
      );
    } else {
      console.log(this.i18n.t('progress.scanning'));
      await this.rebuildProgress();
      console.log(
        this.i18n.t('progress.rebuilt', { blocks: this.completedBlocks.size, pages: this.completedPages.size })
      );
    }
  }

  /**
   * 从文件加载进度
   */
  private async loadProgress(): Promise<void> {
    try {
      const data = await fse.readJson(this.progressFile);
      this.completedBlocks = new Set(data.completedBlocks || []);
      this.completedPages = new Set(data.completedPages || []);
    } catch (error) {
      console.warn(this.i18n.t('progress.loadFailed'), error);
      await this.rebuildProgress();
    }
  }

  /**
   * 重建进度：扫描 OUTPUT_DIR
   * 逻辑：
   * 1. 扫描所有 4 段的 block 目录（例如：components/application/authentication/Left Sign Up）
   * 2. 对比 js 和 ts 目录的文件数，一致则认为 block 已完成
   * 3. 如果某个页面（3段路径）下的所有 block 都完成，标记页面为已完成
   */
  private async rebuildProgress(): Promise<void> {
    if (!(await fse.pathExists(this.outputDir))) {
      return;
    }

    const completedBlocks: string[] = [];
    const pageBlocksMap = new Map<string, { total: number; completed: number }>();

    // 递归扫描，找到所有 4 段的路径
    const scanDir = async (currentPath: string, depth: number = 0): Promise<void> => {
      const fullPath = path.join(this.outputDir, currentPath);
      
      if (!(await fse.pathExists(fullPath))) {
        return;
      }

      const entries = await fse.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        const newDepth = depth + 1;

        // 如果是第 4 段（block 目录），检查完成状态
        if (newDepth === 4) {
          // 提取页面路径（前3段）
          const pathParts = newPath.split("/");
          const pagePath = pathParts.slice(0, 3).join("/");
          
          // 初始化页面统计
          if (!pageBlocksMap.has(pagePath)) {
            pageBlocksMap.set(pagePath, { total: 0, completed: 0 });
          }
          const pageStats = pageBlocksMap.get(pagePath)!;
          pageStats.total++;

          const isComplete = await this.checkBlockComplete(newPath);
          if (isComplete) {
            completedBlocks.push(newPath);
            pageStats.completed++;
          }
        } else if (newDepth < 4) {
          // 继续递归
          await scanDir(newPath, newDepth);
        }
      }
    };

    await scanDir("");
    
    this.completedBlocks = new Set(completedBlocks);
    
    // 检查哪些页面已完全完成
    const completedPages: string[] = [];
    for (const [pagePath, stats] of pageBlocksMap.entries()) {
      if (stats.total > 0 && stats.completed === stats.total) {
        completedPages.push(pagePath);
      }
    }
    this.completedPages = new Set(completedPages);
    
    // 保存重建的进度
    if (completedBlocks.length > 0 || completedPages.length > 0) {
      await this.saveProgress();
    }
  }

  /**
   * 检查一个 block 是否完成
   * 完成条件：js 目录和 ts 目录的文件数一致
   */
  private async checkBlockComplete(blockPath: string): Promise<boolean> {
    const blockFullPath = path.join(this.outputDir, blockPath);
    const jsDir = path.join(blockFullPath, "js");
    const tsDir = path.join(blockFullPath, "ts");

    // 两个目录都必须存在
    if (!(await fse.pathExists(jsDir)) || !(await fse.pathExists(tsDir))) {
      return false;
    }

    try {
      const jsFiles = (await fse.readdir(jsDir)).filter(f => !f.startsWith('.'));
      const tsFiles = (await fse.readdir(tsDir)).filter(f => !f.startsWith('.'));

      // 文件数必须一致且大于 0
      return jsFiles.length > 0 && jsFiles.length === tsFiles.length;
    } catch (error) {
      return false;
    }
  }

  /**
   * 标记一个 block 为已完成
   */
  markBlockComplete(blockPath: string): void {
    this.completedBlocks.add(blockPath);
    this.isDirty = true;
  }

  /**
   * 标记一个页面为已完成
   */
  markPageComplete(pagePath: string): void {
    this.completedPages.add(pagePath);
    this.isDirty = true;
  }

  /**
   * 检查一个 block 是否已完成
   */
  isBlockComplete(blockPath: string): boolean {
    return this.completedBlocks.has(blockPath);
  }

  /**
   * 检查一个页面是否已完成
   */
  isPageComplete(pagePath: string): boolean {
    return this.completedPages.has(pagePath);
  }

  /**
   * 保存进度到文件
   */
  async saveProgress(): Promise<void> {
    if (!this.isDirty && await fse.pathExists(this.progressFile)) {
      return; // 没有变化且文件存在，不需要保存
    }

    const data = {
      completedBlocks: Array.from(this.completedBlocks),
      completedPages: Array.from(this.completedPages),
      lastUpdate: new Date().toLocaleString(),
      totalBlocks: this.completedBlocks.size,
      totalPages: this.completedPages.size,
    };

    // 使用 outputJson 自动确保目录存在并写入
    await fse.outputJson(this.progressFile, data, { spaces: 2 });
    this.isDirty = false;
  }

  /**
   * 获取已完成的 block 数量
   */
  getCompletedBlockCount(): number {
    return this.completedBlocks.size;
  }

  /**
   * 获取已完成的页面数量
   */
  getCompletedPageCount(): number {
    return this.completedPages.size;
  }

  /**
   * 清空进度（用于重新开始）
   */
  async clear(): Promise<void> {
    this.completedBlocks.clear();
    this.completedPages.clear();
    this.isDirty = true;
    await this.saveProgress();
  }

  /**
   * 删除进度文件
   */
  async deleteProgressFile(): Promise<void> {
    if (await fse.pathExists(this.progressFile)) {
      await fse.remove(this.progressFile);
    }
  }
}

