// src/modules/intelligent-strategy-system/analyzers/region-scoped/calculators/RegionCalculator.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 区域计算器 - 区域识别和计算核心功能
 * 提取自 RegionScopedAnalyzer.ts，负责区域相关的计算逻辑
 */

import { BoundsCalculator } from '../../../../../shared/bounds/BoundsCalculator';
import type { ElementAnalysisContext } from '../../../types/AnalysisTypes';
import type { RegionInfo, RegionType, RegionFeatures, ScreenRegion, SizeConstraints, ProportionConstraints } from '../types';

/**
 * 区域计算器
 * 提供区域识别、边界计算、特征提取等核心功能
 */
export class RegionCalculator {
  
  /**
   * 计算区域复杂性
   */
  calculateRegionComplexity(context: ElementAnalysisContext): number {
    const allElements = context.document.allNodes;
    const uniqueContainerTypes = new Set(
      allElements
        .filter(el => this.isContainer(el))
        .map(el => el.tag)
    );
    return uniqueContainerTypes.size;
  }

  /**
   * 识别包含区域
   */
  identifyContainingRegions(element: any, context: ElementAnalysisContext): RegionInfo[] {
    const elementBounds = BoundsCalculator.getBoundsInfo(element.bounds);
    if (!elementBounds) return [];

    const regions: RegionInfo[] = [];
    const allElements = context.document.allNodes;

    for (const el of allElements) {
      if (this.isContainer(el) && el !== element) {
        const containerBounds = BoundsCalculator.getBoundsInfo(typeof el.bounds === 'string' ? el.bounds : JSON.stringify(el.bounds));
        if (containerBounds && this.isElementContainedIn(elementBounds, containerBounds)) {
          regions.push({
            container: el,
            bounds: containerBounds,
            area: this.calculateArea(containerBounds),
            type: this.identifyRegionType({ container: el }),
            features: this.extractRegionFeatures(el, context)
          });
        }
      }
    }

    // 按包含面积排序（越小越精确）
    return regions.sort((a, b) => a.area - b.area);
  }

  /**
   * 检查区域是否唯一
   */
  isRegionUnique(region: RegionInfo, context: ElementAnalysisContext): boolean {
    if (this.hasValidResourceId(region.container)) {
      const resourceId = region.container.attributes['resource-id'];
      const duplicateCount = context.document.allNodes.filter(el => 
        el.attributes?.['resource-id'] === resourceId
      ).length;
      return duplicateCount === 1;
    }
    return false;
  }

  /**
   * 计算边界清晰度
   */
  calculateBoundsClarity(element: any, context: ElementAnalysisContext): number {
    const bounds = BoundsCalculator.getBoundsInfo(element.bounds);
    if (!bounds) return 0;

    let clarity = 0;
    
    // 基于尺寸合理性
    const area = this.calculateArea(bounds);
    if (area > 100 && area < 100000) { // 合理的元素尺寸
      clarity += 2;
    }

    // 基于位置合理性
    if (bounds.left >= 0 && bounds.top >= 0) {
      clarity += 1;
    }

    // 基于边界完整性
    if (bounds.right > bounds.left && bounds.bottom > bounds.top) {
      clarity += 1;
    }

    return clarity;
  }

  /**
   * 识别屏幕区域
   */
  identifyScreenRegion(bounds: any, context: ElementAnalysisContext): ScreenRegion {
    // 假设屏幕高度
    const screenHeight = 2000; // 可以从 context 获取实际屏幕尺寸
    const centerY = bounds.top + (bounds.bottom - bounds.top) / 2;
    
    const topThird = screenHeight / 3;
    const bottomThird = screenHeight * 2 / 3;
    
    if (centerY < topThird) return 'top';
    if (centerY > bottomThird) return 'bottom';
    return 'middle';
  }

  /**
   * 计算尺寸约束
   */
  calculateSizeConstraints(bounds: any, context: ElementAnalysisContext): SizeConstraints {
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    
    // 计算合理的尺寸范围（±20%）
    const widthTolerance = width * 0.2;
    const heightTolerance = height * 0.2;
    
    return {
      isValid: width > 0 && height > 0,
      width,
      height,
      minWidth: Math.max(0, width - widthTolerance),
      maxWidth: width + widthTolerance,
      minHeight: Math.max(0, height - heightTolerance),
      maxHeight: height + heightTolerance
    };
  }

  /**
   * 计算比例约束
   */
  calculateProportionConstraints(bounds: any, context: ElementAnalysisContext): ProportionConstraints {
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    
    if (width <= 0 || height <= 0) {
      return { isValid: false, description: '', values: {} };
    }
    
    const ratio = width / height;
    let description = '';
    
    if (ratio > 3) description = '宽矩形';
    else if (ratio > 1.5) description = '横向矩形';
    else if (ratio > 0.67) description = '近似正方形';
    else if (ratio > 0.33) description = '纵向矩形';
    else description = '高矩形';
    
    return {
      isValid: true,
      description,
      values: {
        'aspect-ratio': Math.round(ratio * 100) / 100,
        'width': width,
        'height': height
      }
    };
  }

  /**
   * 识别区域类型
   */
  identifyRegionType(region: { container: any }): RegionType {
    const element = region.container;
    const resourceId = element.attributes?.['resource-id'] || '';
    const className = element.attributes?.['class'] || '';
    const tag = element.tag?.toLowerCase() || '';
    
    // 基于 resource-id 识别
    if (resourceId.includes('header') || resourceId.includes('title')) return 'header';
    if (resourceId.includes('content') || resourceId.includes('body')) return 'content';
    if (resourceId.includes('sidebar') || resourceId.includes('drawer')) return 'sidebar';
    if (resourceId.includes('footer')) return 'footer';
    if (resourceId.includes('nav') || resourceId.includes('menu')) return 'navigation';
    if (resourceId.includes('toolbar') || resourceId.includes('action')) return 'toolbar';
    if (resourceId.includes('item') || resourceId.includes('row')) return 'list-item';
    if (resourceId.includes('card')) return 'card';
    if (resourceId.includes('dialog') || resourceId.includes('popup')) return 'dialog';
    
    // 基于标签识别
    if (tag.includes('toolbar')) return 'toolbar';
    if (tag.includes('recycler') || tag.includes('list')) return 'content';
    if (tag.includes('linear') || tag.includes('relative')) return 'content';
    
    return 'unknown';
  }

  /**
   * 提取区域特征
   */
  private extractRegionFeatures(element: any, context: ElementAnalysisContext): RegionFeatures {
    const bounds = BoundsCalculator.parseBounds(element.bounds);
    if (!bounds) {
      return {
        density: { type: 'sparse', count: 0, density: 0 },
        layoutPattern: { type: 'unknown', index: -1 },
        contentSignature: { type: 'empty', values: {} }
      };
    }

    // 计算密度
    const density = this.calculateRegionDensity(bounds, context);
    
    // 识别布局模式  
    const layoutPattern = this.identifyLayoutPattern(element);
    
    // 生成内容签名
    const contentSignature = this.generateContentSignature(bounds, context);

    return { density, layoutPattern, contentSignature };
  }

  /**
   * 计算区域密度
   */
  private calculateRegionDensity(regionBounds: any, context: ElementAnalysisContext) {
    const regionArea = this.calculateArea(regionBounds);
    
    const childElements = context.document.allNodes.filter(el => {
      const elBounds = BoundsCalculator.getBoundsInfo(typeof el.bounds === 'string' ? el.bounds : JSON.stringify(el.bounds));
      return elBounds && this.isElementContainedIn(elBounds, regionBounds);
    });

    const density = childElements.length / (regionArea / 10000); // 元素密度

    let type: 'dense' | 'medium' | 'sparse' = 'unknown' as any;
    if (density > 5) type = 'dense';
    else if (density > 2) type = 'medium';
    else type = 'sparse';

    return {
      type,
      count: childElements.length,
      density: Math.round(density * 100) / 100
    };
  }

  /**
   * 识别布局模式
   */
  private identifyLayoutPattern(container: any) {
    const containerTag = container.tag;
    
    let type: 'linear' | 'grid' | 'overlay' | 'unknown' = 'unknown';
    let index = -1;

    if (containerTag.includes('Linear')) {
      type = 'linear';
    } else if (containerTag.includes('Grid') || containerTag.includes('RecyclerView')) {
      type = 'grid';
    } else if (containerTag.includes('Frame')) {
      type = 'overlay';
    }

    return { type, index };
  }

  /**
   * 生成内容签名
   */
  private generateContentSignature(regionBounds: any, context: ElementAnalysisContext) {
    const childElements = context.document.allNodes.filter(el => {
      const elBounds = BoundsCalculator.getBoundsInfo(typeof el.bounds === 'string' ? el.bounds : JSON.stringify(el.bounds));
      return elBounds && this.isElementContainedIn(elBounds, regionBounds);
    });

    const textElements = childElements.filter(el => this.hasMeaningfulText(el));
    const clickableElements = childElements.filter(el => this.isClickable(el));
    const imageElements = childElements.filter(el => el.tag.includes('Image'));

    return {
      type: 'content-mix',
      values: {
        'text-count': textElements.length,
        'clickable-count': clickableElements.length,
        'image-count': imageElements.length
      }
    };
  }

  // === 辅助方法 ===

  /**
   * 检查是否为容器
   */
  private isContainer(element: any): boolean {
    const containerTags = [
      'LinearLayout', 'RelativeLayout', 'FrameLayout', 'ConstraintLayout',
      'RecyclerView', 'ListView', 'ScrollView', 'ViewGroup'
    ];
    return containerTags.some(tag => element.tag.includes(tag));
  }

  /**
   * 检查元素是否包含在区域内
   */
  private isElementContainedIn(elementBounds: any, containerBounds: any): boolean {
    return (
      elementBounds.left >= containerBounds.left &&
      elementBounds.top >= containerBounds.top &&
      elementBounds.right <= containerBounds.right &&
      elementBounds.bottom <= containerBounds.bottom
    );
  }

  /**
   * 计算面积
   */
  private calculateArea(bounds: any): number {
    return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  }

  /**
   * 检查是否有有效的resource-id
   */
  private hasValidResourceId(element: any): boolean {
    const resourceId = element.attributes?.['resource-id'];
    return resourceId && resourceId.trim().length > 0 && !resourceId.includes('$');
  }

  /**
   * 检查是否有意义的文本
   */
  private hasMeaningfulText(element: any): boolean {
    const text = element.text || element.attributes?.text || '';
    return text.trim().length > 0 && !/^\s*$/.test(text);
  }

  /**
   * 检查是否可点击
   */
  private isClickable(element: any): boolean {
    return element.attributes?.clickable === 'true' || 
           element.attributes?.focusable === 'true' ||
           element.tag.includes('Button');
  }
}