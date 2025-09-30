/**
 * 高级样式检测器 - 运行时动态修复系统
 * 
 * 专门处理用户发现的白底白字问题
 * 使用 MutationObserver 和定时检测双重保险
 */

interface EnhancedStyleDetectorConfig {
  /** 检测间隔（毫秒） */
  checkInterval?: number;
  /** 是否启用调试模式 */
  debugMode?: boolean;
  /** 白名单选择器 */
  whitelistSelectors?: string[];
  /** 强制修复模式 */
  forceFixMode?: boolean;
}

export class EnhancedStyleDetector {
  private config: Required<EnhancedStyleDetectorConfig>;
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private fixedCount = 0;
  private detectedProblems: HTMLElement[] = [];

  // 问题背景色列表（用户遇到的具体颜色）
  private readonly problemBackgrounds = [
    'rgb(245, 245, 245)',
    'rgb(248, 248, 248)', 
    'rgb(250, 250, 250)',
    'rgb(252, 252, 252)',
    'rgb(249, 249, 249)',
    'rgb(247, 247, 247)',
    'rgb(255, 255, 255)',
    '#f5f5f5',
    '#f8f8f8',
    '#fafafa',
    '#fcfcfc',
    '#f9f9f9',
    '#f7f7f7',
    '#fff',
    '#ffffff',
    'white'
  ];

  private readonly whitelistSelectors = [
    '.loop-step-card',
    '.step-card',
    '[data-allow-white]',
    '.ant-modal-content',
    '.ant-drawer-content',
    '.ant-popover-content'
  ];

  constructor(config: EnhancedStyleDetectorConfig = {}) {
    this.config = {
      checkInterval: config.checkInterval ?? 2000,
      debugMode: config.debugMode ?? false,
      whitelistSelectors: config.whitelistSelectors ?? this.whitelistSelectors,
      forceFixMode: config.forceFixMode ?? true
    };

    this.bindGlobalMethods();
  }

  /**
   * 启动增强检测器
   */
  public start(): void {
    this.log('🚀 启动增强样式检测器...');
    
    // 立即执行一次全面检查
    this.performFullCheck();
    
    // 启动 MutationObserver
    this.startObserver();
    
    // 启动定时检查
    this.startIntervalCheck();
    
    this.log(`✅ 检测器已启动，检测间隔: ${this.config.checkInterval}ms`);
  }

  /**
   * 停止检测器
   */
  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.log('🛑 增强样式检测器已停止');
  }

  /**
   * 执行全面检查
   */
  public performFullCheck(): number {
    const beforeCount = this.fixedCount;
    this.detectedProblems = [];
    
    // 查找所有可能的问题元素
    const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
    
    allElements.forEach(element => {
      if (this.isProblemElement(element)) {
        this.detectedProblems.push(element);
        if (this.config.forceFixMode) {
          this.fixElement(element);
        }
      }
    });

    const fixedInThisRound = this.fixedCount - beforeCount;
    this.log(`🔍 全面检查完成: 发现 ${this.detectedProblems.length} 个问题元素，修复 ${fixedInThisRound} 个`);
    
    return fixedInThisRound;
  }

  /**
   * 获取检测统计
   */
  public getStats() {
    return {
      totalFixed: this.fixedCount,
      currentProblems: this.detectedProblems.length,
      isRunning: this.observer !== null,
      config: this.config
    };
  }

  /**
   * 高亮显示问题元素（调试用）
   */
  public highlightProblems(): void {
    this.detectedProblems.forEach(element => {
      element.style.outline = '3px solid red';
      element.style.position = 'relative';
      
      // 添加调试标签
      const label = document.createElement('div');
      label.textContent = '⚠️ 白底问题';
      label.style.cssText = `
        position: absolute;
        top: -25px;
        left: 0;
        background: red;
        color: white;
        padding: 2px 6px;
        font-size: 12px;
        z-index: 10000;
        border-radius: 3px;
      `;
      element.appendChild(label);
    });
    
    this.log(`🔍 已高亮 ${this.detectedProblems.length} 个问题元素`);
  }

  /**
   * 移除高亮
   */
  public removeHighlights(): void {
    document.querySelectorAll('[style*="outline: 3px solid red"]').forEach(element => {
      (element as HTMLElement).style.outline = '';
      // 移除调试标签
      element.querySelectorAll('div').forEach(label => {
        if (label.textContent === '⚠️ 白底问题') {
          label.remove();
        }
      });
    });
    
    this.log('✨ 已移除所有高亮标记');
  }

  private startObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              // 检查新添加的元素及其子元素
              this.checkElementTree(element);
            }
          });
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target as HTMLElement;
          if (this.isProblemElement(element)) {
            this.fixElement(element);
          }
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  private startIntervalCheck(): void {
    this.intervalId = window.setInterval(() => {
      this.performFullCheck();
    }, this.config.checkInterval);
  }

  private checkElementTree(element: HTMLElement): void {
    // 检查当前元素
    if (this.isProblemElement(element)) {
      this.fixElement(element);
    }
    
    // 检查所有子元素
    element.querySelectorAll('*').forEach(child => {
      if (this.isProblemElement(child as HTMLElement)) {
        this.fixElement(child as HTMLElement);
      }
    });
  }

  private isProblemElement(element: HTMLElement): boolean {
    // 检查白名单
    if (this.isWhitelisted(element)) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    const inlineStyle = element.getAttribute('style') || '';
    
    // 检查背景色
    const backgroundColor = computedStyle.backgroundColor;
    const hasProblematicBackground = this.problemBackgrounds.some(color => 
      backgroundColor.includes(color) || inlineStyle.includes(color)
    );

    // 检查是否为布局容器（用户描述的特征）
    const hasLayoutCharacteristics = 
      inlineStyle.includes('padding: 8px 16px') ||
      inlineStyle.includes('margin-bottom: 16px') ||
      inlineStyle.includes('border-radius: 6px');

    return hasProblematicBackground && (
      hasLayoutCharacteristics ||
      element.classList.contains('ant-space') ||
      element.classList.contains('ant-typography') ||
      element.tagName === 'DIV'
    );
  }

  private isWhitelisted(element: HTMLElement): boolean {
    return this.config.whitelistSelectors.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector);
      } catch {
        return false;
      }
    });
  }

  private fixElement(element: HTMLElement): void {
    // 应用暗色主题
    element.style.setProperty('background', 'var(--dark-bg-secondary)', 'important');
    element.style.setProperty('background-color', 'var(--dark-bg-secondary)', 'important');
    element.style.setProperty('color', 'var(--dark-text-primary)', 'important');
    element.style.setProperty('border-color', 'var(--dark-border-primary)', 'important');
    
    // 修复子元素文字颜色
    element.querySelectorAll('*').forEach(child => {
      if (!this.isWhitelisted(child as HTMLElement)) {
        (child as HTMLElement).style.setProperty('color', 'var(--dark-text-primary)', 'important');
      }
    });

    this.fixedCount++;
    this.log(`🔧 已修复元素: ${element.tagName}.${element.className || 'no-class'}`);
  }

  private bindGlobalMethods(): void {
    // 绑定到全局对象，方便控制台调试
    (window as any).enhancedStyleDetector = this;
    (window as any).checkStyles = () => this.performFullCheck();
    (window as any).highlightProblems = () => this.highlightProblems();
    (window as any).removeHighlights = () => this.removeHighlights();
    (window as any).styleDetectorStats = () => this.getStats();
  }

  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[EnhancedStyleDetector] ${message}`);
    }
  }
}

// 创建默认实例并自动启动
const defaultDetector = new EnhancedStyleDetector({
  debugMode: true,
  forceFixMode: true,
  checkInterval: 3000
});

// 页面加载后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => defaultDetector.start(), 1000);
  });
} else {
  setTimeout(() => defaultDetector.start(), 1000);
}

export default defaultDetector;