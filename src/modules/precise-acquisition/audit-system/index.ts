// src/modules/precise-acquisition/audit-system/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 审计系统模块导出文件
 */

// 服务
export { AuditService } from './services/prospecting-audit-service';
export { 
  AuditLogLevel,
  AuditEventType
} from './services/prospecting-audit-service';
export type { 
  AuditLogEntry,
  AuditQuery,
  AuditStats,
  PerformanceMetrics
} from './services/prospecting-audit-service';

// 组件
export { AuditManager } from './components/AuditManager';