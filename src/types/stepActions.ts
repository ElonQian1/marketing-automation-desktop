// src/types/stepActions.ts
// module: types | layer: domain | role: 步骤动作系统类型定义
// summary: 步骤卡片动作切换系统的核心类型定义

export type ActionType = 
  | 'tap'
  | 'doubleTap' 
  | 'longPress'
  | 'swipe'
  | 'type'
  | 'wait'
  | 'back'
  | 'keyevent'
  | 'launch_app'; // ✅ 新增：启动应用动作

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export type ExecutionMode = 'matchOnly' | 'matchAndExecute';

export type StepStatus = 
  | 'idle' 
  | 'matching' 
  | 'ready' 
  | 'executing' 
  | 'verifying' 
  | 'success' 
  | 'failed';

// 🔥 XML Dump 模式（循环场景优化）
export type DumpMode = 
  | 'always'      // 每次都重新 dump
  | 'auto'        // 智能推断（根据步骤类型和上下文自动决定）
  | 'loop_entry'  // 仅循环入口 dump（每次迭代开始时）
  | 'first_only'  // 仅初次 dump（第一次迭代的第一个步骤）
  | 'skip';       // 始终跳过 dump

// 通用执行参数
export interface StepActionCommon {
  useSelector: boolean;               // 选择器优先
  allowAbsolute: boolean;            // 允许坐标兖底
  confidenceThreshold: number;       // 0~1, 默认0.8
  retries: number;                   // 兖底重试次数
  retryBackoffMs: number;            // 兖底退避
  verifyAfter: boolean;              // 执行后验证
  postDelayMs?: number;              // 执行后延时
  
  // 🔥 XML dump 控制（循环场景优化）
  skipFreshDump?: boolean;           // [已废弃] 请使用 dumpMode
  dumpMode?: DumpMode;               // dump模式：always/first_only/skip
  dumpCacheTtlMs?: number;           // dump缓存有效期，默认5000ms
  
  // 🎯 页面跳转标记（用于智能推断）
  mayChangePageAfter?: boolean;      // 此操作可能导致页面跳转（如点击“下一步”按钮）
}

// 点击类动作参数
export interface TapLikeParams {
  x?: number; 
  y?: number;                        // 绝对坐标兜底
  offsetX?: number; 
  offsetY?: number;                  // 相对元素偏移
  pressDurationMs?: number;          // longPress专用
}

// 滑动动作参数
export interface SwipeParams {
  direction: SwipeDirection;
  distance?: number;                 // 像素距离
  durationMs?: number;               // 滑动耗时
  startFrom?: 'center' | 'element';  // 起点参考
}

// 输入动作参数
export interface TypeParams {
  text: string;
  secure?: boolean;                  // 密码场景遮掩日志
  clearBefore?: boolean;
  keyboardEnter?: boolean;
}

// 等待动作参数
export interface WaitParams { 
  waitMs: number; 
}

// 返回动作参数（无额外参数）
export interface BackParams {}

// 系统按键动作参数
export interface KeyEventParams {
  keyCode: number; // Android KeyEvent code
}

// ✅ 新增：启动应用参数
export interface LaunchAppParams {
  packageName: string;
  activityName?: string;
  waitAfterLaunch?: number;
  stopBeforeLaunch?: boolean;
}

// 动作参数联合类型
export type StepActionParams = 
  | { type: 'tap'; params: TapLikeParams & StepActionCommon }
  | { type: 'doubleTap'; params: TapLikeParams & StepActionCommon }
  | { type: 'longPress'; params: TapLikeParams & StepActionCommon }
  | { type: 'swipe'; params: SwipeParams & StepActionCommon }
  | { type: 'type'; params: { text: string; clearBefore?: boolean; keyboardEnter?: boolean } & StepActionCommon }
  | { type: 'wait'; params: { waitMs: number } }
  | { type: 'back'; params: StepActionCommon }
  | { type: 'keyevent'; params: { keyCode: number } & StepActionCommon }
  | { type: 'launch_app'; params: LaunchAppParams }; // ✅ 新增

// 匹配结果
export interface MatchResult {
  score: number;
  confidence: number;
  summary: string;
  elementRect?: { x: number; y: number; width: number; height: number };
}

// 增强的步骤卡片模型
export interface StepCardModel {
  id: string;
  name: string;
  selectorId: string;                // element_element_64...
  currentAction: StepActionParams;
  common: StepActionCommon;
  lastMatch?: MatchResult;
  status: StepStatus;
  version: string;                   // 便于后续迁移
}

// 默认值常量
export const DEFAULT_ACTION_COMMON: StepActionCommon = {
  useSelector: true,
  allowAbsolute: true,
  confidenceThreshold: 0.8,
  retries: 1,
  retryBackoffMs: 250,
  verifyAfter: false,
  postDelayMs: 0,
};

export const DEFAULT_TAP_PARAMS: TapLikeParams = {
  x: undefined,
  y: undefined,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_LONGPRESS_PARAMS: TapLikeParams = {
  ...DEFAULT_TAP_PARAMS,
  pressDurationMs: 450,
};

export const DEFAULT_SWIPE_PARAMS: SwipeParams = {
  direction: 'down',
  distance: 0.6,
  durationMs: 250,
  startFrom: 'element',
};

export const DEFAULT_TYPE_PARAMS: TypeParams = {
  text: '',
  secure: false,
  clearBefore: false,
  keyboardEnter: false,
};

export const DEFAULT_WAIT_PARAMS: WaitParams = {
  waitMs: 500,
};

export const DEFAULT_BACK_PARAMS: BackParams = {};

export const DEFAULT_KEYEVENT_PARAMS: KeyEventParams = {
  keyCode: 4, // 默认返回键
};

// 动作类型标签映射
export const ACTION_LABELS: Record<ActionType, string> = {
  tap: '点选 Tap',
  doubleTap: '双击 Double Tap', 
  longPress: '长按 Long Press',
  swipe: '滑动 Swipe',
  type: '输入 Type',
  wait: '等待 Wait',
  back: '返回 Back',
  keyevent: '按键 KeyEvent',
  launch_app: '启动应用 Launch App', // ✅ 新增
};

// 获取默认动作参数
export function getDefaultActionParams(actionType: ActionType): StepActionParams {
  switch (actionType) {
    case 'tap':
      return { type: 'tap', params: DEFAULT_TAP_PARAMS };
    case 'doubleTap':
      return { type: 'doubleTap', params: DEFAULT_TAP_PARAMS };
    case 'longPress':
      return { type: 'longPress', params: DEFAULT_LONGPRESS_PARAMS };
    case 'swipe':
      return { type: 'swipe', params: DEFAULT_SWIPE_PARAMS };
    case 'type':
      return { type: 'type', params: DEFAULT_TYPE_PARAMS };
    case 'wait':
      return { type: 'wait', params: DEFAULT_WAIT_PARAMS };
    case 'back':
      return { type: 'back', params: DEFAULT_BACK_PARAMS };
    case 'keyevent':
      return { type: 'keyevent', params: DEFAULT_KEYEVENT_PARAMS };
    case 'launch_app':
      return { type: 'launch_app', params: { packageName: '' } }; // ✅ 新增 默认值
    default:
      return { type: 'tap', params: DEFAULT_TAP_PARAMS };
  }
}

// 校验动作参数
export function validateActionParams(actionParams: StepActionParams): { valid: boolean; message?: string } {
  switch (actionParams.type) {
    case 'type':
      if (!actionParams.params.text?.trim()) {
        return { valid: false, message: '请输入要发送的文本' };
      }
      break;
    case 'wait':
      if (actionParams.params.waitMs < 100) {
        return { valid: false, message: '等待时间不能少于100ms' };
      }
      break;
    case 'swipe':
      if (actionParams.params.distance <= 0 || actionParams.params.distance > 1) {
        return { valid: false, message: '滑动距离必须在0-1之间' };
      }
      break;
    case 'tap':
    case 'doubleTap':
    case 'longPress':
      // 点击类动作在useSelector=false且无坐标时需要校验
      // 这里先返回valid，具体校验留给组件处理
      break;
  }
  return { valid: true };
}