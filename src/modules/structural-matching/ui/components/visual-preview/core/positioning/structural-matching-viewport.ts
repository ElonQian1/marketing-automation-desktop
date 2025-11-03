// src/modules/structural-matching/ui/components/visual-preview/core/positioning/structural-matching-viewport.ts
// module: structural-matching | layer: ui | role: 视口读取
// summary: 安全获取浏览器视口大小，带兜底默认值

export function getViewportSize(defaults = { width: 1920, height: 1080 }) {
  if (typeof window !== "undefined" && window.innerWidth && window.innerHeight) {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { ...defaults };
}
