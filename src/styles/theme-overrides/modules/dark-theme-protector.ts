/**
 * 暗色主题保护机制
 * 确保非循环元素保持正确的暗色主题样式
 */

import { EXCLUDED_SELECTORS } from './loop-card-selector-strategy';

export interface DarkThemeProtectionConfig {
  /** 是否启用调试模式 */
  debug: boolean;
  /** 检查间隔（毫秒） */
  checkInterval: number;
  /** 是否自动修复 */
  autoFix: boolean;
}

/**
 * 暗色主题保护器
 */
export class DarkThemeProtector {
  private config: DarkThemeProtectionConfig;
  private protectedElements = new Set<HTMLElement>();
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private isRunning = false;

  constructor(config: Partial<DarkThemeProtectionConfig> = {}) {
    this.config = {
      debug: false,
      checkInterval: 3000,
      autoFix: true,
      ...config
    };
  }

  /**
   * 启动暗色主题保护
   */
  start(): void {
    if (this.isRunning) {
      this.log('暗色主题保护器已在运行中');
      return;
    }

    this.isRunning = true;
    this.protectExistingElements();
    this.startObserver();
    this.startPeriodicCheck();
    
    this.log('暗色主题保护器已启动');
  }

  /**
   * 停止保护
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.protectedElements.clear();
    this.isRunning = false;
    this.log('暗色主题保护器已停止');
  }

  /**
   * 保护现有元素
   */
  private protectExistingElements(): void {
    // ADB检查器相关元素
    this.protectAdbInspectorElements();
    
    // 通用暗色主题元素
    this.protectDarkThemeElements();
    
    // 表格和数据展示组件
    this.protectDataDisplayElements();
    
    // 导航和菜单组件
    this.protectNavigationElements();

    this.log(`已保护 ${this.protectedElements.size} 个现有元素`);
  }

  /**
   * 保护ADB检查器元素
   */
  private protectAdbInspectorElements(): void {
    const selectors = [
      '._root_1melx_11',
      '._card_1melx_151',
      '._cardHeader_1melx_167',
      '._cardBody_1melx_183',
      '._toolbar_1melx_27',
      '._btn_1melx_41',
      '._input_1melx_65',
      '._badge_1melx_281',
      '._tree_1melx_221',
      '._treeRow_1melx_241',
      '._previewBox_1melx_301',
      '._elementRect_1melx_317'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => this.protectElement(el as HTMLElement, 'adb-inspector'));
    });
  }

  /**
   * 保护暗色主题元素
   */
  private protectDarkThemeElements(): void {
    const selectors = [
      '[data-theme="dark"]',
      '.dark-theme-only',
      '.ant-modal',
      '.ant-drawer',
      '.ant-layout-sider',
      '.ant-menu'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => this.protectElement(el as HTMLElement, 'dark-theme'));
    });
  }

  /**
   * 保护数据展示元素
   */
  private protectDataDisplayElements(): void {
    const selectors = [
      '.ant-table',
      '.ant-list',
      '.ant-descriptions',
      '.ant-tree',
      '.ant-collapse'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => this.protectElement(el as HTMLElement, 'data-display'));
    });
  }

  /**
   * 保护导航元素
   */
  private protectNavigationElements(): void {
    const selectors = [
      '.ant-breadcrumb',
      '.ant-pagination',
      '.ant-steps',
      '.ant-affix',
      '.ant-back-top'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => this.protectElement(el as HTMLElement, 'navigation'));
    });
  }

  /**
   * 保护单个元素
   */
  private protectElement(element: HTMLElement, category: string): void {
    if (this.protectedElements.has(element)) {
      return;
    }

    // 添加保护标记
    element.setAttribute('data-dark-theme-protected', 'true');
    element.setAttribute('data-protection-category', category);
    
    // 应用暗色主题样式
    this.applyDarkTheme(element);
    
    this.protectedElements.add(element);
    this.log(`保护元素 [${category}]: ${element.tagName}.${element.className}`);
  }

  /**
   * 应用暗色主题样式
   */
  private applyDarkTheme(element: HTMLElement): void {
    // 根据元素类型应用不同的暗色主题
    if (element.matches('._root_1melx_11, ._card_1melx_151')) {
      // ADB检查器卡片
      this.applyStyles(element, {
        background: 'var(--dark-bg-secondary, #2d2d2d)',
        color: 'var(--dark-text-primary, #ffffff)',
        borderColor: 'var(--dark-border-primary, #404040)'
      });
    } else if (element.matches('._btn_1melx_41')) {
      // 按钮
      this.applyStyles(element, {
        background: 'var(--dark-bg-card, #2d2d2d)',
        color: 'var(--dark-text-primary, #ffffff)',
        borderColor: 'var(--dark-border-primary, #404040)'
      });
    } else if (element.matches('._input_1melx_65')) {
      // 输入框
      this.applyStyles(element, {
        background: 'var(--dark-bg-primary, #1a1a1a)',
        color: 'var(--dark-text-primary, #ffffff)',
        borderColor: 'var(--dark-border-primary, #404040)'
      });
    } else if (element.matches('.ant-modal, .ant-drawer')) {
      // 模态框和抽屉
      this.applyStyles(element, {
        background: 'var(--dark-bg-secondary, #2d2d2d)',
        color: 'var(--dark-text-primary, #ffffff)'
      });
    } else {
      // 通用暗色主题
      this.applyStyles(element, {
        background: 'var(--dark-bg-secondary, #2d2d2d)',
        color: 'var(--dark-text-primary, #ffffff)'
      });
    }

    // 保护子元素
    this.protectChildElements(element);
  }

  /**
   * 保护子元素
   */
  private protectChildElements(container: HTMLElement): void {
    const children = container.querySelectorAll('*');
    
    children.forEach(child => {
      const childEl = child as HTMLElement;
      
      // 跳过已保护的元素
      if (childEl.getAttribute('data-dark-theme-protected') === 'true') {
        return;
      }

      // 跳过循环卡片
      if (childEl.getAttribute('data-loop-step') === 'true') {
        return;
      }

      // 应用子元素暗色主题
      this.applyChildDarkTheme(childEl);
    });
  }

  /**
   * 应用子元素暗色主题
   */
  private applyChildDarkTheme(element: HTMLElement): void {
    // 文字颜色
    if (this.hasLightText(element)) {
      element.style.setProperty('color', 'var(--dark-text-primary, #ffffff)', 'important');
    }

    // 背景颜色（如果不是透明）
    const computed = window.getComputedStyle(element);
    const bgColor = computed.backgroundColor;
    
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      if (this.hasLightBackground(element)) {
        element.style.setProperty('background-color', 'var(--dark-bg-tertiary, #1f1f1f)', 'important');
      }
    }

    // 边框颜色
    if (computed.borderColor && this.hasLightBorder(element)) {
      element.style.setProperty('border-color', 'var(--dark-border-primary, #404040)', 'important');
    }
  }

  /**
   * 检查是否有亮色文字
   */
  private hasLightText(element: HTMLElement): boolean {
    const computed = window.getComputedStyle(element);
    const color = computed.color;
    return color.includes('0, 0, 0') || color === 'black' || color.includes('51, 51, 51');
  }

  /**
   * 检查是否有亮色背景
   */
  private hasLightBackground(element: HTMLElement): boolean {
    const computed = window.getComputedStyle(element);
    const bgColor = computed.backgroundColor;
    return bgColor.includes('255, 255, 255') || bgColor === 'white' || 
           bgColor.includes('248, 248, 248') || bgColor.includes('240, 240, 240');
  }

  /**
   * 检查是否有亮色边框
   */
  private hasLightBorder(element: HTMLElement): boolean {
    const computed = window.getComputedStyle(element);
    const borderColor = computed.borderColor;
    return borderColor.includes('217, 217, 217') || borderColor.includes('240, 240, 240');
  }

  /**
   * 应用样式
   */
  private applyStyles(element: HTMLElement, styles: Record<string, string>): void {
    Object.entries(styles).forEach(([property, value]) => {
      const kebabProperty = property.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      element.style.setProperty(kebabProperty, value, 'important');
    });
  }

  /**
   * 启动DOM观察器
   */
  private startObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              this.checkAndProtectNewElement(element);
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  /**
   * 检查并保护新元素
   */
  private checkAndProtectNewElement(element: HTMLElement): void {
    // 检查是否需要保护
    for (const excludeSelector of EXCLUDED_SELECTORS) {
      if (excludeSelector.includes(' *')) continue;
      
      try {
        if (element.matches(excludeSelector)) {
          this.protectElement(element, 'auto-detected');
          break;
        }
      } catch {
        // 忽略无效选择器
      }
    }

    // 递归检查子元素
    const children = element.querySelectorAll('*');
    children.forEach(child => {
      this.checkAndProtectNewElement(child as HTMLElement);
    });
  }

  /**
   * 启动定期检查
   */
  private startPeriodicCheck(): void {
    this.intervalId = window.setInterval(() => {
      if (this.config.autoFix) {
        this.performProtectionCheck();
      }
    }, this.config.checkInterval);
  }

  /**
   * 执行保护检查
   */
  private performProtectionCheck(): void {
    let fixCount = 0;

    this.protectedElements.forEach(element => {
      // 检查元素是否仍需要保护
      if (this.needsProtection(element)) {
        this.applyDarkTheme(element);
        fixCount++;
      }
    });

    if (fixCount > 0) {
      this.log(`定期检查: 重新保护了 ${fixCount} 个元素`);
    }
  }

  /**
   * 检查元素是否需要保护
   */
  private needsProtection(element: HTMLElement): boolean {
    const computed = window.getComputedStyle(element);
    
    // 检查是否被意外改为白色背景
    const bgColor = computed.backgroundColor;
    if (bgColor.includes('255, 255, 255') || bgColor === 'white') {
      return true;
    }

    // 检查是否被意外改为黑色文字
    const textColor = computed.color;
    if (textColor.includes('0, 0, 0') || textColor === 'black' || textColor.includes('51, 51, 51')) {
      return true;
    }

    return false;
  }

  /**
   * 日志输出
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`🛡️ [DarkThemeProtector] ${message}`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): { protectedElements: number; isRunning: boolean } {
    return {
      protectedElements: this.protectedElements.size,
      isRunning: this.isRunning
    };
  }

  /**
   * 强制重新保护所有元素
   */
  forceReprotect(): void {
    this.protectedElements.clear();
    this.protectExistingElements();
    this.log('已强制重新保护所有元素');
  }
}

// 创建全局实例
export const darkThemeProtector = new DarkThemeProtector({
  debug: process.env.NODE_ENV === 'development',
  checkInterval: 5000,
  autoFix: true
});

// 开发环境调试工具
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).darkThemeProtector = darkThemeProtector;
  (window as any).protectDarkTheme = () => darkThemeProtector.forceReprotect();
  (window as any).getDarkThemeStats = () => darkThemeProtector.getStats();
}