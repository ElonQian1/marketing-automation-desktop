// scripts/check_headers.js
// module: root | layer: tooling | role: header-checker
// summary: 强制每个 ts/tsx 文件包含三行标准文件头；路径不匹配则报错

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "src");
const HEADER_RE =
  /^\/\/\s*(?<path>src\/[^\r\n]+)(?:\r?\n)\/\/\s*module:\s*(?<module>[\w-]+)\s*\|\s*layer:\s*(?<layer>[\w-]+)\s*\|\s*role:\s*(?<role>[^\r\n]+)(?:\r?\n)\/\/\s*summary:\s*(?<summary>[^\r\n]+)(?:\r?\n)/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((ent) => {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) return walk(p);
    if (/\.(ts|tsx)$/.test(ent.name)) return [p];
    return [];
  });
}

const files = fs.existsSync(root) ? walk(root) : [];
let bad = 0;

for (const abs of files) {
  const rel = path
    .relative(path.resolve(__dirname, ".."), abs)
    .replace(/\\/g, "/");
  const content = fs.readFileSync(abs, "utf8");
  const m = content.match(HEADER_RE);
  if (!m) {
    console.error(`✗ 缺少/不规范文件头: ${rel}`);
    bad++;
    continue;
  }
  if (m.groups.path.trim() !== rel) {
    console.error(`✗ 文件头路径不匹配: 头=${m.groups.path.trim()} 实际=${rel}`);
    bad++;
  }
}

if (bad > 0) {
  console.error(`\n共 ${bad} 处文件头问题，请修复后再提交。`);
  process.exit(1);
} else {
  console.log(`✓ 文件头检查通过（${files.length} 文件）`);
}
