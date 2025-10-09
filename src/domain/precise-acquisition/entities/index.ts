/**
 * 精准获客领域模型 - 实体导出
 * 
 * 统一导出所有领域实体，便于其他模块使用
 */

export { WatchTarget } from './WatchTarget';
export { Comment as CommentEntity } from './Comment';
export { Task as TaskEntity } from './Task';
export { AuditLog } from './AuditLog';

// 重新导出为统一命名避免冲突
import { WatchTarget } from './WatchTarget';
import { Comment as CommentEntity } from './Comment';
import { Task as TaskEntity } from './Task';
import { AuditLog } from './AuditLog';

// 实体类型联合
export type DomainEntity = WatchTarget | CommentEntity | TaskEntity | AuditLog;

// 实体标识符类型
export type EntityId = string | number | null;

// 实体创建参数类型（用于工厂方法）
export interface EntityCreationParams {
  watchTarget: Parameters<typeof WatchTarget.create>[0];
  comment: Parameters<typeof CommentEntity.create>[0];
  replyTask: Parameters<typeof TaskEntity.createReplyTask>[0];
  followTask: Parameters<typeof TaskEntity.createFollowTask>[0];
  auditLog: Parameters<typeof AuditLog.create>[0];
}

// 实体数据库行类型（用于重建实体）
export interface EntityDatabaseRows {
  watchTarget: Parameters<typeof WatchTarget.fromDatabaseRow>[0];
  comment: Parameters<typeof CommentEntity.fromDatabaseRow>[0];
  task: Parameters<typeof TaskEntity.fromDatabaseRow>[0];
  auditLog: Parameters<typeof AuditLog.fromDatabaseRow>[0];
}