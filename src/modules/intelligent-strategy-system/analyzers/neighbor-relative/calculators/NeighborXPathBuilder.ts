/**
 * NeighborXPathBuilder.ts
 * 基于邻居的XPath构建器
 */

export class NeighborXPathBuilder {
  /**
   * 构建基于邻居 resource-id 的 XPath
   */
  static buildNeighborResourceIdXPath(neighbor: any, direction: string, element: any): string {
    const resourceId = neighbor['resource-id'];
    const targetTag = element.tag || '*';
    
    const directionMap: Record<string, string> = {
      'right': 'following::',
      'left': 'preceding::',
      'below': 'following::',
      'above': 'preceding::'
    };

    const axis = directionMap[direction] || 'following::';
    return `//*[@resource-id='${resourceId}']/${axis}${targetTag}`;
  }

  /**
   * 构建基于邻居文本的 XPath
   */
  static buildNeighborTextXPath(text: string, direction: string, element: any): string {
    const targetTag = element.tag || '*';
    const directionMap: Record<string, string> = {
      'right': 'following::',
      'left': 'preceding::',
      'below': 'following::',
      'above': 'preceding::'
    };

    const axis = directionMap[direction] || 'following::';
    const escapedText = text.replace(/'/g, "\\'");
    return `//*[text()='${escapedText}']/${axis}${targetTag}`;
  }

  /**
   * 构建基于邻居 content-desc 的 XPath
   */
  static buildNeighborContentDescXPath(contentDesc: string, direction: string, element: any): string {
    const targetTag = element.tag || '*';
    const directionMap: Record<string, string> = {
      'right': 'following::',
      'left': 'preceding::',
      'below': 'following::',
      'above': 'preceding::'
    };

    const axis = directionMap[direction] || 'following::';
    const escapedDesc = contentDesc.replace(/'/g, "\\'");
    return `//*[@content-desc='${escapedDesc}']/${axis}${targetTag}`;
  }

  /**
   * 构建基于邻居类名的 XPath
   */
  static buildNeighborClassXPath(className: string, direction: string, element: any): string {
    const targetTag = element.tag || '*';
    const directionMap: Record<string, string> = {
      'right': 'following::',
      'left': 'preceding::',
      'below': 'following::',
      'above': 'preceding::'
    };

    const axis = directionMap[direction] || 'following::';
    return `//${className}/${axis}${targetTag}`;
  }

  /**
   * 构建方向性最近邻 XPath
   */
  static buildDirectionalNearestXPath(neighbor: any, direction: string, element: any): string {
    // 基于邻居的最佳属性构建
    if (neighbor['resource-id']) {
      return this.buildNeighborResourceIdXPath(neighbor, direction, element);
    }
    
    if (neighbor.text) {
      return this.buildNeighborTextXPath(neighbor.text, direction, element);
    }
    
    if (neighbor['content-desc']) {
      return this.buildNeighborContentDescXPath(neighbor['content-desc'], direction, element);
    }
    
    if (neighbor.class || neighbor.tag) {
      return this.buildNeighborClassXPath(neighbor.class || neighbor.tag, direction, element);
    }

    // 兜底方案
    const targetTag = element.tag || '*';
    return `//*/${direction === 'right' || direction === 'below' ? 'following::' : 'preceding::'}${targetTag}`;
  }

  /**
   * 构建方向性第N个元素 XPath
   */
  static buildDirectionalNthXPath(neighbor: any, direction: string, position: number, element: any): string {
    const baseXPath = this.buildDirectionalNearestXPath(neighbor, direction, element);
    return `(${baseXPath})[${position}]`;
  }

  /**
   * 构建兄弟元素索引 XPath
   */
  static buildSiblingIndexXPath(element: any, siblingIndex: number): string {
    const tag = element.tag || '*';
    const parent = element.parent;
    
    if (parent && parent['resource-id']) {
      return `//*[@resource-id='${parent['resource-id']}']/${tag}[${siblingIndex}]`;
    }
    
    if (parent && parent.class) {
      return `//${parent.class}/${tag}[${siblingIndex}]`;
    }
    
    // 兜底方案
    return `//*/${tag}[${siblingIndex}]`;
  }

  /**
   * 构建同类型兄弟索引 XPath
   */
  static buildSameTypeSiblingXPath(element: any, sameTypeIndex: number): string {
    const tag = element.tag || '*';
    const parent = element.parent;
    
    if (parent && parent['resource-id']) {
      return `//*[@resource-id='${parent['resource-id']}']/${tag}[${sameTypeIndex}]`;
    }
    
    return `//*/${tag}[${sameTypeIndex}]`;
  }

  /**
   * 构建多邻居组合 XPath
   */
  static buildMultiNeighborXPath(neighbors: any[], targetElement: any): string {
    if (neighbors.length === 0) {
      return `//*`;
    }

    // 取最具标识性的邻居组合
    const bestNeighbors = neighbors.slice(0, 2);
    const conditions: string[] = [];

    bestNeighbors.forEach(neighbor => {
      if (neighbor['resource-id']) {
        conditions.push(`@resource-id='${neighbor['resource-id']}'`);
      } else if (neighbor.text) {
        conditions.push(`text()='${neighbor.text.replace(/'/g, "\\'")}'`);
      } else if (neighbor['content-desc']) {
        conditions.push(`@content-desc='${neighbor['content-desc'].replace(/'/g, "\\'")}'`);
      }
    });

    if (conditions.length === 0) {
      return this.buildDirectionalNearestXPath(bestNeighbors[0], 'right', targetElement);
    }

    const targetTag = targetElement.tag || '*';
    return `//*[${conditions.join(' and ')}]/following::${targetTag}`;
  }

  /**
   * 构建距离约束的 XPath
   */
  static buildDistanceConstraintXPath(neighbor: any, distance: number, element: any): string {
    // XPath 本身不支持距离计算，这里构建一个基础 XPath
    // 实际距离验证需要在后续匹配时进行
    return this.buildDirectionalNearestXPath(neighbor, 'right', element);
  }
}