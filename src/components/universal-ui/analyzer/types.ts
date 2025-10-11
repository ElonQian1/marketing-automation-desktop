// src/components/universal-ui/analyzer/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 通用UI元素分析器 - 类型定义
 * 将所有接口和类型定义分离到独立文件
 */

export interface ElementContext {
  // 元素基础信息
  text: string;
  contentDesc: string;
  resourceId: string;
  className: string;
  bounds: string;
  clickable: boolean;
  selected: boolean;
  enabled: boolean;
  focusable: boolean;
  scrollable: boolean;
  checkable: boolean;
  checked: boolean;
  
  // 位置信息
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // 设备信息
  screenWidth: number;
  screenHeight: number;
  
  // 上下文信息（可选，用于更精确的分析）
  parentElements?: ElementContext[];
  siblingElements?: ElementContext[];
  childElements?: ElementContext[];
}

export interface ElementAnalysisResult {
  // 元素类型
  elementType: 'navigation_tab' | 'action_button' | 'content_item' | 'search_bar' | 
              'text_input' | 'image_button' | 'list_item' | 'menu_item' | 
              'tab_button' | 'toggle_button' | 'info_text' | 'icon' | 'unknown';
  
  // 功能描述
  functionality: string;
  
  // 用户友好的描述
  userDescription: string;
  
  // 操作建议
  actionSuggestion: string;
  
  // 置信度 (0-1)
  confidence: number;
  
  // 详细分析信息
  analysisDetails: {
    positionAnalysis: string;
    textAnalysis: string;
    contextAnalysis: string;
    interactionAnalysis: string;
    semanticAnalysis: string;
  };
  
  // 额外的元数据
  metadata: {
    category: 'navigation' | 'interaction' | 'content' | 'input' | 'display' | 'system';
    priority: 'high' | 'medium' | 'low';
    commonUseCase: string[];
  };
}

export interface AppConfig {
  packageName: string;
  bottomNavigation?: Record<string, {
    icon: string;
    function: string;
    description: string;
  }>;
  topTabs?: Record<string, {
    function: string;
    description: string;
  }>;
  commonButtons?: Record<string, {
    function: string;
    description: string;
  }>;
}

export interface PatternConfig {
  patterns: string[];
  bottomArea?: { minY: number };
  topArea?: { maxY: number };
  contentDescPatterns?: string[];
  characteristics?: {
    clickable?: boolean;
    textLength?: [number, number];
  };
}