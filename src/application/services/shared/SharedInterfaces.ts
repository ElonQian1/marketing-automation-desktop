// src/application/services/shared/SharedInterfaces.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 共享接口定义
 * 
 * 定义精准获客系统中所有模块共享的接口、类型和枚举，包括：
 * - 基础数据类型定义
 * - 业务实体接口
 * - 服务层接口
 * - 事件和消息定义
 * - 通用配置接口
 */

import { Platform, TaskStatus, TaskType } from '../../../constants/precise-acquisition-enums';

// ==================== 基础类型定义 ====================

/**
 * 评论收集追踪类型
 */
export enum CommentCollectionTrack {
  LIVE = 'live',
  BATCH = 'batch',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled'
}

/**
 * 通用ID类型
 */
export type EntityId = string | number;

/**
 * 时间戳类型
 */
export type Timestamp = number | Date;

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 操作结果
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  timestamp: Date;
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult<T = any> {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    item: T;
    success: boolean;
    error?: string;
  }>;
  errors: string[];
}

// ==================== 业务实体接口 ====================

/**
 * 标签实体
 */
export interface TagEntity {
  id: EntityId;
  name: string;
  description?: string;
  color?: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  metadata?: Record<string, any>;
}

/**
 * 标签分类
 */
export interface TagCategory {
  id: EntityId;
  name: string;
  description?: string;
  parentId?: EntityId;
  sortOrder: number;
  isActive: boolean;
  tagCount: number;
}

/**
 * 用户实体
 */
export interface UserEntity {
  id: EntityId;
  platform: Platform;
  platformUserId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  profile?: UserProfile;
  tags: TagEntity[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

/**
 * 用户资料
 */
export interface UserProfile {
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  verificationStatus?: 'none' | 'personal' | 'enterprise';
  location?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  interests?: string[];
  demographics?: {
    ageRange?: string;
    gender?: string;
    occupation?: string;
  };
}

/**
 * 评论实体
 */
export interface CommentEntity {
  id: EntityId;
  platform: Platform;
  platformCommentId: string;
  postId: string;
  parentCommentId?: string;
  authorId: EntityId;
  content: string;
  metadata?: {
    likes?: number;
    replies?: number;
    mentions?: string[];
    hashtags?: string[];
    mediaUrls?: string[];
  };
  track: CommentCollectionTrack;
  collectedAt: Date;
  createdAt: Date;
  isProcessed: boolean;
  tags: TagEntity[];
}

/**
 * 任务实体
 */
export interface TaskEntity {
  id: EntityId;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description?: string;
  platform: Platform;
  config: TaskConfig;
  schedule?: TaskSchedule;
  progress: TaskProgress;
  results?: TaskResults;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: EntityId;
  metadata?: Record<string, unknown>;
}

/**
 * 任务配置
 */
export interface TaskConfig {
  targetUsers?: EntityId[];
  targetPosts?: string[];
  filters?: TaskFilters;
  limits?: TaskLimits;
  options?: Record<string, any>;
}

/**
 * 任务过滤器
 */
export interface TaskFilters {
  tags?: EntityId[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  userFilters?: {
    minFollowers?: number;
    maxFollowers?: number;
    verifiedOnly?: boolean;
    activeWithinDays?: number;
  };
  contentFilters?: {
    keywords?: string[];
    excludeKeywords?: string[];
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * 任务限制
 */
export interface TaskLimits {
  maxActions?: number;
  maxDuration?: number; // 秒
  rateLimit?: {
    actionsPerMinute?: number;
    actionsPerHour?: number;
    actionsPerDay?: number;
  };
  concurrent?: {
    maxConcurrentTasks?: number;
    maxConcurrentActions?: number;
  };
}

/**
 * 任务调度
 */
export interface TaskSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  startAt?: Date;
  endAt?: Date;
  cronExpression?: string;
  timezone?: string;
  isActive: boolean;
}

/**
 * 任务进度
 */
export interface TaskProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep?: string;
  percentage: number;
  estimatedTimeRemaining?: number;
  errors: TaskError[];
  warnings: string[];
}

/**
 * 任务错误
 */
export interface TaskError {
  step: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
  retryCount: number;
}

/**
 * 任务结果
 */
export interface TaskResults {
  summary: {
    successful: number;
    failed: number;
    skipped: number;
    total: number;
  };
  metrics: Record<string, number>;
  artifacts?: string[]; // 文件路径或URL
  logs?: string[];
}

// ==================== 数据传输对象 (DTO) ====================

/**
 * 创建标签DTO
 */
export interface CreateTagDto {
  name: string;
  description?: string;
  color?: string;
  category: string;
  metadata?: Record<string, any>;
}

/**
 * 更新标签DTO
 */
export interface UpdateTagDto {
  name?: string;
  description?: string;
  color?: string;
  category?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 用户查询DTO
 */
export interface UserQueryDto {
  platform?: Platform;
  tags?: EntityId[];
  isActive?: boolean;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  pagination: PaginationParams;
}

/**
 * 创建任务DTO
 */
export interface CreateTaskDto {
  type: TaskType;
  title: string;
  description?: string;
  platform: Platform;
  config: TaskConfig;
  schedule?: TaskSchedule;
}

/**
 * 更新任务DTO
 */
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  config?: Partial<TaskConfig>;
  schedule?: Partial<TaskSchedule>;
  status?: TaskStatus;
}

// ==================== 服务接口定义 ====================

/**
 * 标签管理服务接口
 */
export interface ITagManagementService {
  // 标签CRUD
  createTag(dto: CreateTagDto): Promise<TagEntity>;
  updateTag(id: EntityId, dto: UpdateTagDto): Promise<TagEntity>;
  deleteTag(id: EntityId): Promise<void>;
  getTag(id: EntityId): Promise<TagEntity | null>;
  listTags(filters?: Partial<TagEntity>): Promise<TagEntity[]>;
  
  // 标签分类
  createCategory(name: string, description?: string): Promise<TagCategory>;
  updateCategory(id: EntityId, updates: Partial<TagCategory>): Promise<TagCategory>;
  deleteCategory(id: EntityId): Promise<void>;
  listCategories(): Promise<TagCategory[]>;
  
  // 标签关联
  applyTagsToUser(userId: EntityId, tagIds: EntityId[]): Promise<void>;
  removeTagsFromUser(userId: EntityId, tagIds: EntityId[]): Promise<void>;
  getUserTags(userId: EntityId): Promise<TagEntity[]>;
  getTagUsers(tagId: EntityId): Promise<UserEntity[]>;
}

/**
 * 用户管理服务接口
 */
export interface IUserManagementService {
  // 用户CRUD
  createUser(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  updateUser(id: EntityId, updates: Partial<UserEntity>): Promise<UserEntity>;
  deleteUser(id: EntityId): Promise<void>;
  getUser(id: EntityId): Promise<UserEntity | null>;
  getUserByPlatformId(platform: Platform, platformUserId: string): Promise<UserEntity | null>;
  
  // 用户查询
  queryUsers(query: UserQueryDto): Promise<PaginatedResult<UserEntity>>;
  searchUsers(term: string, platform?: Platform): Promise<UserEntity[]>;
  getUsersByTags(tagIds: EntityId[]): Promise<UserEntity[]>;
  
  // 用户批量操作
  importUsers(users: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<BatchOperationResult<UserEntity>>;
  exportUsers(filters?: Partial<UserEntity>): Promise<string>; // 返回文件路径
  
  // 用户统计
  getUserStats(): Promise<{
    total: number;
    byPlatform: Record<Platform, number>;
    byStatus: Record<string, number>;
    recentlyActive: number;
  }>;
}

/**
 * 评论管理服务接口
 */
export interface ICommentManagementService {
  // 评论CRUD
  createComment(comment: Omit<CommentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommentEntity>;
  updateComment(id: EntityId, updates: Partial<CommentEntity>): Promise<CommentEntity>;
  deleteComment(id: EntityId): Promise<void>;
  getComment(id: EntityId): Promise<CommentEntity | null>;
  
  // 评论查询
  getCommentsByPost(postId: string, platform: Platform): Promise<CommentEntity[]>;
  getCommentsByUser(userId: EntityId): Promise<CommentEntity[]>;
  getCommentsByTrack(track: CommentCollectionTrack): Promise<CommentEntity[]>;
  
  // 评论收集
  startCollection(postIds: string[], track: CommentCollectionTrack, platform: Platform): Promise<string>; // 返回任务ID
  stopCollection(taskId: string): Promise<void>;
  getCollectionStatus(taskId: string): Promise<TaskProgress>;
  
  // 评论分析
  analyzeComments(commentIds: EntityId[]): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    keywords: string[];
    topics: string[];
    users: UserEntity[];
  }>;
}

/**
 * 任务管理服务接口
 */
export interface ITaskManagementService {
  // 任务CRUD
  createTask(dto: CreateTaskDto): Promise<TaskEntity>;
  updateTask(id: EntityId, dto: UpdateTaskDto): Promise<TaskEntity>;
  deleteTask(id: EntityId): Promise<void>;
  getTask(id: EntityId): Promise<TaskEntity | null>;
  listTasks(filters?: Partial<TaskEntity>): Promise<TaskEntity[]>;
  
  // 任务执行
  startTask(id: EntityId): Promise<void>;
  pauseTask(id: EntityId): Promise<void>;
  resumeTask(id: EntityId): Promise<void>;
  stopTask(id: EntityId): Promise<void>;
  retryTask(id: EntityId): Promise<void>;
  
  // 任务监控
  getTaskProgress(id: EntityId): Promise<TaskProgress>;
  getTaskLogs(id: EntityId): Promise<string[]>;
  getRunningTasks(): Promise<TaskEntity[]>;
  
  // 任务调度
  scheduleTask(id: EntityId, schedule: TaskSchedule): Promise<void>;
  unscheduleTask(id: EntityId): Promise<void>;
  getScheduledTasks(): Promise<TaskEntity[]>;
}

/**
 * 报告服务接口
 */
export interface IReportingService {
  // 报告生成
  generateDailyReport(date: Date): Promise<DailyReport>;
  generateWeeklyReport(startDate: Date): Promise<WeeklyReport>;
  generateMonthlyReport(year: number, month: number): Promise<MonthlyReport>;
  generateCustomReport(config: ReportConfig): Promise<CustomReport>;
  
  // 报告查询
  getReport(id: EntityId): Promise<Report | null>;
  listReports(type?: string): Promise<Report[]>;
  deleteReport(id: EntityId): Promise<void>;
  
  // 数据导出
  exportToExcel(reportId: EntityId): Promise<string>; // 返回文件路径
  exportToPdf(reportId: EntityId): Promise<string>; // 返回文件路径
  exportToJson(reportId: EntityId): Promise<string>; // 返回JSON字符串
}

// ==================== 报告相关接口 ====================

/**
 * 基础报告接口
 */
export interface Report {
  id: EntityId;
  type: string;
  title: string;
  description?: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  metadata?: Record<string, any>;
}

/**
 * 日报
 */
export interface DailyReport extends Report {
  type: 'daily';
  data: {
    summary: {
      totalUsers: number;
      newUsers: number;
      activeUsers: number;
      totalComments: number;
      newComments: number;
      tasksCompleted: number;
      tasksFailed: number;
    };
    platformStats: Record<Platform, {
      users: number;
      comments: number;
      tasks: number;
    }>;
    topTags: Array<{
      tag: TagEntity;
      usageCount: number;
    }>;
    issues: string[];
  };
}

/**
 * 周报
 */
export interface WeeklyReport extends Report {
  type: 'weekly';
  data: {
    summary: {
      totalGrowth: number;
      userGrowth: number;
      commentGrowth: number;
      taskSuccessRate: number;
    };
    trends: {
      daily: Array<{
        date: Date;
        users: number;
        comments: number;
        tasks: number;
      }>;
    };
    insights: string[];
  };
}

/**
 * 月报
 */
export interface MonthlyReport extends Report {
  type: 'monthly';
  data: {
    summary: {
      totalUsers: number;
      userGrowthRate: number;
      totalComments: number;
      commentGrowthRate: number;
      totalTasks: number;
      taskSuccessRate: number;
    };
    comparisons: {
      previousMonth: {
        users: number;
        comments: number;
        tasks: number;
      };
    };
    achievements: string[];
    recommendations: string[];
  };
}

/**
 * 自定义报告
 */
export interface CustomReport extends Report {
  type: 'custom';
  config: ReportConfig;
  data: any;
}

/**
 * 报告配置
 */
export interface ReportConfig {
  title: string;
  description?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: {
    platforms?: Platform[];
    tags?: EntityId[];
    userIds?: EntityId[];
  };
  metrics: string[];
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeCharts?: boolean;
  includeRawData?: boolean;
}

// ==================== 事件和消息定义 ====================

/**
 * 系统事件
 */
export interface SystemEvent<T = any> {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: T;
  metadata?: Record<string, any>;
}

/**
 * 用户事件
 */
export interface UserEvent extends SystemEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | 'user.tagged' | 'user.untagged';
  data: {
    userId: EntityId;
    user?: UserEntity;
    changes?: Partial<UserEntity>;
    tags?: EntityId[];
  };
}

/**
 * 任务事件
 */
export interface TaskEvent extends SystemEvent {
  type: 'task.created' | 'task.started' | 'task.completed' | 'task.failed' | 'task.cancelled';
  data: {
    taskId: EntityId;
    task?: TaskEntity;
    progress?: TaskProgress;
    results?: TaskResults;
  };
}

/**
 * 评论事件
 */
export interface CommentEvent extends SystemEvent {
  type: 'comment.collected' | 'comment.processed' | 'comment.tagged';
  data: {
    commentId: EntityId;
    comment?: CommentEntity;
    tags?: EntityId[];
  };
}

/**
 * 系统通知
 */
export interface SystemNotification {
  id: EntityId;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  userId?: EntityId;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// ==================== 配置接口 ====================

/**
 * 模块配置接口
 */
export interface ModuleConfig {
  enabled: boolean;
  version: string;
  settings: Record<string, any>;
}

/**
 * 集成配置接口
 */
export interface IntegrationConfig {
  name: string;
  type: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, any>;
  healthCheck?: {
    url: string;
    interval: number;
    timeout: number;
  };
}

/**
 * API配置接口
 */
export interface ApiConfig {
  baseUrl: string;
  version: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  authentication: {
    type: 'none' | 'api_key' | 'oauth' | 'bearer';
    credentials?: Record<string, string>;
  };
}

// ==================== 验证和规则接口 ====================

/**
 * 验证规则
 */
export interface ValidationRule {
  field: string;
  type: 'required' | 'string' | 'number' | 'email' | 'url' | 'date' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
  options?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
  };
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

/**
 * 业务规则
 */
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  condition: string; // 规则表达式
  action: string; // 执行动作
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 元数据和扩展接口 ====================

/**
 * 实体元数据
 */
export interface EntityMetadata {
  version: number;
  schema: string;
  source: string;
  lastModified: Date;
  checksum?: string;
  tags?: string[];
  custom?: Record<string, any>;
}

/**
 * 扩展属性接口
 */
export interface ExtendableEntity {
  extensions?: Record<string, any>;
  metadata?: EntityMetadata;
}

/**
 * 审计信息接口
 */
export interface AuditInfo {
  createdBy: EntityId;
  createdAt: Date;
  updatedBy?: EntityId;
  updatedAt?: Date;
  version: number;
  changeLog?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changedBy: EntityId;
    changedAt: Date;
  }>;
}

// Note: All interfaces are already exported individually above