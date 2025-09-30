/**
 * 紧急修复脚本 - 停止无限循环
 * 在浏览器控制台运行此脚本来立即停止样式检测器的无限循环
 */

console.log('🚨 紧急修复：停止样式检测器无限循环...');

// 停止所有主题修复系统
if (typeof window !== 'undefined') {
  // 停止主题覆盖管理器
  if (window.themeOverrideManager) {
    try {
      window.themeOverrideManager.destroy();
      console.log('✅ 主题覆盖管理器已停止');
    } catch (error) {
      console.log('⚠️ 停止主题覆盖管理器失败:', error);
    }
  }

  // 停止增强样式检测器
  if (window.enhancedStyleDetector) {
    try {
      window.enhancedStyleDetector.stop();
      console.log('✅ 增强样式检测器已停止');
    } catch (error) {
      console.log('⚠️ 停止增强样式检测器失败:', error);
    }
  }

  // 停止硬编码修复器
  if (window.hardcodedStyleFixer) {
    try {
      window.hardcodedStyleFixer.stop();
      console.log('✅ 硬编码修复器已停止');
    } catch (error) {
      console.log('⚠️ 停止硬编码修复器失败:', error);
    }
  }

  // 停止浮层修复器
  if (window.overlayStyleFixer) {
    try {
      window.overlayStyleFixer.destroy();
      console.log('✅ 浮层修复器已停止');
    } catch (error) {
      console.log('⚠️ 停止浮层修复器失败:', error);
    }
  }

  // 清除所有可能的定时器
  for (let i = 1; i < 99999; i++) {
    try {
      clearInterval(i);
      clearTimeout(i);
    } catch (e) {
      // 忽略错误
    }
  }

  console.log('🧹 已清除所有定时器');

  // 禁用自动重新启动
  if (window.themeOverrideManager) {
    window.themeOverrideManager.isInitialized = true; // 防止重新初始化
  }
}

// 刷新页面来彻底解决问题
console.log('🔄 建议刷新页面来彻底解决问题');
console.log('运行以下命令来刷新页面: location.reload()');

// 提供手动刷新函数
window.emergencyRefresh = () => {
  console.log('🔄 紧急刷新页面...');
  location.reload();
};

console.log('🎯 紧急修复完成！');
console.log('可用命令:');
console.log('- emergencyRefresh() : 立即刷新页面');