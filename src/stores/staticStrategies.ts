// src/stores/staticStrategies.ts
// module: store | layer: store | role: 静态策略存储管理器
// summary: 管理用户保存的静态策略

export interface StaticStrategy {
  key: string;
  name: string;
  locator: {
    type: string;
    value: string;
  };
  createdAt: string;
  description?: string;
}

class StaticStrategyStorage {
  private strategies = new Map<string, StaticStrategy>();

  save(strategy: StaticStrategy): void {
    this.strategies.set(strategy.key, strategy);
    console.log('💾 [StaticStrategy] 已保存静态策略:', strategy.name);
    
    // TODO: 持久化到本地存储或Tauri FS
    // await this.persistToStorage();
  }

  list(): StaticStrategy[] {
    return Array.from(this.strategies.values());
  }

  get(key: string): StaticStrategy | null {
    return this.strategies.get(key) || null;
  }

  delete(key: string): boolean {
    const deleted = this.strategies.delete(key);
    if (deleted) {
      console.log('🗑️ [StaticStrategy] 已删除静态策略:', key);
      // TODO: 更新持久化存储
    }
    return deleted;
  }

  clear(): void {
    this.strategies.clear();
    console.log('🧹 [StaticStrategy] 已清空所有静态策略');
  }

  size(): number {
    return this.strategies.size;
  }
}

export const StaticStrategyStore = new StaticStrategyStorage();