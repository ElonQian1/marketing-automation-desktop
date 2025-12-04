// src/services/app-registry-service.ts
// module: services | layer: services | role: app-registry
// summary: 应用注册表服务，管理预设应用和设备已安装应用的合并与缓存

import { PRESET_APPS } from '../config/preset-apps';
import type { AppInfo } from '../types/smartComponents';

const STORAGE_KEY = 'smart_app_registry_v1';

class AppRegistryService {
  private registry: Map<string, AppInfo> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // 1. 加载预设应用
    PRESET_APPS.forEach(app => {
      this.registry.set(app.package_name, { ...app, source: 'preset' });
    });

    // 2. 加载本地学习到的应用
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const learnedApps: AppInfo[] = JSON.parse(saved);
        learnedApps.forEach(app => {
          // 本地学习的覆盖预设的（因为可能有更新的信息）
          this.registry.set(app.package_name, { ...app, source: 'learned' });
        });
      }
    } catch (e) {
      console.error('Failed to load app registry', e);
    }

    this.initialized = true;
  }

  /**
   * 获取所有已知应用
   */
  getAllApps(): AppInfo[] {
    return Array.from(this.registry.values());
  }

  /**
   * 搜索应用
   */
  searchApps(query: string): AppInfo[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllApps();

    return this.getAllApps().filter(app => 
      app.app_name.toLowerCase().includes(q) || 
      app.package_name.toLowerCase().includes(q)
    );
  }

  /**
   * 学习新应用（当从设备扫描到新应用时调用）
   */
  learnApp(app: AppInfo) {
    // 只有当应用不在库中，或者信息有更新时才保存
    const existing = this.registry.get(app.package_name);
    if (!existing || this.isNewer(app, existing)) {
      this.registry.set(app.package_name, { ...app, source: 'learned', last_seen: Date.now() });
      this.save();
    }
  }

  /**
   * 批量学习
   */
  learnApps(apps: AppInfo[]) {
    let changed = false;
    apps.forEach(app => {
      const existing = this.registry.get(app.package_name);
      if (!existing) {
        this.registry.set(app.package_name, { ...app, source: 'learned', last_seen: Date.now() });
        changed = true;
      }
    });
    
    if (changed) {
      this.save();
    }
  }

  /**
   * 移除已学习的应用
   */
  forgetApp(packageName: string) {
    const app = this.registry.get(packageName);
    if (app && app.source === 'learned') {
      this.registry.delete(packageName);
      this.save();
      
      // 如果预设里有这个应用，恢复预设版本
      const preset = PRESET_APPS.find(p => p.package_name === packageName);
      if (preset) {
        this.registry.set(packageName, { ...preset, source: 'preset' });
      }
    }
  }

  private isNewer(newApp: AppInfo, oldApp: AppInfo): boolean {
    // 简单逻辑：如果有版本号且不同，则更新
    if (newApp.version_code && newApp.version_code !== oldApp.version_code) return true;
    return false;
  }

  private save() {
    try {
      // 只保存 'learned' 类型的应用，预设的每次启动重新加载
      const toSave = Array.from(this.registry.values()).filter(a => a.source === 'learned');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save app registry', e);
    }
  }
}

export const appRegistryService = new AppRegistryService();
