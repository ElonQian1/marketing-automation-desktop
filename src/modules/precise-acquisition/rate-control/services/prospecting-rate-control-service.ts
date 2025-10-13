// src/modules/precise-acquisition/rate-control/services/RateControlService.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 频率控制和去重服务
 * 
 * 实现多层级的频率控制和去重机制：
 * 1. 时间频率限制：按平台、按用户、按操作类型
 * 2. 用户级去重：防止对同一用户重复操作
 * 3. 跨设备去重：多设备间的操作同步
 * 4. 内容去重：防止相同内容重复发送
 */

import { invoke } from '@tauri-apps/api/core';
import { Platform, TaskType } from '../../shared/types/core';

/**
 * 频率限制配置
 */
export interface RateLimitConfig {
  platform: Platform;
  task_type: TaskType;
  // 每分钟最大操作数
  max_per_minute: number;
  // 每小时最大操作数
  max_per_hour: number;
  // 每天最大操作数
  max_per_day: number;
  // 操作间最小间隔(秒)
  min_interval_seconds: number;
}

/**
 * 去重配置
 */
export interface DeduplicationConfig {
  // 用户去重窗口期(天)
  user_dedup_window_days: number;
  // 内容去重窗口期(天)
  content_dedup_window_days: number;
  // 跨设备同步间隔(分钟)
  cross_device_sync_interval_minutes: number;
  // 相似度阈值(0-1)
  content_similarity_threshold: number;
}

/**
 * 频控检查结果
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  retry_after_seconds?: number;
  current_stats: {
    minute_count: number;
    hour_count: number;
    day_count: number;
    last_operation_time?: Date;
  };
}

/**
 * 去重检查结果
 */
export interface DeduplicationCheckResult {
  is_duplicate: boolean;
  duplicate_type?: 'user' | 'content' | 'cross_device';
  duplicate_source?: string;
  original_operation_time?: Date;
  similarity_score?: number;
}

/**
 * 操作记录
 */
interface OperationRecord {
  id: string;
  platform: Platform;
  task_type: TaskType;
  target_user_id?: string;
  content_hash?: string;
  device_id: string;
  timestamp: Date;
  success: boolean;
}

/**
 * 频控和去重统计
 */
export interface RateControlStats {
  total_operations: number;
  blocked_by_rate_limit: number;
  blocked_by_deduplication: number;
  success_rate: number;
  avg_operations_per_hour: number;
  platform_stats: Record<Platform, {
    operations: number;
    blocked: number;
    success_rate: number;
  }>;
}

/**
 * 频控和查重服务
 */
export class RateControlService {
  
  private readonly DEFAULT_RATE_LIMITS: Record<Platform, Record<TaskType, RateLimitConfig>> = {
    [Platform.DOUYIN]: {
      [TaskType.REPLY]: {
        platform: Platform.DOUYIN,
        task_type: TaskType.REPLY,
        max_per_minute: 10,
        max_per_hour: 200,
        max_per_day: 1000,
        min_interval_seconds: 5
      },
      [TaskType.FOLLOW]: {
        platform: Platform.DOUYIN,
        task_type: TaskType.FOLLOW,
        max_per_minute: 5,
        max_per_hour: 100,
        max_per_day: 500,
        min_interval_seconds: 10
      },
      [TaskType.LIKE]: {
        platform: Platform.DOUYIN,
        task_type: TaskType.LIKE,
        max_per_minute: 15,
        max_per_hour: 300,
        max_per_day: 2000,
        min_interval_seconds: 3
      },
      [TaskType.COMMENT]: {
        platform: Platform.DOUYIN,
        task_type: TaskType.COMMENT,
        max_per_minute: 8,
        max_per_hour: 150,
        max_per_day: 800,
        min_interval_seconds: 7
      },
      [TaskType.SHARE]: {
        platform: Platform.DOUYIN,
        task_type: TaskType.SHARE,
        max_per_minute: 12,
        max_per_hour: 250,
        max_per_day: 1200,
        min_interval_seconds: 4
      },
      [TaskType.VIEW]: {
        platform: Platform.DOUYIN,
        task_type: TaskType.VIEW,
        max_per_minute: 30,
        max_per_hour: 600,
        max_per_day: 5000,
        min_interval_seconds: 2
      }
    },
    [Platform.XIAOHONGSHU]: {
      [TaskType.REPLY]: {
        platform: Platform.XIAOHONGSHU,
        task_type: TaskType.REPLY,
        max_per_minute: 8,
        max_per_hour: 150,
        max_per_day: 800,
        min_interval_seconds: 6
      },
      [TaskType.FOLLOW]: {
        platform: Platform.XIAOHONGSHU,
        task_type: TaskType.FOLLOW,
        max_per_minute: 4,
        max_per_hour: 80,
        max_per_day: 400,
        min_interval_seconds: 12
      },
      [TaskType.LIKE]: {
        platform: Platform.XIAOHONGSHU,
        task_type: TaskType.LIKE,
        max_per_minute: 12,
        max_per_hour: 250,
        max_per_day: 1500,
        min_interval_seconds: 4
      },
      [TaskType.COMMENT]: {
        platform: Platform.XIAOHONGSHU,
        task_type: TaskType.COMMENT,
        max_per_minute: 6,
        max_per_hour: 120,
        max_per_day: 600,
        min_interval_seconds: 8
      },
      [TaskType.SHARE]: {
        platform: Platform.XIAOHONGSHU,
        task_type: TaskType.SHARE,
        max_per_minute: 10,
        max_per_hour: 200,
        max_per_day: 1000,
        min_interval_seconds: 5
      },
      [TaskType.VIEW]: {
        platform: Platform.XIAOHONGSHU,
        task_type: TaskType.VIEW,
        max_per_minute: 25,
        max_per_hour: 500,
        max_per_day: 4000,
        min_interval_seconds: 2
      }
    },
    [Platform.OCEANENGINE]: {
      [TaskType.REPLY]: {
        platform: Platform.OCEANENGINE,
        task_type: TaskType.REPLY,
        max_per_minute: 15,
        max_per_hour: 300,
        max_per_day: 1500,
        min_interval_seconds: 3
      },
      [TaskType.FOLLOW]: {
        platform: Platform.OCEANENGINE,
        task_type: TaskType.FOLLOW,
        max_per_minute: 3,
        max_per_hour: 50,
        max_per_day: 200,
        min_interval_seconds: 15
      },
      [TaskType.LIKE]: {
        platform: Platform.OCEANENGINE,
        task_type: TaskType.LIKE,
        max_per_minute: 20,
        max_per_hour: 400,
        max_per_day: 2500,
        min_interval_seconds: 2
      },
      [TaskType.COMMENT]: {
        platform: Platform.OCEANENGINE,
        task_type: TaskType.COMMENT,
        max_per_minute: 12,
        max_per_hour: 200,
        max_per_day: 1000,
        min_interval_seconds: 4
      },
      [TaskType.SHARE]: {
        platform: Platform.OCEANENGINE,
        task_type: TaskType.SHARE,
        max_per_minute: 18,
        max_per_hour: 350,
        max_per_day: 1800,
        min_interval_seconds: 3
      },
      [TaskType.VIEW]: {
        platform: Platform.OCEANENGINE,
        task_type: TaskType.VIEW,
        max_per_minute: 40,
        max_per_hour: 800,
        max_per_day: 6000,
        min_interval_seconds: 1
      }
    },
    [Platform.PUBLIC]: {
      [TaskType.REPLY]: {
        platform: Platform.PUBLIC,
        task_type: TaskType.REPLY,
        max_per_minute: 3,
        max_per_hour: 50,
        max_per_day: 200,
        min_interval_seconds: 15
      },
      [TaskType.FOLLOW]: {
        platform: Platform.PUBLIC,
        task_type: TaskType.FOLLOW,
        max_per_minute: 2,
        max_per_hour: 30,
        max_per_day: 100,
        min_interval_seconds: 20
      },
      [TaskType.LIKE]: {
        platform: Platform.PUBLIC,
        task_type: TaskType.LIKE,
        max_per_minute: 5,
        max_per_hour: 80,
        max_per_day: 500,
        min_interval_seconds: 10
      },
      [TaskType.COMMENT]: {
        platform: Platform.PUBLIC,
        task_type: TaskType.COMMENT,
        max_per_minute: 4,
        max_per_hour: 60,
        max_per_day: 300,
        min_interval_seconds: 12
      },
      [TaskType.SHARE]: {
        platform: Platform.PUBLIC,
        task_type: TaskType.SHARE,
        max_per_minute: 6,
        max_per_hour: 100,
        max_per_day: 600,
        min_interval_seconds: 8
      },
      [TaskType.VIEW]: {
        platform: Platform.PUBLIC,
        task_type: TaskType.VIEW,
        max_per_minute: 10,
        max_per_hour: 200,
        max_per_day: 1500,
        min_interval_seconds: 5
      }
    }
  };
  
  private readonly DEFAULT_DEDUP_CONFIG: DeduplicationConfig = {
    user_dedup_window_days: 7,
    content_dedup_window_days: 3,
    cross_device_sync_interval_minutes: 5,
    content_similarity_threshold: 0.8
  };
  
  private deviceId: string = '';
  private operationCache: Map<string, OperationRecord[]> = new Map();
  
  constructor() {
    this.initializeDeviceId();
    this.startCrossDeviceSync();
  }
  
  /**
   * 初始化设备ID
   */
  private async initializeDeviceId(): Promise<void> {
    try {
      this.deviceId = await invoke('get_device_id');
    } catch (error) {
      console.error('获取设备ID失败:', error);
      this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  /**
   * 启动跨设备同步
   */
  private startCrossDeviceSync(): void {
    setInterval(() => {
      this.syncCrossDeviceOperations().catch(error => {
        console.error('跨设备同步失败:', error);
      });
    }, this.DEFAULT_DEDUP_CONFIG.cross_device_sync_interval_minutes * 60 * 1000);
  }
  
  /**
   * 检查频率限制
   */
  async checkRateLimit(
    platform: Platform, 
    taskType: TaskType, 
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitCheckResult> {
    
    const config = {
      ...this.DEFAULT_RATE_LIMITS[platform][taskType],
      ...customConfig
    };
    
    try {
      // 获取操作历史
      const operations = await this.getOperationHistory(platform, taskType);
      const now = new Date();
      
      // 计算各时间窗口的操作数量
      const minuteOps = operations.filter(op => 
        (now.getTime() - op.timestamp.getTime()) < 60 * 1000
      );
      
      const hourOps = operations.filter(op => 
        (now.getTime() - op.timestamp.getTime()) < 60 * 60 * 1000
      );
      
      const dayOps = operations.filter(op => 
        (now.getTime() - op.timestamp.getTime()) < 24 * 60 * 60 * 1000
      );
      
      // 检查各维度限制
      if (minuteOps.length >= config.max_per_minute) {
        return {
          allowed: false,
          reason: `超出每分钟限制 (${minuteOps.length}/${config.max_per_minute})`,
          retry_after_seconds: 60,
          current_stats: {
            minute_count: minuteOps.length,
            hour_count: hourOps.length,
            day_count: dayOps.length,
            last_operation_time: operations[0]?.timestamp
          }
        };
      }
      
      if (hourOps.length >= config.max_per_hour) {
        return {
          allowed: false,
          reason: `超出每小时限制 (${hourOps.length}/${config.max_per_hour})`,
          retry_after_seconds: 3600,
          current_stats: {
            minute_count: minuteOps.length,
            hour_count: hourOps.length,
            day_count: dayOps.length,
            last_operation_time: operations[0]?.timestamp
          }
        };
      }
      
      if (dayOps.length >= config.max_per_day) {
        return {
          allowed: false,
          reason: `超出每日限制 (${dayOps.length}/${config.max_per_day})`,
          retry_after_seconds: 24 * 3600,
          current_stats: {
            minute_count: minuteOps.length,
            hour_count: hourOps.length,
            day_count: dayOps.length,
            last_operation_time: operations[0]?.timestamp
          }
        };
      }
      
      // 检查最小间隔
      if (operations.length > 0) {
        const lastOpTime = operations[0].timestamp;
        const timeSinceLastOp = (now.getTime() - lastOpTime.getTime()) / 1000;
        
        if (timeSinceLastOp < config.min_interval_seconds) {
          return {
            allowed: false,
            reason: `操作间隔过短 (${timeSinceLastOp.toFixed(1)}s < ${config.min_interval_seconds}s)`,
            retry_after_seconds: config.min_interval_seconds - timeSinceLastOp,
            current_stats: {
              minute_count: minuteOps.length,
              hour_count: hourOps.length,
              day_count: dayOps.length,
              last_operation_time: lastOpTime
            }
          };
        }
      }
      
      return {
        allowed: true,
        current_stats: {
          minute_count: minuteOps.length,
          hour_count: hourOps.length,
          day_count: dayOps.length,
          last_operation_time: operations[0]?.timestamp
        }
      };
      
    } catch (error) {
      console.error('频率限制检查失败:', error);
      return {
        allowed: false,
        reason: `检查失败: ${error instanceof Error ? error.message : String(error)}`,
        current_stats: {
          minute_count: 0,
          hour_count: 0,
          day_count: 0
        }
      };
    }
  }
  
  /**
   * 检查去重
   */
  async checkDeduplication(
    platform: Platform,
    taskType: TaskType,
    targetUserId?: string,
    content?: string,
    customConfig?: Partial<DeduplicationConfig>
  ): Promise<DeduplicationCheckResult> {
    
    const config = { ...this.DEFAULT_DEDUP_CONFIG, ...customConfig };
    
    try {
      // 用户级去重检查
      if (targetUserId) {
        const userDuplicateCheck = await this.checkUserDuplication(
          platform, taskType, targetUserId, config.user_dedup_window_days
        );
        
        if (userDuplicateCheck.is_duplicate) {
          return userDuplicateCheck;
        }
      }
      
      // 内容去重检查
      if (content) {
        const contentDuplicateCheck = await this.checkContentDuplication(
          platform, content, config.content_dedup_window_days, config.content_similarity_threshold
        );
        
        if (contentDuplicateCheck.is_duplicate) {
          return contentDuplicateCheck;
        }
      }
      
      // 跨设备去重检查
      const crossDeviceDuplicateCheck = await this.checkCrossDeviceDuplication(
        platform, taskType, targetUserId, content
      );
      
      if (crossDeviceDuplicateCheck.is_duplicate) {
        return crossDeviceDuplicateCheck;
      }
      
      return { is_duplicate: false };
      
    } catch (error) {
      console.error('去重检查失败:', error);
      return {
        is_duplicate: false // 检查失败时允许操作，但记录错误
      };
    }
  }
  
  /**
   * 用户级去重检查
   */
  private async checkUserDuplication(
    platform: Platform,
    taskType: TaskType,
    targetUserId: string,
    windowDays: number
  ): Promise<DeduplicationCheckResult> {
    
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - windowDays);
    
    const operations = await this.getOperationHistory(platform, taskType, {
      target_user_id: targetUserId,
      since: cutoffTime
    });
    
    if (operations.length > 0) {
      return {
        is_duplicate: true,
        duplicate_type: 'user',
        duplicate_source: `用户 ${targetUserId}`,
        original_operation_time: operations[0].timestamp
      };
    }
    
    return { is_duplicate: false };
  }
  
  /**
   * 内容去重检查
   */
  private async checkContentDuplication(
    platform: Platform,
    content: string,
    windowDays: number,
    similarityThreshold: number
  ): Promise<DeduplicationCheckResult> {
    
    const contentHash = await this.calculateContentHash(content);
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - windowDays);
    
    const operations = await this.getOperationHistory(platform, TaskType.REPLY, {
      since: cutoffTime,
      with_content: true
    });
    
    // 精确匹配检查
    const exactMatch = operations.find(op => op.content_hash === contentHash);
    if (exactMatch) {
      return {
        is_duplicate: true,
        duplicate_type: 'content',
        duplicate_source: '相同内容',
        original_operation_time: exactMatch.timestamp,
        similarity_score: 1.0
      };
    }
    
    // 相似度检查
    for (const operation of operations) {
      if (operation.content_hash) {
        const similarity = await this.calculateContentSimilarity(content, operation.content_hash);
        if (similarity >= similarityThreshold) {
          return {
            is_duplicate: true,
            duplicate_type: 'content',
            duplicate_source: '相似内容',
            original_operation_time: operation.timestamp,
            similarity_score: similarity
          };
        }
      }
    }
    
    return { is_duplicate: false };
  }
  
  /**
   * 跨设备去重检查
   */
  private async checkCrossDeviceDuplication(
    platform: Platform,
    taskType: TaskType,
    targetUserId?: string,
    content?: string
  ): Promise<DeduplicationCheckResult> {
    
    try {
      const crossDeviceOperations = await invoke('get_cross_device_operations', {
        platform,
        taskType,
        targetUserId,
        content,
        excludeDeviceId: this.deviceId,
        sinceDuration: 3600 // 1小时内
      });
      
      if (crossDeviceOperations && Array.isArray(crossDeviceOperations) && crossDeviceOperations.length > 0) {
        const recentOp = crossDeviceOperations[0];
        return {
          is_duplicate: true,
          duplicate_type: 'cross_device',
          duplicate_source: `设备 ${recentOp.device_id}`,
          original_operation_time: new Date(recentOp.timestamp)
        };
      }
      
    } catch (error) {
      console.warn('跨设备去重检查失败:', error);
    }
    
    return { is_duplicate: false };
  }
  
  /**
   * 记录操作
   */
  async recordOperation(
    platform: Platform,
    taskType: TaskType,
    success: boolean,
    targetUserId?: string,
    content?: string
  ): Promise<void> {
    
    const operation: OperationRecord = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platform,
      task_type: taskType,
      target_user_id: targetUserId,
      content_hash: content ? await this.calculateContentHash(content) : undefined,
      device_id: this.deviceId,
      timestamp: new Date(),
      success
    };
    
    try {
      // 保存到本地缓存
      const cacheKey = `${platform}_${taskType}`;
      const cached = this.operationCache.get(cacheKey) || [];
      cached.unshift(operation);
      
      // 保留最近1000条记录
      if (cached.length > 1000) {
        cached.splice(1000);
      }
      
      this.operationCache.set(cacheKey, cached);
      
      // 持久化存储
      await invoke('record_operation', {
        operation: {
          ...operation,
          timestamp: operation.timestamp.toISOString()
        }
      });
      
    } catch (error) {
      console.error('记录操作失败:', error);
    }
  }
  
  /**
   * 获取操作历史
   */
  private async getOperationHistory(
    platform: Platform, 
    taskType: TaskType,
    filters?: {
      target_user_id?: string;
      since?: Date;
      with_content?: boolean;
    }
  ): Promise<OperationRecord[]> {
    
    try {
      // 先从缓存获取
      const cacheKey = `${platform}_${taskType}`;
      let operations = this.operationCache.get(cacheKey) || [];
      
      // 如果缓存为空，从持久化存储加载
      if (operations.length === 0) {
        const storedOps = await invoke('get_operation_history', {
          platform,
          taskType,
          limit: 1000
        });
        
        operations = Array.isArray(storedOps) ? storedOps.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        })) : [];
        
        this.operationCache.set(cacheKey, operations);
      }
      
      // 应用过滤器
      let filtered = operations;
      
      if (filters?.target_user_id) {
        filtered = filtered.filter(op => op.target_user_id === filters.target_user_id);
      }
      
      if (filters?.since) {
        filtered = filtered.filter(op => op.timestamp >= filters.since!);
      }
      
      if (filters?.with_content) {
        filtered = filtered.filter(op => op.content_hash);
      }
      
      return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
    } catch (error) {
      console.error('获取操作历史失败:', error);
      return [];
    }
  }
  
  /**
   * 计算内容哈希
   */
  private async calculateContentHash(content: string): Promise<string> {
    try {
      return await invoke('calculate_content_hash', { content });
    } catch (error) {
      // 备用实现
      const encoder = new TextEncoder();
      const data = encoder.encode(content.toLowerCase().replace(/\s+/g, ' ').trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }
  
  /**
   * 计算内容相似度
   */
  private async calculateContentSimilarity(content1: string, contentHash2: string): Promise<number> {
    try {
      return await invoke('calculate_content_similarity', { content1, contentHash2 });
    } catch (error) {
      // 简化的相似度计算
      const hash1 = await this.calculateContentHash(content1);
      if (hash1 === contentHash2) return 1.0;
      
      // 基于编辑距离的简单相似度
      const distance = this.levenshteinDistance(content1, contentHash2.substring(0, Math.min(content1.length, 100)));
      const maxLength = Math.max(content1.length, 100);
      return Math.max(0, 1 - distance / maxLength);
    }
  }
  
  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * 跨设备操作同步
   */
  private async syncCrossDeviceOperations(): Promise<void> {
    try {
      // 上传本地操作记录
      const localOperations: OperationRecord[] = [];
      this.operationCache.forEach(operations => {
        localOperations.push(...operations.slice(0, 100)); // 最近100条
      });
      
      if (localOperations.length > 0) {
        await invoke('sync_operations_to_cloud', {
          operations: localOperations.map(op => ({
            ...op,
            timestamp: op.timestamp.toISOString()
          }))
        });
      }
      
      // 获取其他设备的操作记录
      const remoteOperations = await invoke('sync_operations_from_cloud', {
        deviceId: this.deviceId,
        sinceDuration: 3600 // 1小时内
      });
      
      console.log(`同步了 ${Array.isArray(remoteOperations) ? remoteOperations.length : 0} 条远程操作记录`);
      
    } catch (error) {
      console.warn('跨设备同步失败:', error);
    }
  }
  
  /**
   * 获取频控统计
   */
  async getStats(sinceDays: number = 7): Promise<RateControlStats> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - sinceDays);
      
      let totalOperations = 0;
      let blockedByRateLimit = 0;
      let blockedByDeduplication = 0;
      let successfulOperations = 0;
      const platformStats: Record<Platform, any> = {} as any;
      
      // 从持久化存储获取统计数据
      const stats = await invoke('get_rate_control_stats', {
        since: cutoffTime.toISOString(),
        deviceId: this.deviceId
      });
      
      return {
        total_operations: (stats as any)?.totalOperations || 0,
        blocked_by_rate_limit: (stats as any)?.blockedByRateLimit || 0,
        blocked_by_deduplication: (stats as any)?.blockedByDeduplication || 0,
        success_rate: (stats as any)?.successRate || 0,
        avg_operations_per_hour: (stats as any)?.avgOperationsPerHour || 0,
        platform_stats: (stats as any)?.platformStats || {}
      };
      
    } catch (error) {
      console.error('获取频控统计失败:', error);
      return {
        total_operations: 0,
        blocked_by_rate_limit: 0,
        blocked_by_deduplication: 0,
        success_rate: 0,
        avg_operations_per_hour: 0,
        platform_stats: {} as any
      };
    }
  }
  
  /**
   * 清理过期数据
   */
  async cleanupExpiredData(retentionDays: number = 30): Promise<void> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - retentionDays);
      
      await invoke('cleanup_expired_operations', {
        cutoffTime: cutoffTime.toISOString()
      });
      
      // 清理本地缓存
      this.operationCache.forEach((operations, key) => {
        const filtered = operations.filter(op => op.timestamp >= cutoffTime);
        this.operationCache.set(key, filtered);
      });
      
      console.log(`清理了 ${retentionDays} 天前的过期数据`);
      
    } catch (error) {
      console.error('清理过期数据失败:', error);
    }
  }
}