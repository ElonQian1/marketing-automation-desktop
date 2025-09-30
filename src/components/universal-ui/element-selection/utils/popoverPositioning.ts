/**
 * 气泡定位计算工具
 * 负责计算ElementSelectionPopover的最佳显示位置
 */

export interface Position {
  x: number;
  y: number;
}

export interface PopoverDimensions {
  width: number;
  height: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

export interface PopoverPlacement {
  position: Position;
  placement: 'top' | 'bottom' | 'left' | 'right';
  offset: Position;
}

/**
 * 气泡定位计算器
 */
export class PopoverPositionCalculator {
  
  /**
   * 计算气泡的最佳位置
   * @param clickPosition 鼠标点击位置（页面绝对坐标）
   * @param popoverDimensions 气泡尺寸
   * @param options 定位选项
   * @returns 计算结果
   */
  static calculateBestPosition(
    clickPosition: Position,
    popoverDimensions: PopoverDimensions = { width: 200, height: 120 },
    options: {
      preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
      margin?: number;
      avoidEdges?: boolean;
    } = {}
  ): PopoverPlacement {
    
    const {
      preferredPlacement = 'top',
      margin = 12,
      avoidEdges = true
    } = options;

    // 获取视口信息
    const viewport = this.getViewportInfo();
    
    // 尝试不同的放置位置
    const placements = this.getPriorityPlacements(preferredPlacement);
    
    for (const placement of placements) {
      const result = this.tryPlacement(
        clickPosition,
        popoverDimensions,
        placement,
        margin,
        viewport
      );
      
      if (result && (!avoidEdges || this.isWithinViewport(result.position, popoverDimensions, viewport))) {
        return {
          position: result.position,
          placement: result.placement,
          offset: result.offset
        };
      }
    }
    
    // 如果所有位置都不合适，强制使用首选位置并调整到视口内
    const fallbackResult = this.tryPlacement(
      clickPosition,
      popoverDimensions,
      preferredPlacement,
      margin,
      viewport
    )!;
    
    const constrainedPosition = this.constrainToViewport(
      fallbackResult.position,
      popoverDimensions,
      viewport,
      margin
    );
    
    return {
      position: constrainedPosition,
      placement: preferredPlacement,
      offset: fallbackResult.offset
    };
  }
  
  /**
   * 尝试在指定位置放置气泡
   */
  private static tryPlacement(
    clickPosition: Position,
    popoverDimensions: PopoverDimensions,
    placement: 'top' | 'bottom' | 'left' | 'right',
    margin: number,
    viewport: ViewportInfo
  ): { position: Position; placement: typeof placement; offset: Position } | null {
    
    let position: Position;
    let offset: Position;
    
    switch (placement) {
      case 'top':
        position = {
          x: clickPosition.x - popoverDimensions.width / 2,
          y: clickPosition.y - popoverDimensions.height - margin
        };
        offset = {
          x: popoverDimensions.width / 2,
          y: popoverDimensions.height + margin
        };
        break;
        
      case 'bottom':
        position = {
          x: clickPosition.x - popoverDimensions.width / 2,
          y: clickPosition.y + margin
        };
        offset = {
          x: popoverDimensions.width / 2,
          y: -margin
        };
        break;
        
      case 'left':
        position = {
          x: clickPosition.x - popoverDimensions.width - margin,
          y: clickPosition.y - popoverDimensions.height / 2
        };
        offset = {
          x: popoverDimensions.width + margin,
          y: popoverDimensions.height / 2
        };
        break;
        
      case 'right':
        position = {
          x: clickPosition.x + margin,
          y: clickPosition.y - popoverDimensions.height / 2
        };
        offset = {
          x: -margin,
          y: popoverDimensions.height / 2
        };
        break;
        
      default:
        return null;
    }
    
    return { position, placement, offset };
  }
  
  /**
   * 获取放置优先级顺序
   */
  private static getPriorityPlacements(preferred: 'top' | 'bottom' | 'left' | 'right'): Array<'top' | 'bottom' | 'left' | 'right'> {
    const all: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
    return [preferred, ...all.filter(p => p !== preferred)];
  }
  
  /**
   * 检查位置是否在视口内
   */
  private static isWithinViewport(
    position: Position,
    dimensions: PopoverDimensions,
    viewport: ViewportInfo
  ): boolean {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x + dimensions.width <= viewport.width &&
      position.y + dimensions.height <= viewport.height
    );
  }
  
  /**
   * 将位置限制在视口内
   */
  private static constrainToViewport(
    position: Position,
    dimensions: PopoverDimensions,
    viewport: ViewportInfo,
    margin: number
  ): Position {
    return {
      x: Math.max(
        margin,
        Math.min(position.x, viewport.width - dimensions.width - margin)
      ),
      y: Math.max(
        margin,
        Math.min(position.y, viewport.height - dimensions.height - margin)
      )
    };
  }
  
  /**
   * 获取视口信息
   */
  private static getViewportInfo(): ViewportInfo {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  }
}

/**
 * React Hook：智能气泡定位
 */
export function useSmartPopoverPosition(
  clickPosition: Position | null,
  options?: {
    preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
    popoverSize?: PopoverDimensions;
    margin?: number;
  }
): PopoverPlacement | null {
  
  if (!clickPosition) return null;
  
  const {
    preferredPlacement = 'top',
    popoverSize = { width: 200, height: 120 },
    margin = 12
  } = options || {};
  
  return PopoverPositionCalculator.calculateBestPosition(
    clickPosition,
    popoverSize,
    { preferredPlacement, margin }
  );
}