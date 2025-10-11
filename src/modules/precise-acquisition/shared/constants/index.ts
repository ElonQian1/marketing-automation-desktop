// src/modules/precise-acquisition/shared/constants/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客常量定义
 * 
 * 基于文档：round_2_｜标签体系与维护（v_1_）.md
 * 统一管理枚举映射、默认配置等常量
 */

import { 
  Platform, 
  TargetType, 
  SourceType, 
  IndustryTag, 
  RegionTag, 
  TaskStatus, 
  TaskType,
  ExecutorMode,
  ResultCode,
  AuditAction
} from '../types/core';

// ==================== 平台配置 ====================

/**
 * 平台显示名称映射
 */
export const PLATFORM_LABELS: Record<Platform, string> = {
  [Platform.DOUYIN]: '抖音',
  [Platform.OCEANENGINE]: '巨量引擎',
  [Platform.PUBLIC]: '公开平台',
  [Platform.XIAOHONGSHU]: '小红书'
};

/**
 * 目标类型显示名称
 */
export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  [TargetType.VIDEO]: '视频',
  [TargetType.ACCOUNT]: '账号'
};

/**
 * 来源类型显示名称
 */
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  [SourceType.MANUAL]: '人工添加',
  [SourceType.CSV]: 'CSV导入',
  [SourceType.WHITELIST]: '白名单采集',
  [SourceType.ADS]: '广告回流'
};

// ==================== 标签体系 ====================

/**
 * 行业标签显示配置
 */
export const INDUSTRY_TAG_CONFIG: Record<IndustryTag, {
  label: string;
  color: string;
  description: string;
}> = {
  [IndustryTag.ORAL_CARE]: {
    label: '口腔护理',
    color: '#52c41a',
    description: '口腔医疗、牙科、正畸等'
  },
  [IndustryTag.MATERNAL_INFANT]: {
    label: '母婴用品',
    color: '#ff7875',
    description: '孕婴用品、儿童教育等'
  },
  [IndustryTag.MEDICAL_HEALTH]: {
    label: '医疗健康',
    color: '#1890ff',
    description: '医疗器械、健康咨询等'
  },
  [IndustryTag.BEAUTY]: {
    label: '美妆护肤',
    color: '#eb2f96',
    description: '化妆品、护肤品、美容服务'
  },
  [IndustryTag.EDUCATION]: {
    label: '教育培训',
    color: '#722ed1',
    description: '在线教育、技能培训等'
  },
  [IndustryTag.FITNESS]: {
    label: '健身运动',
    color: '#f5222d',
    description: '健身器材、运动服装等'
  },
  [IndustryTag.FOOD_BEVERAGE]: {
    label: '食品饮料',
    color: '#fa8c16',
    description: '食品、饮料、餐饮服务'
  },
  [IndustryTag.HOME]: {
    label: '家居生活',
    color: '#a0d911',
    description: '家具、家电、装修等'
  },
  [IndustryTag.ELECTRONICS]: {
    label: '3C数码',
    color: '#13c2c2',
    description: '电脑、手机、数码产品'
  },
  [IndustryTag.AUTOMOTIVE]: {
    label: '汽车服务',
    color: '#595959',
    description: '汽车销售、维修、配件'
  },
  [IndustryTag.TRAVEL]: {
    label: '旅游出行',
    color: '#2f54eb',
    description: '旅行社、酒店、交通'
  },
  [IndustryTag.PETS]: {
    label: '宠物用品',
    color: '#faad14',
    description: '宠物食品、用品、医疗'
  },
  [IndustryTag.FASHION]: {
    label: '服饰时尚',
    color: '#d48806',
    description: '服装、鞋包、配饰'
  }
};

/**
 * 地域标签配置
 */
export const REGION_TAG_CONFIG: Record<RegionTag, {
  label: string;
  provinces: string[];
}> = {
  [RegionTag.NATIONWIDE]: {
    label: '全国',
    provinces: []
  },
  [RegionTag.EAST_CHINA]: {
    label: '华东地区',
    provinces: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东']
  },
  [RegionTag.NORTH_CHINA]: {
    label: '华北地区',
    provinces: ['北京', '天津', '河北', '山西', '内蒙古']
  },
  [RegionTag.SOUTH_CHINA]: {
    label: '华南地区',
    provinces: ['广东', '广西', '海南']
  },
  [RegionTag.CENTRAL_CHINA]: {
    label: '华中地区',
    provinces: ['河南', '湖北', '湖南']
  },
  [RegionTag.SOUTHWEST_CHINA]: {
    label: '西南地区',
    provinces: ['重庆', '四川', '贵州', '云南', '西藏']
  },
  [RegionTag.NORTHWEST_CHINA]: {
    label: '西北地区',
    provinces: ['陕西', '甘肃', '青海', '宁夏', '新疆']
  },
  [RegionTag.NORTHEAST_CHINA]: {
    label: '东北地区',
    provinces: ['辽宁', '吉林', '黑龙江']
  },
  // 主要省份配置
  [RegionTag.BEIJING]: {
    label: '北京市',
    provinces: ['北京']
  },
  [RegionTag.SHANGHAI]: {
    label: '上海市',
    provinces: ['上海']
  },
  [RegionTag.GUANGDONG]: {
    label: '广东省',
    provinces: ['广东']
  },
  [RegionTag.ZHEJIANG]: {
    label: '浙江省',
    provinces: ['浙江']
  },
  [RegionTag.JIANGSU]: {
    label: '江苏省',
    provinces: ['江苏']
  },
  [RegionTag.SHANDONG]: {
    label: '山东省',
    provinces: ['山东']
  },
  [RegionTag.SICHUAN]: {
    label: '四川省',
    provinces: ['四川']
  },
  [RegionTag.HUBEI]: {
    label: '湖北省',
    provinces: ['湖北']
  },
  [RegionTag.HUNAN]: {
    label: '湖南省',
    provinces: ['湖南']
  },
  [RegionTag.FUJIAN]: {
    label: '福建省',
    provinces: ['福建']
  },
  [RegionTag.HEBEI]: {
    label: '河北省',
    provinces: ['河北']
  },
  [RegionTag.HENAN]: {
    label: '河南省',
    provinces: ['河南']
  },
  [RegionTag.ANHUI]: {
    label: '安徽省',
    provinces: ['安徽']
  },
  [RegionTag.LIAONING]: {
    label: '辽宁省',
    provinces: ['辽宁']
  },
  [RegionTag.JILIN]: {
    label: '吉林省',
    provinces: ['吉林']
  },
  [RegionTag.HEILONGJIANG]: {
    label: '黑龙江省',
    provinces: ['黑龙江']
  }
};

// ==================== 任务相关 ====================

/**
 * 任务状态配置
 */
export const TASK_STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  color: string;
  description: string;
}> = {
  [TaskStatus.NEW]: {
    label: '新建',
    color: '#d9d9d9',
    description: '任务已创建，等待处理'
  },
  [TaskStatus.READY]: {
    label: '就绪',
    color: '#1890ff',
    description: '任务已就绪，可以执行'
  },
  [TaskStatus.PENDING]: {
    label: '待执行',
    color: '#faad14',
    description: '任务待执行'
  },
  [TaskStatus.EXECUTING]: {
    label: '执行中',
    color: '#fa8c16',
    description: '任务正在执行'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: '进行中',
    color: '#722ed1',
    description: '任务正在进行中'
  },
  [TaskStatus.DONE]: {
    label: '完成',
    color: '#52c41a',
    description: '任务执行成功'
  },
  [TaskStatus.COMPLETED]: {
    label: '已完成',
    color: '#389e0d',
    description: '任务已成功完成'
  },
  [TaskStatus.FAILED]: {
    label: '失败',
    color: '#ff4d4f',
    description: '任务执行失败'
  },
  [TaskStatus.CANCELLED]: {
    label: '已取消',
    color: '#8c8c8c',
    description: '任务已被取消'
  },
  [TaskStatus.RETRY]: {
    label: '重试',
    color: '#eb2f96',
    description: '任务正在重试'
  }
};

/**
 * 任务类型配置
 */
export const TASK_TYPE_CONFIG: Record<TaskType, {
  label: string;
  icon: string;
  description: string;
}> = {
  [TaskType.REPLY]: {
    label: '回复任务',
    icon: '💬',
    description: '对评论进行回复'
  },
  [TaskType.FOLLOW]: {
    label: '关注任务',
    icon: '👥',
    description: '关注目标用户'
  },
  [TaskType.LIKE]: {
    label: '点赞任务',
    icon: '👍',
    description: '对内容进行点赞'
  },
  [TaskType.COMMENT]: {
    label: '评论任务',
    icon: '💭',
    description: '对内容进行评论'
  },
  [TaskType.SHARE]: {
    label: '分享任务',
    icon: '📤',
    description: '分享内容到其他平台'
  },
  [TaskType.VIEW]: {
    label: '浏览任务',
    icon: '👀',
    description: '浏览指定内容'
  }
};

/**
 * 执行模式配置
 */
export const EXECUTOR_MODE_CONFIG: Record<ExecutorMode, {
  label: string;
  priority: number;
  description: string;
}> = {
  [ExecutorMode.API]: {
    label: 'API执行',
    priority: 1,
    description: '通过API自动执行（优先）'
  },
  [ExecutorMode.MANUAL]: {
    label: '半自动',
    priority: 2,
    description: '跳转到目标页面，人工确认执行'
  }
};

/**
 * 结果码配置
 */
export const RESULT_CODE_CONFIG: Record<ResultCode, {
  label: string;
  type: 'success' | 'warning' | 'error';
  description: string;
}> = {
  [ResultCode.OK]: {
    label: '成功',
    type: 'success',
    description: '任务执行成功'
  },
  [ResultCode.RATE_LIMITED]: {
    label: '频控限制',
    type: 'warning',
    description: '触发频率限制，任务延后'
  },
  [ResultCode.DUPLICATED]: {
    label: '重复操作',
    type: 'warning',
    description: '检测到重复操作，已跳过'
  },
  [ResultCode.PERMISSION_DENIED]: {
    label: '权限不足',
    type: 'error',
    description: '无权限执行此操作'
  },
  [ResultCode.NOT_FOUND]: {
    label: '目标不存在',
    type: 'error',
    description: '目标评论或用户不存在'
  },
  [ResultCode.BLOCKED]: {
    label: '被拦截',
    type: 'error',
    description: '操作被平台拦截'
  },
  [ResultCode.TEMP_ERROR]: {
    label: '临时错误',
    type: 'warning',
    description: '临时性错误，可重试'
  },
  [ResultCode.PERM_ERROR]: {
    label: '永久错误',
    type: 'error',
    description: '永久性错误，无法重试'
  }
};

// ==================== 默认配置 ====================

/**
 * 默认频控配置
 */
export const DEFAULT_RATE_LIMIT_CONFIG = {
  hour_limit: 20,           // 每小时20个操作
  day_limit: 150,           // 每日150个操作
  min_interval_seconds: 90, // 最小间隔90秒
  max_interval_seconds: 180, // 最大间隔180秒
  dedup_window_days: 7,     // 7天去重窗口
  cross_device_dedup: true  // 启用跨设备去重
};

/**
 * 默认任务生成配置
 */
export const DEFAULT_TASK_GENERATION_CONFIG = {
  keywords: [],
  exclude_keywords: ['广告', '推广', '营销'],
  min_like_count: 1,
  time_window_hours: 24,
  regions: [],
  max_tasks_per_account: 50,
  priority_keywords: ['咨询', '了解', '购买', '联系']
};

/**
 * CSV导入模板列定义
 */
export const CSV_IMPORT_COLUMNS = [
  { key: 'type', label: '类型', required: true, example: 'video' },
  { key: 'platform', label: '平台', required: true, example: 'douyin' },
  { key: 'id_or_url', label: 'ID或URL', required: true, example: 'https://www.douyin.com/video/xxxx' },
  { key: 'title', label: '标题', required: false, example: '示例视频' },
  { key: 'source', label: '来源', required: true, example: 'csv' },
  { key: 'industry_tags', label: '行业标签', required: false, example: '口腔;健康' },
  { key: 'region', label: '地区', required: false, example: '华东' },
  { key: 'notes', label: '备注', required: false, example: '——' }
];

/**
 * 日报导出列定义
 */
export const DAILY_REPORT_COLUMNS = {
  follow_list: [
    { key: 'date', label: '关注日期' },
    { key: 'account_id', label: '关注账号ID' }
  ],
  reply_list: [
    { key: 'date', label: '日期' },
    { key: 'video_link', label: '视频链接' },
    { key: 'comment_user_id', label: '评论账户ID' },
    { key: 'comment_content', label: '评论内容' },
    { key: 'reply_account_id', label: '回复账号ID' },
    { key: 'reply_content', label: '回复内容' }
  ]
};

// ==================== 验证规则 ====================

/**
 * URL验证规则
 */
export const URL_PATTERNS = {
  [Platform.DOUYIN]: {
    video: /^https:\/\/www\.douyin\.com\/video\/\d+/,
    user: /^https:\/\/www\.douyin\.com\/user\/[\w-]+/
  },
  [Platform.OCEANENGINE]: {
    // 巨量引擎相关URL模式
    campaign: /^https:\/\/.*oceanengine.*\/campaign\/\d+/
  },
  [Platform.PUBLIC]: {
    // 公开平台的URL验证由白名单控制
    general: /^https?:\/\/.+/
  }
};

/**
 * 字段验证规则
 */
export const VALIDATION_RULES = {
  // 必填字段
  required_fields: ['type', 'platform', 'id_or_url', 'source'],
  
  // 字符长度限制
  max_lengths: {
    title: 200,
    notes: 500,
    template_text: 2000,
    comment_content: 5000
  },
  
  // 数组长度限制
  max_array_sizes: {
    industry_tags: 5,
    keywords: 20,
    variables: 10
  },
  
  // 批量导入限制
  MAX_IMPORT_ROWS: 1000
};

/**
 * 敏感词黑名单（示例）
 */
export const SENSITIVE_WORDS = [
  '违法', '违规', '欺诈', '传销', 
  '赌博', '色情', '暴力', '恐怖',
  '政治', '敏感', '反动', '颠覆'
];

/**
 * 审计动作标签
 */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.TASK_CREATE]: '创建任务',
  [AuditAction.TASK_EXECUTE]: '执行任务',
  [AuditAction.TASK_FAIL]: '任务失败',
  [AuditAction.EXPORT]: '导出数据',
  [AuditAction.IMPORT]: '导入数据',
  [AuditAction.COMMENT_FETCH]: '拉取评论'
};