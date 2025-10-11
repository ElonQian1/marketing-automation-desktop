// src/modules/deduplication-control/services/DeduplicationService.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 去重服务
 * 
 * 实现多层级的去重策略：评论级、用户级、内容级、跨设备等
 */
import { invoke } from '@tauri-apps/api/core';
import { 
  DeduplicationStrategy,
  DeduplicationConfig,
  DeduplicationResult,
  SafetyCheckRequest 
} from '../types';

/**
 * 内容相似度计算服务
 */
export class ContentSimilarityService {
  /**
   * 计算两个文本的相似度
   * @param text1 文本1
   * @param text2 文本2
   * @returns 相似度 (0-1)
   */
  static calculateSimilarity(text1: string, text2: string): number {
    // 预处理文本
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);
    
    // 使用编辑距离计算相似度
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 1;
  }
  
  /**
   * 文本标准化
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 移除标点符号，保留中文
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * 计算编辑距离
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * 生成内容哈希
   */
  static generateContentHash(content: string, algorithm: 'md5' | 'sha1' | 'sha256' = 'md5'): string {
    const normalized = this.normalizeText(content);
    
    // 这里应该使用crypto库生成真正的哈希
    // 为了示例，使用简单的字符串哈希
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
}

/**
 * 去重数据库服务
 */
export class DeduplicationStorageService {
  /**
   * 检查评论级重复
   */
  static async checkCommentDuplicate(
    targetUserId: string,
    content: string,
    timeWindowHours: number,
    similarityThreshold: number
  ): Promise<{ isDuplicate: boolean; conflictId?: string; conflictTime?: Date }> {
    try {
      // 调用后端检查评论重复
      const result = await invoke<{
        is_duplicate: boolean;
        conflict_id?: string;
        conflict_time?: string;
      }>('check_comment_duplicate', {
        targetUserId,
        content,
        timeWindowHours,
        similarityThreshold
      });
      
      return {
        isDuplicate: result.is_duplicate,
        conflictId: result.conflict_id,
        conflictTime: result.conflict_time ? new Date(result.conflict_time) : undefined
      };
    } catch (error) {
      console.error('检查评论重复失败:', error);
      // 安全起见，出错时假设重复
      return { isDuplicate: true };
    }
  }
  
  /**
   * 检查用户级重复
   */
  static async checkUserDuplicate(
    targetUserId: string,
    accountId: string,
    cooldownDays: number,
    crossPlatform: boolean = false
  ): Promise<{ isDuplicate: boolean; lastInteraction?: Date }> {
    try {
      const result = await invoke<{
        is_duplicate: boolean;
        last_interaction?: string;
      }>('check_user_duplicate', {
        targetUserId,
        accountId,
        cooldownDays,
        crossPlatform
      });
      
      return {
        isDuplicate: result.is_duplicate,
        lastInteraction: result.last_interaction ? new Date(result.last_interaction) : undefined
      };
    } catch (error) {
      console.error('检查用户重复失败:', error);
      return { isDuplicate: true };
    }
  }
  
  /**
   * 检查内容级重复
   */
  static async checkContentDuplicate(
    contentHash: string,
    accountId: string,
    timeWindowHours: number = 24
  ): Promise<{ isDuplicate: boolean; conflictTime?: Date }> {
    try {
      const result = await invoke<{
        is_duplicate: boolean;
        conflict_time?: string;
      }>('check_content_duplicate', {
        contentHash,
        accountId,
        timeWindowHours
      });
      
      return {
        isDuplicate: result.is_duplicate,
        conflictTime: result.conflict_time ? new Date(result.conflict_time) : undefined
      };
    } catch (error) {
      console.error('检查内容重复失败:', error);
      return { isDuplicate: true };
    }
  }
  
  /**
   * 检查跨设备重复
   */
  static async checkCrossDeviceDuplicate(
    targetUserId: string,
    fingerprintStrategy: string,
    deviceFingerprint: string,
    timeWindowHours: number = 168 // 7天
  ): Promise<{ isDuplicate: boolean; conflictDeviceId?: string }> {
    try {
      const result = await invoke<{
        is_duplicate: boolean;
        conflict_device_id?: string;
      }>('check_cross_device_duplicate', {
        targetUserId,
        fingerprintStrategy,
        deviceFingerprint,
        timeWindowHours
      });
      
      return {
        isDuplicate: result.is_duplicate,
        conflictDeviceId: result.conflict_device_id
      };
    } catch (error) {
      console.error('检查跨设备重复失败:', error);
      return { isDuplicate: true };
    }
  }
  
  /**
   * 记录交互历史
   */
  static async recordInteraction(
    targetUserId: string,
    accountId: string,
    deviceId: string,
    taskType: 'follow' | 'reply',
    content?: string
  ): Promise<void> {
    try {
      await invoke('record_interaction', {
        targetUserId,
        accountId,
        deviceId,
        taskType,
        content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('记录交互失败:', error);
    }
  }
}

/**
 * 主去重服务
 */
export class DeduplicationService {
  private config: DeduplicationConfig;
  
  constructor(config: DeduplicationConfig) {
    this.config = config;
  }
  
  /**
   * 执行完整的去重检查
   */
  async performDeduplicationCheck(request: SafetyCheckRequest): Promise<DeduplicationResult> {
    const result: DeduplicationResult = {
      allowed: true,
      triggeredStrategies: [],
      duplicates: [],
      suggestions: []
    };
    
    // 评论级去重检查
    if (this.config.strategies.includes(DeduplicationStrategy.COMMENT_LEVEL) && 
        this.config.commentLevel.enabled && 
        request.content) {
      
      const commentCheck = await this.checkCommentLevelDuplication(request);
      if (!commentCheck.allowed) {
        result.allowed = false;
        result.triggeredStrategies.push(DeduplicationStrategy.COMMENT_LEVEL);
        result.duplicates.push({
          strategy: DeduplicationStrategy.COMMENT_LEVEL,
          reason: `评论内容与 ${commentCheck.timeWindow} 小时内的历史评论相似度过高`,
          conflictId: commentCheck.conflictId,
          conflictTime: commentCheck.conflictTime
        });
      }
    }
    
    // 用户级去重检查
    if (this.config.strategies.includes(DeduplicationStrategy.USER_LEVEL) && 
        this.config.userLevel.enabled) {
      
      const userCheck = await this.checkUserLevelDuplication(request);
      if (!userCheck.allowed) {
        result.allowed = false;
        result.triggeredStrategies.push(DeduplicationStrategy.USER_LEVEL);
        result.duplicates.push({
          strategy: DeduplicationStrategy.USER_LEVEL,
          reason: `用户在冷却期内（${this.config.userLevel.cooldownDays} 天）`,
          conflictTime: userCheck.lastInteraction
        });
      }
    }
    
    // 内容级去重检查
    if (this.config.strategies.includes(DeduplicationStrategy.CONTENT_LEVEL) && 
        this.config.contentLevel.enabled && 
        request.content) {
      
      const contentCheck = await this.checkContentLevelDuplication(request);
      if (!contentCheck.allowed) {
        result.allowed = false;
        result.triggeredStrategies.push(DeduplicationStrategy.CONTENT_LEVEL);
        result.duplicates.push({
          strategy: DeduplicationStrategy.CONTENT_LEVEL,
          reason: '检测到重复内容',
          conflictTime: contentCheck.conflictTime
        });
      }
    }
    
    // 跨设备去重检查
    if (this.config.strategies.includes(DeduplicationStrategy.CROSS_DEVICE) && 
        this.config.crossDevice.enabled && 
        request.deviceId) {
      
      const deviceCheck = await this.checkCrossDeviceDuplication(request);
      if (!deviceCheck.allowed) {
        result.allowed = false;
        result.triggeredStrategies.push(DeduplicationStrategy.CROSS_DEVICE);
        result.duplicates.push({
          strategy: DeduplicationStrategy.CROSS_DEVICE,
          reason: `检测到跨设备重复交互（设备: ${deviceCheck.conflictDeviceId}）`,
          conflictId: deviceCheck.conflictDeviceId
        });
      }
    }
    
    // 生成建议
    if (!result.allowed) {
      result.suggestions = this.generateSuggestions(result);
    }
    
    return result;
  }
  
  /**
   * 评论级去重检查
   */
  private async checkCommentLevelDuplication(request: SafetyCheckRequest): Promise<{
    allowed: boolean;
    conflictId?: string;
    conflictTime?: Date;
    timeWindow: number;
  }> {
    if (!request.content) {
      return { allowed: true, timeWindow: this.config.commentLevel.timeWindowHours };
    }
    
    const duplicate = await DeduplicationStorageService.checkCommentDuplicate(
      request.targetUserId,
      request.content,
      this.config.commentLevel.timeWindowHours,
      this.config.commentLevel.similarityThreshold
    );
    
    return {
      allowed: !duplicate.isDuplicate,
      conflictId: duplicate.conflictId,
      conflictTime: duplicate.conflictTime,
      timeWindow: this.config.commentLevel.timeWindowHours
    };
  }
  
  /**
   * 用户级去重检查
   */
  private async checkUserLevelDuplication(request: SafetyCheckRequest): Promise<{
    allowed: boolean;
    lastInteraction?: Date;
  }> {
    const duplicate = await DeduplicationStorageService.checkUserDuplicate(
      request.targetUserId,
      request.accountId,
      this.config.userLevel.cooldownDays,
      this.config.userLevel.crossPlatform
    );
    
    return {
      allowed: !duplicate.isDuplicate,
      lastInteraction: duplicate.lastInteraction
    };
  }
  
  /**
   * 内容级去重检查
   */
  private async checkContentLevelDuplication(request: SafetyCheckRequest): Promise<{
    allowed: boolean;
    conflictTime?: Date;
  }> {
    if (!request.content) {
      return { allowed: true };
    }
    
    const contentHash = ContentSimilarityService.generateContentHash(
      request.content,
      this.config.contentLevel.hashAlgorithm
    );
    
    const duplicate = await DeduplicationStorageService.checkContentDuplicate(
      contentHash,
      request.accountId,
      24 // 24小时时间窗口
    );
    
    return {
      allowed: !duplicate.isDuplicate,
      conflictTime: duplicate.conflictTime
    };
  }
  
  /**
   * 跨设备去重检查
   */
  private async checkCrossDeviceDuplication(request: SafetyCheckRequest): Promise<{
    allowed: boolean;
    conflictDeviceId?: string;
  }> {
    if (!request.deviceId) {
      return { allowed: true };
    }
    
    // 生成设备指纹
    const deviceFingerprint = await this.generateDeviceFingerprint(
      request.deviceId,
      this.config.crossDevice.fingerprintStrategy
    );
    
    const duplicate = await DeduplicationStorageService.checkCrossDeviceDuplicate(
      request.targetUserId,
      this.config.crossDevice.fingerprintStrategy,
      deviceFingerprint,
      168 // 7天时间窗口
    );
    
    return {
      allowed: !duplicate.isDuplicate,
      conflictDeviceId: duplicate.conflictDeviceId
    };
  }
  
  /**
   * 生成设备指纹
   */
  private async generateDeviceFingerprint(
    deviceId: string,
    strategy: 'account' | 'imei' | 'mac' | 'hybrid'
  ): Promise<string> {
    try {
      const fingerprint = await invoke<string>('generate_device_fingerprint', {
        deviceId,
        strategy
      });
      return fingerprint;
    } catch (error) {
      console.error('生成设备指纹失败:', error);
      return deviceId; // fallback to device ID
    }
  }
  
  /**
   * 生成建议操作
   */
  private generateSuggestions(result: DeduplicationResult): string[] {
    const suggestions: string[] = [];
    
    if (result.triggeredStrategies.includes(DeduplicationStrategy.COMMENT_LEVEL)) {
      suggestions.push('建议修改评论内容，避免与近期评论过于相似');
    }
    
    if (result.triggeredStrategies.includes(DeduplicationStrategy.USER_LEVEL)) {
      suggestions.push('建议等待冷却期结束后再次尝试');
    }
    
    if (result.triggeredStrategies.includes(DeduplicationStrategy.CONTENT_LEVEL)) {
      suggestions.push('建议使用不同的回复模板或内容');
    }
    
    if (result.triggeredStrategies.includes(DeduplicationStrategy.CROSS_DEVICE)) {
      suggestions.push('建议使用不同的设备或账号执行任务');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('系统检测到潜在风险，建议手动审核');
    }
    
    return suggestions;
  }
  
  /**
   * 记录成功的交互
   */
  async recordSuccessfulInteraction(request: SafetyCheckRequest): Promise<void> {
    try {
      await DeduplicationStorageService.recordInteraction(
        request.targetUserId,
        request.accountId,
        request.deviceId || '',
        request.taskType,
        request.content
      );
    } catch (error) {
      console.error('记录交互失败:', error);
    }
  }
}