/**
 * 拖拽行为优化工具
 * 用于精确控制拖拽区域和事件传播
 */

export interface DragBehaviorConfig {
  /** 可拖拽区域选择器 */
  draggableSelector: string;
  /** 禁止拖拽区域选择器 */
  noDragSelectors: readonly string[];
  /** 拖拽灵敏度阈值（像素） */
  dragThreshold?: number;
  /** 是否启用拖拽预览 */
  enableDragPreview?: boolean;
}

export class DragBehaviorOptimizer {
  private config: Required<DragBehaviorConfig>;

  constructor(config: DragBehaviorConfig) {
    this.config = {
      draggableSelector: config.draggableSelector,
      noDragSelectors: [...config.noDragSelectors], // 转换为可变数组
      dragThreshold: config.dragThreshold || 3,
      enableDragPreview: config.enableDragPreview ?? true
    };
  }

  /**
   * 检查目标元素是否应该启用拖拽
   */
  shouldEnableDrag(target: Element): boolean {
    // 检查是否在禁止拖拽区域
    for (const selector of this.config.noDragSelectors) {
      if (target.closest(selector)) {
        return false;
      }
    }

    // 检查是否在可拖拽区域
    return !!target.closest(this.config.draggableSelector);
  }

  /**
   * 为元素添加拖拽行为优化
   */
  optimizeElement(element: HTMLElement): void {
    // 为可拖拽区域添加样式和行为提示
    const draggableAreas = element.querySelectorAll(this.config.draggableSelector);
    draggableAreas.forEach(area => {
      if (area instanceof HTMLElement) {
        // 添加拖拽样式类
        area.classList.add('drag-optimized-area');
        
        // 设置拖拽相关样式
        area.style.cursor = 'move';
        area.style.userSelect = 'none';
        
        // 添加拖拽状态反馈
        area.addEventListener('mousedown', (e) => {
          if (this.shouldEnableDrag(e.target as Element)) {
            area.classList.add('drag-active');
          }
        });
        
        area.addEventListener('mouseup', () => {
          area.classList.remove('drag-active');
        });
        
        area.addEventListener('mouseleave', () => {
          area.classList.remove('drag-active');
        });
      }
    });

    // 为禁止拖拽区域添加保护
    this.config.noDragSelectors.forEach(selector => {
      const noDragAreas = element.querySelectorAll(selector);
      noDragAreas.forEach(area => {
        if (area instanceof HTMLElement) {
          area.classList.add('drag-protected-area');
          area.style.cursor = 'default';
          
          // 阻止拖拽事件传播
          area.addEventListener('mousedown', (e) => {
            e.stopPropagation();
          });
        }
      });
    });
  }

  /**
   * 创建拖拽行为样式
   */
  injectStyles(): void {
    const styleId = 'drag-behavior-optimizer-styles';
    
    // 避免重复注入
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 拖拽优化区域样式 */
      .drag-optimized-area {
        position: relative;
        transition: background-color 0.2s ease;
      }
      
      .drag-optimized-area:hover {
        background-color: rgba(24, 144, 255, 0.02);
      }
      
      .drag-optimized-area.drag-active {
        background-color: rgba(24, 144, 255, 0.06);
        box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.2);
      }
      
      /* 受保护区域样式 */
      .drag-protected-area {
        pointer-events: auto;
        z-index: 1;
        position: relative;
      }
      
      .drag-protected-area * {
        cursor: inherit !important;
      }
      
      /* 拖拽状态指示 */
      .react-grid-item.react-draggable-dragging .drag-optimized-area {
        background-color: rgba(24, 144, 255, 0.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      /* 防止拖拽时的文本选择 */
      .react-grid-item.react-draggable-dragging {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 移除样式
   */
  removeStyles(): void {
    const style = document.getElementById('drag-behavior-optimizer-styles');
    if (style) {
      style.remove();
    }
  }
}

/**
 * 创建拖拽行为优化器
 */
export function createDragBehaviorOptimizer(config: DragBehaviorConfig): DragBehaviorOptimizer {
  return new DragBehaviorOptimizer(config);
}

/**
 * 预定义的拖拽配置
 */
export const DRAG_CONFIGS = {
  /** 面板标题栏拖拽配置 */
  PANEL_HEADER: {
    draggableSelector: '.panel-header-draggable, .ant-card-head',
    noDragSelectors: [
      '.panel-header-controls',
      '.ant-card-extra',
      'button',
      'input',
      'select',
      'textarea',
      '.ant-btn',
      '.ant-input',
      '.ant-select',
      '.panel-content-area'
    ],
    dragThreshold: 3,
    enableDragPreview: true
  },
  
  /** 工具栏拖拽配置 */
  TOOLBAR: {
    draggableSelector: '.toolbar-drag-handle',
    noDragSelectors: [
      '.toolbar-no-drag',
      'button',
      'input',
      'select',
      '.ant-btn',
      '.ant-dropdown'
    ],
    dragThreshold: 5,
    enableDragPreview: true
  }
} as const;