/**
 * 应用特定分析器
 * 处理特定应用的UI元素识别逻辑
 */

import { ElementContext, ElementAnalysisResult, AppConfig } from './types';
import { ElementAnalysisUtils } from './ElementAnalysisUtils';

export class AppSpecificAnalyzer {

  /**
   * 基于应用配置进行分析
   */
  static analyzeWithAppConfig(element: ElementContext, appConfig: AppConfig): ElementAnalysisResult {
    const result = ElementAnalysisUtils.createDefaultResult();
    const displayText = element.text || element.contentDesc;
    
    if (!displayText) {
      return result;
    }

    // 底部导航检测
    this.analyzeBottomNavigation(element, appConfig, result, displayText);
    
    // 顶部标签检测
    this.analyzeTopTabs(element, appConfig, result, displayText);
    
    // 通用按钮检测
    this.analyzeCommonButtons(element, appConfig, result, displayText);

    return result;
  }

  /**
   * 分析底部导航
   */
  private static analyzeBottomNavigation(
    element: ElementContext, 
    appConfig: AppConfig, 
    result: ElementAnalysisResult, 
    displayText: string
  ) {
    if (!appConfig.bottomNavigation || !appConfig.bottomNavigation[displayText]) {
      return;
    }

    const navInfo = appConfig.bottomNavigation[displayText];
    const isBottomArea = (element.position.y / element.screenHeight) > 0.8;
    
    if (isBottomArea && element.clickable) {
      result.elementType = 'navigation_tab';
      result.functionality = navInfo.function;
      result.userDescription = `${navInfo.icon} ${displayText} - ${navInfo.description}`;
      result.actionSuggestion = `点击进入${displayText}页面`;
      result.confidence = Math.max(result.confidence, 0.9);
      result.metadata.category = 'navigation';
      result.metadata.priority = 'high';
      result.metadata.commonUseCase.push('页面导航', '主要功能入口');
      
      if (element.selected) {
        result.userDescription += '（当前页面）';
        result.actionSuggestion = '当前已在此页面';
      }
    }
  }

  /**
   * 分析顶部标签
   */
  private static analyzeTopTabs(
    element: ElementContext, 
    appConfig: AppConfig, 
    result: ElementAnalysisResult, 
    displayText: string
  ) {
    if (!appConfig.topTabs || !appConfig.topTabs[displayText]) {
      return;
    }

    const tabInfo = appConfig.topTabs[displayText];
    const isTopArea = (element.position.y / element.screenHeight) < 0.3;
    
    if (isTopArea && element.clickable) {
      result.elementType = 'tab_button';
      result.functionality = tabInfo.function;
      result.userDescription = `📂 ${displayText} - ${tabInfo.description}`;
      result.actionSuggestion = `切换到${displayText}标签页`;
      result.confidence = Math.max(result.confidence, 0.85);
      result.metadata.category = 'navigation';
      result.metadata.priority = 'medium';
      result.metadata.commonUseCase.push('内容切换', '标签页导航');
    }
  }

  /**
   * 分析通用按钮
   */
  private static analyzeCommonButtons(
    element: ElementContext, 
    appConfig: AppConfig, 
    result: ElementAnalysisResult, 
    displayText: string
  ) {
    if (!appConfig.commonButtons || !appConfig.commonButtons[displayText]) {
      return;
    }

    const buttonInfo = appConfig.commonButtons[displayText];
    if (element.clickable) {
      result.elementType = 'action_button';
      result.functionality = buttonInfo.function;
      result.userDescription = `🔘 ${displayText} - ${buttonInfo.description}`;
      result.actionSuggestion = `点击${displayText}`;
      result.confidence = Math.max(result.confidence, 0.8);
      result.metadata.category = 'interaction';
      result.metadata.priority = displayText.includes('购买') || displayText.includes('支付') ? 'high' : 'medium';
      result.metadata.commonUseCase.push('用户操作', buttonInfo.function);
    }
  }
}