// src/types/action-types.ts
// module: types | layer: types | role: 前端操作类型定义
// summary: 前后端一致的操作类型定义

export type ActionTypeId = 
  | 'click'
  | 'long_press'
  | 'input'
  | 'swipe_up'
  | 'swipe_down'
  | 'swipe_left'
  | 'swipe_right'
  | 'scroll'
  | 'wait';

export interface ActionParams {
  // 输入操作参数
  text?: string;
  clear_before?: boolean;
  
  // 滑动/长按/等待/滚动操作参数  
  distance?: number;
  duration?: number;
  
  // 滚动操作参数
  target_x?: number;
  target_y?: number;
  
  // 新增参数：滑动方向控制
  direction?: 'up' | 'down' | 'left' | 'right';
  
  // 新增参数：执行次数
  repeat_count?: number;
  
  // 新增参数：间隔控制
  wait_between?: boolean;
  wait_duration?: number;
  
  // 点击操作参数
  click_type?: 'single' | 'double';
  double_click_interval?: number;
}

export interface ActionType {
  type: ActionTypeId;
  params?: ActionParams;
}

export interface ActionConfig {
  icon: string;
  label: string;
  color: string;
  description: string;
  hasParams: boolean;
  defaultParams?: ActionParams;
}

export const ACTION_CONFIGS: Record<ActionTypeId, ActionConfig> = {
  click: {
    icon: '👆',
    label: '点击',
    color: '#1890ff',
    description: '单击元素',
    hasParams: true,
    defaultParams: { click_type: 'single', repeat_count: 1, wait_between: false },
  },
  long_press: {
    icon: '🔥',
    label: '长按',
    color: '#fa8c16',
    description: '长按元素',
    hasParams: true,
    defaultParams: { duration: 2000 },
  },
  input: {
    icon: '✏️',
    label: '输入',
    color: '#52c41a',
    description: '输入文本内容',
    hasParams: true,
    defaultParams: { text: '', clear_before: false },
  },
  swipe_up: {
    icon: '⬆️',
    label: '上滑',
    color: '#722ed1',
    description: '向上滑动手势',
    hasParams: true,
    defaultParams: { distance: 200, duration: 300, direction: 'up', repeat_count: 1, wait_between: false },
  },
  swipe_down: {
    icon: '⬇️',
    label: '下滑',
    color: '#722ed1',
    description: '向下滑动手势',
    hasParams: true,
    defaultParams: { distance: 200, duration: 300, direction: 'down', repeat_count: 1, wait_between: false },
  },
  swipe_left: {
    icon: '⬅️',
    label: '左滑',
    color: '#722ed1',
    description: '向左滑动手势',
    hasParams: true,
    defaultParams: { distance: 200, duration: 300, direction: 'left', repeat_count: 1, wait_between: false },
  },
  swipe_right: {
    icon: '➡️',
    label: '右滑',
    color: '#722ed1',
    description: '向右滑动手势',
    hasParams: true,
    defaultParams: { distance: 200, duration: 300, direction: 'right', repeat_count: 1, wait_between: false },
  },
  scroll: {
    icon: '🔄',
    label: '滚动',
    color: '#13c2c2',
    description: '滚动到指定位置',
    hasParams: true,
    defaultParams: { target_x: 0, target_y: 0, duration: 500 },
  },
  wait: {
    icon: '⏳',
    label: '等待',
    color: '#595959',
    description: '等待指定时间',
    hasParams: true,
    defaultParams: { duration: 1000 },
  },
};

export const DEFAULT_ACTION: ActionType = {
  type: 'click',
};

/**
 * 创建操作类型
 */
export const createActionType = (type: ActionTypeId, params?: ActionParams): ActionType => {
  const config = ACTION_CONFIGS[type];
  return {
    type,
    params: params || config.defaultParams,
  };
};

/**
 * 获取操作类型的显示配置
 */
export const getActionConfig = (type: ActionTypeId): ActionConfig => {
  return ACTION_CONFIGS[type];
};

/**
 * 验证操作参数
 */
export const validateActionParams = (action: ActionType): string | null => {
  const { type, params } = action;
  
  switch (type) {
    case 'input':
      if (!params?.text?.trim()) {
        return '请输入要输入的文本内容';
      }
      break;
      
    case 'scroll':
      if (params?.target_x === undefined || params?.target_y === undefined) {
        return '请设置滚动目标位置';
      }
      break;
      
    case 'wait':
      if (!params?.duration || params.duration <= 0) {
        return '请设置有效的等待时间';
      }
      break;
      
    default:
      break;
  }
  
  return null;
};

/**
 * 格式化操作描述
 */
export const formatActionDescription = (action: ActionType): string => {
  const { type, params } = action;
  const config = ACTION_CONFIGS[type];
  
  switch (type) {
    case 'long_press':
      return `长按元素${(params?.duration || 2000) / 1000}秒`;
    case 'input':
      const clearText = params?.clear_before ? '清空后' : '';
      return `${clearText}输入: ${params?.text || ''}`;
    case 'swipe_up':
      return `向上滑动${params?.distance || 200}像素`;
    case 'swipe_down':
      return `向下滑动${params?.distance || 200}像素`;
    case 'swipe_left':
      return `向左滑动${params?.distance || 200}像素`;
    case 'swipe_right':
      return `向右滑动${params?.distance || 200}像素`;
    case 'scroll':
      return `滚动到位置 (${params?.target_x || 0}, ${params?.target_y || 0})`;
    case 'wait':
      return `等待${(params?.duration || 1000) / 1000}秒`;
    default:
      return config.description;
  }
};