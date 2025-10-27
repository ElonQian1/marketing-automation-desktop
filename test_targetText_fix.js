// test_targetText_fix.js
// 测试targetText修复是否生效

// 模拟步骤参数（无明确text/content_desc）
const mockStep = {
  id: 'step_test',
  name: '智能操作 1',  // 这是问题的源头
  step_type: 'smart_tap',
  parameters: {
    // 注意：没有 text 或 content_desc
    element_selector: '//android.widget.TextView[@resource-id="com.xingin.xhs:id/b6h"]',
    bounds: '[508,1041][572,1118]'
  }
};

const mockParams = mockStep.parameters;

// 复制修复后的 extractTargetTextFromStep 逻辑
function extractTargetTextFromStep(step, params) {
  // 1. 优先使用params中明确的文本（原文不变）
  if (params.text && typeof params.text === 'string' && params.text.trim()) {
    console.log('🎯 使用params.text原文:', params.text);
    return params.text;
  }
  
  // 2. 使用content_desc原文（完全不处理）
  if (params.content_desc && typeof params.content_desc === 'string' && params.content_desc.trim()) {
    console.log('🎯 使用content_desc原文:', params.content_desc);
    return params.content_desc;
  }
  
  // 3. 从element_selector xpath提取文本条件（保留原文）
  if (params.element_selector && typeof params.element_selector === 'string') {
    const textMatch = params.element_selector.match(/@text\s*=\s*[""']([^""']+)[""']/);
    if (textMatch && textMatch[1]) {
      console.log('🎯 从XPath提取原文文本:', textMatch[1]);
      return textMatch[1];
    }
  }
  
  // 4. ⚠️ 重要修复：不再使用step.name作为targetText
  // 当元素没有明确文本时，应该返回空字符串让后端进行智能分析
  console.log('🎯 元素无明确文本，返回空字符串触发后端智能分析:', {
    stepName: step.name,
    stepType: step.step_type,
    paramsText: params.text,
    contentDesc: params.content_desc,
    reason: '避免硬编码步骤名称误导后端匹配逻辑'
  });
  
  return '';
}

// 测试修复
console.log('=== 测试targetText修复 ===');
const result = extractTargetTextFromStep(mockStep, mockParams);

console.log('\n=== 测试结果 ===');
console.log('输入步骤名称:', mockStep.name);
console.log('输入参数.text:', mockParams.text);
console.log('输入参数.content_desc:', mockParams.content_desc);
console.log('修复后的targetText:', `"${result}"`);
console.log('修复是否成功:', result === '' ? '✅ 成功！' : '❌ 失败！');

if (result === '') {
  console.log('\n🎉 修复成功！现在会传递空字符串而不是"智能操作 1"');
  console.log('后端将正确触发智能分析，而不是误认为是高质量参数');
} else {
  console.log('\n❌ 修复失败！仍然返回:', result);
}