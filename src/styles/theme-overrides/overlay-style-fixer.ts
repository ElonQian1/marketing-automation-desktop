/**
 * 浮层组件样式修复器
 * 专门处理模态框、抽屉、下拉菜单等动态渲染的浮层组件
 */

export class OverlayStyleFixer {
  private observer: MutationObserver | null = null;
  private fixedOverlays = new Set<HTMLElement>();
  private isRunning = false;

  /**
   * 启动浮层样式修复器
   */
  public init(): void {
    if (this.isRunning) {
      console.log('🔄 浮层样式修复器已在运行中');
      return;
    }

    this.isRunning = true;
    this.startObserver();
    this.fixExistingOverlays();
    console.log('🎭 浮层样式修复器已启动');
  }

  /**
   * 停止浮层样式修复器
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.fixedOverlays.clear();
    this.isRunning = false;
    console.log('🛑 浮层样式修复器已停止');
  }

  /**
   * 修复现有的浮层组件
   */
  private fixExistingOverlays(): void {
    // 修复所有现有模态框
    document.querySelectorAll('.ant-modal').forEach(modal => {
      this.fixModal(modal as HTMLElement);
    });

    // 修复所有现有抽屉
    document.querySelectorAll('.ant-drawer').forEach(drawer => {
      this.fixDrawer(drawer as HTMLElement);
    });

    // 修复所有现有下拉菜单
    document.querySelectorAll('.ant-dropdown').forEach(dropdown => {
      this.fixDropdown(dropdown as HTMLElement);
    });

    // 修复所有现有通知
    document.querySelectorAll('.ant-notification, .ant-message').forEach(notification => {
      this.fixNotification(notification as HTMLElement);
    });

    console.log(`🔧 已修复 ${this.fixedOverlays.size} 个现有浮层组件`);
  }

  /**
   * 修复模态框样式
   */
  private fixModal(modal: HTMLElement): void {
    if (this.fixedOverlays.has(modal)) return;

    // 检查是否是循环步骤卡片内的模态框，如果是则跳过
    if (this.isInsideWhiteComponent(modal)) {
      return;
    }

    // 修复模态框内容
    const content = modal.querySelector('.ant-modal-content') as HTMLElement;
    if (content) {
      this.applyDarkStyles(content, {
        background: 'var(--dark-bg-secondary)',
        color: 'var(--dark-text-primary)',
        border: '1px solid var(--dark-border-primary)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)'
      });
    }

    // 修复模态框主体中的所有文本元素
    const body = modal.querySelector('.ant-modal-body') as HTMLElement;
    if (body) {
      this.fixTextElements(body);
    }

    // 修复按钮样式
    this.fixModalButtons(modal);

    this.fixedOverlays.add(modal);
  }

  /**
   * 修复抽屉样式
   */
  private fixDrawer(drawer: HTMLElement): void {
    if (this.fixedOverlays.has(drawer)) return;

    if (this.isInsideWhiteComponent(drawer)) {
      return;
    }

    const content = drawer.querySelector('.ant-drawer-content') as HTMLElement;
    if (content) {
      this.applyDarkStyles(content, {
        background: 'var(--dark-bg-secondary)',
        color: 'var(--dark-text-primary)'
      });
    }

    const body = drawer.querySelector('.ant-drawer-body') as HTMLElement;
    if (body) {
      this.fixTextElements(body);
    }

    this.fixedOverlays.add(drawer);
  }

  /**
   * 修复下拉菜单样式
   */
  private fixDropdown(dropdown: HTMLElement): void {
    if (this.fixedOverlays.has(dropdown)) return;

    if (this.isInsideWhiteComponent(dropdown)) {
      return;
    }

    const menu = dropdown.querySelector('.ant-dropdown-menu') as HTMLElement;
    if (menu) {
      this.applyDarkStyles(menu, {
        background: 'var(--dark-bg-secondary)',
        color: 'var(--dark-text-primary)',
        border: '1px solid var(--dark-border-primary)',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)'
      });
    }

    this.fixedOverlays.add(dropdown);
  }

  /**
   * 修复通知样式
   */
  private fixNotification(notification: HTMLElement): void {
    if (this.fixedOverlays.has(notification)) return;

    if (this.isInsideWhiteComponent(notification)) {
      return;
    }

    this.applyDarkStyles(notification, {
      background: 'var(--dark-bg-secondary)',
      color: 'var(--dark-text-primary)',
      border: '1px solid var(--dark-border-primary)'
    });

    this.fixTextElements(notification);
    this.fixedOverlays.add(notification);
  }

  /**
   * 修复模态框中的按钮
   */
  private fixModalButtons(modal: HTMLElement): void {
    const buttons = modal.querySelectorAll('.ant-btn');
    buttons.forEach(button => {
      const btn = button as HTMLElement;
      
      if (!btn.classList.contains('ant-btn-primary') && !btn.classList.contains('ant-btn-dangerous')) {
        this.applyDarkStyles(btn, {
          background: 'var(--dark-bg-tertiary)',
          color: 'var(--dark-text-primary)',
          borderColor: 'var(--dark-border-primary)'
        });
      }
    });
  }

  /**
   * 修复文本元素
   */
  private fixTextElements(container: HTMLElement): void {
    // 修复所有文本元素
    const textElements = container.querySelectorAll('p, div, span, li, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
      const el = element as HTMLElement;
      
      // 跳过已经有正确样式的元素
      if (el.style.color && el.style.color.includes('var(--dark-text')) {
        return;
      }

      // 检查是否有白色文本
      const computedStyle = window.getComputedStyle(el);
      const currentColor = computedStyle.color;
      
      if (currentColor === 'rgb(255, 255, 255)' || 
          currentColor === 'white' || 
          currentColor === '#fff' ||
          currentColor === '#ffffff') {
        this.applyDarkStyles(el, {
          color: 'var(--dark-text-primary)'
        });
      }
    });

    // 特别处理强调文本
    const strongElements = container.querySelectorAll('strong, b');
    strongElements.forEach(element => {
      this.applyDarkStyles(element as HTMLElement, {
        color: 'var(--dark-text-primary)'
      });
    });
  }

  /**
   * 检查元素是否在白色背景组件内
   */
  private isInsideWhiteComponent(element: HTMLElement): boolean {
    return !!element.closest('.loop-step-card, .step-card, .white-background-allowed');
  }

  /**
   * 应用暗色样式
   */
  private applyDarkStyles(element: HTMLElement, styles: Record<string, string>): void {
    Object.entries(styles).forEach(([property, value]) => {
      // 转换camelCase到kebab-case
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
              
              // 检查新增的浮层组件
              if (element.classList.contains('ant-modal')) {
                this.fixModal(element);
              } else if (element.classList.contains('ant-drawer')) {
                this.fixDrawer(element);
              } else if (element.classList.contains('ant-dropdown')) {
                this.fixDropdown(element);
              } else if (element.classList.contains('ant-notification') || 
                        element.classList.contains('ant-message')) {
                this.fixNotification(element);
              }
              
              // 检查元素内的浮层组件
              element.querySelectorAll('.ant-modal, .ant-drawer, .ant-dropdown, .ant-notification, .ant-message').forEach(overlay => {
                const overlayElement = overlay as HTMLElement;
                if (!this.fixedOverlays.has(overlayElement)) {
                  if (overlayElement.classList.contains('ant-modal')) {
                    this.fixModal(overlayElement);
                  } else if (overlayElement.classList.contains('ant-drawer')) {
                    this.fixDrawer(overlayElement);
                  } else if (overlayElement.classList.contains('ant-dropdown')) {
                    this.fixDropdown(overlayElement);
                  } else if (overlayElement.classList.contains('ant-notification') || 
                            overlayElement.classList.contains('ant-message')) {
                    this.fixNotification(overlayElement);
                  }
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
   * 获取修复统计信息
   */
  public getStats(): { fixedOverlays: number; isRunning: boolean } {
    return {
      fixedOverlays: this.fixedOverlays.size,
      isRunning: this.isRunning
    };
  }

  /**
   * 强制重新修复所有浮层
   */
  public forceRefixAll(): void {
    this.fixedOverlays.clear();
    this.fixExistingOverlays();
    console.log('🔄 已强制重新修复所有浮层组件');
  }
}

// 导出全局实例
export const overlayStyleFixer = new OverlayStyleFixer();

// 开发环境下的调试工具
if (typeof window !== 'undefined') {
  (window as any).overlayStyleFixer = overlayStyleFixer;
  (window as any).fixOverlays = () => overlayStyleFixer.forceRefixAll();
  (window as any).getOverlayStats = () => overlayStyleFixer.getStats();
}