// src/application/services/shared/CommonUtils.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 统一工具函数库
 * 
 * 为所有精准获客模块提供通用的工具函数，避免代码重复：
 * - 数据验证和格式化
 * - 时间处理工具
 * - 字符串操作工具
 * - 数据结构操作
 * - 加密和安全工具
 * - 性能监控工具
 */

import { Platform } from '../../../constants/precise-acquisition-enums';

// ==================== 数据验证工具 ====================

/**
 * 验证电子邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证手机号格式（中国大陆）
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证用户ID格式
 */
export function isValidUserId(userId: string): boolean {
  // 允许字母、数字、下划线、连字符，长度3-50
  const userIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return userIdRegex.test(userId);
}

/**
 * 验证平台类型
 */
export function isValidPlatform(platform: string): platform is Platform {
  return Object.values(Platform).includes(platform as Platform);
}

/**
 * 验证对象是否为空
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (typeof obj === 'string') return obj.trim().length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * 深度验证对象结构
 */
export function validateObjectStructure(
  obj: any,
  schema: Record<string, any>
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  for (const [key, rule] of Object.entries(schema)) {
    const value = obj[key];

    // 检查必需字段
    if (rule.required && (value === undefined || value === null)) {
      errors.push({ field: key, message: rule.message || `Missing required field: ${key}` });
      continue;
    }

    // 如果字段不存在且不是必需的，跳过
    if (value === undefined || value === null) continue;

    // 类型检查
    if (rule.type) {
      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push({ field: key, message: rule.message || `Field ${key} must be an array` });
      } else if (rule.type !== 'array' && typeof value !== rule.type) {
        errors.push({ field: key, message: rule.message || `Field ${key} must be of type ${rule.type}` });
      }
    }

    // 长度检查
    if (rule.minLength && value.toString().length < rule.minLength) {
      errors.push({ field: key, message: rule.message || `Field ${key} must be at least ${rule.minLength} characters` });
    }
    
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      errors.push({ field: key, message: rule.message || `Field ${key} must be at most ${rule.maxLength} characters` });
    }

    // 模式检查
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      errors.push({ field: key, message: rule.message || `Field ${key} does not match required pattern` });
    }

    // 自定义验证器
    if (rule.validator && !rule.validator(value)) {
      errors.push({ field: key, message: rule.message || `Field ${key} failed custom validation` });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ==================== 时间处理工具 ====================

/**
 * 格式化时间间隔为人类可读格式
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

/**
 * 获取时间范围描述
 */
export function getTimeRangeDescription(startTime: Date, endTime: Date): string {
  const now = new Date();
  const isToday = startTime.toDateString() === now.toDateString();
  const isYesterday = startTime.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
  
  if (isToday) {
    return `今天 ${startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `昨天 ${startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return `${startTime.toLocaleDateString('zh-CN')} ${startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleDateString('zh-CN')} ${endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
}

/**
 * 计算两个时间的差值
 */
export function getTimeDifference(startTime: Date, endTime: Date): {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  humanReadable: string;
} {
  const diff = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    milliseconds: diff,
    seconds,
    minutes,
    hours,
    days,
    humanReadable: formatDuration(diff)
  };
}

/**
 * 检查时间是否在指定范围内
 */
export function isTimeInRange(time: Date, startTime: Date, endTime: Date): boolean {
  return time >= startTime && time <= endTime;
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else if (seconds > 0) {
    return `${seconds}秒前`;
  } else {
    return '刚刚';
  }
}

// ==================== 字符串操作工具 ====================

/**
 * 清理和净化字符串
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  
  return str
    .trim()                           // 移除首尾空白
    .replace(/\s+/g, ' ')            // 多个空白字符替换为单个空格
    .replace(/[<>'"&]/g, char => {   // HTML特殊字符转义
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
}

/**
 * 截断字符串并添加省略号
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 驼峰转下划线
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 下划线转驼峰
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number, characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * 格式化数字（添加千分位分隔符）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0.0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

// ==================== 数据结构操作 ====================

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj as T;
  }
  return obj;
}

/**
 * 深度合并对象
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = deepClone(target);
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = (result as any)[key];
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && 
          targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        (result as any)[key] = deepMerge(targetValue, sourceValue);
      } else {
        (result as any)[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * 数组去重
 */
export function uniqueArray<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 数组分组
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 数组分页
 */
export function paginate<T>(array: T[], page: number, pageSize: number): {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
} {
  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = array.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    }
  };
}

// ==================== 加密和安全工具 ====================

/**
 * 简单哈希函数（用于非密码场景）
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

/**
 * 生成唯一ID
 */
export function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 生成UUID（简化版）
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 掩码敏感信息
 */
export function maskSensitiveData(str: string, visibleStart: number = 3, visibleEnd: number = 3, maskChar: string = '*'): string {
  if (str.length <= visibleStart + visibleEnd) {
    return maskChar.repeat(str.length);
  }
  
  const start = str.substring(0, visibleStart);
  const end = str.substring(str.length - visibleEnd);
  const middle = maskChar.repeat(str.length - visibleStart - visibleEnd);
  
  return start + middle + end;
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('密码长度至少8位');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含小写字母');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含大写字母');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含数字');
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含特殊字符');
  }

  return {
    score,
    feedback,
    isStrong: score >= 4
  };
}

// ==================== 性能监控工具 ====================

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * 开始计时
   */
  start(): void {
    this.startTime = performance.now();
    this.endTime = undefined;
  }

  /**
   * 停止计时并返回经过的时间（毫秒）
   */
  stop(): number {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  /**
   * 获取当前经过的时间（毫秒）
   */
  elapsed(): number {
    const currentTime = this.endTime || performance.now();
    return currentTime - this.startTime;
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.startTime = performance.now();
    this.endTime = undefined;
    this.marks.clear();
  }

  /**
   * 添加标记点
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 获取标记点时间
   */
  getMark(name: string): number | undefined {
    const markTime = this.marks.get(name);
    return markTime ? markTime - this.startTime : undefined;
  }

  /**
   * 获取两个标记点之间的时间
   */
  getDuration(startMark: string, endMark: string): number | undefined {
    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);
    
    if (startTime && endTime) {
      return endTime - startTime;
    }
    return undefined;
  }

  /**
   * 结束计时
   */
  end(): number {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  /**
   * 获取总耗时
   */
  getTotalTime(): number {
    const endTime = this.endTime || performance.now();
    return endTime - this.startTime;
  }

  /**
   * 获取性能报告
   */
  getReport(): {
    totalTime: number;
    marks: Array<{ name: string; time: number }>;
    durations: Array<{ from: string; to: string; duration: number }>;
  } {
    const totalTime = this.getTotalTime();
    const marks = Array.from(this.marks.entries()).map(([name, time]) => ({
      name,
      time: time - this.startTime
    }));

    // 计算相邻标记点之间的耗时
    const durations: Array<{ from: string; to: string; duration: number }> = [];
    const markEntries = Array.from(this.marks.entries()).sort((a, b) => a[1] - b[1]);
    
    for (let i = 0; i < markEntries.length - 1; i++) {
      const [fromName, fromTime] = markEntries[i];
      const [toName, toTime] = markEntries[i + 1];
      durations.push({
        from: fromName,
        to: toName,
        duration: toTime - fromTime
      });
    }

    return {
      totalTime,
      marks,
      durations
    };
  }
}

/**
 * 函数执行时间测量装饰器
 */
export function measureTime<T extends any[], R>(
  fn: (...args: T) => R,
  label?: string
): (...args: T) => R {
  return (...args: T): R => {
    const timer = new PerformanceTimer();
    const result = fn(...args);
    const duration = timer.end();
    
    console.log(`[PERF] ${label || fn.name || 'Anonymous function'}: ${duration.toFixed(2)}ms`);
    return result;
  };
}

/**
 * 异步函数执行时间测量装饰器
 */
export function measureAsyncTime<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  label?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const timer = new PerformanceTimer();
    const result = await fn(...args);
    const duration = timer.end();
    
    console.log(`[PERF] ${label || fn.name || 'Anonymous async function'}: ${duration.toFixed(2)}ms`);
    return result;
  };
}

// ==================== 常用常量 ====================

export const COMMON_CONSTANTS = {
  // 时间常量（毫秒）
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000
  },

  // 文件大小常量（字节）
  FILE_SIZE: {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024
  },

  // 正则表达式
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_CN: /^1[3-9]\d{9}$/,
    URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  },

  // HTTP状态码
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  }
} as const;