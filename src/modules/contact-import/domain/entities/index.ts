// contact-import/domain/entities | index | 领域实体统一导出
// 提供所有核心业务实体的统一访问入口

// 联系人实体
export type {
  Contact,
  ContactTag,
  ContactGroup,
} from "./Contact";

export { ContactSource } from "./Contact";

// 设备实体
export type {
  Device,
  DevicePerformance,
  DeviceConfiguration,
} from "./Device";

export {
  DeviceType,
  DeviceStatus,
  DeviceConnectionType,
  DeviceCapability,
} from "./Device";

// 导入配置实体
export type {
  ImportConfiguration,
  BatchConfiguration,
  ValidationRuleSet,
  CustomValidationRule,
  DeviceTargetConfig,
  AdvancedImportOptions,
} from "./ImportConfiguration";

export {
  ImportStrategy,
  DuplicateHandlingStrategy,
  ErrorHandlingStrategy,
} from "./ImportConfiguration";