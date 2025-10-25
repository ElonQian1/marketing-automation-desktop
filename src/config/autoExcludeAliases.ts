// src/config/autoExcludeAliases.ts
// module: shared | layer: config | role: configuration
// summary: 自动排除别名库配置

/**
 * 自动排除别名库
 * 按应用分类的常见"已操作"状态文本
 * 用于智能批量操作时自动跳过已完成的目标
 */

export interface AppAliases {
  /** 应用标识 */
  appId: string;
  /** 应用名称 */
  appName: string;
  /** 别名列表 */
  aliases: string[];
  /** 描述 */
  description: string;
}

/**
 * 内置自动排除别名库
 */
export const AUTO_EXCLUDE_ALIASES: Record<string, AppAliases> = {
  // 小红书
  xiaohongshu: {
    appId: 'xiaohongshu',
    appName: '小红书',
    aliases: [
      '已关注',
      'Following',
      '互相关注',
      'Mutual',
      '已互关',
      '已赞',
      '已收藏',
      '已分享',
    ],
    description: '小红书常见已操作状态',
  },

  // 抖音
  douyin: {
    appId: 'douyin',
    appName: '抖音',
    aliases: [
      '已关注',
      'Following',
      '互相关注',
      '已赞',
      '已收藏',
      '已分享',
      '已投币',
    ],
    description: '抖音常见已操作状态',
  },

  // 微信
  wechat: {
    appId: 'wechat',
    appName: '微信',
    aliases: [
      '已添加',
      '已是好友',
      '已发送',
      '已读',
    ],
    description: '微信常见已操作状态',
  },

  // 通用
  common: {
    appId: 'common',
    appName: '通用',
    aliases: [
      '已关注',
      'Following',
      'Followed',
      '互相关注',
      'Mutual',
      'Follow Back',
      '已赞',
      'Liked',
      '已收藏',
      'Favorited',
      '已分享',
      'Shared',
      '已完成',
      'Completed',
      '已处理',
      'Processed',
    ],
    description: '通用已操作状态（适用于大多数应用）',
  },
};

/**
 * 获取指定应用的别名列表
 * @param appId 应用ID（默认使用通用别名）
 * @returns 别名数组
 */
export function getAutoExcludeAliases(appId: string = 'common'): string[] {
  const config = AUTO_EXCLUDE_ALIASES[appId] || AUTO_EXCLUDE_ALIASES.common;
  return config.aliases;
}

/**
 * 获取所有应用的别名列表（合并去重）
 * @returns 合并后的别名数组
 */
export function getAllAutoExcludeAliases(): string[] {
  const allAliases = new Set<string>();
  Object.values(AUTO_EXCLUDE_ALIASES).forEach(config => {
    config.aliases.forEach(alias => allAliases.add(alias));
  });
  return Array.from(allAliases);
}

/**
 * 检查是否应该排除某个文本
 * @param text 要检查的文本
 * @param appId 应用ID（可选）
 * @param customExcludes 自定义排除列表（可选）
 * @returns 是否应该排除
 */
export function shouldAutoExclude(
  text: string,
  appId?: string,
  customExcludes?: string[]
): boolean {
  const normalizedText = text.trim();
  
  // 检查自定义排除
  if (customExcludes && customExcludes.length > 0) {
    if (customExcludes.some(exclude => normalizedText.includes(exclude))) {
      return true;
    }
  }
  
  // 检查自动排除别名
  const autoAliases = appId 
    ? getAutoExcludeAliases(appId) 
    : getAllAutoExcludeAliases();
  
  return autoAliases.some(alias => normalizedText.includes(alias));
}

/**
 * 获取匹配的排除规则（用于调试和显示）
 * @param text 要检查的文本
 * @param appId 应用ID（可选）
 * @param customExcludes 自定义排除列表（可选）
 * @returns 匹配的规则列表
 */
export function getMatchedExcludeRules(
  text: string,
  appId?: string,
  customExcludes?: string[]
): string[] {
  const normalizedText = text.trim();
  const matched: string[] = [];
  
  // 检查自定义排除
  if (customExcludes) {
    customExcludes.forEach(exclude => {
      if (normalizedText.includes(exclude)) {
        matched.push(`自定义: ${exclude}`);
      }
    });
  }
  
  // 检查自动排除别名
  const autoAliases = appId 
    ? getAutoExcludeAliases(appId) 
    : getAllAutoExcludeAliases();
  
  autoAliases.forEach(alias => {
    if (normalizedText.includes(alias)) {
      matched.push(`自动: ${alias}`);
    }
  });
  
  return matched;
}
