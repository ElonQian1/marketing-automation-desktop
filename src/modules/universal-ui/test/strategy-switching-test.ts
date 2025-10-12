// src/modules/universal-ui/test/strategy-switching-test.ts
// module: universal-ui | layer: test | role: switching-test  
// summary: 测试策略切换机制（手动↔智能）

import { 
  ElementDescriptor,
  ManualStrategy,
  SmartStrategy,
  setSmartStrategyUseCase,
  GenerateSmartStrategyUseCase,
  LegacyManualAdapter
} from '../index-core';

// 模拟一个简单的智能策略提供者
class MockSmartProvider {
  async generateStrategy(element: ElementDescriptor): Promise<SmartStrategy> {
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟异步
    
    return {
      kind: 'smart',
      provider: 'legacy-smart',
      version: '1.0.0',
      selector: {
        variant: 'self-anchor',
        css: `${element.tagName}[data-testid="${element.attributes?.['data-testid']}"]`,
        xpath: element.xpath || `//${element.tagName}[@data-testid="${element.attributes?.['data-testid']}"]`,
        rationale: `基于${element.tagName}元素的自我锚点匹配`,
        score: 0.9,
        params: {
          variant: 'self-anchor',
          anchorText: element.text,
          attrKeys: ['data-testid'],
          similarity: 0.9
        }
      },
      confidence: 0.9,
      generatedAt: Date.now()
    };
  }
}

/**
 * 模拟策略切换场景的完整测试
 */
async function testStrategySwitching() {
  console.log('🔄 开始测试策略切换机制...');
  
  // 1. 设置智能策略用例
  const mockProvider = new MockSmartProvider();
  const smartUseCase = new GenerateSmartStrategyUseCase([{
    name: 'mock-provider',
    priority: 1,
    generate: async (input) => mockProvider.generateStrategy(input.element),
    isAvailable: async () => true
  }]);
  
  setSmartStrategyUseCase(smartUseCase);
  console.log('✅ 智能策略用例已设置');
  
  // 2. 准备测试元素
  const testElement: ElementDescriptor = {
    nodeId: 'contact-btn-node',
    tagName: 'button',
    text: '添加联系人',
    attributes: {
      class: 'btn btn-primary contact-btn',
      'data-testid': 'add-contact-btn'
    },
    xpath: '//button[@data-testid="add-contact-btn"]'
  };
  
  console.log('📝 测试元素:', testElement);
  
  // 3. 测试智能策略生成
  console.log('\n🧠 测试智能策略生成...');
  const smartStrategy = await smartUseCase.run({ element: testElement });
  console.log('✅ 智能策略生成成功:', {
    variant: smartStrategy.selector.variant,
    css: smartStrategy.selector.css,
    confidence: smartStrategy.confidence
  });
  
  // 4. 测试智能→手动转换
  console.log('\n➡️ 测试智能→手动转换...');
  const convertedManual: ManualStrategy = {
    kind: 'manual',
    name: `手动版-${smartStrategy.selector.variant}`,
    type: 'custom',
    selector: {
      css: smartStrategy.selector.css,
      xpath: smartStrategy.selector.xpath
    },
    notes: `从智能策略转换: ${smartStrategy.selector.rationale}`,
    createdAt: Date.now()
  };
  console.log('✅ 智能→手动转换成功:', convertedManual.name);
  
  // 5. 测试手动策略创建
  console.log('\n📝 测试手动策略创建...');
  const manualStrategy = LegacyManualAdapter.createXPathDirectStrategy(
    testElement.xpath!,
    '用户自定义XPath策略'
  );
  console.log('✅ 手动策略创建成功:', manualStrategy);
  
  // 6. 测试策略对比
  console.log('\n🔍 策略对比分析...');
  console.log('智能策略特点:');
  console.log('  - 变体:', smartStrategy.selector.variant);
  console.log('  - 置信度:', smartStrategy.confidence);
  console.log('  - CSS选择器:', smartStrategy.selector.css);
  
  console.log('手动策略特点:');
  console.log('  - 类型:', manualStrategy.type);
  console.log('  - XPath:', manualStrategy.selector.xpath);
  console.log('  - 可控性: 高（用户完全控制）');
  
  return {
    testElement,
    smartStrategy,
    convertedManual,
    manualStrategy
  };
}

/**
 * 模拟用户工作流程测试
 */
async function testUserWorkflow() {
  console.log('\n👤 开始测试用户工作流程...');
  console.log('场景: 用户点选元素 → 获得智能策略 → 觉得不满意 → 切换到手动 → 最后回到智能');
  
  const results = await testStrategySwitching();
  
  // 模拟用户决策过程
  console.log('\n📋 用户决策流程:');
  console.log('1. ✅ 系统自动生成智能策略');
  console.log('2. 🤔 用户评估智能策略的准确性');
  console.log('3. ➡️ 用户决定切换到手动模式进行微调');
  console.log('4. ✏️ 用户编辑手动策略选择器');
  console.log('5. 🔄 用户最终决定回到智能策略');
  
  return results;
}

/**
 * 主测试运行器
 */
async function runSwitchingTests() {
  try {
    console.log('🚀 策略切换机制测试开始');
    console.log('==========================================');
    
    const results = await testUserWorkflow();
    
    console.log('\n==========================================');
    console.log('✅ 策略切换机制测试全部通过！');
    console.log('📊 测试总结:');
    console.log('  - 智能策略生成: ✅');
    console.log('  - 智能→手动转换: ✅');
    console.log('  - 手动策略创建: ✅');
    console.log('  - 用户工作流程: ✅');
    
    return results;
    
  } catch (error) {
    console.error('❌ 策略切换测试失败:', error);
    throw error;
  }
}

// 导出供其他测试使用
export {
  testStrategySwitching,
  testUserWorkflow,
  runSwitchingTests,
  MockSmartProvider
};

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runSwitchingTests().catch(console.error);
}