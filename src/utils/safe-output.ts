import path from "node:path";
import fse from "fs-extra";
import type { FilenameMappingManager } from "../state/FilenameMapping";
import {
	sanitizeFilename,
	sanitizeFilenameWithOriginal,
} from "./sanitize-filename";

/**
 * SafeOutput 函数类型
 */
export type SafeOutput = (
	data: string,
	tabName?: string,
	filePath?: string,
) => Promise<void>;

/**
 * 根据 tabName 解析文件名或扩展名
 *
 * @param tabName 文件名或语言名（可选）
 * @returns 如果是文件名返回 { isFilename: true, filename: string }，否则返回 { isFilename: false, extension: string }
 */
function resolveTabName(tabName?: string): {
	isFilename: boolean;
	filename?: string;
	extension?: string;
} {
	// 如果未提供 tabName，默认使用 .tsx
	if (!tabName) {
		return { isFilename: false, extension: ".tsx" };
	}

	// 如果包含点号，说明是文件名，直接使用（不需要 sanitize）
	if (tabName.includes(".")) {
		return { isFilename: true, filename: tabName };
	}

	// 如果是编程语言名，映射到对应的扩展名（只保留前端相关的）
	const languageMap: Record<string, string> = {
		tsx: ".tsx",
		ts: ".ts",
		typescript: ".ts",
		jsx: ".jsx",
		js: ".js",
		javascript: ".js",
		html: ".html",
		css: ".css",
		scss: ".scss",
		sass: ".sass",
		less: ".less",
		json: ".json",
		vue: ".vue",
		svelte: ".svelte",
		md: ".md",
		markdown: ".md",
	};

	// 将 tabName 转为小写进行匹配
	const lowerTabName = tabName.toLowerCase();
	return {
		isFilename: false,
		extension: languageMap[lowerTabName] || ".tsx",
	};
}

/**
 * 创建 safeOutput 函数
 *
 * @param mode 模式：'block' | 'test' | 'page'
 * @param outputDir 输出目录
 * @param mappingManager 文件名映射管理器（可选）
 * @param blockPath Block 模式下的 blockPath（可选）
 * @param blockName Test 模式下的 blockName（可选）
 * @returns safeOutput 函数
 */
export function createSafeOutput(
	mode: "block" | "test" | "page",
	outputDir: string,
	mappingManager?: FilenameMappingManager,
	blockPath?: string,
	blockName?: string,
): SafeOutput {
	return async (
		data: string,
		tabName?: string,
		filePath?: string,
	): Promise<void> => {
		let finalPath: string;
		let originalFilename: string | undefined;
		let sanitizedFilename: string | undefined;

		if (filePath) {
			// 用户提供了路径，需要 sanitize
			const result = sanitizePathWithMapping(filePath, mappingManager);
			// 用户提供的路径是相对于 outputDir 的
			finalPath = path.join(outputDir, result.sanitizedPath);
			originalFilename = result.originalFilename;
			sanitizedFilename = result.sanitizedFilename;
		} else {
			// 使用默认路径
			switch (mode) {
				case "block":
					if (!blockPath) {
						throw new Error(
							"Block 模式下必须提供 blockPath 或显式传入 filePath",
						);
					}
					// blockPath 可能包含路径分隔符，需要 sanitize 整个路径
					{
						const tabResult = resolveTabName(tabName);
						if (tabResult.isFilename) {
							// 如果是文件名，直接使用 blockPath/tabName（文件名不需要 sanitize）
							const originalBlockPath = `${blockPath}/${tabResult.filename}`;
							const result = sanitizePathWithMapping(
								originalBlockPath,
								mappingManager,
								true, // skipFilenameSanitize
							);
							finalPath = path.join(outputDir, result.sanitizedPath);
							originalFilename = result.originalFilename;
							sanitizedFilename = result.sanitizedFilename;
						} else {
							// 如果是语言名，需要拼接扩展名
							const originalBlockPath = `${blockPath}${tabResult.extension}`;
							const result = sanitizePathWithMapping(
								originalBlockPath,
								mappingManager,
							);
							finalPath = path.join(outputDir, result.sanitizedPath);
							originalFilename = result.originalFilename;
							sanitizedFilename = result.sanitizedFilename;
						}
					}
					break;
				case "test":
					if (!blockName) {
						throw new Error(
							"Test 模式下必须提供 blockName 或显式传入 filePath",
						);
					}
					// blockName 需要 sanitize
					{
						const tabResult = resolveTabName(tabName);
						if (tabResult.isFilename) {
							// 如果是文件名，使用 test-blockName/tabName
							const originalTestFilename = `test-${blockName}/${tabResult.filename}`;
							const result = sanitizePathWithMapping(
								originalTestFilename,
								mappingManager,
								true, // skipFilenameSanitize
							);
							finalPath = path.join(outputDir, result.sanitizedPath);
							originalFilename = result.originalFilename;
							sanitizedFilename = result.sanitizedFilename;
						} else {
							// 如果是语言名，使用 test-blockName.extension
							const originalTestFilename = `test-${blockName}${tabResult.extension}`;
							const testResult =
								sanitizeFilenameWithOriginal(originalTestFilename);
							sanitizedFilename = testResult.sanitized;
							originalFilename = testResult.original;
							if (mappingManager && testResult.changed) {
								mappingManager.record(originalFilename, sanitizedFilename);
							}
							finalPath = path.join(outputDir, sanitizedFilename);
						}
					}
					break;
				case "page":
					throw new Error("Page 模式下必须显式传入 filePath");
				default:
					throw new Error(`未知模式: ${mode}`);
			}
		}

		// 写入文件
		await fse.outputFile(finalPath, data);
	};
}

/**
 * 清理路径并记录文件名映射
 *
 * @param filePath 文件路径（可以是相对路径或绝对路径）
 * @param mappingManager 文件名映射管理器（可选）
 * @param skipFilenameSanitize 是否跳过文件名的 sanitize（可选，默认 false）
 * @returns 清理后的路径和文件名信息
 */
function sanitizePathWithMapping(
	filePath: string,
	mappingManager?: FilenameMappingManager,
	skipFilenameSanitize = false,
): {
	sanitizedPath: string;
	originalFilename: string;
	sanitizedFilename: string;
} {
	// 标准化路径（处理 .. 和 . 等）
	const normalized = path.normalize(filePath);

	// 分离目录和文件名
	const dir = path.dirname(normalized);
	const originalFilename = path.basename(normalized);

	// 清理文件名（如果不跳过）
	let sanitizedFilename: string;
	if (skipFilenameSanitize) {
		sanitizedFilename = originalFilename;
	} else {
		const filenameResult = sanitizeFilenameWithOriginal(originalFilename);
		sanitizedFilename = filenameResult.sanitized;
		// 记录文件名映射（只记录文件名，不记录完整路径）
		if (mappingManager && filenameResult.changed) {
			mappingManager.record(originalFilename, sanitizedFilename);
		}
	}

	// 如果目录是根目录或当前目录，直接返回清理后的文件名
	if (dir === "." || dir === path.sep) {
		return {
			sanitizedPath: sanitizedFilename,
			originalFilename,
			sanitizedFilename,
		};
	}

	// 清理目录路径的每个部分
	const dirParts = dir.split(path.sep).filter((part) => part !== "");
	const sanitizedDirParts = dirParts.map((part) => sanitizeFilename(part));

	// 重新组合路径
	let sanitizedPath: string;
	if (path.isAbsolute(normalized)) {
		// 绝对路径：保留根分隔符
		sanitizedPath =
			path.sep + path.join(...sanitizedDirParts, sanitizedFilename);
	} else {
		// 相对路径
		sanitizedPath = path.join(...sanitizedDirParts, sanitizedFilename);
	}

	return {
		sanitizedPath,
		originalFilename,
		sanitizedFilename,
	};
}
