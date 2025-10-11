// src/components/universal-ui/views/visual-view/utils/calibrationStorage.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 校准参数持久化存储模块
 * 
 * 方案 C：按设备/应用维度持久化校准参数
 * 
 * 存储格式：
 * - localStorage key: visualView.calibration.{deviceId}.{packageName}
 * - 值：JSON 序列化的 CalibrationProfile
 * 
 * 优先级：
 * 1. 设备+应用特定配置
 * 2. 设备通用配置（packageName="*"）
 * 3. 全局默认
 */

import type { CoordinateCalibration } from './coordinateTransform';

/**
 * 校准配置档案
 */
export interface CalibrationProfile {
  // 基础识别信息
  deviceId: string;
  packageName: string; // "*" 表示设备通用配置
  
  // 校准参数
  calibration: CoordinateCalibration;
  
  // 元数据
  createdAt: string; // ISO 8601 时间戳
  lastUsedAt: string;
  useCount: number;
  
  // 可选：用户备注
  note?: string;
}

/**
 * 存储键生成器
 */
function getStorageKey(deviceId: string, packageName: string): string {
  // 规范化：移除非法字符，限制长度
  const cleanDeviceId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  const cleanPackageName = packageName.replace(/[^a-zA-Z0-9._*-]/g, '_').slice(0, 100);
  return `visualView.calibration.${cleanDeviceId}.${cleanPackageName}`;
}

/**
 * 保存校准配置档案
 */
export function saveCalibrationProfile(profile: CalibrationProfile): void {
  try {
    const key = getStorageKey(profile.deviceId, profile.packageName);
    const data = JSON.stringify({
      ...profile,
      lastUsedAt: new Date().toISOString(),
      useCount: (profile.useCount || 0) + 1
    });
    localStorage.setItem(key, data);
    console.log(`💾 已保存校准配置: ${key}`);
  } catch (error) {
    console.error('保存校准配置失败:', error);
  }
}

/**
 * 加载校准配置档案
 * 
 * 优先级：
 * 1. 设备+应用特定
 * 2. 设备通用 (packageName="*")
 * 3. null（无匹配）
 */
export function loadCalibrationProfile(
  deviceId: string,
  packageName: string
): CalibrationProfile | null {
  try {
    // 尝试加载设备+应用特定配置
    const specificKey = getStorageKey(deviceId, packageName);
    const specificData = localStorage.getItem(specificKey);
    if (specificData) {
      const profile = JSON.parse(specificData) as CalibrationProfile;
      console.log(`📂 加载特定校准配置: ${specificKey}`);
      return profile;
    }
    
    // 回退：尝试设备通用配置
    const genericKey = getStorageKey(deviceId, '*');
    const genericData = localStorage.getItem(genericKey);
    if (genericData) {
      const profile = JSON.parse(genericData) as CalibrationProfile;
      console.log(`📂 加载通用校准配置: ${genericKey}`);
      return profile;
    }
    
    console.log(`❌ 未找到校准配置: device=${deviceId}, package=${packageName}`);
    return null;
  } catch (error) {
    console.error('加载校准配置失败:', error);
    return null;
  }
}

/**
 * 删除校准配置档案
 */
export function deleteCalibrationProfile(
  deviceId: string,
  packageName: string
): void {
  try {
    const key = getStorageKey(deviceId, packageName);
    localStorage.removeItem(key);
    console.log(`🗑️ 已删除校准配置: ${key}`);
  } catch (error) {
    console.error('删除校准配置失败:', error);
  }
}

/**
 * 列出所有校准配置档案
 */
export function listCalibrationProfiles(): CalibrationProfile[] {
  const profiles: CalibrationProfile[] = [];
  const prefix = 'visualView.calibration.';
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const profile = JSON.parse(data) as CalibrationProfile;
            profiles.push(profile);
          } catch (parseError) {
            console.warn(`⚠️ 解析配置失败: ${key}`, parseError);
          }
        }
      }
    }
    
    // 按最后使用时间降序排序
    profiles.sort((a, b) => {
      const timeA = new Date(a.lastUsedAt).getTime();
      const timeB = new Date(b.lastUsedAt).getTime();
      return timeB - timeA;
    });
    
    console.log(`📋 找到 ${profiles.length} 个校准配置`);
  } catch (error) {
    console.error('列出校准配置失败:', error);
  }
  
  return profiles;
}

/**
 * 创建新的校准配置档案
 */
export function createCalibrationProfile(
  deviceId: string,
  packageName: string,
  calibration: CoordinateCalibration,
  note?: string
): CalibrationProfile {
  return {
    deviceId,
    packageName,
    calibration,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    useCount: 0,
    note
  };
}

/**
 * 更新校准配置档案的使用时间
 */
export function touchCalibrationProfile(
  deviceId: string,
  packageName: string
): void {
  const profile = loadCalibrationProfile(deviceId, packageName);
  if (profile) {
    profile.lastUsedAt = new Date().toISOString();
    profile.useCount += 1;
    saveCalibrationProfile(profile);
  }
}

/**
 * 清理过期的校准配置（未使用超过 30 天）
 */
export function cleanupExpiredProfiles(maxAgeDays: number = 30): number {
  const profiles = listCalibrationProfiles();
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;
  
  profiles.forEach(profile => {
    const lastUsed = new Date(profile.lastUsedAt).getTime();
    const age = now - lastUsed;
    
    if (age > maxAgeMs) {
      deleteCalibrationProfile(profile.deviceId, profile.packageName);
      deletedCount++;
    }
  });
  
  console.log(`🧹 清理了 ${deletedCount} 个过期配置（超过 ${maxAgeDays} 天未使用）`);
  return deletedCount;
}

/**
 * 导出校准配置（用于备份）
 */
export function exportCalibrationProfiles(): string {
  const profiles = listCalibrationProfiles();
  return JSON.stringify(profiles, null, 2);
}

/**
 * 导入校准配置（用于恢复）
 */
export function importCalibrationProfiles(jsonData: string): number {
  try {
    const profiles = JSON.parse(jsonData) as CalibrationProfile[];
    let importedCount = 0;
    
    profiles.forEach(profile => {
      saveCalibrationProfile(profile);
      importedCount++;
    });
    
    console.log(`📥 成功导入 ${importedCount} 个校准配置`);
    return importedCount;
  } catch (error) {
    console.error('导入校准配置失败:', error);
    return 0;
  }
}
