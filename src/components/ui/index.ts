/**
 * UI组件库统一导出
 * 提供所有UI组件的便捷导入方式
 */

// 按钮组件
export * from './buttons';

// 表单组件
export * from './forms';

// 布局组件
export * from './layouts';

// 反馈组件
export * from './feedback';

// 组件使用指南
export const UIComponentGuide = {
  buttons: {
    primary: '用于最重要的操作',
    secondary: '用于次要操作',
    icon: '用于工具栏和紧凑布局',
  },
  forms: {
    formField: '统一的表单字段包装器',
    input: '增强的输入框组件',
    select: '支持多种选择模式的下拉组件',
  },
  layouts: {
    pageContainer: '页面级容器组件',
    panel: '内容面板组件',
    grid: '响应式网格布局系统',
  },
  feedback: {
    loading: '各种场景的加载状态组件',
  },
  bestPractices: {
    fileSize: '每个组件文件保持在500行以内',
    modularity: '组件应该是可复用和可组合的',
    accessibility: '确保所有组件支持键盘导航和屏幕阅读器',
    responsive: '所有组件应该支持响应式设计',
    consistency: '使用统一的设计令牌和命名规范',
  },
} as const;