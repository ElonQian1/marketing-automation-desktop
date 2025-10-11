// src/modules/intelligent-strategy-system/tests/integration.test.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 智能策略系统集成测试
 * 验证 scoring 模块与主系统的完整集成
 * 
 * @description 测试评分系统的核心功能，包括策略推荐、评分和唯一性验证
 */

import { 
  createIntelligentStrategy,
  getRecommendationWithScoring,
  getComprehensiveAnalysis,
  createCompleteScoringSystem,
  quickScore,
  quickValidateUniqueness
} from '../index';

/**
 * 模拟数据
 */
const mockElement = {
  'resource-id': 'com.example:id/button',
  text: '确认',
  'content-desc': '确认按钮',
  class: 'android.widget.Button',
  bounds: '[100,200][300,250]'
};

const mockXmlContent = `
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.LinearLayout" package="com.example" bounds="[0,0][1080,2400]">
    <node index="0" text="确认" resource-id="com.example:id/button" class="android.widget.Button" bounds="[100,200][300,250]" content-desc="确认按钮" />
  </node>
</hierarchy>
`;

/**
 * 测试智能策略推荐与评分集成
 */
export async function testRecommendationWithScoring() {
  console.log('🎯 测试：智能策略推荐 + 评分集成');
  
  try {
    const result = await getRecommendationWithScoring(mockElement, mockXmlContent);
    
    console.log('✅ 推荐策略:', result.recommendedStrategy);
    console.log('✅ 评分结果:', {
      总分: result.scoring.overallScore,
      性能: result.scoring.performance?.score || '未评估',
      稳定性: result.scoring.stability?.score || '未评估'
    });
    
    return {
      success: true,
      recommendedStrategy: result.recommendedStrategy,
      overallScore: result.scoring.overallScore
    };
  } catch (error) {
    console.error('❌ 推荐与评分集成测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 测试完整评分系统
 */
export async function testCompleteScoringSystem() {
  console.log('🎯 测试：完整评分系统');
  
  try {
    const scoringSystem = createCompleteScoringSystem();
    
    console.log('✅ 评分系统组件:', {
      hasWeightConfig: !!scoringSystem.weightConfig,
      hasPerformance: !!scoringSystem.performance,
      hasStability: !!scoringSystem.stability,
      hasScorer: !!scoringSystem.scorer,
      hasValidator: !!scoringSystem.uniquenessValidator
    });
    
    // 测试单个策略评分
    const context = {
      element: mockElement,
      xmlContent: mockXmlContent,
      deviceProfiles: [],
      resolutionProfiles: [],
      appVersions: []
    };
    
    const evaluationResult = await scoringSystem.evaluateStrategy('standard', context);
    
    console.log('✅ 策略评估结果:', {
      总分: evaluationResult.overallScore,
      详细结果: !!evaluationResult.detailed
    });
    
    return {
      success: true,
      systemComponents: {
        weightConfig: !!scoringSystem.weightConfig,
        performance: !!scoringSystem.performance,
        stability: !!scoringSystem.stability,
        scorer: !!scoringSystem.scorer,
        validator: !!scoringSystem.uniquenessValidator
      },
      overallScore: evaluationResult.overallScore
    };
  } catch (error) {
    console.error('❌ 完整评分系统测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 测试唯一性验证功能
 */
export async function testUniquenessValidation() {
  console.log('🎯 测试：唯一性验证功能');
  
  try {
    // 模拟策略推荐列表（包含重复和相似策略）
    const mockRecommendations = [
      {
        strategy: 'standard' as const,
        confidence: 0.9,
        reason: '最佳平衡策略',
        score: 85,
        performance: {
          speed: 'fast' as const,
          stability: 'high' as const,
          crossDevice: 'excellent' as const
        },
        alternatives: [],
        tags: [],
        scenarios: []
      },
      {
        strategy: 'strict' as const,
        confidence: 0.8,
        reason: '高精度策略',
        score: 80,
        performance: {
          speed: 'medium' as const,
          stability: 'high' as const,
          crossDevice: 'good' as const
        },
        alternatives: [],
        tags: [],
        scenarios: []
      },
      {
        strategy: 'standard' as const, // 重复策略
        confidence: 0.7,
        reason: '重复的标准策略',
        score: 75,
        performance: {
          speed: 'fast' as const,
          stability: 'medium' as const,
          crossDevice: 'good' as const
        },
        alternatives: [],
        tags: [],
        scenarios: []
      }
    ];
    
    const context = {
      element: mockElement,
      xmlContent: mockXmlContent
    };
    
    const validationResult = await quickValidateUniqueness(mockRecommendations, context);
    
    console.log('✅ 验证结果:', {
      验证通过: validationResult.isValid,
      原始数量: validationResult.summary.originalCount,
      过滤后数量: validationResult.summary.filteredCount,
      移除数量: validationResult.summary.removedCount,
      质量评分: validationResult.summary.qualityScore
    });
    
    console.log('✅ 检测到的问题:', {
      相似性分析: validationResult.similarityAnalyses.length,
      冲突检测: validationResult.conflictDetections.length
    });
    
    return {
      success: true,
      validation: {
        isValid: validationResult.isValid,
        originalCount: validationResult.summary.originalCount,
        filteredCount: validationResult.summary.filteredCount,
        removedCount: validationResult.summary.removedCount,
        qualityScore: validationResult.summary.qualityScore
      }
    };
  } catch (error) {
    console.error('❌ 唯一性验证测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 测试综合分析功能
 */
export async function testComprehensiveAnalysis() {
  console.log('🎯 测试：综合分析功能');
  
  try {
    const mockElements = [mockElement];
    
    const analysisResult = await getComprehensiveAnalysis(mockElements, mockXmlContent);
    
    console.log('✅ 综合分析结果:', {
      总元素数: analysisResult.summary.totalElements,
      推荐策略数: analysisResult.summary.recommendedStrategies,
      平均质量: analysisResult.summary.averageQuality
    });
    
    console.log('✅ 分析详情:', {
      推荐数量: analysisResult.recommendations.length,
      评分结果: !!analysisResult.scoring,
      验证结果: !!analysisResult.scoring.validation
    });
    
    return {
      success: true,
      summary: analysisResult.summary,
      hasRecommendations: analysisResult.recommendations.length > 0,
      hasScoring: !!analysisResult.scoring,
      hasValidation: !!analysisResult.scoring.validation
    };
  } catch (error) {
    console.error('❌ 综合分析测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 运行所有集成测试
 */
export async function runAllIntegrationTests() {
  console.log('\n🚀 开始智能策略系统集成测试\n');
  
  const results = {
    recommendationWithScoring: await testRecommendationWithScoring(),
    completeScoringSystem: await testCompleteScoringSystem(),
    uniquenessValidation: await testUniquenessValidation(),
    comprehensiveAnalysis: await testComprehensiveAnalysis()
  };
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\n📊 集成测试总结:');
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有集成测试通过！智能策略系统评分模块集成成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查错误信息');
  }
  
  return {
    totalTests: totalCount,
    successfulTests: successCount,
    results,
    allPassed: successCount === totalCount
  };
}

/**
 * 快速验证接口
 */
export async function quickIntegrationTest() {
  console.log('⚡ 快速集成验证...');
  
  try {
    // 测试基本导入
    const engine = createIntelligentStrategy();
    const scoringSystem = createCompleteScoringSystem();
    
    console.log('✅ 基本导入正常');
    console.log('✅ 引擎创建成功:', !!engine);
    console.log('✅ 评分系统创建成功:', !!scoringSystem);
    
    return { success: true, message: '快速验证通过' };
  } catch (error) {
    console.error('❌ 快速验证失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export default {
  runAllIntegrationTests,
  quickIntegrationTest,
  testRecommendationWithScoring,
  testCompleteScoringSystem,
  testUniquenessValidation,
  testComprehensiveAnalysis
};