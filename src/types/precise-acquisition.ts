// src/types/precise-acquisition.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

/**
 * 精准获客系统 - TypeScript 类型定义
 * 
 * 基于 Round 2｜候选池字段清单（v1）文档规范
 * 与后端数据模型保持一致，遵循 DDD 架构原则
 */

import {
  Platform,
  TargetType,
  SourceType,
  IndustryTag,
  RegionTag,
  TaskType,
  TaskStatus,
  ExecutorMode,
  ResultCode,
  TemplateChannel,
  AuditAction,
} from '../constants/precise-acquisition-enums';

// ==================== 候选池相关类型 ====================

/**
 * 候选池载荷（新增/更新时使用）
 */
export interface WatchTargetPayload {
  dedup_key: string;
  target_type: TargetType;
  platform: Platform;
  id_or_url: string;
  title?: string;
  source?: SourceType;
  industry_tags?: string; // semicolon separated
  region?: RegionTag;
  notes?: string;
}

/**
 * 候选池完整行数据（数据库返回）
 */
export interface WatchTargetRow {
  id: number;
  dedup_key: string;
  target_type: TargetType;
  platform: Platform;
  id_or_url: string;
  title?: string;
  source?: SourceType;
  industry_tags?: string;
  region?: RegionTag;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 候选池查询参数
 */
export interface ListWatchTargetsQuery {
  limit?: number;
  offset?: number;
  platform?: Platform;
  target_type?: TargetType;
}

// ==================== 评论相关类型 ====================

/**
 * 评论载荷（新增时使用）
 */
export interface CommentPayload {
  platform: Platform;
  video_id: string;
  author_id: string;
  content: string;
  like_count?: number;
  publish_time: string; // ISO8601 格式
  region?: RegionTag;
  source_target_id: string; // 关联到 watch_targets.id
}

/**
 * 评论完整行数据（数据库返回）
 */
export interface CommentRow {
  id: string; // UUID格式
  platform: Platform;
  video_id: string;
  author_id: string;
  content: string;
  like_count?: number;
  publish_time: string;
  region?: RegionTag;
  source_target_id: string;
  inserted_at: string;
}

/**
 * 评论查询参数
 */
export interface ListCommentsQuery {
  limit?: number;
  offset?: number;
  platform?: Platform;
  source_target_id?: string;
  region?: RegionTag;
}

// ==================== 任务相关类型 ====================

/**
 * 任务载荷（新增时使用）
 */
export interface TaskPayload {
  task_type: TaskType;
  comment_id?: string; // 当任务=reply时必填
  target_user_id?: string; // 当任务=follow时必填
  assign_account_id: string; // 执行账号ID
  executor_mode: ExecutorMode;
  dedup_key: string; // 查重键
  priority?: number; // 默认 P2
  deadline_at?: string; // ISO8601
}

/**
 * 任务完整行数据（数据库返回）
 */
export interface TaskRow {
  id: string; // UUID格式
  task_type: TaskType;
  comment_id?: string;
  target_user_id?: string;
  assign_account_id: string;
  status: TaskStatus;
  executor_mode: ExecutorMode;
  result_code?: ResultCode;
  error_message?: string;
  dedup_key: string;
  created_at: string;
  executed_at?: string;
  priority: number;
  attempts: number;
  deadline_at?: string;
  lock_owner?: string;
  lease_until?: string;
}

/**
 * 任务查询参数
 */
export interface ListTasksQuery {
  limit?: number;
  offset?: number;
  status?: TaskStatus;
  task_type?: TaskType;
  assign_account_id?: string;
}

/**
 * 任务状态更新参数
 */
export interface TaskStatusUpdate {
  task_id: string;
  status: TaskStatus;
  result_code?: ResultCode;
  error_message?: string;
}

// ==================== 话术模板相关类型 ====================

/**
 * 话术模板载荷（新增/更新时使用）
 */
export interface ReplyTemplatePayload {
  template_name: string;
  channel: TemplateChannel;
  text: string; // 模板内容（含变量）
  variables?: string; // 变量名（semicolon separated）
  category?: string; // 模板类别
  enabled: boolean;
}

/**
 * 话术模板完整行数据（数据库返回）
 */
export interface ReplyTemplateRow {
  id: string; // UUID格式
  template_name: string;
  channel: TemplateChannel;
  text: string;
  variables?: string;
  category?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 话术模板查询参数
 */
export interface ListReplyTemplatesQuery {
  limit?: number;
  offset?: number;
  channel?: TemplateChannel;
  enabled?: boolean;
}

// ==================== 审计日志相关类型 ====================

/**
 * 审计日志载荷（新增时使用）
 */
export interface AuditLogPayload {
  action: AuditAction;
  task_id?: string;
  account_id?: string;
  operator: string; // "system" | "api" | "manual" | 人工账号名
  payload_hash?: string; // 请求/回复摘要（脱敏）
}

/**
 * 审计日志完整行数据（数据库返回）
 */
export interface AuditLogRow {
  id: string; // UUID格式
  action: AuditAction;
  task_id?: string;
  account_id?: string;
  operator: string;
  payload_hash?: string;
  ts: string; // 时间戳
}

/**
 * 审计日志查询参数
 */
export interface ListAuditLogsQuery {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  task_id?: string;
  start_time?: string;
  end_time?: string;
}

// ==================== 日报相关类型 ====================

/**
 * 日报载荷（新增时使用）
 */
export interface DailyReportPayload {
  date: string; // YYYY-MM-DD 格式
  follow_count: number;
  reply_count: number;
  file_path: string; // 导出文件路径或索引
}

/**
 * 日报完整行数据（数据库返回）
 */
export interface DailyReportRow {
  id: string; // UUID格式
  date: string;
  follow_count: number;
  reply_count: number;
  file_path: string;
  created_at: string;
}

// ==================== CSV 导入相关类型 ====================

/**
 * CSV 导入行数据
 */
export interface CsvImportRow {
  type: string; // "video" | "account"
  platform: string; // "douyin" | "oceanengine" | "public"
  id_or_url: string;
  title?: string;
  source: string; // "manual" | "csv" | "whitelist" | "ads"
  industry_tags?: string; // 分号分隔
  region?: string;
  notes?: string;
}

/**
 * CSV 导入结果
 */
export interface CsvImportResult {
  success_count: number;
  failed_count: number;
  errors: CsvImportError[];
  duplicates: string[]; // dedup_key 列表
}

/**
 * CSV 导入错误
 */
export interface CsvImportError {
  row_index: number;
  error_code: string; // "E_REQUIRED" | "E_ENUM" | "E_URL" | "E_NOT_ALLOWED"
  field_name?: string;
  error_message: string;
  suggestion?: string; // 修复建议
}

// ==================== 业务逻辑相关类型 ====================

/**
 * 任务生成配置
 */
export interface TaskGenerationConfig {
  keywords: string[]; // 关键词列表
  time_window_hours: number; // 时间窗口（小时）
  regions?: RegionTag[]; // 地域过滤
  min_like_count?: number; // 最小点赞数
  exclude_keywords?: string[]; // 排除关键词
}

/**
 * 频控配置
 */
export interface RateLimitConfig {
  hourly_limit: number; // 每小时上限
  daily_limit: number; // 每日上限
  min_interval_seconds: number; // 最小间隔（秒）
  max_interval_seconds: number; // 最大间隔（秒）
}

/**
 * 查重配置
 */
export interface DeduplicationConfig {
  comment_level_enabled: boolean; // 评论级查重
  user_level_enabled: boolean; // 用户级查重
  user_cooldown_days: number; // 用户冷却期（天）
  cross_device_enabled: boolean; // 跨设备查重
}

/**
 * 合规检查结果
 */
export interface ComplianceCheckResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
  source_verified: boolean;
  whitelist_approved: boolean;
  compliant: boolean; // 整体合规状态
  // 向后兼容字段
  is_allowed: boolean;
  source_type?: SourceType;
  whitelist_entry?: string; // 白名单条目（如果适用）
  reason?: string; // 不允许的原因
}

/**
 * 统计数据
 */
export interface PreciseAcquisitionStats {
  watch_targets_count: number;
  comments_count: number;
  tasks_count: {
    total: number;
    new: number;
    ready: number;
    executing: number;
    done: number;
    failed: number;
  };
  daily_metrics: {
    follow_count: number;
    reply_count: number;
    success_rate: number;
  };
}

// ==================== API 响应类型 ====================

/**
 * 标准 API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ==================== 前端组件 Props 类型 ====================

/**
 * 候选池表格组件 Props
 */
export interface WatchTargetsTableProps {
  data: WatchTargetRow[];
  loading?: boolean;
  onEdit?: (record: WatchTargetRow) => void;
  onDelete?: (record: WatchTargetRow) => void;
  onRefresh?: () => void;
}

/**
 * 任务管理组件 Props
 */
export interface TaskManagementProps {
  tasks: TaskRow[];
  loading?: boolean;
  onStatusUpdate?: (update: TaskStatusUpdate) => void;
  onBatchExecute?: (taskIds: string[]) => void;
}

/**
 * CSV 导入组件 Props
 */
export interface CsvImportProps {
  onImportComplete?: (result: CsvImportResult) => void;
  onValidationFailed?: (errors: CsvImportError[]) => void;
}

// ==================== 标签管理相关类型 ====================

/**
 * 标签映射表条目
 */
export interface TagMappingEntry {
  id: string;
  external_value: string; // 外部输入值（如 CSV 中的中文）
  internal_value: IndustryTag | RegionTag; // 内部枚举值
  tag_type: 'industry' | 'region';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 标签体系版本信息
 */
export interface TagSystemVersion {
  version: string; // 如 "v1.0.0"
  industry_tags_count: number;
  region_tags_count: number;
  last_updated: string;
  update_reason?: string;
}

// ==================== 白名单管理相关类型 ====================

/**
 * 白名单数据源条目
 */
export interface WhitelistEntry {
  id: string;
  domain: string; // 域名或URL模式
  source_name: string; // 来源名称
  allowed_operations: ('scrape' | 'api' | 'manual')[]; // 允许的操作类型
  compliance_verified: boolean; // 是否已验证合规
  robots_txt_checked: boolean; // 是否检查过 robots.txt
  notes?: string;
  verified_by: string; // 验证人
  verified_at: string; // 验证时间
}

/**
 * 合规决策树节点
 */
export interface ComplianceDecisionNode {
  id: string;
  condition: string; // 判断条件描述
  action: 'allow' | 'deny' | 'manual_review';
  next_node_id?: string;
  reason: string; // 决策原因
}

// ==================== 三轨适配器相关类型 ====================

/**
 * 适配器类型
 */
export enum AdapterType {
  DOUYIN_API = 'douyin_api',
  OCEANENGINE_API = 'oceanengine_api',
  WHITELIST_SCRAPER = 'whitelist_scraper',
}

/**
 * 适配器配置
 */
export interface AdapterConfig {
  type: AdapterType;
  enabled: boolean;
  rate_limit: RateLimitConfig;
  authentication?: {
    app_id?: string;
    app_secret?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
  };
  whitelist_domains?: string[]; // 仅用于白名单适配器
}

/**
 * 统一评论数据格式（适配器输出）
 */
export interface UnifiedCommentData {
  platform: Platform;
  original_id: string; // 原始平台ID
  video_id: string;
  video_title?: string;
  video_url?: string;
  author_id: string;
  author_name?: string;
  content: string;
  publish_time: string; // ISO8601
  like_count?: number;
  reply_count?: number;
  region?: RegionTag;
  raw_data?: Record<string, any>; // 保留原始数据（调试用）
}

// ==================== 任务执行相关类型 ====================

/**
 * 任务执行上下文
 */
export interface TaskExecutionContext {
  task: TaskRow;
  comment?: CommentRow;
  template?: ReplyTemplateRow;
  device_id: string;
  account_config: {
    account_id: string;
    platform_credentials: Record<string, any>;
  };
}

/**
 * 执行结果
 */
export interface TaskExecutionResult {
  task_id: string;
  success: boolean;
  result_code: ResultCode;
  error_message?: string;
  execution_time_ms: number;
  response_data?: Record<string, any>;
}

/**
 * 任务队列状态
 */
export interface TaskQueueStatus {
  total_pending: number;
  executing_count: number;
  failed_count: number;
  average_execution_time_ms: number;
  last_processed_at?: string;
}

// ==================== 风控相关类型 ====================

/**
 * 风控规则
 */
export interface RiskControlRule {
  id: string;
  rule_name: string;
  rule_type: 'rate_limit' | 'duplication' | 'blacklist' | 'circuit_breaker';
  enabled: boolean;
  config: Record<string, any>;
  priority: number; // 执行优先级
  created_at: string;
  updated_at: string;
}

/**
 * 熔断状态
 */
export interface CircuitBreakerStatus {
  account_id: string;
  status: 'closed' | 'open' | 'half_open';
  failure_count: number;
  last_failure_at?: string;
  next_retry_at?: string;
  failure_threshold: number;
  recovery_timeout_seconds: number;
}

/**
 * 黑名单条目
 */
export interface BlacklistEntry {
  id: string;
  entry_type: 'keyword' | 'user_id' | 'domain' | 'content_pattern';
  value: string;
  reason: string;
  added_by: string;
  added_at: string;
  expires_at?: string; // 可选的过期时间
  enabled: boolean;
}

/**
 * 频控状态
 */
export interface RateLimitStatus {
  account_id: string;
  hourly_count: number;
  daily_count: number;
  last_action_at?: string;
  next_allowed_at?: string;
  remaining_quota: {
    hourly: number;
    daily: number;
  };
}

// ==================== Hook 返回类型 ====================

/**
 * 精准获客主 Hook 返回类型
 */
export interface UsePreciseAcquisitionReturn {
  // 候选池管理
  watchTargets: WatchTargetRow[];
  addWatchTarget: (payload: WatchTargetPayload) => Promise<void>;
  updateWatchTarget: (id: number, payload: Partial<WatchTargetPayload>) => Promise<void>;
  deleteWatchTarget: (id: number) => Promise<void>;
  refreshWatchTargets: () => Promise<void>;
  
  // 任务管理
  tasks: TaskRow[];
  createTask: (payload: TaskPayload) => Promise<void>;
  updateTaskStatus: (update: TaskStatusUpdate) => Promise<void>;
  refreshTasks: () => Promise<void>;
  
  // 评论管理
  comments: CommentRow[];
  fetchComments: (targetId: string) => Promise<void>;
  
  // 模板管理
  templates: ReplyTemplateRow[];
  addTemplate: (payload: ReplyTemplatePayload) => Promise<void>;
  updateTemplate: (id: string, payload: Partial<ReplyTemplatePayload>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
  
  // 标签管理
  tagMappings: TagMappingEntry[];
  addTagMapping: (entry: Omit<TagMappingEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  refreshTagMappings: () => Promise<void>;
  
  // 统计数据
  stats: PreciseAcquisitionStats | null;
  refreshStats: () => Promise<void>;
  
  // 加载状态
  loading: {
    watchTargets: boolean;
    tasks: boolean;
    comments: boolean;
    templates: boolean;
    stats: boolean;
  };
  
  // 错误状态
  error: string | null;
}

// ==================== 导出配置 ====================

/**
 * 日报导出配置
 */
export interface DailyReportExportConfig {
  date_range: {
    start_date: string; // YYYY-MM-DD
    end_date: string;
  };
  include_follow_list: boolean;
  include_reply_list: boolean;
  format: 'csv' | 'excel';
  grouping: 'by_account' | 'by_date' | 'unified';
}

/**
 * 导出的关注清单行
 */
export interface FollowListExportRow {
  关注日期: string;
  关注账号ID: string;
  目标用户ID?: string;
  执行设备: string;
  任务ID: string;
}

/**
 * 导出的回复清单行
 */
export interface ReplyListExportRow {
  日期: string;
  视频链接: string;
  评论账户ID: string;
  评论内容: string;
  回复账号ID: string;
  回复内容: string;
  任务ID: string;
  执行设备: string;
}
