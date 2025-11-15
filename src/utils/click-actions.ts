import type { Locator, Page } from "@playwright/test";
import type { ClickAndVerify, ClickCode } from "../types";

/**
 * 创建 clickAndVerify 函数
 * 验证点击效果，支持重试
 * 
 * 如果不提供 verifyFn，将自动根据元素的 role 选择验证方式：
 * - role="tab" → 验证 aria-selected="true"
 * - 其他 role → 验证元素可见性
 */
export function createClickAndVerify(): ClickAndVerify {
  return async (
    locator: Locator,
    verifyFn?: () => Promise<boolean>,
    options?: { timeout?: number; retries?: number }
  ): Promise<void> => {
    const timeout = options?.timeout ?? 5000;
    const retries = options?.retries ?? 3;

    // 如果没有提供验证函数，创建默认验证函数
    const actualVerifyFn = verifyFn || (async () => {
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
      await locator.click({ timeout });
      if (await actualVerifyFn()) return; // 验证通过
    }

    throw new Error("点击后验证失败");
  };
}

/**
 * 创建 clickCode 函数
 * 内部使用 clickAndVerify 实现，默认会自动验证 tab 的 aria-selected 属性
 * 
 * @param pageOrBlock Page 或 Locator（Block）对象，用于获取默认的 Code 按钮定位器
 */
export function createClickCode(
  pageOrBlock: Page | Locator,
  clickAndVerify: ClickAndVerify
): ClickCode {
  return async (
    locator?: Locator,
    options?: { timeout?: number; retries?: number }
  ): Promise<void> => {
    // 如果没有提供 locator，使用默认的 Code 按钮定位器
    const targetLocator = locator || pageOrBlock.getByRole("tab", { name: "Code" });

    // 使用 clickAndVerify 进行点击并验证（使用自动验证）
    await clickAndVerify(targetLocator, undefined, options);
  };
}

