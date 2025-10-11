// src/components/universal-ui/views/visual-view/constants/categories.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 预设分类常量（独立维护，便于后续国际化/主题扩展）
export const PRESET_CATEGORY_NAMES = [
  'navigation',
  'tabs',
  'search',
  'content',
  'buttons',
  'text',
  'images',
  'others'
] as const;

export type PresetCategoryName = typeof PRESET_CATEGORY_NAMES[number];
