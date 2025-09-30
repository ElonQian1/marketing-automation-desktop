/**
 * 菜单交互修复器 - 性能优化版本
 * 专门修复用户反馈的菜单交互问题：
 * 1. 鼠标悬停时背景过亮
 * 2. 点击松开时的红色闪烁
 * 
 * 优化措施：
 * - 大幅降低检查频率（15秒）
 * - 改善缓存机制，避免重复处理
 * - 开发环境下默认禁用
 * - 添加处理状态锁，防止并发问题
 */

interface MenuInteractionFixerConfig {
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 检查间隔（毫秒） - 默认大幅增加避免卡顿 */
  checkInterval?: number;
  /** 是否启用修复器 - 开发环境下默认关闭 */
  enabled?: boolean;
}

export class MenuInteractionFixer {
  private config: Required<MenuInteractionFixerConfig>;
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private fixedMenus = new Set<HTMLElement>();
  private isProcessing = false;

  constructor(config: MenuInteractionFixerConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      checkInterval: config.checkInterval ?? 15000, // 增加到15秒，减少卡顿
      enabled: config.enabled ?? (process.env.NODE_ENV !== 'development') // 开发环境默认关闭
    };
  }

  /**
   * 启动菜单交互修复器
   */
  start(): void {
    if (!this.config.enabled) {
      this.log('🚫 菜单交互修复器已禁用，跳过启动');
      return;
    }

    this.log('🎯 启动菜单交互修复器...');
    
    // 立即修复现有菜单
    this.fixAllMenus();
    
    // 启动DOM观察器
    this.startObserver();
    
    // 启动定期检查（频率大幅降低）
    this.startIntervalCheck();
    
    this.bindEventHandlers();
    
    this.log('✅ 菜单交互修复器启动完成');
  }

  /**
   * 停止菜单交互修复器
   */
  stop(): void {
    this.log('🛑 停止菜单交互修复器...');
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.unbindEventHandlers();
    this.fixedMenus.clear();
    
    this.log('✅ 菜单交互修复器已停止');
  }

  /**
   * 手动触发修复（性能优化版本）
   */
  triggerFix(): void {
    if (this.isProcessing) {
      this.log('⏳ 正在处理中，跳过重复修复');
      return;
    }
    
    this.fixAllMenus();
  }

  /**
   * 切换启用状态
   */
  toggleEnabled(): void {
    this.config.enabled = !this.config.enabled;
    this.log(`🔄 菜单交互修复器 ${this.config.enabled ? '启用' : '禁用'}`);
    
    if (this.config.enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  private startObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      // 性能优化：批量处理变更，避免频繁触发
      let hasMenuChanges = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          if (addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            ((node as Element).matches('.ant-menu') || (node as Element).querySelector('.ant-menu'))
          )) {
            hasMenuChanges = true;
            break;
          }
        }
      }
      
      if (hasMenuChanges && !this.isProcessing) {
        // 防抖：延迟执行避免频繁调用
        setTimeout(() => this.fixAllMenus(), 200);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private startIntervalCheck(): void {
    this.intervalId = window.setInterval(() => {
      if (!this.isProcessing) {
        this.fixAllMenus();
      }
    }, this.config.checkInterval);
  }

  private fixAllMenus(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // 性能优化：减少DOM查询频率
      const menus = document.querySelectorAll('.ant-menu');
      this.log(`🔍 发现 ${menus.length} 个菜单需要检查`);
      
      let fixedCount = 0;
      menus.forEach(menu => {
        const htmlMenu = menu as HTMLElement;
        
        // 缓存优化：避免重复处理
        if (!this.fixedMenus.has(htmlMenu)) {
          this.fixMenu(htmlMenu);
          this.fixedMenus.add(htmlMenu);
          fixedCount++;
        }
      });
      
      if (fixedCount > 0) {
        this.log(`✅ 本次修复了 ${fixedCount} 个新菜单`);
      }
    } catch (error) {
      this.log('❌ 修复菜单时出错:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private fixMenu(menu: HTMLElement): void {
    try {
      // 检查是否已经修复过
      if (menu.dataset.menuInteractionFixed === 'true') {
        return;
      }
      
      const menuItems = menu.querySelectorAll('.ant-menu-item, .ant-menu-submenu');
      
      menuItems.forEach(item => {
        const htmlItem = item as HTMLElement;
        this.fixMenuItem(htmlItem);
      });
      
      // 标记为已修复
      menu.dataset.menuInteractionFixed = 'true';
      
      this.log(`🔧 已修复菜单: ${this.getMenuIdentifier(menu)}`);
    } catch (error) {
      this.log('❌ 修复菜单项时出错:', error);
    }
  }

  private fixMenuItem(item: HTMLElement): void {
    // 防止重复绑定
    if (item.dataset.menuItemFixed === 'true') {
      return;
    }
    
    // 移除可能存在的旧事件监听器
    this.removeExistingListeners(item);
    
    // 修复悬停效果
    item.addEventListener('mouseenter', this.handleMouseEnter.bind(this), { passive: true });
    item.addEventListener('mouseleave', this.handleMouseLeave.bind(this), { passive: true });
    
    // 修复点击效果
    item.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: true });
    item.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: true });
    
    // 标记为已修复
    item.dataset.menuItemFixed = 'true';
  }

  private removeExistingListeners(item: HTMLElement): void {
    // 克隆节点来移除所有事件监听器（性能优化的方式）
    // 但这里我们采用更安全的方式，只移除特定的监听器
    const events = ['mouseenter', 'mouseleave', 'mousedown', 'mouseup'];
    events.forEach(eventType => {
      try {
        item.removeEventListener(eventType, this.handleMouseEnter);
        item.removeEventListener(eventType, this.handleMouseLeave);
        item.removeEventListener(eventType, this.handleMouseDown);
        item.removeEventListener(eventType, this.handleMouseUp);
      } catch (e) {
        // 忽略移除失败的情况
      }
    });
  }

  private handleMouseEnter = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // 修复过亮的悬停背景
    target.style.setProperty('background-color', 'rgba(0, 0, 0, 0.06)', 'important');
    target.style.setProperty('background', 'rgba(0, 0, 0, 0.06)', 'important');
    
    this.log(`🖱️ 鼠标进入: ${this.getItemIdentifier(target)}`);
  };

  private handleMouseLeave = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // 移除悬停样式
    target.style.removeProperty('background-color');
    target.style.removeProperty('background');
    
    this.log(`🖱️ 鼠标离开: ${this.getItemIdentifier(target)}`);
  };

  private handleMouseDown = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // 修复点击时的背景色
    target.style.setProperty('background-color', 'rgba(0, 0, 0, 0.1)', 'important');
    target.style.setProperty('background', 'rgba(0, 0, 0, 0.1)', 'important');
    
    this.log(`👆 鼠标按下: ${this.getItemIdentifier(target)}`);
  };

  private handleMouseUp = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // 恢复悬停状态的背景色
    target.style.setProperty('background-color', 'rgba(0, 0, 0, 0.06)', 'important');
    target.style.setProperty('background', 'rgba(0, 0, 0, 0.06)', 'important');
    
    this.log(`👆 鼠标释放: ${this.getItemIdentifier(target)}`);
  };

  private bindEventHandlers(): void {
    // 全局点击处理 - 性能优化：使用事件委托
    document.addEventListener('click', this.handleGlobalClick.bind(this), { passive: true });
  }

  private unbindEventHandlers(): void {
    document.removeEventListener('click', this.handleGlobalClick);
  }

  private handleGlobalClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // 只处理菜单项的点击
    if (target.closest('.ant-menu-item, .ant-menu-submenu')) {
      // 重置所有菜单项的活动状态
      setTimeout(() => {
        const activeItems = document.querySelectorAll('.ant-menu-item, .ant-menu-submenu');
        activeItems.forEach(item => {
          const htmlItem = item as HTMLElement;
          htmlItem.style.removeProperty('background-color');
          htmlItem.style.removeProperty('background');
        });
      }, 100);
    }
  };

  private getMenuIdentifier(menu: HTMLElement): string {
    return menu.className || menu.id || '未命名菜单';
  }

  private getItemIdentifier(item: HTMLElement): string {
    const text = item.textContent?.trim() || '';
    const className = item.className || '';
    return `${text} (${className})`;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[MenuInteractionFixer]', ...args);
    }
  }
}