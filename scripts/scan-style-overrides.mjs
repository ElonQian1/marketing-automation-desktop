#!/usr/bin/env node
// 文件路径：scripts/scan-style-overrides.mjs

/**
 * 样式覆盖扫描器 - 品牌化重构质量保障
 * 
 * 功能：
 * 1. 扫描项目中所有 .ant-* 类覆盖
 * 2. 检测 !important 使用情况
 * 3. 识别硬编码的 box-shadow、border-radius、linear-gradient
 * 4. 生成详细报告和修复建议
 * 
 * 目标：确保项目完全符合品牌化重构标准，0覆盖、0硬编码
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 配置：扫描的文件类型和排除目录
const SCAN_EXTENSIONS = ['.tsx', '.ts', '.css', '.scss', '.less', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'docs', 'scripts'];
const EXCLUDE_FILES = ['tailwind.config.js', 'vite.config.ts'];

// 违规模式定义
const VIOLATION_PATTERNS = {
  // AntD 类覆盖
  antdOverrides: {
    pattern: /\.ant-[a-zA-Z0-9-_]+/g,
    name: 'AntD 类覆盖',
    severity: 'critical',
    fix: '移除覆盖，通过 tokens 和适配器统一'
  },
  
  // !important 使用
  importantUsage: {
    pattern: /!important/g,
    name: '!important 使用',
    severity: 'critical', 
    fix: '移除 !important，通过正确的CSS层级和tokens处理'
  },
  
  // 硬编码阴影
  hardcodedShadow: {
    pattern: /box-shadow:\s*[^;]*(?:rgba?\(|#|\d+px)/g,
    name: '硬编码阴影',
    severity: 'high',
    fix: '使用 var(--shadow) 等 tokens 替换'
  },
  
  // 硬编码圆角
  hardcodedRadius: {
    pattern: /border-radius:\s*\d+px/g,
    name: '硬编码圆角',
    severity: 'high', 
    fix: '使用 var(--radius) 等 tokens 替换'
  },
  
  // 硬编码渐变
  hardcodedGradient: {
    pattern: /linear-gradient\s*\([^)]*(?:rgba?\(|#)[^)]*\)/g,
    name: '硬编码渐变',
    severity: 'medium',
    fix: '定义渐变tokens或使用Tailwind工具类'
  },
  
  // 硬编码颜色值
  hardcodedColors: {
    pattern: /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g,
    name: '硬编码颜色',
    severity: 'medium',
    fix: '使用 tokens 颜色变量替换'
  }
};

class StyleOverrideScanner {
  constructor() {
    this.violations = [];
    this.scannedFiles = 0;
    this.totalIssues = 0;
  }

  /**
   * 递归扫描目录
   */
  scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过排除的目录
        if (EXCLUDE_DIRS.includes(item)) {
          continue;
        }
        this.scanDirectory(fullPath);
      } else if (stat.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(item);
        if (SCAN_EXTENSIONS.includes(ext) && !EXCLUDE_FILES.includes(item)) {
          this.scanFile(fullPath);
        }
      }
    }
  }

  /**
   * 扫描单个文件
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(projectRoot, filePath);
      
      this.scannedFiles++;
      
      // 对每种违规模式进行检查
      for (const [key, config] of Object.entries(VIOLATION_PATTERNS)) {
        const matches = [...content.matchAll(config.pattern)];
        
        for (const match of matches) {
          const lineNumber = this.getLineNumber(content, match.index);
          const lineContent = this.getLineContent(content, match.index);
          
          this.violations.push({
            file: relativePath,
            line: lineNumber,
            column: match.index - this.getLineStart(content, match.index) + 1,
            type: key,
            name: config.name,
            severity: config.severity,
            match: match[0],
            context: lineContent.trim(),
            fix: config.fix
          });
          
          this.totalIssues++;
        }
      }
    } catch (error) {
      console.error(`扫描文件失败: ${filePath}`, error.message);
    }
  }

  /**
   * 获取匹配位置的行号
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 获取匹配位置的行内容
   */
  getLineContent(content, index) {
    const lines = content.split('\n');
    const lineNumber = this.getLineNumber(content, index);
    return lines[lineNumber - 1] || '';
  }

  /**
   * 获取行开始位置
   */
  getLineStart(content, index) {
    const beforeMatch = content.substring(0, index);
    const lastNewline = beforeMatch.lastIndexOf('\n');
    return lastNewline === -1 ? 0 : lastNewline + 1;
  }

  /**
   * 生成报告
   */
  generateReport() {
    const report = {
      summary: {
        scannedFiles: this.scannedFiles,
        totalIssues: this.totalIssues,
        criticalIssues: this.violations.filter(v => v.severity === 'critical').length,
        highIssues: this.violations.filter(v => v.severity === 'high').length,
        mediumIssues: this.violations.filter(v => v.severity === 'medium').length
      },
      violations: this.violations,
      byFile: this.groupByFile(),
      byType: this.groupByType()
    };

    return report;
  }

  /**
   * 按文件分组违规
   */
  groupByFile() {
    const byFile = {};
    
    for (const violation of this.violations) {
      if (!byFile[violation.file]) {
        byFile[violation.file] = [];
      }
      byFile[violation.file].push(violation);
    }
    
    return byFile;
  }

  /**
   * 按类型分组违规
   */
  groupByType() {
    const byType = {};
    
    for (const violation of this.violations) {
      if (!byType[violation.type]) {
        byType[violation.type] = [];
      }
      byType[violation.type].push(violation);
    }
    
    return byType;
  }

  /**
   * 输出彩色控制台报告
   */
  printReport(report) {
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
    };

    console.log(`\n${colors.bright}${colors.cyan}📊 样式覆盖扫描报告${colors.reset}\n`);
    
    // 总结信息
    console.log(`${colors.bright}扫描统计：${colors.reset}`);
    console.log(`  📁 扫描文件: ${report.summary.scannedFiles}`);
    console.log(`  ❌ 总问题数: ${colors.red}${report.summary.totalIssues}${colors.reset}`);
    console.log(`  🚨 严重问题: ${colors.red}${report.summary.criticalIssues}${colors.reset}`);
    console.log(`  ⚠️  高优先级: ${colors.yellow}${report.summary.highIssues}${colors.reset}`);
    console.log(`  ℹ️  中等问题: ${colors.blue}${report.summary.mediumIssues}${colors.reset}\n`);

    if (report.summary.totalIssues === 0) {
      console.log(`${colors.green}🎉 恭喜！没有发现样式覆盖问题，项目完全符合品牌化标准！${colors.reset}\n`);
      return;
    }

    // 按严重性排序并显示违规
    const sortedViolations = this.violations.sort((a, b) => {
      const severity = { critical: 3, high: 2, medium: 1 };
      return severity[b.severity] - severity[a.severity];
    });

    console.log(`${colors.bright}🔍 问题详情：${colors.reset}\n`);
    
    for (const violation of sortedViolations.slice(0, 20)) { // 限制显示前20个
      const severityColor = violation.severity === 'critical' ? colors.red : 
                           violation.severity === 'high' ? colors.yellow : colors.blue;
      
      console.log(`${severityColor}${violation.severity.toUpperCase()}${colors.reset} ${violation.name}`);
      console.log(`  📁 ${violation.file}:${violation.line}:${violation.column}`);
      console.log(`  🔍 匹配: "${colors.magenta}${violation.match}${colors.reset}"`);
      console.log(`  📄 上下文: ${violation.context}`);
      console.log(`  💡 建议: ${colors.green}${violation.fix}${colors.reset}\n`);
    }

    if (sortedViolations.length > 20) {
      console.log(`${colors.yellow}... 还有 ${sortedViolations.length - 20} 个问题未显示${colors.reset}\n`);
    }

    // 修复建议
    console.log(`${colors.bright}🛠️  修复建议：${colors.reset}`);
    console.log(`1. 优先处理 CRITICAL 级别问题（AntD覆盖和!important）`);
    console.log(`2. 将硬编码样式替换为 tokens 变量`);
    console.log(`3. 使用适配器模式包装 AntD 组件`);
    console.log(`4. 运行 ${colors.cyan}npm run scan:overrides${colors.reset} 持续监控\n`);
  }

  /**
   * 保存详细报告到文件
   */
  saveDetailedReport(report) {
    const reportPath = path.join(projectRoot, 'style-overrides-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`📝 详细报告已保存到: ${reportPath}`);
  }
}

// 主程序
function main() {
  console.log('🚀 启动样式覆盖扫描器...\n');
  
  const scanner = new StyleOverrideScanner();
  
  // 扫描 src 目录
  const srcPath = path.join(projectRoot, 'src');
  if (fs.existsSync(srcPath)) {
    scanner.scanDirectory(srcPath);
  }
  
  // 生成和显示报告
  const report = scanner.generateReport();
  scanner.printReport(report);
  scanner.saveDetailedReport(report);
  
  // 设置退出码
  process.exit(report.summary.totalIssues > 0 ? 1 : 0);
}

// 运行
main();