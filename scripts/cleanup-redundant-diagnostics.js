#!/usr/bin/env node
/**
 * 设备监听架构立即清理脚本
 * 移除冗余代码，保持新架构
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

// 1. 要删除的冗余诊断工具文件
const REDUNDANT_FILES = [
  'src/application/services/device-watching/DeviceWatchingDiagnostics.ts',
  'src/application/services/device-watching/CallbackChainDiagnostics.ts', 
  'src/application/services/device-watching/DeviceListeningChainFixer.ts',
  'src/application/services/device-watching/DeviceChangeDetector.ts'
];

// 2. 要清理导入的文件
const FILES_TO_CLEAN_IMPORTS = [
  'src/application/services/AdbApplicationService.ts',
  'src/application/hooks/useAdb.ts'
];

// 3. 要移除的导入语句
const IMPORTS_TO_REMOVE = [
  "import { deviceWatchingDiagnostics } from './device-watching/DeviceWatchingDiagnostics';",
  "import { callbackChainDiagnostics } from './device-watching/CallbackChainDiagnostics';",
  "import { deviceChangeDetector } from './device-watching/DeviceChangeDetector';",
  "import { deviceListeningChainFixer } from './device-watching/DeviceListeningChainFixer';"
];

console.log('🧹 开始设备监听架构清理...\n');

// 步骤1: 删除冗余文件
console.log('📁 删除冗余诊断工具文件...');
REDUNDANT_FILES.forEach(file => {
  const fullPath = path.join(PROJECT_ROOT, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`  ❌ 已删除: ${file}`);
  } else {
    console.log(`  ⚠️ 文件不存在: ${file}`);
  }
});

// 步骤2: 清理导入语句
console.log('\n🔗 清理旧版诊断工具导入...');
FILES_TO_CLEAN_IMPORTS.forEach(file => {
  const fullPath = path.join(PROJECT_ROOT, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    let modified = false;
    
    IMPORTS_TO_REMOVE.forEach(importStatement => {
      if (content.includes(importStatement)) {
        content = content.replace(importStatement, '');
        modified = true;
      }
    });
    
    // 移除动态导入
    const dynamicImportPattern = /const\s*\{\s*callbackChainDiagnostics\s*\}\s*=\s*await\s*import\s*\(\s*['"']\.\.\/services\/device-watching\/CallbackChainDiagnostics['"']\s*\)\s*;?/g;
    if (dynamicImportPattern.test(content)) {
      content = content.replace(dynamicImportPattern, '');
      modified = true;
    }
    
    // 移除相关函数调用
    const diagnosticCalls = [
      /deviceWatchingDiagnostics\.performDiagnostic\([^)]*\);?/g,
      /callbackChainDiagnostics\.performDiagnostic\([^)]*\);?/g,
      /deviceChangeDetector\.(start|stop)Monitoring\([^)]*\);?/g,
      /await\s+callbackChainDiagnostics\.performDiagnostic\(\);?/g
    ];
    
    diagnosticCalls.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });
    
    // 清理多余空行
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`  🔧 已清理: ${file}`);
    } else {
      console.log(`  ✅ 无需修改: ${file}`);
    }
  }
});

console.log('\n📊 清理完成统计:');
console.log(`  📁 删除文件: ${REDUNDANT_FILES.length} 个`);
console.log(`  🔧 清理导入: ${FILES_TO_CLEAN_IMPORTS.length} 个文件`);
console.log('\n✅ 设备监听架构清理完成！');
console.log('💡 下一步建议:');
console.log('  1. 运行 npm run type-check 检查类型错误');
console.log('  2. 测试设备自动刷新功能');
console.log('  3. 设置生产环境变量 DEVICE_WATCHING_LOG_LEVEL=1');