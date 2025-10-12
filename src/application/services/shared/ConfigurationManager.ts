// src/application/services/shared/ConfigurationManager.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 统一配置管理系统
 * 
 * 为所有精准获客模块提供统一的配置管理，包括：
 * - 环境配置管理
 * - 运行时配置热更新
 * - 配置验证和类型安全
 * - 配置文件加载和保存
 * - 配置变更监听
 */

import { Platform } from '../../../constants/precise-acquisition-enums';
import { deepMerge, validateObjectStructure } from './CommonUtils';
import { ConfigurationError, createErrorContext } from './ErrorHandlingSystem';

// ==================== 配置接口定义 ====================

/**
 * 基础配置接口
 */
export interface BaseConfig {
  version: string;
  environment: 'development' | 'production' | 'testing';
  debug: boolean;
  lastUpdated: Date;
}

/**
 * 平台配置
 */
export interface PlatformConfig {
  enabled: boolean;
  api_endpoint?: string;
  api_version?: string;
  timeout_ms: number;
  retry_count: number;
  retry_delay_ms: number;
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  authentication: {
    type: 'oauth' | 'api_key' | 'bearer_token';
    credentials?: Record<string, string>;
    refresh_token_enabled: boolean;
    token_expiry_buffer_minutes: number;
  };
}

/**
 * 数据库配置
 */
export interface DatabaseConfig {
  type: 'sqlite' | 'mysql' | 'postgresql';
  connection: {
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    ssl?: boolean;
  };
  pool: {
    min_connections: number;
    max_connections: number;
    idle_timeout_ms: number;
  };
  migrations: {
    auto_run: boolean;
    directory: string;
  };
}

/**
 * 日志配置
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  console_enabled: boolean;
  file_enabled: boolean;
  file_path?: string;
  max_file_size_mb: number;
  max_files: number;
  json_format: boolean;
  include_stack_trace: boolean;
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  encryption: {
    algorithm: string;
    key_length: number;
    salt_rounds: number;
  };
  session: {
    secret_key: string;
    expiry_hours: number;
    secure_cookies: boolean;
  };
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    headers: string[];
  };
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  cache: {
    enabled: boolean;
    ttl_seconds: number;
    max_entries: number;
  };
  metrics: {
    enabled: boolean;
    collection_interval_ms: number;
    retention_days: number;
  };
  resource_limits: {
    max_concurrent_tasks: number;
    max_memory_mb: number;
    max_cpu_percentage: number;
  };
}

/**
 * 完整配置接口
 */
export interface PreciseAcquisitionConfig extends BaseConfig {
  platforms: Record<Platform, PlatformConfig>;
  database: DatabaseConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  
  // 业务特定配置
  business: {
    default_batch_size: number;
    max_retry_attempts: number;
    data_retention_days: number;
    backup_enabled: boolean;
    backup_interval_hours: number;
  };

  // 功能开关
  features: {
    comment_collection_enabled: boolean;
    task_execution_enabled: boolean;
    rate_control_enabled: boolean;
    reporting_enabled: boolean;
    audit_logging_enabled: boolean;
  };

  // 集成配置
  integrations: {
    webhook_url?: string;
    email_notifications: {
      enabled: boolean;
      smtp_host?: string;
      smtp_port?: number;
      username?: string;
      password?: string;
      from_address?: string;
    };
    monitoring: {
      enabled: boolean;
      endpoint?: string;
      api_key?: string;
    };
  };
}

// ==================== 配置管理器 ====================

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: PreciseAcquisitionConfig;
  private configPath: string;
  private watchers: Array<(config: PreciseAcquisitionConfig) => void> = [];
  private validationSchema: Record<string, any>;

  private constructor(configPath: string = './config.json') {
    this.configPath = configPath;
    this.config = this.getDefaultConfig();
    this.validationSchema = this.createValidationSchema();
  }

  static getInstance(configPath?: string): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager(configPath);
    }
    return ConfigurationManager.instance;
  }

  /**
   * 获取完整配置
   */
  getConfig(): PreciseAcquisitionConfig {
    return { ...this.config };
  }

  /**
   * 获取平台配置
   */
  getPlatformConfig(platform: Platform): PlatformConfig {
    return { ...this.config.platforms[platform] };
  }

  /**
   * 获取数据库配置
   */
  getDatabaseConfig(): DatabaseConfig {
    return { ...this.config.database };
  }

  /**
   * 获取日志配置
   */
  getLoggingConfig(): LoggingConfig {
    return { ...this.config.logging };
  }

  /**
   * 获取安全配置
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.config.security };
  }

  /**
   * 获取性能配置
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.config.performance };
  }

  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(feature: keyof PreciseAcquisitionConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * 更新配置
   */
  async updateConfig(partialConfig: Partial<PreciseAcquisitionConfig>): Promise<void> {
    try {
      // 合并配置
      const newConfig = deepMerge(this.config, partialConfig);

      // 验证配置
      const validation = this.validateConfig(newConfig);
      if (!validation.valid) {
        throw new ConfigurationError(
          `Configuration validation failed: ${validation.errors.join(', ')}`,
          'config_validation',
          createErrorContext('configuration', 'update_config', { errors: validation.errors })
        );
      }

      // 更新配置
      this.config = newConfig;
      this.config.lastUpdated = new Date();

      // 保存到文件
      await this.saveConfig();

      // 通知监听器
      this.notifyWatchers();

      console.log('[Config] Configuration updated successfully');
    } catch (error) {
      console.error('[Config] Failed to update configuration:', error);
      throw error;
    }
  }

  /**
   * 重置为默认配置
   */
  async resetToDefault(): Promise<void> {
    this.config = this.getDefaultConfig();
    await this.saveConfig();
    this.notifyWatchers();
    console.log('[Config] Configuration reset to default');
  }

  /**
   * 从文件加载配置
   */
  async loadConfig(): Promise<void> {
    try {
      // 这里应该从实际文件系统读取配置文件
      // 由于是Tauri应用，需要使用Tauri的文件API
      console.log(`[Config] Loading configuration from ${this.configPath}`);
      
      // 暂时使用默认配置
      // 在实际实现中，这里应该调用Tauri的文件读取API
      
      this.notifyWatchers();
    } catch (error) {
      console.warn('[Config] Failed to load configuration, using defaults:', error);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * 保存配置到文件
   */
  async saveConfig(): Promise<void> {
    try {
      // 这里应该保存到实际文件系统
      // 由于是Tauri应用，需要使用Tauri的文件API
      console.log(`[Config] Saving configuration to ${this.configPath}`);
      
      // 暂时只在控制台输出
      // 在实际实现中，这里应该调用Tauri的文件写入API
      
    } catch (error) {
      console.error('[Config] Failed to save configuration:', error);
      throw new ConfigurationError(
        'Failed to save configuration to file',
        'config_save_failed',
        createErrorContext('configuration', 'save_config', { filePath: this.configPath })
      );
    }
  }

  /**
   * 添加配置变更监听器
   */
  addConfigWatcher(callback: (config: PreciseAcquisitionConfig) => void): void {
    this.watchers.push(callback);
  }

  /**
   * 移除配置变更监听器
   */
  removeConfigWatcher(callback: (config: PreciseAcquisitionConfig) => void): void {
    const index = this.watchers.indexOf(callback);
    if (index > -1) {
      this.watchers.splice(index, 1);
    }
  }

  /**
   * 获取配置摘要
   */
  getConfigSummary(): {
    version: string;
    environment: string;
    enabled_platforms: Platform[];
    enabled_features: string[];
    last_updated: Date;
  } {
    return {
      version: this.config.version,
      environment: this.config.environment,
      enabled_platforms: Object.entries(this.config.platforms)
        .filter(([_, config]) => config.enabled)
        .map(([platform, _]) => platform as Platform),
      enabled_features: Object.entries(this.config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature),
      last_updated: this.config.lastUpdated
    };
  }

  /**
   * 验证配置完整性
   */
  validateConfig(config: PreciseAcquisitionConfig): { valid: boolean; errors: string[] } {
    const result = validateObjectStructure(config, this.validationSchema);
    return {
      valid: result.valid,
      errors: result.errors.map(e => `${e.field}: ${e.message}`)
    };
  }

  /**
   * 导出配置（用于备份）
   */
  exportConfig(): string {
    // 移除敏感信息
    const exportConfig = { ...this.config };
    
    // 清理敏感数据
    for (const platform of Object.values(exportConfig.platforms)) {
      if (platform.authentication.credentials) {
        platform.authentication.credentials = {};
      }
    }
    
    if (exportConfig.database.connection.password) {
      exportConfig.database.connection.password = '***';
    }
    
    if (exportConfig.security.session.secret_key) {
      exportConfig.security.session.secret_key = '***';
    }

    return JSON.stringify(exportConfig, null, 2);
  }

  /**
   * 导入配置
   */
  async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson) as PreciseAcquisitionConfig;
      
      // 验证导入的配置
      const validation = this.validateConfig(importedConfig);
      if (!validation.valid) {
        throw new ConfigurationError(
          `Imported configuration is invalid: ${validation.errors.join(', ')}`,
          'import_validation_failed',
          createErrorContext('configuration', 'import_config', { errors: validation.errors })
        );
      }

      await this.updateConfig(importedConfig);
      console.log('[Config] Configuration imported successfully');
    } catch (error) {
      console.error('[Config] Failed to import configuration:', error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  private getDefaultConfig(): PreciseAcquisitionConfig {
    return {
      version: '1.0.0',
      environment: 'development',
      debug: true,
      lastUpdated: new Date(),

      platforms: {
        [Platform.DOUYIN]: {
          enabled: true,
          api_endpoint: 'https://open.douyin.com',
          api_version: 'v1',
          timeout_ms: 30000,
          retry_count: 3,
          retry_delay_ms: 1000,
          rate_limit: {
            requests_per_minute: 60,
            requests_per_hour: 1000,
            requests_per_day: 10000
          },
          authentication: {
            type: 'oauth',
            refresh_token_enabled: true,
            token_expiry_buffer_minutes: 5
          }
        },
        [Platform.OCEANENGINE]: {
          enabled: true,
          api_endpoint: 'https://ad.oceanengine.com',
          api_version: 'v1',
          timeout_ms: 30000,
          retry_count: 3,
          retry_delay_ms: 1000,
          rate_limit: {
            requests_per_minute: 100,
            requests_per_hour: 2000,
            requests_per_day: 20000
          },
          authentication: {
            type: 'api_key',
            refresh_token_enabled: false,
            token_expiry_buffer_minutes: 0
          }
        },
        [Platform.PUBLIC]: {
          enabled: true,
          timeout_ms: 60000,
          retry_count: 2,
          retry_delay_ms: 2000,
          rate_limit: {
            requests_per_minute: 30,
            requests_per_hour: 500,
            requests_per_day: 2000
          },
          authentication: {
            type: 'bearer_token',
            refresh_token_enabled: false,
            token_expiry_buffer_minutes: 0
          }
        },
        [Platform.XIAOHONGSHU]: {
          enabled: true,
          api_endpoint: 'https://api.xiaohongshu.com',
          api_version: 'v1',
          timeout_ms: 25000,
          retry_count: 3,
          retry_delay_ms: 1500,
          rate_limit: {
            requests_per_minute: 40,
            requests_per_hour: 800,
            requests_per_day: 8000
          },
          authentication: {
            type: 'oauth',
            refresh_token_enabled: true,
            token_expiry_buffer_minutes: 10
          }
        }
      },

      database: {
        type: 'sqlite',
        connection: {
          database: './data/precise_acquisition.db'
        },
        pool: {
          min_connections: 1,
          max_connections: 10,
          idle_timeout_ms: 300000
        },
        migrations: {
          auto_run: true,
          directory: './migrations'
        }
      },

      logging: {
        level: 'info',
        console_enabled: true,
        file_enabled: true,
        file_path: './logs/app.log',
        max_file_size_mb: 10,
        max_files: 5,
        json_format: false,
        include_stack_trace: true
      },

      security: {
        encryption: {
          algorithm: 'aes-256-gcm',
          key_length: 32,
          salt_rounds: 12
        },
        session: {
          secret_key: 'change-this-in-production',
          expiry_hours: 24,
          secure_cookies: false
        },
        cors: {
          enabled: true,
          origins: ['http://localhost:3000'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          headers: ['Content-Type', 'Authorization']
        }
      },

      performance: {
        cache: {
          enabled: true,
          ttl_seconds: 3600,
          max_entries: 1000
        },
        metrics: {
          enabled: true,
          collection_interval_ms: 60000,
          retention_days: 7
        },
        resource_limits: {
          max_concurrent_tasks: 10,
          max_memory_mb: 512,
          max_cpu_percentage: 80
        }
      },

      business: {
        default_batch_size: 50,
        max_retry_attempts: 3,
        data_retention_days: 90,
        backup_enabled: true,
        backup_interval_hours: 24
      },

      features: {
        comment_collection_enabled: true,
        task_execution_enabled: true,
        rate_control_enabled: true,
        reporting_enabled: true,
        audit_logging_enabled: true
      },

      integrations: {
        email_notifications: {
          enabled: false
        },
        monitoring: {
          enabled: false
        }
      }
    };
  }

  private createValidationSchema(): Record<string, any> {
    return {
      version: { required: true, type: 'string' },
      environment: { 
        required: true, 
        type: 'string',
        validator: (value: string) => ['development', 'production', 'testing'].includes(value)
      },
      debug: { required: true, type: 'boolean' },
      platforms: { required: true, type: 'object' },
      database: { required: true, type: 'object' },
      logging: { required: true, type: 'object' },
      security: { required: true, type: 'object' },
      performance: { required: true, type: 'object' },
      business: { required: true, type: 'object' },
      features: { required: true, type: 'object' },
      integrations: { required: true, type: 'object' }
    };
  }

  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.config);
      } catch (error) {
        console.error('[Config] Error in configuration watcher:', error);
      }
    }
  }
}

// ==================== 工厂函数和工具 ====================

/**
 * 获取配置管理器实例
 */
export function getConfigManager(configPath?: string): ConfigurationManager {
  return ConfigurationManager.getInstance(configPath);
}

/**
 * 获取当前环境配置
 */
export function getCurrentEnvironment(): 'development' | 'production' | 'testing' {
  return getConfigManager().getConfig().environment;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * 检查是否启用调试模式
 */
export function isDebugEnabled(): boolean {
  return getConfigManager().getConfig().debug;
}

/**
 * 获取平台是否启用
 */
export function isPlatformEnabled(platform: Platform): boolean {
  return getConfigManager().getPlatformConfig(platform).enabled;
}

/**
 * 获取功能是否启用
 */
export function isFeatureEnabled(feature: keyof PreciseAcquisitionConfig['features']): boolean {
  return getConfigManager().isFeatureEnabled(feature);
}

// ==================== 配置常量 ====================

export const CONFIG_CONSTANTS = {
  // 默认值
  DEFAULT_TIMEOUT_MS: 30000,
  DEFAULT_RETRY_COUNT: 3,
  DEFAULT_RETRY_DELAY_MS: 1000,
  DEFAULT_BATCH_SIZE: 50,
  
  // 限制值
  MAX_TIMEOUT_MS: 300000,
  MAX_RETRY_COUNT: 10,
  MAX_BATCH_SIZE: 1000,
  MIN_RATE_LIMIT: 1,
  
  // 文件路径
  DEFAULT_CONFIG_PATH: './config.json',
  DEFAULT_LOG_PATH: './logs/app.log',
  DEFAULT_DB_PATH: './data/precise_acquisition.db',
  
  // 支持的配置格式
  SUPPORTED_DB_TYPES: ['sqlite', 'mysql', 'postgresql'] as const,
  SUPPORTED_LOG_LEVELS: ['debug', 'info', 'warn', 'error'] as const,
  SUPPORTED_ENVIRONMENTS: ['development', 'production', 'testing'] as const
} as const;