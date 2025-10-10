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
  XIAOHONGSHU = 'xiaohongshu',
}

export const PLATFORM_OPTIONS = [
  { label: '抖音', value: Platform.DOUYIN },
  { label: '巨量引擎', value: Platform.OCEANENGINE },
  { label: '公开来源', value: Platform.PUBLIC },
  { label: '小红书', value: Platform.XIAOHONGSHU },
];

// ==================== 目标类型枚举 ====================

export enum TargetType {
  VIDEO = 'video',
  ACCOUNT = 'account',
  USER = 'user',
  CONTENT = 'content',
}

export const TARGET_TYPE_OPTIONS = [
  { label: '视频', value: TargetType.VIDEO },
  { label: '账号', value: TargetType.ACCOUNT },
  { label: '用户', value: TargetType.USER },
  { label: '内容', value: TargetType.CONTENT },
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

export const INDUSTRY_TAG_OPTIONS = [
  // 医疗健康类
  { label: '口腔护理', value: IndustryTag.ORAL_CARE },
  { label: '口腔正畸', value: IndustryTag.ORAL_ORTHODONTICS },
  { label: '母婴', value: IndustryTag.MATERNAL_BABY },
  { label: '医疗健康', value: IndustryTag.MEDICAL_HEALTH },
  { label: '健身', value: IndustryTag.FITNESS },

  // 美妆生活类
  { label: '美妆', value: IndustryTag.BEAUTY },
  { label: '护肤', value: IndustryTag.SKINCARE },
  { label: '家居生活', value: IndustryTag.HOME_FURNISHING },
  { label: '食品饮料', value: IndustryTag.FOOD_BEVERAGE },

  // 教育培训类
  { label: '教育培训', value: IndustryTag.EDUCATION_TRAINING },
  { label: '语言学习', value: IndustryTag.LANGUAGE_LEARNING },
  { label: '技能培训', value: IndustryTag.SKILL_TRAINING },

  // 科技数码类
  { label: '3C数码', value: IndustryTag.DIGITAL_3C },
  { label: '软件应用', value: IndustryTag.SOFTWARE_APPS },
  { label: 'AI科技', value: IndustryTag.AI_TECH },

  // 汽车交通类
  { label: '汽车', value: IndustryTag.AUTOMOTIVE },
  { label: '新能源汽车', value: IndustryTag.NEW_ENERGY_VEHICLE },

  // 旅游娱乐类
  { label: '旅游', value: IndustryTag.TRAVEL },
  { label: '娱乐', value: IndustryTag.ENTERTAINMENT },
  { label: '游戏', value: IndustryTag.GAMES },

  // 宠物服饰类
  { label: '宠物', value: IndustryTag.PETS },
  { label: '服饰时尚', value: IndustryTag.FASHION },

  // 金融服务类
  { label: '金融', value: IndustryTag.FINANCE },
  { label: '保险', value: IndustryTag.INSURANCE },
  { label: '房地产', value: IndustryTag.REAL_ESTATE },

  // 其他
  { label: '其他', value: IndustryTag.OTHER },
];

// ==================== 地域标签枚举 ====================

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

export const REGION_TAG_OPTIONS = [
  // 全国和大区
  { label: '全国', value: RegionTag.NATIONWIDE },
  { label: '华东', value: RegionTag.EAST_CHINA },
  { label: '华北', value: RegionTag.NORTH_CHINA },
  { label: '华南', value: RegionTag.SOUTH_CHINA },
  { label: '华中', value: RegionTag.CENTRAL_CHINA },
  { label: '西南', value: RegionTag.SOUTHWEST_CHINA },
  { label: '西北', value: RegionTag.NORTHWEST_CHINA },
  { label: '东北', value: RegionTag.NORTHEAST_CHINA },

  // 主要省份
  { label: '北京', value: RegionTag.BEIJING },
  { label: '上海', value: RegionTag.SHANGHAI },
  { label: '广东', value: RegionTag.GUANGDONG },
  { label: '浙江', value: RegionTag.ZHEJIANG },
  { label: '江苏', value: RegionTag.JIANGSU },
  { label: '山东', value: RegionTag.SHANDONG },
  { label: '四川', value: RegionTag.SICHUAN },
];

// ==================== 任务类型枚举 ====================

export enum TaskType {
  REPLY = 'reply',
  FOLLOW = 'follow',
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  VIEW = 'view',
}

export const TASK_TYPE_OPTIONS = [
  { label: '回复', value: TaskType.REPLY },
  { label: '关注', value: TaskType.FOLLOW },
  { label: '点赞', value: TaskType.LIKE },
  { label: '评论', value: TaskType.COMMENT },
  { label: '分享', value: TaskType.SHARE },
  { label: '浏览', value: TaskType.VIEW },
];

// ==================== 任务状态枚举 ====================

export enum TaskStatus {
  NEW = 'NEW',
  READY = 'READY',
  PENDING = 'PENDING',
  EXECUTING = 'EXECUTING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  // 额外的状态，用于兼容不同模块
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETRY = 'RETRY',
}

export const TASK_STATUS_OPTIONS = [
  { label: '新建', value: TaskStatus.NEW },
  { label: '就绪', value: TaskStatus.READY },
  { label: '待执行', value: TaskStatus.PENDING },
  { label: '执行中', value: TaskStatus.EXECUTING },
  { label: '进行中', value: TaskStatus.IN_PROGRESS },
  { label: '已完成', value: TaskStatus.DONE },
  { label: '完成', value: TaskStatus.COMPLETED },
  { label: '失败', value: TaskStatus.FAILED },
  { label: '已取消', value: TaskStatus.CANCELLED },
  { label: '重试', value: TaskStatus.RETRY },
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
  DELETE = 'DELETE',
}

export const AUDIT_ACTION_OPTIONS = [
  { label: '任务创建', value: AuditAction.TASK_CREATE },
  { label: '任务执行', value: AuditAction.TASK_EXECUTE },
  { label: '任务失败', value: AuditAction.TASK_FAIL },
  { label: '导出操作', value: AuditAction.EXPORT },
  { label: '导入操作', value: AuditAction.IMPORT },
  { label: '批次创建', value: AuditAction.BATCH_CREATE },
  { label: '评论拉取', value: AuditAction.COMMENT_FETCH },
  { label: '删除操作', value: AuditAction.DELETE },
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

// ==================== 标签体系管理 ====================

/**
 * 标签体系版本
 */
export const TAGS_VERSION = 'v1.0.0';

/**
 * 行业标签分类配置
 */
export interface IndustryTagCategory {
  name: string;
  tags: IndustryTag[];
  description?: string;
}

/**
 * 行业标签分类
 */
export const INDUSTRY_TAG_CATEGORIES: IndustryTagCategory[] = [
  {
    name: '医疗健康',
    tags: [
      IndustryTag.ORAL_CARE,
      IndustryTag.ORAL_ORTHODONTICS,
      IndustryTag.MATERNAL_BABY,
      IndustryTag.MEDICAL_HEALTH,
      IndustryTag.FITNESS
    ],
    description: '医疗、健康、护理相关行业'
  },
  {
    name: '美妆生活',
    tags: [
      IndustryTag.BEAUTY,
      IndustryTag.SKINCARE,
      IndustryTag.HOME_FURNISHING,
      IndustryTag.FOOD_BEVERAGE
    ],
    description: '美妆、生活用品、食品相关行业'
  },
  {
    name: '教育培训',
    tags: [
      IndustryTag.EDUCATION_TRAINING,
      IndustryTag.LANGUAGE_LEARNING,
      IndustryTag.SKILL_TRAINING
    ],
    description: '教育、培训、学习相关行业'
  },
  {
    name: '科技数码',
    tags: [
      IndustryTag.DIGITAL_3C,
      IndustryTag.SOFTWARE_APPS,
      IndustryTag.AI_TECH
    ],
    description: '科技、数码、软件相关行业'
  },
  {
    name: '交通出行',
    tags: [
      IndustryTag.AUTOMOTIVE,
      IndustryTag.NEW_ENERGY_VEHICLE,
      IndustryTag.TRAVEL
    ],
    description: '汽车、交通、旅游相关行业'
  },
  {
    name: '娱乐消费',
    tags: [
      IndustryTag.ENTERTAINMENT,
      IndustryTag.GAMES,
      IndustryTag.PETS,
      IndustryTag.FASHION
    ],
    description: '娱乐、游戏、宠物、服饰相关行业'
  },
  {
    name: '金融服务',
    tags: [
      IndustryTag.FINANCE,
      IndustryTag.INSURANCE,
      IndustryTag.REAL_ESTATE
    ],
    description: '金融、保险、房地产相关行业'
  }
];

/**
 * 外部标签到内部枚举的映射表
 */
export const EXTERNAL_TAG_MAPPING: Record<string, IndustryTag> = {
  // 中文标签映射
  '口腔': IndustryTag.ORAL_CARE,
  '口腔护理': IndustryTag.ORAL_CARE,
  '牙科': IndustryTag.ORAL_CARE,
  '正畸': IndustryTag.ORAL_ORTHODONTICS,
  '牙齿矫正': IndustryTag.ORAL_ORTHODONTICS,
  '母婴': IndustryTag.MATERNAL_BABY,
  '育儿': IndustryTag.MATERNAL_BABY,
  '孕婴': IndustryTag.MATERNAL_BABY,
  '医疗': IndustryTag.MEDICAL_HEALTH,
  '健康': IndustryTag.MEDICAL_HEALTH,
  '保健': IndustryTag.MEDICAL_HEALTH,
  '美妆': IndustryTag.BEAUTY,
  '化妆品': IndustryTag.BEAUTY,
  '护肤': IndustryTag.SKINCARE,
  '护肤品': IndustryTag.SKINCARE,
  '教育': IndustryTag.EDUCATION_TRAINING,
  '培训': IndustryTag.EDUCATION_TRAINING,
  '健身': IndustryTag.FITNESS,
  '运动': IndustryTag.FITNESS,
  '食品': IndustryTag.FOOD_BEVERAGE,
  '饮料': IndustryTag.FOOD_BEVERAGE,
  '家居': IndustryTag.HOME_FURNISHING,
  '生活用品': IndustryTag.HOME_FURNISHING,
  '3C': IndustryTag.DIGITAL_3C,
  '数码': IndustryTag.DIGITAL_3C,
  '电子产品': IndustryTag.DIGITAL_3C,
  '汽车': IndustryTag.AUTOMOTIVE,
  '新能源': IndustryTag.NEW_ENERGY_VEHICLE,
  '电动车': IndustryTag.NEW_ENERGY_VEHICLE,
  '旅游': IndustryTag.TRAVEL,
  '旅行': IndustryTag.TRAVEL,
  '宠物': IndustryTag.PETS,
  '宠物用品': IndustryTag.PETS,
  '服装': IndustryTag.FASHION,
  '服饰': IndustryTag.FASHION,
  '时尚': IndustryTag.FASHION,
  '金融': IndustryTag.FINANCE,
  '理财': IndustryTag.FINANCE,
  '保险': IndustryTag.INSURANCE,
  '房地产': IndustryTag.REAL_ESTATE,
  '房产': IndustryTag.REAL_ESTATE,
  
  // 英文标签映射
  'oral': IndustryTag.ORAL_CARE,
  'dental': IndustryTag.ORAL_CARE,
  'beauty': IndustryTag.BEAUTY,
  'cosmetics': IndustryTag.BEAUTY,
  'skincare': IndustryTag.SKINCARE,
  'education': IndustryTag.EDUCATION_TRAINING,
  'training': IndustryTag.EDUCATION_TRAINING,
  'fitness': IndustryTag.FITNESS,
  'healthcare': IndustryTag.MEDICAL_HEALTH,
  'medical': IndustryTag.MEDICAL_HEALTH,
  'automotive': IndustryTag.AUTOMOTIVE,
  'travel': IndustryTag.TRAVEL,
  'tourism': IndustryTag.TRAVEL,
  'pets': IndustryTag.PETS,
  'fashion': IndustryTag.FASHION,
  'finance': IndustryTag.FINANCE,
  'insurance': IndustryTag.INSURANCE,
  'realestate': IndustryTag.REAL_ESTATE,
};

/**
 * 外部地域标签映射
 */
export const EXTERNAL_REGION_MAPPING: Record<string, RegionTag> = {
  '全国': RegionTag.NATIONWIDE,
  '华东': RegionTag.EAST_CHINA,
  '华北': RegionTag.NORTH_CHINA,
  '华南': RegionTag.SOUTH_CHINA,
  '华中': RegionTag.CENTRAL_CHINA,
  '西南': RegionTag.SOUTHWEST_CHINA,
  '西北': RegionTag.NORTHWEST_CHINA,
  '东北': RegionTag.NORTHEAST_CHINA,
  '北京': RegionTag.BEIJING,
  '上海': RegionTag.SHANGHAI,
  '广东': RegionTag.GUANGDONG,
  '浙江': RegionTag.ZHEJIANG,
  '江苏': RegionTag.JIANGSU,
  '山东': RegionTag.SHANDONG,
  '四川': RegionTag.SICHUAN,
  
  // 英文映射
  'nationwide': RegionTag.NATIONWIDE,
  'beijing': RegionTag.BEIJING,
  'shanghai': RegionTag.SHANGHAI,
  'guangdong': RegionTag.GUANGDONG,
  'zhejiang': RegionTag.ZHEJIANG,
  'jiangsu': RegionTag.JIANGSU,
  'shandong': RegionTag.SHANDONG,
  'sichuan': RegionTag.SICHUAN,
};

// ==================== 标签验证和工具函数 ====================

/**
 * 验证行业标签是否有效
 */
export function isValidIndustryTag(tag: string): tag is IndustryTag {
  return Object.values(IndustryTag).includes(tag as IndustryTag);
}

/**
 * 验证地域标签是否有效
 */
export function isValidRegionTag(tag: string): tag is RegionTag {
  return Object.values(RegionTag).includes(tag as RegionTag);
}

/**
 * 验证行业标签数组
 */
export function validateIndustryTags(tags: string[]): {
  valid: IndustryTag[];
  invalid: string[];
} {
  const valid: IndustryTag[] = [];
  const invalid: string[] = [];

  for (const tag of tags) {
    if (isValidIndustryTag(tag)) {
      valid.push(tag);
    } else {
      invalid.push(tag);
    }
  }

  return { valid, invalid };
}

/**
 * 解析分号分隔的行业标签字符串
 */
export function parseIndustryTagsString(tagsString: string): {
  valid: IndustryTag[];
  invalid: string[];
} {
  if (!tagsString?.trim()) {
    return { valid: [], invalid: [] };
  }

  const tags = tagsString.split(';').map(tag => tag.trim()).filter(Boolean);
  return validateIndustryTags(tags);
}

/**
 * 将行业标签数组转换为分号分隔的字符串
 */
export function formatIndustryTagsToString(tags: IndustryTag[]): string {
  return tags.join(';');
}

/**
 * 解析行业标签字符串为数组
 */
export function parseIndustryTags(value: string): IndustryTag[] {
  const { valid } = parseIndustryTagsString(value);
  return valid;
}

/**
 * 格式化行业标签数组为字符串
 */
export function formatIndustryTags(tags: IndustryTag[]): string {
  return formatIndustryTagsToString(tags);
}

/**
 * 获取行业标签的显示名称
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
 * 获取所有可用的行业标签选项（用于下拉菜单等）
 */
export function getIndustryTagOptions(): Array<{ label: string; value: IndustryTag }> {
  return INDUSTRY_TAG_OPTIONS.map(option => ({ ...option }));
}

/**
 * 获取所有可用的地域标签选项（用于下拉菜单等）
 */
export function getRegionTagOptions(): Array<{ label: string; value: RegionTag }> {
  return REGION_TAG_OPTIONS.map(option => ({ ...option }));
}

/**
 * 映射外部标签到内部枚举
 */
export function mapExternalTagToInternal(externalTag: string): IndustryTag | null {
  const normalized = externalTag.toLowerCase().trim();
  return EXTERNAL_TAG_MAPPING[normalized] || null;
}

/**
 * 映射外部地域标签到内部枚举
 */
export function mapExternalRegionToInternal(externalRegion: string): RegionTag | null {
  const normalized = externalRegion.toLowerCase().trim();
  return EXTERNAL_REGION_MAPPING[normalized] || null;
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