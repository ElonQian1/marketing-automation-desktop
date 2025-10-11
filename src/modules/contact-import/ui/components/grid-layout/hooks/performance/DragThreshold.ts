// src/modules/contact-import/ui/components/grid-layout/hooks/performance/DragThreshold.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 拖拽阈值工具
 * 用于区分点击和拖拽意图
 */

export interface DragThresholdConfig {
  /** 拖拽阈值，单位像素 */
  threshold: number;
  /** 时间阈值，单位毫秒 */
  timeThreshold?: number;
}

export interface DragThresholdState {
  isDragging: boolean;
  startPosition: { x: number; y: number } | null;
  startTime: number | null;
  totalDistance: number;
}

export class DragThreshold {
  private config: Required<DragThresholdConfig>;
  private state: DragThresholdState;

  constructor(config: DragThresholdConfig) {
    this.config = {
      threshold: config.threshold,
      timeThreshold: config.timeThreshold || 100
    };
    
    this.state = {
      isDragging: false,
      startPosition: null,
      startTime: null,
      totalDistance: 0
    };
  }

  /**
   * 开始拖拽检测
   */
  start(x: number, y: number): void {
    this.state = {
      isDragging: false,
      startPosition: { x, y },
      startTime: Date.now(),
      totalDistance: 0
    };
  }

  /**
   * 更新位置并检测是否达到拖拽阈值
   */
  update(x: number, y: number): boolean {
    if (!this.state.startPosition) return false;

    const deltaX = x - this.state.startPosition.x;
    const deltaY = y - this.state.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    this.state.totalDistance = distance;

    // 检查是否超过拖拽阈值
    if (!this.state.isDragging && distance >= this.config.threshold) {
      this.state.isDragging = true;
      return true;
    }

    return this.state.isDragging;
  }

  /**
   * 检查是否为点击（未达到拖拽阈值）
   */
  isClick(): boolean {
    if (!this.state.startPosition || !this.state.startTime) return false;

    const timeElapsed = Date.now() - this.state.startTime;
    const isWithinTimeThreshold = timeElapsed <= this.config.timeThreshold;
    const isWithinDistanceThreshold = this.state.totalDistance < this.config.threshold;

    return isWithinTimeThreshold && isWithinDistanceThreshold;
  }

  /**
   * 获取当前状态
   */
  getState(): Readonly<DragThresholdState> {
    return { ...this.state };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      isDragging: false,
      startPosition: null,
      startTime: null,
      totalDistance: 0
    };
  }

  /**
   * 获取移动距离
   */
  getDistance(): number {
    return this.state.totalDistance;
  }

  /**
   * 检查是否正在拖拽
   */
  isDragging(): boolean {
    return this.state.isDragging;
  }
}

/**
 * 创建拖拽阈值检测器
 */
export function createDragThreshold(config: DragThresholdConfig): DragThreshold {
  return new DragThreshold(config);
}