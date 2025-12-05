// src/components/adb-xml-inspector/rendering/layer-analyzer.ts
// module: adb-xml-inspector | layer: domain | role: layer-analysis
// summary: UI层级分析器 - 将XML节点树转换为正确渲染顺序的扁平列表

import { UiNode, ElementBounds } from '../types';
import { 
  RenderableNode, 
  LayerAnalysisResult, 
  SemanticNodeType,
  HitTestOptions,
  HitTestResult,
} from './types';
import { SemanticDetector, SemanticContext } from './semantic-detector';
import { parseBounds } from '../utils';

/**
 * UI层级分析器
 * 
 * 核心职责：
 * 1. 将UI节点树扁平化为可渲染节点列表
 * 2. 正确计算每个节点的z-index（渲染层级）
 * 3. 识别并处理Android特殊布局容器（DrawerLayout、Dialog等）
 * 4. 提供点击测试功能（找到指定坐标下的节点）
 * 
 * 设计原则：
 * - 单一职责：只负责层级分析，不涉及具体渲染
 * - 可扩展性：通过SemanticDetector支持新的布局类型
 * - 可测试性：纯函数设计，易于单元测试
 */
export class LayerAnalyzer {
  /**
   * 分析UI节点树，生成渲染顺序列表
   * 
   * @param root UI节点树的根节点
   * @returns 层级分析结果
   */
  static analyze(root: UiNode | null): LayerAnalysisResult {
    if (!root) {
      return this.createEmptyResult();
    }
    
    const renderableNodes: RenderableNode[] = [];
    const metadata = {
      totalNodes: 0,
      clickableNodes: 0,
      hasDrawerLayout: false,
      hasBottomNav: false,
    };
    
    // 深度优先遍历，收集所有可渲染节点
    this.traverse(root, 0, 0, undefined, renderableNodes, metadata);
    
    // 按z-index排序（升序：先画底层，后画顶层）
    renderableNodes.sort((a, b) => a.zIndex - b.zIndex);
    
    // 推断屏幕尺寸
    const screenSize = this.inferScreenSize(renderableNodes);
    
    // 统计覆盖层数量
    const overlayCount = renderableNodes.filter(n => n.isOverlay).length;
    
    return {
      renderOrder: renderableNodes,
      screenSize,
      overlayCount,
      metadata,
    };
  }
  
  /**
   * 点击测试：找到指定坐标下的所有节点
   * 
   * @param renderableNodes 已分析的可渲染节点列表
   * @param options 点击测试选项
   * @returns 命中的节点列表
   */
  static hitTest(
    renderableNodes: RenderableNode[], 
    options: HitTestOptions
  ): HitTestResult {
    const { point, topMostOnly = true, clickableOnly = false } = options;
    
    // 从高z-index到低z-index遍历（从顶层到底层）
    const sortedByZDesc = [...renderableNodes].sort((a, b) => b.zIndex - a.zIndex);
    
    const hits: RenderableNode[] = [];
    
    for (const node of sortedByZDesc) {
      if (this.containsPoint(node.bounds, point)) {
        if (clickableOnly && node.node.attrs['clickable'] !== 'true') {
          continue;
        }
        
        hits.push(node);
        
        if (topMostOnly) {
          break;
        }
      }
    }
    
    return {
      hits,
      topMost: hits[0] || null,
    };
  }
  
  // ============ 私有方法 ============
  
  /**
   * 递归遍历节点树
   */
  private static traverse(
    node: UiNode,
    depth: number,
    siblingIndex: number,
    parentType: SemanticNodeType | undefined,
    result: RenderableNode[],
    metadata: LayerAnalysisResult['metadata']
  ): void {
    metadata.totalNodes++;
    
    if (node.attrs['clickable'] === 'true') {
      metadata.clickableNodes++;
    }
    
    // 解析边界
    const bounds = parseBounds(node.attrs['bounds']);
    
    // 构建语义上下文
    const context: SemanticContext = {
      parentType,
      siblingIndex,
      depth,
    };
    
    // 检测语义类型
    const semanticType = SemanticDetector.detectType(node, context);
    
    // 更新元数据
    if (semanticType === SemanticNodeType.DRAWER_LAYOUT) {
      metadata.hasDrawerLayout = true;
    }
    if (semanticType === SemanticNodeType.BOTTOM_NAVIGATION) {
      metadata.hasBottomNav = true;
    }
    
    // 计算z-index
    const zIndex = this.calculateZIndex(depth, siblingIndex, semanticType, result.length);
    
    // 如果有有效边界，添加到结果列表
    if (bounds && bounds.w > 0 && bounds.h > 0) {
      const isOverlay = SemanticDetector.isOverlayType(semanticType);
      
      result.push({
        node,
        bounds,
        zIndex,
        depth,
        siblingIndex,
        isOverlay,
        semanticType,
      });
    }
    
    // 递归处理子节点
    node.children.forEach((child, idx) => {
      this.traverse(child, depth + 1, idx, semanticType, result, metadata);
    });
  }
  
  /**
   * 计算节点的z-index
   * 
   * 计算规则：
   * 1. 基础值：depth * 1000 + siblingIndex * 10 + globalOrder
   * 2. 语义加成：特殊节点类型获得额外的z-index提升
   * 
   * 这确保了：
   * - 子节点总是在父节点之上
   * - 同级后出现的节点在先出现的之上
   * - 特殊容器（如抽屉）正确覆盖主内容
   */
  private static calculateZIndex(
    depth: number,
    siblingIndex: number,
    semanticType: SemanticNodeType,
    globalOrder: number
  ): number {
    // 基础z-index计算
    const baseZIndex = depth * 1000 + siblingIndex * 10 + globalOrder;
    
    // 语义类型加成
    const semanticBoost = SemanticDetector.getZIndexBoost(semanticType);
    
    return baseZIndex + semanticBoost;
  }
  
  /**
   * 检查点是否在边界内
   */
  private static containsPoint(
    bounds: ElementBounds, 
    point: { x: number; y: number }
  ): boolean {
    return (
      point.x >= bounds.x1 &&
      point.x <= bounds.x2 &&
      point.y >= bounds.y1 &&
      point.y <= bounds.y2
    );
  }
  
  /**
   * 从可渲染节点列表推断屏幕尺寸
   */
  private static inferScreenSize(
    nodes: RenderableNode[]
  ): { width: number; height: number } {
    if (nodes.length === 0) {
      return { width: 1080, height: 2400 }; // 默认尺寸
    }
    
    // 找到最大的边界范围
    let maxWidth = 0;
    let maxHeight = 0;
    
    for (const { bounds } of nodes) {
      if (bounds.x2 > maxWidth) maxWidth = bounds.x2;
      if (bounds.y2 > maxHeight) maxHeight = bounds.y2;
    }
    
    return { 
      width: maxWidth || 1080, 
      height: maxHeight || 2400 
    };
  }
  
  /**
   * 创建空结果
   */
  private static createEmptyResult(): LayerAnalysisResult {
    return {
      renderOrder: [],
      screenSize: { width: 1080, height: 2400 },
      overlayCount: 0,
      metadata: {
        totalNodes: 0,
        clickableNodes: 0,
        hasDrawerLayout: false,
        hasBottomNav: false,
      },
    };
  }
}
