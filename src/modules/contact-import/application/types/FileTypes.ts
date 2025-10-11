// src/modules/contact-import/application/types/FileTypes.ts
// module: contact-import | layer: application | role: application-logic
// summary: 应用逻辑

// contact-import/application/types | FileTypes | 文件处理相关类型定义
// 包含文件信息、解析配置等应用层关注的类型结构

/**
 * 文件信息
 * 描述导入文件的基本信息
 */
export interface FileInfo {
  /** 文件名 */
  name: string;
  
  /** 文件路径 */
  path: string;
  
  /** 文件大小 (字节) */
  size: number;
  
  /** 文件类型 */
  type: string;
  
  /** 文件扩展名 */
  extension: string;
  
  /** 文件编码 */
  encoding?: string;
  
  /** 最后修改时间 */
  lastModified: Date;
  
  /** 文件哈希值 */
  hash?: string;
  
  /** 文件元数据 */
  metadata?: FileMetadata;
}

/**
 * 文件元数据
 * 扩展文件信息，包含更多详细属性
 */
export interface FileMetadata {
  /** 创建时间 */
  createdAt?: Date;
  
  /** 创建者 */
  createdBy?: string;
  
  /** 文件版本 */
  version?: string;
  
  /** 文件描述 */
  description?: string;
  
  /** 文件标签 */
  tags?: string[];
  
  /** 自定义属性 */
  customProperties?: Record<string, unknown>;
}

/**
 * 解析选项
 * 配置文件解析的行为参数
 */
export interface ParseOptions {
  /** 文件编码 */
  encoding?: string;
  
  /** 分隔符 */
  delimiter?: string;
  
  /** 是否跳过空行 */
  skipEmptyLines?: boolean;
  
  /** 最大记录数 */
  maxRecords?: number;
  
  /** 是否严格模式 */
  strict?: boolean;
  
  /** 是否包含标题行 */
  hasHeader?: boolean;
  
  /** 引用字符 */
  quote?: string;
  
  /** 转义字符 */
  escape?: string;
  
  /** 列映射 */
  columnMapping?: ColumnMapping;
  
  /** 解析钩子 */
  hooks?: ParseHooks;
}

/**
 * 列映射配置
 * 定义文件列与目标字段的映射关系
 */
export interface ColumnMapping {
  /** 列索引到字段名的映射 */
  indexToField?: Record<number, string>;
  
  /** 列名到字段名的映射 */
  nameToField?: Record<string, string>;
  
  /** 默认值配置 */
  defaultValues?: Record<string, unknown>;
  
  /** 字段转换器 */
  transformers?: Record<string, FieldTransformer>;
}

/**
 * 字段转换器
 * 定义字段值的转换逻辑
 */
export interface FieldTransformer {
  /** 转换器类型 */
  type: "string" | "number" | "boolean" | "date" | "custom";
  
  /** 转换参数 */
  parameters?: Record<string, unknown>;
  
  /** 自定义转换函数名 */
  customFunction?: string;
  
  /** 转换前验证 */
  preValidation?: ValidationRule[];
  
  /** 转换后验证 */
  postValidation?: ValidationRule[];
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则类型 */
  type: string;
  
  /** 规则参数 */
  parameters: Record<string, unknown>;
  
  /** 错误消息 */
  errorMessage: string;
}

/**
 * 解析钩子
 * 在解析过程的不同阶段执行的回调函数
 */
export interface ParseHooks {
  /** 解析开始前 */
  beforeParse?: string;
  
  /** 解析每行前 */
  beforeRow?: string;
  
  /** 解析每行后 */
  afterRow?: string;
  
  /** 解析完成后 */
  afterParse?: string;
  
  /** 解析错误时 */
  onError?: string;
}

/**
 * 文件解析结果
 * 描述文件解析的结果和统计信息
 */
export interface ParseResult {
  /** 解析是否成功 */
  success: boolean;
  
  /** 解析的数据 */
  data: Record<string, unknown>[];
  
  /** 解析统计 */
  statistics: ParseStatistics;
  
  /** 解析错误 */
  errors: ParseError[];
  
  /** 解析警告 */
  warnings: ParseWarning[];
  
  /** 解析元数据 */
  metadata: ParseMetadata;
}

/**
 * 解析统计信息
 */
export interface ParseStatistics {
  /** 总行数 */
  totalRows: number;
  
  /** 成功解析行数 */
  successfulRows: number;
  
  /** 失败行数 */
  failedRows: number;
  
  /** 跳过行数 */
  skippedRows: number;
  
  /** 空行数 */
  emptyRows: number;
  
  /** 解析耗时 (毫秒) */
  parseTime: number;
  
  /** 文件大小 */
  fileSize: number;
  
  /** 解析速度 (行/秒) */
  parseSpeed: number;
}

/**
 * 解析错误
 */
export interface ParseError {
  /** 错误代码 */
  code: string;
  
  /** 错误消息 */
  message: string;
  
  /** 错误行号 */
  lineNumber?: number;
  
  /** 错误列号 */
  columnNumber?: number;
  
  /** 错误字段 */
  field?: string;
  
  /** 错误值 */
  value?: unknown;
  
  /** 错误上下文 */
  context?: string;
}

/**
 * 解析警告
 */
export interface ParseWarning {
  /** 警告代码 */
  code: string;
  
  /** 警告消息 */
  message: string;
  
  /** 警告行号 */
  lineNumber?: number;
  
  /** 警告字段 */
  field?: string;
  
  /** 建议修复 */
  suggestion?: string;
}

/**
 * 解析元数据
 */
export interface ParseMetadata {
  /** 解析器版本 */
  parserVersion: string;
  
  /** 解析配置 */
  parseConfig: ParseOptions;
  
  /** 解析开始时间 */
  startTime: Date;
  
  /** 解析结束时间 */
  endTime: Date;
  
  /** 检测到的编码 */
  detectedEncoding?: string;
  
  /** 检测到的分隔符 */
  detectedDelimiter?: string;
  
  /** 列信息 */
  columnInfo?: ColumnInfo[];
}

/**
 * 列信息
 */
export interface ColumnInfo {
  /** 列索引 */
  index: number;
  
  /** 列名 */
  name: string;
  
  /** 检测到的数据类型 */
  detectedType: string;
  
  /** 非空值数量 */
  nonNullCount: number;
  
  /** 唯一值数量 */
  uniqueCount: number;
  
  /** 示例值 */
  sampleValues: unknown[];
}

/**
 * 文件类型定义
 */
export enum SupportedFileType {
  /** CSV文件 */
  CSV = "csv",
  
  /** Excel文件 */
  EXCEL = "excel",
  
  /** JSON文件 */
  JSON = "json",
  
  /** TXT文件 */
  TXT = "txt",
  
  /** XML文件 */
  XML = "xml",
  
  /** YAML文件 */
  YAML = "yaml",
}

/**
 * 文件处理状态
 */
export enum FileProcessingStatus {
  /** 待处理 */
  PENDING = "pending",
  
  /** 处理中 */
  PROCESSING = "processing",
  
  /** 处理完成 */
  COMPLETED = "completed",
  
  /** 处理失败 */
  FAILED = "failed",
  
  /** 已取消 */
  CANCELLED = "cancelled",
}