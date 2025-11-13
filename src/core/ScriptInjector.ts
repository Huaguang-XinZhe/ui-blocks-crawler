import type { Page } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { InternalConfig } from "./ConfigManager";
import { createI18n, type I18n } from "../utils/i18n";

/**
 * 脚本注入器
 * 职责：处理脚本文件的读取和注入
 */
export class ScriptInjector {
  private i18n: I18n;
  private scriptContents: Map<string, string> = new Map();
  private enabled: boolean;
  private timing: 'beforePageLoad' | 'afterPageLoad';

  constructor(private config: InternalConfig) {
    this.i18n = createI18n(config.locale);
    this.enabled = !!config.scriptInjection;
    this.timing = config.scriptInjection?.timing || 'afterPageLoad';

    // 预加载所有脚本内容
    if (this.enabled && config.scriptInjection) {
      this.loadScripts(config.scriptInjection.scripts);
    }
  }

  /**
   * 加载脚本文件内容
   */
  private loadScripts(scriptNames: string[]): void {
    const scriptsDir = this.config.stateDir; // .crawler/域名/

    for (const scriptName of scriptNames) {
      const scriptPath = join(scriptsDir, scriptName);
      
      if (!existsSync(scriptPath)) {
        console.warn(this.i18n.t('script.notFound', { path: scriptPath }));
        continue;
      }

      try {
        const content = readFileSync(scriptPath, 'utf-8');
        this.scriptContents.set(scriptName, content);
        console.log(this.i18n.t('script.loaded', { name: scriptName }));
      } catch (error) {
        console.error(this.i18n.t('script.loadError', { name: scriptName, error: String(error) }));
      }
    }
  }

  /**
   * 检查是否启用了脚本注入
   */
  isEnabled(): boolean {
    return this.enabled && this.scriptContents.size > 0;
  }

  /**
   * 获取注入时机
   */
  getTiming(): 'beforePageLoad' | 'afterPageLoad' {
    return this.timing;
  }

  /**
   * 在页面加载前注入脚本（使用 addInitScript）
   * 适用于需要在页面加载前执行的脚本
   */
  async injectBeforePageLoad(page: Page): Promise<void> {
    if (!this.isEnabled() || this.timing !== 'beforePageLoad') {
      return;
    }

    for (const [scriptName, content] of this.scriptContents) {
      try {
        await page.addInitScript(content);
        console.log(this.i18n.t('script.injectedBefore', { name: scriptName }));
      } catch (error) {
        console.error(this.i18n.t('script.injectError', { name: scriptName, error: String(error) }));
      }
    }
  }

  /**
   * 在页面加载后注入脚本
   * 适用于需要在页面加载完成后执行的脚本
   */
  async injectAfterPageLoad(page: Page): Promise<void> {
    if (!this.isEnabled() || this.timing !== 'afterPageLoad') {
      return;
    }

    for (const [scriptName, content] of this.scriptContents) {
      try {
        await page.evaluate(content);
        console.log(this.i18n.t('script.injectedAfter', { name: scriptName }));
      } catch (error) {
        console.error(this.i18n.t('script.injectError', { name: scriptName, error: String(error) }));
      }
    }
  }

  /**
   * 统一注入接口（根据配置的时机自动选择）
   * @param page 页面对象
   * @param beforeLoad 是否在页面加载前调用（true 表示在 goto 前，false 表示在 goto 后）
   */
  async inject(page: Page, beforeLoad: boolean): Promise<void> {
    if (beforeLoad) {
      await this.injectBeforePageLoad(page);
    } else {
      await this.injectAfterPageLoad(page);
    }
  }
}

