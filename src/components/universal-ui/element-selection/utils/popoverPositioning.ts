// src/components/universal-ui/element-selection/utils/popoverPositioning.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

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
  /** 当内容较大时给出的尺寸约束建议（用于 overlayStyle 的 maxWidth/maxHeight） */
  suggestedMaxSize?: Partial<PopoverDimensions>;
  /** 是否发生了尺寸钳制（提示 UI 层可开启滚动） */
  clamped?: boolean;
}

export type CoordinateSystem = 'viewport' | 'page';

export interface BoundaryRect {
  left: number;
  top: number;
  width: number;
  height: number;
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
      /** 碰撞检测：边界矩形（默认使用视口） */
      boundaryRect?: BoundaryRect;
      /** 坐标系：clickPosition 是 viewport(默认) 还是 page 坐标 */
      coordinateSystem?: CoordinateSystem;
      /** 定位策略：fixed(默认) 对应 viewport 坐标；absolute 对应 page 坐标 */
      strategy?: 'fixed' | 'absolute';
      /** 是否允许翻转（当首选放置超出边界时尝试其它方向）默认 true */
      enableFlip?: boolean;
      /** 是否允许位移修正（将位置约束到边界内）默认 true */
      enableShift?: boolean;
      /** 约束时的内边距 */
      padding?: number;
      /** 自动按空间选择最佳方向（默认 false） */
      autoPlacement?: boolean;
      /** 自动选向策略：按可视面积('area')或线性空间('linear')，默认 'area' */
      autoPlacementMode?: 'area' | 'linear';
      /** 受限时尽量贴合锚点（点击位置）居中对齐，默认 true */
      snapToAnchor?: boolean;
      /** 锚点贴合的最小内边距（默认等于 padding） */
      snapPadding?: number;
      /** 启用尺寸钳制，给出 maxWidth/maxHeight 建议（默认 true） */
      clampSize?: boolean;
      /** 尺寸钳制相对于边界的最大占比，默认 0.9 */
      clampRatio?: number;
    } = {}
  ): PopoverPlacement {
    
    const {
      preferredPlacement = 'top',
      margin = 12,
      avoidEdges = true,
      boundaryRect,
      coordinateSystem = 'viewport',
      strategy = 'fixed',
      enableFlip = true,
      enableShift = true,
      padding = margin,
      autoPlacement = false,
      autoPlacementMode = 'area',
      snapToAnchor = true,
      snapPadding,
      clampSize = true,
      clampRatio = 0.9
    } = options;

    // 获取视口信息
    const viewport = this.getViewportInfo();
    const boundary = boundaryRect ?? this.getDefaultBoundary(viewport);

    // 归一化点击坐标：当 clickPosition 是 page 坐标，且我们用 fixed 策略时，需要减去滚动
    const normalizedClick: Position = (coordinateSystem === 'page' && strategy === 'fixed')
      ? { x: clickPosition.x - viewport.scrollX, y: clickPosition.y - viewport.scrollY }
      : clickPosition;
    
    // 生成候选方向顺序：自动/优先级
    const placements = autoPlacement
      ? (autoPlacementMode === 'area'
          ? this.getPlacementsByVisibleArea(normalizedClick, popoverDimensions, boundary, preferredPlacement, margin)
          : this.getPlacementsByAvailableSpace(normalizedClick, popoverDimensions, boundary, preferredPlacement, margin))
      : this.getPriorityPlacements(preferredPlacement);
    
    for (const placement of placements) {
      const result = this.tryPlacement(
        normalizedClick,
        popoverDimensions,
        placement,
        margin,
        viewport
      );
      
      if (!result) continue;

      const within = this.isWithinBoundary(result.position, popoverDimensions, boundary);
      if (!avoidEdges || within) {
        // 若需要将位置限制在边界中
        let finalPos = within || !enableShift
          ? result.position
          : this.constrainToBoundary(result.position, popoverDimensions, boundary, padding);

        // 贴合锚点：尽量让锚点投影落在弹层中部
        if (enableShift && snapToAnchor) {
          finalPos = this.snapWithinBoundary(
            finalPos,
            popoverDimensions,
            boundary,
            normalizedClick,
            result.placement,
            snapPadding ?? padding
          );
        }

        // 基于最终位置计算更精准的建议最大尺寸（考虑与边界的实际可见交集 + 比例限制）
        const suggestedMax = clampSize
          ? this.getSuggestedMaxSizeAtPosition(popoverDimensions, boundary, finalPos, clampRatio, padding)
          : undefined;
        return {
          position: finalPos,
          placement: result.placement,
          offset: result.offset,
          suggestedMaxSize: suggestedMax?.maxSize,
          clamped: suggestedMax?.clamped
        };
      }
    }
    
    // 如果所有位置都不合适，强制使用首选位置并调整到视口内
    const fallbackResult = this.tryPlacement(
      normalizedClick,
      popoverDimensions,
      preferredPlacement,
      margin,
      viewport
    )!;
    let constrainedPosition = this.constrainToBoundary(
      fallbackResult.position,
      popoverDimensions,
      boundary,
      padding
    );
    if (snapToAnchor) {
      constrainedPosition = this.snapWithinBoundary(
        constrainedPosition,
        popoverDimensions,
        boundary,
        normalizedClick,
        preferredPlacement,
        snapPadding ?? padding
      );
    }
    // 基于最终位置计算更精准的建议最大尺寸
    const suggestedMax = clampSize
      ? this.getSuggestedMaxSizeAtPosition(popoverDimensions, boundary, constrainedPosition, clampRatio, padding)
      : undefined;
    
    return {
      position: constrainedPosition,
      placement: preferredPlacement,
      offset: fallbackResult.offset,
      suggestedMaxSize: suggestedMax?.maxSize,
      clamped: suggestedMax?.clamped
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

  /** 按可视面积排序方向 */
  private static getPlacementsByVisibleArea(
    click: Position,
    dims: PopoverDimensions,
    boundary: BoundaryRect,
    preferred: 'top' | 'bottom' | 'left' | 'right',
    margin: number
  ): Array<'top' | 'bottom' | 'left' | 'right'> {
    const placements: Array<'top'|'bottom'|'left'|'right'> = ['top','bottom','left','right'];
    const candidates = placements.map(p => {
      const pos = this.tryPlacement(click, dims, p, margin, {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      });
      if (!pos) return { p, area: -1, fits: false };
      const area = this.visibleArea(pos.position, dims, boundary);
      const fits = this.isWithinBoundary(pos.position, dims, boundary);
      return { p, area, fits };
    });
    const fits = candidates.filter(c => c.fits).sort((a,b)=> b.area - a.area);
    const notFits = candidates.filter(c=> !c.fits).sort((a,b)=> b.area - a.area);
    const ordered = [...fits, ...notFits];
    // 平分时 preferred 前置一位
    const idx = ordered.findIndex(c=> c.p === preferred);
    if (idx>0 && ordered[idx-1].area === ordered[idx].area) {
      const tmp = ordered[idx];
      ordered.splice(idx,1);
      ordered.splice(idx-1,0,tmp);
    }
    return ordered.map(o=>o.p);
  }

  /**
   * 根据边界内的可用空间排序方向：先可容纳者（fits=true），再按空间从大到小；
   * 若都不可容纳，则按空间从大到小。preferred 作为最终并列的兜底优先级。
   */
  private static getPlacementsByAvailableSpace(
    click: Position,
    dims: PopoverDimensions,
    boundary: BoundaryRect,
    preferred: 'top' | 'bottom' | 'left' | 'right',
    margin: number
  ): Array<'top' | 'bottom' | 'left' | 'right'> {
    const spaceTop = (click.y - boundary.top) - margin;
    const spaceBottom = (boundary.top + boundary.height - click.y) - margin;
    const spaceLeft = (click.x - boundary.left) - margin;
    const spaceRight = (boundary.left + boundary.width - click.x) - margin;

    const candidates: Array<{ p: 'top'|'bottom'|'left'|'right'; space: number; fits: boolean }>= [
      { p: 'top', space: spaceTop, fits: spaceTop >= dims.height },
      { p: 'bottom', space: spaceBottom, fits: spaceBottom >= dims.height },
      { p: 'left', space: spaceLeft, fits: spaceLeft >= dims.width },
      { p: 'right', space: spaceRight, fits: spaceRight >= dims.width },
    ];

    // 分两组：能容纳与不能容纳
    const fits = candidates.filter(c => c.fits).sort((a,b) => b.space - a.space);
    const notFits = candidates.filter(c => !c.fits).sort((a,b) => b.space - a.space);

    const ordered = [...fits, ...notFits];

    // 同空间时，preferred 排在前面
    const preferredIndex = ordered.findIndex(c => c.p === preferred);
    if (preferredIndex > 0) {
      // 稳定处理：若与前一个同分值，则把 preferred 前移一位
      const prev = ordered[preferredIndex - 1];
      if (prev && prev.space === ordered[preferredIndex].space) {
        const tmp = ordered[preferredIndex];
        ordered.splice(preferredIndex, 1);
        ordered.splice(preferredIndex - 1, 0, tmp);
      }
    }

    return ordered.map(o => o.p);
  }
  
  /**
   * 检查位置是否在视口内
   */
  private static isWithinBoundary(
    position: Position,
    dimensions: PopoverDimensions,
    boundary: BoundaryRect
  ): boolean {
    return (
      position.x >= boundary.left &&
      position.y >= boundary.top &&
      position.x + dimensions.width <= boundary.left + boundary.width &&
      position.y + dimensions.height <= boundary.top + boundary.height
    );
  }
  
  /**
   * 将位置限制在视口内
   */
  private static constrainToBoundary(
    position: Position,
    dimensions: PopoverDimensions,
    boundary: BoundaryRect,
    padding: number
  ): Position {
    return {
      x: Math.max(
        boundary.left + padding,
        Math.min(position.x, boundary.left + boundary.width - dimensions.width - padding)
      ),
      y: Math.max(
        boundary.top + padding,
        Math.min(position.y, boundary.top + boundary.height - dimensions.height - padding)
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

  /** 默认边界：视口矩形（相对于 viewport 坐标） */
  private static getDefaultBoundary(viewport: ViewportInfo): BoundaryRect {
    return { left: 0, top: 0, width: viewport.width, height: viewport.height };
  }

  /** 计算候选位置的可视面积（与边界相交的面积） */
  private static visibleArea(position: Position, dims: PopoverDimensions, boundary: BoundaryRect): number {
    const rect = { left: position.x, top: position.y, right: position.x + dims.width, bottom: position.y + dims.height };
    const b = { left: boundary.left, top: boundary.top, right: boundary.left + boundary.width, bottom: boundary.top + boundary.height };
    const xOverlap = Math.max(0, Math.min(rect.right, b.right) - Math.max(rect.left, b.left));
    const yOverlap = Math.max(0, Math.min(rect.bottom, b.bottom) - Math.max(rect.top, b.top));
    return xOverlap * yOverlap;
  }

  /**
   * 在给定的最终位置上，计算建议的最大尺寸（考虑与边界的交集，同时不超过边界比例限制）。
   * 返回的 maxSize 供 UI 使用于 overlayStyle 的 maxWidth/maxHeight，从而在内容过大时启用滚动。
   */
  private static getSuggestedMaxSizeAtPosition(
    dims: PopoverDimensions,
    boundary: BoundaryRect,
    position: Position,
    ratio: number,
    padding: number
  ): { maxSize: Partial<PopoverDimensions>; clamped: boolean } | undefined {
    // 1) 边界比例限制（整体上限）
    const ratioMaxW = Math.max(0, boundary.width * ratio - padding * 2);
    const ratioMaxH = Math.max(0, boundary.height * ratio - padding * 2);

    // 2) 与边界的实际可见交集尺寸（局部上限）
    const left = position.x;
    const top = position.y;
    const right = position.x + dims.width;
    const bottom = position.y + dims.height;
    const bLeft = boundary.left + padding;
    const bTop = boundary.top + padding;
    const bRight = boundary.left + boundary.width - padding;
    const bBottom = boundary.top + boundary.height - padding;

    const interW = Math.max(0, Math.min(right, bRight) - Math.max(left, bLeft));
    const interH = Math.max(0, Math.min(bottom, bBottom) - Math.max(top, bTop));

    // 3) 取三者最小：原始尺寸、比例上限、交集上限
    const maxW = Math.min(dims.width, ratioMaxW, interW);
    const maxH = Math.min(dims.height, ratioMaxH, interH);
    const clamped = maxW < dims.width || maxH < dims.height;
    // 若无需钳制也返回空对象，保持类型一致
    return { maxSize: { width: maxW, height: maxH }, clamped };
  }

  /** 在边界内尽量让锚点投影落在弹层中部（贴合锚点） */
  private static snapWithinBoundary(
    position: Position,
    dims: PopoverDimensions,
    boundary: BoundaryRect,
    anchor: Position,
    placement: 'top'|'bottom'|'left'|'right',
    padding: number
  ): Position {
    if (placement === 'top' || placement === 'bottom') {
      const idealX = anchor.x - dims.width/2;
      const x = Math.max(boundary.left + padding, Math.min(idealX, boundary.left + boundary.width - dims.width - padding));
      return { x, y: position.y };
    } else {
      const idealY = anchor.y - dims.height/2;
      const y = Math.max(boundary.top + padding, Math.min(idealY, boundary.top + boundary.height - dims.height - padding));
      return { x: position.x, y };
    }
  }

  /** 建议的最大尺寸（用于内容 maxWidth/maxHeight 与滚动） */
  private static getSuggestedMaxSize(
    dims: PopoverDimensions,
    boundary: BoundaryRect,
    ratio: number,
    padding: number
  ): { maxSize: Partial<PopoverDimensions>; clamped: boolean } | undefined {
    const maxW = Math.max(0, boundary.width * ratio - padding * 2);
    const maxH = Math.max(0, boundary.height * ratio - padding * 2);
    const clamped = dims.width > maxW || dims.height > maxH;
    if (!clamped) return { maxSize: {}, clamped: false };
    return { maxSize: { width: Math.min(dims.width, maxW), height: Math.min(dims.height, maxH) }, clamped: true };
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
    /** 碰撞检测边界（不传则使用视口） */
    boundaryRect?: BoundaryRect;
    /** 坐标系：clickPosition 来源（默认 viewport） */
    coordinateSystem?: CoordinateSystem;
    /** 定位策略（默认 fixed） */
    strategy?: 'fixed' | 'absolute';
    /** 是否允许翻转（默认 true）*/
    enableFlip?: boolean;
    /** 是否允许位移修正（默认 true）*/
    enableShift?: boolean;
    /** 约束时的内边距（默认等于 margin）*/
    padding?: number;
    /** 自动按空间选择最佳方向（默认 false） */
    autoPlacement?: boolean;
    /** 自动选向策略：按可视面积('area')或线性空间('linear')，默认 'area' */
    autoPlacementMode?: 'area' | 'linear';
    /** 受限时尽量贴合锚点（点击位置）居中对齐，默认 true */
    snapToAnchor?: boolean;
    /** 锚点贴合的最小内边距（默认等于 padding） */
    snapPadding?: number;
    /** 启用尺寸钳制，给出 maxWidth/maxHeight 建议（默认 true） */
    clampSize?: boolean;
    /** 尺寸钳制相对于边界的最大占比，默认 0.9 */
    clampRatio?: number;
  }
): PopoverPlacement | null {
  
  if (!clickPosition) return null;
  
  const {
    preferredPlacement = 'top',
    popoverSize = { width: 200, height: 120 },
    margin = 12,
    boundaryRect,
    coordinateSystem = 'viewport',
    strategy = 'fixed',
    enableFlip = true,
    enableShift = true,
    padding,
    autoPlacement,
    autoPlacementMode,
    snapToAnchor,
    snapPadding,
    clampSize,
    clampRatio
  } = options || {};
  
  return PopoverPositionCalculator.calculateBestPosition(
    clickPosition,
    popoverSize,
    {
      preferredPlacement,
      margin,
      boundaryRect,
      coordinateSystem,
      strategy,
      enableFlip,
      enableShift,
      padding,
      autoPlacement,
      autoPlacementMode,
      snapToAnchor,
      snapPadding,
      clampSize,
      clampRatio,
    }
  );
}