/**
 * 模块化主题系统入口 - 精确分离架构
 * 循环卡片、主程序、Universal UI 各自独立管理
 */

// 导入基础样式
import './global-dark-theme.css';
import './inline-style-overrides.css';
import './component-specific.css';

// 导入新的模块化精确样式系统
import './modules/css-layer-isolation.css';
import './modules/precise-style-separator.css';
import './modules/main-app-theme.css';
import './modules/loop-cards-theme.css';
import './modules/universal-ui-protection.css';

// 移除会造成样式污染的简洁CSS解决方案
// import './simple-css-solution.css'; // 已替换为模块化方案

/**
 * 模块化主题管理器 - 精确分离，无JavaScript监控
 */
class ModularThemeManager {
  private isInitialized = false;

  constructor() {
    console.log('🎨 模块化主题管理器 - 精确分离架构');
    console.log('📦 模块包含: 主程序暗色系 + 循环卡片白色系 + Universal UI 保护');
  }

  /**
   * 初始化（仅添加标记，无监控）
   */
  init() {
    if (this.isInitialized) {
      console.warn('模块化主题管理器已经初始化');
      return;
    }

    console.log('🎨 初始化模块化主题系统...');

    // 添加主题标记
    this.addThemeMarkers();

    this.isInitialized = true;
    console.log('✅ 模块化主题系统初始化完成');
    console.log('🎯 架构: 循环卡片(白底黑字) + 主程序(暗灰色系) + Universal UI(保护)');
  }

  /**
   * 添加主题标记
   */
  private addThemeMarkers() {
    const root = document.documentElement;
    
    // 主程序主题标记
    root.setAttribute('data-theme', 'main-app');
    root.classList.add('main-app-theme');
    root.classList.add('modular-theme-applied');
    
    // 调试模式标记（开发环境）
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      root.setAttribute('data-debug', 'true');
    }
  }

  /**
   * 启用调试模式
   */
  enableDebug() {
    document.documentElement.setAttribute('data-debug', 'true');
    console.log('🔧 调试模式已启用 - 循环卡片将显示边框');
  }

  /**
   * 禁用调试模式
   */
  disableDebug() {
    document.documentElement.removeAttribute('data-debug');
    console.log('🔧 调试模式已禁用');
  }

  /**
   * 销毁（清理标记）
   */
  destroy() {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    root.removeAttribute('data-debug');
    root.classList.remove('main-app-theme');
    root.classList.remove('modular-theme-applied');
    this.isInitialized = false;
    console.log('🛑 模块化主题系统已销毁');
  }

  /**
   * 获取状态
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      method: 'Modular CSS Architecture - No JavaScript monitoring',
      performance: 'Optimal - CSS layers and variables only',
      modules: {
        mainApp: 'Dark gray theme for main application',
        loopCards: 'White background with black text',
        universalUI: 'Protected dark theme for Universal UI',
        xmlInspector: 'White background for readability'
      },
      architecture: 'Precise separation with CSS layers'
    };
  }
}

// 创建模块化主题管理器实例
const modularThemeManager = new ModularThemeManager();

// 自动初始化
modularThemeManager.init();

// 导出到全局作用域便于调试
if (typeof window !== 'undefined') {
  (window as any).modularThemeManager = modularThemeManager;
  
  console.log('🎨 模块化主题管理器已加载！');
  console.log('调试方法:');
  console.log('  modularThemeManager.getStats() - 查看状态信息');
  console.log('  modularThemeManager.enableDebug() - 启用调试模式');
  console.log('  modularThemeManager.disableDebug() - 禁用调试模式');
  console.log('  modularThemeManager.destroy() - 销毁主题系统');
}

export default modularThemeManager;