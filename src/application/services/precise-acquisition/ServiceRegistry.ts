// src/application/services/precise-acquisition/ServiceRegistry.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客系统服务注册和配置
 * 
 * 统一配置所有服务的依赖注入、初始化顺序和配置管理
 */

import {
  DependencyContainer,
  SERVICE_KEYS,
  registerCoreServices,
  IService
} from '../shared/DependencyContainer';
import { getConfigManager, ConfigurationManager } from '../shared/ConfigurationManager';
import { ErrorHandler } from '../shared/ErrorHandlingSystem';

// 导入精准获客相关服务（注意：暂时注释掉有编译错误的服务）
// import { TagSystemManager } from './TagSystemManager';
// import { CsvValidationService } from './CsvValidationService';

// ==================== 服务工厂 ====================

export class PreciseAcquisitionServiceFactory {
  private static instance: PreciseAcquisitionServiceFactory;
  private container: DependencyContainer;
  private configManager: ConfigurationManager;
  private isInitialized = false;

  private constructor() {
    this.container = DependencyContainer.getInstance();
    this.configManager = getConfigManager();
  }

  static getInstance(): PreciseAcquisitionServiceFactory {
    if (!PreciseAcquisitionServiceFactory.instance) {
      PreciseAcquisitionServiceFactory.instance = new PreciseAcquisitionServiceFactory();
    }
    return PreciseAcquisitionServiceFactory.instance;
  }

  /**
   * 初始化所有服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[ServiceFactory] Already initialized');
      return;
    }

    try {
      console.log('[ServiceFactory] Initializing precision acquisition services...');

      // 1. 初始化配置管理器
      await this.configManager.loadConfig();
      console.log('[ServiceFactory] Configuration manager loaded');

      // 2. 注册核心基础服务
      await this.registerCoreServices();
      console.log('[ServiceFactory] Core services registered');

      // 3. 注册业务服务
      await this.registerBusinessServices();
      console.log('[ServiceFactory] Business services registered');

      // 4. 初始化所有服务
      await this.initializeAllServices();
      console.log('[ServiceFactory] All services initialized');

      this.isInitialized = true;
      console.log('[ServiceFactory] Precision acquisition service factory initialized successfully');

    } catch (error) {
      console.error('[ServiceFactory] Failed to initialize service factory:', error);
      throw error;
    }
  }

  /**
   * 销毁所有服务
   */
  async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('[ServiceFactory] Disposing all services...');
      
      await this.container.dispose();
      this.isInitialized = false;
      
      console.log('[ServiceFactory] All services disposed successfully');
    } catch (error) {
      console.error('[ServiceFactory] Error disposing services:', error);
    }
  }

  /**
   * 获取服务实例
   */
  async getService<T extends IService>(key: symbol): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return await this.container.resolve<T>(key);
  }

  /**
   * 检查服务健康状态
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Array<{
      key: string;
      healthy: boolean;
      error?: string;
    }>;
  }> {
    return await this.container.healthCheck();
  }

  /**
   * 获取服务统计信息
   */
  getServiceStats(): {
    totalServices: number;
    registeredServices: string[];
    serviceInfo: Record<string, any>;
  } {
    const registeredServices = this.container.getRegisteredServices();
    const serviceInfo: Record<string, any> = {};

    for (const key of registeredServices) {
      serviceInfo[String(key)] = this.container.getServiceInfo(key);
    }

    return {
      totalServices: registeredServices.length,
      registeredServices: registeredServices.map(key => String(key)),
      serviceInfo
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 注册核心基础服务
   */
  private async registerCoreServices(): Promise<void> {
    const config = this.configManager.getConfig();
    
    await registerCoreServices(
      config.database,
      config.logging,
      config.platforms
    );
  }

  /**
   * 注册业务服务
   */
  private async registerBusinessServices(): Promise<void> {
    // 注册标签系统管理器（暂时使用模拟实现）
    this.container.register(
      SERVICE_KEYS.TAG_SYSTEM_MANAGER,
      () => new MockTagSystemManager(),
      {
        singleton: true,
        dependencies: [SERVICE_KEYS.LOGGING, SERVICE_KEYS.DATA_STORAGE]
      }
    );

    // 注册CSV验证服务（暂时使用模拟实现）
    this.container.register(
      SERVICE_KEYS.CSV_VALIDATION_SERVICE,
      () => new MockCsvValidationService(),
      {
        singleton: true,
        dependencies: [SERVICE_KEYS.LOGGING, SERVICE_KEYS.CACHE]
      }
    );

    // 注册评论收集适配器（暂时使用模拟实现）
    this.container.register(
      SERVICE_KEYS.COMMENT_COLLECTION_ADAPTER,
      () => new MockCommentCollectionAdapter(),
      {
        singleton: true,
        dependencies: [SERVICE_KEYS.HTTP_CLIENT, SERVICE_KEYS.LOGGING]
      }
    );

    // 注册任务执行引擎（暂时使用模拟实现）
    this.container.register(
      SERVICE_KEYS.TASK_EXECUTION_ENGINE,
      () => new MockTaskExecutionEngine(),
      {
        singleton: true,
        dependencies: [
          SERVICE_KEYS.LOGGING,
          SERVICE_KEYS.DATA_STORAGE,
          SERVICE_KEYS.EVENT_BUS
        ]
      }
    );

    // 注册速率控制服务（暂时使用模拟实现）
    this.container.register(
      SERVICE_KEYS.RATE_CONTROL_SERVICE,
      () => new MockRateControlService(),
      {
        singleton: true,
        dependencies: [SERVICE_KEYS.CACHE, SERVICE_KEYS.LOGGING]
      }
    );

    // 注册报告服务（暂时使用模拟实现）
    this.container.register(
      SERVICE_KEYS.REPORTING_SERVICE,
      () => new MockReportingService(),
      {
        singleton: true,
        dependencies: [
          SERVICE_KEYS.DATA_STORAGE,
          SERVICE_KEYS.LOGGING,
          SERVICE_KEYS.TAG_SYSTEM_MANAGER
        ]
      }
    );

    console.log('[ServiceFactory] Business services registered');
  }

  /**
   * 初始化所有已注册的服务
   */
  private async initializeAllServices(): Promise<void> {
    const registeredServices = this.container.getRegisteredServices();
    
    console.log(`[ServiceFactory] Initializing ${registeredServices.length} services...`);
    
    // 按依赖顺序初始化服务
    const initializationOrder = [
      SERVICE_KEYS.LOGGING,
      SERVICE_KEYS.CACHE,
      SERVICE_KEYS.HTTP_CLIENT,
      SERVICE_KEYS.EVENT_BUS,
      SERVICE_KEYS.DATA_STORAGE,
      SERVICE_KEYS.TAG_SYSTEM_MANAGER,
      SERVICE_KEYS.CSV_VALIDATION_SERVICE,
      SERVICE_KEYS.RATE_CONTROL_SERVICE,
      SERVICE_KEYS.COMMENT_COLLECTION_ADAPTER,
      SERVICE_KEYS.TASK_EXECUTION_ENGINE,
      SERVICE_KEYS.REPORTING_SERVICE
    ];

    for (const serviceKey of initializationOrder) {
      if (this.container.isRegistered(serviceKey)) {
        try {
          const service = await this.container.resolve<IService>(serviceKey);
          console.log(`[ServiceFactory] Initialized service: ${String(serviceKey)}`);
        } catch (error) {
          console.error(`[ServiceFactory] Failed to initialize service ${String(serviceKey)}:`, error);
          throw error;
        }
      }
    }
  }
}

// ==================== 模拟服务实现（临时使用） ====================

class MockTagSystemManager implements IService {
  readonly serviceName = 'MockTagSystemManager';

  async initialize(): Promise<void> {
    console.log('[MockTagSystemManager] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockTagSystemManager] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  // 业务方法占位符
  async createTag(name: string, category: string): Promise<any> {
    console.log(`[MockTagSystemManager] Creating tag: ${name} in category: ${category}`);
    return { id: Date.now(), name, category };
  }

  async listTags(): Promise<any[]> {
    console.log('[MockTagSystemManager] Listing tags');
    return [
      { id: 1, name: '高价值', category: '价值' },
      { id: 2, name: '活跃用户', category: '状态' }
    ];
  }
}

class MockCsvValidationService implements IService {
  readonly serviceName = 'MockCsvValidationService';

  async initialize(): Promise<void> {
    console.log('[MockCsvValidationService] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockCsvValidationService] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  // 业务方法占位符
  async validateCsv(data: any[]): Promise<any> {
    console.log(`[MockCsvValidationService] Validating CSV with ${data.length} rows`);
    return {
      isValid: true,
      errors: [],
      validatedData: data
    };
  }
}

class MockCommentCollectionAdapter implements IService {
  readonly serviceName = 'MockCommentCollectionAdapter';

  async initialize(): Promise<void> {
    console.log('[MockCommentCollectionAdapter] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockCommentCollectionAdapter] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  // 业务方法占位符
  async collectComments(postId: string, platform: string): Promise<any[]> {
    console.log(`[MockCommentCollectionAdapter] Collecting comments from ${platform} post: ${postId}`);
    return [
      { id: 1, content: '测试评论1', author: 'user1' },
      { id: 2, content: '测试评论2', author: 'user2' }
    ];
  }
}

class MockTaskExecutionEngine implements IService {
  readonly serviceName = 'MockTaskExecutionEngine';

  async initialize(): Promise<void> {
    console.log('[MockTaskExecutionEngine] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockTaskExecutionEngine] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  // 业务方法占位符
  async executeTask(taskId: string): Promise<any> {
    console.log(`[MockTaskExecutionEngine] Executing task: ${taskId}`);
    return {
      taskId,
      status: 'completed',
      result: 'Task executed successfully'
    };
  }
}

class MockRateControlService implements IService {
  readonly serviceName = 'MockRateControlService';

  async initialize(): Promise<void> {
    console.log('[MockRateControlService] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockRateControlService] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  // 业务方法占位符
  async checkRateLimit(operation: string): Promise<boolean> {
    console.log(`[MockRateControlService] Checking rate limit for: ${operation}`);
    return true; // 允许执行
  }

  async recordOperation(operation: string): Promise<void> {
    console.log(`[MockRateControlService] Recording operation: ${operation}`);
  }
}

class MockReportingService implements IService {
  readonly serviceName = 'MockReportingService';

  async initialize(): Promise<void> {
    console.log('[MockReportingService] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockReportingService] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  // 业务方法占位符
  async generateDailyReport(date: Date): Promise<any> {
    console.log(`[MockReportingService] Generating daily report for: ${date.toDateString()}`);
    return {
      date: date.toDateString(),
      summary: {
        totalUsers: 100,
        newUsers: 10,
        activeUsers: 85
      }
    };
  }
}

// ==================== 便捷函数 ====================

/**
 * 获取服务工厂实例
 */
export function getServiceFactory(): PreciseAcquisitionServiceFactory {
  return PreciseAcquisitionServiceFactory.getInstance();
}

/**
 * 初始化精准获客服务系统
 */
export async function initializePreciseAcquisitionServices(): Promise<void> {
  const factory = getServiceFactory();
  await factory.initialize();
}

/**
 * 销毁精准获客服务系统
 */
export async function disposePreciseAcquisitionServices(): Promise<void> {
  const factory = getServiceFactory();
  await factory.dispose();
}

/**
 * 获取特定服务实例
 */
export async function getService<T extends IService>(key: symbol): Promise<T> {
  const factory = getServiceFactory();
  return await factory.getService<T>(key);
}

/**
 * 执行系统健康检查
 */
export async function performHealthCheck(): Promise<{
  healthy: boolean;
  services: Array<{
    key: string;
    healthy: boolean;
    error?: string;
  }>;
}> {
  const factory = getServiceFactory();
  return await factory.healthCheck();
}

/**
 * 获取服务统计信息
 */
export function getServiceStats(): {
  totalServices: number;
  registeredServices: string[];
  serviceInfo: Record<string, any>;
} {
  const factory = getServiceFactory();
  return factory.getServiceStats();
}

// ==================== 导出所有服务键 ====================

export { SERVICE_KEYS } from '../shared/DependencyContainer';

// ==================== 错误处理集成 ====================

/**
 * 设置全局错误处理器
 */
export function setupGlobalErrorHandling(): void {
  const errorHandler = ErrorHandler.getInstance();

  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('[GlobalErrorHandler] Uncaught Exception:', error);
    errorHandler.handle(error);
  });

  // 监听未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[GlobalErrorHandler] Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
      errorHandler.handle(reason);
    }
  });

  console.log('[GlobalErrorHandler] Global error handling configured');
}

// ==================== 配置验证 ====================

/**
 * 验证系统配置完整性
 */
export async function validateSystemConfiguration(): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const configManager = getConfigManager();
    const config = configManager.getConfig();

    // 验证必需的配置项
    if (!config.version) {
      errors.push('Configuration version is missing');
    }

    if (!config.database) {
      errors.push('Database configuration is missing');
    }

    if (!config.logging) {
      errors.push('Logging configuration is missing');
    }

    if (!config.platforms) {
      errors.push('Platform configurations are missing');
    }

    // 验证功能开关
    const requiredFeatures = [
      'comment_collection_enabled',
      'task_execution_enabled',
      'rate_control_enabled',
      'reporting_enabled'
    ];

    for (const feature of requiredFeatures) {
      if (config.features[feature as keyof typeof config.features] === undefined) {
        warnings.push(`Feature flag '${feature}' is not defined`);
      }
    }

    // 验证平台配置
    for (const [platform, platformConfig] of Object.entries(config.platforms)) {
      if (!platformConfig.rate_limit) {
        warnings.push(`Rate limit configuration missing for platform: ${platform}`);
      }
    }

    console.log('[ConfigValidator] Configuration validation completed');

  } catch (error) {
    errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}