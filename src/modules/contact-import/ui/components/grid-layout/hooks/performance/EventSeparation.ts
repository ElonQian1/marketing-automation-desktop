/**
 * 事件分离工具
 * 用于精确控制事件传播和分离功能区域
 */

export interface EventSeparationConfig {
  /** 拖拽手柄选择器 */
  dragHandleSelector?: string;
  /** 拖拽手柄类名 */
  dragHandleClass?: string;
  /** 阻止拖拽的区域选择器 */
  noDragSelector?: string;
  /** 阻止拖拽的区域类名 */
  noDragClass?: string;
}

export class EventSeparation {
  private config: EventSeparationConfig;

  constructor(config: EventSeparationConfig = {}) {
    this.config = {
      dragHandleSelector: '.drag-handle',
      dragHandleClass: 'drag-handle',
      noDragSelector: '.no-drag',
      noDragClass: 'no-drag',
      ...config
    };
  }

  /**
   * 检查元素是否为拖拽手柄
   */
  isDragHandle(element: Element): boolean {
    // 检查元素本身
    if (this.config.dragHandleClass && element.classList.contains(this.config.dragHandleClass)) {
      return true;
    }

    // 检查最近的拖拽手柄祖先
    if (this.config.dragHandleSelector) {
      return element.closest(this.config.dragHandleSelector) !== null;
    }

    return false;
  }

  /**
   * 检查元素是否在禁止拖拽区域
   */
  isNoDragZone(element: Element): boolean {
    // 检查元素本身
    if (this.config.noDragClass && element.classList.contains(this.config.noDragClass)) {
      return true;
    }

    // 检查最近的禁止拖拽祖先
    if (this.config.noDragSelector) {
      return element.closest(this.config.noDragSelector) !== null;
    }

    return false;
  }

  /**
   * 检查事件是否应该启用拖拽
   */
  shouldEnableDrag(event: MouseEvent): boolean {
    const target = event.target as Element;
    
    // 如果在禁止拖拽区域，不允许拖拽
    if (this.isNoDragZone(target)) {
      return false;
    }

    // 如果有拖拽手柄配置，必须在拖拽手柄上
    if (this.config.dragHandleSelector || this.config.dragHandleClass) {
      return this.isDragHandle(target);
    }

    // 默认允许拖拽
    return true;
  }

  /**
   * 获取最近的拖拽手柄元素
   */
  findDragHandle(element: Element): Element | null {
    if (this.config.dragHandleClass && element.classList.contains(this.config.dragHandleClass)) {
      return element;
    }

    if (this.config.dragHandleSelector) {
      return element.closest(this.config.dragHandleSelector);
    }

    return null;
  }

  /**
   * 阻止事件传播（仅在需要时）
   */
  conditionalStopPropagation(event: MouseEvent, condition: boolean): void {
    if (condition) {
      event.stopPropagation();
    }
  }

  /**
   * 阻止默认行为（仅在需要时）
   */
  conditionalPreventDefault(event: MouseEvent, condition: boolean): void {
    if (condition) {
      event.preventDefault();
    }
  }

  /**
   * 安全的事件处理包装器
   */
  wrapEventHandler<T extends Event>(
    handler: (event: T) => void,
    shouldHandle: (event: T) => boolean
  ): (event: T) => void {
    return (event: T) => {
      if (shouldHandle(event)) {
        handler(event);
      }
    };
  }
}

/**
 * 创建事件分离器
 */
export function createEventSeparation(config?: EventSeparationConfig): EventSeparation {
  return new EventSeparation(config);
}

/**
 * 预定义的事件分离配置
 */
export const PRESET_CONFIGS = {
  /** 工具栏配置 */
  toolbar: {
    dragHandleClass: 'toolbar-drag-handle',
    noDragClass: 'toolbar-no-drag'
  },
  
  /** 面板配置 */
  panel: {
    dragHandleClass: 'panel-drag-handle',
    noDragClass: 'panel-no-drag'
  },
  
  /** 弹窗配置 */
  modal: {
    dragHandleSelector: '.modal-header',
    noDragSelector: '.modal-body, .modal-footer'
  }
} as const;