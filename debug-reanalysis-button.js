// 调试重新分析按钮禁用状态的脚本
// 在浏览器控制台运行这个脚本来检查当前状态

console.log('🔍 重新分析按钮调试工具');
console.log('='.repeat(50));

// 1. 检查DOM中的CompactStrategyMenu组件
const compactMenus = document.querySelectorAll('[title="重新分析"]');
console.log('📍 找到重新分析按钮数量:', compactMenus.length);

compactMenus.forEach((button, index) => {
  console.log(`\n🔄 按钮 ${index + 1}:`);
  console.log('  - disabled 属性:', button.disabled);
  console.log('  - aria-disabled:', button.getAttribute('aria-disabled'));
  console.log('  - 父容器类名:', button.parentElement?.className);
  
  // 检查是否有 disabled 样式
  const computedStyle = window.getComputedStyle(button);
  console.log('  - opacity:', computedStyle.opacity);
  console.log('  - cursor:', computedStyle.cursor);
  console.log('  - pointer-events:', computedStyle.pointerEvents);
});

// 2. 检查React DevTools中的组件状态（如果可用）
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('\n🛠️ React DevTools 检测到，请在组件中检查：');
  console.log('  1. CompactStrategyMenu props:');
  console.log('     - disabled: 外部传入的禁用状态');
  console.log('     - selector.analysis.status: 当前分析状态');
  console.log('  2. 查找含有 strategySelector 的步骤对象');
  console.log('  3. 检查 useSmartStrategyAnalysis Hook 的状态');
} else {
  console.log('\n⚠️ React DevTools 未检测到，无法深入检查组件状态');
}

// 3. 检查可能相关的全局状态
console.log('\n🌐 检查可能的全局状态:');
console.log('  - window 对象中是否有分析相关状态');

// 查找可能的状态存储
const possibleStores = ['analysisStore', 'stepStore', 'smartStepStore'];
possibleStores.forEach(store => {
  if (window[store]) {
    console.log(`  - 找到 ${store}:`, window[store]);
  }
});

// 4. 建议的调试步骤
console.log('\n📋 调试建议:');
console.log('1. 在浏览器开发者工具中找到重新分析按钮');
console.log('2. 右键 -> 检查元素');
console.log('3. 在 React DevTools 中查看 CompactStrategyMenu 组件');
console.log('4. 检查以下属性:');
console.log('   - props.disabled');
console.log('   - props.selector.analysis.status');
console.log('   - props.selector.analysis');
console.log('5. 如果 status 是 "analyzing"，查看为什么没有完成');
console.log('6. 如果 disabled 是 true，追踪是谁传入的');

console.log('\n🎯 常见问题排查:');
console.log('✅ 1. analysis.status 卡在 "analyzing" 状态');
console.log('✅ 2. 外部传入 disabled=true');
console.log('✅ 3. 缺少 xmlHash 或 elementGlobalXPath');
console.log('✅ 4. 后端服务未响应导致状态未更新');
console.log('✅ 5. 错误处理逻辑未正确重置状态');

console.log('\n' + '='.repeat(50));
console.log('调试完成！请查看上述输出进行问题定位。');