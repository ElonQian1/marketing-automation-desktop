// src/modules/structural-matching/test/structural-matching-integration-test.ts
// module: structural-matching | layer: test | role: 集成测试
// summary: 验证新的结构化匹配系统的完整功能

import { StructuralMatchingCoordinator } from '../structural-matching-coordinator';
import { ElementInfo, XmlContext } from '../core/structural-matching-types';

/**
 * 🧪 结构化匹配集成测试
 */
export class StructuralMatchingIntegrationTest {
  
  /**
   * 🎯 测试完整的签名生成流程
   */
  static testCompleteSignatureGeneration(): boolean {
    console.log('🧪 [测试] 开始完整签名生成测试');
    
    try {
      // 🏗️ 模拟目标元素
      const targetElement: ElementInfo = {
        id: 'test-button-001',
        className: 'androidx.appcompat.widget.AppCompatButton',
        resourceId: 'com.example.app:id/submit_button',
        contentDesc: '提交按钮',
        text: '确认提交',
        bounds: '[100,200][300,250]',
        clickable: true,
        scrollable: false,
        parent: null
      };

      // 🌍 模拟XML上下文
      const xmlContext: XmlContext = {
        allElements: [
          targetElement,
          {
            id: 'parent-container',
            className: 'androidx.recyclerview.widget.RecyclerView',
            resourceId: 'com.example.app:id/main_list',
            contentDesc: '',
            text: '',
            bounds: '[0,0][400,600]',
            clickable: false,
            scrollable: true,
            parent: null
          }
        ],
        totalCount: 2
      };

      // 🚀 生成结构化签名配置
      const profile = StructuralMatchingCoordinator.generateProfile(targetElement, xmlContext);

      // ✅ 验证结果
      const isValid = 
        profile.containerAnchor !== undefined &&
        profile.ancestorChain !== undefined &&
        profile.skeletonRules !== undefined &&
        profile.completenessScore > 0;

      console.log('✅ [测试] 签名生成测试结果:', {
        containerXPath: profile.containerAnchor?.xpath,
        coreAttributeCount: profile.skeletonRules?.coreAttributes?.length || 0,
        completenessScore: profile.completenessScore,
        isValid
      });

      return isValid;

    } catch (error) {
      console.error('❌ [测试] 签名生成测试失败:', error);
      return false;
    }
  }

  /**
   * 🔄 测试后端格式转换
   */
  static testBackendFormatConversion(): boolean {
    console.log('🧪 [测试] 开始后端格式转换测试');

    try {
      const targetElement: ElementInfo = {
        id: 'test-element',
        className: 'TextView',
        resourceId: 'com.app:id/title',
        contentDesc: '标题文本',
        text: '主标题',
        bounds: '[50,100][350,140]',
        clickable: false,
        scrollable: false,
        parent: null
      };

      const xmlContext: XmlContext = {
        allElements: [targetElement],
        totalCount: 1
      };

      // 生成配置
      const profile = StructuralMatchingCoordinator.generateProfile(targetElement, xmlContext);
      
      // 转换为后端格式
      const backendFormat = StructuralMatchingCoordinator.convertToBackendFormat(profile);

      // 验证后端格式
      const hasRequiredFields = 
        typeof backendFormat.require_image_above_text === 'boolean' &&
        typeof backendFormat.allow_depth_flex === 'number' &&
        backendFormat.enhanced_rules !== undefined;

      console.log('✅ [测试] 后端格式转换结果:', {
        hasBasicFields: hasRequiredFields,
        enhancedRules: backendFormat.enhanced_rules ? Object.keys(backendFormat.enhanced_rules) : [],
        coreAttributeCount: backendFormat.enhanced_rules?.core_attributes?.length || 0
      });

      return hasRequiredFields;

    } catch (error) {
      console.error('❌ [测试] 后端格式转换测试失败:', error);
      return false;
    }
  }

  /**
   * 📊 测试完整性评分
   */
  static testCompletenessScoring(): boolean {
    console.log('🧪 [测试] 开始完整性评分测试');

    try {
      // 高质量元素（应该得高分）
      const highQualityElement: ElementInfo = {
        id: 'high-quality-btn',
        className: 'Button',
        resourceId: 'com.app:id/unique_button',
        contentDesc: '唯一按钮',
        text: '点击我',
        bounds: '[10,10][100,50]',
        clickable: true,
        scrollable: false,
        parent: null
      };

      // 低质量元素（应该得低分）
      const lowQualityElement: ElementInfo = {
        id: 'low-quality-view',
        className: 'View',
        resourceId: '',
        contentDesc: '',
        text: '',
        bounds: '[0,0][0,0]',
        clickable: false,
        scrollable: false,
        parent: null
      };

      const xmlContext: XmlContext = {
        allElements: [highQualityElement, lowQualityElement],
        totalCount: 2
      };

      // 生成两个配置并比较评分
      const highQualityProfile = StructuralMatchingCoordinator.generateProfile(highQualityElement, xmlContext);
      const lowQualityProfile = StructuralMatchingCoordinator.generateProfile(lowQualityElement, xmlContext);

      const scoreComparison = highQualityProfile.completenessScore > lowQualityProfile.completenessScore;

      console.log('✅ [测试] 完整性评分结果:', {
        highQualityScore: highQualityProfile.completenessScore,
        lowQualityScore: lowQualityProfile.completenessScore,
        scoreComparison: scoreComparison ? '✅ 高质量元素得分更高' : '❌ 评分逻辑异常'
      });

      return scoreComparison;

    } catch (error) {
      console.error('❌ [测试] 完整性评分测试失败:', error);
      return false;
    }
  }

  /**
   * 🏃‍♂️ 运行所有测试
   */
  static runAllTests(): { passed: number; total: number; success: boolean } {
    console.log('🚀 [测试套件] 开始运行结构化匹配集成测试');

    const tests = [
      { name: '完整签名生成', fn: this.testCompleteSignatureGeneration },
      { name: '后端格式转换', fn: this.testBackendFormatConversion },
      { name: '完整性评分', fn: this.testCompletenessScoring }
    ];

    let passed = 0;
    const total = tests.length;

    for (const test of tests) {
      console.log(`\n🧪 运行测试: ${test.name}`);
      try {
        const result = test.fn();
        if (result) {
          console.log(`✅ 测试通过: ${test.name}`);
          passed++;
        } else {
          console.log(`❌ 测试失败: ${test.name}`);
        }
      } catch (error) {
        console.error(`💥 测试异常: ${test.name}`, error);
      }
    }

    const success = passed === total;
    console.log(`\n📊 测试套件完成: ${passed}/${total} 通过 ${success ? '🎉' : '⚠️'}`);

    return { passed, total, success };
  }
}

// 🎯 如果直接运行此文件，执行测试
if (typeof window !== 'undefined' && (window as any).runStructuralMatchingTests) {
  (window as any).runStructuralMatchingTests = () => StructuralMatchingIntegrationTest.runAllTests();
}