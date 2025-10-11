// src/constants/precise-acquisition-whitelist.ts
// module: shared | layer: application | role: 常量定义
// summary: 全局常量和枚举值

/**
 * 精准获客系统 - 白名单和枚举映射表
 * 
 * 基于文档：round_2_｜标签体系与维护（v1）.md
 * 提供行业标签、地域标签的白名单映射和验证
 */

import { IndustryTag, RegionTag, Platform, SourceType } from './precise-acquisition-enums';

// ==================== 行业标签白名单 ====================

/**
 * 行业标签映射表
 * 外部CSV可能使用中文名称，需要映射到内部枚举值
 */
export const INDUSTRY_TAG_MAPPING: Record<string, IndustryTag> = {
  // 医疗健康类
  '口腔': IndustryTag.ORAL_CARE,
  '口腔护理': IndustryTag.ORAL_CARE,
  '口腔正畸': IndustryTag.ORAL_ORTHODONTICS,
  '正畸': IndustryTag.ORAL_ORTHODONTICS,
  '母婴': IndustryTag.MATERNAL_BABY,
  '育儿': IndustryTag.MATERNAL_BABY,
  '亲子': IndustryTag.MATERNAL_BABY,
  '医疗健康': IndustryTag.MEDICAL_HEALTH,
  '医疗': IndustryTag.MEDICAL_HEALTH,
  '健康': IndustryTag.MEDICAL_HEALTH,
  '健身': IndustryTag.FITNESS,
  '运动': IndustryTag.FITNESS,
  '瑜伽': IndustryTag.FITNESS,
  
  // 美妆生活类
  '美妆': IndustryTag.BEAUTY,
  '化妆品': IndustryTag.BEAUTY,
  '护肤': IndustryTag.SKINCARE,
  '家居': IndustryTag.HOME_FURNISHING,
  '家装': IndustryTag.HOME_FURNISHING,
  '装修': IndustryTag.HOME_FURNISHING,
  '食品饮料': IndustryTag.FOOD_BEVERAGE,
  '食品': IndustryTag.FOOD_BEVERAGE,
  '饮料': IndustryTag.FOOD_BEVERAGE,
  
  // 教育培训类
  '教育培训': IndustryTag.EDUCATION_TRAINING,
  '教育': IndustryTag.EDUCATION_TRAINING,
  '培训': IndustryTag.EDUCATION_TRAINING,
  '语言学习': IndustryTag.LANGUAGE_LEARNING,
  '语言': IndustryTag.LANGUAGE_LEARNING,
  '技能培训': IndustryTag.SKILL_TRAINING,
  '技能': IndustryTag.SKILL_TRAINING,
  
  // 科技数码类
  '3C': IndustryTag.DIGITAL_3C,
  '数码': IndustryTag.DIGITAL_3C,
  '软件应用': IndustryTag.SOFTWARE_APPS,
  '软件': IndustryTag.SOFTWARE_APPS,
  'AI科技': IndustryTag.AI_TECH,
  'AI': IndustryTag.AI_TECH,
  '科技': IndustryTag.AI_TECH,
  
  // 汽车交通类
  '汽车': IndustryTag.AUTOMOTIVE,
  '车辆': IndustryTag.AUTOMOTIVE,
  '新能源汽车': IndustryTag.NEW_ENERGY_VEHICLE,
  '新能源': IndustryTag.NEW_ENERGY_VEHICLE,
  
  // 旅游娱乐类
  '旅游': IndustryTag.TRAVEL,
  '旅行': IndustryTag.TRAVEL,
  '娱乐': IndustryTag.ENTERTAINMENT,
  '游戏': IndustryTag.GAMES,
  
  // 宠物服饰类
  '宠物': IndustryTag.PETS,
  '萌宠': IndustryTag.PETS,
  '服饰': IndustryTag.FASHION,
  '服装': IndustryTag.FASHION,
  '时尚': IndustryTag.FASHION,
  
  // 金融服务类
  '金融': IndustryTag.FINANCE,
  '保险': IndustryTag.INSURANCE,
  '房产': IndustryTag.REAL_ESTATE,
  '房地产': IndustryTag.REAL_ESTATE,
  
  // 其他
  '其他': IndustryTag.OTHER,
  
  // 小写英文映射（兼容性）
  'oral_care': IndustryTag.ORAL_CARE,
  'oral_orthodontics': IndustryTag.ORAL_ORTHODONTICS,
  'maternal_baby': IndustryTag.MATERNAL_BABY,
  'medical_health': IndustryTag.MEDICAL_HEALTH,
  'fitness': IndustryTag.FITNESS,
  'beauty': IndustryTag.BEAUTY,
  'skincare': IndustryTag.SKINCARE,
  'home_furnishing': IndustryTag.HOME_FURNISHING,
  'food_beverage': IndustryTag.FOOD_BEVERAGE,
  'education_training': IndustryTag.EDUCATION_TRAINING,
  'language_learning': IndustryTag.LANGUAGE_LEARNING,
  'skill_training': IndustryTag.SKILL_TRAINING,
  'digital_3c': IndustryTag.DIGITAL_3C,
  'software_apps': IndustryTag.SOFTWARE_APPS,
  'ai_tech': IndustryTag.AI_TECH,
  'automotive': IndustryTag.AUTOMOTIVE,
  'new_energy_vehicle': IndustryTag.NEW_ENERGY_VEHICLE,
  'travel': IndustryTag.TRAVEL,
  'entertainment': IndustryTag.ENTERTAINMENT,
  'games': IndustryTag.GAMES,
  'pets': IndustryTag.PETS,
  'fashion': IndustryTag.FASHION,
  'finance': IndustryTag.FINANCE,
  'insurance': IndustryTag.INSURANCE,
  'real_estate': IndustryTag.REAL_ESTATE,
  'other': IndustryTag.OTHER,
};

/**
 * 获取所有支持的行业标签中文名称
 */
export const getAllIndustryTagNames = (): string[] => {
  return Object.keys(INDUSTRY_TAG_MAPPING).filter(key => 
    /[\u4e00-\u9fa5]/.test(key) // 只返回中文名称
  );
};

/**
 * 验证并转换行业标签
 */
export const validateAndMapIndustryTag = (input: string): IndustryTag | null => {
  const normalized = input.trim().toLowerCase();
  return INDUSTRY_TAG_MAPPING[normalized] || INDUSTRY_TAG_MAPPING[input.trim()] || null;
};

// ==================== 地域标签白名单 ====================

/**
 * 地域标签映射表
 */
export const REGION_TAG_MAPPING: Record<string, RegionTag> = {
  // 大区级别
  '全国': RegionTag.NATIONWIDE,
  '华东': RegionTag.EAST_CHINA,
  '华北': RegionTag.NORTH_CHINA,
  '华南': RegionTag.SOUTH_CHINA,
  '华中': RegionTag.CENTRAL_CHINA,
  '西南': RegionTag.SOUTHWEST_CHINA,
  '西北': RegionTag.NORTHWEST_CHINA,
  '东北': RegionTag.NORTHEAST_CHINA,
  
  // 省份级别
  '北京': RegionTag.BEIJING,
  '上海': RegionTag.SHANGHAI,
  '广东': RegionTag.GUANGDONG,
  '浙江': RegionTag.ZHEJIANG,
  '江苏': RegionTag.JIANGSU,
  '山东': RegionTag.SHANDONG,
  '四川': RegionTag.SICHUAN,
  '湖北': RegionTag.HUBEI,
  '湖南': RegionTag.HUNAN,
  '福建': RegionTag.FUJIAN,
  '河北': RegionTag.HEBEI,
  '河南': RegionTag.HENAN,
  '安徽': RegionTag.ANHUI,
  '辽宁': RegionTag.LIAONING,
  '吉林': RegionTag.JILIN,
  '黑龙江': RegionTag.HEILONGJIANG,
  
  // 英文映射（兼容性）
  'nationwide': RegionTag.NATIONWIDE,
  'east_china': RegionTag.EAST_CHINA,
  'north_china': RegionTag.NORTH_CHINA,
  'south_china': RegionTag.SOUTH_CHINA,
  'central_china': RegionTag.CENTRAL_CHINA,
  'southwest_china': RegionTag.SOUTHWEST_CHINA,
  'northwest_china': RegionTag.NORTHWEST_CHINA,
  'northeast_china': RegionTag.NORTHEAST_CHINA,
  'beijing': RegionTag.BEIJING,
  'shanghai': RegionTag.SHANGHAI,
  'guangdong': RegionTag.GUANGDONG,
  'zhejiang': RegionTag.ZHEJIANG,
  'jiangsu': RegionTag.JIANGSU,
  'shandong': RegionTag.SHANDONG,
  'sichuan': RegionTag.SICHUAN,
  'hubei': RegionTag.HUBEI,
  'hunan': RegionTag.HUNAN,
  'fujian': RegionTag.FUJIAN,
  'hebei': RegionTag.HEBEI,
  'henan': RegionTag.HENAN,
  'anhui': RegionTag.ANHUI,
  'liaoning': RegionTag.LIAONING,
  'jilin': RegionTag.JILIN,
  'heilongjiang': RegionTag.HEILONGJIANG,
};

/**
 * 获取所有支持的地域标签中文名称
 */
export const getAllRegionTagNames = (): string[] => {
  return Object.keys(REGION_TAG_MAPPING).filter(key => 
    /[\u4e00-\u9fa5]/.test(key) // 只返回中文名称
  );
};

/**
 * 验证并转换地域标签
 */
export const validateAndMapRegionTag = (input: string): RegionTag | null => {
  const normalized = input.trim().toLowerCase();
  return REGION_TAG_MAPPING[normalized] || REGION_TAG_MAPPING[input.trim()] || null;
};

// ==================== 白名单数据源 ====================

/**
 * 白名单数据源配置
 * 用于验证public平台的数据来源是否合规
 */
export interface WhitelistDataSource {
  id: string;
  name: string;
  domain: string;
  allowed: boolean;
  robots_txt_compliant: boolean;
  last_verified: string;
  notes?: string;
}

/**
 * 预定义的白名单数据源
 * 实际使用时应该从配置文件或数据库加载
 */
export const WHITELIST_DATA_SOURCES: WhitelistDataSource[] = [
  {
    id: 'example_public_1',
    name: '示例公开数据源1',
    domain: 'example1.com',
    allowed: true,
    robots_txt_compliant: true,
    last_verified: '2024-01-01',
    notes: '示例数据源，允许抓取公开评论'
  },
  {
    id: 'example_public_2',
    name: '示例公开数据源2',
    domain: 'example2.com',
    allowed: false,
    robots_txt_compliant: false,
    last_verified: '2024-01-01',
    notes: '示例数据源，禁止抓取'
  }
];

/**
 * 检查URL是否在白名单中
 */
export const isUrlInWhitelist = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    return WHITELIST_DATA_SOURCES.some(source => 
      source.allowed && 
      source.robots_txt_compliant && 
      domain.includes(source.domain)
    );
  } catch {
    return false;
  }
};

/**
 * 获取URL对应的白名单数据源
 */
export const getWhitelistDataSource = (url: string): WhitelistDataSource | null => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    return WHITELIST_DATA_SOURCES.find(source => 
      domain.includes(source.domain)
    ) || null;
  } catch {
    return null;
  }
};

// ==================== 平台URL验证 ====================

/**
 * 平台URL模式验证
 */
export const PLATFORM_URL_PATTERNS: Record<Platform, RegExp[]> = {
  [Platform.DOUYIN]: [
    /^https?:\/\/(www\.)?douyin\.com\/video\/\d+/,
    /^https?:\/\/(www\.)?douyin\.com\/user\/[a-zA-Z0-9_]+/,
  ],
  [Platform.OCEANENGINE]: [
    /^https?:\/\/(www\.)?oceanengine\.com\//,
  ],
  [Platform.PUBLIC]: [
    /^https?:\/\/.+/, // 任何HTTP/HTTPS URL，但需要通过白名单检查
  ],
  [Platform.XIAOHONGSHU]: [
    /^https?:\/\/(www\.)?xiaohongshu\.com\/explore\/[a-zA-Z0-9]+/,
    /^https?:\/\/(www\.)?xiaohongshu\.com\/user\/profile\/[a-zA-Z0-9]+/,
  ],
};

/**
 * 验证URL是否符合平台格式
 */
export const validatePlatformUrl = (platform: Platform, url: string): boolean => {
  const patterns = PLATFORM_URL_PATTERNS[platform];
  if (!patterns) return false;
  
  // 基础URL格式检查
  const isValidUrl = patterns.some(pattern => pattern.test(url));
  if (!isValidUrl) return false;
  
  // 公开平台需要额外的白名单检查
  if (platform === Platform.PUBLIC) {
    return isUrlInWhitelist(url);
  }
  
  return true;
};

// ==================== 导出校验函数 ====================

/**
 * 综合校验函数，用于CSV导入时的数据验证
 */
export const validateCsvRowData = (row: {
  platform?: string;
  industry_tags?: string;
  region?: string;
  id_or_url?: string;
}): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证平台
  if (row.platform && !Object.values(Platform).includes(row.platform as Platform)) {
    errors.push(`不支持的平台: ${row.platform}`);
  }
  
  // 验证行业标签
  if (row.industry_tags) {
    const tags = row.industry_tags.split(';').filter(Boolean);
    const invalidTags = tags.filter(tag => !validateAndMapIndustryTag(tag));
    if (invalidTags.length > 0) {
      errors.push(`不支持的行业标签: ${invalidTags.join(', ')}`);
    }
  }
  
  // 验证地域标签
  if (row.region && !validateAndMapRegionTag(row.region)) {
    errors.push(`不支持的地域标签: ${row.region}`);
  }
  
  // 验证URL（如果是URL格式）
  if (row.id_or_url && row.id_or_url.startsWith('http') && row.platform) {
    if (!validatePlatformUrl(row.platform as Platform, row.id_or_url)) {
      if (row.platform === Platform.PUBLIC) {
        errors.push(`URL未在白名单中或不符合合规要求: ${row.id_or_url}`);
      } else {
        errors.push(`URL格式不符合平台规范: ${row.id_or_url}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};