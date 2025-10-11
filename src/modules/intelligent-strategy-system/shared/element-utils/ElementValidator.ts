// src/modules/intelligent-strategy-system/shared/element-utils/ElementValidator.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * ElementValidator.ts
 * 统一的元素验证工具
 * 
 * @description 统一项目中所有元素有效性判断逻辑，消除重复代码
 */

export interface ElementLike {
  attributes?: Record<string, string>;
  text?: string;
  tag?: string;
  bounds?: string;
  xpath?: string;
  [key: string]: any;
}

/**
 * 统一的元素验证器
 * 替换项目中分散的元素验证逻辑
 */
export class ElementValidator {

  /**
   * 检查元素是否有有效的resource-id
   */
  static hasValidResourceId(element: ElementLike): boolean {
    const resourceId = element.attributes?.['resource-id'];
    if (!resourceId || typeof resourceId !== 'string') {
      return false;
    }
    
    const trimmed = resourceId.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith('android:id/') && // 排除系统ID
           trimmed.includes(':id/'); // 必须是完整的resource-id格式
  }

  /**
   * 检查resource-id是否具有语义意义
   */
  static isMeaningfulResourceId(resourceId: string): boolean {
    if (!resourceId) return false;
    
    const meaningfulPatterns = [
      /button/i, /btn/i, /text/i, /title/i, /label/i,
      /input/i, /edit/i, /search/i, /submit/i, /confirm/i,
      /cancel/i, /save/i, /delete/i, /add/i, /login/i,
      /follow/i, /like/i, /share/i, /comment/i
    ];
    
    return meaningfulPatterns.some(pattern => pattern.test(resourceId));
  }

  /**
   * 检查元素是否有有意义的文本
   */
  static hasMeaningfulText(element: ElementLike): boolean {
    const text = element.text;
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    
    // 排除纯数字、单字符、纯空格
    if (/^\d+$/.test(trimmed)) return false;
    if (trimmed.length === 1) return false;
    
    // 至少包含一个字母或中文字符
    return /[a-zA-Z\u4e00-\u9fff]/.test(trimmed);
  }

  /**
   * 检查元素是否有有效的content-desc
   */
  static hasValidContentDesc(element: ElementLike): boolean {
    const contentDesc = element.attributes?.['content-desc'];
    if (!contentDesc || typeof contentDesc !== 'string') {
      return false;
    }
    
    const trimmed = contentDesc.trim();
    return trimmed.length > 0;
  }

  /**
   * 检查元素是否可点击
   */
  static isClickable(element: ElementLike): boolean {
    const clickable = element.attributes?.['clickable'];
    return clickable === 'true';
  }

  /**
   * 检查元素是否为特定的控件类型
   */
  static isSpecificControlType(className: string): boolean {
    if (!className) return false;
    
    const specificTypes = [
      'Button', 'TextView', 'EditText', 'ImageButton', 'ImageView',
      'CheckBox', 'RadioButton', 'Switch', 'ToggleButton',
      'Spinner', 'SeekBar', 'ProgressBar'
    ];
    
    return specificTypes.some(type => className.includes(type));
  }

  /**
   * 检查元素是否为容器类型
   */
  static isContainer(element: ElementLike): boolean {
    const className = element.tag || element.attributes?.['class'] || '';
    
    const containerTypes = [
      'LinearLayout', 'RelativeLayout', 'FrameLayout', 'ConstraintLayout',
      'ScrollView', 'RecyclerView', 'ListView', 'GridView',
      'ViewGroup', 'ViewPager', 'TabLayout'
    ];
    
    return containerTypes.some(type => className.includes(type));
  }

  /**
   * 获取元素的最佳标识符
   * 优先级：resource-id > content-desc > text > class
   */
  static getElementIdentifier(element: ElementLike): string {
    if (this.hasValidResourceId(element)) {
      return element.attributes!['resource-id'];
    }
    
    if (this.hasValidContentDesc(element)) {
      return element.attributes!['content-desc'];
    }
    
    if (this.hasMeaningfulText(element)) {
      return element.text!;
    }
    
    return element.tag || element.attributes?.['class'] || 'unknown';
  }

  /**
   * 计算元素的质量评分
   * 用于排序和选择最佳元素
   */
  static calculateElementScore(element: ElementLike): number {
    let score = 0;
    
    // Resource ID 评分
    if (this.hasValidResourceId(element)) {
      const resourceId = element.attributes!['resource-id'];
      if (this.isMeaningfulResourceId(resourceId)) {
        score += 40;
      } else {
        score += 20;
      }
    }
    
    // 文本评分
    if (this.hasMeaningfulText(element)) {
      score += 25;
    }
    
    // Content-desc 评分
    if (this.hasValidContentDesc(element)) {
      score += 20;
    }
    
    // 可点击评分
    if (this.isClickable(element)) {
      score += 15;
    }
    
    // 特定控件类型评分
    if (this.isSpecificControlType(element.tag || '')) {
      score += 10;
    }
    
    return score;
  }

  /**
   * 检查元素是否具有唯一标识能力
   */
  static hasUniqueIdentity(element: ElementLike): boolean {
    return this.hasValidResourceId(element) || 
           this.hasMeaningfulText(element) || 
           this.hasValidContentDesc(element);
  }

  /**
   * 批量验证元素数组
   */
  static filterValidElements(elements: ElementLike[]): ElementLike[] {
    return elements.filter(element => 
      this.hasUniqueIdentity(element) && 
      element.bounds && 
      element.xpath
    );
  }
}