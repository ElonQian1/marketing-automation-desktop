import { TauriDeviceRepository } from '../../infrastructure/repositories/TauriDeviceRepository';
import { RealTimeDeviceRepository } from '../../infrastructure/repositories/RealTimeDeviceRepository';
import { TauriAdbRepository } from '../../infrastructure/repositories/TauriAdbRepository';
import { TauriDiagnosticRepository } from '../../infrastructure/repositories/TauriDiagnosticRepository';
import { IDeviceRepository } from '../../domain/adb/repositories/IDeviceRepository';
import { IAdbRepository } from '../../domain/adb/repositories/IAdbRepository';
import { IDiagnosticRepository } from '../../domain/adb/repositories/IDiagnosticRepository';
import { DeviceManagerService } from '../../domain/adb/services/DeviceManagerService';
import { ConnectionService } from '../../domain/adb/services/ConnectionService';
import { DiagnosticService } from '../../domain/adb/services/DiagnosticService';
import { AdbApplicationService } from './AdbApplicationService';
import { IUiMatcherRepository } from '../../domain/page-analysis/repositories/IUiMatcherRepository';
import { TauriUiMatcherRepository } from '../../infrastructure/repositories/TauriUiMatcherRepository';
import { ISmartScriptRepository } from '../../domain/smart-script/repositories/ISmartScriptRepository';
import { TauriSmartScriptRepository } from '../../infrastructure/repositories/TauriSmartScriptRepository';
import ContactImportApplicationService from './contact-import/ContactImportApplicationService';
import VcfImportApplicationService from './contact-import/VcfImportApplicationService';
import { IContactAutomationRepository } from '../../domain/contact-automation/repositories/IContactAutomationRepository';
import { TauriContactAutomationRepository } from '../../infrastructure/repositories/TauriContactAutomationRepository';
import { TauriDeviceMetricsRepository } from '../../infrastructure/repositories/TauriDeviceMetricsRepository';
import type { IDeviceMetricsRepository } from '../../domain/device/repositories/IDeviceMetricsRepository';
import DeviceMetricsApplicationService from './device/DeviceMetricsApplicationService';

/**
 * 服务容器
 * 负责依赖注入和服务生命周期管理
 */
class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * 注册服务
   */
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  /**
   * 获取服务（单例模式）
   */
  get<T>(key: string): T {
    if (!this.services.has(key)) {
      throw new Error(`Service ${key} not registered`);
    }

    const serviceKey = `${key}_instance`;
    if (!this.services.has(serviceKey)) {
      const factory = this.services.get(key);
      this.services.set(serviceKey, factory());
    }

    return this.services.get(serviceKey);
  }

  /**
   * 清理所有服务实例（主要用于测试）
   */
  clear(): void {
    this.services.clear();
    this.registerDefaultServices();
  }

  /**
   * 注册默认服务
   */
  registerDefaultServices(): void {
    // 注册Repository层 - 使用实时设备仓储实现事件驱动
    this.register('deviceRepository', () => new RealTimeDeviceRepository());
    this.register('adbRepository', () => new TauriAdbRepository());
  this.register('diagnosticRepository', () => new TauriDiagnosticRepository());
  this.register('uiMatcherRepository', () => new TauriUiMatcherRepository());
  this.register('smartScriptRepository', () => new TauriSmartScriptRepository());
  this.register('contactAutomationRepository', () => new TauriContactAutomationRepository());
  this.register('deviceMetricsRepository', () => new TauriDeviceMetricsRepository());

    // Marketing domain repositories
    this.register('watchTargetRepository', () => {
      // Prefer Tauri-backed repo when available; fallback to in-memory for web/dev
      try {
        const { TauriWatchTargetRepository } = require('../../infrastructure/repositories/TauriWatchTargetRepository');
        return new TauriWatchTargetRepository();
      } catch (e) {
        const { InMemoryWatchTargetRepository } = require('../../infrastructure/repositories/InMemoryWatchTargetRepository');
        return new InMemoryWatchTargetRepository();
      }
    });
    this.register('tagWhitelistRepository', () => {
      const { StaticTagWhitelistRepository } = require('../../infrastructure/repositories/StaticTagWhitelistRepository');
      return new StaticTagWhitelistRepository();
    });

    // 注册Domain Service层
    this.register('deviceManagerService', () => {
      const deviceRepository = this.get<IDeviceRepository>('deviceRepository');
      return new DeviceManagerService(deviceRepository);
    });

    this.register('connectionService', () => {
      const adbRepository = this.get<IAdbRepository>('adbRepository');
      return new ConnectionService(adbRepository);
    });

    this.register('diagnosticService', () => {
      const diagnosticRepository = this.get<IDiagnosticRepository>('diagnosticRepository');
      return new DiagnosticService(diagnosticRepository);
    });

    // 注册Application Service层
    this.register('adbApplicationService', () => {
      const deviceManager = this.get<DeviceManagerService>('deviceManagerService');
      const connectionService = this.get<ConnectionService>('connectionService');
      const diagnosticService = this.get<DiagnosticService>('diagnosticService');
      const uiMatcherRepository = this.get<IUiMatcherRepository>('uiMatcherRepository');
      const smartScriptRepository = this.get<ISmartScriptRepository>('smartScriptRepository');
      const svc = new AdbApplicationService(
        deviceManager,
        connectionService,
        diagnosticService,
        uiMatcherRepository,
        smartScriptRepository
      );
      // 保障：服务创建后即尝试启动设备监听（幂等，无副作用）
      try {
        svc.ensureDeviceWatchingStarted();
      } catch (e) {
        console.warn('⚠️ [ServiceFactory] ensureDeviceWatchingStarted 调用失败（可忽略，稍后将通过 useAdb 重试）:', e);
      }
      // DEV helper: expose a function to force-start device watching for diagnostics
      try {
        if ((import.meta as any).env?.MODE !== 'production') {
          (globalThis as any).__ensureDeviceWatching = () => svc.ensureDeviceWatchingStarted();
          console.log('🧪 [ServiceFactory] Dev helper registered: window.__ensureDeviceWatching()');
        }
      } catch {}
      return svc;
    });

    this.register('contactImportApplicationService', () => {
      return new ContactImportApplicationService();
    });

    this.register('vcfImportApplicationService', () => {
      const repo = this.get<IContactAutomationRepository>('contactAutomationRepository');
      return new VcfImportApplicationService(repo);
    });

    this.register('deviceMetricsApplicationService', () => {
      const repo = this.get<IDeviceMetricsRepository>('deviceMetricsRepository');
      return new DeviceMetricsApplicationService(repo);
    });

    // Marketing application service
    this.register('marketingApplicationService', () => {
      const { MarketingApplicationService } = require('./MarketingApplicationService');
      const watchRepo = this.get<any>('watchTargetRepository');
      const whitelistRepo = this.get<any>('tagWhitelistRepository');
      return new MarketingApplicationService(watchRepo, whitelistRepo);
    });
  }
}

// 初始化服务容器
const container = ServiceContainer.getInstance();
container.registerDefaultServices();

/**
 * 服务工厂 - 提供便捷的服务获取方法
 */
export const ServiceFactory = {
  /**
   * 获取ADB应用服务（主要入口）
   */
  getAdbApplicationService(): AdbApplicationService {
    return container.get<AdbApplicationService>('adbApplicationService');
  },

  /**
   * 获取设备管理服务
   */
  getDeviceManagerService(): DeviceManagerService {
    return container.get<DeviceManagerService>('deviceManagerService');
  },

  /**
   * 获取连接服务
   */
  getConnectionService(): ConnectionService {
    return container.get<ConnectionService>('connectionService');
  },

  /**
   * 获取诊断服务
   */
  getDiagnosticService(): DiagnosticService {
    return container.get<DiagnosticService>('diagnosticService');
  },

  /** 获取脚本执行仓储（可选直接使用场景） */
  getSmartScriptRepository(): ISmartScriptRepository {
    return container.get<ISmartScriptRepository>('smartScriptRepository');
  },

  /** 获取联系人导入应用服务 */
  getContactImportApplicationService(): ContactImportApplicationService {
    return container.get<ContactImportApplicationService>('contactImportApplicationService');
  },

  /** 获取 VCF 导入应用服务 */
  getVcfImportApplicationService(): VcfImportApplicationService {
    return container.get<VcfImportApplicationService>('vcfImportApplicationService');
  },

  /** 获取 设备指标应用服务 */
  getDeviceMetricsApplicationService(): DeviceMetricsApplicationService {
    return container.get<DeviceMetricsApplicationService>('deviceMetricsApplicationService');
  },

  /** 获取 精准获客 应用服务 */
  getMarketingApplicationService(): import('./MarketingApplicationService').MarketingApplicationService {
    return container.get('marketingApplicationService');
  },

  /**
   * 重置服务容器（主要用于测试）
   */
  reset(): void {
    container.clear();
  }
};

export default ServiceFactory;

