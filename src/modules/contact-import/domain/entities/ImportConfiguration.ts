// contact-import/domain/entities | ImportConfiguration | 导入配置核心实体定义
// 包含导入任务的配置、策略、规则等业务概念

/**
 * 导入配置核心实体
 * 定义联系人导入任务的配置策略和规则
 */
export interface ImportConfiguration {
  /** 配置唯一标识 */
  id: string;
  
  /** 配置名称 */
  name: string;
  
  /** 配置描述 */
  description?: string;
  
  /** 导入策略 */
  strategy: ImportStrategy;
  
  /** 批处理配置 */
  batchConfig: BatchConfiguration;
  
  /** 验证规则 */
  validationRules: ValidationRuleSet;
  
  /** 重复处理策略 */
  duplicateHandling: DuplicateHandlingStrategy;
  
  /** 错误处理策略 */
  errorHandling: ErrorHandlingStrategy;
  
  /** 目标设备配置 */
  deviceTargets: DeviceTargetConfig[];
  
  /** 高级选项 */
  advancedOptions: AdvancedImportOptions;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 创建者 */
  createdBy: string;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 导入策略枚举
 */
export enum ImportStrategy {
  /** 顺序导入 - 逐个处理 */
  SEQUENTIAL = "sequential",
  
  /** 并行导入 - 同时处理多个 */
  PARALLEL = "parallel",
  
  /** 智能导入 - 根据设备性能自适应 */
  ADAPTIVE = "adaptive",
  
  /** 批量导入 - 分批处理 */
  BATCH = "batch",
}

/**
 * 批处理配置
 */
export interface BatchConfiguration {
  /** 每批处理数量 */
  batchSize: number;
  
  /** 批次间延迟(毫秒) */
  batchDelay: number;
  
  /** 最大并发批次数 */
  maxConcurrentBatches: number;
  
  /** 失败重试次数 */
  retryAttempts: number;
  
  /** 重试延迟(毫秒) */
  retryDelay: number;
}

/**
 * 验证规则集合
 */
export interface ValidationRuleSet {
  /** 是否验证手机号格式 */
  validatePhoneFormat: boolean;
  
  /** 是否验证联系人名称 */
  validateContactName: boolean;
  
  /** 是否检查重复联系人 */
  checkDuplicates: boolean;
  
  /** 最小联系人信息要求 */
  minimumRequiredFields: string[];
  
  /** 自定义验证规则 */
  customValidationRules: CustomValidationRule[];
}

/**
 * 自定义验证规则
 */
export interface CustomValidationRule {
  /** 规则名称 */
  name: string;
  
  /** 规则描述 */
  description: string;
  
  /** 应用字段 */
  field: string;
  
  /** 验证类型 */
  type: "regex" | "length" | "custom";
  
  /** 验证参数 */
  parameters: Record<string, any>;
  
  /** 错误消息 */
  errorMessage: string;
}

/**
 * 重复处理策略枚举
 */
export enum DuplicateHandlingStrategy {
  /** 跳过重复项 */
  SKIP = "skip",
  
  /** 更新现有项 */
  UPDATE = "update",
  
  /** 保留两者 */
  KEEP_BOTH = "keep_both",
  
  /** 提示用户选择 */
  PROMPT_USER = "prompt_user",
}

/**
 * 错误处理策略枚举
 */
export enum ErrorHandlingStrategy {
  /** 停止导入 */
  STOP_ON_ERROR = "stop_on_error",
  
  /** 跳过错误项继续 */
  SKIP_AND_CONTINUE = "skip_and_continue",
  
  /** 重试后继续 */
  RETRY_AND_CONTINUE = "retry_and_continue",
  
  /** 收集错误最后处理 */
  COLLECT_AND_PROCESS = "collect_and_process",
}

/**
 * 设备目标配置
 */
export interface DeviceTargetConfig {
  /** 设备ID */
  deviceId: string;
  
  /** 设备权重（用于分配任务） */
  weight: number;
  
  /** 是否启用该设备 */
  enabled: boolean;
  
  /** 设备特定配置 */
  deviceSpecificConfig?: Record<string, any>;
}

/**
 * 高级导入选项
 */
export interface AdvancedImportOptions {
  /** 是否保留原始数据 */
  preserveOriginalData: boolean;
  
  /** 是否启用增量导入 */
  enableIncrementalImport: boolean;
  
  /** 导入完成后是否自动备份 */
  autoBackupAfterImport: boolean;
  
  /** 性能优化级别 */
  performanceLevel: "low" | "medium" | "high" | "maximum";
  
  /** 自定义导入钩子 */
  customHooks?: {
    beforeImport?: string;
    afterImport?: string;
    onError?: string;
  };
}