/**
 * 全局样式自动修复工具
 * 运行时检测和修复白底样式问题
 */

class GlobalStyleFixer {
  private observer: MutationObserver | null = null;
  private isEnabled = false;
  private debugMode = false;

  // 需要修复的样式模式
  private readonly problematicStyles = [
    'background: rgb(250, 250, 250)',
    'background: rgb(255, 255, 255)',
    'background-color: rgb(250, 250, 250)',
    'background-color: rgb(255, 255, 255)',
    'background: white',
    'background-color: white',
    'background: #fff',
    'background-color: #fff',
    'background: #fafafa',
    'background-color: #fafafa'
  ];

  // 循环步骤卡片的选择器（需要保持白色）
  private readonly whiteAllowedSelectors = [
    '.loop-step-card',
    '.step-card',
    '.white-background-allowed',
    '[data-step-type="loop"]',
    '.draggable-step-card[data-loop="true"]'
  ];

  constructor() {
    this.init();
  }

  private init() {
    // 监听DOM变化
    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.fixElement(node as Element);
            this.fixDescendants(node as Element);
          }
        });

        // 监听属性变化（style属性）
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this.fixElement(mutation.target as Element);
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    console.log('🔧 全局样式修复工具已初始化');
  }

  // 启用自动修复
  enable() {
    this.isEnabled = true;
    console.log('✅ 全局样式自动修复已启用');
    this.fixAllExistingElements();
  }

  // 禁用自动修复
  disable() {
    this.isEnabled = false;
    console.log('⏸️ 全局样式自动修复已禁用');
  }

  // 启用调试模式
  enableDebug() {
    this.debugMode = true;
    document.documentElement.setAttribute('data-debug', 'true');
    console.log('🐛 调试模式已启用 - 问题元素将被高亮显示');
  }

  // 禁用调试模式
  disableDebug() {
    this.debugMode = false;
    document.documentElement.removeAttribute('data-debug');
    console.log('🔍 调试模式已禁用');
  }

  // 检查元素是否应该保持白色背景
  private isWhiteAllowed(element: Element): boolean {
    return this.whiteAllowedSelectors.some(selector => {
      return element.matches(selector) || element.closest(selector);
    });
  }

  // 修复单个元素
  private fixElement(element: Element) {
    if (!(element instanceof HTMLElement)) return;
    if (this.isWhiteAllowed(element)) return;

    const style = element.getAttribute('style');
    if (!style) return;

    let needsFix = false;
    let newStyle = style;

    // 检查是否包含需要修复的样式
    this.problematicStyles.forEach(problematicStyle => {
      if (style.includes(problematicStyle)) {
        needsFix = true;
        
        if (this.debugMode) {
          console.warn(`🔥 发现问题样式: ${element.tagName}.${element.className}`, {
            problematicStyle,
            element
          });
        }

        // 移除或替换问题样式
        newStyle = newStyle.replace(new RegExp(problematicStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
      }
    });

    if (needsFix) {
      // 清理多余的分号和空格
      newStyle = newStyle
        .replace(/;\s*;/g, ';')
        .replace(/^;|;$/g, '')
        .trim();

      element.setAttribute('style', newStyle);

      // 添加暗色主题类
      if (!element.classList.contains('dark-theme-fixed')) {
        element.classList.add('dark-theme-fixed');
      }

      if (this.debugMode) {
        console.log(`✅ 已修复元素样式: ${element.tagName}.${element.className}`);
      }
    }
  }

  // 修复元素及其所有后代
  private fixDescendants(parent: Element) {
    const descendants = parent.querySelectorAll('*');
    descendants.forEach(element => this.fixElement(element));
  }

  // 修复所有现有元素
  private fixAllExistingElements() {
    console.log('🔄 开始修复所有现有元素...');
    
    const allElements = document.querySelectorAll('*');
    let fixedCount = 0;

    allElements.forEach(element => {
      if (this.isWhiteAllowed(element)) return;
      
      const beforeStyle = element.getAttribute('style');
      this.fixElement(element);
      const afterStyle = element.getAttribute('style');
      
      if (beforeStyle !== afterStyle) {
        fixedCount++;
      }
    });

    console.log(`✅ 修复完成！共修复 ${fixedCount} 个元素`);
  }

  // 手动扫描并修复
  scanAndFix() {
    console.log('🔍 手动扫描和修复...');
    this.fixAllExistingElements();
  }

  // 获取统计信息
  getStats() {
    const allElements = document.querySelectorAll('*');
    let problematicCount = 0;
    let whiteAllowedCount = 0;

    allElements.forEach(element => {
      if (this.isWhiteAllowed(element)) {
        whiteAllowedCount++;
        return;
      }

      const style = element.getAttribute('style');
      if (style && this.problematicStyles.some(ps => style.includes(ps))) {
        problematicCount++;
      }
    });

    return {
      totalElements: allElements.length,
      problematicElements: problematicCount,
      whiteAllowedElements: whiteAllowedCount,
      isEnabled: this.isEnabled,
      debugMode: this.debugMode
    };
  }

  // 销毁
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isEnabled = false;
    console.log('🗑️ 全局样式修复工具已销毁');
  }
}

// 创建全局实例
const globalStyleFixer = new GlobalStyleFixer();

// 导出到全局作用域
if (typeof window !== 'undefined') {
  (window as any).globalStyleFixer = globalStyleFixer;
  
  // 便捷方法
  (window as any).fixStyles = () => globalStyleFixer.scanAndFix();
  (window as any).enableStyleFixer = () => globalStyleFixer.enable();
  (window as any).disableStyleFixer = () => globalStyleFixer.disable();
  (window as any).debugStyles = () => globalStyleFixer.enableDebug();
  (window as any).styleStats = () => globalStyleFixer.getStats();

  console.log('🛠️ 全局样式修复工具已加载！');
  console.log('使用方法:');
  console.log('  enableStyleFixer() - 启用自动修复');
  console.log('  fixStyles() - 手动修复所有元素');
  console.log('  debugStyles() - 启用调试模式');
  console.log('  styleStats() - 查看统计信息');
}

export default GlobalStyleFixer;