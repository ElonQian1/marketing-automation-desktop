// 智能工具栏样式修复测试脚本
// 用于验证两种工具栏在暗色主题下的显示效果

console.log('🔧 工具栏样式修复测试开始...');

// 检查CSS变量是否正确加载
function checkCSSVariables() {
  const rootStyles = getComputedStyle(document.documentElement);
  
  console.log('📋 检查CSS变量：');
  console.log('--toolbar-bg:', rootStyles.getPropertyValue('--toolbar-bg'));
  console.log('--toolbar-text:', rootStyles.getPropertyValue('--toolbar-text'));
  console.log('--toolbar-border:', rootStyles.getPropertyValue('--toolbar-border'));
  
  return {
    toolbarBg: rootStyles.getPropertyValue('--toolbar-bg').trim(),
    toolbarText: rootStyles.getPropertyValue('--toolbar-text').trim(),
    toolbarBorder: rootStyles.getPropertyValue('--toolbar-border').trim()
  };
}

// 检查工具栏元素
function checkToolbars() {
  console.log('🔍 检查工具栏元素：');
  
  // 检查 draggable-toolbar
  const draggableToolbars = document.querySelectorAll('.draggable-toolbar');
  console.log(`📊 找到 ${draggableToolbars.length} 个 .draggable-toolbar`);
  
  draggableToolbars.forEach((toolbar, index) => {
    const styles = getComputedStyle(toolbar);
    console.log(`  [${index + 1}] 背景色:`, styles.backgroundColor);
    console.log(`  [${index + 1}] 文字色:`, styles.color);
    console.log(`  [${index + 1}] 边框色:`, styles.borderColor);
  });
  
  // 检查 header-only-drag-toolbar
  const headerToolbars = document.querySelectorAll('.header-only-drag-toolbar');
  console.log(`📊 找到 ${headerToolbars.length} 个 .header-only-drag-toolbar`);
  
  headerToolbars.forEach((toolbar, index) => {
    const styles = getComputedStyle(toolbar);
    console.log(`  [${index + 1}] 背景色:`, styles.backgroundColor);
    console.log(`  [${index + 1}] 文字色:`, styles.color);
    console.log(`  [${index + 1}] 边框色:`, styles.borderColor);
    
    // 检查是否还有硬编码的白色背景
    if (styles.backgroundColor.includes('255, 255, 255')) {
      console.warn(`⚠️  工具栏 [${index + 1}] 仍然使用白色背景！`);
    }
  });
}

// 检查按钮样式
function checkButtonStyles() {
  console.log('🔘 检查工具栏按钮样式：');
  
  const toolbarButtons = document.querySelectorAll('.draggable-toolbar .ant-btn, .header-only-drag-toolbar .ant-btn');
  console.log(`📊 找到 ${toolbarButtons.length} 个工具栏按钮`);
  
  toolbarButtons.forEach((button, index) => {
    const styles = getComputedStyle(button);
    if (index < 3) { // 只显示前3个，避免日志过多
      console.log(`  按钮 [${index + 1}] 文字色:`, styles.color);
      console.log(`  按钮 [${index + 1}] 背景色:`, styles.backgroundColor);
    }
  });
}

// 主题检测
function detectTheme() {
  const body = document.body;
  const html = document.documentElement;
  
  const isDarkTheme = body.classList.contains('dark-theme') || 
                     html.classList.contains('dark-theme') ||
                     body.dataset.theme === 'dark';
  
  console.log('🎨 当前主题:', isDarkTheme ? '暗色主题' : '浅色主题');
  return isDarkTheme;
}

// 修复验证
function verifyFix() {
  console.log('✅ 验证修复效果：');
  
  const isDark = detectTheme();
  const cssVars = checkCSSVariables();
  
  if (isDark) {
    // 暗色主题下的预期值
    const expectedBg = 'rgba(22, 27, 34, 0.95)';
    const expectedText = '#f0f6fc';
    
    console.log('🌙 暗色主题验证：');
    console.log('  预期背景:', expectedBg);
    console.log('  实际背景:', cssVars.toolbarBg);
    console.log('  预期文字:', expectedText);
    console.log('  实际文字:', cssVars.toolbarText);
    
    const bgMatch = cssVars.toolbarBg.includes('22, 27, 34');
    const textMatch = cssVars.toolbarText.includes('f0f6fc');
    
    if (bgMatch && textMatch) {
      console.log('✅ 暗色主题样式正确！');
    } else {
      console.warn('❌ 暗色主题样式不正确');
    }
  } else {
    console.log('☀️ 浅色主题 - 跳过暗色主题验证');
  }
}

// 执行测试
function runTest() {
  try {
    detectTheme();
    checkCSSVariables();
    checkToolbars();
    checkButtonStyles();
    verifyFix();
    
    console.log('🎉 工具栏样式修复测试完成！');
    console.log('💡 如果发现问题，请检查：');
    console.log('   1. 是否清除了浏览器缓存');
    console.log('   2. CSS文件是否正确加载');
    console.log('   3. 组件是否使用了正确的类名');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 延迟执行，确保DOM和样式都加载完成
setTimeout(runTest, 1000);

// 导出测试函数供手动调用
window.testToolbarStyles = runTest;