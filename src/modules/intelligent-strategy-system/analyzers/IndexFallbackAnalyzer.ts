/**
 * IndexFallbackAnalyzer.ts
 * Step 6: 索引兜底分析器
 * 
 * @description 作为最后的兜底策略，基于索引和位置信息提供可靠的元素定位
 */

import { BaseAnalyzer } from './BaseAnalyzer';
import { AnalysisStep } from '../types/DecisionTypes';
import type {
  ElementAnalysisContext,
} from '../types/AnalysisTypes';
import type {
  StrategyCandidate
} from '../types/StrategyTypes';

/**
 * 索引兜底分析器 - Step 6
 * 
 * 职责：
 * 1. 提供基于绝对位置和索引的可靠定位策略
 * 2. 处理前面所有策略都失效的极端情况
 * 3. 确保任何元素都有至少一种可用的定位方法
 * 
 * 适用场景：
 * - 所有语义化策略都失效时的兜底方案
 * - 动态生成的无标识符元素
 * - 临时性或测试性元素的定位
 * - 紧急情况下的快速定位需求
 */
export class IndexFallbackAnalyzer extends BaseAnalyzer {
  readonly step = AnalysisStep.INDEX_FALLBACK;
  readonly name = 'IndexFallbackAnalyzer';
  readonly description = '基于索引和位置信息的兜底定位分析';

  /**
   * 检查是否适用于当前上下文
   * 注意：作为兜底策略，此分析器始终适用
   */
  isApplicable(context: ElementAnalysisContext): boolean {
    const element = context.targetElement;
    
    // 兜底策略：只要有基本信息就适用
    return !!(element.xpath || element.bounds || element.tag);
  }

  /**
   * 获取优先级
   * 注意：作为兜底策略，优先级最低
   */
  getPriority(context: ElementAnalysisContext): number {
    const element = context.targetElement;
    let priority = 1; // 基础优先级最低
    
    // 如果有XPath信息，稍微提高优先级
    if (element.xpath) {
      priority += 1;
    }
    
    // 如果有边界信息，稍微提高优先级
    if (element.bounds) {
      priority += 1;
    }
    
    // 如果有明确的tag，稍微提高优先级
    if (element.tag && element.tag !== 'View') {
      priority += 1;
    }
    
    // 检查是否是唯一的tag类型
    const sameTagCount = this.countSameTagElements(element, context);
    if (sameTagCount === 1) {
      priority += 2; // 唯一tag类型可以提高可靠性
    }
    
    return Math.min(priority, 4); // 最大优先级为4，仍然很低
  }

  /**
   * 主要分析方法
   */
  async analyze(context: ElementAnalysisContext): Promise<any> {
    const startTime = Date.now();
    const element = context.targetElement;
    const candidates: StrategyCandidate[] = [];

    this.log('info', '开始索引兜底分析', { 
      elementTag: element.tag,
      hasXPath: !!element.xpath,
      hasBounds: !!element.bounds
    });

    try {
      // 1. XPath直接定位策略
      const xpathCandidates = await this.analyzeXPathDirectStrategies(
        element, context
      );
      candidates.push(...xpathCandidates);

      // 2. 绝对位置策略
      const absolutePositionCandidates = await this.analyzeAbsolutePositionStrategies(
        element, context
      );
      candidates.push(...absolutePositionCandidates);

      // 3. 元素索引策略
      const elementIndexCandidates = await this.analyzeElementIndexStrategies(
        element, context
      );
      candidates.push(...elementIndexCandidates);

      // 4. 层级路径策略
      const hierarchyPathCandidates = await this.analyzeHierarchyPathStrategies(
        element, context
      );
      candidates.push(...hierarchyPathCandidates);

      // 5. 组合兜底策略
      const combinationCandidates = await this.analyzeCombinationFallbackStrategies(
        element, context
      );
      candidates.push(...combinationCandidates);

      // 按分数排序
      const sortedCandidates = candidates.sort((a, b) => b.scoring.total - a.scoring.total);

      const executionTime = Date.now() - startTime;
      this.log('info', `索引兜底分析完成，找到 ${sortedCandidates.length} 个候选策略`, {
        executionTime
      });

      return this.createResult(
        sortedCandidates.length > 0,
        sortedCandidates,
        `索引兜底分析完成，生成 ${sortedCandidates.length} 个兜底策略`,
        { executionTime, fallbackLevel: 'index-based' }
      );

    } catch (error) {
      this.log('error', '索引兜底分析失败', error);
      
      // 即使分析失败，也要提供最基础的兜底策略
      const emergencyCandidates = this.generateEmergencyFallbackStrategies(element, context);
      
      return this.createResult(
        emergencyCandidates.length > 0,
        emergencyCandidates,
        `分析失败，提供 ${emergencyCandidates.length} 个紧急兜底策略`,
        { executionTime: Date.now() - startTime, fallbackLevel: 'emergency' }
      );
    }
  }

  // === 具体分析方法 ===

  /**
   * XPath直接定位策略分析
   */
  private async analyzeXPathDirectStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    if (!element.xpath) return candidates;

    let baseScore = 55; // 中等分数，因为XPath比较脆弱

    // 策略1: 完整XPath路径
    candidates.push(this.createCandidate(
      'index-fallback',
      baseScore + 10,
      `完整XPath路径定位`,
      context,
      {
        criteria: {
          fields: ['xpath-complete'],
          values: {
            'xpath-complete': element.xpath
          },
          xpath: element.xpath,
          strategy: 'index-fallback'
        }
      }
    ));

    // 策略2: 简化XPath路径（移除具体索引）
    const simplifiedXPath = this.simplifyXPath(element.xpath);
    if (simplifiedXPath !== element.xpath) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 5,
        `简化XPath路径定位`,
        context,
        {
          criteria: {
            fields: ['xpath-simplified'],
            values: {
              'xpath-simplified': simplifiedXPath
            },
            xpath: simplifiedXPath,
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略3: 相对XPath路径（从最近的有ID的祖先开始）
    const relativeXPath = this.buildRelativeXPath(element, context);
    if (relativeXPath) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 7,
        `相对XPath路径定位`,
        context,
        {
          criteria: {
            fields: ['xpath-relative'],
            values: {
              'xpath-relative': relativeXPath
            },
            xpath: relativeXPath,
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略4: 末尾索引XPath（基于最后一级的索引）
    const lastIndexXPath = this.buildLastIndexXPath(element.xpath);
    if (lastIndexXPath) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 3,
        `末尾索引XPath定位`,
        context,
        {
          criteria: {
            fields: ['xpath-last-index'],
            values: {
              'xpath-last-index': lastIndexXPath
            },
            xpath: lastIndexXPath,
            strategy: 'index-fallback'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 绝对位置策略分析
   */
  private async analyzeAbsolutePositionStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    if (!element.bounds) return candidates;

    const bounds = this.parseBounds(element.bounds);
    if (!bounds) return candidates;

    let baseScore = 50; // 位置信息比较脆弱，分数中等偏下

    // 策略1: 精确边界定位
    candidates.push(this.createCandidate(
      'index-fallback',
      baseScore + 8,
      `精确边界位置定位: [${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`,
      context,
      {
        criteria: {
          fields: ['bounds-exact'],
          values: {
            'bounds-exact': this.formatBounds(element.bounds)
          },
          xpath: this.buildBoundsExactXPath(bounds, element),
          strategy: 'index-fallback'
        }
      }
    ));

    // 策略2: 中心点定位
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    candidates.push(this.createCandidate(
      'index-fallback',
      baseScore + 6,
      `中心点定位: (${Math.round(centerX)}, ${Math.round(centerY)})`,
      context,
      {
        criteria: {
          fields: ['center-point'],
          values: {
            'center-x': Math.round(centerX),
            'center-y': Math.round(centerY)
          },
          xpath: this.buildCenterPointXPath(centerX, centerY, element),
          strategy: 'index-fallback'
        }
      }
    ));

    // 策略3: 尺寸约束定位
    candidates.push(this.createCandidate(
      'index-fallback',
      baseScore + 4,
      `尺寸约束定位: ${bounds.width}x${bounds.height}`,
      context,
      {
        criteria: {
          fields: ['size-constraint'],
          values: {
            'width': bounds.width,
            'height': bounds.height
          },
          xpath: this.buildSizeConstraintXPath(bounds, element),
          strategy: 'index-fallback'
        }
      }
    ));

    // 策略4: 区域范围定位（允许小幅偏差）
    const tolerance = 10; // 10像素容差
    candidates.push(this.createCandidate(
      'index-fallback',
      baseScore + 2,
      `区域范围定位: ±${tolerance}px容差`,
      context,
      {
        criteria: {
          fields: ['bounds-range'],
          values: {
            'min-left': bounds.left - tolerance,
            'max-left': bounds.left + tolerance,
            'min-top': bounds.top - tolerance,
            'max-top': bounds.top + tolerance
          },
          xpath: this.buildBoundsRangeXPath(bounds, tolerance, element),
          strategy: 'index-fallback'
        }
      }
    ));

    return candidates;
  }

  /**
   * 元素索引策略分析
   */
  private async analyzeElementIndexStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    let baseScore = 45;

    // 策略1: 全局元素索引
    const globalIndex = this.calculateGlobalElementIndex(element, context);
    if (globalIndex !== -1) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 6,
        `全局元素索引: 第${globalIndex + 1}个元素`,
        context,
        {
          criteria: {
            fields: ['global-index'],
            values: {
              'global-index': globalIndex
            },
            xpath: this.buildGlobalIndexXPath(globalIndex, element),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略2: 同类型元素索引
    const typeIndex = this.calculateSameTypeIndex(element, context);
    if (typeIndex !== -1) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 8,
        `同类型元素索引: 第${typeIndex + 1}个${element.tag}`,
        context,
        {
          criteria: {
            fields: ['type-index'],
            values: {
              'element-type': element.tag,
              'type-index': typeIndex
            },
            xpath: this.buildTypeIndexXPath(element.tag, typeIndex),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略3: 层级深度索引
    const depthIndex = this.calculateDepthLevelIndex(element, context);
    if (depthIndex !== -1) {
      const depth = this.calculateElementDepth(element);
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 4,
        `层级深度索引: 深度${depth}的第${depthIndex + 1}个元素`,
        context,
        {
          criteria: {
            fields: ['depth-index'],
            values: {
              'depth-level': depth,
              'depth-index': depthIndex
            },
            xpath: this.buildDepthIndexXPath(depth, depthIndex, element),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略4: 兄弟元素索引
    const siblingIndex = this.calculateDirectSiblingIndex(element, context);
    if (siblingIndex !== -1) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 5,
        `兄弟元素索引: 第${siblingIndex + 1}个兄弟元素`,
        context,
        {
          criteria: {
            fields: ['sibling-index'],
            values: {
              'sibling-index': siblingIndex
            },
            xpath: this.buildSiblingIndexXPath(siblingIndex, element),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 层级路径策略分析
   */
  private async analyzeHierarchyPathStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    let baseScore = 40;

    // 策略1: 完整层级路径
    const fullHierarchy = this.buildFullHierarchyPath(element);
    if (fullHierarchy) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 7,
        `完整层级路径: ${fullHierarchy}`,
        context,
        {
          criteria: {
            fields: ['hierarchy-full'],
            values: {
              'hierarchy-full': fullHierarchy
            },
            xpath: this.buildHierarchyPathXPath(fullHierarchy),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略2: 简化层级路径（仅主要容器）
    const simplifiedHierarchy = this.buildSimplifiedHierarchyPath(element, context);
    if (simplifiedHierarchy) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 5,
        `简化层级路径: ${simplifiedHierarchy}`,
        context,
        {
          criteria: {
            fields: ['hierarchy-simplified'],
            values: {
              'hierarchy-simplified': simplifiedHierarchy
            },
            xpath: this.buildSimplifiedHierarchyXPath(simplifiedHierarchy),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略3: 末尾N级路径
    const lastNLevels = this.buildLastNLevelsPath(element, 3);
    if (lastNLevels) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 6,
        `末尾3级路径: ${lastNLevels}`,
        context,
        {
          criteria: {
            fields: ['hierarchy-last-n'],
            values: {
              'hierarchy-last-n': lastNLevels,
              'levels-count': 3
            },
            xpath: this.buildLastNLevelsXPath(lastNLevels),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 策略4: 关键节点路径（只包含有意义的容器）
    const keyNodesPath = this.buildKeyNodesPath(element, context);
    if (keyNodesPath) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 4,
        `关键节点路径: ${keyNodesPath}`,
        context,
        {
          criteria: {
            fields: ['hierarchy-key-nodes'],
            values: {
              'hierarchy-key-nodes': keyNodesPath
            },
            xpath: this.buildKeyNodesXPath(keyNodesPath),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 组合兜底策略分析
   */
  private async analyzeCombinationFallbackStrategies(
    element: any,
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const candidates: StrategyCandidate[] = [];
    
    let baseScore = 35;

    // 策略1: 类型+索引组合
    if (element.tag) {
      const typeIndex = this.calculateSameTypeIndex(element, context);
      if (typeIndex !== -1) {
        candidates.push(this.createCandidate(
          'index-fallback',
          baseScore + 10,
          `类型索引组合: ${element.tag}[${typeIndex + 1}]`,
          context,
          {
            criteria: {
              fields: ['type-index-combo'],
              values: {
                'element-type': element.tag,
                'type-index': typeIndex
              },
              xpath: `//${element.tag}[${typeIndex + 1}]`,
              strategy: 'index-fallback'
            }
          }
        ));
      }
    }

    // 策略2: 位置+类型组合
    if (element.bounds && element.tag) {
      const bounds = this.parseBounds(element.bounds);
      if (bounds) {
        candidates.push(this.createCandidate(
          'index-fallback',
          baseScore + 8,
          `位置类型组合: ${element.tag}在指定位置`,
          context,
          {
            criteria: {
              fields: ['position-type-combo'],
              values: {
                'element-type': element.tag,
                'approx-left': Math.round(bounds.left / 10) * 10,
                'approx-top': Math.round(bounds.top / 10) * 10
              },
              xpath: this.buildPositionTypeComboXPath(element.tag, bounds),
              strategy: 'index-fallback'
            }
          }
        ));
      }
    }

    // 策略3: 深度+类型组合
    if (element.tag) {
      const depth = this.calculateElementDepth(element);
      if (depth > 0) {
        candidates.push(this.createCandidate(
          'index-fallback',
          baseScore + 6,
          `深度类型组合: 深度${depth}的${element.tag}`,
          context,
          {
            criteria: {
              fields: ['depth-type-combo'],
              values: {
                'element-type': element.tag,
                'depth-level': depth
              },
              xpath: this.buildDepthTypeComboXPath(element.tag, depth),
              strategy: 'index-fallback'
            }
          }
        ));
      }
    }

    // 策略4: 全特征组合（所有可用信息）
    const allFeatures = this.extractAllAvailableFeatures(element);
    if (Object.keys(allFeatures).length >= 2) {
      candidates.push(this.createCandidate(
        'index-fallback',
        baseScore + 4,
        `全特征组合: ${Object.keys(allFeatures).length}个特征`,
        context,
        {
          criteria: {
            fields: ['all-features-combo'],
            values: allFeatures,
            xpath: this.buildAllFeaturesComboXPath(allFeatures, element),
            strategy: 'index-fallback'
          }
        }
      ));
    }

    return candidates;
  }

  /**
   * 生成紧急兜底策略（分析失败时使用）
   */
  private generateEmergencyFallbackStrategies(element: any, context: ElementAnalysisContext): StrategyCandidate[] {
    const candidates: StrategyCandidate[] = [];
    
    // 紧急策略1: 直接使用原始XPath
    if (element.xpath) {
      candidates.push(this.createCandidate(
        'index-fallback',
        30,
        '紧急XPath策略',
        context,
        {
          criteria: {
            fields: ['emergency-xpath'],
            values: { 'emergency-xpath': element.xpath },
            xpath: element.xpath,
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 紧急策略2: 基于元素标签的第一个元素
    if (element.tag) {
      candidates.push(this.createCandidate(
        'index-fallback',
        25,
        `紧急标签策略: 第一个${element.tag}`,
        context,
        {
          criteria: {
            fields: ['emergency-tag'],
            values: { 'emergency-tag': element.tag },
            xpath: `//${element.tag}[1]`,
            strategy: 'index-fallback'
          }
        }
      ));
    }

    // 紧急策略3: 通用元素选择器
    candidates.push(this.createCandidate(
      'index-fallback',
      20,
      '紧急通用策略: 第一个任意元素',
      context,
      {
        criteria: {
          fields: ['emergency-universal'],
          values: { 'emergency-universal': '*' },
          xpath: '//*[1]',
          strategy: 'index-fallback'
        }
      }
    ));

    return candidates;
  }

  // === 辅助方法 ===

  /**
   * 统计相同标签的元素数量
   */
  private countSameTagElements(element: any, context: ElementAnalysisContext): number {
    if (!element.tag) return 0;
    
    return context.document.allNodes.filter(node => node.tag === element.tag).length;
  }

  /**
   * 简化XPath路径
   */
  private simplifyXPath(xpath: string): string {
    if (!xpath) return '';
    
    // 移除具体的索引号，保留路径结构
    return xpath.replace(/\[\d+\]/g, '');
  }

  /**
   * 构建相对XPath路径
   */
  private buildRelativeXPath(element: any, context: ElementAnalysisContext): string | null {
    if (!element.xpath) return null;
    
    const pathParts = element.xpath.split('/');
    
    // 从后往前查找有ID的祖先元素
    for (let i = pathParts.length - 2; i > 0; i--) {
      const ancestorPath = pathParts.slice(0, i + 1).join('/');
      const ancestor = context.document.allNodes.find(node => 
        node.xpath === ancestorPath && 
        this.hasValidResourceId(node)
      );
      
      if (ancestor) {
        const ancestorId = ancestor.attributes['resource-id'];
        const relativePath = pathParts.slice(i + 1).join('/');
        return `//*[@resource-id='${ancestorId}']/${relativePath}`;
      }
    }
    
    return null;
  }

  /**
   * 构建末尾索引XPath
   */
  private buildLastIndexXPath(xpath: string): string | null {
    if (!xpath) return null;
    
    const match = xpath.match(/^(.+)\/([^\/]+)$/);
    if (match) {
      const [, parentPath, lastPart] = match;
      return `${parentPath}/${lastPart}`;
    }
    
    return null;
  }

  /**
   * 解析边界信息
   */
  private parseBounds(bounds: string | any): any {
    if (typeof bounds === 'object' && bounds !== null) {
      return bounds;
    }
    
    if (typeof bounds === 'string' && bounds) {
      try {
        const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (match) {
          const [, left, top, right, bottom] = match.map(Number);
          return {
            left, top, right, bottom,
            width: right - left,
            height: bottom - top
          };
        }
      } catch (error) {
        this.log('warn', '解析边界失败', { bounds, error });
      }
    }
    
    return null;
  }

  /**
   * 格式化边界信息
   */
  private formatBounds(bounds: string | any): string {
    if (typeof bounds === 'string') {
      return bounds;
    }
    if (typeof bounds === 'object' && bounds !== null) {
      return `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
    }
    return '';
  }

  /**
   * 计算全局元素索引
   */
  private calculateGlobalElementIndex(element: any, context: ElementAnalysisContext): number {
    return context.document.allNodes.findIndex(node => node === element);
  }

  /**
   * 计算同类型元素索引
   */
  private calculateSameTypeIndex(element: any, context: ElementAnalysisContext): number {
    if (!element.tag) return -1;
    
    const sameTypeElements = context.document.allNodes.filter(node => node.tag === element.tag);
    return sameTypeElements.findIndex(node => node === element);
  }

  /**
   * 计算层级深度索引
   */
  private calculateDepthLevelIndex(element: any, context: ElementAnalysisContext): number {
    const depth = this.calculateElementDepth(element);
    const sameDepthElements = context.document.allNodes.filter(node => 
      this.calculateElementDepth(node) === depth
    );
    return sameDepthElements.findIndex(node => node === element);
  }

  /**
   * 计算直接兄弟元素索引
   */
  private calculateDirectSiblingIndex(element: any, context: ElementAnalysisContext): number {
    if (!element.xpath) return -1;
    
    const pathParts = element.xpath.split('/');
    const parentPath = pathParts.slice(0, -1).join('/');
    
    const siblings = context.document.allNodes.filter(node => {
      if (!node.xpath) return false;
      const nodeParts = node.xpath.split('/');
      const nodeParentPath = nodeParts.slice(0, -1).join('/');
      return nodeParentPath === parentPath;
    });
    
    return siblings.findIndex(node => node === element);
  }

  /**
   * 计算元素深度
   */
  private calculateElementDepth(element: any): number {
    if (!element.xpath) return 0;
    return element.xpath.split('/').length - 1;
  }

  /**
   * 构建完整层级路径
   */
  private buildFullHierarchyPath(element: any): string | null {
    if (!element.xpath) return null;
    
    const pathParts = element.xpath.split('/').filter(part => part);
    return pathParts.map(part => part.replace(/\[\d+\]$/, '')).join(' > ');
  }

  /**
   * 构建简化层级路径
   */
  private buildSimplifiedHierarchyPath(element: any, context: ElementAnalysisContext): string | null {
    if (!element.xpath) return null;
    
    const pathParts = element.xpath.split('/').filter(part => part);
    const importantTags = ['Activity', 'LinearLayout', 'RelativeLayout', 'FrameLayout', 'ScrollView'];
    
    const simplifiedParts = pathParts
      .map(part => part.replace(/\[\d+\]$/, ''))
      .filter(tag => importantTags.some(important => tag.includes(important)) || tag === element.tag);
    
    return simplifiedParts.length > 0 ? simplifiedParts.join(' > ') : null;
  }

  /**
   * 构建末尾N级路径
   */
  private buildLastNLevelsPath(element: any, n: number): string | null {
    if (!element.xpath) return null;
    
    const pathParts = element.xpath.split('/').filter(part => part);
    const lastNParts = pathParts.slice(-n);
    
    return lastNParts.map(part => part.replace(/\[\d+\]$/, '')).join(' > ');
  }

  /**
   * 构建关键节点路径
   */
  private buildKeyNodesPath(element: any, context: ElementAnalysisContext): string | null {
    if (!element.xpath) return null;
    
    const pathParts = element.xpath.split('/').filter(part => part);
    const keyTags = ['Activity', 'Fragment', 'Dialog', 'RecyclerView', 'ListView', 'ScrollView'];
    
    const keyParts = pathParts
      .map(part => part.replace(/\[\d+\]$/, ''))
      .filter(tag => keyTags.some(key => tag.includes(key)));
    
    keyParts.push(element.tag); // 总是包含目标元素
    
    return keyParts.join(' > ');
  }

  /**
   * 提取所有可用特征
   */
  private extractAllAvailableFeatures(element: any): Record<string, any> {
    const features: Record<string, any> = {};
    
    if (element.tag) {
      features['element-type'] = element.tag;
    }
    
    if (element.bounds) {
      const bounds = this.parseBounds(element.bounds);
      if (bounds) {
        features['width'] = bounds.width;
        features['height'] = bounds.height;
        features['approx-left'] = Math.round(bounds.left / 10) * 10;
        features['approx-top'] = Math.round(bounds.top / 10) * 10;
      }
    }
    
    if (element.xpath) {
      const depth = this.calculateElementDepth(element);
      features['depth-level'] = depth;
    }
    
    return features;
  }

  // === XPath构建方法 ===

  private buildBoundsExactXPath(bounds: any, element: any): string {
    return `//${element.tag}[@bounds='[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]']`;
  }

  private buildCenterPointXPath(centerX: number, centerY: number, element: any): string {
    return `//${element.tag}[contains(@bounds,'${Math.round(centerX)},${Math.round(centerY)}')]`;
  }

  private buildSizeConstraintXPath(bounds: any, element: any): string {
    return `//${element.tag}[@bounds]`; // 简化版本
  }

  private buildBoundsRangeXPath(bounds: any, tolerance: number, element: any): string {
    return `//${element.tag}[@bounds]`; // 简化版本
  }

  private buildGlobalIndexXPath(index: number, element: any): string {
    return `//*[${index + 1}]`;
  }

  private buildTypeIndexXPath(elementType: string, index: number): string {
    return `//${elementType}[${index + 1}]`;
  }

  private buildDepthIndexXPath(depth: number, index: number, element: any): string {
    return `//${element.tag}[${index + 1}]`;
  }

  private buildSiblingIndexXPath(index: number, element: any): string {
    return `//${element.tag}[${index + 1}]`;
  }

  private buildHierarchyPathXPath(hierarchy: string): string {
    const parts = hierarchy.split(' > ');
    return '//' + parts.join('//');
  }

  private buildSimplifiedHierarchyXPath(hierarchy: string): string {
    const parts = hierarchy.split(' > ');
    return '//' + parts.join('//');
  }

  private buildLastNLevelsXPath(hierarchy: string): string {
    const parts = hierarchy.split(' > ');
    return '//' + parts.join('//');
  }

  private buildKeyNodesXPath(hierarchy: string): string {
    const parts = hierarchy.split(' > ');
    return '//' + parts.join('//');
  }

  private buildPositionTypeComboXPath(elementType: string, bounds: any): string {
    return `//${elementType}[@bounds]`;
  }

  private buildDepthTypeComboXPath(elementType: string, depth: number): string {
    return `//${elementType}`;
  }

  private buildAllFeaturesComboXPath(features: Record<string, any>, element: any): string {
    return `//${features['element-type'] || element.tag}`;
  }
}