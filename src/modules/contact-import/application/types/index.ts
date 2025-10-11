// contact-import/application/types | index | 应用层类型统一导出
// 提供所有应用层类型的统一访问入口

// 导入结果类型
export type {
  ImportResult,
  ImportDetails,
  ContactImportResult,
  ImportError,
  ImportGroupResult,
  GroupMetadata,
} from "./ImportResult";

export { ImportStatus } from "./ImportResult";

// 导入进度类型
export type {
  ImportProgress,
  PhaseDetails,
  SubTaskProgress,
  PerformanceMetrics,
  BatchProgress,
  RealTimeStatistics,
} from "./ImportProgress";

export { ImportPhase } from "./ImportProgress";

// 导入事件类型
export type {
  ImportEvent,
  ImportEventData,
  ImportStartedData,
  ImportProgressData,
  ImportCompletedData,
  ImportFailedData,
  ImportCancelledData,
  DeviceConnectedData,
  DeviceDisconnectedData,
  ContactProcessedData,
  BatchCompletedData,
  ErrorOccurredData,
  PhaseChangedData,
  ConfigUpdatedData,
} from "./ImportEvent";

export { ImportEventType } from "./ImportEvent";

// 验证类型
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationStatistics,
  FieldValidationStats,
  ValidationContext,
  ValidationConfig,
  CustomValidationRule,
  ValidationRuleParameters,
  RegexRuleParams,
  LengthRuleParams,
  RangeRuleParams,
  FormatRuleParams,
  CustomRuleParams,
  ErrorLocation,
  BatchValidationConfig,
  ValidationSummary,
  RecommendedAction,
} from "./ValidationTypes";

// 文件处理类型
export type {
  FileInfo,
  FileMetadata,
  ParseOptions,
  ColumnMapping,
  FieldTransformer,
  ValidationRule,
  ParseHooks,
  ParseResult,
  ParseStatistics,
  ParseError,
  ParseWarning,
  ParseMetadata,
  ColumnInfo,
} from "./FileTypes";

export { 
  SupportedFileType,
  FileProcessingStatus 
} from "./FileTypes";