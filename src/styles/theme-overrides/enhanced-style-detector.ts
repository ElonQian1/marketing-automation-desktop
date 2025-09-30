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
  private fixedElements = new Set<HTMLElement>();
  private isFixing = false; // 防止重入修复

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
    // 防止重入
    if (this.isFixing) {
      this.log('⏸️ 修复正在进行中，跳过重复检查');
      return 0;
    }

    this.isFixing = true;
    const beforeCount = this.fixedCount;
    this.detectedProblems = [];
    
    // 查找所有可能的问题元素
    const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
    
    allElements.forEach(element => {
      // 跳过已修复的元素
      if (this.fixedElements.has(element)) {
        return;
      }
      
      if (this.isProblemElement(element)) {
        this.detectedProblems.push(element);
        if (this.config.forceFixMode) {
          this.fixElement(element);
          this.fixedElements.add(element); // 标记为已修复
        }
      }
    });

    const fixedInThisRound = this.fixedCount - beforeCount;
    this.log(`🔍 全面检查完成: 发现 ${this.detectedProblems.length} 个问题元素，修复 ${fixedInThisRound} 个`);
    
    // 释放重入锁
    this.isFixing = false;
    
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
      // 防止在修复过程中触发新的检查
      if (this.isFixing) {
        return;
      }

      let hasRelevantChanges = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              // 只有当元素没有被修复过时才检查
              if (!this.fixedElements.has(element)) {
                hasRelevantChanges = true;
              }
            }
          });
        }
        // 移除style属性监听，避免修复过程中触发无限循环
      });

      // 节流处理：只有发现相关变化时才进行检查
      if (hasRelevantChanges) {
        // 延迟执行，避免频繁触发
        setTimeout(() => {
          if (!this.isFixing) {
            this.checkNewElements();
          }
        }, 300);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false // 不监听属性变化，避免因修复样式触发无限循环
    });
  }

  // 新增：只检查新元素，而不是全面检查
  private checkNewElements(): void {
    const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
    let newFixCount = 0;
    
    allElements.forEach(element => {
      // 只处理未修复的元素
      if (!this.fixedElements.has(element) && this.isProblemElement(element)) {
        if (this.config.forceFixMode) {
          this.fixElement(element);
          this.fixedElements.add(element);
          newFixCount++;
        }
      }
    });
    
    if (newFixCount > 0) {
      this.log(`🔧 检查新元素: 修复了 ${newFixCount} 个`);
    }
  }

  private startIntervalCheck(): void {
    this.intervalId = window.setInterval(() => {
      // 只有在不进行修复时才执行定时检查
      if (!this.isFixing) {
        this.checkNewElements(); // 使用较轻量的检查而不是全面检查
      }
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

// 创建默认实例（暂时不自动启动以避免无限循环）
const defaultDetector = new EnhancedStyleDetector({
  debugMode: false, // 关闭调试模式减少日志
  forceFixMode: false, // 暂时关闭强制修复模式
  checkInterval: 10000 // 增加检测间隔到10秒
});

// 手动控制启动，避免自动启动造成问题
// 注释掉自动启动代码
/*
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => defaultDetector.start(), 1000);
  });
} else {
  setTimeout(() => defaultDetector.start(), 1000);
}
*/

export default defaultDetector;