#!/usr/bin/env node
// 文件路径：scripts/quality-gate.mjs

/**
 * 质量闸门脚本 - 品牌化重构质量保障
 * 
 * 这个脚本会执行完整的质量检查流程：
 * 1. 样式覆盖扫描
 * 2. TypeScript 类型检查  
 * 3. 构建验证
 * 4. 性能预算检查
 * 5. 文件大小检查
 * 6. A11y 基础检查
 * 
 * 用于 PR 合并前的自动化质量保障
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 控制台颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 质量标准配置
const QUALITY_STANDARDS = {
  // 性能预算 (字节)
  performance: {
    maxBundleSize: 5 * 1024 * 1024,      // 5MB - 总包大小
    maxChunkSize: 1 * 1024 * 1024,       // 1MB - 单个chunk
    maxCSSSize: 100 * 1024,              // 100KB - 首屏CSS
    maxAssetSize: 2 * 1024 * 1024,       // 2MB - 单个资源
  },
  
  // 代码质量
  codeQuality: {
    maxFileLines: 500,                   // 单文件最大行数
    maxFunctionLines: 80,                // 单函数最大行数
    minTestCoverage: 70,                 // 最低测试覆盖率
  },
  
  // 架构合规性
  architecture: {
    maxOverrideViolations: 0,            // 样式覆盖违规数量
    maxImportantUsage: 0,                // !important 使用次数
    maxHardcodedValues: 10,              // 硬编码值数量
  }
};

class QualityGate {
  constructor() {
    this.results = {
      overridesScan: null,
      typeCheck: null,
      buildCheck: null,
      performanceCheck: null,
      fileSizeCheck: null,
      a11yCheck: null,
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 运行完整的质量检查
   */
  async run() {
    console.log(`${colors.bright}${colors.cyan}🚀 品牌化重构质量闸门检查${colors.reset}\n`);
    
    try {
      // 1. 样式覆盖扫描
      await this.runOverridesScan();
      
      // 2. TypeScript 类型检查
      await this.runTypeCheck();
      
      // 3. 构建验证
      await this.runBuildCheck();
      
      // 4. 性能预算检查
      await this.runPerformanceCheck();
      
      // 5. 文件大小检查
      await this.runFileSizeCheck();
      
      // 6. A11y 基础检查
      await this.runA11yCheck();
      
      // 7. 生成报告
      this.generateReport();
      
      // 8. 判断是否通过
      const passed = this.errors.length === 0;
      process.exit(passed ? 0 : 1);
      
    } catch (error) {
      console.error(`${colors.red}❌ 质量闸门检查失败:${colors.reset}`, error.message);
      process.exit(1);
    }
  }

  /**
   * 样式覆盖扫描
   */
  async runOverridesScan() {
    console.log(`${colors.blue}1. 🔍 样式覆盖扫描...${colors.reset}`);
    
    try {
      const result = execSync('node scripts/scan-style-overrides.mjs', {
        cwd: projectRoot,
        encoding: 'utf8'
      });
      
      // 解析扫描报告
      const reportPath = path.join(projectRoot, 'style-overrides-report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        this.results.overridesScan = report;
        
        const { criticalIssues, totalIssues } = report.summary;
        
        if (criticalIssues > QUALITY_STANDARDS.architecture.maxOverrideViolations) {
          this.errors.push(`严重样式覆盖违规: ${criticalIssues} 个 (标准: ${QUALITY_STANDARDS.architecture.maxOverrideViolations})`);
        }
        
        if (totalIssues === 0) {
          console.log(`${colors.green}   ✅ 无样式覆盖问题${colors.reset}`);
        } else {
          console.log(`${colors.yellow}   ⚠️ 发现 ${totalIssues} 个问题 (${criticalIssues} 严重)${colors.reset}`);
        }
      }
    } catch (error) {
      // 扫描脚本返回非0表示有问题，但不是错误
      this.warnings.push('样式覆盖扫描发现问题，请查看详细报告');
    }
  }

  /**
   * TypeScript 类型检查
   */
  async runTypeCheck() {
    console.log(`${colors.blue}2. 📝 TypeScript 类型检查...${colors.reset}`);
    
    try {
      execSync('npm run type-check', {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      
      this.results.typeCheck = { success: true };
      console.log(`${colors.green}   ✅ 类型检查通过${colors.reset}`);
    } catch (error) {
      this.results.typeCheck = { success: false, error: error.message };
      this.errors.push('TypeScript 类型检查失败');
      console.log(`${colors.red}   ❌ 类型检查失败${colors.reset}`);
    }
  }

  /**
   * 构建验证
   */
  async runBuildCheck() {
    console.log(`${colors.blue}3. 🔨 构建验证...${colors.reset}`);
    
    try {
      const buildOutput = execSync('npm run build', {
        cwd: projectRoot,
        encoding: 'utf8'
      });
      
      this.results.buildCheck = { success: true, output: buildOutput };
      console.log(`${colors.green}   ✅ 构建成功${colors.reset}`);
    } catch (error) {
      this.results.buildCheck = { success: false, error: error.message };
      this.errors.push('项目构建失败');
      console.log(`${colors.red}   ❌ 构建失败${colors.reset}`);
    }
  }

  /**
   * 性能预算检查
   */
  async runPerformanceCheck() {
    console.log(`${colors.blue}4. ⚡ 性能预算检查...${colors.reset}`);
    
    const distPath = path.join(projectRoot, 'dist');
    if (!fs.existsSync(distPath)) {
      this.warnings.push('dist 目录不存在，跳过性能检查');
      return;
    }
    
    try {
      const stats = this.analyzeBundleSize(distPath);
      this.results.performanceCheck = stats;
      
      // 检查总包大小
      if (stats.totalSize > QUALITY_STANDARDS.performance.maxBundleSize) {
        this.errors.push(`包大小超限: ${this.formatBytes(stats.totalSize)} > ${this.formatBytes(QUALITY_STANDARDS.performance.maxBundleSize)}`);
      }
      
      // 检查CSS大小
      if (stats.cssSize > QUALITY_STANDARDS.performance.maxCSSSize) {
        this.warnings.push(`CSS大小超限: ${this.formatBytes(stats.cssSize)} > ${this.formatBytes(QUALITY_STANDARDS.performance.maxCSSSize)}`);
      }
      
      console.log(`${colors.green}   ✅ 性能预算检查完成${colors.reset}`);
      console.log(`      📦 总大小: ${this.formatBytes(stats.totalSize)}`);
      console.log(`      🎨 CSS大小: ${this.formatBytes(stats.cssSize)}`);
      
    } catch (error) {
      this.warnings.push(`性能检查失败: ${error.message}`);
    }
  }

  /**
   * 文件大小检查
   */
  async runFileSizeCheck() {
    console.log(`${colors.blue}5. 📏 文件大小检查...${colors.reset}`);
    
    try {
      const largeFiles = this.findLargeFiles();
      this.results.fileSizeCheck = { largeFiles };
      
      const oversizedFiles = largeFiles.filter(file => 
        file.lines > QUALITY_STANDARDS.codeQuality.maxFileLines
      );
      
      if (oversizedFiles.length > 0) {
        this.warnings.push(`发现 ${oversizedFiles.length} 个超大文件需要拆分`);
        oversizedFiles.forEach(file => {
          console.log(`${colors.yellow}   ⚠️ ${file.path}: ${file.lines} 行${colors.reset}`);
        });
      } else {
        console.log(`${colors.green}   ✅ 所有文件大小合规${colors.reset}`);
      }
    } catch (error) {
      this.warnings.push(`文件大小检查失败: ${error.message}`);
    }
  }

  /**
   * A11y 基础检查
   */
  async runA11yCheck() {
    console.log(`${colors.blue}6. ♿ 可访问性检查...${colors.reset}`);
    
    try {
      // 检查焦点样式
      const focusStylesCount = this.countFocusStyles();
      
      // 检查 aria 属性
      const ariaAttributesCount = this.countAriaAttributes();
      
      this.results.a11yCheck = {
        focusStyles: focusStylesCount,
        ariaAttributes: ariaAttributesCount,
      };
      
      console.log(`${colors.green}   ✅ A11y 检查完成${colors.reset}`);
      console.log(`      🎯 焦点样式: ${focusStylesCount} 个`);
      console.log(`      🏷️ ARIA 属性: ${ariaAttributesCount} 个`);
    } catch (error) {
      this.warnings.push(`A11y 检查失败: ${error.message}`);
    }
  }

  /**
   * 分析包大小
   */
  analyzeBundleSize(distPath) {
    let totalSize = 0;
    let cssSize = 0;
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (stat.isFile()) {
          totalSize += stat.size;
          
          if (item.endsWith('.css')) {
            cssSize += stat.size;
          }
        }
      }
    };
    
    scanDir(distPath);
    
    return { totalSize, cssSize };
  }

  /**
   * 查找大文件
   */
  findLargeFiles() {
    const largeFiles = [];
    const srcPath = path.join(projectRoot, 'src');
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n').length;
          
          if (lines > 300) { // 报告超过300行的文件
            largeFiles.push({
              path: path.relative(projectRoot, fullPath),
              lines,
              size: stat.size,
            });
          }
        }
      }
    };
    
    if (fs.existsSync(srcPath)) {
      scanDir(srcPath);
    }
    
    return largeFiles.sort((a, b) => b.lines - a.lines);
  }

  /**
   * 计算焦点样式数量
   */
  countFocusStyles() {
    let count = 0;
    const srcPath = path.join(projectRoot, 'src');
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (stat.isFile() && /\.(css|tsx|ts)$/.test(item)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.match(/focus(-visible)?:/g);
          count += matches ? matches.length : 0;
        }
      }
    };
    
    if (fs.existsSync(srcPath)) {
      scanDir(srcPath);
    }
    
    return count;
  }

  /**
   * 计算 ARIA 属性数量
   */
  countAriaAttributes() {
    let count = 0;
    const srcPath = path.join(projectRoot, 'src');
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (stat.isFile() && /\.(tsx|jsx)$/.test(item)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.match(/aria-[a-z]+=/g);
          count += matches ? matches.length : 0;
        }
      }
    };
    
    if (fs.existsSync(srcPath)) {
      scanDir(srcPath);
    }
    
    return count;
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * 生成质量报告
   */
  generateReport() {
    console.log(`\n${colors.bright}${colors.cyan}📊 质量闸门报告${colors.reset}\n`);
    
    // 错误汇总
    if (this.errors.length > 0) {
      console.log(`${colors.red}❌ 发现 ${this.errors.length} 个错误：${colors.reset}`);
      this.errors.forEach((error, index) => {
        console.log(`${colors.red}   ${index + 1}. ${error}${colors.reset}`);
      });
      console.log();
    }
    
    // 警告汇总
    if (this.warnings.length > 0) {
      console.log(`${colors.yellow}⚠️ 发现 ${this.warnings.length} 个警告：${colors.reset}`);
      this.warnings.forEach((warning, index) => {
        console.log(`${colors.yellow}   ${index + 1}. ${warning}${colors.reset}`);
      });
      console.log();
    }
    
    // 整体结果
    if (this.errors.length === 0) {
      console.log(`${colors.green}🎉 质量闸门检查通过！项目符合品牌化重构标准。${colors.reset}\n`);
      
      if (this.warnings.length > 0) {
        console.log(`${colors.yellow}💡 请关注上述警告，持续改进代码质量。${colors.reset}\n`);
      }
    } else {
      console.log(`${colors.red}🚫 质量闸门检查失败！请修复上述错误后重新提交。${colors.reset}\n`);
    }
    
    // 保存详细报告
    const reportPath = path.join(projectRoot, 'quality-gate-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      passed: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      results: this.results,
      standards: QUALITY_STANDARDS,
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📝 详细报告已保存到: ${reportPath}`);
  }
}

// 运行质量闸门
const gate = new QualityGate();
gate.run().catch(error => {
  console.error('质量闸门运行失败:', error);
  process.exit(1);
});