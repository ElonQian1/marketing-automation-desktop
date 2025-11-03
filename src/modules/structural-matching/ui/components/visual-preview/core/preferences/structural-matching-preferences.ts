// src/modules/structural-matching/ui/components/visual-preview/core/preferences/structural-matching-preferences.ts
// module: structural-matching | layer: ui | role: UI偏好
// summary: 管理结构匹配浮窗的UI偏好（如“原始属性”默认开关），支持默认值与本地持久化

export interface StructuralMatchingUIPreferences {
  showRawAttributes: boolean;
}

const STORAGE_KEY = "structuralMatching.ui.preferences.v1";

export function getDefaultUIPreferences(): StructuralMatchingUIPreferences {
  return {
    // 默认关闭“原始属性”
    showRawAttributes: false,
  };
}

export function loadUIPreferences(): StructuralMatchingUIPreferences {
  try {
    if (typeof window === "undefined") return getDefaultUIPreferences();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultUIPreferences();
    const parsed = JSON.parse(raw) as Partial<StructuralMatchingUIPreferences>;
    return {
      ...getDefaultUIPreferences(),
      ...parsed,
    };
  } catch {
    return getDefaultUIPreferences();
  }
}

export function saveUIPreferences(prefs: Partial<StructuralMatchingUIPreferences>) {
  try {
    if (typeof window === "undefined") return;
    const current = loadUIPreferences();
    const merged: StructuralMatchingUIPreferences = { ...current, ...prefs };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // 忽略存储异常
  }
}
