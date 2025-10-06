/**
 * 阶段1清理脚本 - 移除冗余过滤器文件
 * 
 * 目标：
 * 1. 移除已确认冗余的过滤器文件
 * 2. 更新导入引用到FilterAdapter
 * 3. 清理无用的测试文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧹 开始阶段1清理...');

// 需要删除的冗余文件
const filesToDelete = [
  'src/components/universal-ui/shared/filters/clickableHeuristics.ts',
  'src/components/universal-ui/shared/filters/visualFilter.ts',
  'src/services/xmlPageCacheServiceOld.ts',
  'src/services/xmlPageCacheService-backup.ts',
  'docs/备份文件',
].map(file => path.join(__dirname, '..', file));

// 删除文件
filesToDelete.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`✅ 删除目录: ${path.relative(process.cwd(), filePath)}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`✅ 删除文件: ${path.relative(process.cwd(), filePath)}`);
      }
    } else {
      console.log(`ℹ️  文件不存在: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.log(`⚠️  删除失败 (${error.code}): ${path.relative(process.cwd(), filePath)}`);
  }
});

// 检查需要更新导入的文件
const filesToCheck = [
  'src/components/**/*.tsx',
  'src/components/**/*.ts', 
  'src/pages/**/*.tsx',
  'src/pages/**/*.ts',
];

console.log('\n📋 需要手动检查的导入文件：');
console.log('使用命令查找旧导入引用：');
console.log('npm run check:legacy-imports');

console.log('\n✅ 阶段1清理完成！');
console.log('\n📋 后续步骤：');
console.log('1. 运行 npm run check:legacy-imports 检查剩余引用');
console.log('2. 手动更新发现的导入到使用 FilterAdapter');
console.log('3. 运行 npm run type-check 验证无编译错误');
console.log('4. 继续阶段2清理（大文件拆分）');