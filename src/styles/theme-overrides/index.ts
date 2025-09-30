/**
 * 主题覆盖系统入口
 * 统一管理全局样式修复和主题覆盖
 */

// 导入所有样式覆盖
import './global-dark-theme.css';
import './inline-style-overrides.css';
import './component-specific.css';
import './enhanced-inline-fixes.css';
import './super-force-dark.css';
import './menu-interactive-fixes.css';

// 导入修复工具
import GlobalStyleFixer from './global-style-fixer';
import { EnhancedStyleDetector } from './enhanced-style-detector';
import { HardcodedStyleFixer } from './hardcoded-style-fixer';
import { MenuInteractionFixer } from './menu-interaction-fixer';

/**
 * 增强主题覆盖管理器
 */
class ThemeOverrideManager {
  private styleFixer: GlobalStyleFixer;
  private enhancedDetector: EnhancedStyleDetector;
  private hardcodedFixer: HardcodedStyleFixer;
  private menuFixer: MenuInteractionFixer;
  private isInitialized = false;

  constructor() {
    this.styleFixer = new GlobalStyleFixer();
    this.enhancedDetector = new EnhancedStyleDetector({
      debugMode: process.env.NODE_ENV === 'development',
      forceFixMode: true,
      checkInterval: 2500
    });
    this.hardcodedFixer = new HardcodedStyleFixer({
      debug: process.env.NODE_ENV === 'development',
      autoFix: true,
      frequency: 2000
    });
    this.menuFixer = new MenuInteractionFixer({
      debug: process.env.NODE_ENV === 'development',
      checkInterval: 1500
    });
  }

  /**
   * 初始化主题覆盖系统
   */
  init() {
    if (this.isInitialized) {
      console.warn('主题覆盖系统已经初始化');
      return;
    }

    console.log('🎨 初始化增强主题覆盖系统...');

    // 添加暗色主题标记到 html
    this.addThemeMarker();

    // 确保文档加载完成后再启用
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.enableAutoFix();
      });
    } else {
      this.enableAutoFix();
    }

    this.isInitialized = true;
    console.log('✅ 增强主题覆盖系统初始化完成');
  }

  /**
   * 添加主题标记
   */
  private addThemeMarker() {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  /**
   * 启用自动修复
   */
  private enableAutoFix() {
    // 给DOM一点时间渲染
    setTimeout(() => {
      // 启用原有的修复器
      this.styleFixer.enable();
      
      // 启用增强检测器
      this.enhancedDetector.start();
      
      // 启用硬编码修复器
      this.hardcodedFixer.start();
      
      // 启用菜单交互修复器
      this.menuFixer.start();
      
      console.log('🔧 四重修复系统已启动：基础修复器 + 增强检测器 + 硬编码修复器 + 菜单交互修复器');
      
      // 在开发环境提供更多调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 开发环境：全方位调试模式已启用');
        this.bindDebugMethods();
      }
    }, 100);
  }

  /**
   * 绑定调试方法到全局
   */
  private bindDebugMethods() {
    (window as any).themeOverrideManager = this;
    (window as any).fixAllStyles = () => this.fixAllStyles();
    (window as any).getThemeStats = () => ({
      basic: this.styleFixer.getStats(),
      enhanced: this.enhancedDetector.getStats(),
      hardcoded: this.hardcodedFixer.getStats(),
      menu: this.menuFixer.getStats()
    });
    (window as any).highlightProblems = () => this.enhancedDetector.highlightProblems();
    (window as any).removeHighlights = () => this.enhancedDetector.removeHighlights();
    (window as any).forceCheck = () => this.enhancedDetector.performFullCheck();
    (window as any).scanHardcoded = () => this.hardcodedFixer.scanAndFix();
    (window as any).fixMenus = () => this.menuFixer.fixAllMenus();
  }

  /**
   * 手动触发全局修复
   */
  fixAllStyles() {
    console.log('🔄 手动触发全局样式修复...');
    this.styleFixer.scanAndFix();
    const enhancedFixed = this.enhancedDetector.performFullCheck();
    const hardcodedFixed = this.hardcodedFixer.scanAndFix();
    const menuFixed = this.menuFixer.fixAllMenus();
    console.log(`🎯 修复统计: 增强检测器 ${enhancedFixed} 个，硬编码修复器 ${hardcodedFixed} 个，菜单修复器 ${menuFixed} 个`);
  }

  /**
   * 获取修复统计
   */
  getStats() {
    return {
      basic: this.styleFixer.getStats(),
      enhanced: this.enhancedDetector.getStats(),
      hardcoded: this.hardcodedFixer.getStats(),
      menu: this.menuFixer.getStats()
    };
  }

  /**
   * 启用调试模式
   */
  enableDebug() {
    this.styleFixer.enableDebug();
  }

  /**
   * 禁用调试模式
   */
  disableDebug() {
    this.styleFixer.disableDebug();
  }

  /**
   * 销毁系统
   */
  destroy() {
    this.styleFixer.destroy();
    this.enhancedDetector.stop();
    this.hardcodedFixer.stop();
    this.menuFixer.stop();
    this.isInitialized = false;
  }
}

// 创建全局实例
const themeOverrideManager = new ThemeOverrideManager();

// 自动初始化
themeOverrideManager.init();

// 导出到全局作用域便于调试
if (typeof window !== 'undefined') {
  (window as any).themeOverrideManager = themeOverrideManager;
  
  console.log('🎨 主题覆盖管理器已加载！');
  console.log('调试方法:');
  console.log('  themeOverrideManager.fixAllStyles() - 手动修复所有样式');
  console.log('  themeOverrideManager.getStats() - 查看统计信息');
  console.log('  themeOverrideManager.enableDebug() - 启用调试模式');
}

export default themeOverrideManager;