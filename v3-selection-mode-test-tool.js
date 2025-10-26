// V3选择模式测试脚本 - 在浏览器控制台运行
// 用于测试不同选择模式的执行行为

console.log('🎯 V3选择模式测试工具加载完成 (字段名修复版)');

// 设置选择模式的便捷函数
window.setSelectionMode = function(mode) {
  const validModes = ['first', 'match-original', 'all', 'auto'];
  
  if (!validModes.includes(mode)) {
    console.error('❌ 无效的选择模式:', mode);
    console.log('✅ 有效选择模式:', validModes);
    return;
  }
  
  localStorage.setItem('userSelectionMode', mode);
  console.log(`✅ 选择模式已设置为: ${mode}`);
  console.log('🔄 现在可以直接测试智能自动链，无需刷新页面');
  console.log('');
  console.log('📋 下一步操作:');
  console.log('1. 点击任意"关注"按钮进入智能分析');
  console.log('2. 查看控制台输出，确认选择模式生效');
  console.log('3. 观察实际执行行为是否符合选择模式');
};

// 获取当前选择模式
window.getSelectionMode = function() {
  const mode = localStorage.getItem('userSelectionMode') || 'auto';
  console.log(`🎯 当前选择模式: ${mode}`);
  return mode;
};

// 清除选择模式设置
window.clearSelectionMode = function() {
  localStorage.removeItem('userSelectionMode');
  console.log('🧹 选择模式设置已清除，将使用默认值 auto');
};

// 显示使用说明
window.showSelectionModeHelp = function() {
  console.log('🎯 V3选择模式测试指南');
  console.log('='.repeat(50));
  console.log('');
  console.log('📋 可用选择模式:');
  console.log('  • first - 只点击第一个匹配元素');
  console.log('  • match-original - 精确匹配，只点击最相似的元素');
  console.log('  • all - 批量操作，点击所有匹配元素');
  console.log('  • auto - 智能自适应（默认）');
  console.log('');
  console.log('🔧 测试步骤:');
  console.log('  1. setSelectionMode("first")     // 设置为"第一个"模式');
  console.log('  2. 执行智能自动链测试');
  console.log('  3. 观察是否只点击第一个"关注"按钮');
  console.log('  4. setSelectionMode("all")       // 设置为"批量全部"模式');
  console.log('  5. 再次执行测试，观察是否点击所有"关注"按钮');
  console.log('');
  console.log('📊 其他命令:');
  console.log('  • getSelectionMode()            // 查看当前设置');
  console.log('  • clearSelectionMode()          // 清除设置');
  console.log('  • showSelectionModeHelp()       // 显示此帮助');
};

// 自动显示帮助
showSelectionModeHelp();

console.log('');
console.log('🚀 开始测试: 运行 setSelectionMode("first") 然后测试智能自动链');