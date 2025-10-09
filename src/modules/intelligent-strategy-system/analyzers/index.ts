/**
 * index.ts
 * 分析器模块统一导出
 * 
 * @description 提供所有分析器的统一访问接口
 */

export { BaseAnalyzer } from './BaseAnalyzer';
export { SelfAnchorAnalyzer } from './SelfAnchorAnalyzer';
export { ChildAnchorAnalyzer } from './ChildAnchorAnalyzer';
export { ParentClickableAnalyzer } from './ParentClickableAnalyzer';
export { RegionScopedAnalyzer } from './RegionScopedAnalyzer';
export { NeighborRelativeAnalyzer } from './NeighborRelativeAnalyzer';
export { IndexFallbackAnalyzer } from './IndexFallbackAnalyzer';

import { BaseAnalyzer } from './BaseAnalyzer';
import { SelfAnchorAnalyzer } from './SelfAnchorAnalyzer';
import { ChildAnchorAnalyzer } from './ChildAnchorAnalyzer';
import { ParentClickableAnalyzer } from './ParentClickableAnalyzer';
import { RegionScopedAnalyzer } from './RegionScopedAnalyzer';
import { NeighborRelativeAnalyzer } from './NeighborRelativeAnalyzer';
import { IndexFallbackAnalyzer } from './IndexFallbackAnalyzer';
import { AnalysisStep } from '../types/DecisionTypes';

/**
 * 分析器工厂实现
 */
export class AnalyzerFactory {
  private static analyzers: Map<AnalysisStep, BaseAnalyzer> = new Map();

  static {
    // 初始化所有分析器 - Step 1-6 完整链条
    this.analyzers.set(AnalysisStep.SELF_ANCHOR, new SelfAnchorAnalyzer());
    this.analyzers.set(AnalysisStep.CHILD_ANCHOR, new ChildAnchorAnalyzer());
    this.analyzers.set(AnalysisStep.PARENT_CLICKABLE, new ParentClickableAnalyzer());
    this.analyzers.set(AnalysisStep.REGION_SCOPED, new RegionScopedAnalyzer());
    this.analyzers.set(AnalysisStep.NEIGHBOR_RELATIVE, new NeighborRelativeAnalyzer());
    this.analyzers.set(AnalysisStep.INDEX_FALLBACK, new IndexFallbackAnalyzer());
  }

  /**
   * 根据步骤创建分析器
   */
  static createAnalyzer(step: AnalysisStep): BaseAnalyzer | null {
    return this.analyzers.get(step) || null;
  }

  /**
   * 获取所有可用的分析器
   */
  static getAllAnalyzers(): BaseAnalyzer[] {
    return Array.from(this.analyzers.values());
  }

  /**
   * 根据步骤获取分析器
   */
  static getAnalyzerByStep(step: AnalysisStep): BaseAnalyzer | null {
    return this.analyzers.get(step) || null;
  }

  /**
   * 获取已实现的分析器步骤列表
   */
  static getImplementedSteps(): AnalysisStep[] {
    return Array.from(this.analyzers.keys());
  }

  /**
   * 检查指定步骤的分析器是否已实现
   */
  static isStepImplemented(step: AnalysisStep): boolean {
    return this.analyzers.has(step);
  }

  /**
   * 获取分析器统计信息
   */
  static getStats(): {
    total: number;
    implemented: number;
    pending: number;
    implementedSteps: AnalysisStep[];
  } {
    const allSteps = Object.values(AnalysisStep);
    const implementedSteps = this.getImplementedSteps();
    
    return {
      total: allSteps.length,
      implemented: implementedSteps.length,
      pending: allSteps.length - implementedSteps.length,
      implementedSteps
    };
  }
}

/**
 * 便捷的分析器访问函数
 */
export const getAnalyzer = (step: AnalysisStep) => AnalyzerFactory.getAnalyzerByStep(step);
export const getAllAnalyzers = () => AnalyzerFactory.getAllAnalyzers();
export const getAnalyzerStats = () => AnalyzerFactory.getStats();