// src/modules/contact-import/ui/components/grid-layout/hooks/useLayoutVersions.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Layout } from 'react-grid-layout';
import { PanelConfig } from '../GridLayoutWrapper';

export interface LayoutVersion {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  panels: Omit<PanelConfig, 'content'>[];
  layouts?: { [key: string]: Layout[] };
  tags?: string[];
}

export interface UseLayoutVersionsOptions {
  storageKey?: string;
  maxVersions?: number;
}

export function useLayoutVersions({ 
  storageKey = 'grid-layout-versions',
  maxVersions = 10 
}: UseLayoutVersionsOptions = {}) {
  const [versions, setVersions] = useState<LayoutVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);

  // 加载版本列表
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setVersions(parsed.versions || []);
        setCurrentVersionId(parsed.currentVersionId || null);
      }
    } catch (error) {
      console.warn('Failed to load layout versions:', error);
    }
  }, [storageKey]);

  // 保存版本列表
  const saveVersions = useCallback((newVersions: LayoutVersion[], newCurrentId?: string) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        versions: newVersions,
        currentVersionId: newCurrentId !== undefined ? newCurrentId : currentVersionId,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save layout versions:', error);
    }
  }, [storageKey, currentVersionId]);

  // 创建新版本
  const createVersion = useCallback((
    panels: Omit<PanelConfig, 'content'>[],
    name: string,
    description?: string,
    tags?: string[]
  ) => {
    const newVersion: LayoutVersion = {
      id: `version_${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: versions.length === 0,
      panels: JSON.parse(JSON.stringify(panels)), // 深拷贝
      tags
    };

    const newVersions = [newVersion, ...versions].slice(0, maxVersions);
    setVersions(newVersions);
    setCurrentVersionId(newVersion.id);
    saveVersions(newVersions, newVersion.id);

    return newVersion;
  }, [versions, maxVersions, saveVersions]);

  // 更新版本
  const updateVersion = useCallback((
    versionId: string,
    updates: Partial<Omit<LayoutVersion, 'id' | 'createdAt'>>,
    panels?: Omit<PanelConfig, 'content'>[]
  ) => {
    const newVersions = versions.map(version => 
      version.id === versionId 
        ? { 
            ...version, 
            ...updates, 
            panels: panels ? JSON.parse(JSON.stringify(panels)) : version.panels,
            updatedAt: new Date().toISOString() 
          }
        : version
    );

    setVersions(newVersions);
    saveVersions(newVersions);
  }, [versions, saveVersions]);

  // 删除版本
  const deleteVersion = useCallback((versionId: string) => {
    const newVersions = versions.filter(v => v.id !== versionId);
    setVersions(newVersions);
    
    // 如果删除的是当前版本，切换到默认版本
    if (currentVersionId === versionId) {
      const defaultVersion = newVersions.find(v => v.isDefault);
      const newCurrentId = defaultVersion?.id || newVersions[0]?.id || null;
      setCurrentVersionId(newCurrentId);
      saveVersions(newVersions, newCurrentId);
    } else {
      saveVersions(newVersions);
    }
  }, [versions, currentVersionId, saveVersions]);

  // 切换版本
  const switchVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersionId(versionId);
      saveVersions(versions, versionId);
      return version;
    }
    return null;
  }, [versions, saveVersions]);

  // 设置默认版本
  const setDefaultVersion = useCallback((versionId: string) => {
    const newVersions = versions.map(version => ({
      ...version,
      isDefault: version.id === versionId
    }));

    setVersions(newVersions);
    saveVersions(newVersions);
  }, [versions, saveVersions]);

  // 导出版本
  const exportVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      const exportData = {
        version,
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `layout-${version.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [versions]);

  // 导入版本
  const importVersion = useCallback((file: File): Promise<LayoutVersion> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.version && data.version.panels) {
            const importedVersion: LayoutVersion = {
              ...data.version,
              id: `imported_${Date.now()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDefault: false
            };

            const newVersions = [importedVersion, ...versions].slice(0, maxVersions);
            setVersions(newVersions);
            saveVersions(newVersions);
            resolve(importedVersion);
          } else {
            reject(new Error('Invalid layout file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse layout file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [versions, maxVersions, saveVersions]);

  // 获取当前版本
  const currentVersion = useMemo(() => {
    return currentVersionId ? versions.find(v => v.id === currentVersionId) : null;
  }, [versions, currentVersionId]);

  // 获取默认版本
  const defaultVersion = useMemo(() => {
    return versions.find(v => v.isDefault) || versions[0] || null;
  }, [versions]);

  return {
    versions,
    currentVersion,
    defaultVersion,
    currentVersionId,
    
    // 版本操作
    createVersion,
    updateVersion,
    deleteVersion,
    switchVersion,
    setDefaultVersion,
    
    // 导入导出
    exportVersion,
    importVersion,
    
    // 工具函数
    hasVersions: versions.length > 0,
    getVersionById: useCallback((id: string) => versions.find(v => v.id === id), [versions])
  };
}