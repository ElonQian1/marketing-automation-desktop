#!/usr/bin/env node
// scripts/quick-quality-check.mjs
// module: ci-scripts | layer: infrastructure | role: 快速质量检查工具
// summary: 本地开发时的快速质量门控检查，模拟CI环境验证

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

/**
 * 快速质量检查工具
 * 模拟CI环境，本地快速执行所有质量门控检查
 */
class QuickQualityChecker {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  /**
   * 执行命令并收集结果
   */
  async runCommand(name, command, args = [], options = {}) {
    return new Promise((resolve) => {
      const start = performance.now();
      console.log(`🔍 Running: ${name}...`);
      
      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        const duration = performance.now() - start;
        const result = {
          name,
          command: `${command} ${args.join(' ')}`,
          exitCode: code,
          duration: Math.round(duration),
          passed: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        };
        
        this.results.push(result);
        
        if (result.passed) {
          console.log(`✅ ${name} - Passed (${result.duration}ms)`);
        } else {
          console.log(`❌ ${name} - Failed (${result.duration}ms)`);
          if (stderr) {
            console.log(`   Error: ${stderr.slice(0, 200)}...`);
          }
        }
        
        resolve(result);
      });
    });
  }

  /**
   * 运行所有质量检查
   */
  async runAllChecks() {
    console.log('🚀 Starting Quick Quality Check...\n');
    
    // 基础检查
    await this.runCommand('TypeScript Check', 'npm', ['run', 'type-check']);
    await this.runCommand('ESLint', 'npm', ['run', 'lint']);
    await this.runCommand('Build Check', 'npm', ['run', 'build']);
    
    // 测试检查
    await this.runCommand('Unit Tests', 'npm', ['test', '--', '--run']);
    
    // 高级质量检查 (非阻塞)
    await this.runCommand('Unused Exports', 'npx', ['ts-prune', '--error']);
    await this.runCommand('Code Duplication', 'npx', ['jscpd', 'src', '--min-lines', '8', '--threshold', '3']);
    await this.runCommand('Event Evidence', 'node', ['scripts/collect-event-evidence.mjs']);
    
    // E2E 测试 (如果存在)
    try {
      await this.runCommand('E2E Tests', 'npm', ['run', 'test:e2e']);
    } catch (error) {
      console.log('⚠️  E2E tests skipped (not configured or Playwright not installed)');
    }
    
    this.generateReport();
  }

  /**
   * 生成质量检查报告
   */
  generateReport() {
    const totalDuration = performance.now() - this.startTime;
    const passed = this.results.filter(r => r.passed);
    const failed = this.results.filter(r => !r.passed);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 QUICK QUALITY CHECK REPORT');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Total time: ${Math.round(totalDuration)}ms`);
    console.log(`✅ Passed: ${passed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success rate: ${Math.round((passed.length / this.results.length) * 100)}%`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed checks:');
      failed.forEach(result => {
        console.log(`   - ${result.name}: ${result.command}`);
        if (result.stderr) {
          console.log(`     Error: ${result.stderr.slice(0, 100)}...`);
        }
      });
    }
    
    if (passed.length > 0) {
      console.log('\n✅ Passed checks:');
      passed.forEach(result => {
        console.log(`   - ${result.name} (${result.duration}ms)`);
      });
    }
    
    // 提供改进建议
    this.generateRecommendations();
    
    console.log('\n' + '='.repeat(60));
    
    if (failed.length === 0) {
      console.log('🎉 All quality checks passed! Ready for CI.');
      process.exit(0);
    } else {
      console.log('🔧 Please fix the failed checks before pushing to CI.');
      process.exit(1);
    }
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    const typeCheckFailed = this.results.find(r => r.name === 'TypeScript Check' && !r.passed);
    if (typeCheckFailed) {
      recommendations.push('🔧 Fix TypeScript errors first - they often cause cascading issues');
    }
    
    const lintFailed = this.results.find(r => r.name === 'ESLint' && !r.passed);
    if (lintFailed) {
      recommendations.push('🧹 Run "npm run lint -- --fix" to auto-fix ESLint issues');
    }
    
    const buildFailed = this.results.find(r => r.name === 'Build Check' && !r.passed);
    if (buildFailed) {
      recommendations.push('📦 Build failure often indicates missing dependencies or config issues');
    }
    
    const unusedExports = this.results.find(r => r.name === 'Unused Exports' && !r.passed);
    if (unusedExports) {
      recommendations.push('📋 Consider removing unused exports or add them to ignore list');
    }
    
    const duplicateCode = this.results.find(r => r.name === 'Code Duplication' && !r.passed);
    if (duplicateCode) {
      recommendations.push('🔄 High code duplication detected - consider refactoring common patterns');
    }
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }
  }
}

// 主执行逻辑
async function main() {
  const checker = new QuickQualityChecker();
  
  try {
    await checker.runAllChecks();
  } catch (error) {
    console.error('❌ Quality check failed with error:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}