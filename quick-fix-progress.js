/**
 * 🚀 一键修复：智能·自动链按钮 0% 进度问题
 * 
 * 使用方法：
 * 1. 打开浏览器开发者控制台（F12）
 * 2. 复制并粘贴此脚本
 * 3. 按回车执行
 * 4. 刷新页面测试
 */

console.log('🚀 开始修复智能·自动链按钮进度问题...');

try {
  // 检查调试接口是否可用
  if (typeof window.v2v3Migration === 'undefined') {
    throw new Error('调试接口未加载，请在应用完全启动后重试');
  }

  // 显示当前状态
  console.log('📋 修复前状态:');
  const currentFlags = window.v2v3Migration.getFlags();
  console.log(`USE_V3_EXECUTION: ${currentFlags.USE_V3_EXECUTION}`);
  console.log(`USE_V3_CHAIN: ${currentFlags.USE_V3_CHAIN}`);

  // 启用V3系统
  console.log('🔧 启用V3智能分析系统...');
  window.v2v3Migration.setFlag('USE_V3_EXECUTION', true);
  window.v2v3Migration.setFlag('USE_V3_CHAIN', true);
  window.v2v3Migration.setFlag('USE_V3_SINGLE_STEP', true);

  // 验证修复
  console.log('✅ 修复完成！');
  const updatedFlags = window.v2v3Migration.getFlags();
  console.log('📋 修复后状态:');
  console.log(`USE_V3_EXECUTION: ${updatedFlags.USE_V3_EXECUTION}`);
  console.log(`USE_V3_CHAIN: ${updatedFlags.USE_V3_CHAIN}`);

  // 提供测试指引
  console.log(`
🎯 测试步骤：
1. 刷新页面（重要！）
2. 找到并点击"🧠 智能·自动链"按钮  
3. 观察按钮文本变化：
   🧠 智能·自动链 → 🔄 0% → 🔄 25% → 🔄 65% → 🔄 100% → ✅

🔄 如需回退到V2系统：
window.v2v3Migration.disableV3()
  `);

} catch (error) {
  console.error('❌ 修复失败:', error.message);
  console.log('💡 可能的解决方案:');
  console.log('1. 确保应用已完全加载');
  console.log('2. 刷新页面后重试'); 
  console.log('3. 检查是否有JavaScript错误');
}