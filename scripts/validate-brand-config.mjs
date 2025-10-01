#!/usr/bin/env node
/**
 * 品牌化重构配置验证脚本
 * 
 * 验证项目配置是否符合新的品牌化架构要求：
 * 1. 检查设计令牌文件是否存在
 * 2. 验证 Tailwind 配置是否正确
 * 3. 检查必要的品牌化组件是否已创建
 * 4. 验证旧主题覆盖是否已清理
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 颜色输出工具
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}!${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// 检查文件是否存在
function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`${description}: ${filePath}`);
    return true;
  } else {
    log.error(`缺少 ${description}: ${filePath}`);
    return false;
  }
}

// 检查目录是否存在
function checkDirectory(dirPath, description) {
  const fullPath = path.join(projectRoot, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    log.success(`${description}: ${dirPath}`);
    return true;
  } else {
    log.error(`缺少 ${description}: ${dirPath}`);
    return false;
  }
}

// 检查文件内容是否包含指定文本
function checkFileContent(filePath, searchText, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes(searchText)) {
      log.success(`${description}已配置`);
      return true;
    } else {
      log.warning(`${description}可能未配置正确`);
      return false;
    }
  } else {
    log.error(`文件不存在: ${filePath}`);
    return false;
  }
}

// 检查旧文件是否已清理
function checkLegacyCleanup(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    log.success(`已清理 ${description}: ${filePath}`);
    return true;
  } else {
    log.warning(`仍存在旧文件 ${description}: ${filePath}`);
    return false;
  }
}

async function validateBrandConfiguration() {
  console.log(`${colors.bold}🎨 品牌化重构配置验证${colors.reset}\n`);
  
  let totalChecks = 0;
  let passedChecks = 0;

  // 1. 检查设计令牌系统
  log.header('📋 设计令牌系统');
  totalChecks++;
  if (checkFile('src/styles/tokens.css', '设计令牌文件')) passedChecks++;
  
  totalChecks++;
  if (checkFileContent('src/styles/tokens.css', '--brand:', '品牌色彩令牌')) passedChecks++;
  
  totalChecks++;
  if (checkFileContent('tailwind.config.js', 'var(--', 'Tailwind CSS 令牌集成')) passedChecks++;

  // 2. 检查组件库
  log.header('🧩 品牌化组件库');
  
  const coreComponents = [
    ['src/components/ui/button/Button.tsx', '按钮组件'],
    ['src/components/ui/card/Card.tsx', '卡片组件'],
    ['src/components/ui/dialog/Dialog.tsx', '对话框组件'],
    ['src/components/ui/motion/index.ts', '动画系统'],
    ['src/components/adapters/table/TableAdapter.tsx', '表格适配器'],
    ['src/components/adapters/form/FormAdapter.tsx', '表单适配器'],
  ];

  coreComponents.forEach(([filePath, description]) => {
    totalChecks++;
    if (checkFile(filePath, description)) passedChecks++;
  });

  // 3. 检查高曝光模式组件
  log.header('⭐ 高曝光模式组件');
  
  const patternComponents = [
    ['src/components/patterns/filter-bar/FilterBar.tsx', '筛选栏组件'],
    ['src/components/patterns/header-bar/HeaderBar.tsx', '页面头部组件'],
    ['src/components/patterns/empty-state/EmptyState.tsx', '空状态组件'],
    ['src/components/patterns/marketplace-card/MarketplaceCard.tsx', '营销卡片组件'],
  ];

  patternComponents.forEach(([filePath, description]) => {
    totalChecks++;
    if (checkFile(filePath, description)) passedChecks++;
  });

  // 4. 检查主题系统
  log.header('🎨 主题系统');
  
  totalChecks++;
  if (checkFile('src/theme/ThemeBridge.tsx', '主题桥接组件')) passedChecks++;
  
  totalChecks++;
  if (checkFileContent('src/theme/ThemeBridge.tsx', 'darkAlgorithm', 'AntD 暗色主题配置')) passedChecks++;

  // 5. 检查旧文件清理
  log.header('🧹 旧文件清理');
  
  const legacyFiles = [
    ['src/styles/dark-theme.css', '旧暗色主题'],
    ['src/styles/enhanced-theme.css', '旧增强主题'],
    ['src/styles/modern.css', '旧现代主题'],
    ['src/styles/surfaces/', '旧表面样式目录'],
    ['src/styles/design-system/', '旧设计系统目录'],
  ];

  legacyFiles.forEach(([filePath, description]) => {
    totalChecks++;
    if (checkLegacyCleanup(filePath, description)) passedChecks++;
  });

  // 6. 检查样式文件清理
  log.header('📄 样式文件更新');
  
  totalChecks++;
  if (checkFileContent('src/style.css', '@import "./styles/tokens.css"', '设计令牌导入')) passedChecks++;
  
  totalChecks++;
  if (checkFileContent('src/style.css', '@import "tailwindcss/preflight"', 'Tailwind v4 语法')) passedChecks++;

  // 7. 检查配置文件
  log.header('⚙️  配置文件');
  
  totalChecks++;
  if (checkFileContent('package.json', 'tailwindcss', 'Tailwind CSS 依赖')) passedChecks++;
  
  totalChecks++;
  if (checkFileContent('package.json', 'framer-motion', 'Framer Motion 依赖')) passedChecks++;
  
  totalChecks++;
  if (checkFileContent('package.json', '@radix-ui', 'Radix UI 依赖')) passedChecks++;

  // 输出结果
  log.header('📊 验证结果');
  
  const successRate = Math.round((passedChecks / totalChecks) * 100);
  
  if (successRate >= 90) {
    log.success(`验证通过: ${passedChecks}/${totalChecks} (${successRate}%)`);
    log.success('🎉 品牌化重构配置完整，可以开始使用新组件！');
  } else if (successRate >= 70) {
    log.warning(`部分完成: ${passedChecks}/${totalChecks} (${successRate}%)`);
    log.warning('⚠️  某些配置可能需要调整，请检查上方的警告项');
  } else {
    log.error(`需要修复: ${passedChecks}/${totalChecks} (${successRate}%)`);
    log.error('❌ 品牌化配置不完整，请先完成缺失的组件和配置');
  }

  console.log('\n');
  
  // 使用建议
  if (successRate >= 90) {
    log.info('💡 下一步：开始在页面中使用新的品牌化组件');
    console.log('   - 使用 HeaderBar 替换页面标题');
    console.log('   - 使用 FilterBar 替换搜索和筛选功能');
    console.log('   - 使用 TableAdapter/FormAdapter 替换 AntD 原生组件');
    console.log('   - 使用 MarketplaceCard 展示业务数据');
  }
  
  return successRate >= 70;
}

// 运行验证
validateBrandConfiguration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log.error(`验证过程出错: ${error.message}`);
    process.exit(1);
  });