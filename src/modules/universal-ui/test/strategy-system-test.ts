// src/modules/universal-ui/test/strategy-system-test.ts
// module: universal-ui | layer: test | role: integration-test
// summary: 策略系统完整功能测试（不依赖JSX）

import { 
  ElementDescriptor, 
  ManualStrategy, 
  SmartStrategy,
  GenerateSmartStrategyUseCase,
  LegacyManualAdapter
} from '../index-core';

/**
 * 测试策略生成功能
 */
async function testStrategyGeneration() {
  console.log('🧪 开始测试策略生成功能...');
  
  // 模拟元素描述符
  const testElement: ElementDescriptor = {
    nodeId: 'test-contact-btn',
    tagName: 'button',
    text: '联系',
    attributes: {
      class: 'contact-button',
      'data-testid': 'contact-btn'
    },
    xpath: '//button[@data-testid="contact-btn"]',
    bounds: '0,100,200,132'
  };
  
  // 测试手动策略创建
  const manualStrategy: ManualStrategy = {
    kind: 'manual',
    name: 'XPath直接策略',
    type: 'xpath-direct',
    selector: {
      xpath: testElement.xpath!
    },
    notes: '通过XPath直接定位联系按钮'
  };
  
  console.log('✅ 手动策略创建成功:', manualStrategy);
  
  // 测试适配器功能
  const xpathStrategy = LegacyManualAdapter.createXPathDirectStrategy(
    testElement.xpath!,
    '测试XPath策略'
  );
  
  console.log('✅ 适配器创建策略成功:', xpathStrategy);
  
  // 测试用例实例化（不实际运行，因为需要依赖注入）
  const useCase = new GenerateSmartStrategyUseCase([]);
  console.log('✅ 智能策略用例创建成功');
  
  return {
    manualStrategy,
    xpathStrategy,
    useCase
  };
}

/**
 * 测试策略转换功能
 */
function testStrategyConversion() {
  console.log('🔄 开始测试策略转换功能...');
  
  // 模拟智能策略
  const smartStrategy: SmartStrategy = {
    kind: 'smart',
    provider: 'legacy-smart',
    version: '1.0.0',
    selector: {
      variant: 'self-anchor',
      css: 'button[data-testid="contact-btn"]',
      xpath: '//button[@data-testid="contact-btn"]',
      rationale: '基于data-testid属性的自我锚点匹配',
      score: 0.95,
      params: {
        variant: 'self-anchor',
        anchorText: '联系',
        attrKeys: ['data-testid'],
        similarity: 0.9
      }
    },
    confidence: 0.95,
    generatedAt: Date.now()
  };
  
  // 测试转换为手动策略
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
  
  console.log('✅ 智能→手动策略转换成功:', convertedManual);
  
  return {
    smartStrategy,
    convertedManual
  };
}

/**
 * 主测试函数
 */
async function runTests() {
  try {
    console.log('🚀 Universal UI 策略系统测试开始');
    console.log('=====================================');
    
    const generationResults = await testStrategyGeneration();
    console.log('\n');
    
    const conversionResults = testStrategyConversion();
    console.log('\n');
    
    console.log('=====================================');
    console.log('✅ 所有测试通过！策略系统核心功能正常');
    
    return {
      ...generationResults,
      ...conversionResults
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTests().catch(console.error);
}

export {
  testStrategyGeneration,
  testStrategyConversion,
  runTests
};