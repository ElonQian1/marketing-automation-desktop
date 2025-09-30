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

// Universal UI 现代化样式系统 v2.0 - 直接导入CSS文件
import '../../components/universal-ui/styles/index-modern.css';  // 现代化样式系统主入口

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
 * 现代化主题管理器 - 专门解决循环卡片黑底黑字问题 + Universal UI 现代化增强
 */
class ModernThemeManager {
  private isInitialized = false;

  constructor() {
    console.log('🎨 现代化主题管理器 v2.0 - Universal UI 现代化样式系统');
    console.log('📦 模块包含:');
    console.log('  ├─ 现代化 Glassmorphism 设计');
    console.log('  ├─ CSS Layers架构 + 强制白底黑字 + 主程序保护');
    console.log('  ├─ Universal UI 现代化样式系统');
    console.log('  ├─ 现代化模态框和组件');
    console.log('  └─ 多主题支持和无障碍访问');
  }

  /**
   * 初始化现代化主题系统
   */
  init() {
    if (this.isInitialized) {
      console.warn('现代化主题管理器已经初始化');
      return;
    }

    console.log('🎨 初始化现代化主题系统...');
    console.log('✅ 现代化 Glassmorphism 样式');
    console.log('✅ 循环卡片样式修复模块');
    console.log('✅ Universal UI 现代化保护');
    console.log('✅ Modal 背景透明问题修复');

    // 添加主题标记
    this.addThemeMarkers();

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
    
    console.log(`✨ Glassmorphism 效果已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 添加主题标记（原有方法）
   */
  private addThemeMarkers() {
    const root = document.documentElement;
    
    // 主程序主题标记
    root.setAttribute('data-theme', 'modern-solution');
    root.classList.add('modern-theme-applied');
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
    console.log('🔍 现代化主题状态检查:');
    console.log('  - 现代化样式系统: index-modern.css');
    console.log('  - Glassmorphism 效果: 已启用');
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
  public enableDebug() {
    document.documentElement.setAttribute('data-debug', 'true');
    console.log('🔧 调试模式已启用 - 现代化样式调试');
    this.logThemeStatus();
  }

  /**
   * 禁用调试模式
   */
  public disableDebug() {
    document.documentElement.removeAttribute('data-debug');
    console.log('🔧 调试模式已禁用');
  }

  /**
   * 销毁（清理标记）
   */
  public destroy() {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    root.removeAttribute('data-debug');
    root.classList.remove('modern-theme-applied');
    root.classList.remove('loop-card-fix-applied');
    this.isInitialized = false;
    console.log('🛑 现代化主题系统已销毁');
  }

  /**
   * 获取状态
   */
  public getStats() {
    return {
      initialized: this.isInitialized,
      version: '2.0-modern',
      method: 'Modern Glassmorphism Architecture - Layer-based isolation',
      performance: 'Optimal - Modern CSS with hardware acceleration',
      modules: {
        modernStyles: 'Glassmorphism effects with backdrop-filter',
        layerArchitecture: 'CSS Layers with proper priority order',
        loopCardForce: 'Force white background with black text for loop cards',
        mainAppProtection: 'Protect main app dark theme from contamination',
        universalUIProtection: 'Modern dark theme for Universal UI'
      },
      features: {
        glassmorphism: true,
        animations: true,
        themes: ['dark', 'light', 'high-contrast', 'purple', 'emerald'],
        accessibility: true
      },
      architecture: 'Modern layer-based separation with glassmorphism effects',
      problem: 'Loop cards black-on-black text issue + outdated UI design',
      solution: 'Modern glassmorphism design with force white-on-black theme'
    };
  }
}

// 创建现代化主题管理器实例
const modernThemeManager = new ModernThemeManager();

// 自动初始化
modernThemeManager.init();

// 导出到全局作用域便于调试
if (typeof window !== 'undefined') {
  (window as any).modernThemeManager = modernThemeManager;
  
  console.log('🎨 现代化主题管理器已加载！');
  console.log('调试方法:');
  console.log('  modernThemeManager.getStats() - 查看状态信息');
  console.log('  modernThemeManager.enableDebug() - 启用调试模式');
  console.log('  modernThemeManager.disableDebug() - 禁用调试模式');
  console.log('  modernThemeManager.switchUniversalUITheme("purple") - 切换主题');
  console.log('  modernThemeManager.toggleGlassmorphism(false) - 切换玻璃效果');
  console.log('  modernThemeManager.destroy() - 销毁主题系统');
}

export default modernThemeManager;