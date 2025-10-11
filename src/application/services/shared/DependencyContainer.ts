// src/application/services/shared/DependencyContainer.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 统一依赖注入容器
 * 
 * 为精准获客系统提供依赖注入和服务管理，包括：
 * - 单例模式管理
 * - 依赖关系解析
 * - 生命周期管理
 * - 接口抽象和实现绑定
 * - 配置驱动的服务初始化
 */

import { PlatformConfig, DatabaseConfig, LoggingConfig } from './ConfigurationManager';
import { ErrorHandler } from './ErrorHandlingSystem';

// ==================== 服务接口定义 ====================

/**
 * 基础服务接口
 */
export interface IService {
  readonly serviceName: string;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isHealthy(): Promise<boolean>;
}

/**
 * 可配置服务接口
 */
export interface IConfigurableService extends IService {
  configure(config: any): Promise<void>;
}

/**
 * 数据存储服务接口
 */
export interface IDataStorageService extends IService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery<T>(query: string, params?: any[]): Promise<T>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}

/**
 * 日志服务接口
 */
export interface ILoggingService extends IService {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
}

/**
 * 缓存服务接口
 */
export interface ICacheService extends IService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * HTTP客户端服务接口
 */
export interface IHttpClientService extends IService {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  setDefaultHeaders(headers: Record<string, string>): void;
  setAuthToken(token: string): void;
}

/**
 * 事件总线服务接口
 */
export interface IEventBusService extends IService {
  emit<T>(event: string, data: T): void;
  on<T>(event: string, handler: (data: T) => void): void;
  off(event: string, handler?: Function): void;
  once<T>(event: string, handler: (data: T) => void): void;
}

// ==================== 辅助类型 ====================

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

type ServiceConstructor<T extends IService> = new (...args: any[]) => T;
type ServiceFactory<T extends IService> = (...args: any[]) => T;
type ServiceKey = string | symbol;

interface ServiceRegistration<T extends IService> {
  key: ServiceKey;
  factory: ServiceFactory<T>;
  singleton: boolean;
  dependencies: ServiceKey[];
  initialized: boolean;
  instance?: T;
}

// ==================== 依赖注入容器 ====================

export class DependencyContainer {
  private static instance: DependencyContainer;
  private services = new Map<ServiceKey, ServiceRegistration<any>>();
  private initializationPromises = new Map<ServiceKey, Promise<void>>();
  private errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * 注册服务
   */
  register<T extends IService>(
    key: ServiceKey,
    factory: ServiceFactory<T>,
    options: {
      singleton?: boolean;
      dependencies?: ServiceKey[];
    } = {}
  ): void {
    const { singleton = true, dependencies = [] } = options;

    this.services.set(key, {
      key,
      factory,
      singleton,
      dependencies,
      initialized: false
    });

    console.log(`[DI] Registered service: ${String(key)}`);
  }

  /**
   * 注册类构造函数
   */
  registerClass<T extends IService>(
    key: ServiceKey,
    constructor: ServiceConstructor<T>,
    options: {
      singleton?: boolean;
      dependencies?: ServiceKey[];
    } = {}
  ): void {
    this.register(key, (...args) => new constructor(...args), options);
  }

  /**
   * 注册单例实例
   */
  registerInstance<T extends IService>(key: ServiceKey, instance: T): void {
    this.services.set(key, {
      key,
      factory: () => instance,
      singleton: true,
      dependencies: [],
      initialized: true,
      instance
    });

    console.log(`[DI] Registered instance: ${String(key)}`);
  }

  /**
   * 解析服务
   */
  async resolve<T extends IService>(key: ServiceKey): Promise<T> {
    const registration = this.services.get(key);
    if (!registration) {
      throw new Error(`Service not registered: ${String(key)}`);
    }

    // 如果是单例且已经有实例，直接返回
    if (registration.singleton && registration.instance) {
      return registration.instance;
    }

    // 检查循环依赖
    this.checkCircularDependencies(key, new Set());

    // 解析依赖
    const dependencies = await Promise.all(
      registration.dependencies.map(dep => this.resolve(dep))
    );

    // 创建实例
    const instance = registration.factory(...dependencies);

    // 如果是单例，缓存实例
    if (registration.singleton) {
      registration.instance = instance;
    }

    // 初始化服务
    if (!registration.initialized) {
      await this.initializeService(key, instance);
      registration.initialized = true;
    }

    return instance;
  }

  /**
   * 批量解析服务
   */
  async resolveAll<T extends IService>(keys: ServiceKey[]): Promise<T[]> {
    return await Promise.all(keys.map(key => this.resolve<T>(key)));
  }

  /**
   * 检查服务是否已注册
   */
  isRegistered(key: ServiceKey): boolean {
    return this.services.has(key);
  }

  /**
   * 获取所有已注册的服务键
   */
  getRegisteredServices(): ServiceKey[] {
    return Array.from(this.services.keys());
  }

  /**
   * 获取服务注册信息
   */
  getServiceInfo(key: ServiceKey): {
    registered: boolean;
    singleton: boolean;
    dependencies: ServiceKey[];
    initialized: boolean;
    hasInstance: boolean;
  } | null {
    const registration = this.services.get(key);
    if (!registration) {
      return null;
    }

    return {
      registered: true,
      singleton: registration.singleton,
      dependencies: [...registration.dependencies],
      initialized: registration.initialized,
      hasInstance: !!registration.instance
    };
  }

  /**
   * 注销服务
   */
  async unregister(key: ServiceKey): Promise<void> {
    const registration = this.services.get(key);
    if (!registration) {
      return;
    }

    // 如果有实例，先释放资源
    if (registration.instance) {
      try {
        await registration.instance.dispose();
      } catch (error) {
        console.error(`[DI] Error disposing service ${String(key)}:`, error);
      }
    }

    // 移除注册
    this.services.delete(key);
    this.initializationPromises.delete(key);

    console.log(`[DI] Unregistered service: ${String(key)}`);
  }

  /**
   * 清理所有服务
   */
  async dispose(): Promise<void> {
    console.log('[DI] Disposing all services...');

    const disposalPromises: Promise<void>[] = [];

    for (const [key, registration] of this.services.entries()) {
      if (registration.instance) {
        disposalPromises.push(
          registration.instance.dispose().catch(error => {
            console.error(`[DI] Error disposing service ${String(key)}:`, error);
          })
        );
      }
    }

    await Promise.all(disposalPromises);

    this.services.clear();
    this.initializationPromises.clear();

    console.log('[DI] All services disposed');
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Array<{
      key: string;
      healthy: boolean;
      error?: string;
    }>;
  }> {
    const results: Array<{
      key: string;
      healthy: boolean;
      error?: string;
    }> = [];

    let overallHealthy = true;

    for (const [key, registration] of this.services.entries()) {
      if (registration.instance) {
        try {
          const healthy = await registration.instance.isHealthy();
          results.push({
            key: String(key),
            healthy
          });
          if (!healthy) {
            overallHealthy = false;
          }
        } catch (error) {
          results.push({
            key: String(key),
            healthy: false,
            error: error instanceof Error ? error.message : String(error)
          });
          overallHealthy = false;
        }
      }
    }

    return {
      healthy: overallHealthy,
      services: results
    };
  }

  // ==================== 私有方法 ====================

  private async initializeService<T extends IService>(key: ServiceKey, instance: T): Promise<void> {
    // 避免重复初始化
    const existingPromise = this.initializationPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    const initPromise = this.doInitializeService(key, instance);
    this.initializationPromises.set(key, initPromise);

    return initPromise;
  }

  private async doInitializeService<T extends IService>(key: ServiceKey, instance: T): Promise<void> {
    try {
      console.log(`[DI] Initializing service: ${String(key)}`);
      await instance.initialize();
      console.log(`[DI] Service initialized: ${String(key)}`);
    } catch (error) {
      console.error(`[DI] Failed to initialize service ${String(key)}:`, error);
      this.initializationPromises.delete(key);
      throw error;
    }
  }

  private checkCircularDependencies(key: ServiceKey, visited: Set<ServiceKey>): void {
    if (visited.has(key)) {
      const cycle = Array.from(visited).concat([key]).map(String).join(' -> ');
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    const registration = this.services.get(key);
    if (!registration) {
      return;
    }

    visited.add(key);

    for (const dependency of registration.dependencies) {
      this.checkCircularDependencies(dependency, new Set(visited));
    }

    visited.delete(key);
  }
}

// ==================== 服务键常量 ====================

export const SERVICE_KEYS = {
  // 基础服务
  LOGGING: Symbol('LoggingService'),
  CACHE: Symbol('CacheService'),
  HTTP_CLIENT: Symbol('HttpClientService'),
  EVENT_BUS: Symbol('EventBusService'),
  DATA_STORAGE: Symbol('DataStorageService'),

  // 业务服务
  TAG_SYSTEM_MANAGER: Symbol('TagSystemManager'),
  CSV_VALIDATION_SERVICE: Symbol('CsvValidationService'),
  COMMENT_COLLECTION_ADAPTER: Symbol('CommentCollectionAdapter'),
  TASK_EXECUTION_ENGINE: Symbol('TaskExecutionEngine'),
  RATE_CONTROL_SERVICE: Symbol('RateControlService'),
  REPORTING_SERVICE: Symbol('ReportingService'),

  // 平台特定服务
  DOUYIN_CLIENT: Symbol('DouyinClient'),
  OCEANENGINE_CLIENT: Symbol('OceanengineClient'),
  PUBLIC_CLIENT: Symbol('PublicClient'),
} as const;

// ==================== 装饰器 ====================

/**
 * 依赖注入装饰器
 */
export function Injectable<T extends IService>(key: ServiceKey) {
  return function(constructor: ServiceConstructor<T>) {
    const container = DependencyContainer.getInstance();
    container.registerClass(key, constructor);
    return constructor;
  };
}

/**
 * 依赖装饰器
 */
export function Inject(key: ServiceKey) {
  return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 这里可以存储元数据，用于自动解析依赖
    // 由于TypeScript装饰器的限制，这里只是示例
    console.log(`[DI] Dependency marked: ${String(key)} at parameter ${parameterIndex}`);
  };
}

// ==================== 工厂函数 ====================

/**
 * 获取依赖注入容器实例
 */
export function getContainer(): DependencyContainer {
  return DependencyContainer.getInstance();
}

/**
 * 解析服务的便捷函数
 */
export async function resolve<T extends IService>(key: ServiceKey): Promise<T> {
  return await getContainer().resolve<T>(key);
}

/**
 * 注册服务的便捷函数
 */
export function register<T extends IService>(
  key: ServiceKey,
  factory: ServiceFactory<T>,
  options?: {
    singleton?: boolean;
    dependencies?: ServiceKey[];
  }
): void {
  getContainer().register(key, factory, options);
}

// ==================== 配置驱动的服务注册 ====================

/**
 * 根据配置注册基础服务
 */
export async function registerCoreServices(
  databaseConfig: DatabaseConfig,
  loggingConfig: LoggingConfig,
  platformConfigs: Record<string, PlatformConfig>
): Promise<void> {
  const container = getContainer();

  // 注册日志服务
  container.register(SERVICE_KEYS.LOGGING, () => {
    // 这里应该返回实际的日志服务实现
    return new MockLoggingService(loggingConfig);
  });

  // 注册数据存储服务
  container.register(SERVICE_KEYS.DATA_STORAGE, () => {
    // 这里应该返回实际的数据存储服务实现
    return new MockDataStorageService(databaseConfig);
  }, {
    dependencies: [SERVICE_KEYS.LOGGING]
  });

  // 注册缓存服务
  container.register(SERVICE_KEYS.CACHE, () => {
    return new MockCacheService();
  });

  // 注册HTTP客户端服务
  container.register(SERVICE_KEYS.HTTP_CLIENT, () => {
    return new MockHttpClientService();
  });

  // 注册事件总线服务
  container.register(SERVICE_KEYS.EVENT_BUS, () => {
    return new MockEventBusService();
  });

  console.log('[DI] Core services registered');
}

// ==================== 模拟服务实现（仅用于演示） ====================

class MockLoggingService implements ILoggingService {
  readonly serviceName = 'MockLoggingService';
  private level: 'debug' | 'info' | 'warn' | 'error' = 'info';

  constructor(private config: LoggingConfig) {
    this.level = config.level;
  }

  async initialize(): Promise<void> {
    console.log('[MockLoggingService] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockLoggingService] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  error(message: string, error?: Error, context?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error, context);
    }
  }

  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = level;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

class MockDataStorageService implements IDataStorageService {
  readonly serviceName = 'MockDataStorageService';

  constructor(private config: DatabaseConfig) {}

  async initialize(): Promise<void> {
    await this.connect();
  }

  async dispose(): Promise<void> {
    await this.disconnect();
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async connect(): Promise<void> {
    console.log('[MockDataStorageService] Connected to database');
  }

  async disconnect(): Promise<void> {
    console.log('[MockDataStorageService] Disconnected from database');
  }

  async executeQuery<T>(query: string, params?: any[]): Promise<T> {
    console.log('[MockDataStorageService] Executing query:', query, params);
    return {} as T;
  }

  async beginTransaction(): Promise<void> {
    console.log('[MockDataStorageService] Transaction started');
  }

  async commitTransaction(): Promise<void> {
    console.log('[MockDataStorageService] Transaction committed');
  }

  async rollbackTransaction(): Promise<void> {
    console.log('[MockDataStorageService] Transaction rolled back');
  }
}

class MockCacheService implements ICacheService {
  readonly serviceName = 'MockCacheService';
  private cache = new Map<string, { value: any; expiry: number }>();

  async initialize(): Promise<void> {
    console.log('[MockCacheService] Initialized');
  }

  async dispose(): Promise<void> {
    this.cache.clear();
    console.log('[MockCacheService] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key) && Date.now() <= this.cache.get(key)!.expiry;
  }
}

class MockHttpClientService implements IHttpClientService {
  readonly serviceName = 'MockHttpClientService';

  async initialize(): Promise<void> {
    console.log('[MockHttpClientService] Initialized');
  }

  async dispose(): Promise<void> {
    console.log('[MockHttpClientService] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    console.log('[MockHttpClientService] GET:', url, config);
    return {} as T;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    console.log('[MockHttpClientService] POST:', url, data, config);
    return {} as T;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    console.log('[MockHttpClientService] PUT:', url, data, config);
    return {} as T;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    console.log('[MockHttpClientService] DELETE:', url, config);
    return {} as T;
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    console.log('[MockHttpClientService] Set default headers:', headers);
  }

  setAuthToken(token: string): void {
    console.log('[MockHttpClientService] Set auth token:', token.substring(0, 10) + '...');
  }
}

class MockEventBusService implements IEventBusService {
  readonly serviceName = 'MockEventBusService';
  private handlers = new Map<string, Function[]>();

  async initialize(): Promise<void> {
    console.log('[MockEventBusService] Initialized');
  }

  async dispose(): Promise<void> {
    this.handlers.clear();
    console.log('[MockEventBusService] Disposed');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  emit<T>(event: string, data: T): void {
    const eventHandlers = this.handlers.get(event) || [];
    for (const handler of eventHandlers) {
      try {
        handler(data);
      } catch (error) {
        console.error(`[MockEventBusService] Error in event handler for ${event}:`, error);
      }
    }
  }

  on<T>(event: string, handler: (data: T) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler?: Function): void {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }

    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
      }
    }
  }

  once<T>(event: string, handler: (data: T) => void): void {
    const onceHandler = (data: T) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }
}