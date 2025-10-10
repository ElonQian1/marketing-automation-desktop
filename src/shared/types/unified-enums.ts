/**
 * 统一的枚举类型定义
 * 优先使用 constants/precise-acquisition-enums.ts 中的更完整定义
 * 解决多重定义冲突问题
 */

// ==================== 平台枚举 ====================

export enum Platform {
  DOUYIN = 'douyin',
  OCEANENGINE = 'oceanengine', 
  PUBLIC = 'public',
  // 添加缺失的 XIAOHONGSHU
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
  // 添加缺失的类型
  USER = 'user',
  CONTENT = 'content',
}

export const TARGET_TYPE_OPTIONS = [
  { label: '视频', value: TargetType.VIDEO },
  { label: '账号', value: TargetType.ACCOUNT },
  { label: '用户', value: TargetType.USER },
  { label: '内容', value: TargetType.CONTENT },
];

// ==================== 任务状态枚举 ====================

export enum TaskStatus {
  NEW = 'NEW',              // 新建
  READY = 'READY',          // 就绪
  EXECUTING = 'EXECUTING',  // 执行中
  DONE = 'DONE',           // 完成
  FAILED = 'FAILED',       // 失败
  // 添加缺失的状态
  PENDING = 'PENDING',     // 待执行
}

export const TASK_STATUS_OPTIONS = [
  { label: '新建', value: TaskStatus.NEW },
  { label: '就绪', value: TaskStatus.READY },
  { label: '待执行', value: TaskStatus.PENDING },
  { label: '执行中', value: TaskStatus.EXECUTING },
  { label: '完成', value: TaskStatus.DONE },
  { label: '失败', value: TaskStatus.FAILED },
];

// ==================== 任务类型枚举 ====================

export enum TaskType {
  REPLY = 'reply',
  FOLLOW = 'follow',
  // 添加缺失的任务类型
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
}

// ==================== 执行模式枚举 ====================

export enum ExecutorMode {
  API = 'api',        // API执行（优先）
  MANUAL = 'manual'   // 半自动跳转
}

// ==================== 结果码枚举 ====================

export enum ResultCode {
  OK = 'OK',
  RATE_LIMITED = 'RATE_LIMITED',
  DUPLICATED = 'DUPLICATED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  BLOCKED = 'BLOCKED',
  ERROR = 'ERROR'
}