/**
 * 循环卡片白色主题修复器
 * 专门确保循环步骤卡片保持白底黑字样式，不被暗色主题影响
 */

export class LoopCardWhiteThemeFixer {
  private observer: MutationObserver | null = null;
  private fixedCards = new Set<HTMLElement>();
  private isRunning = false;

  /**
   * 启动循环卡片修复器
   */
  public init(): void {
    if (this.isRunning) {
      console.log('🔄 循环卡片修复器已在运行中');
      return;
    }

    this.isRunning = true;
    this.startObserver();
    this.fixExistingCards();
    console.log('🎨 循环卡片白色主题修复器已启动');
  }

  /**
   * 停止修复器
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.fixedCards.clear();
    this.isRunning = false;
    console.log('🛑 循环卡片修复器已停止');
  }

  /**
   * 修复现有的循环卡片
   */
  private fixExistingCards(): void {
    const loopCards = document.querySelectorAll(`
      .loop-step-card,
      .step-card,
      .white-background-allowed,
      [data-loop-badge],
      .loop-surface,
      .loop-card,
      .loop-anchor
    `);

    loopCards.forEach(card => {
      this.fixLoopCard(card as HTMLElement);
    });

    console.log(`🎨 已修复 ${this.fixedCards.size} 个现有循环卡片`);
  }

  /**
   * 修复单个循环卡片
   */
  private fixLoopCard(card: HTMLElement): void {
    if (this.fixedCards.has(card)) return;

    // 1. 修复卡片主容器
    this.applyWhiteTheme(card, {
      background: 'white',
      color: '#333',
      borderColor: '#d9d9d9'
    });

    // 2. 修复所有子元素
    this.fixAllChildElements(card);

    // 3. 修复特定组件
    this.fixAntdComponents(card);

    // 4. 修复图标和装饰元素
    this.fixIconsAndDecorations(card);

    this.fixedCards.add(card);
  }

  /**
   * 修复所有子元素
   */
  private fixAllChildElements(container: HTMLElement): void {
    const allChildren = container.querySelectorAll('*');
    
    allChildren.forEach(element => {
      const el = element as HTMLElement;
      
      // 基础文字颜色修复
      if (this.hasProblematicColor(el)) {
        this.applyWhiteTheme(el, { color: '#333' });
      }

      // 背景颜色修复
      if (this.hasProblematicBackground(el)) {
        if (el.classList.contains('ant-btn') || 
            el.classList.contains('ant-tag') ||
            el.classList.contains('ant-card')) {
          // 这些组件有专门的处理
          return;
        } else {
          this.applyWhiteTheme(el, { background: 'transparent' });
        }
      }
    });
  }

  /**
   * 修复Ant Design组件
   */
  private fixAntdComponents(container: HTMLElement): void {
    // 修复按钮
    const buttons = container.querySelectorAll('.ant-btn');
    buttons.forEach(btn => {
      const button = btn as HTMLElement;
      if (button.classList.contains('ant-btn-dangerous')) {
        this.applyWhiteTheme(button, {
          background: 'white',
          color: '#ff4d4f',
          borderColor: '#ff4d4f'
        });
      } else if (button.classList.contains('ant-btn-text')) {
        this.applyWhiteTheme(button, {
          background: 'transparent',
          color: '#333',
          border: 'none'
        });
      } else if (button.classList.contains('ant-btn-link')) {
        this.applyWhiteTheme(button, {
          background: 'transparent',
          color: '#1890ff',
          border: 'none'
        });
      } else {
        this.applyWhiteTheme(button, {
          background: 'white',
          color: '#333',
          borderColor: '#d9d9d9'
        });
      }
    });

    // 修复标签
    const tags = container.querySelectorAll('.ant-tag');
    tags.forEach(tag => {
      const tagEl = tag as HTMLElement;
      if (tagEl.classList.contains('ant-tag-blue')) {
        this.applyWhiteTheme(tagEl, {
          background: '#e6f7ff',
          color: '#1890ff',
          borderColor: '#91d5ff'
        });
      } else {
        this.applyWhiteTheme(tagEl, {
          background: '#f0f0f0',
          color: '#333',
          borderColor: '#d9d9d9'
        });
      }
    });

    // 修复排版组件
    const typographies = container.querySelectorAll('.ant-typography');
    typographies.forEach(typo => {
      this.applyWhiteTheme(typo as HTMLElement, { color: '#333' });
    });

    // 修复开关组件
    const switches = container.querySelectorAll('.ant-switch');
    switches.forEach(sw => {
      const switchEl = sw as HTMLElement;
      if (switchEl.classList.contains('ant-switch-checked')) {
        this.applyWhiteTheme(switchEl, { background: '#1890ff' });
      } else {
        this.applyWhiteTheme(switchEl, { background: '#bfbfbf' });
      }
    });

    // 修复卡片组件
    const cards = container.querySelectorAll('.ant-card');
    cards.forEach(card => {
      this.applyWhiteTheme(card as HTMLElement, {
        background: 'white',
        color: '#333',
        borderColor: '#d9d9d9'
      });
    });
  }

  /**
   * 修复图标和装饰元素
   */
  private fixIconsAndDecorations(container: HTMLElement): void {
    // 修复图标
    const icons = container.querySelectorAll('.anticon');
    icons.forEach(icon => {
      const iconEl = icon as HTMLElement;
      
      if (iconEl.classList.contains('text-blue-800') || 
          iconEl.classList.contains('text-blue-600')) {
        this.applyWhiteTheme(iconEl, { color: '#1890ff' });
      } else if (iconEl.classList.contains('text-red-500')) {
        this.applyWhiteTheme(iconEl, { color: '#ff4d4f' });
      } else if (iconEl.classList.contains('text-green-500')) {
        this.applyWhiteTheme(iconEl, { color: '#52c41a' });
      } else {
        this.applyWhiteTheme(iconEl, { color: '#666' });
      }
    });

    // 修复自定义装饰元素
    const iconPills = container.querySelectorAll('.loop-icon-pill');
    iconPills.forEach(pill => {
      this.applyWhiteTheme(pill as HTMLElement, {
        background: '#f0f0f0',
        color: '#333'
      });
    });

    const titleTags = container.querySelectorAll('.loop-title-tag');
    titleTags.forEach(tag => {
      this.applyWhiteTheme(tag as HTMLElement, {
        background: '#e6f7ff',
        color: '#1890ff',
        borderColor: '#91d5ff'
      });
    });
  }

  /**
   * 检查是否有问题的颜色
   */
  private hasProblematicColor(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    
    return color === 'rgb(255, 255, 255)' || 
           color === 'white' || 
           color === 'rgb(0, 0, 0)' ||
           color === 'black';
  }

  /**
   * 检查是否有问题的背景
   */
  private hasProblematicBackground(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element);
    const bg = computedStyle.backgroundColor;
    
    return bg === 'rgb(0, 0, 0)' || 
           bg === 'black' ||
           bg.includes('45, 45, 45') || // 暗色主题的灰色
           bg.includes('26, 26, 26') || // --dark-bg-primary
           bg.includes('29, 29, 29');   // --dark-bg-secondary
  }

  /**
   * 应用白色主题样式
   */
  private applyWhiteTheme(element: HTMLElement, styles: Record<string, string>): void {
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
              
              // 检查新增的循环卡片
              if (this.isLoopCard(element)) {
                this.fixLoopCard(element);
              }
              
              // 检查元素内的循环卡片
              const loopCards = element.querySelectorAll(`
                .loop-step-card,
                .step-card,
                .white-background-allowed,
                [data-loop-badge],
                .loop-surface,
                .loop-card,
                .loop-anchor
              `);
              
              loopCards.forEach(card => {
                if (!this.fixedCards.has(card as HTMLElement)) {
                  this.fixLoopCard(card as HTMLElement);
                }
              });
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
   * 检查是否是循环卡片
   */
  private isLoopCard(element: HTMLElement): boolean {
    return element.classList.contains('loop-step-card') ||
           element.classList.contains('step-card') ||
           element.classList.contains('white-background-allowed') ||
           element.hasAttribute('data-loop-badge') ||
           element.classList.contains('loop-surface') ||
           element.classList.contains('loop-card') ||
           element.classList.contains('loop-anchor');
  }

  /**
   * 获取修复统计信息
   */
  public getStats(): { fixedCards: number; isRunning: boolean } {
    return {
      fixedCards: this.fixedCards.size,
      isRunning: this.isRunning
    };
  }

  /**
   * 强制重新修复所有循环卡片
   */
  public forceRefixAll(): void {
    this.fixedCards.clear();
    this.fixExistingCards();
    console.log('🔄 已强制重新修复所有循环卡片');
  }
}

// 导出全局实例
export const loopCardWhiteThemeFixer = new LoopCardWhiteThemeFixer();

// 开发环境下的调试工具
if (typeof window !== 'undefined') {
  (window as any).loopCardWhiteThemeFixer = loopCardWhiteThemeFixer;
  (window as any).fixLoopCards = () => loopCardWhiteThemeFixer.forceRefixAll();
  (window as any).getLoopCardStats = () => loopCardWhiteThemeFixer.getStats();
}