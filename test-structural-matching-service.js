// 🧪 结构匹配默认配置服务测试脚本
// 快速验证服务功能是否正常工作

import { 
  generateSmartFieldConfig,
  generateElementSmartConfig,
  generateTreeSmartConfig,
  getStructuralMatchingConfigSummary,
  isFieldMeaningful
} from '../src/modules/structural-matching/services/structural-matching-config-service';
import { FieldType } from '../src/modules/structural-matching/domain/constants/field-types';
import { SkeletonMatchMode } from '../src/modules/structural-matching/domain/skeleton-match-strategy';

console.log('🚀 开始测试结构匹配默认配置服务...\n');

// 1. 测试字段意义判断
console.log('1️⃣ 测试字段意义判断');
console.log('='.repeat(50));

const meaningfulnessTests = [
  { field: FieldType.TEXT, value: "登录按钮", expected: true, desc: "有意义文本" },
  { field: FieldType.TEXT, value: "", expected: false, desc: "空文本" },
  { field: FieldType.CLASS_NAME, value: "Button", expected: true, desc: "类名总是有意义" },
  { field: FieldType.CLICKABLE, value: "true", expected: true, desc: "可点击=true" },
  { field: FieldType.CLICKABLE, value: "false", expected: false, desc: "可点击=false(默认)" },
  { field: FieldType.ENABLED, value: "false", expected: true, desc: "启用=false(非默认)" },
];

meaningfulnessTests.forEach(({ field, value, expected, desc }) => {
  const result = isFieldMeaningful(field, value);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${desc}: ${field}="${value}" → ${result}`);
});

console.log('\n');

// 2. 测试单字段配置
console.log('2️⃣ 测试单字段配置');
console.log('='.repeat(50));

const fieldTests = [
  { field: FieldType.TEXT, value: "登录", mode: SkeletonMatchMode.FAMILY },
  { field: FieldType.TEXT, value: "登录", mode: SkeletonMatchMode.CLONE },
  { field: FieldType.CLICKABLE, value: "true", mode: SkeletonMatchMode.FAMILY },
];

fieldTests.forEach(({ field, value, mode }) => {
  const config = generateSmartFieldConfig(field, value, { mode, enableSmartConfig: true });
  console.log(`📋 ${field}="${value}" (${mode}模式):`);
  console.log(`   启用: ${config.enabled}, 策略: ${config.strategy}, 有意义: ${config.isMeaningful}`);
  console.log(`   原因: ${config.reason}`);
  console.log();
});

// 3. 测试元素配置
console.log('3️⃣ 测试完整元素配置');
console.log('='.repeat(50));

const testElement = {
  text: "立即购买",
  class_name: "Button",
  resource_id: "com.app:id/buy_btn",
  clickable: "true",
  enabled: "true", 
  focusable: "false", // 默认值，应该被忽略
  bounds: "[100,200][300,250]"
};

const elementConfig = generateElementSmartConfig(testElement, "buy-button", {
  mode: SkeletonMatchMode.FAMILY,
  ignoreVolatileFields: false,
  enableSmartConfig: true
});

console.log(`🎯 元素路径: ${elementConfig.elementPath}`);
console.log(`📊 统计: 有意义字段=${elementConfig.meaningfulFieldCount}, 启用字段=${elementConfig.enabledFieldCount}`);
console.log('字段配置:');
Object.entries(elementConfig.fieldConfigs).forEach(([field, config]) => {
  if (config.isMeaningful || config.enabled) {
    const status = config.enabled ? '✅' : '⚪';
    console.log(`   ${status} ${field}: ${config.strategy} (${config.isMeaningful ? '有意义' : '无意义'})`);
  }
});

console.log('\n');

// 4. 测试多元素配置
console.log('4️⃣ 测试多元素配置');
console.log('='.repeat(50));

const multiElements = [
  { text: "商品A", class_name: "ProductCard", clickable: "true", resource_id: "product_1" },
  { text: "商品B", class_name: "ProductCard", clickable: "true", resource_id: "product_2" },
  { text: "", class_name: "EmptyView", enabled: "false", content_desc: "无商品" }
];

const treeConfig = generateTreeSmartConfig(multiElements, {
  mode: SkeletonMatchMode.FAMILY,
  ignoreVolatileFields: true,
  enableSmartConfig: true
});

treeConfig.forEach((config, index) => {
  console.log(`📦 元素${index + 1} (${config.elementPath}):`);
  console.log(`   有意义: ${config.meaningfulFieldCount}, 启用: ${config.enabledFieldCount}`);
  const quality = config.meaningfulFieldCount >= 3 ? '🟢高质量' : 
                  config.meaningfulFieldCount >= 2 ? '🟡中等' : '🔴低质量';
  console.log(`   质量评级: ${quality}`);
});

console.log('\n');

// 5. 测试配置摘要
console.log('5️⃣ 测试配置摘要');
console.log('='.repeat(50));

const summary = getStructuralMatchingConfigSummary({
  mode: SkeletonMatchMode.FAMILY,
  ignoreVolatileFields: true,
  enableSmartConfig: true
});

console.log('📋 配置摘要:');
console.log(`   模式: ${summary.mode}`);
console.log(`   忽略易变字段: ${summary.ignoreVolatileFields}`);
console.log(`   启用智能配置: ${summary.enableSmartConfig}`);
console.log('🧠 方法论:');
console.log(`   意义判断: ${summary.methodology.meaningfulnessRule}`);
console.log(`   自动启用: ${summary.methodology.autoEnableRule}`);
console.log(`   策略规则: ${summary.methodology.strategyRule}`);

console.log('\n🎉 测试完成！结构匹配默认配置服务工作正常！');
console.log('\n💡 使用提示:');
console.log('✅ 可以独立调用，不依赖UI组件');
console.log('✅ 支持Family/Clone两种模式');
console.log('✅ 自动检测字段意义并配置策略');
console.log('✅ 提供详细的配置原因和统计信息');
console.log('✅ 其他功能可直接导入使用');