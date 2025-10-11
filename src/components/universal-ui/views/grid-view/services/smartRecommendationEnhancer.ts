// src/components/universal-ui/views/grid-view/services/smartRecommendationEnhancer.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 智能推荐增强器
 * 基于上下文和用户意图提供更精准的子元素推荐
 */

import { UiNode } from '../types';
import { ActionableChildElement, ActionableElementType } from './childElementAnalyzer';

/**
 * 用户意图类型
 */
export type UserIntent = 
  | 'follow'      // 关注操作
  | 'like'        // 点赞操作  
  | 'share'       // 分享操作
  | 'comment'     // 评论操作
  | 'navigate'    // 导航操作
  | 'input'       // 输入操作
  | 'select'      // 选择操作
  | 'toggle'      // 切换操作
  | 'unknown';    // 未知意图

/**
 * 上下文信息
 */
export interface ElementContext {
  parentNode: UiNode;
  siblingNodes: UiNode[];
  ancestorTexts: string[];
  screenRegion: 'top' | 'middle' | 'bottom' | 'left' | 'right' | 'center';
  appPackage: string;
}

/**
 * 推荐权重配置
 */
interface RecommendationWeights {
  textMatch: number;
  positionPreference: number;
  elementType: number;
  contextRelevance: number;
  userIntentAlignment: number;
}

/**
 * 智能推荐增强器
 */
export class SmartRecommendationEnhancer {
  private readonly defaultWeights: RecommendationWeights = {
    textMatch: 0.4,
    positionPreference: 0.2,
    elementType: 0.2,
    contextRelevance: 0.1,
    userIntentAlignment: 0.1
  };

  /**
   * 检测用户意图
   */
  detectUserIntent(parentNode: UiNode, context: ElementContext): UserIntent {
    const allTexts = [
      parentNode.attrs['text'] || '',
      parentNode.attrs['content-desc'] || '',
      ...context.ancestorTexts,
      ...context.siblingNodes.map(n => n.attrs['text'] || n.attrs['content-desc'] || '')
    ].join(' ').toLowerCase();

    // 意图检测规则
    const intentPatterns: Record<UserIntent, string[]> = {
      'follow': ['关注', '订阅', 'follow', '加关注', '关注TA'],
      'like': ['点赞', '赞', 'like', '喜欢', '爱心', '👍'],
      'share': ['分享', 'share', '转发', '分享给', '推荐'],
      'comment': ['评论', 'comment', '留言', '回复', '说点什么'],
      'navigate': ['进入', '查看', '详情', '更多', '展开', '跳转'],
      'input': ['输入', '搜索', '填写', '编辑', '输入框'],
      'select': ['选择', '勾选', '选中', 'select', '切换'],
      'toggle': ['开关', '切换', 'toggle', '启用', '关闭'],
      'unknown': []
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (intent !== 'unknown' && patterns.some(pattern => allTexts.includes(pattern))) {
        return intent as UserIntent;
      }
    }

    return 'unknown';
  }

  /**
   * 计算屏幕区域
   */
  private calculateScreenRegion(bounds: string): ElementContext['screenRegion'] {
    const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return 'center';

    const left = parseInt(match[1]);
    const top = parseInt(match[2]);
    const right = parseInt(match[3]);
    const bottom = parseInt(match[4]);
    
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    
    // 假设屏幕尺寸为常见的1080x2400
    const screenWidth = 1080;
    const screenHeight = 2400;
    
    if (centerY < screenHeight * 0.33) return 'top';
    if (centerY > screenHeight * 0.67) return 'bottom';
    if (centerX < screenWidth * 0.33) return 'left';
    if (centerX > screenWidth * 0.67) return 'right';
    
    return 'center';
  }

  /**
   * 构建元素上下文
   */
  buildContext(parentNode: UiNode): ElementContext {
    // 获取兄弟节点
    const siblingNodes: UiNode[] = [];
    const traverseParent = (node: UiNode, target: UiNode) => {
      for (const child of node.children) {
        if (child === target) {
          // 找到目标节点的父节点，收集其所有子节点作为兄弟节点
          siblingNodes.push(...node.children.filter(n => n !== target));
          return true;
        }
        if (traverseParent(child, target)) return true;
      }
      return false;
    };

    // 这里需要从根节点开始遍历，但由于我们只有当前节点，先简化处理
    // 实际使用时可能需要传入根节点

    // 获取祖先文本
    const ancestorTexts: string[] = [];
    let current = parentNode.parent; // 假设有parent引用
    while (current && ancestorTexts.length < 3) {
      const text = current.attrs?.['text'] || current.attrs?.['content-desc'];
      if (text) ancestorTexts.push(text);
      current = current.parent;
    }

    // 获取应用包名
    const appPackage = parentNode.attrs['package'] || '';
    
    // 计算屏幕区域
    const screenRegion = this.calculateScreenRegion(parentNode.attrs['bounds'] || '');

    return {
      parentNode,
      siblingNodes,
      ancestorTexts,
      screenRegion,
      appPackage
    };
  }

  /**
   * 增强推荐分数
   */
  enhanceRecommendations(
    elements: ActionableChildElement[],
    context: ElementContext,
    userIntent: UserIntent = 'unknown'
  ): ActionableChildElement[] {
    return elements.map(element => {
      let enhancedConfidence = element.confidence;
      
      // 1. 文本匹配增强
      const textBoost = this.calculateTextMatchBoost(element, userIntent);
      enhancedConfidence += textBoost * this.defaultWeights.textMatch;
      
      // 2. 位置偏好增强
      const positionBoost = this.calculatePositionBoost(element, context);
      enhancedConfidence += positionBoost * this.defaultWeights.positionPreference;
      
      // 3. 元素类型增强
      const typeBoost = this.calculateTypeBoost(element, userIntent);
      enhancedConfidence += typeBoost * this.defaultWeights.elementType;
      
      // 4. 上下文相关性增强
      const contextBoost = this.calculateContextBoost(element, context);
      enhancedConfidence += contextBoost * this.defaultWeights.contextRelevance;
      
      // 5. 用户意图对齐增强
      const intentBoost = this.calculateIntentBoost(element, userIntent);
      enhancedConfidence += intentBoost * this.defaultWeights.userIntentAlignment;
      
      // 确保分数在合理范围内
      enhancedConfidence = Math.max(0.1, Math.min(1.0, enhancedConfidence));
      
      return {
        ...element,
        confidence: enhancedConfidence
      };
    });
  }

  /**
   * 计算文本匹配加权
   */
  private calculateTextMatchBoost(element: ActionableChildElement, intent: UserIntent): number {
    const text = (element.node.attrs['text'] || '').toLowerCase();
    const contentDesc = (element.node.attrs['content-desc'] || '').toLowerCase();
    const fullText = `${text} ${contentDesc}`;
    
    const intentKeywords: Record<UserIntent, string[]> = {
      'follow': ['关注', 'follow', '+关注'],
      'like': ['赞', 'like', '👍', '喜欢'],
      'share': ['分享', 'share', '转发'],
      'comment': ['评论', 'comment', '回复'],
      'navigate': ['查看', '进入', '详情', '更多'],
      'input': ['搜索', '输入', '编辑'],
      'select': ['选择', 'select'],
      'toggle': ['开关', 'toggle'],
      'unknown': []
    };
    
    const keywords = intentKeywords[intent] || [];
    for (const keyword of keywords) {
      if (fullText.includes(keyword)) {
        return 0.3; // 高匹配度
      }
    }
    
    // 通用积极词汇
    const positiveWords = ['确定', '完成', '提交', 'ok', 'yes'];
    const negativeWords = ['取消', '跳过', '暂不', 'cancel', 'no'];
    
    for (const word of positiveWords) {
      if (fullText.includes(word)) return 0.1;
    }
    
    for (const word of negativeWords) {
      if (fullText.includes(word)) return -0.2;
    }
    
    return 0;
  }

  /**
   * 计算位置偏好加权
   */
  private calculatePositionBoost(element: ActionableChildElement, context: ElementContext): number {
    const bounds = element.node.attrs['bounds'] || '';
    const region = this.calculateScreenRegion(bounds);
    
    // 根据上下文和元素类型偏好不同位置
    const positionPreferences: Record<ActionableElementType, ElementContext['screenRegion'][]> = {
      'button': ['bottom', 'right'],
      'text_button': ['center', 'bottom'],
      'input': ['top', 'center'],
      'checkbox': ['left', 'center'],
      'switch': ['right', 'center'],
      'clickable_text': ['center'],
      'image_button': ['top', 'right'],
      'list_item': ['center'],
      'tab': ['top'],
      'link': ['center', 'bottom'],
      'other_clickable': ['center']
    };
    
    const preferred = positionPreferences[element.type] || ['center'];
    return preferred.includes(region) ? 0.1 : 0;
  }

  /**
   * 计算元素类型加权
   */
  private calculateTypeBoost(element: ActionableChildElement, intent: UserIntent): number {
    const typeIntentAlignment: Record<UserIntent, ActionableElementType[]> = {
      'follow': ['button', 'text_button'],
      'like': ['button', 'image_button'],
      'share': ['button', 'image_button'],
      'comment': ['input', 'button'],
      'navigate': ['clickable_text', 'button'],
      'input': ['input'],
      'select': ['checkbox', 'list_item'],
      'toggle': ['switch', 'checkbox'],
      'unknown': []
    };
    
    const alignedTypes = typeIntentAlignment[intent] || [];
    return alignedTypes.includes(element.type) ? 0.15 : 0;
  }

  /**
   * 计算上下文相关性加权
   */
  private calculateContextBoost(element: ActionableChildElement, context: ElementContext): number {
    // 检查元素是否与兄弟节点有逻辑关系
    const elementText = element.node.attrs['text'] || '';
    
    // 如果兄弟节点中有相关文本，给予加权
    const siblingTexts = context.siblingNodes
      .map(n => n.attrs['text'] || n.attrs['content-desc'] || '')
      .join(' ')
      .toLowerCase();
    
    const relatedWords = ['用户', '内容', '视频', '图片', '文章'];
    for (const word of relatedWords) {
      if (siblingTexts.includes(word) && elementText.toLowerCase().includes(word)) {
        return 0.1;
      }
    }
    
    return 0;
  }

  /**
   * 计算用户意图对齐加权
   */
  private calculateIntentBoost(element: ActionableChildElement, intent: UserIntent): number {
    // 这个方法主要是为未来扩展预留，目前在其他方法中已经覆盖了意图对齐
    return 0;
  }

  /**
   * 对增强后的元素进行重新排序
   */
  reorderByEnhancedScore(elements: ActionableChildElement[]): ActionableChildElement[] {
    return elements.sort((a, b) => {
      // 首先按置信度降序
      if (Math.abs(a.confidence - b.confidence) > 0.05) {
        return b.confidence - a.confidence;
      }
      
      // 置信度相近时，按优先级降序
      return b.priority - a.priority;
    });
  }
}

/**
 * 默认智能推荐增强器实例
 */
export const smartRecommendationEnhancer = new SmartRecommendationEnhancer();