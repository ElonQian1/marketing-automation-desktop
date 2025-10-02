#!/usr/bin/env node

/* 文件路径：scripts/check-color-contrast.js */

/**
 * 颜色对比度检查脚本
 * 
 * 功能：扫描项目中可能存在的白底白字等可读性问题
 * 检查：
 * 1. 硬编码的浅色背景但没有对应的深色文字
 * 2. 缺少 .light-theme-force 类的浅色容器
 * 3. 内联样式中的颜色对比度问题
 */

import fs from 'fs';
import path from 'path';

// 颜色模式检测
const LIGHT_BACKGROUNDS = [
  '#ffffff', '#fff', 'white',
  '#f8fafc', '#f1f5f9', '#e2e8f0',
  'rgb(255, 255, 255)', 'rgba(255, 255, 255',
  'rgb(248, 250, 252)', 'rgb(241, 245, 249)'
];

const DARK_TEXTS_ON_LIGHT = [
  '#1e293b', '#334155', '#475569',
  'var(--text-inverse)', 'var(--text-1)', 'var(--text-2)'
];

const POTENTIAL_ISSUES = [];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // 检查1：内联样式中的浅色背景
    const backgroundMatch = line.match(/background:\s*(['"]?)([^;'"]+)\1/i);
    if (backgroundMatch) {
      const bgColor = backgroundMatch[2].trim();
      
      if (LIGHT_BACKGROUNDS.some(lightBg => bgColor.includes(lightBg))) {
        // 检查同一行或附近行是否设置了深色文字
        const hasColorSet = line.match(/color:\s*['"]?([^;'"]+)['"]?/i);
        const hasForceClass = line.includes('light-theme-force');
        
        if (!hasColorSet && !hasForceClass) {
          POTENTIAL_ISSUES.push({
            file: filePath,
            line: lineNumber,
            type: 'missing-text-color',
            content: line.trim(),
            suggestion: '为浅色背景添加 className="light-theme-force" 或 color="var(--text-inverse)"'
          });
        }
      }
    }

    // 检查2：Ant Design 组件在浅色容器中但没有主题类
    if (line.includes('style={{') && line.includes('background') && 
        (line.includes('<Title') || line.includes('<Text') || line.includes('<Tag') || 
         line.includes('<Typography'))) {
      
      const hasLightBg = LIGHT_BACKGROUNDS.some(bg => line.includes(bg));
      const hasForceClass = content.substring(0, content.indexOf(line)).includes('light-theme-force');
      
      if (hasLightBg && !hasForceClass) {
        POTENTIAL_ISSUES.push({
          file: filePath,
          line: lineNumber,
          type: 'antd-light-container',
          content: line.trim(),
          suggestion: '为包含 Ant Design 组件的浅色容器添加 className="light-theme-force"'
        });
      }
    }

    // 检查3：硬编码颜色值
    const colorMatch = line.match(/(color|background):\s*['"]?(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))['"]?/g);
    if (colorMatch) {
      colorMatch.forEach(match => {
        if (!match.includes('var(--')) {
          POTENTIAL_ISSUES.push({
            file: filePath,
            line: lineNumber,
            type: 'hardcoded-color',
            content: line.trim(),
            suggestion: '使用 CSS 变量替代硬编码颜色值'
          });
        }
      });
    }
  });
}

// 递归获取文件列表
function getFiles(dir, extensions = ['.tsx', '.jsx', '.ts', '.js']) {
  const files = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过不需要检查的目录
        if (!['node_modules', 'build', 'dist', '.git'].includes(item)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext) && !item.includes('.test.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

function scanProject() {
  console.log('🔍 开始扫描项目中的颜色对比度问题...\n');

  const files = getFiles('./src');
  files.forEach(analyzeFile);

  // 输出结果
  if (POTENTIAL_ISSUES.length === 0) {
    console.log('✅ 未发现明显的颜色对比度问题！');
    return;
  }

  console.log(`❌ 发现 ${POTENTIAL_ISSUES.length} 个潜在的颜色对比度问题：\n`);

  // 按问题类型分组
  const groupedIssues = POTENTIAL_ISSUES.reduce((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
  }, {});

  Object.entries(groupedIssues).forEach(([type, issues]) => {
    const typeNames = {
      'missing-text-color': '❓ 浅色背景缺少文字颜色设置',
      'antd-light-container': '🔧 Ant Design 组件需要主题覆盖',
      'hardcoded-color': '🎨 硬编码颜色值'
    };

    console.log(`\n${typeNames[type]} (${issues.length} 处):`);
    console.log('─'.repeat(60));

    issues.slice(0, 10).forEach(issue => {
      console.log(`📁 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.content}`);
      console.log(`💡 建议：${issue.suggestion}\n`);
    });

    if (issues.length > 10) {
      console.log(`   ... 还有 ${issues.length - 10} 个类似问题\n`);
    }
  });

  console.log('\n📋 修复建议：');
  console.log('1. 为浅色背景容器添加 className="light-theme-force"');
  console.log('2. 使用 CSS 变量：var(--bg-light-base), var(--text-inverse) 等');
  console.log('3. 确保颜色对比度达到 WCAG AA 标准（4.5:1）');
  console.log('4. 参考：docs/品牌化提示词.md 中的颜色规范');
}

// 执行扫描
try {
  scanProject();
} catch (error) {
  console.error('❌ 扫描过程中出错：', error.message);
  process.exit(1);
}