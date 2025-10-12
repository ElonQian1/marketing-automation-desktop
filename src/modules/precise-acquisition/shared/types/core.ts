// src/modules/precise-acquisition/shared/types/core.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客核心类型定义
 * 
 * 基于文档：round_2_｜候选池字段清单（v_1_）.md
 * 实现合规三步法的核心数据结构
 */

// ==================== 枚举类型 ====================

/**
 * 平台类型枚举 - 统一使用标准定义
 */
export enum Platform {
  DOUYIN = 'douyin',
  OCEANENGINE = 'oceanengine', 
  PUBLIC = 'public',
  XIAOHONGSHU = 'xiaohongshu',
}

/**
 * 目标类型枚举
 */
export enum TargetType {
  VIDEO = 'video',
  ACCOUNT = 'account',
  USER = 'user',
  CONTENT = 'content',
}

/**
 * 来源类型枚举
 */
export enum SourceType {
  MANUAL = 'manual',    // 人工添加
  CSV = 'csv',          // CSV导入
  WHITELIST = 'whitelist', // 白名单采集
  ADS = 'ads'           // 广告系统回流
}

/**
 * 行业标签枚举 - 与constants/precise-acquisition-enums.ts完全一致
 */
export enum IndustryTag {
  // 医疗健康类
  ORAL_CARE = '口腔',
  ORAL_ORTHODONTICS = '口腔正畸',
  MATERNAL_BABY = '母婴',
  MEDICAL_HEALTH = '医疗健康',
  FITNESS = '健身',

  // 美妆生活类
  BEAUTY = '美妆',
  SKINCARE = '护肤',
  HOME_FURNISHING = '家居',
  FOOD_BEVERAGE = '食品饮料',

  // 教育培训类
  EDUCATION_TRAINING = '教育培训',
  LANGUAGE_LEARNING = '语言学习',
  SKILL_TRAINING = '技能培训',

  // 科技数码类
  DIGITAL_3C = '3C',
  SOFTWARE_APPS = '软件应用',
  AI_TECH = 'AI科技',

  // 汽车交通类
  AUTOMOTIVE = '汽车',
  NEW_ENERGY_VEHICLE = '新能源汽车',

  // 旅游娱乐类
  TRAVEL = '旅游',
  ENTERTAINMENT = '娱乐',
  GAMES = '游戏',

  // 宠物服饰类
  PETS = '宠物',
  FASHION = '服饰',

  // 金融服务类
  FINANCE = '金融',
  INSURANCE = '保险',
  REAL_ESTATE = '房产',

  // 其他
  OTHER = '其他'
}

/**
 * 地域标签枚举 - 统一使用标准定义
 */
export enum RegionTag {
  // 全国和大区
  NATIONWIDE = '全国',
  EAST_CHINA = '华东',
  NORTH_CHINA = '华北', 
  SOUTH_CHINA = '华南',
  CENTRAL_CHINA = '华中',
  SOUTHWEST_CHINA = '西南',
  NORTHWEST_CHINA = '西北',
  NORTHEAST_CHINA = '东北',

  // 主要省份（可扩展）
  BEIJING = '北京',
  SHANGHAI = '上海',
  GUANGDONG = '广东',
  ZHEJIANG = '浙江',
  JIANGSU = '江苏',
  SHANDONG = '山东',
  SICHUAN = '四川',
  HUBEI = '湖北',
  HUNAN = '湖南',
  FUJIAN = '福建',
  HEBEI = '河北',
  HENAN = '河南',
  ANHUI = '安徽',
  LIAONING = '辽宁',
  JILIN = '吉林',
  HEILONGJIANG = '黑龙江'
}

/**
 * 任务类型枚举
 */
export enum TaskType {
  REPLY = 'reply',      // 回复任务
  FOLLOW = 'follow',    // 关注任务
  LIKE = 'like',        // 点赞任务
  COMMENT = 'comment',  // 评论任务
  SHARE = 'share',      // 分享任务
  VIEW = 'view'         // 观看任务
}

/**
 * 任务优先级枚举
 */
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * 任务分配策略枚举
 */
export enum TaskAssignmentStrategy {
  ROUND_ROBIN = 'round_robin',    // 轮询分配
  LOAD_BALANCED = 'load_balanced', // 负载均衡
  PRIORITY_FIRST = 'priority_first', // 优先级优先
  DEVICE_SPECIFIC = 'device_specific' // 设备专用
}

/**
 * 任务状态枚举（状态机）
 * 与 constants/precise-acquisition-enums.ts 保持同步
 */
export enum TaskStatus {
  NEW = 'NEW',              // 新建
  READY = 'READY',          // 就绪
  PENDING = 'PENDING',      // 待执行
  EXECUTING = 'EXECUTING',  // 执行中
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  DONE = 'DONE',           // 完成
  COMPLETED = 'COMPLETED',  // 已完成
  FAILED = 'FAILED',       // 失败
  CANCELLED = 'CANCELLED',  // 已取消
  RETRY = 'RETRY'          // 重试
}

/**
 * 执行模式枚举
 */
export enum ExecutorMode {
  API = 'api',        // API执行（优先）
  MANUAL = 'manual'   // 半自动跳转
}

/**
 * 结果码枚举
 */
export enum ResultCode {
  OK = 'OK',
  RATE_LIMITED = 'RATE_LIMITED',
  DUPLICATED = 'DUPLICATED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  BLOCKED = 'BLOCKED',
  TEMP_ERROR = 'TEMP_ERROR',
  PERM_ERROR = 'PERM_ERROR'
}

/**
 * 审计动作枚举
 */
export enum AuditAction {
  TASK_CREATE = 'TASK_CREATE',
  TASK_EXECUTE = 'TASK_EXECUTE',
  TASK_FAIL = 'TASK_FAIL',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  COMMENT_FETCH = 'COMMENT_FETCH'
}

// ==================== 核心数据类型 ====================

/**
 * 候选池目标（watch_targets表）
 */
export interface WatchTarget {
  id: string;
  target_type: TargetType;
  platform: Platform;
  platform_id_or_url: string;
  title?: string;
  source: SourceType;
  industry_tags?: IndustryTag[];
  region_tag?: RegionTag;
  last_fetch_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 评论实体（comments表）
 */
export interface Comment {
  id: string;
  platform: Platform;
  video_id: string;
  author_id: string;
  content: string;
  like_count?: number;
  publish_time: Date;
  region?: RegionTag;
  source_target_id: string; // 溯源到watch_targets.id
  inserted_at: Date;
}

/**
 * 任务实体（tasks表）
 */
export interface Task {
  id: string;
  task_type: TaskType;
  platform: Platform;
  status: TaskStatus;
  priority: TaskPriority;
  
  // 任务目标
  target_id: string;        // 关联到 WatchTarget
  comment_id?: string;      // reply任务必填
  target_user_id?: string;  // follow任务必填
  target_nickname?: string; // 目标用户昵称
  target_comment_id?: string; // 目标评论ID
  
  // 任务分配
  assigned_device_id?: string;
  assign_account_id?: string;
  assigned_at?: Date;
  
  // 执行相关
  executor_mode?: ExecutorMode;
  result_code?: ResultCode;
  error_message?: string;
  action_params?: Record<string, unknown>; // 动作参数
  estimated_duration_ms?: number;
  dependencies?: string[]; // 依赖的任务ID
  
  // 调度相关
  scheduled_time?: Date;
  scheduled_at?: Date;      // 兼容字段
  
  // 重试机制
  retry_count: number;
  max_retries: number;
  
  // 去重
  dedup_key?: string;
  
  // 时间戳
  created_at: Date;
  updated_at: Date;
  executed_at?: Date;
  completed_at?: Date;      // 完成时间
  
  // 元数据支持（与 SemiAutoTask 保持一致）
  metadata?: Record<string, unknown>;
}

/**
 * 话术模板（reply_templates表）
 */
export interface ReplyTemplate {
  id: string;
  template_name: string;
  channel: Platform | 'all';
  text: string;
  variables?: string[];
  category?: string;
  enabled: boolean;
  updated_at: Date;
  
  // UI组件期望的扩展属性
  platform?: Platform;
  task_type?: TaskType;
  tags?: string[];
  usage_count?: number;
  success_rate?: number;
  content?: string;
  created_by?: string;
  created_at?: Date;
}

/**
 * 审计日志（audit_logs表）
 */
export interface AuditLog {
  id: string;
  action: AuditAction;
  task_id?: string;
  account_id?: string;
  operator: string;
  payload_hash?: string;
  ts: Date;
}

/**
 * 日报（daily_reports表）
 */
export interface DailyReport {
  date: Date;
  follow_count: number;
  reply_count: number;
  file_path: string;
}

// ==================== 配置和参数类型 ====================

/**
 * 任务生成配置
 */
export interface TaskGenerationConfig {
  keywords: string[];
  exclude_keywords?: string[];
  min_like_count?: number;
  time_window_hours?: number;
  regions?: RegionTag[];
  max_tasks_per_account?: number;
  priority_keywords?: string[];
}

/**
 * 频控配置
 */
export interface RateLimitConfig {
  hour_limit: number;        // 小时上限
  day_limit: number;         // 日上限
  min_interval_seconds: number;  // 最小间隔（随机范围下限）
  max_interval_seconds: number;  // 最大间隔（随机范围上限）
  dedup_window_days: number;     // 用户级去重窗口
  cross_device_dedup: boolean;   // 跨设备去重
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
}

/**
 * CSV导入验证结果
 */
export interface ImportValidationResult {
  valid_rows: WatchTarget[];
  invalid_rows: Array<{
    row_index: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

/**
 * 统计数据类型
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
  daily_stats: {
    date: string;
    replies: number;
    follows: number;
  }[];
}

// ==================== 操作参数类型 ====================

/**
 * 候选池查询参数
 */
export interface WatchTargetQueryParams {
  limit?: number;
  offset?: number;
  platform?: Platform;
  target_type?: TargetType;
  source?: SourceType;
  industry_tags?: IndustryTag[];
  region_tag?: RegionTag;
  keyword?: string;
}

/**
 * 评论查询参数
 */
export interface CommentQueryParams {
  limit?: number;
  offset?: number;
  platform?: Platform;
  source_target_id?: string;
  region?: RegionTag;
  min_like_count?: number;
  time_range?: {
    start: Date;
    end: Date;
  };
}

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  limit?: number;
  offset?: number;
  status?: TaskStatus;
  task_type?: TaskType;
  assign_account_id?: string;
  created_after?: Date;
  created_before?: Date;
}