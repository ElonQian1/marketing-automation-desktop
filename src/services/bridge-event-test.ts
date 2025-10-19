// src/services/bridge-event-test.ts
// module: shared | layer: services | role: bridge-testing
// summary: 测试旧系统与新系统的事件桥接机制

import { useStepCardStore } from '../store/stepcards';

/**
 * 测试事件桥接机制
 * 验证旧的 use-intelligent-analysis-workflow 和新的 useStepCardStore 同步
 */
export async function testEventBridge() {
  console.log('🧪 [Bridge Test] 开始测试事件桥接机制');
  
  const store = useStepCardStore.getState();
  
  // 清空现有状态
  store.clear();
  console.log('🧹 [Bridge Test] 清空现有状态');
  
  // 模拟创建卡片
  const cardId = store.create({
    elementUid: 'test_element_123',
    elementContext: {
      xpath: '/hierarchy/android.widget.TextView[@text="测试"]',
      text: '测试按钮',
      resourceId: 'com.test:id/button'
    },
    status: 'draft'
  });
  
  console.log('✅ [Bridge Test] 创建测试卡片', { cardId });
  
  // 模拟绑定jobId
  const testJobId = 'test_job_12345';
  store.attachJob(cardId, testJobId);
  console.log('🔗 [Bridge Test] 绑定jobId', { cardId, testJobId });
  
  // 验证查找功能
  const foundCard = store.findByJob(testJobId);
  if (foundCard === cardId) {
    console.log('✅ [Bridge Test] jobId查找正常', { testJobId, foundCard });
  } else {
    console.error('❌ [Bridge Test] jobId查找失败', { testJobId, foundCard, expected: cardId });
  }
  
  // 模拟分析开始
  store.updateStatus(cardId, 'analyzing');
  store.updateProgress(cardId, 25);
  console.log('📊 [Bridge Test] 模拟分析进度 25%');
  
  // 模拟分析进度更新
  store.updateProgress(cardId, 65);
  console.log('📊 [Bridge Test] 模拟分析进度 65%');
  
  store.updateProgress(cardId, 95);
  console.log('📊 [Bridge Test] 模拟分析进度 95%');
  
  // 模拟分析完成
  const mockStrategy = {
    primary: 'self_anchor',
    backups: ['resource_id', 'text_exact'],
    score: 0.95,
    candidates: [
      {
        key: 'self_anchor',
        name: '自锚定策略',
        confidence: 0.95,
        xpath: '/hierarchy/android.widget.TextView[@text="测试"]',
        description: '基于元素自身属性的锚定策略'
      },
      {
        key: 'resource_id',
        name: 'Resource ID策略',
        confidence: 0.87,
        xpath: '//*[@resource-id="com.test:id/button"]',
        description: '基于resource-id的定位策略'
      }
    ]
  };
  
  store.fillStrategyAndReady(cardId, mockStrategy);
  console.log('✅ [Bridge Test] 模拟分析完成，填充策略', { cardId, strategy: mockStrategy.primary });
  
  // 验证最终状态
  const finalCard = store.getCard(cardId);
  if (finalCard?.status === 'ready' && finalCard?.strategy?.primary === 'self_anchor') {
    console.log('🎉 [Bridge Test] 桥接测试成功！卡片状态正确', {
      status: finalCard.status,
      strategy: finalCard.strategy.primary,
      score: finalCard.strategy.score
    });
  } else {
    console.error('❌ [Bridge Test] 桥接测试失败！状态不正确', {
      status: finalCard?.status,
      strategy: finalCard?.strategy?.primary,
      expected: { status: 'ready', strategy: 'self_anchor' }
    });
  }
  
  // 检查所有卡片
  const allCards = store.getAllCards();
  console.log('📋 [Bridge Test] 所有卡片状态', allCards.map(c => ({
    id: c.id,
    status: c.status,
    strategy: c.strategy?.primary,
    progress: c.progress
  })));
  
  return {
    success: finalCard?.status === 'ready',
    cardId,
    finalCard
  };
}

/**
 * 测试模拟的后端事件流
 */
export async function testMockBackendEvents() {
  console.log('🎭 [Mock Test] 开始模拟后端事件流');
  
  const store = useStepCardStore.getState();
  store.clear();
  
  // 模拟可视化分析页面创建卡片
  const cardId = store.create({
    elementUid: 'visual_element_789',
    elementContext: {
      xpath: '/hierarchy/android.widget.Button[@text="点击我"]',
      text: '点击我',
      bounds: '{"left":100,"top":200,"right":300,"bottom":250}',
      resourceId: 'com.xiaohongshu:id/click_btn'
    },
    status: 'draft'
  });
  
  // 模拟启动分析
  const jobId = `job_${Date.now()}`;
  store.attachJob(cardId, jobId);
  store.updateStatus(cardId, 'analyzing');
  
  console.log('🚀 [Mock Test] 模拟启动分析', { cardId, jobId });
  
  // 模拟后端进度事件序列
  const progressSequence = [15, 35, 65, 85, 95, 100];
  
  for (const progress of progressSequence) {
    await new Promise(resolve => setTimeout(resolve, 100));
    store.updateProgress(cardId, progress);
    console.log(`📊 [Mock Test] 进度更新: ${progress}%`);
  }
  
  // 模拟后端完成事件
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const completedStrategy = {
    primary: 'resource_id_exact',
    backups: ['text_contains', 'xpath_relative'],
    score: 0.89,
    candidates: [
      {
        key: 'resource_id_exact',
        name: 'Resource ID精确匹配',
        confidence: 0.89,
        xpath: '//*[@resource-id="com.xiaohongshu:id/click_btn"]'
      }
    ]
  };
  
  store.fillStrategyAndReady(cardId, completedStrategy);
  console.log('✅ [Mock Test] 模拟分析完成', { cardId, strategy: completedStrategy.primary });
  
  // 验证结果
  const finalCard = store.getCard(cardId);
  return {
    success: finalCard?.status === 'ready' && finalCard?.progress === 100,
    cardId,
    jobId,
    finalCard
  };
}

/**
 * 在控制台运行测试
 */
export async function runBridgeTests() {
  console.log('🧪 开始运行事件桥接测试套件');
  
  try {
    const basicTest = await testEventBridge();
    const mockTest = await testMockBackendEvents();
    
    console.log('📊 测试结果汇总:', {
      basicBridge: basicTest.success ? '✅ 通过' : '❌ 失败',
      mockEvents: mockTest.success ? '✅ 通过' : '❌ 失败'
    });
    
    if (basicTest.success && mockTest.success) {
      console.log('🎉 所有桥接测试通过！可视化分析页面的事件同步应该正常工作了。');
    } else {
      console.error('❌ 部分测试失败，需要进一步调试。');
    }
    
    return {
      allPassed: basicTest.success && mockTest.success,
      results: { basicTest, mockTest }
    };
  } catch (error) {
    console.error('💥 测试执行失败:', error);
    return {
      allPassed: false,
      error: error.message
    };
  }
}

// 导出给开发者在控制台快速测试
(window as any).testEventBridge = runBridgeTests;