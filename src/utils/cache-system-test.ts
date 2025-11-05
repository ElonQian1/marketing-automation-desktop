// src/utils/cache-system-test.ts
// module: cache-system | layer: utils | role: 缓存测试工具
// summary: 提供XML缓存系统的基本功能测试与验证

import * as analysisCache from '../api/analysis-cache';

export interface CacheTestResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

/**
 * 测试XML缓存系统基本功能
 */
export async function testCacheSystemBasic(): Promise<CacheTestResult[]> {
  const results: CacheTestResult[] = [];
  
  try {
    // 测试1: 注册快照
    console.log('🧪 测试1: 注册XML快照...');
    const testXml = `<hierarchy rotation="0">
      <node index="0" text="测试按钮" class="android.widget.Button" 
            bounds="[100,200][300,250]" clickable="true"/>
    </hierarchy>`;
    
    const registerResult = await analysisCache.registerSnapshot(testXml);
    
    results.push({
      success: true,
      message: '✅ XML快照注册成功',
      data: registerResult
    });
    
    // 测试2: 获取子树指标  
    console.log('🧪 测试2: 获取子树指标...');
    const metricsResult = await analysisCache.getSubtreeMetrics(
      registerResult,
      '//node[@text="测试按钮"]'
    );
    
    results.push({
      success: true,
      message: '✅ 子树指标获取成功', 
      data: metricsResult
    });
    
    // 测试3: 尝试获取缓存指标
    console.log('🧪 测试3: 尝试缓存命中...');
    const cachedResult = await analysisCache.tryGetSubtreeMetrics(
      registerResult,
      '//node[@text="测试按钮"]'
    );
    
    results.push({
      success: cachedResult !== null,
      message: cachedResult ? '✅ 缓存命中成功' : '⚠️ 缓存未命中(正常)',
      data: cachedResult
    });
    
    // 测试4: 批量操作
    console.log('🧪 测试4: 批量缓存操作...');
    const batchResults = await analysisCache.batchGetSubtreeMetrics(
      registerResult,
      ['//node[@text="测试按钮"]', '//node[@index="0"]']
    );
    
    results.push({
      success: Array.isArray(batchResults),
      message: '✅ 批量操作执行成功',
      data: batchResults
    });
    
  } catch (error) {
    results.push({
      success: false,
      message: '❌ 测试过程中发生错误',
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return results;
}

/**
 * 运行完整缓存系统测试套件
 */
export async function runCacheSystemTests(): Promise<void> {
  console.log('🚀 开始XML缓存系统测试...');
  console.log('========================================');
  
  try {
    const basicResults = await testCacheSystemBasic();
    
    // 输出测试结果
    console.log('📊 测试结果汇总:');
    basicResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.message}`);
      if (result.data) {
        console.log('   数据:', result.data);
      }
      if (result.error) {
        console.error('   错误:', result.error);
      }
    });
    
    const successCount = basicResults.filter(r => r.success).length;
    const totalCount = basicResults.length;
    
    console.log('========================================');
    console.log(`🎯 测试完成: ${successCount}/${totalCount} 成功`);
    
    if (successCount === totalCount) {
      console.log('🎉 XML缓存系统工作正常!');
    } else {
      console.warn('⚠️ 部分测试失败，请检查系统状态');
    }
    
  } catch (error) {
    console.error('❌ 测试套件执行失败:', error);
  }
}

/**
 * 性能测试：对比缓存与非缓存解析
 */
export async function performanceTest(): Promise<void> {
  console.log('⚡ 开始性能对比测试...');
  
  const testXml = `<hierarchy rotation="0">
    ${Array.from({ length: 100 }, (_, i) => 
      `<node index="${i}" text="节点${i}" class="android.widget.TextView" 
             bounds="[${i*10},${i*10}][${i*10+100},${i*10+30}]" />`
    ).join('\n    ')}
  </hierarchy>`;
  
  // 首次解析 (无缓存)
  const startTime = performance.now();
  const snapshotId = await analysisCache.registerSnapshot(testXml);
  await analysisCache.getSubtreeMetrics(snapshotId, '//node[@index="0"]');
  const firstParseTime = performance.now() - startTime;
  
  // 二次解析 (应该命中缓存)
  const cacheStartTime = performance.now();
  await analysisCache.tryGetSubtreeMetrics(snapshotId, '//node[@index="0"]');
  const cacheHitTime = performance.now() - cacheStartTime;
  
  console.log(`📈 性能对比结果:`);
  console.log(`   首次解析: ${firstParseTime.toFixed(2)}ms`);
  console.log(`   缓存命中: ${cacheHitTime.toFixed(2)}ms`);
  console.log(`   提升倍数: ${(firstParseTime / Math.max(cacheHitTime, 0.01)).toFixed(2)}x`);
}

// 导出便捷测试函数
export const cacheSystemTests = {
  basic: testCacheSystemBasic,
  full: runCacheSystemTests,
  performance: performanceTest
};

// 开发环境自动测试 (可选)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // 为开发环境提供全局测试函数
  interface TestWindow extends Window {
    testCacheSystem?: () => Promise<void>;
    testCachePerf?: () => Promise<void>;
  }
  (window as TestWindow).testCacheSystem = runCacheSystemTests;
  (window as TestWindow).testCachePerf = performanceTest;
}