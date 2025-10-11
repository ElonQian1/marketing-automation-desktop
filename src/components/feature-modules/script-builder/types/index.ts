// src/components/feature-modules/script-builder/types/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 脚本构建器模块类型定义
 * 保持文件大小 < 500行，模块化管理类型
 */

/**
 * 脚本步骤类型
 */
export type StepType = 
  | 'tap'           // 点击操作
  | 'input'         // 输入文本
  | 'swipe'         // 滑动操作
  | 'wait'          // 等待
  | 'screenshot'    // 截图
  | 'loop'          // 循环
  | 'condition'     // 条件判断
  | 'custom';       // 自定义操作

/**
 * 脚本步骤状态
 */
export type StepStatus = 
  | 'pending'       // 等待执行
  | 'running'       // 正在执行
  | 'completed'     // 执行完成
  | 'failed'        // 执行失败
  | 'skipped';      // 跳过执行

/**
 * 脚本执行模式
 */
export type ExecutionMode = 
  | 'sequential'    // 顺序执行
  | 'parallel'      // 并行执行
  | 'conditional'   // 条件执行
  | 'loop';         // 循环执行

/**
 * 脚本步骤基础接口
 */
export interface ScriptStep {
  /** 步骤唯一ID */
  id: string;
  /** 步骤类型 */
  type: StepType;
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description?: string;
  /** 步骤参数 */
  parameters: StepParameters;
  /** 执行状态 */
  status: StepStatus;
  /** 是否启用 */
  enabled: boolean;
  /** 执行顺序 */
  order: number;
  /** 父步骤ID（用于嵌套步骤） */
  parentId?: string;
  /** 子步骤列表 */
  children?: ScriptStep[];
  /** 错误信息 */
  error?: string;
  /** 执行结果 */
  result?: any;
  /** 执行时间（毫秒） */
  duration?: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 步骤参数基础接口
 */
export interface StepParameters {
  /** 匹配条件 */
  matching?: {
    strategy: string;
    fields: string[];
    values: Record<string, string>;
    includes?: Record<string, string[]>;
    excludes?: Record<string, string[]>;
  };
  /** 延迟时间（毫秒） */
  delay?: number;
  /** 重试次数 */
  retries?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否截图 */
  screenshot?: boolean;
  /** 其他自定义参数 */
  [key: string]: any;
}

/**
 * 点击步骤参数
 */
export interface TapStepParameters extends StepParameters {
  /** 点击坐标 */
  coordinates?: { x: number; y: number };
  /** 点击类型 */
  clickType?: 'single' | 'double' | 'long';
  /** 点击持续时间 */
  holdDuration?: number;
}

/**
 * 输入步骤参数
 */
export interface InputStepParameters extends StepParameters {
  /** 输入文本 */
  text: string;
  /** 是否清空现有文本 */
  clearFirst?: boolean;
  /** 输入方式 */
  inputMethod?: 'type' | 'paste' | 'replace';
  /** 是否隐藏输入（密码字段） */
  hidden?: boolean;
}

/**
 * 滑动步骤参数
 */
export interface SwipeStepParameters extends StepParameters {
  /** 起始坐标 */
  startCoordinates: { x: number; y: number };
  /** 结束坐标 */
  endCoordinates: { x: number; y: number };
  /** 滑动方向 */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 滑动距离 */
  distance?: number;
  /** 滑动持续时间 */
  duration?: number;
  /** 滑动速度 */
  velocity?: 'slow' | 'normal' | 'fast';
}

/**
 * 等待步骤参数
 */
export interface WaitStepParameters extends StepParameters {
  /** 等待时间（毫秒） */
  duration: number;
  /** 等待条件 */
  condition?: {
    type: 'element_visible' | 'element_gone' | 'text_present' | 'custom';
    target?: any;
    timeout?: number;
  };
}

/**
 * 循环步骤参数
 */
export interface LoopStepParameters extends StepParameters {
  /** 循环次数 */
  iterations?: number;
  /** 循环条件 */
  condition?: {
    type: 'count' | 'while' | 'until';
    expression: string;
    maxIterations?: number;
  };
  /** 循环间隔 */
  interval?: number;
}

/**
 * 脚本信息
 */
export interface Script {
  /** 脚本ID */
  id: string;
  /** 脚本名称 */
  name: string;
  /** 脚本描述 */
  description?: string;
  /** 脚本版本 */
  version: string;
  /** 脚本作者 */
  author?: string;
  /** 目标应用包名 */
  targetPackage?: string;
  /** 脚本步骤列表 */
  steps: ScriptStep[];
  /** 全局配置 */
  config: ScriptConfig;
  /** 脚本状态 */
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed';
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 标签 */
  tags?: string[];
}

/**
 * 脚本配置
 */
export interface ScriptConfig {
  /** 执行模式 */
  executionMode: ExecutionMode;
  /** 全局延迟 */
  globalDelay?: number;
  /** 全局重试次数 */
  globalRetries?: number;
  /** 全局超时时间 */
  globalTimeout?: number;
  /** 是否自动截图 */
  autoScreenshot?: boolean;
  /** 截图间隔 */
  screenshotInterval?: number;
  /** 错误处理策略 */
  errorHandling?: 'stop' | 'continue' | 'retry';
  /** 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 脚本构建器状态
 */
export interface ScriptBuilderState {
  /** 当前脚本 */
  currentScript: Script | null;
  /** 脚本列表 */
  scripts: Script[];
  /** 当前选中的步骤 */
  selectedStep: ScriptStep | null;
  /** 当前编辑的步骤 */
  editingStep: ScriptStep | null;
  /** 是否显示步骤编辑器 */
  showStepEditor: boolean;
  /** 是否正在执行 */
  isExecuting: boolean;
  /** 执行进度 */
  executionProgress: {
    current: number;
    total: number;
    percentage: number;
  };
  /** 执行日志 */
  executionLogs: ExecutionLog[];
  /** 错误信息 */
  error: string | null;
  /** 是否显示预览 */
  showPreview: boolean;
}

/**
 * 执行日志
 */
export interface ExecutionLog {
  /** 日志ID */
  id: string;
  /** 日志时间 */
  timestamp: number;
  /** 日志级别 */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** 日志消息 */
  message: string;
  /** 步骤ID */
  stepId?: string;
  /** 额外数据 */
  data?: any;
}

/**
 * 步骤模板
 */
export interface StepTemplate {
  /** 模板ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description: string;
  /** 步骤类型 */
  type: StepType;
  /** 模板参数 */
  parameters: StepParameters;
  /** 模板分类 */
  category: string;
  /** 是否常用 */
  isCommon?: boolean;
  /** 模板图标 */
  icon?: string;
}

/**
 * 拖拽操作信息
 */
export interface DragOperation {
  /** 拖拽类型 */
  type: 'step' | 'template';
  /** 拖拽数据 */
  data: ScriptStep | StepTemplate;
  /** 源索引 */
  sourceIndex: number;
  /** 目标索引 */
  targetIndex?: number;
  /** 拖拽状态 */
  isDragging: boolean;
}

/**
 * 步骤验证结果
 */
export interface StepValidation {
  /** 是否有效 */
  isValid: boolean;
  /** 错误列表 */
  errors: string[];
  /** 警告列表 */
  warnings: string[];
  /** 建议列表 */
  suggestions: string[];
}

/**
 * 脚本执行结果
 */
export interface ExecutionResult {
  /** 执行ID */
  id: string;
  /** 脚本ID */
  scriptId: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 执行状态 */
  status: 'success' | 'failed' | 'cancelled';
  /** 执行的步骤结果 */
  stepResults: StepResult[];
  /** 总体错误信息 */
  error?: string;
  /** 执行统计 */
  statistics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    totalDuration: number;
  };
}

/**
 * 步骤执行结果
 */
export interface StepResult {
  /** 步骤ID */
  stepId: string;
  /** 执行状态 */
  status: StepStatus;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 执行持续时间 */
  duration: number;
  /** 执行结果数据 */
  result?: any;
  /** 错误信息 */
  error?: string;
  /** 截图路径 */
  screenshot?: string;
}

/**
 * 步骤编辑器配置
 */
export interface StepEditorConfig {
  /** 可用的步骤类型 */
  availableStepTypes: StepType[];
  /** 步骤模板库 */
  templates: StepTemplate[];
  /** 是否显示高级选项 */
  showAdvancedOptions: boolean;
  /** 是否启用实时预览 */
  enableLivePreview: boolean;
  /** 字段验证规则 */
  validationRules: Record<string, any>;
}

// 所有类型都已通过 export 关键字导出，无需重复导出