/**
 * 运行时硬编码样式修复器
 * 专门处理用户报告的 rgb(245, 245, 245) 等硬编码样式问题
 */

interface HardcodedStyleFixerConfig {
  /** 检测频率（毫秒） */
  frequency?: number;
  /** 是否立即修复 */
  autoFix?: boolean;
  /** 调试模式 */
  debug?: boolean;
}

export class HardcodedStyleFixer {
  private config: Required<HardcodedStyleFixerConfig>;
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private fixCounter = 0;

  // 需要修复的硬编码背景色
  private readonly targetBackgrounds = [
    'rgb(245, 245, 245)',
    'rgb(248, 248, 248)',
    'rgb(250, 250, 250)',
    'rgb(252, 252, 252)',
    'rgb(249, 249, 249)',
    'rgb(247, 247, 247)',
    'rgb(255, 255, 255)'
  ];

  // 白名单 - 允许保持白色的元素
  private readonly whitelist = [
    '.loop-step-card',
    '.step-card',
    '[data-allow-white]',
    '.ant-modal-content',
    '.ant-popover-inner'
  ];

  constructor(config: HardcodedStyleFixerConfig = {}) {
    this.config = {
      frequency: config.frequency ?? 1500,
      autoFix: config.autoFix ?? true,
      debug: config.debug ?? false
    };
  }

  /**
   * 启动修复器
   */
  start(): void {
    this.log('🚀 启动硬编码样式修复器');
    
    // 立即执行一次修复
    this.scanAndFix();
    
    // 启动观察器
    this.startObserver();
    
    // 启动定时检查
    this.startIntervalScan();
    
    this.bindConsoleHelpers();
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
    
    this.log('🛑 硬编码样式修复器已停止');
  }

  /**
   * 扫描并修复所有问题元素
   */
  scanAndFix(): number {
    const beforeCount = this.fixCounter;
    const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
    
    allElements.forEach(element => {
      if (this.shouldFix(element)) {
        this.applyFix(element);
      }
    });

    const fixedCount = this.fixCounter - beforeCount;
    this.log(`🔧 本轮修复: ${fixedCount} 个元素，总计: ${this.fixCounter} 个`);
    
    return fixedCount;
  }

  /**
   * 检查元素是否需要修复
   */
  private shouldFix(element: HTMLElement): boolean {
    // 检查白名单
    if (this.isWhitelisted(element)) {
      return false;
    }

    // 检查内联样式
    const style = element.getAttribute('style') || '';
    
    return this.targetBackgrounds.some(color => 
      style.includes(`background: ${color}`) ||
      style.includes(`background-color: ${color}`)
    );
  }

  /**
   * 检查是否在白名单中
   */
  private isWhitelisted(element: HTMLElement): boolean {
    return this.whitelist.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector);
      } catch {
        return false;
      }
    });
  }

  /**
   * 应用修复
   */
  private applyFix(element: HTMLElement): void {
    // 强制应用暗色主题
    element.style.setProperty('background', 'var(--dark-bg-secondary)', 'important');
    element.style.setProperty('background-color', 'var(--dark-bg-secondary)', 'important');
    element.style.setProperty('color', 'var(--dark-text-primary)', 'important');
    
    // 修复子元素文字颜色
    this.fixChildText(element);
    
    this.fixCounter++;
    this.log(`✅ 修复元素: ${this.getElementDescription(element)}`);
  }

  /**
   * 修复子元素文字颜色
   */
  private fixChildText(container: HTMLElement): void {
    const textElements = container.querySelectorAll('*');
    textElements.forEach(element => {
      if (!this.isWhitelisted(element as HTMLElement)) {
        (element as HTMLElement).style.setProperty('color', 'var(--dark-text-primary)', 'important');
      }
    });
  }

  /**
   * 启动DOM观察器
   */
  private startObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      let hasChanges = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkElementAndChildren(node as HTMLElement);
              hasChanges = true;
            }
          });
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target as HTMLElement;
          if (this.shouldFix(element)) {
            this.applyFix(element);
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        this.log('🔄 检测到DOM变化，触发检查');
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
  }

  /**
   * 启动定时扫描
   */
  private startIntervalScan(): void {
    this.intervalId = window.setInterval(() => {
      this.scanAndFix();
    }, this.config.frequency);
  }

  /**
   * 检查元素及其子元素
   */
  private checkElementAndChildren(element: HTMLElement): void {
    if (this.shouldFix(element)) {
      this.applyFix(element);
    }
    
    element.querySelectorAll('*').forEach(child => {
      if (this.shouldFix(child as HTMLElement)) {
        this.applyFix(child as HTMLElement);
      }
    });
  }

  /**
   * 获取元素描述
   */
  private getElementDescription(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const id = element.id ? `#${element.id}` : '';
    return `${tag}${id}${classes}`;
  }

  /**
   * 绑定控制台辅助方法
   */
  private bindConsoleHelpers(): void {
    (window as any).hardcodedFixer = this;
    (window as any).scanHardcodedStyles = () => this.scanAndFix();
    (window as any).getHardcodedStats = () => ({
      totalFixed: this.fixCounter,
      isRunning: this.observer !== null,
      config: this.config
    });
  }

  /**
   * 输出日志
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[HardcodedStyleFixer] ${message}`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalFixed: this.fixCounter,
      isRunning: this.observer !== null,
      config: this.config
    };
  }
}

// 自动启动修复器
const autoFixer = new HardcodedStyleFixer({
  debug: true,
  autoFix: true,
  frequency: 2000
});

// 页面加载后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => autoFixer.start(), 500);
  });
} else {
  setTimeout(() => autoFixer.start(), 500);
}

export default autoFixer;