#!/usr/bin/env node

/**
 * 轻组件硬编码检测脚本
 * 用于自动检测UI组件中的硬编码样式
 * 
 * 使用方法:
 * node scripts/check-hardcoded-styles.js
 * 
 * 员工B - 轻组件动效质量监控工具
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

// 检测规则配置
const DETECTION_RULES = {
  // 硬编码颜色
  hardcodedColors: {
    pattern: /(border-\w+-\d+|bg-\w+-\d+|text-\w+-\d+|#[0-9a-fA-F]{3,6}(?![a-fA-F0-9]))/g,
    description: '硬编码颜色值',
    severity: 'error'
  },
  
  // 硬编码阴影（排除基于token的）
  hardcodedShadows: {
    pattern: /shadow-(?!(\[var\(|none))/g,
    description: '硬编码阴影值',
    severity: 'error'
  },
  
  // RGBA颜色值（排除CSS变量回调）
  rgbaValues: {
    pattern: /rgba\([^)]*\)(?!\])/g,
    description: '硬编码RGBA值',
    severity: 'warning'
  },
  
  // Drop-shadow中的RGBA
  dropShadowRgba: {
    pattern: /drop-shadow-\[.*rgba\([^)]*\)/g,
    description: 'Drop-shadow中的硬编码RGBA',
    severity: 'error'
  },
  
  // 硬编码尺寸（可能的问题）
  hardcodedSizes: {
    pattern: /(w-\d+|h-\d+|p-\d+|m-\d+|text-\d+)(?!.*var\()/g,
    description: '可能的硬编码尺寸',
    severity: 'info'
  }
};

// 允许的例外情况
const ALLOWED_EXCEPTIONS = [
  // CSS变量回调值
  /var\(--[\w-]+,\s*rgba\([^)]*\)\)/g,
  // 基于token的shadow
  /shadow-\[var\(--[\w-]+\)\]/g,
  // shadow-none是安全的
  /shadow-none/g,
  // 设计token变量
  /var\(--[\w-]+\)/g,
];

class LightComponentQualityChecker {
  constructor() {
    this.results = {
      totalFiles: 0,
      issueFiles: 0,
      totalIssues: 0,
      issues: []
    };
  }

  /**
   * 检查指定目录下的所有轻组件文件
   */
  async checkDirectory(dirPath = 'src/components/ui') {
    console.log(`${colors.cyan}${colors.bold}🔍 轻组件硬编码质量检测${colors.reset}\n`);
    console.log(`检测目录: ${colors.blue}${dirPath}${colors.reset}\n`);

    if (!fs.existsSync(dirPath)) {
      console.log(`${colors.red}❌ 目录不存在: ${dirPath}${colors.reset}`);
      return;
    }

    const files = this.getAllTsxFiles(dirPath);
    console.log(`发现 ${colors.yellow}${files.length}${colors.reset} 个组件文件\n`);

    for (const file of files) {
      await this.checkFile(file);
    }

    this.printSummary();
    return this.results;
  }

  /**
   * 获取目录下所有TSX文件
   */
  getAllTsxFiles(dirPath) {
    const files = [];
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(dirPath);
    return files;
  }

  /**
   * 检查单个文件
   */
  async checkFile(filePath) {
    this.results.totalFiles++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const issues = this.detectIssues(content, filePath);
      
      if (issues.length > 0) {
        this.results.issueFiles++;
        this.results.totalIssues += issues.length;
        this.results.issues.push({
          file: filePath,
          issues: issues
        });
        
        this.printFileIssues(filePath, issues);
      }
    } catch (error) {
      console.log(`${colors.red}❌ 读取文件失败: ${filePath}${colors.reset}`);
      console.log(`   错误: ${error.message}`);
    }
  }

  /**
   * 检测文件中的问题
   */
  detectIssues(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    
    // 检查是否在允许的例外列表中
    const isException = (text) => {
      return ALLOWED_EXCEPTIONS.some(pattern => pattern.test(text));
    };
    
    for (const [ruleName, rule] of Object.entries(DETECTION_RULES)) {
      let match;
      while ((match = rule.pattern.exec(content)) !== null) {
        const matchText = match[0];
        
        // 跳过允许的例外
        if (isException(matchText)) {
          continue;
        }
        
        // 计算行号
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const line = lines[lineNumber - 1];
        
        issues.push({
          rule: ruleName,
          description: rule.description,
          severity: rule.severity,
          match: matchText,
          line: lineNumber,
          context: line.trim()
        });
      }
      
      // 重置正则表达式状态
      rule.pattern.lastIndex = 0;
    }
    
    return issues;
  }

  /**
   * 打印文件问题
   */
  printFileIssues(filePath, issues) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`${colors.red}🚨 ${relativePath}${colors.reset}`);
    
    for (const issue of issues) {
      const severityColor = {
        error: colors.red,
        warning: colors.yellow,
        info: colors.cyan
      }[issue.severity] || colors.reset;
      
      console.log(`   ${severityColor}${issue.severity.toUpperCase()}${colors.reset} L${issue.line}: ${issue.description}`);
      console.log(`   ${colors.cyan}匹配: ${issue.match}${colors.reset}`);
      console.log(`   ${colors.yellow}上下文: ${issue.context}${colors.reset}`);
      console.log('');
    }
  }

  /**
   * 打印检测总结
   */
  printSummary() {
    console.log(`${colors.bold}📊 检测结果总结${colors.reset}\n`);
    
    console.log(`总文件数: ${colors.blue}${this.results.totalFiles}${colors.reset}`);
    console.log(`问题文件: ${colors.yellow}${this.results.issueFiles}${colors.reset}`);
    console.log(`总问题数: ${colors.red}${this.results.totalIssues}${colors.reset}\n`);
    
    if (this.results.totalIssues === 0) {
      console.log(`${colors.green}${colors.bold}✅ 恭喜！所有轻组件都符合质量标准！${colors.reset}\n`);
    } else {
      console.log(`${colors.red}${colors.bold}❌ 发现质量问题，需要修复${colors.reset}\n`);
      
      // 按严重性分组统计
      const bySeverity = {};
      for (const fileIssue of this.results.issues) {
        for (const issue of fileIssue.issues) {
          bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
        }
      }
      
      console.log('问题分布:');
      for (const [severity, count] of Object.entries(bySeverity)) {
        const color = {
          error: colors.red,
          warning: colors.yellow,
          info: colors.cyan
        }[severity] || colors.reset;
        
        console.log(`  ${color}${severity}: ${count}${colors.reset}`);
      }
      console.log('');
    }
    
    // 提供修复建议
    if (this.results.totalIssues > 0) {
      console.log(`${colors.cyan}💡 修复建议:${colors.reset}`);
      console.log('1. 将硬编码颜色替换为 design tokens');
      console.log('2. 使用 var(--token-name) 语法');
      console.log('3. 确保阴影使用 shadow-[var(--shadow-*)] 格式');
      console.log('4. RGBA值应该通过CSS变量提供后备值\n');
    }
    
    console.log(`${colors.magenta}Generated by Employee B - Light Component Quality Monitor${colors.reset}`);
    console.log(`${colors.cyan}检测时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Taipei' })}${colors.reset}\n`);
  }
}

// 执行检测
async function main() {
  const checker = new LightComponentQualityChecker();
  const results = await checker.checkDirectory();
  
  // 返回退出码
  process.exit(results.totalIssues > 0 ? 1 : 0);
}

// 如果直接运行此脚本
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  main().catch(console.error);
}

// 总是执行主函数用于测试
main().catch(console.error);

export { LightComponentQualityChecker };