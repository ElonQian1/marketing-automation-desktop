// 特定步骤卡片重新分析按钮调试脚本
// 在浏览器控制台运行，专门调试禁用的按钮

console.log('🔍 特定步骤卡片重新分析按钮调试');
console.log('='.repeat(60));

// 1. 找到所有重新分析按钮
const reanalysisButtons = document.querySelectorAll('[title="重新分析"]');
console.log(`📍 总共找到 ${reanalysisButtons.length} 个重新分析按钮`);

reanalysisButtons.forEach((button, index) => {
  const isDisabled = button.hasAttribute('disabled') || button.disabled;
  const buttonInfo = {
    index: index + 1,
    disabled: isDisabled,
    ariaDisabled: button.getAttribute('aria-disabled'),
    classes: button.className,
    style: button.getAttribute('style'),
    parentClasses: button.parentElement?.className || 'N/A'
  };
  
  console.log(`\n🔄 按钮 ${index + 1}:`, buttonInfo);
  
  if (isDisabled) {
    console.log(`❌ 按钮 ${index + 1} 被禁用`);
    
    // 尝试找到对应的步骤卡片
    let stepCard = button.closest('[class*="step"], [data-testid*="step"]');
    if (!stepCard) {
      stepCard = button.closest('.ant-card, [class*="card"]');
    }
    
    if (stepCard) {
      console.log(`  📦 找到步骤卡片:`, {
        classes: stepCard.className,
        dataset: stepCard.dataset,
        id: stepCard.id
      });
      
      // 查找可能的React状态信息
      const reactKey = Object.keys(stepCard).find(key => 
        key.startsWith('__reactInternalInstance') || 
        key.startsWith('__reactFiber')
      );
      
      if (reactKey && stepCard[reactKey]) {
        console.log(`  ⚛️ 找到React实例，请在React DevTools中检查此元素`);
      }
    }
  } else {
    console.log(`✅ 按钮 ${index + 1} 可用`);
  }
});

// 2. 检查是否有相关的控制台错误或警告
console.log('\n📊 检查相关调试日志:');
console.log('请查找以下模式的日志:');
console.log('- 🔍 [CompactStrategyMenu] 状态变化');
console.log('- 🔄 [CompactStrategyMenu] 重新分析按钮点击');
console.log('- ⚠️ [StrategyAnalysis] 分析超时');

// 3. 提供手动检查指南
console.log('\n📋 手动检查步骤:');
console.log('1. 右键点击禁用的重新分析按钮');
console.log('2. 选择"检查元素"');
console.log('3. 在React DevTools中找到CompactStrategyMenu组件');
console.log('4. 检查props:');
console.log('   - disabled: 是否为true');
console.log('   - selector.analysis.status: 当前值');
console.log('   - selector.activeStrategy: 是否存在');

// 4. 尝试强制启用（仅用于调试）
console.log('\n🛠️ 调试用：尝试强制启用按钮');
const disabledButtons = Array.from(reanalysisButtons).filter(btn => 
  btn.hasAttribute('disabled') || btn.disabled
);

if (disabledButtons.length > 0) {
  console.log(`找到 ${disabledButtons.length} 个禁用按钮，尝试强制启用...`);
  
  window.forceEnableReanalysisButtons = () => {
    disabledButtons.forEach((btn, i) => {
      btn.removeAttribute('disabled');
      btn.disabled = false;
      btn.style.cursor = 'pointer';
      btn.style.opacity = '1';
      console.log(`✅ 强制启用按钮 ${i + 1}`);
    });
    console.log('⚠️ 注意：这只是临时启用，需要修复根本原因');
  };
  
  console.log('运行 forceEnableReanalysisButtons() 来临时启用所有按钮');
} else {
  console.log('没有找到禁用的重新分析按钮');
}

console.log('\n' + '='.repeat(60));