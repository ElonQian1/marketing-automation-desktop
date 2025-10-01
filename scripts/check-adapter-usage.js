#!/usr/bin/env node
/**
 * 适配层合规检查脚本
 * 规则：页面/模块代码不得直接从 'antd' 或 '@ant-design/icons' 导入，应通过 src/components/adapters 与 UI 层。
 * 扫描范围：src/**/*.{ts,tsx}，排除 adapters、ui、theme、infrastructure、scripts、vendor 等目录。
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const ALLOWED_DIRS = [
  path.join(SRC, 'components', 'adapters'),
  path.join(SRC, 'components', 'ui'),
  path.join(SRC, 'theme'),
  path.join(SRC, 'infrastructure'),
];

const BLOCKED_PACKAGES = new Set(['antd', '@ant-design/icons']);

/** glob-less 递归扫描，避免引入额外依赖 */
function walk(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // 跳过允许直接使用 antd 的目录（adapters/ui/theme/infrastructure）
      if (ALLOWED_DIRS.some((p) => full.startsWith(p))) continue;
      // 跳过常见外部/脚本/测试目录
      if (/node_modules|dist|build|scripts|vendor|__tests__/i.test(full)) continue;
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function checkFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split(/\r?\n/);
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 匹配 import 语句
    const m = line.match(/import\s+[^;]*from\s+['\"]([^'\"]+)['\"];?/);
    if (!m) continue;
    const spec = m[1];
    if (BLOCKED_PACKAGES.has(spec)) {
      violations.push({ line: i + 1, spec, text: line.trim() });
    }
  }

  return violations;
}

function main() {
  const files = walk(SRC, []);
  let total = 0;
  const reports = [];

  for (const f of files) {
    const v = checkFile(f);
    if (v.length > 0) {
      total += v.length;
      reports.push({ file: path.relative(ROOT, f), violations: v });
    }
  }

  if (reports.length === 0) {
    console.log('✅ Adapters compliance: no direct antd/icon usage found outside allowed dirs.');
    process.exit(0);
  }

  console.error('❌ Adapters compliance violations found:');
  for (const r of reports) {
    console.error(`\n- ${r.file}`);
    for (const v of r.violations) {
      console.error(`  L${v.line}: ${v.text}`);
      console.error(`  -> Import from '${v.spec}' is not allowed here. Use components/adapters instead.`);
    }
  }
  console.error(`\nTotal violations: ${total}`);
  process.exit(1);
}

if (require.main === module) {
  main();
}
