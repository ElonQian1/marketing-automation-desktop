/**
 * 审计系统模块导出文件
 */

// 服务
export { AuditService } from './services/AuditService';
export { 
  AuditLogLevel,
  AuditEventType
} from './services/AuditService';
export type { 
  AuditLogEntry,
  AuditQuery,
  AuditStats,
  PerformanceMetrics
} from './services/AuditService';

// 组件
export { AuditManager } from './components/AuditManager';