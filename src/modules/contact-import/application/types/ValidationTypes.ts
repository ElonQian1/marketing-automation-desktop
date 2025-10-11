// contact-import/application/types | ValidationTypes | 验证相关类型定义
// 包含数据验证、规则校验等应用层关注的类型结构

/**
 * 验证结果
 * 描述数据验证的整体结果
 */
export interface ValidationResult {
  /** 验证是否通过 */
  valid: boolean;
  
  /** 验证错误列表 */
  errors: ValidationError[];
  
  /** 验证警告列表 */
  warnings: ValidationWarning[];
  
  /** 验证统计信息 */
  statistics?: ValidationStatistics;
  
  /** 验证上下文 */
  context?: ValidationContext;
}

/**
 * 验证错误
 * 描述验证过程中发现的错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;
  
  /** 错误消息 */
  message: string;
  
  /** 相关字段 */
  field?: string;
  
  /** 错误值 */
  value?: unknown;
  
  /** 错误级别 */
  severity: "error" | "warning";
  
  /** 错误位置信息 */
  location?: ErrorLocation;
  
  /** 修复建议 */
  suggestion?: string;
}

/**
 * 验证警告
 * 继承验证错误，添加警告特定的属性
 */
export interface ValidationWarning extends ValidationError {
  /** 修复建议 */
  suggestion?: string;
  
  /** 是否可忽略 */
  ignorable: boolean;
  
  /** 警告类型 */
  warningType: "data_quality" | "performance" | "compatibility" | "best_practice";
}

/**
 * 验证统计信息
 * 提供验证过程的统计数据
 */
export interface ValidationStatistics {
  /** 总验证项数 */
  totalItems: number;
  
  /** 通过验证的项数 */
  validItems: number;
  
  /** 验证失败的项数 */
  invalidItems: number;
  
  /** 警告项数 */
  warningItems: number;
  
  /** 验证耗时 (毫秒) */
  validationDuration: number;
  
  /** 各字段验证统计 */
  fieldStatistics: Record<string, FieldValidationStats>;
}

/**
 * 字段验证统计
 */
export interface FieldValidationStats {
  /** 字段名 */
  fieldName: string;
  
  /** 验证次数 */
  validationCount: number;
  
  /** 成功次数 */
  successCount: number;
  
  /** 失败次数 */
  failureCount: number;
  
  /** 警告次数 */
  warningCount: number;
  
  /** 最常见错误 */
  commonErrors: string[];
}

/**
 * 验证上下文
 * 提供验证过程的上下文信息
 */
export interface ValidationContext {
  /** 验证器版本 */
  validatorVersion: string;
  
  /** 验证规则集ID */
  ruleSetId: string;
  
  /** 验证时间 */
  validationTime: Date;
  
  /** 数据源信息 */
  dataSource: string;
  
  /** 验证配置 */
  validationConfig: ValidationConfig;
}

/**
 * 验证配置
 */
export interface ValidationConfig {
  /** 是否启用严格模式 */
  strictMode: boolean;
  
  /** 最大错误数量 */
  maxErrors: number;
  
  /** 是否跳过警告 */
  skipWarnings: boolean;
  
  /** 自定义验证规则 */
  customRules: CustomValidationRule[];
  
  /** 验证超时时间 (毫秒) */
  timeout: number;
}

/**
 * 自定义验证规则
 */
export interface CustomValidationRule {
  /** 规则ID */
  id: string;
  
  /** 规则名称 */
  name: string;
  
  /** 规则描述 */
  description: string;
  
  /** 应用字段 */
  field: string;
  
  /** 验证类型 */
  type: "regex" | "length" | "range" | "custom" | "format";
  
  /** 验证参数 */
  parameters: ValidationRuleParameters;
  
  /** 错误消息模板 */
  errorMessage: string;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 优先级 */
  priority: number;
}

/**
 * 验证规则参数
 */
export type ValidationRuleParameters = 
  | RegexRuleParams
  | LengthRuleParams
  | RangeRuleParams
  | FormatRuleParams
  | CustomRuleParams;

/**
 * 正则表达式规则参数
 */
export interface RegexRuleParams {
  /** 正则表达式模式 */
  pattern: string;
  
  /** 正则表达式标志 */
  flags?: string;
}

/**
 * 长度规则参数
 */
export interface LengthRuleParams {
  /** 最小长度 */
  minLength?: number;
  
  /** 最大长度 */
  maxLength?: number;
  
  /** 精确长度 */
  exactLength?: number;
}

/**
 * 范围规则参数
 */
export interface RangeRuleParams {
  /** 最小值 */
  minValue?: number;
  
  /** 最大值 */
  maxValue?: number;
  
  /** 是否包含边界值 */
  inclusive?: boolean;
}

/**
 * 格式规则参数
 */
export interface FormatRuleParams {
  /** 格式类型 */
  formatType: "email" | "phone" | "url" | "date" | "time" | "datetime";
  
  /** 区域设置 */
  locale?: string;
  
  /** 格式选项 */
  formatOptions?: Record<string, unknown>;
}

/**
 * 自定义规则参数
 */
export interface CustomRuleParams {
  /** 验证函数名 */
  validatorFunction: string;
  
  /** 函数参数 */
  functionArgs?: Record<string, unknown>;
  
  /** 依赖字段 */
  dependentFields?: string[];
}

/**
 * 错误位置信息
 */
export interface ErrorLocation {
  /** 行号 */
  line?: number;
  
  /** 列号 */
  column?: number;
  
  /** 记录索引 */
  recordIndex?: number;
  
  /** 字段路径 */
  fieldPath?: string;
  
  /** 文件路径 */
  filePath?: string;
}

/**
 * 批量验证配置
 */
export interface BatchValidationConfig extends ValidationConfig {
  /** 批处理大小 */
  batchSize: number;
  
  /** 并发数 */
  concurrency: number;
  
  /** 失败阈值 */
  failureThreshold: number;
  
  /** 是否提前停止 */
  earlyStop: boolean;
}

/**
 * 验证结果汇总
 */
export interface ValidationSummary {
  /** 总体结果 */
  overallResult: "passed" | "failed" | "warning";
  
  /** 验证结果列表 */
  results: ValidationResult[];
  
  /** 汇总统计 */
  summary: ValidationStatistics;
  
  /** 生成时间 */
  generatedAt: Date;
  
  /** 建议操作 */
  recommendedActions: RecommendedAction[];
}

/**
 * 建议操作
 */
export interface RecommendedAction {
  /** 操作类型 */
  type: "fix" | "review" | "ignore" | "enhance";
  
  /** 操作描述 */
  description: string;
  
  /** 优先级 */
  priority: "low" | "medium" | "high" | "critical";
  
  /** 预估耗时 */
  estimatedEffort: string;
  
  /** 相关错误代码 */
  relatedErrorCodes: string[];
}