/**
 * 精准获客系统 - 标签体系与枚举定义
 * 
 * 根据 Round 2｜标签体系与维护（v1）文档规范
 * 确保前后端一致性和校验规则的标准化
 */

// ==================== 平台枚举 ====================

export enum Platform {
  DOUYIN = 'douyin',
  OCEANENGINE = 'oceanengine', 
  PUBLIC = 'public',
}

export const PLATFORM_OPTIONS = [
  { label: '抖音', value: Platform.DOUYIN },
  { label: '巨量引擎', value: Platform.OCEANENGINE },
  { label: '公开来源', value: Platform.PUBLIC },
];

// ==================== 目标类型枚举 ====================

export enum TargetType {
  VIDEO = 'video',
  ACCOUNT = 'account',
}

export const TARGET_TYPE_OPTIONS = [
  { label: '视频', value: TargetType.VIDEO },
  { label: '账号', value: TargetType.ACCOUNT },
];

// ==================== 来源类型枚举 ====================

export enum SourceType {
  MANUAL = 'manual',
  CSV = 'csv',
  WHITELIST = 'whitelist',
  ADS = 'ads',
}

export const SOURCE_TYPE_OPTIONS = [
  { label: '人工添加', value: SourceType.MANUAL },
  { label: 'CSV导入', value: SourceType.CSV },
  { label: '白名单来源', value: SourceType.WHITELIST },
  { label: '广告回流', value: SourceType.ADS },
];

// ==================== 行业标签枚举 ====================

export enum IndustryTag {
  ORAL_CARE = '口腔',
  MATERNAL_BABY = '母婴',
  MEDICAL_HEALTH = '医疗健康',
  BEAUTY = '美妆',
  EDUCATION_TRAINING = '教育培训',
  FITNESS = '健身',
  FOOD_BEVERAGE = '食品饮料',
  HOME_FURNISHING = '家居',
  DIGITAL_3C = '3C',
  AUTOMOTIVE = '汽车',
  TRAVEL = '旅游',
  PETS = '宠物',
  FASHION = '服饰',
  FINANCE = '金融',
  REAL_ESTATE = '房产',
  ENTERTAINMENT = '娱乐',
}

export const INDUSTRY_TAG_OPTIONS = [
  { label: '口腔', value: IndustryTag.ORAL_CARE },
  { label: '母婴', value: IndustryTag.MATERNAL_BABY },
  { label: '医疗健康', value: IndustryTag.MEDICAL_HEALTH },
  { label: '美妆', value: IndustryTag.BEAUTY },
  { label: '教育培训', value: IndustryTag.EDUCATION_TRAINING },
  { label: '健身', value: IndustryTag.FITNESS },
  { label: '食品饮料', value: IndustryTag.FOOD_BEVERAGE },
  { label: '家居', value: IndustryTag.HOME_FURNISHING },
  { label: '3C数码', value: IndustryTag.DIGITAL_3C },
  { label: '汽车', value: IndustryTag.AUTOMOTIVE },
  { label: '旅游', value: IndustryTag.TRAVEL },
  { label: '宠物', value: IndustryTag.PETS },
  { label: '服饰', value: IndustryTag.FASHION },
  { label: '金融', value: IndustryTag.FINANCE },
  { label: '房产', value: IndustryTag.REAL_ESTATE },
  { label: '娱乐', value: IndustryTag.ENTERTAINMENT },
];

// ==================== 地域标签枚举 ====================

export enum RegionTag {
  NATIONWIDE = '全国',
  EAST_CHINA = '华东',
  NORTH_CHINA = '华北', 
  SOUTH_CHINA = '华南',
  CENTRAL_CHINA = '华中',
  SOUTHWEST_CHINA = '西南',
  NORTHWEST_CHINA = '西北',
  NORTHEAST_CHINA = '东北',
}

export const REGION_TAG_OPTIONS = [
  { label: '全国', value: RegionTag.NATIONWIDE },
  { label: '华东', value: RegionTag.EAST_CHINA },
  { label: '华北', value: RegionTag.NORTH_CHINA },
  { label: '华南', value: RegionTag.SOUTH_CHINA },
  { label: '华中', value: RegionTag.CENTRAL_CHINA },
  { label: '西南', value: RegionTag.SOUTHWEST_CHINA },
  { label: '西北', value: RegionTag.NORTHWEST_CHINA },
  { label: '东北', value: RegionTag.NORTHEAST_CHINA },
];

// ==================== 任务类型枚举 ====================

export enum TaskType {
  REPLY = 'reply',
  FOLLOW = 'follow',
}

export const TASK_TYPE_OPTIONS = [
  { label: '回复', value: TaskType.REPLY },
  { label: '关注', value: TaskType.FOLLOW },
];

// ==================== 任务状态枚举 ====================

export enum TaskStatus {
  NEW = 'NEW',
  READY = 'READY',
  EXECUTING = 'EXECUTING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export const TASK_STATUS_OPTIONS = [
  { label: '新建', value: TaskStatus.NEW },
  { label: '就绪', value: TaskStatus.READY },
  { label: '执行中', value: TaskStatus.EXECUTING },
  { label: '已完成', value: TaskStatus.DONE },
  { label: '失败', value: TaskStatus.FAILED },
];

// ==================== 执行器模式枚举 ====================

export enum ExecutorMode {
  API = 'api',
  MANUAL = 'manual',
}

export const EXECUTOR_MODE_OPTIONS = [
  { label: 'API自动', value: ExecutorMode.API },
  { label: '人工操作', value: ExecutorMode.MANUAL },
];

// ==================== 结果代码枚举 ====================

export enum ResultCode {
  OK = 'OK',
  RATE_LIMITED = 'RATE_LIMITED',
  DUPLICATED = 'DUPLICATED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  BLOCKED = 'BLOCKED',
  TEMP_ERROR = 'TEMP_ERROR',
  PERM_ERROR = 'PERM_ERROR',
}

export const RESULT_CODE_OPTIONS = [
  { label: '成功', value: ResultCode.OK },
  { label: '频率限制', value: ResultCode.RATE_LIMITED },
  { label: '重复操作', value: ResultCode.DUPLICATED },
  { label: '权限不足', value: ResultCode.PERMISSION_DENIED },
  { label: '目标不存在', value: ResultCode.NOT_FOUND },
  { label: '被屏蔽', value: ResultCode.BLOCKED },
  { label: '临时错误', value: ResultCode.TEMP_ERROR },
  { label: '永久错误', value: ResultCode.PERM_ERROR },
];

// ==================== 模板渠道枚举 ====================

export enum TemplateChannel {
  ALL = 'all',
  DOUYIN = 'douyin',
  OCEANENGINE = 'oceanengine',
}

export const TEMPLATE_CHANNEL_OPTIONS = [
  { label: '通用', value: TemplateChannel.ALL },
  { label: '抖音专用', value: TemplateChannel.DOUYIN },
  { label: '巨量引擎专用', value: TemplateChannel.OCEANENGINE },
];

// ==================== 审计动作枚举 ====================

export enum AuditAction {
  TASK_CREATE = 'TASK_CREATE',
  TASK_EXECUTE = 'TASK_EXECUTE',
  TASK_FAIL = 'TASK_FAIL',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BATCH_CREATE = 'BATCH_CREATE',
  COMMENT_FETCH = 'COMMENT_FETCH',
}

export const AUDIT_ACTION_OPTIONS = [
  { label: '任务创建', value: AuditAction.TASK_CREATE },
  { label: '任务执行', value: AuditAction.TASK_EXECUTE },
  { label: '任务失败', value: AuditAction.TASK_FAIL },
  { label: '导出操作', value: AuditAction.EXPORT },
  { label: '导入操作', value: AuditAction.IMPORT },
  { label: '批次创建', value: AuditAction.BATCH_CREATE },
  { label: '评论拉取', value: AuditAction.COMMENT_FETCH },
];

// ==================== 校验函数 ====================

/**
 * 校验平台枚举值
 */
export function validatePlatform(value: string): boolean {
  return Object.values(Platform).includes(value as Platform);
}

/**
 * 校验目标类型枚举值
 */
export function validateTargetType(value: string): boolean {
  return Object.values(TargetType).includes(value as TargetType);
}

/**
 * 校验来源类型枚举值
 */
export function validateSourceType(value: string): boolean {
  return Object.values(SourceType).includes(value as SourceType);
}

/**
 * 校验行业标签（支持分号分隔的多个标签）
 */
export function validateIndustryTags(value: string): boolean {
  if (!value || value.trim() === '') return true; // 允许空值
  
  const tags = value.split(';').map(tag => tag.trim());
  return tags.every(tag => Object.values(IndustryTag).includes(tag as IndustryTag));
}

/**
 * 校验地域标签
 */
export function validateRegionTag(value: string): boolean {
  return Object.values(RegionTag).includes(value as RegionTag);
}

/**
 * 校验任务状态
 */
export function validateTaskStatus(value: string): boolean {
  return Object.values(TaskStatus).includes(value as TaskStatus);
}

/**
 * 校验执行器模式
 */
export function validateExecutorMode(value: string): boolean {
  return Object.values(ExecutorMode).includes(value as ExecutorMode);
}

/**
 * 校验结果代码
 */
export function validateResultCode(value: string): boolean {
  return Object.values(ResultCode).includes(value as ResultCode);
}

/**
 * 校验模板渠道
 */
export function validateTemplateChannel(value: string): boolean {
  return Object.values(TemplateChannel).includes(value as TemplateChannel);
}

/**
 * 校验审计动作
 */
export function validateAuditAction(value: string): boolean {
  return Object.values(AuditAction).includes(value as AuditAction);
}

// ==================== 工具函数 ====================

/**
 * 解析行业标签字符串为数组
 */
export function parseIndustryTags(value: string): IndustryTag[] {
  if (!value || value.trim() === '') return [];
  
  return value.split(';')
    .map(tag => tag.trim())
    .filter(tag => Object.values(IndustryTag).includes(tag as IndustryTag)) as IndustryTag[];
}

/**
 * 格式化行业标签数组为字符串
 */
export function formatIndustryTags(tags: IndustryTag[]): string {
  return tags.join(';');
}

/**
 * 获取标签的显示名称
 */
export function getIndustryTagLabel(tag: IndustryTag): string {
  const option = INDUSTRY_TAG_OPTIONS.find(opt => opt.value === tag);
  return option?.label || tag;
}

/**
 * 获取地域标签的显示名称
 */
export function getRegionTagLabel(tag: RegionTag): string {
  const option = REGION_TAG_OPTIONS.find(opt => opt.value === tag);
  return option?.label || tag;
}

/**
 * 获取平台的显示名称
 */
export function getPlatformLabel(platform: Platform): string {
  const option = PLATFORM_OPTIONS.find(opt => opt.value === platform);
  return option?.label || platform;
}

/**
 * 获取任务状态的显示名称
 */
export function getTaskStatusLabel(status: TaskStatus): string {
  const option = TASK_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label || status;
}

/**
 * 获取结果代码的显示名称
 */
export function getResultCodeLabel(code: ResultCode): string {
  const option = RESULT_CODE_OPTIONS.find(opt => opt.value === code);
  return option?.label || code;
}

// ==================== 导出配置 ====================

/**
 * 所有枚举选项的集合，方便统一管理
 */
export const ALL_ENUM_OPTIONS = {
  platform: PLATFORM_OPTIONS,
  targetType: TARGET_TYPE_OPTIONS,
  sourceType: SOURCE_TYPE_OPTIONS,
  industryTag: INDUSTRY_TAG_OPTIONS,
  regionTag: REGION_TAG_OPTIONS,
  taskType: TASK_TYPE_OPTIONS,
  taskStatus: TASK_STATUS_OPTIONS,
  executorMode: EXECUTOR_MODE_OPTIONS,
  resultCode: RESULT_CODE_OPTIONS,
  templateChannel: TEMPLATE_CHANNEL_OPTIONS,
  auditAction: AUDIT_ACTION_OPTIONS,
};

/**
 * 所有校验函数的集合
 */
export const ALL_VALIDATORS = {
  platform: validatePlatform,
  targetType: validateTargetType,
  sourceType: validateSourceType,
  industryTags: validateIndustryTags,
  regionTag: validateRegionTag,
  taskStatus: validateTaskStatus,
  executorMode: validateExecutorMode,
  resultCode: validateResultCode,
  templateChannel: validateTemplateChannel,
  auditAction: validateAuditAction,
};