/**
 * 工具栏样式测试工具
 * 用于验证CSS修复是否成功解决白底白字问题
 */

// 测试函数：检查CSS变量是否正确应用
function testToolbarStyles() {
  console.log('🔍 开始工具栏样式测试...');
  
  // 检查CSS变量
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const toolbarBg = computedStyle.getPropertyValue('--toolbar-bg').trim();
  const toolbarText = computedStyle.getPropertyValue('--toolbar-text').trim();
  const toolbarBorder = computedStyle.getPropertyValue('--toolbar-border').trim();
  
  console.log('📊 CSS变量值:');
  console.log('  --toolbar-bg:', toolbarBg);
  console.log('  --toolbar-text:', toolbarText);
  console.log('  --toolbar-border:', toolbarBorder);
  
  // 检查工具栏元素
  const toolbars = document.querySelectorAll('.draggable-toolbar, .header-only-drag-toolbar, .smart-layout-toolbar-control, .smart-layout-toolbar-trigger');
  
  console.log(`📁 找到 ${toolbars.length} 个工具栏元素`);
  
  toolbars.forEach((toolbar, index) => {
    const styles = getComputedStyle(toolbar);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    const border = styles.border;
    
    console.log(`🔸 工具栏 ${index + 1} (${toolbar.className}):`);
    console.log('  背景色:', backgroundColor);
    console.log('  文字色:', color);
    console.log('  边框:', border);
    
    // 检查是否存在白底白字问题
    const isWhiteBackground = backgroundColor.includes('255, 255, 255') || backgroundColor === 'rgb(255, 255, 255)';
    const isWhiteText = color.includes('255, 255, 255') || color === 'rgb(255, 255, 255)';
    
    if (isWhiteBackground && isWhiteText) {
      console.warn('⚠️  检测到白底白字问题！');
    } else if (isWhiteBackground) {
      console.log('✅ 白色背景但文字颜色正常');
    } else {
      console.log('✅ 样式正常');
    }
  });
  
  // 检查主题类
  const isDarkTheme = document.documentElement.classList.contains('dark-theme') || 
                     document.body.classList.contains('dark-theme') ||
                     document.querySelector('[data-theme="dark"]');
  
  console.log('🎨 主题状态:', isDarkTheme ? '深色主题' : '浅色主题');
  
  return {
    toolbarCount: toolbars.length,
    variables: { toolbarBg, toolbarText, toolbarBorder },
    isDarkTheme
  };
}

// 主题切换测试
function testThemeToggle() {
  console.log('🔄 测试主题切换...');
  
  const root = document.documentElement;
  const hasThemeClass = root.classList.contains('dark-theme');
  
  if (hasThemeClass) {
    root.classList.remove('dark-theme');
    console.log('🌞 切换到浅色主题');
  } else {
    root.classList.add('dark-theme');
    console.log('🌙 切换到深色主题');
  }
  
  // 延迟检查样式变化
  setTimeout(() => {
    testToolbarStyles();
  }, 300);
}

// 修复建议
function generateFixRecommendations() {
  console.log('💡 生成修复建议...');
  
  const problematicElements = document.querySelectorAll('[style*="background"][style*="rgb(255, 255, 255)"], [style*="backgroundColor"][style*="rgb(255, 255, 255)"]');
  
  if (problematicElements.length > 0) {
    console.warn(`⚠️  发现 ${problematicElements.length} 个仍有内联白色背景的元素:`);
    
    problematicElements.forEach((el, index) => {
      console.log(`  ${index + 1}. ${el.tagName}.${el.className || '(无类名)'}`);
      console.log(`     内联样式: ${el.getAttribute('style')}`);
    });
    
    console.log('🔧 修复建议:');
    console.log('1. 移除这些元素的内联background/backgroundColor样式');
    console.log('2. 为这些元素添加适当的CSS类');
    console.log('3. 确保CSS类具有足够的特异性(!important)');
  } else {
    console.log('✅ 未发现内联白色背景样式');
  }
}

// 一键诊断
function diagnoseToolbarStyling() {
  console.clear();
  console.log('🩺 工具栏样式全面诊断');
  console.log('='.repeat(50));
  
  const results = testToolbarStyles();
  console.log('');
  
  generateFixRecommendations();
  console.log('');
  
  console.log('🎯 手动测试建议:');
  console.log('1. 运行 testThemeToggle() 测试主题切换');
  console.log('2. 检查所有工具栏是否在深色主题下可见');
  console.log('3. 验证循环步骤卡片保持白色背景');
  
  return results;
}

// 自动修复功能
function autoFixInlineStyles() {
  console.log('🔧 开始自动修复内联样式...');
  
  const elements = document.querySelectorAll('[style*="background: rgba(255, 255, 255"], [style*="backgroundColor: rgba(255, 255, 255"]');
  let fixedCount = 0;
  
  elements.forEach(el => {
    // 检查是否是循环步骤卡片（需要保持白色）
    if (el.classList.contains('loop-step-card') || 
        el.closest('.loop-step-card') ||
        el.classList.contains('step-card')) {
      console.log('⏭️  跳过循环步骤卡片:', el.className);
      return;
    }
    
    // 移除背景色样式
    const style = el.getAttribute('style') || '';
    const newStyle = style
      .replace(/background:\s*rgba\(255,\s*255,\s*255[^;)]*\)[^;]*;?/gi, '')
      .replace(/backgroundColor:\s*rgba\(255,\s*255,\s*255[^;)]*\)[^;]*;?/gi, '')
      .replace(/background:\s*#fff[^;]*;?/gi, '')
      .replace(/backgroundColor:\s*#fff[^;]*;?/gi, '')
      .replace(/;\s*;/g, ';') // 清理多余分号
      .replace(/^;|;$/g, ''); // 清理首尾分号
    
    if (newStyle !== style) {
      el.setAttribute('style', newStyle);
      
      // 添加适当的CSS类
      if (!el.classList.contains('draggable-toolbar') && 
          !el.classList.contains('header-only-drag-toolbar')) {
        // 为工具栏添加适当的类
        if (el.querySelector('.drag-handle') || el.closest('.toolbar')) {
          el.classList.add('draggable-toolbar');
        }
      }
      
      fixedCount++;
      console.log(`✅ 修复元素: ${el.tagName}.${el.className}`);
    }
  });
  
  console.log(`🎉 总共修复了 ${fixedCount} 个元素`);
  
  // 重新测试
  setTimeout(() => {
    testToolbarStyles();
  }, 100);
}

// 导出到全局作用域以便在控制台使用
if (typeof window !== 'undefined') {
  window.toolbarStyleTester = {
    test: testToolbarStyles,
    toggleTheme: testThemeToggle,
    diagnose: diagnoseToolbarStyling,
    autoFix: autoFixInlineStyles,
    recommend: generateFixRecommendations
  };
  
  console.log('🔧 工具栏样式测试工具已加载！');
  console.log('使用方法:');
  console.log('  toolbarStyleTester.diagnose() - 全面诊断');
  console.log('  toolbarStyleTester.test() - 基础测试');
  console.log('  toolbarStyleTester.toggleTheme() - 切换主题');
  console.log('  toolbarStyleTester.autoFix() - 自动修复');
}

export {
  testToolbarStyles,
  testThemeToggle,
  diagnoseToolbarStyling,
  autoFixInlineStyles,
  generateFixRecommendations
};