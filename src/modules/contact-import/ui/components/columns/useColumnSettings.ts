import { useMemo, useState, useEffect } from 'react';

export interface ColumnSettingItem {
  key: string;
  title: string;
  defaultVisible?: boolean;
  defaultWidth?: number;
}

export interface ColumnRuntimeConfig {
  key: string;
  title: string;
  visible: boolean;
  width?: number;
}

export interface UseColumnSettingsResult {
  configs: ColumnRuntimeConfig[];
  setVisible: (key: string, visible: boolean) => void;
  setWidth: (key: string, width?: number) => void;
  reorder: (keys: string[]) => void;
  reset: () => void;
  visibleCount: number;
}

export function useColumnSettings(storageKey: string, defaults: ColumnSettingItem[]): UseColumnSettingsResult {
  const load = (): ColumnRuntimeConfig[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ColumnRuntimeConfig[];
        // 合并默认项，防止新列没有配置
        const map = new Map(parsed.map(p => [p.key, p]));
        return defaults.map(d => {
          const prev = map.get(d.key);
          return {
            key: d.key,
            title: d.title,
            visible: prev ? prev.visible : d.defaultVisible !== false,
            width: prev && typeof prev.width !== 'undefined' ? prev.width : (d.defaultWidth ?? 120),
          };
        });
      }
    } catch {}
    return defaults.map(d => ({
      key: d.key,
      title: d.title,
      visible: d.defaultVisible !== false,
      width: d.defaultWidth ?? 120,
    }));
  };

  const [configs, setConfigs] = useState<ColumnRuntimeConfig[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(configs));
    } catch {}
  }, [storageKey, configs]);

  const api = useMemo<UseColumnSettingsResult>(() => ({
    configs,
    setVisible: (key, visible) => setConfigs(prev => {
      let changed = false;
      const next = prev.map(c => {
        if (c.key !== key) return c;
        if (c.visible === visible) return c;
        changed = true;
        return { ...c, visible };
      });
      return changed ? next : prev;
    }),
    setWidth: (key, width) => setConfigs(prev => {
      let changed = false;
      const next = prev.map(c => {
        if (c.key !== key) return c;
        if (c.width === width) return c;
        changed = true;
        return { ...c, width };
      });
      return changed ? next : prev;
    }),
    reorder: (keys) => setConfigs(prev => {
      const map = new Map(prev.map(c => [c.key, c] as const));
      const next: ColumnRuntimeConfig[] = [];
      for (const k of keys) {
        const item = map.get(k);
        if (item) {
          next.push(item);
          map.delete(k);
        }
      }
      // 追加遗漏项，保持原有相对顺序
      for (const c of prev) {
        if (map.has(c.key)) {
          next.push(c);
          map.delete(c.key);
        }
      }
      return next;
    }),
    reset: () => setConfigs(load()),
    visibleCount: configs.filter(c => c.visible).length,
  }), [configs]);

  return api;
}
