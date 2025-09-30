#!/usr/bin/env node

/**
 * 样式审计工具 - 检测和修复硬编码样式
 * 专门用于发现类似工具栏白底白字问题的根源
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要检查的文件扩展名
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// 硬编码样式模式（正则表达式）
const HARDCODED_PATTERNS = [
  // 白色背景 - 更宽泛的匹配
  {
    pattern: /background.*rgba\(255,\s*255,\s*255/gi,
    type: 'white-background',
    description: '硬编码白色背景'
  },
  {
    pattern: /backgroundColor.*rgba\(255,\s*255,\s*255/gi,
    type: 'white-background',
    description: '硬编码白色背景(驼峰)'
  },
  {
    pattern: /background.*#fff/gi,
    type: 'white-background',
    description: '硬编码白色背景(#fff)'
  },
  {
    pattern: /backgroundColor.*#fff/gi,
    type: 'white-background',
    description: '硬编码白色背景(#fff,驼峰)'
  },
  {
    pattern: /background.*white/gi,
    type: 'white-background',
    description: '硬编码白色背景(white关键字)'
  },
  
  // 查找 style 对象中的样式
  {
    pattern: /style\s*=\s*\{[^}]*background/gi,
    type: 'inline-background',
    description: '内联背景样式'
  },
  
  // 查找 useMemo/useState 中的样式对象
  {
    pattern: /Style.*=.*useMemo.*background/gi,
    type: 'memo-background',
    description: 'useMemo中的背景样式'
  },
  
  // 边框样式
  {
    pattern: /border.*1px solid #d9d9d9/gi,
    type: 'hardcoded-border',
    description: '硬编码边框样式'
  },
  
  // 阴影样式
  {
    pattern: /boxShadow.*rgba\(0,\s*0,\s*0/gi,
    type: 'hardcoded-shadow',
    description: '硬编码阴影样式'
  },
  
  // 文字颜色
  {
    pattern: /color.*#333/gi,
    type: 'hardcoded-text-color',
    description: '硬编码文字颜色'
  },
  
  // 任何包含颜色的样式对象
  {
    pattern: /toolbarStyle.*=.*rgba/gi,
    type: 'toolbar-style-color',
    description: '工具栏样式中的颜色'
  }
];

// 扫描目录
const SCAN_DIRS = [
  'src/modules/contact-import',
  'src/components',
  'src/pages'
];

class StyleAuditor {
  constructor() {
    this.issues = [];
    this.scannedFiles = 0;
  }

  // 扫描文件
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        HARDCODED_PATTERNS.forEach(({ pattern, type, description }) => {
          const matches = line.match(pattern);
          if (matches) {
            this.issues.push({
              file: filePath,
              line: lineNumber + 1,
              type,
              description,
              content: line.trim(),
              matches: matches
            });
          }
        });
      });
      
      this.scannedFiles++;
    } catch (error) {
      console.error(`❌ 读取文件失败: ${filePath}`, error.message);
    }
  }

  // 递归扫描目录
  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 跳过 node_modules 等目录
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            this.scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (EXTENSIONS.includes(ext)) {
            this.scanFile(fullPath);
          }
        }
      });
    } catch (error) {
      console.error(`❌ 扫描目录失败: ${dirPath}`, error.message);
    }
  }

  // 执行审计
  audit() {
    console.log('🔍 开始样式审计...\n');
    
    const startTime = Date.now();
    
    SCAN_DIRS.forEach(dir => {
      const fullPath = path.resolve(dir);
      if (fs.existsSync(fullPath)) {
        console.log(`📂 扫描目录: ${dir}`);
        this.scanDirectory(fullPath);
      } else {
        console.warn(`⚠️  目录不存在: ${dir}`);
      }
    });
    
    const endTime = Date.now();
    console.log(`\n📊 扫描完成! 用时: ${endTime - startTime}ms`);
    console.log(`📄 已扫描文件: ${this.scannedFiles} 个`);
    console.log(`🚨 发现问题: ${this.issues.length} 个\n`);
    
    this.generateReport();
  }

  // 生成报告
  generateReport() {
    if (this.issues.length === 0) {
      console.log('🎉 太棒了! 没有发现硬编码样式问题!');
      return;
    }

    // 按类型分组
    const groupedIssues = {};
    this.issues.forEach(issue => {
      if (!groupedIssues[issue.type]) {
        groupedIssues[issue.type] = [];
      }
      groupedIssues[issue.type].push(issue);
    });

    console.log('📋 硬编码样式问题报告:');
    console.log('='.repeat(60));

    Object.keys(groupedIssues).forEach(type => {
      const issues = groupedIssues[type];
      console.log(`\n🔸 ${issues[0].description} (${issues.length} 个问题)`);
      console.log('-'.repeat(40));
      
      issues.forEach(issue => {
        console.log(`📁 ${issue.file}:${issue.line}`);
        console.log(`   ${issue.content}`);
        console.log('');
      });
    });

    console.log('💡 修复建议:');
    console.log('1. 使用 CSS 变量替代硬编码颜色');
    console.log('2. 将样式移到 CSS 文件中');
    console.log('3. 使用主题系统确保一致性');
    console.log('4. 添加 !important 覆盖内联样式');
    
    // 生成修复脚本
    this.generateFixScript();
  }

  // 生成修复脚本
  generateFixScript() {
    const scriptContent = `// 自动生成的样式修复脚本
// 使用此脚本快速修复常见的硬编码样式问题

const fixes = [
  {
    search: /background:\\s*'rgba\\(255,\\s*255,\\s*255,\\s*0\\.95\\)'/g,
    replace: "// background: 'rgba(255, 255, 255, 0.95)', // 移除硬编码，使用CSS类",
    description: "注释掉硬编码白色背景"
  },
  {
    search: /border:\\s*'1px solid #d9d9d9'/g,
    replace: "// border: '1px solid #d9d9d9', // 移除硬编码，使用CSS类",
    description: "注释掉硬编码边框"
  },
  {
    search: /boxShadow:\\s*'[^']*'/g,
    replace: "// boxShadow: '...', // 移除硬编码，使用CSS类",
    description: "注释掉硬编码阴影"
  }
];

// 使用说明:
// 1. 在VS Code中打开问题文件
// 2. 使用查找替换功能 (Ctrl+H)
// 3. 启用正则表达式模式
// 4. 逐个应用上述修复

console.log('🔧 样式修复脚本已生成!');
console.log('建议：结合CSS类和!important来确保样式覆盖');
`;

    fs.writeFileSync('style-fix-script.js', scriptContent);
    console.log('\n📝 已生成修复脚本: style-fix-script.js');
  }
}

// 执行审计
const auditor = new StyleAuditor();
auditor.audit();

export default StyleAuditor;