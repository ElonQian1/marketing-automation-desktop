/**
 * Universal UI 现代化设计系统 - 主导出文件
 * 
 * 这个文件提供了新设计系统的统一导出接口
 * 包括组件、样式和工具函数
 */

// 样式导出
export * from './styles/universal-ui-integration.css';

// 组件导出
export { default as DesignSystemPreview } from '../DesignSystemPreview';
export { default as DesignSystemTestPage } from '../DesignSystemTestPage';

// 设计令牌访问器（如果需要在 JS 中使用）
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    device: {
      online: '#10b981',
      connecting: '#f59e0b',
      offline: '#6b7280',
      error: '#ef4444',
    },
    background: {
      canvas: '#fafafa',
      surface: '#ffffff',
      elevated: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
      tertiary: '#6b7280',
      disabled: '#9ca3af',
    },
    border: {
      subtle: '#f3f4f6',
      default: '#e5e7eb',
      strong: '#d1d5db',
      focus: '#3b82f6',
    }
  },
  spacing: {
    '1': '2px',
    '2': '4px',
    'xs': '4px',
    'sm': '8px',
    'md': '16px',
    'lg': '24px',
    'xl': '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  radius: {
    'sm': '4px',
    'md': '8px', 
    'lg': '12px',
    'xl': '16px',
    '2xl': '24px',
  },
  shadow: {
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  typography: {
    size: {
      'xs': '12px',
      'sm': '14px',
      'base': '16px',
      'lg': '18px',
      'xl': '20px',
      '2xl': '24px',
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    leading: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }
};

// CSS 类名常量
export const cssClasses = {
  // 容器类
  container: 'universal-ui-container',
  panel: 'universal-ui-panel',
  
  // 设备连接相关
  deviceConnection: {
    panel: 'device-connection-panel',
    header: 'device-connection-header',
    title: 'device-connection-title',
    status: 'connection-status',
    selector: 'device-selector',
    selectorContainer: 'device-selector-container',
    controls: 'connection-controls',
    button: 'connection-btn',
  },
  
  // 状态类
  status: {
    online: 'online',
    offline: 'offline', 
    connecting: 'connecting',
    error: 'error',
  },
  
  // 通用状态指示器
  universalStatus: {
    base: 'universal-ui-status',
    ready: 'universal-ui-status ready',
    pending: 'universal-ui-status pending',
    error: 'universal-ui-status error',
  },
  
  // 按钮变体
  button: {
    primary: 'connection-btn primary',
    default: 'connection-btn',
    success: 'connection-btn success',
    warning: 'connection-btn warning',
    danger: 'connection-btn danger',
  }
};

// 工具函数
export const designUtils = {
  /**
   * 获取设备状态对应的 CSS 类名
   */
  getDeviceStatusClass: (status: 'online' | 'offline' | 'connecting' | 'error') => {
    return cssClasses.status[status];
  },
  
  /**
   * 获取设备状态对应的颜色
   */
  getDeviceStatusColor: (status: 'online' | 'offline' | 'connecting' | 'error') => {
    return designTokens.colors.device[status];
  },
  
  /**
   * 构建组合的 CSS 类名
   */
  combineClasses: (...classes: (string | undefined | false)[]) => {
    return classes.filter(Boolean).join(' ');
  },
  
  /**
   * 检查是否为深色模式
   */
  isDarkMode: () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  /**
   * 检查是否偏好减少动效
   */
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  /**
   * 检查是否偏好高对比度
   */
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }
};

// 使用指南
export const usage = {
  quickStart: {
    description: '快速开始使用新的设计系统',
    steps: [
      '1. 导入集成样式文件: import "./styles/universal-ui-integration.css"',
      '2. 在组件上添加 className="universal-page-finder" 以应用新样式',
      '3. 使用设计令牌和 CSS 类名构建界面',
      '4. 参考 DesignSystemPreview 组件了解最佳实践'
    ]
  },
  examples: {
    deviceSelector: `
<div className="device-selector-container">
  <label className="device-selector-label">选择设备</label>
  <div className="device-selector">
    <div className="device-selector-content">
      <div className="device-selector-indicator online"></div>
      <div className="device-selector-info">
        <div className="device-selector-name">设备名称</div>
        <div className="device-selector-details">设备详情</div>
      </div>
    </div>
  </div>
</div>`,
    
    connectionButton: `
<button className="connection-btn primary">
  <span className="connection-btn-icon">🔄</span>
  <span className="connection-btn-text">刷新设备</span>
</button>`,
    
    statusIndicator: `
<div className="universal-ui-status ready">
  <div className="universal-ui-status-dot"></div>
  就绪
</div>`
  }
};

export default {
  designTokens,
  cssClasses,
  designUtils,
  usage
};