#!/usr/bin/env node
/**
 * 品牌重构性能监控脚本
 * 
 * 检查关键指标:
 * - 包体大小 (目标: <5MB)
 * - CSS大小 (目标: <100KB)
 * - 品牌违规检测
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_PATH = path.join(__dirname, '../dist');
const SRC_PATH = path.join(__dirname, '../src');

// 性能目标
const TARGETS = {
  totalSizeMB: 5,
  cssSizeKB: 100,
  maxFileLines: 500
};

async function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const { size, count } = await getDirectorySize(fullPath);
        totalSize += size;
        fileCount += count;
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
        fileCount++;
      }
    }
  } catch (err) {
    console.warn(`无法读取目录 ${dirPath}:`, err.message);
  }

  return { size: totalSize, count: fileCount };
}

async function getCSSFiles(dirPath) {
  const cssFiles = [];

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const subFiles = await getCSSFiles(fullPath);
        cssFiles.push(...subFiles);
      } else if (item.name.endsWith('.css')) {
        const stats = await fs.stat(fullPath);
        cssFiles.push({
          name: item.name,
          path: fullPath,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100
        });
      }
    }
  } catch (err) {
    console.warn(`无法读取CSS文件 ${dirPath}:`, err.message);
  }

  return cssFiles;
}

async function checkBrandViolations() {
  const violations = [];
  const srcFiles = await fs.readdir(SRC_PATH, { recursive: true });
  
  for (const file of srcFiles) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    
    const filePath = path.join(SRC_PATH, file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // 检查 .ant-* 覆盖
        if (line.includes('.ant-') && !line.includes('//') && !line.includes('/*')) {
          violations.push({
            file: file,
            line: index + 1,
            type: 'ant-override',
            content: line.trim()
          });
        }
      });
    } catch (err) {
      // 忽略读取错误
    }
  }
  
  return violations;
}

async function checkFileSize() {
  const largFiles = [];
  const srcFiles = await fs.readdir(SRC_PATH, { recursive: true });
  
  for (const file of srcFiles) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    
    const filePath = path.join(SRC_PATH, file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lineCount = content.split('\n').length;
      
      if (lineCount > TARGETS.maxFileLines) {
        largFiles.push({
          file: file,
          lines: lineCount,
          overLimit: lineCount - TARGETS.maxFileLines
        });
      }
    } catch (err) {
      // 忽略读取错误
    }
  }
  
  return largFiles;
}

async function main() {
  console.log('🔍 品牌重构性能检查开始...\n');

  // 1. 包体大小检查
  try {
    const { size: totalSize, count: fileCount } = await getDirectorySize(DIST_PATH);
    const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
    
    console.log('📦 包体大小分析:');
    console.log(`   总大小: ${totalSizeMB}MB (目标: <${TARGETS.totalSizeMB}MB)`);
    console.log(`   文件数: ${fileCount}`);
    
    if (totalSizeMB > TARGETS.totalSizeMB) {
      console.log(`   ⚠️  超出目标 ${(totalSizeMB - TARGETS.totalSizeMB).toFixed(2)}MB`);
    } else {
      console.log(`   ✅ 符合目标`);
    }
  } catch (err) {
    console.log('❌ 包体大小检查失败:', err.message);
  }

  console.log();

  // 2. CSS大小检查
  try {
    const cssFiles = await getCSSFiles(DIST_PATH);
    const totalCSSKB = cssFiles.reduce((sum, file) => sum + file.sizeKB, 0);
    
    console.log('🎨 CSS大小分析:');
    console.log(`   CSS总大小: ${totalCSSKB.toFixed(2)}KB (目标: <${TARGETS.cssSizeKB}KB)`);
    console.log(`   CSS文件数: ${cssFiles.length}`);
    
    if (totalCSSKB > TARGETS.cssSizeKB) {
      console.log(`   ⚠️  超出目标 ${(totalCSSKB - TARGETS.cssSizeKB).toFixed(2)}KB`);
      
      console.log('   最大CSS文件:');
      cssFiles
        .sort((a, b) => b.sizeKB - a.sizeKB)
        .slice(0, 5)
        .forEach(file => {
          console.log(`     - ${file.name}: ${file.sizeKB}KB`);
        });
    } else {
      console.log(`   ✅ 符合目标`);
    }
  } catch (err) {
    console.log('❌ CSS大小检查失败:', err.message);
  }

  console.log();

  // 3. 品牌违规检查
  try {
    const violations = await checkBrandViolations();
    
    console.log('🚫 品牌违规检查:');
    console.log(`   发现违规: ${violations.length}处`);
    
    if (violations.length > 0) {
      console.log('   违规详情:');
      violations.slice(0, 10).forEach(violation => {
        console.log(`     - ${violation.file}:${violation.line} - ${violation.content}`);
      });
      
      if (violations.length > 10) {
        console.log(`     ... 还有 ${violations.length - 10} 处违规`);
      }
    } else {
      console.log('   ✅ 无违规发现');
    }
  } catch (err) {
    console.log('❌ 品牌违规检查失败:', err.message);
  }

  console.log();

  // 4. 文件大小检查
  try {
    const largeFiles = await checkFileSize();
    
    console.log('📄 文件大小检查:');
    console.log(`   超大文件: ${largeFiles.length}个 (>${TARGETS.maxFileLines}行)`);
    
    if (largeFiles.length > 0) {
      console.log('   需要拆分:');
      largeFiles
        .sort((a, b) => b.lines - a.lines)
        .slice(0, 5)
        .forEach(file => {
          console.log(`     - ${file.file}: ${file.lines}行 (+${file.overLimit})`);
        });
    } else {
      console.log('   ✅ 所有文件符合大小要求');
    }
  } catch (err) {
    console.log('❌ 文件大小检查失败:', err.message);
  }

  console.log('\n🔍 性能检查完成');
}

main().catch(console.error);