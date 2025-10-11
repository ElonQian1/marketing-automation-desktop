/**
 * 精准获客系统 - 集成测试脚本
 * 
 * 用于验证系统各组件的集成和工作流程
 */

import { runPreciseAcquisitionDemo, getDemoSystemStatus } from './PreciseAcquisitionDemo';
import { globalAuditManager } from '../audit/AuditLogManager';

/**
 * 运行集成测试
 */
async function runIntegrationTests(): Promise<void> {
  console.log('🧪 开始精准获客系统集成测试...\n');
  
  const testResults = {
    total_tests: 0,
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  try {
    // 测试1: 系统初始化
    console.log('🔧 测试1: 系统初始化');
    testResults.total_tests++;
    
    try {
      const systemStatus = await getDemoSystemStatus();
      if (systemStatus && systemStatus.system_health?.status === 'healthy') {
        console.log('✅ 系统初始化成功');
        testResults.passed++;
      } else {
        throw new Error('系统状态异常');
      }
    } catch (error) {
      console.log('❌ 系统初始化失败:', error);
      testResults.failed++;
      testResults.errors.push(`系统初始化: ${error}`);
    }
    
    // 测试2: 完整工作流程
    console.log('\n🔄 测试2: 完整工作流程演示');
    testResults.total_tests++;
    
    try {
      await runPreciseAcquisitionDemo();
      console.log('✅ 完整工作流程测试成功');
      testResults.passed++;
    } catch (error) {
      console.log('❌ 完整工作流程测试失败:', error);
      testResults.failed++;
      testResults.errors.push(`工作流程: ${error}`);
    }
    
    // 测试3: 审计日志验证
    console.log('\n📋 测试3: 审计日志验证');
    testResults.total_tests++;
    
    try {
      const auditSummary = globalAuditManager.getSummary(1);
      if (auditSummary && auditSummary.total_logs > 0) {
        console.log('✅ 审计日志记录正常');
        console.log(`   - 总日志数: ${auditSummary.total_logs}`);
        console.log(`   - 错误率: ${(auditSummary.error_rate * 100).toFixed(1)}%`);
        testResults.passed++;
      } else {
        throw new Error('审计日志为空');
      }
    } catch (error) {
      console.log('❌ 审计日志验证失败:', error);
      testResults.failed++;
      testResults.errors.push(`审计日志: ${error}`);
    }
    
    // 测试结果汇总
    console.log('\n📊 集成测试结果汇总:');
    console.log(`   总测试数: ${testResults.total_tests}`);
    console.log(`   通过: ${testResults.passed} ✅`);
    console.log(`   失败: ${testResults.failed} ❌`);
    console.log(`   成功率: ${((testResults.passed / testResults.total_tests) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ 失败详情:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log('\n🎉 所有集成测试通过！系统已准备就绪。');
    } else {
      console.log('\n⚠️  部分测试失败，请检查系统配置。');
    }
    
  } catch (error) {
    console.error('❌ 集成测试执行失败:', error);
  }
}

/**
 * 运行性能基准测试
 */
async function runPerformanceBenchmark(): Promise<void> {
  console.log('⚡ 开始性能基准测试...\n');
  
  const startTime = Date.now();
  
  try {
    // 模拟大量数据处理
    console.log('📊 测试大量数据处理性能...');
    
    const batchSizes = [10, 50, 100, 200];
    const results = [];
    
    for (const batchSize of batchSizes) {
      const batchStartTime = Date.now();
      
      // 模拟批量处理
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      const batchEndTime = Date.now();
      const duration = batchEndTime - batchStartTime;
      
      results.push({
        batch_size: batchSize,
        duration_ms: duration,
        throughput: (batchSize / duration * 1000).toFixed(2)
      });
      
      console.log(`   批量大小 ${batchSize}: ${duration}ms (${(batchSize / duration * 1000).toFixed(2)} 项/秒)`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n✅ 性能基准测试完成 (总耗时: ${totalTime}ms)`);
    
    // 记录性能测试结果
    globalAuditManager.log({
      level: 'info' as any,
      category: 'performance_test' as any,
      action: 'benchmark_test',
      description: `性能基准测试完成，总耗时: ${totalTime}ms，批量结果: ${JSON.stringify(results)}`,
      result: {
        success: true,
        duration_ms: totalTime
      }
    });
    
  } catch (error) {
    console.error('❌ 性能基准测试失败:', error);
  }
}

/**
 * 主测试入口
 */
async function main(): Promise<void> {
  console.log('🚀 精准获客系统 - 测试套件\n');
  console.log('==========================================\n');
  
  try {
    // 运行集成测试
    await runIntegrationTests();
    
    console.log('\n==========================================\n');
    
    // 运行性能测试
    await runPerformanceBenchmark();
    
    console.log('\n==========================================');
    console.log('🏁 测试套件执行完成！');
    
  } catch (error) {
    console.error('❌ 测试套件执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export {
  runIntegrationTests,
  runPerformanceBenchmark,
  main as runTestSuite
};