// src/modules/precise-acquisition/shared/utils/formatting/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 数据格式化工具
 * 
 * 提供日期、标签、模板等数据的格式化功能
 */

import { IndustryTag, RegionTag } from '../../types/core';

/**
 * 生成唯一ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
}

/**
 * 格式化行业标签显示
 */
export function formatIndustryTags(tags: IndustryTag[]): string {
  return tags.map(tag => {
    // 这里可以添加标签的本地化显示名称
    return tag;
  }).join(', ');
}

/**
 * 格式化地区标签显示
 */
export function formatRegionTag(region: RegionTag): string {
  // 这里可以添加地区的本地化显示名称
  return region;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  return new Intl.DateTimeFormat('zh-CN', options).format(date);
}

/**
 * 格式化时间范围
 */
export function formatTimeRange(startDate: Date, endDate: Date): string {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };
  
  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * 格式化数字（添加千分位分隔符）
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

/**
 * 格式化持续时间（毫秒转换为可读格式）
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天 ${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟 ${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

/**
 * 格式化缩略文本
 */
export function formatTruncatedText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * 格式化URL显示（隐藏敏感信息）
 */
export function formatUrlDisplay(url: string): string {
  try {
    const urlObj = new URL(url);
    // 保留域名和路径，隐藏查询参数
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

/**
 * 格式化状态显示
 */
export function formatStatus(status: string): {
  text: string;
  color: 'green' | 'blue' | 'orange' | 'red' | 'gray';
} {
  switch (status.toLowerCase()) {
    case 'active':
    case 'success':
    case 'completed':
    case 'done':
      return { text: '成功', color: 'green' };
    case 'pending':
    case 'waiting':
    case 'ready':
      return { text: '等待中', color: 'blue' };
    case 'processing':
    case 'executing':
    case 'running':
      return { text: '执行中', color: 'orange' };
    case 'failed':
    case 'error':
      return { text: '失败', color: 'red' };
    case 'disabled':
    case 'inactive':
    case 'paused':
      return { text: '已暂停', color: 'gray' };
    default:
      return { text: status, color: 'gray' };
  }
}