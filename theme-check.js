#!/usr/bin/env node

/**
 * 主题检查工具 - 自动扫描项目中的内联样式使用情况
 * 帮助识别需要转换为原生 Ant Design 主题的页面
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

// 需要检查的样式模式
const inlineStylePatterns = [
  /style\s*=\s*\{\{[^}]+\}\}/g,
  /padding:\s*['"`]?\d+/g,
  /margin:\s*['"`]?\d+/g,
  /color:\s*['"`]?#[0-9a-fA-F]{3,6}/g,
  /background:\s*['"`]?#[0-9a-fA-F]{3,6}/g,
  /fontSize:\s*['"`]?\d+/g,
];

// 应该转换为 token 的样式映射
const styleConversions = {
  'padding: 24': 'padding: token.paddingLG',
  'padding: 16': 'padding: token.padding',
  'padding: 8': 'padding: token.paddingXS',
  'margin: 24': 'margin: token.marginLG',
  'margin: 16': 'margin: token.margin',
  'margin: 8': 'margin: token.marginXS',
  'marginBottom: 24': 'marginBottom: token.marginLG',
  'marginBottom: 16': 'marginBottom: token.margin',
  'marginBottom: 8': 'marginBottom: token.marginXS',
  "color: '#1890ff'": 'color: token.colorPrimary',
  "color: '#52c41a'": 'color: token.colorSuccess',
  "color: '#faad14'": 'color: token.colorWarning',
  "color: '#ff4d4f'": 'color: token.colorError',
  "background: '#f0f2f5'": 'background: token.colorBgLayout',
  "background: '#fff'": 'background: token.colorBgContainer',
  'fontSize: 16': 'fontSize: token.fontSizeLG',
  'fontSize: 14': 'fontSize: token.fontSize',
  'fontSize: 12': 'fontSize: token.fontSizeSM',
};

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 检查是否使用了 theme.useToken()
    const hasThemeImport = content.includes('theme') && content.includes('antd');
    const hasUseToken = content.includes('useToken');
    
    // 查找内联样式
    let matchCount = 0;
    inlineStylePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matchCount += matches.length;
      }
    });
    
    if (matchCount > 0) {
      issues.push({
        type: 'inline-styles',
        count: matchCount,
        hasTheme: hasThemeImport,
        hasUseToken: hasUseToken,
        file: filePath
      });
    }
    
    return issues;
  } catch (error) {
    console.error(`无法读取文件 ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir, issues = []) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和其他不需要检查的目录
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          scanDirectory(fullPath, issues);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        // 只检查 TypeScript/React 文件
        const fileIssues = scanFile(fullPath);
        issues.push(...fileIssues);
      }
    }
  } catch (error) {
    console.error(`无法扫描目录 ${dir}:`, error.message);
  }
  
  return issues;
}

function generateReport(issues) {
  console.log('\n🎨 Ant Design 5 主题检查报告');
  console.log('==========================================\n');
  
  if (issues.length === 0) {
    console.log('✅ 太棒了！没有发现需要优化的内联样式。');
    return;
  }
  
  // 按文件分组
  const fileGroups = {};
  issues.forEach(issue => {
    const relativePath = path.relative(process.cwd(), issue.file);
    if (!fileGroups[relativePath]) {
      fileGroups[relativePath] = [];
    }
    fileGroups[relativePath].push(issue);
  });
  
  // 按优先级排序（内联样式多的文件优先）
  const sortedFiles = Object.entries(fileGroups).sort((a, b) => {
    const aCount = a[1].reduce((sum, issue) => sum + issue.count, 0);
    const bCount = b[1].reduce((sum, issue) => sum + issue.count, 0);
    return bCount - aCount;
  });
  
  console.log(`📊 发现 ${issues.length} 个文件需要主题优化：\n`);
  
  sortedFiles.forEach(([filePath, fileIssues], index) => {
    const totalCount = fileIssues.reduce((sum, issue) => sum + issue.count, 0);
    const hasTheme = fileIssues.some(issue => issue.hasTheme);
    const hasUseToken = fileIssues.some(issue => issue.hasUseToken);
    
    const priority = totalCount >= 10 ? '🔴 高' : totalCount >= 5 ? '🟡 中' : '🟢 低';
    const themeStatus = hasUseToken ? '✅ 已配置' : hasTheme ? '⚠️ 需配置' : '❌ 未导入';
    
    console.log(`${index + 1}. ${filePath}`);
    console.log(`   优先级: ${priority} | 内联样式: ${totalCount} 处 | 主题状态: ${themeStatus}`);
    console.log('');
  });
  
  console.log('\n🛠️ 建议操作：\n');
  console.log('1. 优先处理高优先级文件（内联样式 ≥ 10 处）');
  console.log('2. 为未导入主题的文件添加：import { theme } from "antd"');
  console.log('3. 在组件中添加：const { token } = theme.useToken()');
  console.log('4. 将内联样式转换为使用 token 值');
  console.log('\n常用转换映射：');
  Object.entries(styleConversions).forEach(([old, new_]) => {
    console.log(`   ${old} → ${new_}`);
  });
}

// 主执行函数
function main() {
  console.log('🔍 开始扫描项目中的内联样式...\n');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ 找不到 src 目录，请在项目根目录运行此脚本。');
    process.exit(1);
  }
  
  const issues = scanDirectory(srcDir);
  generateReport(issues);
  
  console.log('\n📝 提示：运行 "npm run theme-check" 可以重新执行此检查。');
}

// 运行检查
main();

export { scanDirectory, generateReport, styleConversions };