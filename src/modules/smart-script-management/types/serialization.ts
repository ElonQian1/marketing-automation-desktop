// src/modules/smart-script-management/types/serialization.ts
// module: smart-script-management | layer: types | role: serialization-types
// summary: 序列化相关类型定义

/**
 * 序列化器接口 - 所有序列化器的基础接口
 */
export interface IStepSerializer<TInput = any, TOutput = any> {
  /**
   * 序列化输入数据到输出格式
   */
  serialize(input: TInput, index?: number): TOutput;
  
  /**
   * 反序列化输出格式到输入数据
   */
  deserialize(output: TOutput): TInput;
  
  /**
   * 验证数据是否符合该序列化器的处理范围
   */
  canHandle(input: TInput): boolean;
  
  /**
   * 获取序列化器支持的步骤类型
   */
  getSupportedTypes(): string[];
}

/**
 * 序列化上下文 - 用于传递序列化过程中的上下文信息
 */
export interface SerializationContext {
  /**
   * 脚本的全局配置
   */
  scriptConfig?: any;
  
  /**
   * 当前序列化的索引
   */
  currentIndex?: number;
  
  /**
   * 父级步骤ID（用于嵌套结构）
   */
  parentStepId?: string;
  
  /**
   * 序列化时的元数据
   */
  metadata?: Record<string, any>;
  
  /**
   * 序列化方向 - 用于区分序列化还是反序列化
   */
  direction: 'serialize' | 'deserialize';
}

/**
 * 步骤序列化结果
 */
export interface SerializationResult<T = any> {
  /**
   * 序列化后的数据
   */
  data: T;
  
  /**
   * 是否成功
   */
  success: boolean;
  
  /**
   * 错误信息（如果失败）
   */
  error?: string;
  
  /**
   * 警告信息
   */
  warnings?: string[];
  
  /**
   * 额外的元数据
   */
  metadata?: Record<string, any>;
}

/**
 * 循环相关的序列化数据
 */
export interface LoopSerializationData {
  /**
   * 循环ID
   */
  loopId: string;
  
  /**
   * 循环名称
   */
  loopName?: string;
  
  /**
   * 循环层级
   */
  loopLevel: number;
  
  /**
   * 是否在循环中
   */
  inLoop: boolean;
  
  /**
   * 父级循环ID
   */
  parentLoopId?: string;
  
  /**
   * 循环配置
   */
  loopConfig?: {
    maxIterations?: number;
    breakCondition?: string;
    continueOnError?: boolean;
  };
}

/**
 * 条件相关的序列化数据
 */
export interface ConditionalSerializationData {
  /**
   * 条件表达式
   */
  condition: string;
  
  /**
   * 条件类型
   */
  conditionType: 'element_exists' | 'text_contains' | 'custom';
  
  /**
   * 条件参数
   */
  conditionParams?: Record<string, any>;
  
  /**
   * 分支配置
   */
  branchConfig?: {
    trueBranch?: string[];
    falseBranch?: string[];
  };
}

/**
 * 智能分析数据的序列化格式
 */
export interface SmartAnalysisSerializationData {
  /**
   * 元素描述
   */
  description?: string;
  
  /**
   * 元素边界
   */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /**
   * 元素内容描述
   */
  contentDesc?: string;
  
  /**
   * 元素文本
   */
  elementText?: string;
  
  /**
   * 元素类型
   */
  elementType?: string;
  
  /**
   * 置信度
   */
  confidence?: number;
  
  /**
   * 选择器信息
   */
  selector?: {
    xpath?: string;
    cssSelector?: string;
    idSelector?: string;
  };
}

/**
 * 扩展的步骤数据 - 包含所有可能的字段
 */
export interface ExtendedStepData {
  /**
   * 基础步骤信息
   */
  id: string;
  stepType: string;
  name: string;
  description?: string;
  enabled: boolean;
  order: number;
  status?: string;
  
  /**
   * 参数数据
   */
  parameters: Record<string, any>;
  
  /**
   * 循环相关数据
   */
  loopData?: LoopSerializationData;
  
  /**
   * 条件相关数据
   */
  conditionalData?: ConditionalSerializationData;
  
  /**
   * 智能分析数据
   */
  smartAnalysis?: SmartAnalysisSerializationData;
  
  /**
   * UI状态
   */
  uiState?: {
    collapsed?: boolean;
    editedAt?: string;
    notes?: string;
    position?: { x: number; y: number };
  };
  
  /**
   * 错误处理配置
   */
  errorHandling?: {
    onError?: 'stop' | 'continue' | 'retry';
    maxRetries?: number;
    retryDelay?: number;
  };
  
  /**
   * 条件执行
   */
  conditions?: Array<{
    type: string;
    expression: string;
    enabled: boolean;
  }>;
  
  /**
   * 自定义扩展字段
   */
  extensions?: Record<string, any>;
}

/**
 * 序列化器配置
 */
export interface SerializerConfig {
  /**
   * 是否保留所有原始字段
   */
  preserveOriginalFields?: boolean;
  
  /**
   * 是否进行类型转换
   */
  enableTypeConversion?: boolean;
  
  /**
   * 是否启用向后兼容性
   */
  enableBackwardCompatibility?: boolean;
  
  /**
   * 自定义字段映射
   */
  fieldMappings?: Record<string, string>;
  
  /**
   * 忽略的字段列表
   */
  ignoredFields?: string[];
  
  /**
   * 必需的字段列表
   */
  requiredFields?: string[];
}

/**
 * 步骤类型定义 - 扩展现有的步骤类型
 */
export enum ExtendedStepType {
  // 基础类型
  TAP = 'tap',
  INPUT = 'input',
  WAIT = 'wait',
  SMART_TAP = 'smart_tap',
  SMART_FIND_ELEMENT = 'smart_find_element',
  RECOGNIZE_PAGE = 'recognize_page',
  LAUNCH_APP = 'launch_app',
  NAVIGATION = 'navigation',
  SCREENSHOT = 'screenshot',
  SWIPE = 'swipe',
  VERIFY = 'verify',
  
  // 循环类型
  LOOP_START = 'loop_start',
  LOOP_END = 'loop_end',
  
  // 条件类型
  CONDITIONAL_START = 'conditional_start',
  CONDITIONAL_END = 'conditional_end',
  
  // 并行类型
  PARALLEL_START = 'parallel_start',
  PARALLEL_END = 'parallel_end',
  
  // 子程序类型
  SUBROUTINE_CALL = 'subroutine_call',
  SUBROUTINE_DEFINE = 'subroutine_define',
  
  // 自定义类型
  CUSTOM = 'custom'
}

/**
 * 序列化器注册信息
 */
export interface SerializerRegistration {
  /**
   * 序列化器名称
   */
  name: string;
  
  /**
   * 支持的步骤类型
   */
  supportedTypes: string[];
  
  /**
   * 序列化器实例
   */
  serializer: IStepSerializer;
  
  /**
   * 优先级（数字越大优先级越高）
   */
  priority: number;
  
  /**
   * 是否是默认序列化器
   */
  isDefault?: boolean;
  
  /**
   * 序列化器配置
   */
  config?: SerializerConfig;
}