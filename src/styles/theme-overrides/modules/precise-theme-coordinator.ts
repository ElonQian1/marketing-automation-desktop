/**
 * 精确主题协调器
 * 统一管理循环卡片白色主题和暗色主题保护，确保互不干扰
 */

import { LoopCardSelectorValidator, LoopCardSelectorDebugger } from './loop-card-selector-strategy';
import { darkThemeProtector } from './dark-theme-protector';
import { preciseLoopCardStyleFixer } from './precise-loop-card-style-fixer';

export interface PreciseThemeCoordinatorConfig {
  /** 是否启用调试模式 */
  debug: boolean;
  /** 是否启用循环卡片修复 */
  enableLoopCardFix: boolean;
  /** 是否启用暗色主题保护 */
  enableDarkThemeProtection: boolean;
  /** 检查间隔（毫秒） */
  checkInterval: number;
}

/**
 * 精确主题协调器
 */
export class PreciseThemeCoordinator {
  private config: PreciseThemeCoordinatorConfig;
  private isInitialized = false;
  private conflictResolver: ConflictResolver;

  constructor(config: Partial<PreciseThemeCoordinatorConfig> = {}) {
    this.config = {
      debug: process.env.NODE_ENV === 'development',
      enableLoopCardFix: true,
      enableDarkThemeProtection: true,
      checkInterval: 5000,
      ...config
    };

    this.conflictResolver = new ConflictResolver(this.config.debug);
  }

  /**
   * 初始化精确主题协调器
   */
  init(): void {
    if (this.isInitialized) {
      this.log('精确主题协调器已经初始化');
      return;
    }

    this.log('🎨 正在初始化精确主题协调器...');

    // 等待DOM准备
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.performInitialization();
      });
    } else {
      // 给其他系统一点初始化时间
      setTimeout(() => {
        this.performInitialization();
      }, 100);
    }
  }

  /**
   * 执行初始化
   */
  private performInitialization(): void {
    try {
      // 1. 停止旧的修复器（避免冲突）
      this.disableOldFixers();

      // 2. 启动暗色主题保护
      if (this.config.enableDarkThemeProtection) {
        darkThemeProtector.start();
        this.log('✅ 暗色主题保护器已启动');
      }

      // 3. 启动精确循环卡片修复
      if (this.config.enableLoopCardFix) {
        preciseLoopCardStyleFixer.start();
        this.log('✅ 精确循环卡片修复器已启动');
      }

      // 4. 启动冲突解决器
      this.conflictResolver.start();

      // 5. 绑定调试工具
      this.bindDebugTools();

      this.isInitialized = true;
      this.log('✅ 精确主题协调器初始化完成');

      // 6. 输出初始统计
      setTimeout(() => {
        this.logStats();
      }, 1000);

    } catch (error) {
      console.error('❌ 精确主题协调器初始化失败:', error);
    }
  }

  /**
   * 禁用旧的修复器
   */
  private disableOldFixers(): void {
    // 停止旧的循环卡片修复器
    if (typeof window !== 'undefined') {
      const oldFixer = (window as any).loopCardWhiteThemeFixer;
      if (oldFixer && typeof oldFixer.destroy === 'function') {
        oldFixer.destroy();
        this.log('🛑 已停止旧的循环卡片修复器');
      }

      // 移除旧的CSS
      const oldStyles = document.querySelectorAll('style[data-old-loop-fix], link[data-old-loop-fix]');
      oldStyles.forEach(style => style.remove());
    }
  }

  /**
   * 绑定调试工具
   */
  private bindDebugTools(): void {
    if (typeof window === 'undefined' || !this.config.debug) return;

    const debugTools = {
      // 主协调器控制
      preciseThemeCoordinator: this,
      startPreciseTheme: () => this.init(),
      stopPreciseTheme: () => this.destroy(),
      getPreciseThemeStats: () => this.getStats(),

      // 选择器分析工具
      analyzeLoopSelectors: () => LoopCardSelectorDebugger.analyzeSelectors(),
      highlightLoopCards: () => LoopCardSelectorDebugger.highlightLoopCards(),
      removeLoopHighlight: () => LoopCardSelectorDebugger.removeHighlight(),

      // 精确修复工具
      fixPreciseLoopCards: () => preciseLoopCardStyleFixer.forceRefixAll(),
      protectDarkTheme: () => darkThemeProtector.forceReprotect(),

      // 冲突解决工具
      resolveThemeConflicts: () => this.conflictResolver.resolveAllConflicts(),
      detectThemeConflicts: () => this.conflictResolver.detectConflicts(),

      // 分析工具
      analyzeThemeConflicts: () => this.analyzeCurrentState()
    };

    Object.entries(debugTools).forEach(([name, func]) => {
      (window as any)[name] = func;
    });

    this.log('🔧 调试工具已绑定到全局');
  }

  /**
   * 分析当前状态
   */
  private analyzeCurrentState(): void {
    console.log('🔍 主题状态分析:');
    
    // 分析循环卡片
    const validLoopCards = LoopCardSelectorValidator.getAllValidLoopCards();
    console.log(`📊 检测到 ${validLoopCards.length} 个有效循环卡片`);

    // 分析暗色主题元素
    const darkElements = document.querySelectorAll('[data-dark-theme-protected="true"]');
    console.log(`🛡️ 保护了 ${darkElements.length} 个暗色主题元素`);

    // 分析潜在冲突
    const conflicts = this.conflictResolver.detectConflicts();
    console.log(`⚠️ 检测到 ${conflicts.length} 个潜在冲突`);

    // 分析问题元素
    this.analyzeProblematicElements();
  }

  /**
   * 分析问题元素
   */
  private analyzeProblematicElements(): void {
    const problematicElements: HTMLElement[] = [];

    // 查找白底白字的元素
    document.querySelectorAll('*').forEach(el => {
      const element = el as HTMLElement;
      const computed = window.getComputedStyle(element);
      
      const bgColor = computed.backgroundColor;
      const textColor = computed.color;
      
      const isWhiteBg = bgColor.includes('255, 255, 255') || bgColor === 'white';
      const isWhiteText = textColor.includes('255, 255, 255') || textColor === 'white';
      const isBlackText = textColor.includes('0, 0, 0') || textColor === 'black';
      
      if (isWhiteBg && isWhiteText) {
        problematicElements.push(element);
      } else if (!isWhiteBg && !isBlackText && !LoopCardSelectorValidator.isValidLoopCard(element)) {
        // 非循环卡片但不是暗色主题
        if (!element.closest('[data-dark-theme-protected="true"]')) {
          problematicElements.push(element);
        }
      }
    });

    console.log(`🚨 发现 ${problematicElements.length} 个问题元素`);
    
    if (problematicElements.length > 0) {
      console.log('问题元素详情:');
      problematicElements.slice(0, 10).forEach((el, index) => {
        console.log(`${index + 1}. ${el.tagName}.${el.className} - ${el.id ? '#' + el.id : ''}`);
      });
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): any {
    return {
      initialized: this.isInitialized,
      config: this.config,
      loopCardFixer: preciseLoopCardStyleFixer.getStats(),
      darkThemeProtector: darkThemeProtector.getStats(),
      conflictResolver: this.conflictResolver.getStats(),
      validLoopCards: LoopCardSelectorValidator.getAllValidLoopCards().length,
      darkProtectedElements: document.querySelectorAll('[data-dark-theme-protected="true"]').length
    };
  }

  /**
   * 输出统计信息
   */
  private logStats(): void {
    const stats = this.getStats();
    this.log('📊 主题协调器统计:');
    this.log(`  循环卡片修复: ${stats.loopCardFixer.fixedCards} 个`);
    this.log(`  暗色主题保护: ${stats.darkThemeProtector.protectedElements} 个`);
    this.log(`  有效循环卡片: ${stats.validLoopCards} 个`);
    this.log(`  暗色保护元素: ${stats.darkProtectedElements} 个`);
  }

  /**
   * 销毁协调器
   */
  destroy(): void {
    if (darkThemeProtector) {
      darkThemeProtector.stop();
    }
    
    if (preciseLoopCardStyleFixer) {
      preciseLoopCardStyleFixer.stop();
    }

    if (this.conflictResolver) {
      this.conflictResolver.stop();
    }

    this.isInitialized = false;
    this.log('🛑 精确主题协调器已销毁');
  }

  /**
   * 日志输出
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`🎨 [PreciseThemeCoordinator] ${message}`);
    }
  }
}

/**
 * 冲突解决器
 */
class ConflictResolver {
  private debug: boolean;
  private intervalId: number | null = null;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  start(): void {
    this.intervalId = window.setInterval(() => {
      this.resolveAllConflicts();
    }, 10000); // 每10秒检查一次冲突
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 检测冲突
   */
  detectConflicts(): HTMLElement[] {
    const conflicts: HTMLElement[] = [];
    
    // 检测循环卡片被暗色主题影响的情况
    const loopCards = LoopCardSelectorValidator.getAllValidLoopCards();
    loopCards.forEach(card => {
      const computed = window.getComputedStyle(card);
      const bgColor = computed.backgroundColor;
      
      if (!bgColor.includes('255, 255, 255') && bgColor !== 'white') {
        conflicts.push(card);
      }
    });

    // 检测暗色元素被循环卡片样式影响的情况
    const darkElements = document.querySelectorAll('[data-dark-theme-protected="true"]');
    darkElements.forEach(el => {
      const element = el as HTMLElement;
      const computed = window.getComputedStyle(element);
      const bgColor = computed.backgroundColor;
      
      if (bgColor.includes('255, 255, 255') || bgColor === 'white') {
        if (!LoopCardSelectorValidator.isValidLoopCard(element)) {
          conflicts.push(element);
        }
      }
    });

    return conflicts;
  }

  /**
   * 解决所有冲突
   */
  resolveAllConflicts(): void {
    const conflicts = this.detectConflicts();
    
    if (conflicts.length === 0) return;

    this.log(`🔧 正在解决 ${conflicts.length} 个主题冲突`);

    conflicts.forEach(element => {
      this.resolveElementConflict(element);
    });
  }

  /**
   * 解决单个元素冲突
   */
  private resolveElementConflict(element: HTMLElement): void {
    if (LoopCardSelectorValidator.isValidLoopCard(element)) {
      // 这是循环卡片，应该是白色主题
      preciseLoopCardStyleFixer.forceRefixAll();
    } else {
      // 这是暗色主题元素，应该保护
      darkThemeProtector.forceReprotect();
    }
  }

  getStats(): { conflictsDetected: number } {
    return {
      conflictsDetected: this.detectConflicts().length
    };
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`⚖️ [ConflictResolver] ${message}`);
    }
  }
}

// 创建全局实例但不自动初始化
export const preciseThemeCoordinator = new PreciseThemeCoordinator();

// 🚫 移除自动初始化 - 用户不希望保护机制导致卡顿
// preciseThemeCoordinator.init();

// 全局导出（仅供调试）
if (typeof window !== 'undefined') {
  (window as any).preciseThemeCoordinator = preciseThemeCoordinator;
}