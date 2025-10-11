// src/components/universal-ui/analyzer/UniversalElementAnalyzer.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 通用UI元素智能分析器 - 重构后的主类
 * 整合各个分析模块，提供统一的分析接口
 */

import { ElementContext, ElementAnalysisResult } from './types';
import { AppSpecificMappings } from './AppSpecificMappings';
import { ElementAnalysisUtils } from './ElementAnalysisUtils';
import { AppSpecificAnalyzer } from './AppSpecificAnalyzer';
import { GenericPatternAnalyzer } from './GenericPatternAnalyzer';

export class UniversalElementAnalyzer {

  /**
   * 主要分析方法 - 对单个元素进行全面分析
   */
  static analyzeElement(element: ElementContext, packageName?: string): ElementAnalysisResult {
    // 创建基础分析结果
    const result = ElementAnalysisUtils.createDefaultResult();
    
    // 填充详细分析信息
    result.analysisDetails = {
      positionAnalysis: ElementAnalysisUtils.analyzePosition(element),
      textAnalysis: ElementAnalysisUtils.analyzeText(element),
      contextAnalysis: ElementAnalysisUtils.analyzeContext(element),
      interactionAnalysis: ElementAnalysisUtils.analyzeInteraction(element),
      semanticAnalysis: ElementAnalysisUtils.analyzeSemantics(element)
    };

    // 应用特定分析
    if (packageName) {
      const appConfig = AppSpecificMappings.getAppConfig(packageName);
      if (appConfig) {
        const appResult = AppSpecificAnalyzer.analyzeWithAppConfig(element, appConfig);
        if (appResult.confidence > result.confidence) {
          Object.assign(result, appResult);
          result.analysisDetails = {
            ...result.analysisDetails,
            ...appResult.analysisDetails
          };
        }
      }
    }

    // 通用模式分析
    const genericResult = GenericPatternAnalyzer.analyzeWithGenericPatterns(element);
    if (genericResult.confidence > result.confidence) {
      Object.assign(result, genericResult);
      result.analysisDetails = {
        ...result.analysisDetails,
        ...genericResult.analysisDetails
      };
    }

    // 基础启发式分析
    this.applyBasicHeuristics(element, result);

    return result;
  }

  /**
   * 批量分析多个元素
   */
  static analyzeBatch(elements: ElementContext[], packageName?: string): ElementAnalysisResult[] {
    return elements.map(element => this.analyzeElement(element, packageName));
  }

  /**
   * 应用基础启发式规则
   */
  private static applyBasicHeuristics(element: ElementContext, result: ElementAnalysisResult): void {
    // 如果已经有较高置信度的结果，跳过启发式分析
    if (result.confidence > 0.6) {
      return;
    }

    const displayText = element.text || element.contentDesc;
    
    // 基于类名的启发式
    this.applyClassNameHeuristics(element, result);
    
    // 基于位置的启发式
    this.applyPositionHeuristics(element, result);
    
    // 基于文本的启发式
    if (displayText) {
      this.applyTextHeuristics(element, result, displayText);
    }
    
    // 基于交互性的启发式
    this.applyInteractionHeuristics(element, result);
  }

  /**
   * 基于类名的启发式规则
   */
  private static applyClassNameHeuristics(element: ElementContext, result: ElementAnalysisResult): void {
    const className = element.className.toLowerCase();
    
    if (className.includes('button')) {
      result.elementType = 'action_button';
      result.functionality = 'button_action';
      result.userDescription = '按钮控件';
      result.actionSuggestion = '点击执行操作';
      result.confidence = Math.max(result.confidence, 0.6);
      result.metadata.category = 'interaction';
    } else if (className.includes('textview')) {
      result.elementType = 'info_text';
      result.functionality = 'display_info';
      result.userDescription = '文本显示';
      result.actionSuggestion = '仅用于信息显示';
      result.confidence = Math.max(result.confidence, 0.5);
      result.metadata.category = 'display';
    } else if (className.includes('edittext')) {
      result.elementType = 'text_input';
      result.functionality = 'text_input';
      result.userDescription = '文本输入框';
      result.actionSuggestion = '点击进行文本输入';
      result.confidence = Math.max(result.confidence, 0.7);
      result.metadata.category = 'input';
    } else if (className.includes('imageview') || className.includes('imagebutton')) {
      result.elementType = 'image_button';
      result.functionality = 'image_display';
      result.userDescription = '图片或图标';
      result.actionSuggestion = element.clickable ? '点击进行操作' : '仅用于显示';
      result.confidence = Math.max(result.confidence, 0.5);
      result.metadata.category = element.clickable ? 'interaction' : 'display';
    }
  }

  /**
   * 基于位置的启发式规则
   */
  private static applyPositionHeuristics(element: ElementContext, result: ElementAnalysisResult): void {
    const relativeY = element.position.y / element.screenHeight;
    const relativeX = element.position.x / element.screenWidth;
    
    // 底部区域
    if (relativeY > 0.85 && element.clickable) {
      if (result.elementType === 'unknown') {
        result.elementType = 'navigation_tab';
        result.functionality = 'bottom_navigation';
        result.userDescription = '底部导航按钮';
        result.confidence = Math.max(result.confidence, 0.4);
        result.metadata.category = 'navigation';
      }
    }
    
    // 顶部区域
    if (relativeY < 0.15) {
      if (result.elementType === 'unknown') {
        result.elementType = 'menu_item';
        result.functionality = 'top_action';
        result.userDescription = '顶部操作按钮';
        result.confidence = Math.max(result.confidence, 0.3);
        result.metadata.category = 'navigation';
      }
    }
    
    // 右上角（可能是关闭按钮）
    if (relativeX > 0.8 && relativeY < 0.2 && element.clickable) {
      result.actionSuggestion = '可能是关闭或操作按钮';
      result.confidence = Math.max(result.confidence, 0.3);
    }
  }

  /**
   * 基于文本的启发式规则
   */
  private static applyTextHeuristics(element: ElementContext, result: ElementAnalysisResult, displayText: string): void {
    const lowerText = displayText.toLowerCase();
    
    // 确认类按钮
    if (['确定', 'ok', '确认', '提交', 'submit'].some(word => lowerText.includes(word))) {
      result.elementType = 'action_button';
      result.functionality = 'confirm_action';
      result.userDescription = '确认按钮';
      result.actionSuggestion = '点击确认操作';
      result.confidence = Math.max(result.confidence, 0.7);
      result.metadata.priority = 'high';
    }
    
    // 取消类按钮
    if (['取消', 'cancel', '返回', 'back'].some(word => lowerText.includes(word))) {
      result.elementType = 'action_button';
      result.functionality = 'cancel_action';
      result.userDescription = '取消按钮';
      result.actionSuggestion = '点击取消操作';
      result.confidence = Math.max(result.confidence, 0.7);
    }
  }

  /**
   * 基于交互性的启发式规则
   */
  private static applyInteractionHeuristics(element: ElementContext, result: ElementAnalysisResult): void {
    if (!element.clickable && !element.scrollable && !element.focusable) {
      result.elementType = 'info_text';
      result.functionality = 'display_only';
      result.userDescription = '静态显示元素';
      result.actionSuggestion = '仅用于信息展示';
      result.confidence = Math.max(result.confidence, 0.4);
      result.metadata.category = 'display';
    }
    
    if (element.scrollable) {
      result.elementType = 'content_item';
      result.functionality = 'scrollable_content';
      result.userDescription = '可滚动内容区域';
      result.actionSuggestion = '可以滑动查看更多内容';
      result.confidence = Math.max(result.confidence, 0.6);
      result.metadata.category = 'content';
    }
  }

  /**
   * 获取元素的简要描述
   */
  static getElementSummary(element: ElementContext, packageName?: string): string {
    const result = this.analyzeElement(element, packageName);
    return `${result.userDescription} (置信度: ${(result.confidence * 100).toFixed(1)}%)`;
  }

  /**
   * 检查元素是否适合作为操作目标
   */
  static isActionable(element: ElementContext): boolean {
    return element.clickable && 
           element.enabled && 
           !!(element.text || element.contentDesc || element.resourceId);
  }

  /**
   * 获取支持的应用列表
   */
  static getSupportedApps(): string[] {
    return Object.keys(AppSpecificMappings.getAllAppConfigs());
  }
}