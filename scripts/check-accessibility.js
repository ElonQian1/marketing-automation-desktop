#!/usr/bin/env node

/**
 * 无障碍性检查脚本 - 颜色对比度验证
 * 用于检验Design Tokens是否符合WCAG 2.1 AA标准
 * 
 * 使用方法:
 * node scripts/check-accessibility.js
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

// WCAG 2.1 AA标准对比度要求
const WCAG_STANDARDS = {
  AA_NORMAL: 4.5,    // 普通文本
  AA_LARGE: 3.0,     // 大文本（18pt+或14pt粗体+）
  AAA_NORMAL: 7.0,   // AAA级普通文本
  AAA_LARGE: 4.5     // AAA级大文本
};

// 主要的颜色组合检查列表
const COLOR_COMBINATIONS = [
  // 深色主题检查
  { name: '主文本/深色背景', fg: '#F8FAFC', bg: '#0F172A', context: 'normal' },
  { name: '次级文本/深色背景', fg: '#E2E8F0', bg: '#0F172A', context: 'normal' },
  { name: '三级文本/深色背景', fg: '#CBD5E1', bg: '#0F172A', context: 'normal' },
  { name: '静音文本/深色背景', fg: '#94A3B8', bg: '#0F172A', context: 'normal' },
  
  // 浮层面板
  { name: '主文本/浮层背景', fg: '#F8FAFC', bg: '#1E293B', context: 'normal' },
  { name: '次级文本/浮层背景', fg: '#E2E8F0', bg: '#1E293B', context: 'normal' },
  
  // 品牌色组合
  { name: '品牌文本色/深色背景', fg: '#8B9EFF', bg: '#0F172A', context: 'normal' },
  { name: '白色文本/品牌色背景', fg: '#FFFFFF', bg: '#4A5FD1', context: 'normal' },
  
  // 状态色组合
  { name: '成功色/深色背景', fg: '#10B981', bg: '#0F172A', context: 'normal' },
  { name: '警告色/深色背景', fg: '#F59E0B', bg: '#0F172A', context: 'normal' },
  { name: '错误色/深色背景', fg: '#EF4444', bg: '#0F172A', context: 'normal' },
  { name: '信息色/深色背景', fg: '#3B82F6', bg: '#0F172A', context: 'normal' },
  
  // 浅色主题检查
  { name: '深色文本/浅色背景', fg: '#1E293B', bg: '#FFFFFF', context: 'normal' },
  { name: '次级文本/浅色背景', fg: '#334155', bg: '#FFFFFF', context: 'normal' },
  { name: '三级文本/浅色背景', fg: '#475569', bg: '#FFFFFF', context: 'normal' },
];

/**
 * 将十六进制颜色转换为RGB值
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 计算相对亮度
 */
function getLuminance(rgb) {
  const { r, g, b } = rgb;
  
  // 转换为sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  // 应用gamma校正
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // 计算相对亮度
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * 计算对比度
 */
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * 判断对比度是否符合标准
 */
function getComplianceLevel(ratio, context = 'normal') {
  const standards = {
    'AA': context === 'large' ? WCAG_STANDARDS.AA_LARGE : WCAG_STANDARDS.AA_NORMAL,
    'AAA': context === 'large' ? WCAG_STANDARDS.AAA_LARGE : WCAG_STANDARDS.AAA_NORMAL
  };
  
  if (ratio >= standards.AAA) return 'AAA';
  if (ratio >= standards.AA) return 'AA';
  return 'FAIL';
}

/**
 * 主检查函数
 */
function checkAccessibility() {
  console.log(`${colors.cyan}${colors.bold}🔍 Design Tokens 无障碍性检查${colors.reset}\n`);
  console.log(`检查标准: WCAG 2.1 AA (对比度 ≥ 4.5:1 普通文本, ≥ 3.0:1 大文本)\n`);
  
  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  
  COLOR_COMBINATIONS.forEach(combo => {
    const ratio = getContrastRatio(combo.fg, combo.bg);
    const compliance = getComplianceLevel(ratio, combo.context);
    const passed = compliance !== 'FAIL';
    
    if (passed) passedCount++;
    else failedCount++;
    
    // 输出结果
    const statusColor = passed ? colors.green : colors.red;
    const statusIcon = passed ? '✅' : '❌';
    const complianceText = passed ? `${compliance} 级` : 'FAIL';
    
    console.log(`${statusIcon} ${combo.name}`);
    console.log(`   前景: ${combo.fg} | 背景: ${combo.bg}`);
    console.log(`   对比度: ${statusColor}${ratio.toFixed(2)}:1${colors.reset} | 级别: ${statusColor}${complianceText}${colors.reset}`);
    console.log('');
    
    results.push({
      name: combo.name,
      fg: combo.fg,
      bg: combo.bg,
      ratio: ratio.toFixed(2),
      compliance,
      passed
    });
  });
  
  // 总结报告
  console.log(`${colors.cyan}${colors.bold}📊 检查结果总结${colors.reset}\n`);
  console.log(`总检查项: ${COLOR_COMBINATIONS.length}`);
  console.log(`${colors.green}✅ 通过: ${passedCount}${colors.reset}`);
  console.log(`${colors.red}❌ 失败: ${failedCount}${colors.reset}`);
  
  const overallStatus = failedCount === 0 ? '✅ 全部通过' : '❌ 发现问题';
  const overallColor = failedCount === 0 ? colors.green : colors.red;
  console.log(`\n${overallColor}${colors.bold}${overallStatus}${colors.reset}`);
  
  if (failedCount > 0) {
    console.log(`\n${colors.yellow}💡 建议修复:${colors.reset}`);
    console.log('1. 调整失败的颜色组合，增加对比度');
    console.log('2. 考虑为关键文本使用更高对比度的颜色');
    console.log('3. 确保静音文本不用于重要信息显示');
  }
  
  console.log(`\n${colors.magenta}Generated by Employee A - Design Tokens A11y Monitor${colors.reset}`);
  console.log(`检查时间: ${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Taipei'})}`);
  
  return failedCount === 0;
}

// 执行检查
const success = checkAccessibility();
process.exit(success ? 0 : 1);