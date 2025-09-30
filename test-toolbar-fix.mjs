#!/usr/bin/env node

/**
 * 样式修复验证脚本
 * 启动开发服务器并打开样式测试页面
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function startDevServer() {
  console.log('🚀 启动开发服务器...');
  
  try {
    // 启动 Tauri 开发服务器
    const devProcess = exec('npm run tauri dev', {
      cwd: process.cwd()
    });

    devProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    devProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });

    devProcess.on('close', (code) => {
      console.log(`开发服务器退出，代码: ${code}`);
    });

    console.log('✅ 开发服务器启动中...');
    console.log('');
    console.log('📋 测试步骤:');
    console.log('1. 等待应用启动');
    console.log('2. 导航到联系人导入页面');
    console.log('3. 查看工具栏是否正常显示');
    console.log('4. 在浏览器控制台运行：toolbarStyleTester.diagnose()');
    console.log('5. 测试主题切换功能');
    console.log('');
    console.log('🔧 修复要点:');
    console.log('- 工具栏不应该有白底白字');
    console.log('- 在深色主题下工具栏应该是深色');
    console.log('- 循环步骤卡片仍应保持白色背景');
    
  } catch (error) {
    console.error('❌ 启动失败:', error);
  }
}

// 检查样式修复状态
async function checkFixStatus() {
  console.log('🔍 检查样式修复状态...');
  
  try {
    // 运行样式审计
    const { stdout } = await execAsync('node style-auditor.js');
    
    console.log('📊 样式审计结果:');
    console.log(stdout);
    
    // 检查关键文件是否已修复
    const { stdout: grepResult } = await execAsync('grep -r "background.*rgba(255, 255, 255" src/modules/contact-import/ui/components/grid-layout/ || echo "未找到硬编码白色背景"');
    
    if (grepResult.includes('未找到')) {
      console.log('✅ 工具栏组件硬编码样式已清理');
    } else {
      console.warn('⚠️  仍有工具栏组件包含硬编码白色背景:');
      console.log(grepResult);
    }
    
  } catch (error) {
    console.log('ℹ️  样式检查完成（可能有些文件未找到硬编码样式）');
  }
}

async function main() {
  console.log('🎯 工具栏样式修复验证');
  console.log('='.repeat(50));
  
  await checkFixStatus();
  console.log('');
  
  console.log('是否要启动开发服务器进行实际测试？(y/N)');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('data', (key) => {
    if (key === 'y' || key === 'Y') {
      console.log('启动开发服务器...');
      startDevServer();
    } else {
      console.log('跳过启动，手动运行: npm run tauri dev');
      process.exit(0);
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}