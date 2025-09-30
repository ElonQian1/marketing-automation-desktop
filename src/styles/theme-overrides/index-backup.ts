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

    this.isInitialized = true;
    console.log('✅ 混合主题覆盖系统 v2 初始化完成');
  }

  /**
   * 添加主题标记
   */
  private addThemeMarker() {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  /**
   * 启用自动修复 (v2 - 精确主题协调器优先)
   */
  private enableAutoFix() {
    // 给DOM一点时间渲染
    setTimeout(() => {
      console.log('🔧 启动精确主题协调器 (优先系统)');
      
      // 精确主题协调器已经自动初始化，这里只需要确认状态
      if (preciseThemeCoordinator) {
        console.log('✅ 精确主题协调器已启动 (循环卡片白色主题 + 暗色主题保护)');
      }
      
      // 启用传统修复器作为备用 (如果需要)
      if (this.legacySystemEnabled) {
        this.styleFixer.enable();
        this.enhancedDetector.start();
        this.hardcodedFixer.start();
        this.menuFixer.start();
        overlayStyleFixer.init();
        
        console.log('🔧 传统五重修复系统已启动作为备用：基础修复器 + 增强检测器 + 硬编码修复器 + 菜单交互修复器 + 浮层样式修复器');
      }
      
      // 在开发环境提供更多调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 开发环境：精确主题协调器 + 传统备用系统调试模式已启用');
        this.bindDebugMethods();
      }
    }, 100);
  }

  /**
   * 绑定调试方法到全局 (v2)
   */
  private bindDebugMethods() {
    (window as any).hybridThemeOverrideManager = this;
    (window as any).fixAllStyles = () => this.fixAllStyles();
    (window as any).getThemeStats = () => ({
      basic: this.styleFixer.getStats(),
      enhanced: this.enhancedDetector.getStats(),
      hardcoded: this.hardcodedFixer.getStats(),
      menu: this.menuFixer.getStats(),
      overlay: overlayStyleFixer.getStats(),
      // 使用新的精确主题协调器
      preciseTheme: preciseThemeCoordinator.getStats()
    });
    (window as any).highlightProblems = () => this.enhancedDetector.highlightProblems();
    (window as any).removeHighlights = () => this.enhancedDetector.removeHighlights();
    (window as any).forceCheck = () => this.enhancedDetector.performFullCheck();
    (window as any).scanHardcoded = () => this.hardcodedFixer.scanAndFix();
    (window as any).fixMenus = () => this.menuFixer.fixAllMenus();
    
    // 新的精确主题协调器调试方法
    (window as any).getPreciseThemeStats = () => preciseThemeCoordinator.getStats();
    (window as any).analyzePreciseTheme = () => (window as any).analyzeThemeConflicts();
    (window as any).fixPreciseLoopCards = () => (window as any).fixPreciseLoopCards();
    (window as any).protectDarkTheme = () => (window as any).protectDarkTheme();
  }

  /**
   * 手动触发全局修复 (v2)
   */
  fixAllStyles() {
    console.log('🔄 手动触发全局样式修复 (精确主题协调器 v2)...');
    
    // 传统系统修复
    this.styleFixer.scanAndFix();
    const enhancedFixed = this.enhancedDetector.performFullCheck();
    const hardcodedFixed = this.hardcodedFixer.scanAndFix();
    const menuFixed = this.menuFixer.fixAllMenus();
    overlayStyleFixer.forceRefixAll();
    const overlayStats = overlayStyleFixer.getStats();
    
    // 精确主题协调器修复
    const preciseStats = preciseThemeCoordinator.getStats();
    if ((window as any).fixPreciseLoopCards) {
      (window as any).fixPreciseLoopCards();
    }
    if ((window as any).protectDarkTheme) {
      (window as any).protectDarkTheme();
    }
    
    console.log(`🎯 修复统计: 增强检测器 ${enhancedFixed} 个，硬编码修复器 ${hardcodedFixed} 个，菜单修复器 ${menuFixed} 个，浮层修复器 ${overlayStats.fixedOverlays} 个，精确主题协调器 ${preciseStats.validLoopCards} 个循环卡片`);
  }

  /**
   * 获取修复统计 (v2)
   */
  getStats() {
    return {
      basic: this.styleFixer.getStats(),
      enhanced: this.enhancedDetector.getStats(),
      hardcoded: this.hardcodedFixer.getStats(),
      menu: this.menuFixer.getStats(),
      overlay: overlayStyleFixer.getStats(),
      // 新的精确主题协调器统计
      preciseTheme: preciseThemeCoordinator.getStats()
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
   * 销毁系统 (v2)
   */
  destroy() {
    this.styleFixer.destroy();
    this.enhancedDetector.stop();
    this.hardcodedFixer.stop();
    this.menuFixer.stop();
    overlayStyleFixer.destroy();
    
    // 销毁精确主题协调器
    if (preciseThemeCoordinator) {
      preciseThemeCoordinator.destroy();
    }
    
    this.isInitialized = false;
  }
}

// 创建全局实例 (v2)
const hybridThemeOverrideManager = new HybridThemeOverrideManager();

// 自动初始化
hybridThemeOverrideManager.init();

// 导出到全局作用域便于调试
if (typeof window !== 'undefined') {
  (window as any).hybridThemeOverrideManager = hybridThemeOverrideManager;
  
  console.log('🎨 混合主题覆盖管理器 v2 已加载 (精确主题协调器)！');
  console.log('调试方法:');
  console.log('  hybridThemeOverrideManager.fixAllStyles() - 手动修复所有样式');
  console.log('  hybridThemeOverrideManager.getStats() - 查看统计信息');
  console.log('  hybridThemeOverrideManager.enableDebug() - 启用调试模式');
  console.log('  getPreciseThemeStats() - 查看精确主题协调器统计');
  console.log('  analyzePreciseTheme() - 分析主题冲突');
  console.log('  fixPreciseLoopCards() - 强制修复循环卡片');
  console.log('  protectDarkTheme() - 保护暗色主题');
}

export default hybridThemeOverrideManager;