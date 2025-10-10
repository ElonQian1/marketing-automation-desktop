import { Platform } from './precise-acquisition-enums';

// 平台配置
export const PLATFORMS: Record<Platform, { name: string; color: string; icon: string }> = {
  [Platform.XIAOHONGSHU]: {
    name: '小红书',
    color: 'bg-red-500',
    icon: '📕'
  },
  [Platform.DOUYIN]: {
    name: '抖音',
    color: 'bg-black',
    icon: '🎵'
  },
  [Platform.OCEANENGINE]: {
    name: '巨量引擎',
    color: 'bg-blue-500',
    icon: '🚀'
  },
  [Platform.PUBLIC]: {
    name: '公开来源',
    color: 'bg-gray-500',
    icon: '🌐'
  },
};

// 可用平台列表（按优先级排序）
export const AVAILABLE_PLATFORMS: Platform[] = [
  Platform.XIAOHONGSHU, 
  Platform.DOUYIN, 
  Platform.OCEANENGINE, 
  Platform.PUBLIC
];

// 精准获客示例关键词
export const SAMPLE_KEYWORDS = [
  '感兴趣',
  '求推荐',
  '怎么样',
  '在哪买',
  '多少钱',
  '求链接',
  '同款',
  '种草',
  '求购',
  '推荐一下'
];

// 城市示例
export const SAMPLE_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都', '重庆', '武汉'
];

