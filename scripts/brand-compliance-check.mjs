#!/usr/bin/env node
/**
 * 品牌合规性检查脚本 - 独立版本
 * 不依赖 Tauri 开发服务器，直接分析项目文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 检查结果汇总
const results = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * 输出彩色消息
 */
function logWithColor(message, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
}

/**
 * 检查文件是否存在
 */
function checkFileExists(filePath, description) {
  const fullPath = path.resolve(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    results.passed.push(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: ${filePath} 未找到`);
    return false;
  }
}

/**
 * 检查文件内容
 */
function checkFileContent(filePath, searchPattern, description) {
  const fullPath = path.resolve(projectRoot, filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const regex = new RegExp(searchPattern, 'i');
    if (regex.test(content)) {
      results.passed.push(`✅ ${description}: 在 ${filePath} 中找到模式 "${searchPattern}"`);
      return true;
    } else {
      results.warnings.push(`⚠️ ${description}: 在 ${filePath} 中未找到模式 "${searchPattern}"`);
      return false;
    }
  } catch (error) {
    results.failed.push(`❌ ${description}: 读取文件 ${filePath} 失败 - ${error.message}`);
    return false;
  }
}

/**
 * 检查 Ant Design 版本
 */
function checkAntDesignVersion() {
  const packageJsonPath = path.resolve(projectRoot, 'package.json');
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const antdVersion = packageJson.dependencies?.antd;
    
    if (antdVersion) {
      if (antdVersion.includes('5.')) {
        results.passed.push(`✅ Ant Design 版本检查: ${antdVersion} (v5.x)`);
        return true;
      } else {
        results.warnings.push(`⚠️ Ant Design 版本警告: ${antdVersion} (建议使用 v5.x)`);
        return false;
      }
    } else {
      results.failed.push(`❌ Ant Design 版本检查: package.json 中未找到 antd 依赖`);
      return false;
    }
  } catch (error) {
    results.failed.push(`❌ Ant Design 版本检查: 读取 package.json 失败 - ${error.message}`);
    return false;
  }
}

/**
 * 检查组件架构结构
 */
function checkComponentArchitecture() {
  const architecturePaths = [
    'src/components/layout',
    'src/components/patterns', 
    'src/components/ui',
    'src/components/adapters'
  ];

  let allFound = true;
  architecturePaths.forEach(dirPath => {
    if (!checkFileExists(dirPath, '架构目录')) {
      allFound = false;
    }
  });

  return allFound;
}

/**
 * 检查 Design Tokens 或现有的 UI 组件结构
 */
function checkDesignTokens() {
  const designTokensPaths = [
    'src/components/ui/design-tokens/colors.ts',
    'src/components/ui/design-tokens/typography.ts', 
    'src/components/ui/design-tokens/spacing.ts'
  ];

  // 检查现有的 UI 组件作为替代
  const uiComponentPaths = [
    'src/components/ui/Button.tsx',
    'src/components/ui/CardShell.tsx',
    'src/components/ui/TagPill.tsx'
  ];

  let tokensFound = 0;
  let uiComponentsFound = 0;

  designTokensPaths.forEach(tokenPath => {
    if (checkFileExists(tokenPath, 'Design Tokens')) {
      tokensFound++;
    }
  });

  uiComponentPaths.forEach(componentPath => {
    if (checkFileExists(componentPath, 'UI 组件')) {
      uiComponentsFound++;
    }
  });

  if (tokensFound >= 2) {
    results.passed.push(`✅ Design Tokens 系统: 找到 ${tokensFound}/${designTokensPaths.length} 个 token 文件`);
    return true;
  } else if (uiComponentsFound >= 2) {
    results.passed.push(`✅ UI 组件系统: 找到 ${uiComponentsFound}/${uiComponentPaths.length} 个核心组件`);
    return true;
  } else {
    results.warnings.push(`⚠️ Design Tokens/UI 组件系统: Token ${tokensFound}/${designTokensPaths.length}, 组件 ${uiComponentsFound}/${uiComponentPaths.length}`);
    return false;
  }
}

/**
 * 检查关键页面组件
 */
function checkKeyPageComponents() {
  const keyComponents = [
    'src/pages/BrandShowcasePage.tsx',
    'src/pages/DeviceManagementPageBrandNew.tsx', 
    'src/pages/EmployeePage.refactored.tsx'
  ];

  let componentsFound = 0;
  keyComponents.forEach(component => {
    if (checkFileExists(component, '关键页面组件')) {
      componentsFound++;
    }
  });

  return componentsFound === keyComponents.length;
}

/**
 * 检查品牌重构导入语句
 */
function checkBrandImports() {
  const filesToCheck = [
    {
      path: 'src/pages/BrandShowcasePage.tsx',
      patterns: [
        'from.*components/layout',
        'from.*components/ui', 
        'import.*motion.*from.*framer-motion'
      ]
    }
  ];

  let importsValid = true;
  filesToCheck.forEach(({ path: filePath, patterns }) => {
    patterns.forEach(pattern => {
      if (!checkFileContent(filePath, pattern, '品牌重构导入检查')) {
        importsValid = false;
      }
    });
  });

  return importsValid;
}

/**
 * 主检查函数
 */
async function runComplianceCheck() {
  logWithColor('\n🔍 开始品牌合规性检查...', 'blue');
  logWithColor('=' .repeat(50), 'blue');

  // 执行各项检查
  checkAntDesignVersion();
  checkComponentArchitecture();
  checkDesignTokens();
  checkKeyPageComponents();
  checkBrandImports();

  // 输出结果
  logWithColor('\n📊 检查结果汇总:', 'blue');
  logWithColor('=' .repeat(50), 'blue');

  if (results.passed.length > 0) {
    logWithColor('\n✅ 通过项目:', 'green');
    results.passed.forEach(item => console.log(`  ${item}`));
  }

  if (results.warnings.length > 0) {
    logWithColor('\n⚠️ 警告项目:', 'yellow');
    results.warnings.forEach(item => console.log(`  ${item}`));
  }

  if (results.failed.length > 0) {
    logWithColor('\n❌ 失败项目:', 'red');
    results.failed.forEach(item => console.log(`  ${item}`));
  }

  // 最终评估
  const totalChecks = results.passed.length + results.warnings.length + results.failed.length;
  const passRate = (results.passed.length / totalChecks * 100).toFixed(1);

  logWithColor('\n' + '=' .repeat(50), 'blue');
  logWithColor(`总计检查项目: ${totalChecks}`, 'blue');
  logWithColor(`通过: ${results.passed.length} | 警告: ${results.warnings.length} | 失败: ${results.failed.length}`, 'blue');
  logWithColor(`合规率: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');

  if (results.failed.length === 0 && results.warnings.length <= 2) {
    logWithColor('\n🎉 品牌合规性检查通过！', 'green');
    process.exit(0);
  } else if (results.failed.length === 0) {
    logWithColor('\n⚠️ 品牌合规性检查基本通过，但有警告项需要关注', 'yellow');
    process.exit(0);
  } else {
    logWithColor('\n❌ 品牌合规性检查未通过，请修复失败项目', 'red');
    process.exit(1);
  }
}

// 执行检查
runComplianceCheck().catch(error => {
  logWithColor(`\n❌ 检查过程中发生错误: ${error.message}`, 'red');
  process.exit(1);
});