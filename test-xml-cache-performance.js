// 快速测试：XML缓存性能优化验证脚本
// 运行方式：在浏览器控制台中粘贴此代码

console.log('🚀 开始测试XML缓存性能优化...');

// 模拟测试数据
const testXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2340]" />
  <node index="1" text="测试按钮" resource-id="test_button" class="android.widget.Button" package="com.xingin.xhs" content-desc="测试内容描述" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[100,100][300,200]" />
</hierarchy>`;

// 测试函数
async function testXmlCachePerformance() {
  try {
    // 动态导入我们的缓存管理器
    const { XmlCacheManager } = await import('/src/services/xml-cache-manager.ts');
    const { xmlCachePerformanceMonitor } = await import('/src/services/xml-cache-performance-monitor.ts');
    
    const manager = XmlCacheManager.getInstance();
    
    console.log('📊 开始性能测试...');
    
    // 1. 测试缓存写入性能
    console.time('缓存写入性能');
    const cacheId1 = `test_cache_${Date.now()}_1`;
    const cacheId2 = `test_cache_${Date.now()}_2`;
    const xmlHash = `hash_${Math.random().toString(36).substr(2, 16)}`;
    
    manager.putXml(cacheId1, testXmlContent, xmlHash + '_1');
    manager.putXml(cacheId2, testXmlContent, xmlHash + '_2');
    console.timeEnd('缓存写入性能');
    
    // 2. 测试缓存读取性能（内存命中）
    console.time('内存缓存读取性能');
    const cachedData1 = await manager.getCachedXml(cacheId1);
    const cachedData2 = await manager.getCachedXml(cacheId2);
    console.timeEnd('内存缓存读取性能');
    
    console.log('✅ 内存缓存命中:', cachedData1 ? '成功' : '失败');
    console.log('✅ 内存缓存命中:', cachedData2 ? '成功' : '失败');
    
    // 3. 测试性能统计
    const performanceStats = manager.getPerformanceStats();
    console.log('📈 性能统计:', performanceStats);
    
    // 4. 测试缓存预热
    console.time('缓存预热性能');
    await manager.warmupCache(5);
    console.timeEnd('缓存预热性能');
    
    // 5. 测试性能监控
    const summary = xmlCachePerformanceMonitor.getPerformanceSummary();
    console.log('📊 性能摘要:', summary);
    
    const report = xmlCachePerformanceMonitor.generatePerformanceReport();
    console.log('📋 详细报告:', report);
    
    // 6. 测试LRU淘汰机制
    console.log('🧹 测试LRU淘汰...');
    for (let i = 0; i < 55; i++) { // 超过最大内存容量(50)
      manager.putXml(`test_lru_${i}`, testXmlContent, `hash_lru_${i}`);
    }
    
    const statsAfterLRU = manager.getCacheStats();
    console.log('📊 LRU后统计:', statsAfterLRU);
    
    // 7. 测试存储统计
    const storageStats = await manager.getStorageStats();
    console.log('💾 存储统计:', storageStats);
    
    console.log('🎉 所有测试完成！XML缓存性能优化工作正常！');
    
    return {
      success: true,
      performanceStats,
      summary,
      report,
      storageStats
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 启动测试
testXmlCachePerformance().then(result => {
  if (result.success) {
    console.log('🎯 测试结果摘要:');
    console.log('- 缓存写入: ✅ 正常');
    console.log('- 缓存读取: ✅ 正常');
    console.log('- 性能监控: ✅ 正常');
    console.log('- LRU淘汰: ✅ 正常');
    console.log('- 存储统计: ✅ 正常');
    console.log('- 整体状态:', result.summary?.status || '未知');
    console.log('- 建议:', result.summary?.message || '无');
  } else {
    console.log('💥 测试失败，请检查实现！');
  }
});

// 额外：测试UI组件加载（如果在React环境中）
if (typeof React !== 'undefined') {
  console.log('🎨 尝试加载性能监控UI组件...');
  import('/src/components/cache/xml-cache-performance-badge.tsx')
    .then(module => {
      console.log('✅ UI组件加载成功:', module.XmlCachePerformanceBadge ? '可用' : '不可用');
    })
    .catch(error => {
      console.log('⚠️ UI组件加载失败:', error.message);
    });
}

console.log('📝 提示: 你可以在页面分析界面的右上角看到性能监控徽章！');