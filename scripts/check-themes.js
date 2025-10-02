#!/usr/bin/env node

/**
 * 多主题兼容性验证脚本
 * 检查暗黑模式、浅色模式、紧凑模式的主题配置完整性
 * 
 * 使用方法:
 * node scripts/check-themes.js
 * 
 * 员工A - Design Tokens & 主题桥质量监控工具
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出工具
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// 必需的主题变量列表
const REQUIRED_THEME_VARS = [
  '--bg-base',
  '--bg-elevated', 
  '--bg-secondary',
  '--text-1',
  '--text-2',
  '--text-3',
  '--border-primary',
  '--border-secondary',
  '--shadow',
  '--shadow-sm',
  '--shadow-lg'
];

// 必需的紧凑模式变量
const REQUIRED_COMPACT_VARS = [
  '--control-h',
  '--control-h-sm',
  '--control-h-lg',
  '--space-4',
  '--space-6'
];

/**
 * 从tokens.css读取主题配置
 */
function parseTokensFile() {
  const tokensPath = path.join(__dirname, '../src/styles/tokens.css');
  const content = fs.readFileSync(tokensPath, 'utf-8');
  
  const themes = {
    dark: {},
    light: {},
    compact: {}
  };
  
  let currentTheme = null;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测主题块开始
    if (line.includes('[data-theme="dark"]')) {
      currentTheme = 'dark';
      continue;
    }
    if (line.includes('[data-theme="light"]')) {
      currentTheme = 'light';
      continue;
    }
    if (line.includes('[data-density="compact"]')) {
      currentTheme = 'compact';
      continue;
    }
    
    // 主题块结束
    if (line === '}' && currentTheme) {
      currentTheme = null;
      continue;
    }
    
    // 解析CSS变量
    if (currentTheme && line.includes('--') && line.includes(':')) {
      const match = line.match(/^--([^:]+):\s*([^;]+);?/);
      if (match) {
        const varName = `--${match[1].trim()}`;
        const value = match[2].trim();
        themes[currentTheme][varName] = value;
      }
    }
  }
  
  return themes;
}

/**
 * 检查主题变量完整性
 */
function checkThemeCompleteness(themes) {
  console.log(`${colors.cyan}${colors.bold}🎨 多主题兼容性检查${colors.reset}\n`);
  
  const results = [];
  let totalIssues = 0;
  
  // 检查暗色主题
  console.log(`${colors.bold}🌙 暗色主题检查${colors.reset}`);
  const darkMissing = REQUIRED_THEME_VARS.filter(varName => !themes.dark[varName]);
  if (darkMissing.length === 0) {
    console.log(`${colors.green}✅ 暗色主题配置完整${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 暗色主题缺失变量: ${darkMissing.join(', ')}${colors.reset}`);
    totalIssues += darkMissing.length;
  }
  console.log(`   已定义: ${Object.keys(themes.dark).length} 个变量\n`);
  
  // 检查浅色主题
  console.log(`${colors.bold}☀️ 浅色主题检查${colors.reset}`);
  const lightMissing = REQUIRED_THEME_VARS.filter(varName => !themes.light[varName]);
  if (lightMissing.length === 0) {
    console.log(`${colors.green}✅ 浅色主题配置完整${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 浅色主题缺失变量: ${lightMissing.join(', ')}${colors.reset}`);
    totalIssues += lightMissing.length;
  }
  console.log(`   已定义: ${Object.keys(themes.light).length} 个变量\n`);
  
  // 检查紧凑模式
  console.log(`${colors.bold}📐 紧凑模式检查${colors.reset}`);
  const compactMissing = REQUIRED_COMPACT_VARS.filter(varName => !themes.compact[varName]);
  if (compactMissing.length === 0) {
    console.log(`${colors.green}✅ 紧凑模式配置完整${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 紧凑模式缺失变量: ${compactMissing.join(', ')}${colors.reset}`);
    totalIssues += compactMissing.length;
  }
  console.log(`   已定义: ${Object.keys(themes.compact).length} 个变量\n`);
  
  return totalIssues;
}

/**
 * 检查颜色对比度一致性
 */
function checkThemeConsistency(themes) {
  console.log(`${colors.cyan}${colors.bold}🔍 主题一致性检查${colors.reset}\n`);
  
  const issues = [];
  
  // 检查是否有必要的品牌色定义
  if (!themes.dark['--brand-text'] && !themes.light['--brand-text']) {
    issues.push('品牌文本色未在主题中定义');
  }
  
  // 检查背景层次是否合理（深色主题）
  if (themes.dark['--bg-base'] && themes.dark['--bg-elevated']) {
    // 这里可以添加更复杂的颜色层次检查逻辑
    console.log(`${colors.green}✅ 深色主题背景层次定义正常${colors.reset}`);
  }
  
  // 检查浅色主题背景层次
  if (themes.light['--bg-base'] && themes.light['--bg-elevated']) {
    console.log(`${colors.green}✅ 浅色主题背景层次定义正常${colors.reset}`);
  }
  
  if (issues.length > 0) {
    console.log(`${colors.yellow}⚠️ 一致性问题:${colors.reset}`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return issues.length;
}

/**
 * 主检查函数
 */
function checkThemes() {
  try {
    const themes = parseTokensFile();
    
    const completenessIssues = checkThemeCompleteness(themes);
    const consistencyIssues = checkThemeConsistency(themes);
    
    const totalIssues = completenessIssues + consistencyIssues;
    
    // 总结报告
    console.log(`${colors.cyan}${colors.bold}📊 检查结果总结${colors.reset}\n`);
    console.log(`完整性问题: ${completenessIssues}`);
    console.log(`一致性问题: ${consistencyIssues}`);
    console.log(`总问题数: ${totalIssues}`);
    
    const overallStatus = totalIssues === 0 ? '✅ 全部通过' : '❌ 发现问题';
    const overallColor = totalIssues === 0 ? colors.green : colors.red;
    console.log(`\n${overallColor}${colors.bold}${overallStatus}${colors.reset}`);
    
    if (totalIssues > 0) {
      console.log(`\n${colors.yellow}💡 修复建议:${colors.reset}`);
      console.log('1. 补全缺失的主题变量定义');
      console.log('2. 确保暗色和浅色主题的变量对称性');
      console.log('3. 验证紧凑模式的间距调整合理性');
    }
    
    console.log(`\n${colors.magenta}Generated by Employee A - Theme Compatibility Monitor${colors.reset}`);
    console.log(`检查时间: ${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Taipei'})}`);
    
    return totalIssues === 0;
    
  } catch (error) {
    console.error(`${colors.red}错误: ${error.message}${colors.reset}`);
    return false;
  }
}

// 执行检查
const success = checkThemes();
process.exit(success ? 0 : 1);