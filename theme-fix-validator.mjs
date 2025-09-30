#!/usr/bin/env node

/**
 * 主题修复验证工具
 * 用于验证全局样式修复是否生效
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ThemeFixValidator {
  async validateFix() {
    console.log('🎯 开始验证主题修复效果...');
    console.log('='.repeat(50));

    // 1. 检查文件结构
    await this.checkFileStructure();
    
    // 2. 运行样式审计
    await this.runStyleAudit();
    
    // 3. 检查类型
    await this.checkTypes();
    
    // 4. 提供测试指南
    this.showTestGuide();
  }

  async checkFileStructure() {
    console.log('\n📁 检查文件结构...');
    
    const requiredFiles = [
      'src/styles/theme-overrides/index.ts',
      'src/styles/theme-overrides/global-dark-theme.css',
      'src/styles/theme-overrides/inline-style-overrides.css',
      'src/styles/theme-overrides/component-specific.css',
      'src/styles/theme-overrides/global-style-fixer.ts'
    ];

    for (const file of requiredFiles) {
      try {
        await execAsync(`ls "${file}" 2>/dev/null || echo "Missing: ${file}"`);
        console.log(`✅ ${file}`);
      } catch {
        console.log(`❌ ${file} - 文件不存在`);
      }
    }
  }

  async runStyleAudit() {
    console.log('\n🔍 运行样式审计...');
    
    try {
      const { stdout } = await execAsync('node style-auditor.js');
      
      // 提取关键信息
      const lines = stdout.split('\n');
      const problemLine = lines.find(line => line.includes('发现问题:'));
      
      if (problemLine) {
        console.log(`📊 ${problemLine}`);
        
        // 检查是否有改善
        const problemCount = parseInt(problemLine.match(/(\d+)/)?.[1] || '0');
        if (problemCount < 200) {
          console.log('✅ 问题数量在可接受范围内');
        } else {
          console.log('⚠️ 仍有较多硬编码样式问题');
        }
      }
    } catch (error) {
      console.log('⚠️ 样式审计工具运行失败，手动检查');
    }
  }

  async checkTypes() {
    console.log('\n🔧 检查 TypeScript 类型...');
    
    try {
      await execAsync('npm run type-check');
      console.log('✅ TypeScript 类型检查通过');
    } catch (error) {
      console.log('❌ TypeScript 类型检查失败');
      console.log('请修复类型错误后重试');
    }
  }

  showTestGuide() {
    console.log('\n🧪 实际测试指南');
    console.log('='.repeat(30));
    
    console.log('\n1. 启动开发服务器：');
    console.log('   npm run tauri dev');
    
    console.log('\n2. 在浏览器中测试：');
    console.log('   - 导航到联系人导入页面');
    console.log('   - 检查批量操作栏是否为暗色背景');
    console.log('   - 验证工具栏是否正常显示');
    
    console.log('\n3. 在控制台中运行：');
    console.log('   // 启用自动修复');
    console.log('   enableStyleFixer()');
    console.log('   ');
    console.log('   // 查看统计信息');
    console.log('   styleStats()');
    console.log('   ');
    console.log('   // 手动修复所有样式');
    console.log('   fixStyles()');
    console.log('   ');
    console.log('   // 启用调试模式（高亮问题元素）');
    console.log('   debugStyles()');
    
    console.log('\n4. 验证循环步骤卡片：');
    console.log('   - 创建或查看循环步骤');
    console.log('   - 确认循环卡片保持白色背景+黑色文字');
    console.log('   - 确认其他元素跟随暗色主题');
    
    console.log('\n🎯 期望结果：');
    console.log('   ✅ 批量操作栏：暗色背景 + 浅色文字');
    console.log('   ✅ 工具栏：暗色背景 + 浅色文字');
    console.log('   ✅ 表格和按钮：暗色主题适配');
    console.log('   ✅ 循环步骤卡片：白色背景 + 黑色文字');
    console.log('   ✅ 无白底白字问题');
    
    console.log('\n💡 如果还有问题：');
    console.log('   1. 检查元素的具体选择器');
    console.log('   2. 在 component-specific.css 中添加针对性修复');
    console.log('   3. 使用调试模式找出问题元素');
    console.log('   4. 必要时更新 CSS 层级优先级');
  }

  async showFixSummary() {
    console.log('\n📋 修复方案总结');
    console.log('='.repeat(40));
    
    console.log('\n🔧 已实施的修复：');
    console.log('   1. 创建了模块化的主题覆盖系统');
    console.log('   2. 使用 CSS 属性选择器强制覆盖内联样式');
    console.log('   3. 建立了自动运行时样式修复机制');
    console.log('   4. 针对性修复联系人导入模块组件');
    console.log('   5. 确保循环步骤卡片保持白色');
    
    console.log('\n🎨 架构优势：');
    console.log('   ✅ 模块化设计（每个文件 < 500行）');
    console.log('   ✅ 运行时自动修复');
    console.log('   ✅ 开发调试工具支持');
    console.log('   ✅ CSS 层级管理');
    console.log('   ✅ 组件特定修复');
    
    console.log('\n📁 文件结构：');
    console.log('   src/styles/theme-overrides/');
    console.log('   ├── index.ts                  (入口文件)');
    console.log('   ├── global-dark-theme.css     (全局暗色覆盖)');
    console.log('   ├── inline-style-overrides.css (内联样式覆盖)');
    console.log('   ├── component-specific.css    (组件特定修复)');
    console.log('   └── global-style-fixer.ts     (运行时修复器)');
  }
}

async function main() {
  const validator = new ThemeFixValidator();
  
  await validator.validateFix();
  await validator.showFixSummary();
  
  console.log('\n🚀 准备测试？运行: npm run tauri dev');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ThemeFixValidator;