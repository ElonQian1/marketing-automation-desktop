/**
 * 通用模式分析器
 * 处理跨应用的通用UI模式识别
 */

import { ElementContext, ElementAnalysisResult, PatternConfig } from './types';
import { ElementAnalysisUtils } from './ElementAnalysisUtils';
import { AppSpecificMappings } from './AppSpecificMappings';

export class GenericPatternAnalyzer {

  /**
   * 基于通用模式进行分析
   */
  static analyzeWithGenericPatterns(element: ElementContext): ElementAnalysisResult {
    const result = ElementAnalysisUtils.createDefaultResult();
    const displayText = (element.text || element.contentDesc).toLowerCase();
    
    if (!displayText) {
      return result;
    }

    // 检查各种通用模式
    this.analyzeNavigationPattern(element, result, displayText);
    this.analyzeSearchPattern(element, result, displayText);
    this.analyzeActionPattern(element, result, displayText);
    this.analyzeInputPattern(element, result, displayText);

    return result;
  }

  /**
   * 分析导航模式
   */
  private static analyzeNavigationPattern(
    element: ElementContext, 
    result: ElementAnalysisResult, 
    displayText: string
  ) {
    const navPattern = AppSpecificMappings.GENERIC_PATTERNS.navigation;
    
    if (this.matchesPattern(displayText, navPattern)) {
      const isBottomArea = navPattern.bottomArea && 
        (element.position.y / element.screenHeight) > navPattern.bottomArea.minY;
      
      if (isBottomArea && element.clickable) {
        result.elementType = 'navigation_tab';
        result.functionality = 'navigation';
        result.userDescription = `📍 ${element.text || element.contentDesc} - 导航按钮`;
        result.actionSuggestion = `点击进入${element.text || element.contentDesc}页面`;
        result.confidence = 0.7;
        result.metadata.category = 'navigation';
        result.metadata.priority = 'high';
        result.metadata.commonUseCase.push('页面导航');
      }
    }
  }

  /**
   * 分析搜索模式
   */
  private static analyzeSearchPattern(
    element: ElementContext, 
    result: ElementAnalysisResult, 
    displayText: string
  ) {
    const searchPattern = AppSpecificMappings.GENERIC_PATTERNS.search;
    
    if (this.matchesPattern(displayText, searchPattern) || 
        this.matchesContentDesc(element.contentDesc, searchPattern)) {
      
      if (element.clickable) {
        result.elementType = 'search_bar';
        result.functionality = 'search';
        result.userDescription = `🔍 ${element.text || element.contentDesc} - 搜索功能`;
        result.actionSuggestion = '点击进行搜索';
        result.confidence = 0.8;
        result.metadata.category = 'input';
        result.metadata.priority = 'medium';
        result.metadata.commonUseCase.push('内容搜索');
      }
    }
  }

  /**
   * 分析操作模式
   */
  private static analyzeActionPattern(
    element: ElementContext, 
    result: ElementAnalysisResult, 
    displayText: string
  ) {
    const actionPattern = AppSpecificMappings.GENERIC_PATTERNS.action;
    
    if (this.matchesPattern(displayText, actionPattern)) {
      if (element.clickable) {
        result.elementType = 'action_button';
        result.functionality = 'action';
        result.userDescription = `⚡ ${element.text || element.contentDesc} - 操作按钮`;
        result.actionSuggestion = `点击执行${element.text || element.contentDesc}操作`;
        result.confidence = 0.75;
        result.metadata.category = 'interaction';
        result.metadata.priority = 'medium';
        result.metadata.commonUseCase.push('用户操作');
      }
    }
  }

  /**
   * 分析输入模式
   */
  private static analyzeInputPattern(
    element: ElementContext, 
    result: ElementAnalysisResult, 
    displayText: string
  ) {
    const inputPattern = AppSpecificMappings.GENERIC_PATTERNS.input;
    
    if (this.matchesPattern(displayText, inputPattern) || 
        element.className.includes('EditText')) {
      
      result.elementType = 'text_input';
      result.functionality = 'input';
      result.userDescription = `✏️ ${element.text || element.contentDesc} - 文本输入框`;
      result.actionSuggestion = '点击进行文本输入';
      result.confidence = 0.8;
      result.metadata.category = 'input';
      result.metadata.priority = 'medium';
      result.metadata.commonUseCase.push('文本输入');
    }
  }

  /**
   * 检查是否匹配模式
   */
  private static matchesPattern(text: string, pattern: PatternConfig): boolean {
    return pattern.patterns.some(p => text.includes(p.toLowerCase()));
  }

  /**
   * 检查内容描述是否匹配
   */
  private static matchesContentDesc(contentDesc: string, pattern: PatternConfig): boolean {
    if (!contentDesc || !pattern.contentDescPatterns) {
      return false;
    }
    
    const lowerContentDesc = contentDesc.toLowerCase();
    return pattern.contentDescPatterns.some(p => lowerContentDesc.includes(p.toLowerCase()));
  }
}