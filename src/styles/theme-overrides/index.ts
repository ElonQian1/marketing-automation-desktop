/**
 * 现代化主题系统入口 v2.0 - Universal UI 现代化样式集成
 * 支持现代设计语言和 Glassmorphism 效果
 */

// 暂时禁用旧的冲突样式（防止干扰新架构）
// import './global-dark-theme.css';
// import './inline-style-overrides.css';
// import './component-specific.css';

// 导入新的终极解决方案模块（按优先级顺序）
import './modules/layer-architecture.css';        // CSS层级架构控制器
import './modules/main-app-protection.css';       // 主程序暗灰色系保护
import './modules/loop-card-force.css';           // 循环卡片强制白底黑字

// Universal UI 现代化样式系统 v2.0
// import '../components/universal-ui/styles/index-modern.css';  // 现代化样式系统主入口 (暂时禁用，路径需要调整)

// Universal UI 传统模块（向后兼容 - 低优先级）
import './modules/universal-ui-core.css';         // Universal UI 核心样式和变量
import './modules/universal-ui-modal.css';        // Modal 专属样式
import './modules/universal-ui-components.css';   // 组件样式（按钮、输入框等）
import './modules/universal-ui-themes.css';       // 高级主题和增强效果

// 保留通用UI保护模块（向后兼容）
import './modules/universal-ui-protection.css';

// 旧模块化方案暂时禁用（避免冲突）
// import './modules/css-layer-isolation.css';
// import './modules/precise-style-separator.css';
// import './modules/main-app-theme.css';
// import './modules/loop-cards-theme.css';

/**
 * 终极模块化主题管理器 - 专门解决循环卡片黑底黑字问题 + Universal UI 增强
 */
class UltimateThemeManager {
  private isInitialized = false;

  constructor() {
    console.log('🎨 终极主题管理器 - 循环卡片黑底黑字问题解决方案 + Universal UI 增强');
    console.log('📦 模块包含:');
    console.log('  ├─ CSS Layers架构 + 强制白底黑字 + 主程序保护');
    console.log('  ├─ Universal UI 核心样式系统');
    console.log('  ├─ Modal 专属样式优化');
    console.log('  ├─ 组件样式完整覆盖');
    console.log('  └─ 高级主题和交互效果');
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
    console.log('✅ 循环卡片样式修复模块');
    console.log('✅ Universal UI 完整样式保护');
    console.log('✅ Modal 背景透明问题修复');

    // 添加Universal UI特定标记
    this.addUniversalUIMarkers();

    // 添加现代化功能
    this.activateModernStyleSystem();

    // 添加调试信息
    this.logThemeStatus();

    this.isInitialized = true;
    console.log('✅ 现代化主题系统初始化完成');
    console.log('🎯 架构: 现代化 Glassmorphism + 循环卡片(强制白底黑字) + 主程序(暗灰色系保护)');
  }

  /**
   * 添加Universal UI特定标记 - 现代化版本
   */
  private addUniversalUIMarkers() {
    // 为Universal UI组件添加特殊标记以便CSS识别
    const universalUISelector = '.universal-page-finder';
    
    // 确保Universal UI容器有正确的标记
    document.addEventListener('DOMContentLoaded', () => {
      const checkAndMarkUniversalUI = () => {
        const universalUIElements = document.querySelectorAll(universalUISelector);
        universalUIElements.forEach((element) => {
          // 传统标记（向后兼容）
          element.setAttribute('data-universal-ui', 'true');
          element.setAttribute('data-theme', 'dark');
          element.setAttribute('data-css-architecture', 'modular');
          
          // 现代化标记 v2.0
          element.setAttribute('data-modern', 'true');
          element.setAttribute('data-version', '2.0');
          element.setAttribute('data-style-system', 'modern-glassmorphism');
          
          // 开发环境调试标记
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            element.setAttribute('data-debug', 'true');
          }
        });
      };
      
      checkAndMarkUniversalUI();
      
      // 监听DOM变化，确保新创建的Universal UI元素也被标记
      const observer = new MutationObserver(() => {
        checkAndMarkUniversalUI();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  /**
   * 现代化样式系统激活器
   */
  private activateModernStyleSystem() {
    // 在 document head 中添加现代化样式标记
    const meta = document.createElement('meta');
    meta.name = 'universal-ui-version';
    meta.content = '2.0-modern';
    document.head.appendChild(meta);

    // 添加现代化 CSS 变量
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --uui-modern-active: true;
        --uui-glassmorphism-enabled: true;
        --uui-animations-enabled: true;
      }
    `;
    document.head.appendChild(style);

    console.log('🎨 现代化样式系统已激活');
  }

  /**
   * 主题切换功能 - 支持现代化主题
   */
  public switchUniversalUITheme(theme: 'dark' | 'light' | 'high-contrast' | 'purple' | 'emerald') {
    const universalUIElements = document.querySelectorAll('.universal-page-finder');
    universalUIElements.forEach((element) => {
      element.setAttribute('data-theme', theme);
    });
    
    console.log(`🎯 Universal UI 主题已切换到: ${theme}`);
  }

  /**
   * 启用/禁用 Glassmorphism 效果
   */
  public toggleGlassmorphism(enabled: boolean) {
    const universalUIElements = document.querySelectorAll('.universal-page-finder');
    universalUIElements.forEach((element) => {
      if (enabled) {
        element.setAttribute('data-glassmorphism', 'enabled');
      } else {
        element.removeAttribute('data-glassmorphism');
      }
    });
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