const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "output", "flyonui.com");
const progressFile = path.join(
	__dirname,
	"..",
	".crawler",
	"flyonui.com",
	"progress.json",
);

console.log("🔍 详细分析 progress.json 与实际输出的差异\n");

// 读取 progress.json
const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
console.log(`📄 progress.json 记录: ${progress.completedBlocks.length} 个 Block\n`);

// 检查每个记录的 Block 是否实际存在
let existCount = 0;
let missingCount = 0;
const missingBlocks = [];

for (const blockPath of progress.completedBlocks) {
	const fullPath = path.join(outputDir, blockPath);
	if (fs.existsSync(fullPath)) {
		existCount++;
	} else {
		missingCount++;
		missingBlocks.push(blockPath);
	}
}

console.log("✅ 实际存在的 Block:", existCount);
console.log("❌ 已丢失的 Block:", missingCount);

if (missingBlocks.length > 0) {
	console.log("\n🚨 已丢失的 Block（前 20 个）:");
	missingBlocks.slice(0, 20).forEach((block) => console.log(`   - ${block}`));
}

// 扫描实际存在的所有 Block 目录
console.log("\n📂 扫描实际输出目录...");
const actualBlocks = [];

function scanBlocks(dir, relativePath = "") {
	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const fullPath = path.join(dir, entry.name);
				const relPath = relativePath
					? `${relativePath}/${entry.name}`
					: entry.name;

				// 检查是否是 Block 目录（包含组件文件）
				try {
					const files = fs.readdirSync(fullPath);
					const hasComponentFile = files.some(
						(f) =>
							f.endsWith(".js") ||
							f.endsWith(".html") ||
							f.endsWith(".css") ||
							f.endsWith(".ts") ||
							f.endsWith(".tsx"),
					);

					if (hasComponentFile) {
						actualBlocks.push(relPath.replace(/\\/g, "/"));
					} else {
						// 继续递归
						scanBlocks(fullPath, relPath);
					}
				} catch {
					// 可能是权限问题，跳过
				}
			}
		}
	} catch (err) {
		console.error("扫描错误:", dir, err.message);
	}
}

scanBlocks(outputDir);

console.log(`✅ 实际存在的 Block 总数: ${actualBlocks.length}`);

// 找出实际存在但未记录在 progress.json 中的 Block
const recordedSet = new Set(progress.completedBlocks);
const notRecorded = actualBlocks.filter((block) => !recordedSet.has(block));

console.log(`\n📝 实际存在但未在 progress.json 中记录的 Block: ${notRecorded.length}`);
if (notRecorded.length > 0) {
	console.log("前 20 个:");
	notRecorded.slice(0, 20).forEach((block) => console.log(`   - ${block}`));
}

console.log("\n📊 总结:");
console.log(`   progress.json 记录: ${progress.completedBlocks.length}`);
console.log(`   实际存在（与记录匹配）: ${existCount}`);
console.log(`   实际存在（总数）: ${actualBlocks.length}`);
console.log(`   丢失: ${missingCount}`);
console.log(`   未记录: ${notRecorded.length}`);
console.log(
	`   \n   正确的已完成数应该是: ${actualBlocks.length}（实际扫描结果）`,
);

