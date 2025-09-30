/**
 * 菜单交互行为修复器
 * 专门修复用户反馈的菜单交互问题：
 * 1. 鼠标悬停时背景过亮
 * 2. 点击松开时的红色闪烁
 */

interface MenuInteractionFixerConfig {
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 检测间隔（毫秒） */
  checkInterval?: number;
}

export class MenuInteractionFixer {
  private config: Required<MenuInteractionFixerConfig>;
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private fixedMenus = new Set<HTMLElement>();

  constructor(config: MenuInteractionFixerConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      checkInterval: config.checkInterval ?? 1000
    };
  }

  /**
   * 启动菜单交互修复器
   */
  start(): void {
    this.log('🎯 启动菜单交互修复器...');
    
    // 立即修复现有菜单
    this.fixAllMenus();
    
    // 启动DOM观察器
    this.startObserver();
    
    // 启动定期检查
    this.startIntervalCheck();
    
    this.bindEventHandlers();
    this.bindConsoleHelpers();
    
    this.log('✅ 菜单交互修复器已启动');
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
    
    this.log('🛑 菜单交互修复器已停止');
  }

  /**
   * 修复所有菜单
   */
  fixAllMenus(): number {
    const menus = document.querySelectorAll('.ant-menu') as NodeListOf<HTMLElement>;
    let fixedCount = 0;
    
    menus.forEach(menu => {
      if (!this.fixedMenus.has(menu)) {
        this.fixMenu(menu);
        this.fixedMenus.add(menu);
        fixedCount++;
      }
    });
    
    this.log(`🔧 修复了 ${fixedCount} 个菜单组件`);
    return fixedCount;
  }

  /**
   * 修复单个菜单
   */
  private fixMenu(menu: HTMLElement): void {
    // 修复菜单容器
    this.applyMenuContainerFix(menu);
    
    // 修复所有菜单项
    const menuItems = menu.querySelectorAll('.ant-menu-item') as NodeListOf<HTMLElement>;
    menuItems.forEach(item => this.fixMenuItem(item));
    
    this.log(`✨ 修复菜单: ${this.getElementDescription(menu)}`);
  }

  /**
   * 修复菜单容器
   */
  private applyMenuContainerFix(menu: HTMLElement): void {
    // 应用暗色主题
    menu.style.setProperty('background', 'var(--dark-bg-elevated)', 'important');
    menu.style.setProperty('border-color', 'var(--dark-border-primary)', 'important');
    menu.style.setProperty('color', 'var(--dark-text-primary)', 'important');
    
    // 移除可能的阴影效果
    menu.style.setProperty('box-shadow', 'none', 'important');
  }

  /**
   * 修复菜单项
   */
  private fixMenuItem(item: HTMLElement): void {
    // 基础样式
    item.style.setProperty('background', 'transparent', 'important');
    item.style.setProperty('color', 'var(--dark-text-secondary)', 'important');
    item.style.setProperty('transition', 'background-color 0.2s ease, color 0.2s ease', 'important');
    
    // 移除边框和轮廓
    item.style.setProperty('border', 'none', 'important');
    item.style.setProperty('outline', 'none', 'important');
    item.style.setProperty('box-shadow', 'none', 'important');
    
    // 绑定事件处理器
    this.bindMenuItemEvents(item);
  }

  /**
   * 绑定菜单项事件
   */
  private bindMenuItemEvents(item: HTMLElement): void {
    // 移除现有的事件监听器（如果有的话）
    item.removeEventListener('mouseenter', this.handleMouseEnter);
    item.removeEventListener('mouseleave', this.handleMouseLeave);
    item.removeEventListener('mousedown', this.handleMouseDown);
    item.removeEventListener('mouseup', this.handleMouseUp);
    item.removeEventListener('click', this.handleClick);
    
    // 添加新的事件监听器
    item.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    item.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    item.addEventListener('mousedown', this.handleMouseDown.bind(this));
    item.addEventListener('mouseup', this.handleMouseUp.bind(this));
    item.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * 鼠标进入事件 - 优雅的悬停效果
   */
  private handleMouseEnter(event: Event): void {
    const item = event.target as HTMLElement;
    if (!item.classList.contains('ant-menu-item-selected')) {
      item.style.setProperty('background', 'var(--dark-bg-hover)', 'important');
      item.style.setProperty('color', 'var(--dark-text-primary)', 'important');
    }
  }

  /**
   * 鼠标离开事件 - 恢复默认样式
   */
  private handleMouseLeave(event: Event): void {
    const item = event.target as HTMLElement;
    if (!item.classList.contains('ant-menu-item-selected')) {
      item.style.removeProperty('background');
      item.style.removeProperty('color');
    }
  }

  /**
   * 鼠标按下事件 - 防止红色闪烁
   */
  private handleMouseDown(event: Event): void {
    const item = event.target as HTMLElement;
    item.style.setProperty('background', 'var(--dark-bg-hover)', 'important');
    item.style.setProperty('color', 'var(--dark-text-primary)', 'important');
    item.style.setProperty('box-shadow', 'none', 'important');
    item.style.setProperty('border-color', 'transparent', 'important');
  }

  /**
   * 鼠标松开事件 - 移除激活状态
   */
  private handleMouseUp(event: Event): void {
    const item = event.target as HTMLElement;
    // 延迟一下确保移除所有可能的红色效果
    setTimeout(() => {
      if (!item.classList.contains('ant-menu-item-selected')) {
        item.style.setProperty('background', 'var(--dark-bg-hover)', 'important');
        item.style.setProperty('color', 'var(--dark-text-primary)', 'important');
      }
      item.style.setProperty('box-shadow', 'none', 'important');
      item.style.setProperty('border-color', 'transparent', 'important');
    }, 10);
  }

  /**
   * 点击事件 - 确保正确的选中状态
   */
  private handleClick(event: Event): void {
    const item = event.target as HTMLElement;
    
    // 移除其他选中项的内联样式，让CSS接管
    const allItems = document.querySelectorAll('.ant-menu-item');
    allItems.forEach(otherItem => {
      if (otherItem !== item) {
        const element = otherItem as HTMLElement;
        // 清除内联样式，让CSS规则生效
        element.style.removeProperty('background');
        element.style.removeProperty('background-color');
        element.style.removeProperty('color');
        element.style.removeProperty('border-left');
      }
    });
    
    // 延迟确保选中状态正确应用
    setTimeout(() => {
      // 清除当前项的内联样式，让CSS选择器生效
      item.style.removeProperty('background');
      item.style.removeProperty('background-color');
      item.style.removeProperty('color');
      item.style.removeProperty('border-left');
      
      // 确保移除任何可能的红色效果
      item.style.setProperty('box-shadow', 'none', 'important');
      item.style.setProperty('border-color', 'transparent', 'important');
    }, 50);
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
              // 检查新添加的菜单
              if (element.classList.contains('ant-menu')) {
                this.fixMenu(element);
                this.fixedMenus.add(element);
              }
              // 检查新添加的菜单项
              if (element.classList.contains('ant-menu-item')) {
                this.fixMenuItem(element);
              }
              // 检查元素内的菜单
              element.querySelectorAll('.ant-menu').forEach(menu => {
                if (!this.fixedMenus.has(menu as HTMLElement)) {
                  this.fixMenu(menu as HTMLElement);
                  this.fixedMenus.add(menu as HTMLElement);
                }
              });
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 启动定期检查
   */
  private startIntervalCheck(): void {
    this.intervalId = window.setInterval(() => {
      this.fixAllMenus();
    }, this.config.checkInterval);
  }

  /**
   * 绑定全局事件处理器
   */
  private bindEventHandlers(): void {
    // 全局处理所有菜单项，确保没有红色效果
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const menuItem = target.closest('.ant-menu-item');
      if (menuItem) {
        // 立即移除红色效果
        setTimeout(() => {
          (menuItem as HTMLElement).style.setProperty('box-shadow', 'none', 'important');
          (menuItem as HTMLElement).style.setProperty('border-color', 'transparent', 'important');
        }, 0);
      }
    });

    // 处理悬停事件，确保没有异常的红色效果
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const menuItem = target.closest('.ant-menu-item');
      if (menuItem) {
        (menuItem as HTMLElement).style.setProperty('box-shadow', 'none', 'important');
      }
    });
  }

  /**
   * 绑定控制台辅助方法
   */
  private bindConsoleHelpers(): void {
    (window as any).menuInteractionFixer = this;
    (window as any).fixMenus = () => this.fixAllMenus();
    (window as any).getMenuStats = () => ({
      fixedMenus: this.fixedMenus.size,
      isRunning: this.observer !== null
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
   * 输出日志
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[MenuInteractionFixer] ${message}`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      fixedMenus: this.fixedMenus.size,
      isRunning: this.observer !== null,
      config: this.config
    };
  }
}

// 自动启动修复器
const autoMenuFixer = new MenuInteractionFixer({
  debug: true
});

// 页面加载后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => autoMenuFixer.start(), 200);
  });
} else {
  setTimeout(() => autoMenuFixer.start(), 200);
}

export default autoMenuFixer;