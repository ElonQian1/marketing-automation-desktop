#!/usr/bin/env node
/**
 * 扫描脚本：检测项目中的 .ant-* 覆盖和 !important 规则
 * 
 * 用途：
 * 1. 扫描所有 CSS 文件中的 .ant-* 选择器覆盖
 * 2. 扫描所有 !important 声明
 * 3. 生成清理报告
 * 4. 确保 Design Tokens 系统的纯净性
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}!${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`),
  detail: (msg) => console.log(`  ${colors.magenta}→${colors.reset} ${msg}`)
};

// 扫描配置
const SCAN_EXTENSIONS = ['.css', '.scss', '.less', '.tsx', '.jsx', '.ts', '.js'];
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.nyc_output',
  'deprecated-theme-overrides', // 已移动到废弃目录的文件跳过
];

// 正则表达式
const ANT_SELECTOR_REGEX = /\.ant-[a-zA-Z0-9_-]+/g;
const IMPORTANT_REGEX = /!important/g;
const INLINE_STYLE_IMPORTANT = /style\s*=\s*["']([^"']*!important[^"']*)["']/g;

// 结果统计
let totalFilesScanned = 0;
let antOverrides = [];
let importantRules = [];
let cleanFiles = [];

/**
 * 检查文件是否应该被排除
 */
function shouldExcludeFile(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return EXCLUDE_PATTERNS.some(pattern => normalizedPath.includes(pattern));
}

/**
 * 检查文件扩展名是否需要扫描
 */
function shouldScanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SCAN_EXTENSIONS.includes(ext);
}

/**
 * 扫描单个文件
 */
function scanFile(filePath) {
  if (shouldExcludeFile(filePath) || !shouldScanFile(filePath)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(projectRoot, filePath);
    
    totalFilesScanned++;

    // 检查 .ant-* 选择器
    const antMatches = content.match(ANT_SELECTOR_REGEX);
    if (antMatches) {
      const lines = content.split('\n');
      const violations = [];

      antMatches.forEach(match => {
        const lineIndex = lines.findIndex(line => line.includes(match));
        if (lineIndex !== -1) {
          violations.push({
            selector: match,
            line: lineIndex + 1,
            content: lines[lineIndex].trim()
          });
        }
      });

      if (violations.length > 0) {
        antOverrides.push({
          file: relativePath,
          violations: violations
        });
      }
    }

    // 检查 !important 规则
    const importantMatches = content.match(IMPORTANT_REGEX);
    if (importantMatches) {
      const lines = content.split('\n');
      const violations = [];

      lines.forEach((line, index) => {
        if (line.includes('!important')) {
          violations.push({
            line: index + 1,
            content: line.trim()
          });
        }
      });

      if (violations.length > 0) {
        importantRules.push({
          file: relativePath,
          violations: violations
        });
      }
    }

    // 检查内联样式中的 !important
    const inlineMatches = content.match(INLINE_STYLE_IMPORTANT);
    if (inlineMatches) {
      const lines = content.split('\n');
      const violations = [];

      inlineMatches.forEach(match => {
        const lineIndex = lines.findIndex(line => line.includes(match));
        if (lineIndex !== -1) {
          violations.push({
            line: lineIndex + 1,
            content: lines[lineIndex].trim(),
            type: 'inline-style'
          });
        }
      });

      if (violations.length > 0) {
        if (!importantRules.find(item => item.file === relativePath)) {
          importantRules.push({
            file: relativePath,
            violations: violations
          });
        } else {
          importantRules.find(item => item.file === relativePath).violations.push(...violations);
        }
      }
    }

    // 记录干净的文件
    if (!antMatches && !importantMatches && !inlineMatches) {
      cleanFiles.push(relativePath);
    }

  } catch (error) {
    log.error(`扫描文件失败: ${filePath} - ${error.message}`);
  }
}

/**
 * 递归扫描目录
 */
function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!shouldExcludeFile(fullPath)) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    log.error(`扫描目录失败: ${dirPath} - ${error.message}`);
  }
}

/**
 * 生成扫描报告
 */
function generateReport() {
  log.header('🔍 Design Tokens 纯净性扫描报告');
  
  log.info(`扫描文件总数: ${totalFilesScanned}`);
  log.info(`干净文件数量: ${cleanFiles.length}`);
  
  // .ant-* 选择器覆盖报告
  log.header(`📋 .ant-* 选择器覆盖检测`);
  if (antOverrides.length === 0) {
    log.success('未发现 .ant-* 选择器覆盖 🎉');
  } else {
    log.error(`发现 ${antOverrides.length} 个文件包含 .ant-* 覆盖:`);
    
    antOverrides.forEach(({ file, violations }) => {
      log.detail(`${file} (${violations.length} 个违规)`);
      violations.forEach(({ selector, line, content }) => {
        console.log(`    ${colors.yellow}Line ${line}:${colors.reset} ${selector} - ${content}`);
      });
    });
  }

  // !important 规则报告
  log.header(`⚠️  !important 规则检测`);
  if (importantRules.length === 0) {
    log.success('未发现 !important 规则 🎉');
  } else {
    log.error(`发现 ${importantRules.length} 个文件包含 !important 规则:`);
    
    importantRules.forEach(({ file, violations }) => {
      log.detail(`${file} (${violations.length} 个违规)`);
      violations.forEach(({ line, content, type }) => {
        const typeLabel = type === 'inline-style' ? '[内联样式]' : '[CSS规则]';
        console.log(`    ${colors.yellow}Line ${line}:${colors.reset} ${typeLabel} ${content}`);
      });
    });
  }

  // 总结
  log.header('📊 扫描总结');
  const totalViolations = antOverrides.length + importantRules.length;
  
  if (totalViolations === 0) {
    log.success('🎉 恭喜！项目完全符合 Design Tokens 规范！');
    log.info('💡 所有样式都通过设计令牌系统管理，品牌一致性得到保障');
    return true;
  } else {
    log.error(`❌ 发现 ${totalViolations} 个文件存在违规，需要清理`);
    log.warning('💡 建议操作:');
    if (antOverrides.length > 0) {
      console.log('   - 移除所有 .ant-* 选择器覆盖');
      console.log('   - 使用 ThemeBridge ConfigProvider 替代');
    }
    if (importantRules.length > 0) {
      console.log('   - 移除所有 !important 声明');
      console.log('   - 通过架构调整解决样式优先级问题');
    }
    return false;
  }
}

/**
 * 生成清理建议
 */
function generateCleanupSuggestions() {
  if (antOverrides.length === 0 && importantRules.length === 0) return;

  log.header('🛠️  清理建议');
  
  console.log('为了保持 Design Tokens 系统的纯净性，建议采取以下措施:\n');
  
  console.log('1. 📁 移动违规文件到废弃目录:');
  console.log('   mkdir -p src/styles/deprecated-theme-overrides/violations');
  
  const allViolationFiles = new Set([
    ...antOverrides.map(item => item.file),
    ...importantRules.map(item => item.file)
  ]);
  
  allViolationFiles.forEach(file => {
    console.log(`   mv "${file}" "src/styles/deprecated-theme-overrides/violations/"`);
  });
  
  console.log('\n2. 🔧 使用正确的替代方案:');
  console.log('   - .ant-* 覆盖 → ThemeBridge ConfigProvider');
  console.log('   - !important → CSS 层级架构调整');
  console.log('   - 硬编码颜色 → CSS 变量 (var(--brand) 等)');
  
  console.log('\n3. ✅ 验证清理结果:');
  console.log('   npm run scan:overrides');
  console.log('   npm run validate:brand');
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  
  console.log(`${colors.bold}🎨 Design Tokens 纯净性扫描器${colors.reset}\n`);
  
  // 开始扫描
  log.info('开始扫描项目文件...');
  scanDirectory(path.join(projectRoot, 'src'));
  
  // 生成报告
  const isClean = generateReport();
  
  // 如果不干净，提供清理建议
  if (!isClean) {
    generateCleanupSuggestions();
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n⏱️  扫描完成，耗时 ${duration} 秒`);
  
  // 退出码
  process.exit(isClean ? 0 : 1);
}

// 运行扫描
main().catch(error => {
  log.error(`扫描过程发生错误: ${error.message}`);
  process.exit(1);
});