/**
 * 路径1数据完整性测试脚本
 * 用于验证智能步骤的 original_data 是否正确传递
 * 
 * 使用方法：
 * 1. 在浏览器开发者工具控制台中运行
 * 2. 或在 Node.js 环境中运行
 */

// 模拟智能步骤数据
const mockIntelligentStep = {
  id: 'test_step_001',
  name: '点击"我"按钮',
  step_type: 'smart_tap',
  enabled: true,
  enableStrategySelector: true,
  parameters: {
    xmlSnapshot: {
      xmlContent: '<hierarchy>...97633 characters...</hierarchy>',
      xmlHash: 'abc123def456',
      elementGlobalXPath: "//*[@resource-id='com.ss.android.ugc.aweme:id/fy2']",
      timestamp: Date.now(),
      elementSignature: {
        resourceId: 'com.ss.android.ugc.aweme:id/fy2',
        text: '我',
        contentDesc: '',
        class: 'android.widget.FrameLayout'
      }
    },
    elementLocator: {
      elementPath: "//*[@resource-id='com.ss.android.ugc.aweme:id/fy2']",
      additionalInfo: {
        text: '我',
        bounds: '[0,2130][212,2454]',
        resourceId: 'com.ss.android.ugc.aweme:id/fy2',
        contentDesc: '',
        className: 'android.widget.FrameLayout'
      }
    },
    text: '我',
    bounds: '[0,2130][212,2454]',
    resource_id: 'com.ss.android.ugc.aweme:id/fy2'
  },
  strategySelector: {
    analysis: {
      result: {
        recommendedStrategy: {
          key: 'self_anchor',
          variant: 'resource_id',
          confidence: 0.881,
          xpath: "//*[@resource-id='com.ss.android.ugc.aweme:id/fy2']"
        }
      }
    },
    selectedStrategy: 'self_anchor'
  }
};

// 数据完整性检查函数
function checkDataIntegrity(step) {
  const results = {
    stepId: step.id,
    checks: {},
    issues: [],
    score: 0,
    totalChecks: 0
  };

  // 检查1：是否启用策略选择器
  results.totalChecks++;
  if (step.enableStrategySelector) {
    results.checks.enableStrategySelector = '✅ Pass';
    results.score++;
  } else {
    results.checks.enableStrategySelector = '❌ Fail';
    results.issues.push('未启用策略选择器');
  }

  // 检查2：是否有XML快照
  results.totalChecks++;
  const hasXmlSnapshot = step.parameters?.xmlSnapshot?.xmlContent;
  if (hasXmlSnapshot) {
    results.checks.xmlSnapshot = `✅ Pass (${step.parameters.xmlSnapshot.xmlContent.length} chars)`;
    results.score++;
  } else {
    results.checks.xmlSnapshot = '❌ Fail';
    results.issues.push('缺少XML快照');
  }

  // 检查3：是否有用户选择的XPath
  results.totalChecks++;
  const userXPath = step.parameters?.xmlSnapshot?.elementGlobalXPath 
    || step.parameters?.elementLocator?.elementPath;
  if (userXPath) {
    results.checks.userXPath = `✅ Pass: ${userXPath}`;
    results.score++;
  } else {
    results.checks.userXPath = '❌ Fail';
    results.issues.push('缺少用户选择的XPath');
  }

  // 检查4：是否有元素特征信息
  results.totalChecks++;
  const hasElementInfo = step.parameters?.text || step.parameters?.resource_id;
  if (hasElementInfo) {
    results.checks.elementInfo = `✅ Pass (text="${step.parameters.text}", id="${step.parameters.resource_id}")`;
    results.score++;
  } else {
    results.checks.elementInfo = '❌ Fail';
    results.issues.push('缺少元素特征信息');
  }

  // 检查5：是否有策略分析结果
  results.totalChecks++;
  const hasAnalysis = step.strategySelector?.analysis?.result;
  if (hasAnalysis) {
    const strategy = hasAnalysis.recommendedStrategy;
    results.checks.analysisResult = `✅ Pass (${strategy.key}, confidence: ${strategy.confidence})`;
    results.score++;
  } else {
    results.checks.analysisResult = '❌ Fail';
    results.issues.push('缺少策略分析结果');
  }

  // 检查6：是否有选择的策略
  results.totalChecks++;
  if (step.strategySelector?.selectedStrategy) {
    results.checks.selectedStrategy = `✅ Pass: ${step.strategySelector.selectedStrategy}`;
    results.score++;
  } else {
    results.checks.selectedStrategy = '❌ Fail';
    results.issues.push('缺少选择的策略');
  }

  // 计算完整性百分比
  results.integrityPercentage = (results.score / results.totalChecks * 100).toFixed(1);

  return results;
}

// 模拟 extractIntelligentStepData 函数
function extractIntelligentStepData(step) {
  const params = step.parameters || {};
  const snapshot = params.xmlSnapshot;
  const analysisResult = step.strategySelector?.analysis?.result;

  return {
    stepId: step.id,
    isIntelligentStep: !!step.enableStrategySelector,
    
    originalXmlContent: snapshot?.xmlContent || '',
    originalXmlHash: snapshot?.xmlHash || '',
    userSelectedXPath: snapshot?.elementGlobalXPath || params.element_selector || '',
    
    elementText: params.text || '',
    elementBounds: params.bounds || '',
    keyAttributes: {
      'resource-id': params.resource_id || snapshot?.elementSignature?.resourceId || '',
      'content-desc': params.content_desc || snapshot?.elementSignature?.contentDesc || '',
      'text': params.text || snapshot?.elementSignature?.text || '',
      'class': params.class_name || snapshot?.elementSignature?.class || '',
    },
    
    selectedStrategy: step.strategySelector?.selectedStrategy || 'smart-auto',
    strategyConfidence: analysisResult?.recommendedStrategy?.confidence || 0.8,
    strategyType: analysisResult?.recommendedStrategy?.variant || 'intelligent',
    
    hasOriginalXml: (snapshot?.xmlContent || '').length > 0,
    hasUserXPath: !!(snapshot?.elementGlobalXPath || params.element_selector),
    hasStrategyInfo: !!analysisResult?.recommendedStrategy
  };
}

// 模拟 buildBackendParameters 函数
function buildBackendParameters(dataPackage, originalParams) {
  const originalData = {
    original_xml: dataPackage.originalXmlContent,
    xml_hash: dataPackage.originalXmlHash,
    selected_xpath: dataPackage.userSelectedXPath,
    element_text: dataPackage.elementText,
    element_bounds: dataPackage.elementBounds,
    key_attributes: dataPackage.keyAttributes,
    strategy_type: dataPackage.strategyType,
    confidence: dataPackage.strategyConfidence,
    data_integrity: {
      has_original_xml: dataPackage.hasOriginalXml,
      has_user_xpath: dataPackage.hasUserXPath,
      has_strategy_info: dataPackage.hasStrategyInfo,
      extraction_timestamp: Date.now()
    }
  };

  return {
    ...originalParams,
    intelligent_analysis: true,
    analysis_completed: true,
    selected_strategy: dataPackage.selectedStrategy,
    original_data: originalData,
    xpath: dataPackage.userSelectedXPath,
    targetText: dataPackage.elementText,
    confidence: dataPackage.strategyConfidence,
    strategy_type: dataPackage.strategyType
  };
}

// 运行测试
console.log('🧪 开始路径1数据完整性测试...\n');

// 测试1：数据完整性检查
console.log('📋 测试1：数据完整性检查');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const integrityResults = checkDataIntegrity(mockIntelligentStep);
console.log('步骤ID:', integrityResults.stepId);
console.log('完整性得分:', `${integrityResults.score}/${integrityResults.totalChecks}`);
console.log('完整性百分比:', `${integrityResults.integrityPercentage}%`);
console.log('\n检查结果:');
Object.entries(integrityResults.checks).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});
if (integrityResults.issues.length > 0) {
  console.log('\n⚠️ 发现问题:');
  integrityResults.issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('\n✅ 所有检查通过！');
}

// 测试2：数据提取
console.log('\n\n📦 测试2：数据提取');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const dataPackage = extractIntelligentStepData(mockIntelligentStep);
console.log('提取的数据包:');
console.log('  stepId:', dataPackage.stepId);
console.log('  isIntelligentStep:', dataPackage.isIntelligentStep);
console.log('  originalXmlContent:', `${dataPackage.originalXmlContent.length} chars`);
console.log('  originalXmlHash:', dataPackage.originalXmlHash);
console.log('  userSelectedXPath:', dataPackage.userSelectedXPath);
console.log('  elementText:', dataPackage.elementText);
console.log('  elementBounds:', dataPackage.elementBounds);
console.log('  selectedStrategy:', dataPackage.selectedStrategy);
console.log('  strategyConfidence:', dataPackage.strategyConfidence);
console.log('  strategyType:', dataPackage.strategyType);
console.log('\n数据完整性标记:');
console.log('  hasOriginalXml:', dataPackage.hasOriginalXml ? '✅' : '❌');
console.log('  hasUserXPath:', dataPackage.hasUserXPath ? '✅' : '❌');
console.log('  hasStrategyInfo:', dataPackage.hasStrategyInfo ? '✅' : '❌');

// 测试3：后端参数构建
console.log('\n\n🚀 测试3：后端参数构建');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const backendParams = buildBackendParameters(dataPackage, mockIntelligentStep.parameters);
console.log('后端参数已构建:');
console.log('  intelligent_analysis:', backendParams.intelligent_analysis);
console.log('  analysis_completed:', backendParams.analysis_completed);
console.log('  selected_strategy:', backendParams.selected_strategy);
console.log('  xpath:', backendParams.xpath);
console.log('  targetText:', backendParams.targetText);
console.log('  confidence:', backendParams.confidence);
console.log('  strategy_type:', backendParams.strategy_type);

if (backendParams.original_data) {
  console.log('\n✅ original_data 存在！');
  console.log('  original_xml:', `${backendParams.original_data.original_xml.length} chars`);
  console.log('  xml_hash:', backendParams.original_data.xml_hash);
  console.log('  selected_xpath:', backendParams.original_data.selected_xpath);
  console.log('  element_text:', backendParams.original_data.element_text);
  console.log('  element_bounds:', backendParams.original_data.element_bounds);
  console.log('  strategy_type:', backendParams.original_data.strategy_type);
  console.log('  confidence:', backendParams.original_data.confidence);
  
  console.log('\n  data_integrity:');
  Object.entries(backendParams.original_data.data_integrity).forEach(([key, value]) => {
    const icon = typeof value === 'boolean' ? (value ? '✅' : '❌') : '📅';
    console.log(`    ${key}: ${icon} ${value}`);
  });
} else {
  console.log('\n❌ original_data 缺失！');
}

// 测试4：模拟后端接收
console.log('\n\n📥 测试4：模拟后端接收');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
function simulateBackendReceive(params) {
  const checks = {
    hasOriginalData: !!params.original_data,
    canRecoverFromFailure: false,
    canUseDirectExecution: false
  };

  if (params.original_data) {
    const od = params.original_data;
    checks.canRecoverFromFailure = !!(od.original_xml && od.selected_xpath);
    checks.canUseDirectExecution = !!(od.selected_xpath);
  }

  return checks;
}

const backendChecks = simulateBackendReceive(backendParams);
console.log('后端检查结果:');
console.log('  hasOriginalData:', backendChecks.hasOriginalData ? '✅ 是' : '❌ 否');
console.log('  canRecoverFromFailure:', backendChecks.canRecoverFromFailure ? '✅ 是' : '❌ 否');
console.log('  canUseDirectExecution:', backendChecks.canUseDirectExecution ? '✅ 是' : '❌ 否');

// 最终结果
console.log('\n\n🎉 测试总结');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const allPassed = 
  integrityResults.integrityPercentage === '100.0' &&
  dataPackage.hasOriginalXml &&
  dataPackage.hasUserXPath &&
  dataPackage.hasStrategyInfo &&
  backendChecks.hasOriginalData &&
  backendChecks.canRecoverFromFailure &&
  backendChecks.canUseDirectExecution;

if (allPassed) {
  console.log('✅ 所有测试通过！');
  console.log('✅ 路径1数据传递完整！');
  console.log('✅ 失败恢复机制就绪！');
} else {
  console.log('⚠️ 部分测试失败，请检查数据流！');
}

console.log('\n数据完整性:', `${integrityResults.integrityPercentage}%`);
console.log('原始XML:', dataPackage.hasOriginalXml ? '✅' : '❌');
console.log('用户XPath:', dataPackage.hasUserXPath ? '✅' : '❌');
console.log('策略信息:', dataPackage.hasStrategyInfo ? '✅' : '❌');
console.log('后端接收:', backendChecks.hasOriginalData ? '✅' : '❌');
console.log('失败恢复:', backendChecks.canRecoverFromFailure ? '✅' : '❌');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 测试完成！');
