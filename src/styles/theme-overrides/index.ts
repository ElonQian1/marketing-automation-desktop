/**
 * 终极模块化主题系统入口 - 解决循环卡片黑底黑字问题
 * 使用CSS Layers和强制优先级确保样式隔离
 */

// 暂时禁用旧的冲突样式（防止干扰新架构）
// import './global-dark-theme.css';
// import './inline-style-overrides.css';
// import './component-specific.css';

// 导入新的终极解决方案模块（按优先级顺序）
import './modules/layer-architecture.css';        // CSS层级架构控制器
import './modules/main-app-protection.css';       // 主程序暗灰色系保护
import './modules/loop-card-force.css';           // 循环卡片强制白底黑字

// 保留通用UI保护模块
import './modules/universal-ui-protection.css';

// 旧模块化方案暂时禁用（避免冲突）
// import './modules/css-layer-isolation.css';
// import './modules/precise-style-separator.css';
// import './modules/main-app-theme.css';
// import './modules/loop-cards-theme.css';

/**
 * 终极模块化主题管理器 - 专门解决循环卡片黑底黑字问题
 */
class UltimateThemeManager {
  private isInitialized = false;

  constructor() {
    console.log('🎨 终极主题管理器 - 循环卡片黑底黑字问题解决方案');
    console.log('📦 模块包含: CSS Layers架构 + 强制白底黑字 + 主程序保护');
  }

  /**
   * 初始化（仅添加标记，无JavaScript监控）
   */
  init() {
    if (this.isInitialized) {
      console.warn('终极主题管理器已经初始化');
      return;
    }

    console.log('🎨 初始化终极主题系统...');

    // 添加主题标记
    this.addThemeMarkers();

    // 添加调试信息
    this.logThemeStatus();

    this.isInitialized = true;
    console.log('✅ 终极主题系统初始化完成');
    console.log('🎯 架构: 循环卡片(强制白底黑字) + 主程序(暗灰色系保护) + CSS Layers优先级');
  }

  /**
   * 添加主题标记
   */
  private addThemeMarkers() {
    const root = document.documentElement;
    
    // 主程序主题标记
    root.setAttribute('data-theme', 'ultimate-solution');
    root.classList.add('ultimate-theme-applied');
    root.classList.add('loop-card-fix-applied');
    
    // 调试模式标记（开发环境）
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      root.setAttribute('data-debug', 'true');
    }
  }

  /**
   * 记录主题状态
   */
  private logThemeStatus() {
    console.log('🔍 主题状态检查:');
    console.log('  - CSS Layers: layer-architecture.css');
    console.log('  - 循环卡片强制: loop-card-force.css');
    console.log('  - 主程序保护: main-app-protection.css');
    console.log('  - Universal UI保护: universal-ui-protection.css');
    
    // 检查循环卡片元素
    setTimeout(() => {
      const loopCards = document.querySelectorAll('.step-card, .loop-card, [data-loop-badge]');
      console.log(`🔄 检测到 ${loopCards.length} 个循环卡片元素`);
      
      loopCards.forEach((card, index) => {
        const styles = window.getComputedStyle(card);
        console.log(`  卡片 ${index + 1}: 背景=${styles.backgroundColor}, 文字=${styles.color}`);
      });
    }, 1000);
  }

  /**
   * 启用调试模式
   */
  enableDebug() {
    document.documentElement.setAttribute('data-debug', 'true');
    console.log('🔧 调试模式已启用 - 循环卡片将显示绿色调试边框');
    this.logThemeStatus();
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
    root.classList.remove('ultimate-theme-applied');
    root.classList.remove('loop-card-fix-applied');
    this.isInitialized = false;
    console.log('🛑 终极主题系统已销毁');
  }

  /**
   * 获取状态
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      method: 'Ultimate CSS Architecture - Layer-based isolation',
      performance: 'Optimal - CSS layers and force overrides only',
      modules: {
        layerArchitecture: 'CSS Layers with proper priority order',
        loopCardForce: 'Force white background with black text for loop cards',
        mainAppProtection: 'Protect main app dark theme from contamination',
        universalUIProtection: 'Protected dark theme for Universal UI'
      },
      architecture: 'Layer-based separation with force overrides',
      problem: 'Loop cards black-on-black text issue',
      solution: 'Force white-on-black theme with highest priority'
    };
  }
}

// 创建终极主题管理器实例
const ultimateThemeManager = new UltimateThemeManager();

// 自动初始化
ultimateThemeManager.init();

// 导出到全局作用域便于调试
if (typeof window !== 'undefined') {
  (window as any).ultimateThemeManager = ultimateThemeManager;
  
  console.log('🎨 终极主题管理器已加载！');
  console.log('调试方法:');
  console.log('  ultimateThemeManager.getStats() - 查看状态信息');
  console.log('  ultimateThemeManager.enableDebug() - 启用调试模式');
  console.log('  ultimateThemeManager.disableDebug() - 禁用调试模式');
  console.log('  ultimateThemeManager.destroy() - 销毁主题系统');
}

export default ultimateThemeManager;