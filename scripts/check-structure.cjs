const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "output", "flyonui.com");

// 检查一个典型页面的结构
const samplePages = [
	"blocks/marketing-ui/hero-section",
	"blocks/dashboard-and-application/charts-component",
	"blocks/bento-grid/bento-grid",
];

console.log("🔍 检查页面目录结构\n");

for (const pagePath of samplePages) {
	const fullPath = path.join(outputDir, pagePath);

	if (!fs.existsSync(fullPath)) {
		console.log(`❌ ${pagePath} - 不存在`);
		continue;
	}

	console.log(`\n📂 ${pagePath}`);

	const entries = fs.readdirSync(fullPath, { withFileTypes: true });
	const dirs = entries.filter((e) => e.isDirectory());
	const files = entries.filter((e) => e.isFile());

	console.log(`   直接子目录数: ${dirs.length}`);
	console.log(`   直接文件数: ${files.length}`);

	if (dirs.length > 0) {
		console.log(`   前 5 个子目录:`);
		dirs.slice(0, 5).forEach((dir) => {
			const subPath = path.join(fullPath, dir.name);
			const subFiles = fs.readdirSync(subPath);
			console.log(`      - ${dir.name}/ (${subFiles.length} files)`);
		});
	}

	if (files.length > 0) {
		console.log(`   直接文件: ${files.map((f) => f.name).join(", ")}`);
	}
}

