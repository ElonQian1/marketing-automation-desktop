/**
 * 循环卡片精确选择器策略
 * 用于准确识别循环步骤卡片，避免误伤其他组件
 */

export interface LoopCardSelector {
  /** 选择器字符串 */
  selector: string;
  /** 选择器描述 */
  description: string;
  /** 是否需要额外验证 */
  needsValidation: boolean;
  /** 验证函数 */
  validate?: (element: HTMLElement) => boolean;
}

/**
 * 精确的循环卡片选择器配置
 */
export const PRECISE_LOOP_CARD_SELECTORS: LoopCardSelector[] = [
  {
    selector: '[data-loop-step="true"]',
    description: '明确标记的循环步骤',
    needsValidation: false
  },
  {
    selector: '[data-loop-badge]',
    description: '带循环标记的元素',
    needsValidation: true,
    validate: (el) => {
      // 确保不是ADB检查器或其他工具的元素
      return !el.closest('[data-adb-inspector]') && 
             !el.closest('[data-xml-viewer]') &&
             !el.closest('._root_1melx_11');
    }
  },
  {
    selector: '.loop-step-card[data-step-type="loop"]',
    description: '明确的循环步骤卡片',
    needsValidation: false
  },
  {
    selector: '.white-background-allowed[data-component="loop-step"]',
    description: '明确指定的循环组件',
    needsValidation: false
  },
  {
    selector: '.step-card[data-loop="true"]',
    description: '标记为循环的步骤卡片',
    needsValidation: false
  }
];

/**
 * 需要排除的选择器（避免误伤）
 */
export const EXCLUDED_SELECTORS = [
  // ADB检查器相关
  '[data-adb-inspector]',
  '[data-adb-inspector] *',
  '._root_1melx_11',
  '._root_1melx_11 *',
  '._card_1melx_151',
  '._card_1melx_151 *',
  
  // XML查看器
  '[data-xml-viewer]',
  '[data-xml-viewer] *',
  
  // 通用工具面板
  '[data-tool-panel]',
  '[data-tool-panel] *',
  
  // 模态框和对话框
  '.ant-modal',
  '.ant-modal *',
  '.ant-drawer',
  '.ant-drawer *',
  
  // 导航和菜单
  '.ant-menu',
  '.ant-menu *',
  '.ant-layout-sider',
  '.ant-layout-sider *',
  
  // 表格组件
  '.ant-table',
  '.ant-table *',
  
  // 其他明确的暗色主题组件
  '[data-theme="dark"]',
  '[data-theme="dark"] *',
  '.dark-theme-only',
  '.dark-theme-only *'
];

/**
 * 循环卡片选择器验证器
 */
export class LoopCardSelectorValidator {
  /**
   * 检查元素是否是真正的循环卡片
   */
  static isValidLoopCard(element: HTMLElement): boolean {
    // 1. 检查是否被排除
    if (this.isExcludedElement(element)) {
      return false;
    }

    // 2. 检查是否匹配精确选择器
    for (const selectorConfig of PRECISE_LOOP_CARD_SELECTORS) {
      if (element.matches(selectorConfig.selector)) {
        // 如果需要额外验证
        if (selectorConfig.needsValidation && selectorConfig.validate) {
          return selectorConfig.validate(element);
        }
        return true;
      }
    }

    // 3. 特殊情况：检查是否在循环容器内
    return this.isInsideLoopContainer(element);
  }

  /**
   * 检查元素是否被排除
   */
  static isExcludedElement(element: HTMLElement): boolean {
    return EXCLUDED_SELECTORS.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector.replace(' *', ''));
      } catch {
        return false;
      }
    });
  }

  /**
   * 检查元素是否在循环容器内
   */
  static isInsideLoopContainer(element: HTMLElement): boolean {
    // 查找最近的明确循环容器
    const loopContainer = element.closest('[data-loop-container="true"], [data-step-container="loop"]');
    
    if (!loopContainer) {
      return false;
    }

    // 确保不是被排除的容器
    return !this.isExcludedElement(loopContainer as HTMLElement);
  }

  /**
   * 获取所有有效的循环卡片
   */
  static getAllValidLoopCards(): HTMLElement[] {
    const allElements: HTMLElement[] = [];

    // 使用精确选择器查找
    for (const selectorConfig of PRECISE_LOOP_CARD_SELECTORS) {
      const elements = document.querySelectorAll(selectorConfig.selector);
      elements.forEach(el => {
        const element = el as HTMLElement;
        if (this.isValidLoopCard(element)) {
          allElements.push(element);
        }
      });
    }

    // 去重
    return Array.from(new Set(allElements));
  }

  /**
   * 检查元素是否应该应用白色主题
   */
  static shouldApplyWhiteTheme(element: HTMLElement): boolean {
    // 必须是有效的循环卡片
    if (!this.isValidLoopCard(element)) {
      return false;
    }

    // 不能是已经排除的元素
    if (this.isExcludedElement(element)) {
      return false;
    }

    // 不能在排除的容器内
    for (const excludeSelector of EXCLUDED_SELECTORS) {
      if (excludeSelector.includes(' *')) continue;
      const excludeContainer = element.closest(excludeSelector);
      if (excludeContainer) {
        return false;
      }
    }

    return true;
  }

  /**
   * 为元素添加循环卡片标记
   */
  static markAsLoopCard(element: HTMLElement): void {
    if (this.shouldApplyWhiteTheme(element)) {
      element.setAttribute('data-loop-step', 'true');
      element.setAttribute('data-white-theme-applied', 'true');
    }
  }

  /**
   * 移除循环卡片标记
   */
  static unmarkLoopCard(element: HTMLElement): void {
    element.removeAttribute('data-loop-step');
    element.removeAttribute('data-white-theme-applied');
  }
}

/**
 * 调试工具
 */
export class LoopCardSelectorDebugger {
  /**
   * 高亮显示所有检测到的循环卡片
   */
  static highlightLoopCards(): void {
    const loopCards = LoopCardSelectorValidator.getAllValidLoopCards();
    
    loopCards.forEach((card, index) => {
      card.style.outline = '2px solid #ff4d4f';
      card.style.outlineOffset = '2px';
      
      // 添加标签
      const label = document.createElement('div');
      label.textContent = `Loop Card ${index + 1}`;
      label.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        background: #ff4d4f;
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        z-index: 9999;
        pointer-events: none;
      `;
      card.style.position = 'relative';
      card.appendChild(label);
    });

    console.log(`🔍 高亮了 ${loopCards.length} 个循环卡片`);
  }

  /**
   * 移除高亮
   */
  static removeHighlight(): void {
    document.querySelectorAll('[data-white-theme-applied="true"]').forEach(card => {
      (card as HTMLElement).style.outline = '';
      (card as HTMLElement).style.outlineOffset = '';
      
      // 移除标签
      const labels = card.querySelectorAll('div');
      labels.forEach(label => {
        if (label.textContent?.startsWith('Loop Card')) {
          label.remove();
        }
      });
    });
  }

  /**
   * 分析选择器覆盖范围
   */
  static analyzeSelectors(): void {
    console.log('🔍 循环卡片选择器分析:');
    
    PRECISE_LOOP_CARD_SELECTORS.forEach((selectorConfig, index) => {
      const elements = document.querySelectorAll(selectorConfig.selector);
      const validElements = Array.from(elements).filter(el => 
        LoopCardSelectorValidator.isValidLoopCard(el as HTMLElement)
      );
      
      console.log(`${index + 1}. ${selectorConfig.description}`);
      console.log(`   选择器: ${selectorConfig.selector}`);
      console.log(`   匹配: ${elements.length} 个元素`);
      console.log(`   有效: ${validElements.length} 个元素`);
    });

    const excludedElements = document.querySelectorAll(EXCLUDED_SELECTORS.join(', '));
    console.log(`📋 排除的元素: ${excludedElements.length} 个`);
  }
}

// 开发环境调试工具
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).LoopCardSelectorValidator = LoopCardSelectorValidator;
  (window as any).LoopCardSelectorDebugger = LoopCardSelectorDebugger;
  (window as any).highlightLoopCards = () => LoopCardSelectorDebugger.highlightLoopCards();
  (window as any).analyzeLoopSelectors = () => LoopCardSelectorDebugger.analyzeSelectors();
}