/**
 * 简洁主题系统入口 - 纯CSS方案，无JavaScript监控
 * 移除所有保护机制，避免卡顿
 */

// 导入基础样式
import './global-dark-theme.css';
import './inline-style-overrides.css';
import './component-specific.css';
import './modules/css-layer-isolation.css';
// 导入新的简洁CSS解决方案
import './simple-css-solution.css';

/**
 * 简洁主题管理器 - 无JavaScript监控，无卡顿
 */
class SimpleThemeManager {
  private isInitialized = false;

  constructor() {
    console.log('🎨 简洁主题管理器 - 纯CSS方案，无JavaScript监控');
  }

  /**
   * 初始化（仅添加标记，无监控）
   */
  init() {
    if (this.isInitialized) {
      console.warn('简洁主题管理器已经初始化');
      return;
    }

    console.log('🎨 初始化简洁主题系统（纯CSS，无保护机制）...');

    // 仅添加主题标记
    this.addThemeMarker();

    this.isInitialized = true;
    console.log('✅ 简洁主题系统初始化完成 - 无JavaScript监控，无卡顿风险');
  }

  /**
   * 添加主题标记
   */
  private addThemeMarker() {
    document.documentElement.setAttribute('data-theme', 'light-readable');
    document.documentElement.classList.add('simple-theme-applied');
  }

  /**
   * 销毁（清理标记）
   */
  destroy() {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('simple-theme-applied');
    this.isInitialized = false;
    console.log('🛑 简洁主题系统已销毁');
  }

  /**
   * 获取状态
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      method: 'Pure CSS - No JavaScript monitoring',
      performance: 'Optimal - No timers or DOM watchers',
      protection: 'Disabled - No continuous checking'
    };
  }
}

// 创建简洁主题管理器实例
const simpleThemeManager = new SimpleThemeManager();

// 自动初始化
simpleThemeManager.init();

// 导出到全局作用域便于调试
if (typeof window !== 'undefined') {
  (window as any).simpleThemeManager = simpleThemeManager;
  
  console.log('🎨 简洁主题管理器已加载！无JavaScript监控，无卡顿风险');
  console.log('调试方法:');
  console.log('  simpleThemeManager.getStats() - 查看状态信息');
  console.log('  simpleThemeManager.destroy() - 销毁主题系统');
}

export default simpleThemeManager;