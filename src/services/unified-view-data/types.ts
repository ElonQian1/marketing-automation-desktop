// src/services/unified-view-data/types.ts
// module: shared | layer: unknown | role: component
// summary: types.ts 文件

/**
 * 统一视图数据管理器 - 类型定义
 * 包含所有统一视图系统的接口和类型
 */

import { UIElement } from '../../api/universalUIAPI';

// 增强UI元素（扩展基础元素）
export interface EnhancedUIElement extends UIElement {
  // 层级信息
  depth: number;
  hierarchyLevel: string;
  
  // 视觉信息
  visualCategory: string;
  cssPosition?: CSSPosition;
  
  // 功能信息
  functionality: string;
  interactionType: string;
  
  // 上下文信息
  parentContext: string;
  siblingContext: string[];
  contextFingerprint: string;
  
  // 质量和评分
  qualityScore: number;
  reliability: number;
}

// 统一视图数据结构
export interface UnifiedViewData {
  // 基础数据
  xmlContent: string;
  rawElements: UIElement[];
  
  // 增强数据（一次性计算，多处复用）
  enhancedElements: EnhancedUIElement[];
  
  // 视图特定数据
  treeViewData: TreeViewData;
  visualViewData: VisualViewData;
  listViewData: ListViewData;
  
  // 元数据
  metadata: ViewMetadata;
}

// 树形视图数据
export interface TreeViewData {
  rootNodes: TreeNode[];
  maxDepth: number;
  hierarchyMap: Map<string, TreeNode>;
}

// 可视化视图数据
export interface VisualViewData {
  screenDimensions: { width: number; height: number };
  elementOverlays: ElementOverlay[];
  interactionZones: InteractionZone[];
  visualCategories: VisualCategory[];
}

// 列表视图数据
export interface ListViewData {
  groupedElements: Record<string, EnhancedUIElement[]>;
  filteredElements: EnhancedUIElement[];
  statistics: ElementStatistics;
  searchIndex: SearchIndex;
}

// 支持类型定义
export interface CSSPosition {
  left: string;
  top: string;
  width: string;
  height: string;
}

export interface TreeNode {
  id: string;
  element: EnhancedUIElement;
  children: TreeNode[];
  parent?: TreeNode;
  depth: number;
}

export interface ElementOverlay {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  className: string;
  isVisible: boolean;
}

export interface InteractionZone {
  type: string;
  elements: string[];
  bounds: { x: number; y: number; width: number; height: number };
}

export interface VisualCategory {
  name: string;
  color: string;
  elements: string[];
  count: number;
}

export interface ElementStatistics {
  totalElements: number;
  interactableElements: number;
  visibleElements: number;
  categorizedElements: Record<string, number>;
}

export interface SearchIndex {
  textIndex: Map<string, string[]>;
  attributeIndex: Map<string, string[]>;
  fastLookup: Map<string, EnhancedUIElement>;
}

export interface ViewMetadata {
  generatedAt: Date;
  xmlSource: string;
  deviceId: string;
  processingTimeMs: number;
  elementCount: number;
  enhancementVersion: string;
}

// 处理选项
export interface ProcessingOptions {
  forceReanalyze?: boolean;
  enableCaching?: boolean;
  verbose?: boolean;
  maxElements?: number;
  generateSearchIndex?: boolean;
}

// 缓存相关类型
export interface CacheEntry {
  data: UnifiedViewData;
  timestamp: number;
  size: number;
  accessCount: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: number;
  oldestEntry: number;
}

// 元素增强配置
export interface EnhancementConfig {
  enableHierarchyAnalysis: boolean;
  enableVisualCategorization: boolean;
  enableInteractionAnalysis: boolean;
  enableContextFingerprinting: boolean;
  qualityThresholds: {
    high: number;
    medium: number;
    low: number;
  };
}