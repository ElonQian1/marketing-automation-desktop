// 智能配置模板功能测试脚本
// 在浏览器控制台中运行此脚本来测试新功能

console.log('🎯 智能配置模板功能测试');

// 模拟笔记卡片元素
const mockNoteCard = {
  resource_id: 'com.xingin.xhs:id/note_card_container',
  class_name: 'android.widget.RelativeLayout',
  content_desc: '笔记 来自@小红书用户 赞342 收藏156',
  text: '',
  bounds: '[40,200][360,500]',
  clickable: true,
};

// 模拟普通按钮元素
const mockButton = {
  resource_id: 'com.xingin.xhs:id/follow_btn',
  class_name: 'android.widget.Button',
  text: '关注',
  content_desc: '关注按钮',
  bounds: '[300,100][400,140]',
  clickable: true,
};

console.log('📋 测试元素类型识别:');

// 如果模块已加载，测试元素类型识别
if (typeof window !== 'undefined' && window.structuralMatching) {
  const { detectElementType, ElementType } = window.structuralMatching;
  
  const noteCardType = detectElementType(mockNoteCard);
  const buttonType = detectElementType(mockButton);
  
  console.log(`笔记卡片识别结果: ${noteCardType} (期望: ${ElementType.NOTE_CARD})`);
  console.log(`按钮识别结果: ${buttonType} (期望: ${ElementType.BUTTON})`);
  
  if (noteCardType === ElementType.NOTE_CARD) {
    console.log('✅ 笔记卡片识别正确');
  } else {
    console.log('❌ 笔记卡片识别错误');
  }
  
  if (buttonType === ElementType.BUTTON) {
    console.log('✅ 按钮识别正确');
  } else {
    console.log('❌ 按钮识别错误');
  }
} else {
  console.log('⚠️ 模块未加载，手动测试元素类型识别:');
  
  // 手动测试识别逻辑
  const detectElementType = (element) => {
    const contentDesc = String(element.content_desc || '').toLowerCase();
    const resourceId = String(element.resource_id || '');
    const className = String(element.class_name || '');
    
    if (
      contentDesc.includes('笔记') || 
      contentDesc.includes('来自') ||
      contentDesc.includes('赞') ||
      resourceId.includes('note') ||
      resourceId.includes('card')
    ) {
      return 'NOTE_CARD';
    }
    
    if (
      className.includes('Button') ||
      element.clickable === true
    ) {
      return 'BUTTON';
    }
    
    return 'UNKNOWN';
  };
  
  const noteCardType = detectElementType(mockNoteCard);
  const buttonType = detectElementType(mockButton);
  
  console.log(`笔记卡片识别结果: ${noteCardType} (期望: NOTE_CARD)`);
  console.log(`按钮识别结果: ${buttonType} (期望: BUTTON)`);
  
  if (noteCardType === 'NOTE_CARD') {
    console.log('✅ 笔记卡片识别正确');
  } else {
    console.log('❌ 笔记卡片识别错误');
  }
  
  if (buttonType === 'BUTTON') {
    console.log('✅ 按钮识别正确');
  } else {
    console.log('❌ 按钮识别错误');
  }
}

console.log('\n📝 功能说明:');
console.log('1. 智能元素识别: 根据content-desc、resource-id等特征自动识别元素类型');
console.log('2. 配置模板应用: 为不同元素类型应用最优的匹配策略配置');
console.log('3. 层级化配置: 每个层级的每个字段都可以独立控制');
console.log('4. 细粒度匹配: 支持"完全匹配"、"都非空即可"、"保持一致性"等策略');

console.log('\n🎯 使用方式:');
console.log('1. 在结构匹配模态框中点击"智能识别并应用"按钮');
console.log('2. 系统会自动识别元素类型并应用对应的配置模板');
console.log('3. 也可以手动从下拉菜单中选择特定的模板');
console.log('4. 应用模板后仍可手动调整单个字段的配置');