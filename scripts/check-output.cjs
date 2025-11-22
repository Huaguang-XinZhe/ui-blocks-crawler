const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "output", "flyonui.com");

console.log("检查输出目录:", outputDir);
console.log("目录是否存在:", fs.existsSync(outputDir));

if (!fs.existsSync(outputDir)) {
	console.log("❌ 输出目录不存在！");
	process.exit(0);
}

// 递归统计文件和目录
function countFilesAndDirs(dir) {
	let fileCount = 0;
	let dirCount = 0;
	let blockDirs = [];

	function scan(currentDir) {
		try {
			const entries = fs.readdirSync(currentDir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(currentDir, entry.name);

				if (entry.isDirectory()) {
					dirCount++;
					// 检查是否是 block 目录（包含 Hero、Features 等）
					if (
						/^(Hero|Features|Pricing|Testimonial|Social Proof|CTA|Error|Widget|Chart|Table|Stat|Profile|Dashboard|Application|Setting|Sign|Data Table|Progress|Timeline|Notification|Badge|Navigation|Footer|Header) \d+/.test(
							entry.name,
						)
					) {
						const relativePath = path
							.relative(outputDir, fullPath)
							.replace(/\\/g, "/");
						blockDirs.push(relativePath);
					}
					scan(fullPath);
				} else {
					fileCount++;
				}
			}
		} catch (err) {
			console.error("扫描错误:", currentDir, err.message);
		}
	}

	scan(dir);
	return { fileCount, dirCount, blockDirs };
}

const { fileCount, dirCount, blockDirs } = countFilesAndDirs(outputDir);

console.log("\n📊 统计结果:");
console.log(`   文件数: ${fileCount}`);
console.log(`   目录数: ${dirCount}`);
console.log(`   Block 目录数: ${blockDirs.length}`);

if (blockDirs.length > 0) {
	console.log("\n📦 前 10 个 Block 目录:");
	blockDirs.slice(0, 10).forEach((dir) => console.log(`   - ${dir}`));
}

// 检查几个已知的 block 是否存在
console.log("\n🔍 检查已知 Block 是否存在:");
const knownBlocks = [
	"blocks/marketing-ui/hero-section/Hero 10",
	"blocks/marketing-ui/features-section/Features 11",
	"blocks/marketing-ui/social-proof/Social Proof 2",
];

knownBlocks.forEach((block) => {
	const fullPath = path.join(outputDir, block);
	const exists = fs.existsSync(fullPath);
	console.log(`   ${exists ? "✅" : "❌"} ${block}`);

	if (exists) {
		const files = fs.readdirSync(fullPath);
		console.log(`      文件: ${files.join(", ")}`);
	}
});

// 读取 progress.json 统计
const progressFile = path.join(
	__dirname,
	"..",
	".crawler",
	"flyonui.com",
	"progress.json",
);
if (fs.existsSync(progressFile)) {
	const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
	console.log("\n📄 progress.json 统计:");
	console.log(`   记录的 Block 数: ${progress.completedBlocks.length}`);
	console.log(`   记录的 Page 数: ${progress.completedPages.length}`);
}

