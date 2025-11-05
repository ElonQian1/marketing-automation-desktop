// src/modules/structural-matching/services/structural-matching-example-usage.ts
// module: structural-matching | layer: services | role: 使用示例和集成指南
// summary: 展示结构匹配默认配置服务的各种使用方式

import { 
  generateSmartFieldConfig,
  generateElementSmartConfig,
  generateTreeSmartConfig,
  getStructuralMatchingConfigSummary,
  isFieldMeaningful
} from './structural-matching-config-service';
import { FieldType } from '../domain/constants/field-types';
import { SkeletonMatchMode } from '../domain/skeleton-match-strategy';

/**
 * 🧪 基础使用示例
 */
export class StructuralMatchingUsageExamples {
  /**
   * 示例1：单个字段配置
   */
  static singleFieldExample() {
    console.log('=== 单个字段配置示例 ===');
    
    // 为登录按钮的text字段生成配置
    const textConfig = generateSmartFieldConfig(
      FieldType.TEXT, 
      "登录", 
      { 
        mode: SkeletonMatchMode.FAMILY,
        enableSmartConfig: true 
      }
    );
    
    console.log('Text字段配置:', textConfig);
    // 输出：{ enabled: true, strategy: "BOTH_NON_EMPTY", isMeaningful: true, ... }

    // 对比空文本字段
    const emptyTextConfig = generateSmartFieldConfig(
      FieldType.TEXT, 
      "", 
      { 
        mode: SkeletonMatchMode.FAMILY,
        enableSmartConfig: true 
      }
    );
    
    console.log('空Text字段配置:', emptyTextConfig);
    // 输出：{ enabled: false, strategy: "CONSISTENT_EMPTINESS", isMeaningful: false, ... }
  }

  /**
   * 示例2：完整元素配置
   */
  static fullElementExample() {
    console.log('=== 完整元素配置示例 ===');
    
    const loginButton = {
      text: "登录",
      class_name: "Button",
      resource_id: "com.app:id/login_btn", 
      clickable: true,
      enabled: true,
      focusable: false, // 默认值，无意义
      bounds: "[0,0][100,50]"
    };

    // Family模式配置
    const familyConfig = generateElementSmartConfig(
      loginButton, 
      "login-button", 
      {
        mode: SkeletonMatchMode.FAMILY,
        ignoreVolatileFields: false
      }
    );
    
    console.log('Family模式配置:', {
      elementPath: familyConfig.elementPath,
      meaningfulFields: familyConfig.meaningfulFieldCount,
      enabledFields: familyConfig.enabledFieldCount,
      strategies: Object.entries(familyConfig.fieldConfigs)
        .filter(([, config]) => config.enabled)
        .map(([field, config]) => ({ field, strategy: config.strategy }))
    });

    // Clone模式配置
    const cloneConfig = generateElementSmartConfig(
      loginButton, 
      "login-button", 
      {
        mode: SkeletonMatchMode.CLONE,
        ignoreVolatileFields: false
      }
    );
    
    console.log('Clone模式配置:', {
      strategiesDiff: Object.entries(cloneConfig.fieldConfigs)
        .filter(([, config]) => config.enabled)
        .map(([field, config]) => ({ 
          field, 
          strategy: config.strategy,
          familyStrategy: familyConfig.fieldConfigs[field as keyof typeof familyConfig.fieldConfigs]?.strategy
        }))
        .filter(item => item.strategy !== item.familyStrategy)
    });
  }

  /**
   * 示例3：多元素批量配置
   */
  static multiElementExample() {
    console.log('=== 多元素批量配置示例 ===');
    
    const elements = [
      { 
        text: "登录", 
        class_name: "Button", 
        clickable: true,
        resource_id: "login_btn"
      },
      { 
        text: "", 
        class_name: "TextView", 
        enabled: false,
        content_desc: "空状态提示"
      },
      { 
        text: "用户名", 
        class_name: "EditText", 
        focusable: true,
        resource_id: "username_input"
      }
    ];

    const treeConfig = generateTreeSmartConfig(elements, {
      mode: SkeletonMatchMode.FAMILY,
      ignoreVolatileFields: true
    });

    treeConfig.forEach((config, index) => {
      console.log(`元素${index + 1}配置:`, {
        elementPath: config.elementPath,
        meaningful: config.meaningfulFieldCount,
        enabled: config.enabledFieldCount,
        质量评级: config.meaningfulFieldCount >= 3 ? '高' : 
                   config.meaningfulFieldCount >= 2 ? '中' : '低'
      });
    });
  }

  /**
   * 示例4：字段意义判断
   */
  static fieldMeaningfulnessExample() {
    console.log('=== 字段意义判断示例 ===');
    
    const testCases = [
      { type: FieldType.TEXT, value: "登录", expected: true },
      { type: FieldType.TEXT, value: "", expected: false },
      { type: FieldType.CLASS_NAME, value: "Button", expected: true },
      { type: FieldType.CLICKABLE, value: "true", expected: true },
      { type: FieldType.CLICKABLE, value: "false", expected: false }, // 默认值
      { type: FieldType.ENABLED, value: "false", expected: true }, // 非默认值
      { type: FieldType.BOUNDS, value: "[0,0][100,50]", expected: true }
    ];

    testCases.forEach(({ type, value, expected }, index) => {
      const isMeaningful = isFieldMeaningful(type, value);
      console.log(`测试${index + 1}:`, {
        field: type,
        value,
        meaningful: isMeaningful,
        correct: isMeaningful === expected ? '✅' : '❌'
      });
    });
  }

  /**
   * 示例5：配置摘要
   */
  static configSummaryExample() {
    console.log('=== 配置摘要示例 ===');
    
    const summary = getStructuralMatchingConfigSummary({
      mode: SkeletonMatchMode.FAMILY,
      ignoreVolatileFields: true,
      enableSmartConfig: true
    });
    
    console.log('配置摘要:', {
      mode: summary.mode,
      ignoreVolatile: summary.ignoreVolatileFields,
      methodology: {
        meaningfulnessRule: summary.methodology.meaningfulnessRule,
        autoEnableRule: summary.methodology.autoEnableRule,
        strategyRule: summary.methodology.strategyRule
      }
    });
  }

  /**
   * 运行所有示例
   */
  static runAllExamples() {
    this.singleFieldExample();
    console.log('\n');
    this.fullElementExample();
    console.log('\n'); 
    this.multiElementExample();
    console.log('\n');
    this.fieldMeaningfulnessExample();
    console.log('\n');
    this.configSummaryExample();
  }
}

/**
 * 🔧 实际业务集成示例
 */
export class BusinessIntegrationExamples {
  /**
   * 步骤执行器集成
   */
  static stepExecutorIntegration() {
    console.log('=== 步骤执行器集成示例 ===');
    
    // 模拟步骤目标元素
    const targetElement = {
      text: "提交订单",
      class_name: "Button", 
      resource_id: "submit_order",
      clickable: true,
      enabled: true
    };

    // 生成步骤配置
    const stepConfig = generateElementSmartConfig(targetElement, "submit-button", {
      mode: SkeletonMatchMode.FAMILY, // 点击步骤允许同类元素
      ignoreVolatileFields: true,     // 忽略动态内容
      enableSmartConfig: true
    });

    // 评估配置质量
    const quality = stepConfig.meaningfulFieldCount >= 3 ? 'high' :
                   stepConfig.meaningfulFieldCount >= 2 ? 'medium' : 'low';

    console.log('步骤目标配置:', {
      quality,
      meaningful: stepConfig.meaningfulFieldCount,
      enabled: stepConfig.enabledFieldCount,
      recommendation: quality === 'high' ? '可靠目标' : 
                     quality === 'medium' ? '需要验证' : '目标不稳定'
    });

    return stepConfig;
  }

  /**
   * 批量操作集成
   */
  static batchOperationIntegration() {
    console.log('=== 批量操作集成示例 ===');
    
    // 模拟批量目标元素
    const batchElements = [
      { text: "商品1", class_name: "ProductCard", clickable: true, resource_id: "product_1" },
      { text: "商品2", class_name: "ProductCard", clickable: true, resource_id: "product_2" }, 
      { text: "商品3", class_name: "ProductCard", clickable: true, resource_id: "product_3" }
    ];

    const batchConfigs = generateTreeSmartConfig(batchElements, {
      mode: SkeletonMatchMode.FAMILY, // 批量找同类
      ignoreVolatileFields: true,     // 忽略商品ID等动态内容  
      enableSmartConfig: true
    });

    // 批量配置分析
    const analysis = {
      totalElements: batchConfigs.length,
      avgMeaningful: batchConfigs.reduce((sum, c) => sum + c.meaningfulFieldCount, 0) / batchConfigs.length,
      avgEnabled: batchConfigs.reduce((sum, c) => sum + c.enabledFieldCount, 0) / batchConfigs.length,
      reliability: batchConfigs.every(c => c.meaningfulFieldCount >= 3) ? 'high' :
                   batchConfigs.every(c => c.meaningfulFieldCount >= 2) ? 'medium' : 'low'
    };

    console.log('批量操作分析:', analysis);
    return { configs: batchConfigs, analysis };
  }

  /**
   * 脚本生成器集成
   */
  static scriptGeneratorIntegration() {
    console.log('=== 脚本生成器集成示例 ===');
    
    // 分析不同类型元素的最佳策略
    const scenarios = [
      {
        name: '稳定UI元素',
        elements: [
          { text: "登录", class_name: "Button", resource_id: "login", clickable: true }
        ]
      },
      {
        name: '动态内容元素', 
        elements: [
          { text: "2024-01-15 10:30", class_name: "TextView", content_desc: "时间显示" }
        ]
      },
      {
        name: '特征稀少元素',
        elements: [
          { class_name: "View", clickable: true } // 只有基本信息
        ]
      }
    ];

    scenarios.forEach(scenario => {
      // 尝试不同配置策略
      const familyConfig = generateTreeSmartConfig(scenario.elements, {
        mode: SkeletonMatchMode.FAMILY,
        ignoreVolatileFields: true
      });

      const cloneConfig = generateTreeSmartConfig(scenario.elements, {
        mode: SkeletonMatchMode.CLONE,
        ignoreVolatileFields: false
      });

      console.log(`${scenario.name}策略建议:`, {
        familyQuality: familyConfig[0]?.meaningfulFieldCount || 0,
        cloneQuality: cloneConfig[0]?.meaningfulFieldCount || 0,
        recommendation: (familyConfig[0]?.meaningfulFieldCount || 0) >= 2 ? 'Family模式' : 'Clone模式'
      });
    });
  }

  /**
   * 运行所有业务集成示例
   */
  static runAllBusinessExamples() {
    this.stepExecutorIntegration();
    console.log('\n');
    this.batchOperationIntegration(); 
    console.log('\n');
    this.scriptGeneratorIntegration();
  }
}

/**
 * 🎯 快速测试函数
 */
export function quickTest() {
  console.log('🧪 结构匹配默认配置服务 - 快速测试');
  console.log('================================================\n');
  
  // 运行基础示例
  StructuralMatchingUsageExamples.runAllExamples();
  
  console.log('\n📋 业务集成示例');
  console.log('================================================\n');
  
  // 运行业务示例
  BusinessIntegrationExamples.runAllBusinessExamples();
  
  console.log('\n✅ 测试完成 - 结构匹配默认配置服务工作正常！');
}

// 如果直接运行此文件，执行快速测试
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Node.js环境下的测试
  quickTest();
}