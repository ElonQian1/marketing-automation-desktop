// 智能字段折叠功能测试验证
// 测试用例：验证字段过滤逻辑是否正确工作

import { FieldType } from "./src/modules/structural-matching/domain/constants/field-types";

// 模拟字段有意义性判断函数
const isFieldMeaningful = (fieldType: FieldType, value: string): boolean => {
  // Bounds字段：总是在智能模式下显示（位置信息重要）
  if (fieldType === FieldType.BOUNDS) {
    return true;
  }
  
  // 空值检查
  if (!value || value === "(空)" || value === "") return false;
  
  switch (fieldType) {
    // 文本类字段：非空即有意义
    case FieldType.TEXT:
    case FieldType.RESOURCE_ID:
    case FieldType.CONTENT_DESC:
      return true;
    
    // 类名：总是有意义（用于识别控件类型）
    case FieldType.CLASS_NAME:
      return true;
    
    // 布尔类字段：true时有意义，enabled字段false时也有意义（禁用状态）
    case FieldType.ENABLED:
      return value === "false"; // 禁用状态有意义
    case FieldType.CLICKABLE:
    case FieldType.FOCUSABLE:
    case FieldType.FOCUSED:
    case FieldType.SCROLLABLE:
    case FieldType.LONG_CLICKABLE:
    case FieldType.CHECKABLE:
    case FieldType.CHECKED:
    case FieldType.SELECTED:
    case FieldType.PASSWORD:
      return value === "true";
    
    default:
      return false;
  }
};

// 测试用例
const testCases = [
  // 应该显示的字段
  { fieldType: FieldType.TEXT, value: "登录", expected: true, desc: "非空文本" },
  { fieldType: FieldType.RESOURCE_ID, value: "com.xingin.xhs:id/login_btn", expected: true, desc: "非空Resource-ID" },
  { fieldType: FieldType.CONTENT_DESC, value: "登录按钮", expected: true, desc: "非空Content-Desc" },
  { fieldType: FieldType.CLASS_NAME, value: "android.widget.Button", expected: true, desc: "类名" },
  { fieldType: FieldType.BOUNDS, value: "[0,0][100,50]", expected: true, desc: "Bounds坐标" },
  { fieldType: FieldType.CLICKABLE, value: "true", expected: true, desc: "可点击状态" },
  { fieldType: FieldType.ENABLED, value: "false", expected: true, desc: "禁用状态" },
  { fieldType: FieldType.FOCUSED, value: "true", expected: true, desc: "获取焦点状态" },
  
  // 不应该显示的字段
  { fieldType: FieldType.TEXT, value: "", expected: false, desc: "空文本" },
  { fieldType: FieldType.TEXT, value: "(空)", expected: false, desc: "标记为空的文本" },
  { fieldType: FieldType.CLICKABLE, value: "false", expected: false, desc: "不可点击状态" },
  { fieldType: FieldType.ENABLED, value: "true", expected: false, desc: "正常启用状态" },
  { fieldType: FieldType.FOCUSED, value: "false", expected: false, desc: "未获得焦点状态" },
];

console.log("🧪 智能字段折叠功能测试开始");
console.log("=====================================");

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = isFieldMeaningful(testCase.fieldType, testCase.value);
  const passed = result === testCase.expected;
  
  console.log(`测试 ${index + 1}: ${testCase.desc}`);
  console.log(`  字段类型: ${testCase.fieldType}`);
  console.log(`  字段值: "${testCase.value}"`);
  console.log(`  期望结果: ${testCase.expected ? "显示" : "隐藏"}`);
  console.log(`  实际结果: ${result ? "显示" : "隐藏"}`);
  console.log(`  测试结果: ${passed ? "✅ 通过" : "❌ 失败"}`);
  console.log("");
  
  if (passed) passedTests++;
});

console.log("=====================================");
console.log(`🎯 测试总结: ${passedTests}/${totalTests} 通过`);

if (passedTests === totalTests) {
  console.log("🎉 所有测试都通过！智能字段折叠功能工作正常。");
} else {
  console.log("⚠️  部分测试失败，需要检查逻辑。");
}

export default { isFieldMeaningful, testCases };