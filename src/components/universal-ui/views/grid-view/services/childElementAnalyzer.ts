/**
 * 子元素分析服务
 * 用于分析XML节点的可操作子元素，提供智能推荐
 */

import { UiNode } from '../types';

/**
 * 可操作元素类型
 */
export type ActionableElementType = 
  | 'button'           // 按钮
  | 'text_button'      // 文本按钮
  | 'input'            // 输入框
  | 'checkbox'         // 复选框
  | 'switch'           // 开关
  | 'clickable_text'   // 可点击文本
  | 'image_button'     // 图片按钮
  | 'list_item'        // 列表项
  | 'tab'              // 标签页
  | 'link'             // 链接
  | 'other_clickable'; // 其他可点击元素

/**
 * 可操作子元素信息
 */
export interface ActionableChildElement {
  node: UiNode;
  type: ActionableElementType;
  confidence: number; // 0-1，推荐置信度
  actionText: string; // 动作描述，如"点击关注按钮"
  key: string;        // 唯一标识
  priority: number;   // 显示优先级，数值越大优先级越高
}

/**
 * 分析结果
 */
export interface ChildElementAnalysis {
  parent: UiNode;
  children: ActionableChildElement[];
  recommendation: ActionableChildElement | null; // 最推荐的元素
  totalCount: number;
}

/**
 * 关键词匹配权重配置
 */
const ACTION_KEYWORDS = {
  // 高优先级动作词
  high: ['关注', '取关', '点赞', '收藏', '分享', '评论', '发送', '确定', '保存', '提交', '登录', '注册'],
  // 中优先级动作词
  medium: ['查看', '展开', '收起', '更多', '详情', '进入', '打开', '关闭', '返回', '刷新'],
  // 低优先级动作词
  low: ['了解', '知道了', '好的', '取消', '跳过', '暂不', '稍后']
};

/**
 * 元素类型检测器
 */
class ElementTypeDetector {
  /**
   * 检测元素类型
   */
  detectType(node: UiNode): ActionableElementType {
    const attrs = node.attrs;
    const className = attrs['class'] || '';
    const resourceId = attrs['resource-id'] || '';
    const text = attrs['text'] || '';
    const contentDesc = attrs['content-desc'] || '';
    
    // Button 类型检测
    if (className.includes('Button') || resourceId.includes('button') || resourceId.includes('btn')) {
      if (text || contentDesc) {
        return 'text_button';
      }
      return 'button';
    }
    
    // Input 类型检测
    if (className.includes('EditText') || className.includes('Input') || 
        resourceId.includes('edit') || resourceId.includes('input')) {
      return 'input';
    }
    
    // Checkbox/Switch 检测
    if (className.includes('CheckBox') || resourceId.includes('checkbox')) {
      return 'checkbox';
    }
    if (className.includes('Switch') || resourceId.includes('switch')) {
      return 'switch';
    }
    
    // Image Button 检测
    if (className.includes('ImageButton') || className.includes('ImageView')) {
      if (attrs['clickable'] === 'true') {
        return 'image_button';
      }
    }
    
    // List Item 检测
    if (className.includes('ListView') || className.includes('RecyclerView') || 
        resourceId.includes('list') || resourceId.includes('item')) {
      return 'list_item';
    }
    
    // Tab 检测
    if (className.includes('Tab') || resourceId.includes('tab')) {
      return 'tab';
    }
    
    // Link 检测 (通常是TextView但有特殊样式)
    if ((className.includes('TextView') && (resourceId.includes('link') || 
         text.includes('http') || contentDesc.includes('链接')))) {
      return 'link';
    }
    
    // 可点击文本检测
    if (className.includes('TextView') && attrs['clickable'] === 'true' && (text || contentDesc)) {
      return 'clickable_text';
    }
    
    // 其他可点击元素
    if (attrs['clickable'] === 'true') {
      return 'other_clickable';
    }
    
    return 'other_clickable';
  }
}

/**
 * 置信度计算器
 */
class ConfidenceCalculator {
  /**
   * 计算元素的操作置信度
   */
  calculateConfidence(node: UiNode, type: ActionableElementType): number {
    let confidence = 0.5; // 基础置信度
    const attrs = node.attrs;
    const text = attrs['text'] || '';
    const contentDesc = attrs['content-desc'] || '';
    const fullText = `${text} ${contentDesc}`.toLowerCase();
    
    // 基于元素类型的基础分数
    const typeScores: Record<ActionableElementType, number> = {
      'button': 0.8,
      'text_button': 0.85,
      'input': 0.7,
      'checkbox': 0.75,
      'switch': 0.75,
      'clickable_text': 0.6,
      'image_button': 0.65,
      'list_item': 0.5,
      'tab': 0.7,
      'link': 0.6,
      'other_clickable': 0.4
    };
    
    confidence = typeScores[type] || 0.5;
    
    // 关键词加分
    for (const keyword of ACTION_KEYWORDS.high) {
      if (fullText.includes(keyword.toLowerCase())) {
        confidence += 0.2;
        break; // 只加一次高优先级分数
      }
    }
    
    for (const keyword of ACTION_KEYWORDS.medium) {
      if (fullText.includes(keyword.toLowerCase())) {
        confidence += 0.1;
        break;
      }
    }
    
    // 低优先级关键词实际上减分（取消、跳过等）
    for (const keyword of ACTION_KEYWORDS.low) {
      if (fullText.includes(keyword.toLowerCase())) {
        confidence -= 0.1;
        break;
      }
    }
    
    // 有意义的文本内容加分
    if (text.length > 0 && text.length <= 20) {
      confidence += 0.1;
    }
    
    // 过长的文本减分（可能是描述性文本）
    if (text.length > 50) {
      confidence -= 0.15;
    }
    
    // 边界检查
    return Math.max(0.1, Math.min(1.0, confidence));
  }
}

/**
 * 动作文本生成器
 */
class ActionTextGenerator {
  /**
   * 生成动作描述文本
   */
  generateActionText(node: UiNode, type: ActionableElementType): string {
    const text = node.attrs['text'] || '';
    const contentDesc = node.attrs['content-desc'] || '';
    const className = node.attrs['class'] || '';
    
    // 如果有明确的文本，优先使用
    if (text) {
      return `点击"${text}"`;
    }
    
    if (contentDesc) {
      return `点击 ${contentDesc}`;
    }
    
    // 基于类型生成默认描述
    const typeDescriptions: Record<ActionableElementType, string> = {
      'button': '点击按钮',
      'text_button': '点击文本按钮',
      'input': '输入文本',
      'checkbox': '勾选复选框',
      'switch': '切换开关',
      'clickable_text': '点击文本',
      'image_button': '点击图片按钮',
      'list_item': '点击列表项',
      'tab': '切换标签',
      'link': '点击链接',
      'other_clickable': '点击元素'
    };
    
    return typeDescriptions[type] || '点击元素';
  }
}

/**
 * 子元素分析器主类
 */
export class ChildElementAnalyzer {
  private typeDetector = new ElementTypeDetector();
  private confidenceCalculator = new ConfidenceCalculator();
  private actionTextGenerator = new ActionTextGenerator();
  
  /**
   * 分析节点的可操作子元素
   */
  analyzeChildren(parentNode: UiNode, enableSmartRecommendation: boolean = true): ChildElementAnalysis {
    const actionableChildren: ActionableChildElement[] = [];
    
    // 递归遍历所有子节点（包括深层子节点）
    this.traverseChildren(parentNode, actionableChildren, 0);
    
    // 🆕 智能推荐增强（如果启用）
    let enhancedChildren = actionableChildren;
    if (enableSmartRecommendation && actionableChildren.length > 1) {
      try {
        // 动态导入智能推荐增强器（避免循环依赖）
        const { smartRecommendationEnhancer } = require('./smartRecommendationEnhancer');
        const context = smartRecommendationEnhancer.buildContext(parentNode);
        const userIntent = smartRecommendationEnhancer.detectUserIntent(parentNode, context);
        
        enhancedChildren = smartRecommendationEnhancer.enhanceRecommendations(
          actionableChildren, 
          context, 
          userIntent
        );
        enhancedChildren = smartRecommendationEnhancer.reorderByEnhancedScore(enhancedChildren);
      } catch (error) {
        // 智能推荐失败时回退到基础排序
        console.warn('智能推荐增强失败，使用基础排序:', error);
      }
    }
    
    // 基础排序（按置信度和优先级）
    if (!enableSmartRecommendation || enhancedChildren === actionableChildren) {
      enhancedChildren.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // 优先级高的在前
        }
        return b.confidence - a.confidence; // 置信度高的在前
      });
    }
    
    // 选择推荐元素（排序后的第一个）
    const recommendation = enhancedChildren.length > 0 ? enhancedChildren[0] : null;
    
    return {
      parent: parentNode,
      children: enhancedChildren,
      recommendation,
      totalCount: enhancedChildren.length
    };
  }
  
  /**
   * 递归遍历子节点
   */
  private traverseChildren(
    node: UiNode, 
    result: ActionableChildElement[], 
    depth: number,
    maxDepth: number = 5
  ): void {
    // 防止过深递归
    if (depth > maxDepth) return;
    
    for (const child of node.children) {
      // 检查当前子节点是否为可操作元素
      if (this.isActionableElement(child)) {
        const type = this.typeDetector.detectType(child);
        const confidence = this.confidenceCalculator.calculateConfidence(child, type);
        const actionText = this.actionTextGenerator.generateActionText(child, type);
        const priority = this.calculatePriority(child, type, depth);
        
        result.push({
          node: child,
          type,
          confidence,
          actionText,
          key: this.generateElementKey(child),
          priority
        });
      }
      
      // 继续递归子节点
      this.traverseChildren(child, result, depth + 1, maxDepth);
    }
  }
  
  /**
   * 检查元素是否为可操作元素
   */
  private isActionableElement(node: UiNode): boolean {
    const attrs = node.attrs;
    
    // 明确可点击的元素
    if (attrs['clickable'] === 'true') return true;
    
    // 常见的交互元素类型
    const className = attrs['class'] || '';
    const interactiveClasses = [
      'Button', 'EditText', 'CheckBox', 'Switch', 'ImageButton',
      'Spinner', 'SeekBar', 'ToggleButton', 'RadioButton'
    ];
    
    return interactiveClasses.some(cls => className.includes(cls));
  }
  
  /**
   * 计算元素优先级
   */
  private calculatePriority(node: UiNode, type: ActionableElementType, depth: number): number {
    let priority = 50; // 基础优先级
    
    // 深度影响（越浅优先级越高）
    priority -= depth * 5;
    
    // 类型影响
    const typePriorities: Record<ActionableElementType, number> = {
      'text_button': 20,
      'button': 18,
      'clickable_text': 15,
      'checkbox': 12,
      'switch': 12,
      'input': 10,
      'tab': 8,
      'image_button': 6,
      'link': 5,
      'list_item': 3,
      'other_clickable': 0
    };
    
    priority += typePriorities[type] || 0;
    
    // 关键词影响
    const text = (node.attrs['text'] || '').toLowerCase();
    const contentDesc = (node.attrs['content-desc'] || '').toLowerCase();
    const fullText = `${text} ${contentDesc}`;
    
    for (const keyword of ACTION_KEYWORDS.high) {
      if (fullText.includes(keyword.toLowerCase())) {
        priority += 15;
        break;
      }
    }
    
    return Math.max(0, priority);
  }
  
  /**
   * 生成元素唯一标识
   */
  private generateElementKey(node: UiNode): string {
    const resourceId = node.attrs['resource-id'] || '';
    const text = node.attrs['text'] || '';
    const className = node.attrs['class'] || '';
    const bounds = node.attrs['bounds'] || '';
    
    // 优先使用resource-id
    if (resourceId) {
      return `rid:${resourceId}`;
    }
    
    // 使用文本内容
    if (text && text.length <= 20) {
      return `text:${text}`;
    }
    
    // 使用类名+位置
    return `class:${className.split('.').pop()}@${bounds}`;
  }
}

/**
 * 默认分析器实例
 */
export const childElementAnalyzer = new ChildElementAnalyzer();