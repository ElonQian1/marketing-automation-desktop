/**
 * 精确循环卡片样式修复器
 * 只修复真正的循环步骤卡片，避免影响其他组件
 */

import { LoopCardSelectorValidator } from './loop-card-selector-strategy';

export interface PreciseStyleFixerConfig {
  /** 是否启用调试模式 */
  debug: boolean;
  /** 检查间隔（毫秒） */
  checkInterval: number;
  /** 是否自动修复 */
  autoFix: boolean;
}

/**
 * 精确循环卡片样式修复器
 */
export class PreciseLoopCardStyleFixer {
  private config: PreciseStyleFixerConfig;
  private fixedCards = new Set<HTMLElement>();
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private isRunning = false;

  constructor(config: Partial<PreciseStyleFixerConfig> = {}) {
    this.config = {
      debug: false,
      checkInterval: 2000,
      autoFix: true,
      ...config
    };
  }

  /**
   * 启动修复器
   */
  start(): void {
    if (this.isRunning) {
      this.log('精确循环卡片修复器已在运行中');
      return;
    }

    this.isRunning = true;
    this.fixExistingLoopCards();
    this.startObserver();
    this.startPeriodicCheck();
    
    this.log('精确循环卡片修复器已启动');
  }

  /**
   * 停止修复器
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

    this.fixedCards.clear();
    this.isRunning = false;
    this.log('精确循环卡片修复器已停止');
  }

  /**
   * 修复现有的循环卡片
   */
  private fixExistingLoopCards(): void {
    const validLoopCards = LoopCardSelectorValidator.getAllValidLoopCards();
    
    validLoopCards.forEach(card => {
      this.fixLoopCard(card);
    });

    this.log(`已修复 ${this.fixedCards.size} 个现有循环卡片`);
  }

  /**
   * 修复单个循环卡片
   */
  private fixLoopCard(card: HTMLElement): void {
    if (this.fixedCards.has(card)) {
      return;
    }

    // 验证是否真的是循环卡片
    if (!LoopCardSelectorValidator.shouldApplyWhiteTheme(card)) {
      this.log(`跳过非循环卡片: ${card.tagName}.${card.className}`);
      return;
    }

    // 标记为循环卡片
    LoopCardSelectorValidator.markAsLoopCard(card);

    // 修复主容器
    this.applyWhiteThemeToContainer(card);

    // 修复内容元素（更保守的方式）
    this.fixLoopCardContent(card);

    this.fixedCards.add(card);
    this.log(`修复循环卡片: ${card.tagName}.${card.className}`);
  }

  /**
   * 应用白色主题到容器
   */
  private applyWhiteThemeToContainer(container: HTMLElement): void {
    this.applyStyles(container, {
      'background-color': '#ffffff',
      'color': '#333333',
      'border-color': '#d9d9d9',
      
      // 覆盖可能的CSS变量
      '--dark-bg-primary': '#ffffff',
      '--dark-bg-secondary': '#ffffff',
      '--dark-text-primary': '#333333',
      '--dark-text-secondary': '#666666'
    });
  }

  /**
   * 修复循环卡片内容（保守策略）
   */
  private fixLoopCardContent(container: HTMLElement): void {
    // 只修复直接子元素的文字颜色，不深度遍历
    const directChildren = Array.from(container.children) as HTMLElement[];
    
    directChildren.forEach(child => {
      // 检查是否需要修复文字颜色
      if (this.needsTextColorFix(child)) {
        child.style.setProperty('color', '#333333', 'important');
      }

      // 修复Ant Design组件
      this.fixAntdComponentInLoopCard(child);
    });

    // 修复常见的问题元素（使用精确选择器）
    this.fixSpecificElements(container);
  }

  /**
   * 检查是否需要修复文字颜色
   */
  private needsTextColorFix(element: HTMLElement): boolean {
    const computed = window.getComputedStyle(element);
    const color = computed.color;
    
    // 检查是否是白色文字或其他不可读颜色
    return color.includes('255, 255, 255') || 
           color === 'white' ||
           color === 'rgb(255, 255, 255)';
  }

  /**
   * 修复循环卡片内的Ant Design组件
   */
  private fixAntdComponentInLoopCard(element: HTMLElement): void {
    // 按钮
    if (element.classList.contains('ant-btn')) {
      if (element.classList.contains('ant-btn-dangerous')) {
        this.applyStyles(element, {
          'background-color': '#fff2f0',
          'color': '#ff4d4f',
          'border-color': '#ff4d4f'
        });
      } else if (element.classList.contains('ant-btn-primary')) {
        this.applyStyles(element, {
          'background-color': '#1890ff',
          'color': '#ffffff',
          'border-color': '#1890ff'
        });
      } else {
        this.applyStyles(element, {
          'background-color': '#ffffff',
          'color': '#333333',
          'border-color': '#d9d9d9'
        });
      }
    }

    // 标签
    if (element.classList.contains('ant-tag')) {
      if (element.classList.contains('ant-tag-blue')) {
        this.applyStyles(element, {
          'background-color': '#e6f7ff',
          'color': '#1890ff',
          'border-color': '#91d5ff'
        });
      } else {
        this.applyStyles(element, {
          'background-color': '#f0f0f0',
          'color': '#333333',
          'border-color': '#d9d9d9'
        });
      }
    }

    // 开关
    if (element.classList.contains('ant-switch')) {
      if (element.classList.contains('ant-switch-checked')) {
        this.applyStyles(element, {
          'background-color': '#1890ff'
        });
      } else {
        this.applyStyles(element, {
          'background-color': '#bfbfbf'
        });
      }
    }

    // 图标
    if (element.classList.contains('anticon')) {
      this.applyStyles(element, {
        'color': '#666666'
      });
    }
  }

  /**
   * 修复特定元素
   */
  private fixSpecificElements(container: HTMLElement): void {
    // 修复标题
    const titles = container.querySelectorAll('h1, h2, h3, h4, h5, h6, .ant-typography-title');
    titles.forEach(title => {
      (title as HTMLElement).style.setProperty('color', '#333333', 'important');
    });

    // 修复段落
    const paragraphs = container.querySelectorAll('p, .ant-typography-paragraph');
    paragraphs.forEach(p => {
      (p as HTMLElement).style.setProperty('color', '#333333', 'important');
    });

    // 修复输入框
    const inputs = container.querySelectorAll('input, textarea, .ant-input');
    inputs.forEach(input => {
      const inputEl = input as HTMLElement;
      this.applyStyles(inputEl, {
        'background-color': '#ffffff',
        'color': '#333333',
        'border-color': '#d9d9d9'
      });
    });
  }

  /**
   * 应用样式
   */
  private applyStyles(element: HTMLElement, styles: Record<string, string>): void {
    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value, 'important');
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
              this.checkNewElement(element);
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
   * 检查新元素
   */
  private checkNewElement(element: HTMLElement): void {
    // 检查是否是循环卡片
    if (LoopCardSelectorValidator.isValidLoopCard(element)) {
      this.fixLoopCard(element);
    }

    // 检查子元素中是否有循环卡片
    const childLoopCards = LoopCardSelectorValidator.getAllValidLoopCards();
    childLoopCards.forEach(card => {
      if (element.contains(card) && !this.fixedCards.has(card)) {
        this.fixLoopCard(card);
      }
    });
  }

  /**
   * 启动定期检查
   */
  private startPeriodicCheck(): void {
    this.intervalId = window.setInterval(() => {
      if (this.config.autoFix) {
        this.performMaintenanceCheck();
      }
    }, this.config.checkInterval);
  }

  /**
   * 执行维护检查
   */
  private performMaintenanceCheck(): void {
    let fixCount = 0;

    // 重新检查已修复的卡片
    this.fixedCards.forEach(card => {
      if (this.needsMaintenance(card)) {
        this.applyWhiteThemeToContainer(card);
        this.fixLoopCardContent(card);
        fixCount++;
      }
    });

    // 检查是否有新的循环卡片
    const currentLoopCards = LoopCardSelectorValidator.getAllValidLoopCards();
    currentLoopCards.forEach(card => {
      if (!this.fixedCards.has(card)) {
        this.fixLoopCard(card);
        fixCount++;
      }
    });

    if (fixCount > 0) {
      this.log(`维护检查: 修复了 ${fixCount} 个循环卡片`);
    }
  }

  /**
   * 检查卡片是否需要维护
   */
  private needsMaintenance(card: HTMLElement): boolean {
    const computed = window.getComputedStyle(card);
    
    // 检查背景是否被改变
    const bgColor = computed.backgroundColor;
    if (!bgColor.includes('255, 255, 255') && bgColor !== 'white' && bgColor !== 'rgb(255, 255, 255)') {
      return true;
    }

    // 检查文字颜色是否被改变
    const textColor = computed.color;
    if (textColor.includes('255, 255, 255') || textColor === 'white') {
      return true;
    }

    return false;
  }

  /**
   * 日志输出
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`🎨 [PreciseLoopCardStyleFixer] ${message}`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): { fixedCards: number; isRunning: boolean } {
    return {
      fixedCards: this.fixedCards.size,
      isRunning: this.isRunning
    };
  }

  /**
   * 强制重新修复所有循环卡片
   */
  forceRefixAll(): void {
    this.fixedCards.clear();
    this.fixExistingLoopCards();
    this.log('已强制重新修复所有循环卡片');
  }

  /**
   * 移除指定卡片的修复
   */
  removeCardFix(card: HTMLElement): void {
    LoopCardSelectorValidator.unmarkLoopCard(card);
    this.fixedCards.delete(card);
    
    // 清除内联样式
    card.style.cssText = '';
    
    this.log('已移除卡片修复');
  }
}

// 创建全局实例
export const preciseLoopCardStyleFixer = new PreciseLoopCardStyleFixer({
  debug: process.env.NODE_ENV === 'development',
  checkInterval: 3000,
  autoFix: true
});

// 开发环境调试工具
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).preciseLoopCardStyleFixer = preciseLoopCardStyleFixer;
  (window as any).fixPreciseLoopCards = () => preciseLoopCardStyleFixer.forceRefixAll();
  (window as any).getPreciseLoopCardStats = () => preciseLoopCardStyleFixer.getStats();
}