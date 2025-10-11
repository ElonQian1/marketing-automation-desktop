// src/modules/precise-acquisition/application/system/SystemConfigurationManager.ts
// module: application | layer: application | role: application-logic
// summary: 应用逻辑

// modules/precise-acquisition/application/system | SystemConfigurationManager | 系统配置管理器
// 负责系统配置的创建、合并、验证和更新，提供配置版本管理和热更新支持

import { Platform } from '../../shared/types/core';
import { AuditService, AuditLogLevel, AuditEventType } from '../../audit-system';

/**
 * 系统配置接口
 */
export interface SystemConfig {
  // 模块启用配置
  modules: {
    template_management: boolean;
    comment_collection: boolean;
    task_execution: boolean;
    rate_control: boolean;
    audit_system: boolean;
    reporting: boolean;
  };
  
  // 全局配置
  global: {
    max_concurrent_tasks: number;
    default_timeout_ms: number;
    enable_debug_logging: boolean;
    auto_cleanup_days: number;
  };
  
  // 平台配置
  platforms: Record<Platform, {
    enabled: boolean;
    priority: number;
    rate_limit_multiplier: number;
  }>;
}

/**
 * 系统配置管理器
 * 负责配置的创建、验证、合并和更新
 */
export class SystemConfigurationManager {
  private currentConfig: SystemConfig;
  private auditService?: AuditService;
  
  constructor(auditService?: AuditService) {
    this.auditService = auditService;
    this.currentConfig = this.createDefaultConfig();
  }
  
  /**
   * 创建默认配置
   */
  createDefaultConfig(userConfig?: Partial<SystemConfig>): SystemConfig {
    const defaultConfig: SystemConfig = {
      modules: {
        template_management: true,
        comment_collection: true,
        task_execution: true,
        rate_control: true,
        audit_system: true,
        reporting: true
      },
      global: {
        max_concurrent_tasks: 10,
        default_timeout_ms: 30000,
        enable_debug_logging: false,
        auto_cleanup_days: 30
      },
      platforms: {
        [Platform.DOUYIN]: {
          enabled: true,
          priority: 1,
          rate_limit_multiplier: 1.0
        },
        [Platform.OCEANENGINE]: {
          enabled: true,
          priority: 2,
          rate_limit_multiplier: 1.2
        },
        [Platform.PUBLIC]: {
          enabled: true,
          priority: 3,
          rate_limit_multiplier: 0.5
        },
        [Platform.XIAOHONGSHU]: {
          enabled: false,
          priority: 4,
          rate_limit_multiplier: 1.0
        }
      }
    };
    
    // 合并用户配置
    return this.mergeConfig(defaultConfig, userConfig || {});
  }
  
  /**
   * 合并配置
   */
  mergeConfig(baseConfig: SystemConfig, userConfig: Partial<SystemConfig>): SystemConfig {
    return {
      modules: { ...baseConfig.modules, ...userConfig.modules },
      global: { ...baseConfig.global, ...userConfig.global },
      platforms: { ...baseConfig.platforms, ...userConfig.platforms }
    };
  }
  
  /**
   * 验证配置
   */
  validateConfig(config: SystemConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 验证并发任务数
    if (config.global.max_concurrent_tasks <= 0 || config.global.max_concurrent_tasks > 100) {
      errors.push('max_concurrent_tasks must be between 1 and 100');
    }
    
    // 验证超时时间
    if (config.global.default_timeout_ms < 1000 || config.global.default_timeout_ms > 300000) {
      errors.push('default_timeout_ms must be between 1000 and 300000');
    }
    
    // 验证清理天数
    if (config.global.auto_cleanup_days < 1 || config.global.auto_cleanup_days > 365) {
      errors.push('auto_cleanup_days must be between 1 and 365');
    }
    
    // 验证平台配置
    Object.entries(config.platforms).forEach(([platform, platformConfig]) => {
      if (platformConfig.priority < 1 || platformConfig.priority > 10) {
        errors.push(`Platform ${platform} priority must be between 1 and 10`);
      }
      
      if (platformConfig.rate_limit_multiplier < 0.1 || platformConfig.rate_limit_multiplier > 5.0) {
        errors.push(`Platform ${platform} rate_limit_multiplier must be between 0.1 and 5.0`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 更新系统配置
   */
  async updateConfig(newConfig: Partial<SystemConfig>): Promise<void> {
    const oldConfig = { ...this.currentConfig };
    
    try {
      const mergedConfig = this.mergeConfig(this.currentConfig, newConfig);
      const validation = this.validateConfig(mergedConfig);
      
      if (!validation.isValid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
      }
      
      this.currentConfig = mergedConfig;
      
      await this.auditService?.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.CONFIG_CHANGE,
        operation: 'update_system_config',
        message: '系统配置已更新',
        details: { old_config: oldConfig, new_config: this.currentConfig }
      });
      
    } catch (error) {
      await this.auditService?.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.CONFIG_CHANGE,
        operation: 'update_system_config',
        message: '更新系统配置失败',
        error_message: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * 获取当前配置
   */
  getCurrentConfig(): SystemConfig {
    return { ...this.currentConfig };
  }
  
  /**
   * 重置为默认配置
   */
  async resetToDefault(): Promise<void> {
    const oldConfig = { ...this.currentConfig };
    
    try {
      this.currentConfig = this.createDefaultConfig();
      
      await this.auditService?.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.CONFIG_CHANGE,
        operation: 'reset_system_config',
        message: '系统配置已重置为默认值',
        details: { old_config: oldConfig, new_config: this.currentConfig }
      });
      
    } catch (error) {
      await this.auditService?.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.CONFIG_CHANGE,
        operation: 'reset_system_config',
        message: '重置系统配置失败',
        error_message: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
}