// src/modules/contact-import/index.ts
// module: contact-import | layer: module | role: module-component
// summary: 模块组件

// contact-import/index | ContactImportModule | 联系人导入模块公开API
// 提供DDD架构的联系人导入系统对外统一接口，确保向后兼容性

// ===== 应用层用例导出 =====
export {
  ContactImporterUseCase,
  ContactImporter, // 向后兼容别名
  type ContactImporterOptions,
  type ContactImporterEventListener,
} from './application/usecases/ContactImporterUseCase';

// 内部导入（用于工厂函数和类型别名）
import { ContactImporterUseCase } from './application/usecases/ContactImporterUseCase';
import type { 
  Contact, 
  Device, 
  ImportConfiguration 
} from './domain/entities';
import type { 
  ImportResult, 
  ImportProgress, 
  ValidationResult, 
  FileInfo 
} from './application/types';

// ===== React Hooks导出 =====
export {
  useContactImport,
  useImportStats,
  type UseContactImportOptions,
  type UseContactImportReturn,
} from './hooks/useUnifiedContactImport';

// ===== 主要UI组件导出 =====
export { ContactImportWizard } from './ui/ContactImportWizard';

// ===== 领域实体类型导出 =====
export type {
  // 联系人实体
  Contact,
  ContactTag,
  ContactGroup,
  // 设备实体
  Device,
  DevicePerformance,
  DeviceConfiguration,
  // 导入配置实体
  ImportConfiguration,
  BatchConfiguration,
  ValidationRuleSet,
  CustomValidationRule,
  DeviceTargetConfig,
  AdvancedImportOptions,
} from './domain/entities';

export {
  // 联系人枚举
  ContactSource,
  // 设备枚举
  DeviceType as DeviceTypeEnum,
  DeviceStatus,
  DeviceConnectionType,
  DeviceCapability,
  // 导入配置枚举
  ImportStrategy,
  DuplicateHandlingStrategy,
  ErrorHandlingStrategy,
} from './domain/entities';

// ===== 应用层类型导出 =====
export type {
  // 导入结果类型
  ImportResult,
  ImportDetails,
  ContactImportResult,
  ImportError,
  ImportGroupResult,
  GroupMetadata,
  // 导入进度类型
  ImportProgress,
  PhaseDetails,
  SubTaskProgress,
  PerformanceMetrics,
  BatchProgress,
  RealTimeStatistics,
  // 导入事件类型
  ImportEvent,
  ImportEventData,
  // 验证类型
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationStatistics,
  // 文件处理类型
  FileInfo,
  FileMetadata,
  ParseOptions,
  ParseResult,
  ParseStatistics,
} from './application/types';

export {
  // 导入状态枚举
  ImportStatus,
  ImportPhase,
  // 导入事件枚举
  ImportEventType,
  // 文件处理枚举
  SupportedFileType,
  FileProcessingStatus,
} from './application/types';

// ===== 向后兼容性类型别名 =====
// 这些别名确保现有代码不会中断，避免命名冲突
export type ContactType = Contact;
export type DeviceTypeInterface = Device;
export type ImportResultType = ImportResult;
export type ImportConfigurationType = ImportConfiguration;
export type ImportProgressType = ImportProgress;
export type ValidationResultType = ValidationResult;
export type FileInfoType = FileInfo;

// 向后兼容的ImportFormat类型（从旧types中迁移）
export type ImportFormat = 'vcf' | 'vcard' | 'csv' | 'json';

// ===== 统一ADB适配器导出 =====
export { UnifiedAdbDeviceManager } from './adapters/UnifiedAdbDeviceManager';

// ===== 便利函数和工厂方法 =====

/**
 * 创建默认的联系人导入器用例
 * 注意：此工厂函数将在完成所有迁移后重构以使用新的DDD架构
 * @param strategyType 导入策略类型
 * @returns ContactImporterUseCase实例
 */
export function createContactImporter(): ContactImporterUseCase {
  // TODO: 重构以使用新的DDD架构
  // 当前保持原有逻辑以确保向后兼容性
  throw new Error('工厂函数将在完成所有文件迁移后重新实现');
}

/**
 * 快速导入联系人
 * 一个便利函数，用于简单的导入场景
 * TODO: 在完成所有迁移后重新实现以使用新的DDD架构
 */
// export async function quickImportContacts(
//   vcfContent: string,
//   targetDevices: Device[],
// ): Promise<ImportResult> {
//   const importer = createContactImporter();
//   return importer.importContacts(vcfContent, targetDevices);
// }

// ===== 常量定义 =====
export const SUPPORTED_FILE_FORMATS = ['.vcf', '.vcard'] as const;

export const DEFAULT_IMPORT_CONFIGURATION = {
  strategy: 'balanced' as const,
  batchSize: 50,
  allowDuplicates: false,
  skipInvalidContacts: true,
  format: 'vcf' as const,
  options: {
    preserveGroups: false,
    mergeStrategy: 'skip' as const,
    photoHandling: 'skip' as const,
  },
};

// ===== 模块信息 =====
export const MODULE_VERSION = '2.0.0';
export const MODULE_NAME = 'Contact Import Module';
export const MODULE_DESCRIPTION = 
  'DDD架构的联系人导入系统，支持VCF格式联系人导入到Android设备';

/**
 * 获取模块信息
 */
export function getModuleInfo() {
  return {
    name: MODULE_NAME,
    version: MODULE_VERSION,
    description: MODULE_DESCRIPTION,
    architecture: 'DDD (Domain-Driven Design)',
    supportedFormats: SUPPORTED_FILE_FORMATS,
    defaultConfiguration: DEFAULT_IMPORT_CONFIGURATION,
  };
}