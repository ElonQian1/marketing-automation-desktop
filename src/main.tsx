// src/main.tsx
// module: shared | layer: application | role: 应用程序启动入口
// summary: React应用启动配置和全局提供商初始化

import React from 'react';
// AntD v5 React19 兼容补丁：需在 antd 组件使用前引入
import '@ant-design/v5-patch-for-react-19';
import ReactDOM from 'react-dom/client';
import App from './App';

// 引入设计令牌系统 - Single Source of Truth
import './styles/tokens.css';

// 引入 Tailwind CSS 基础样式
import './index.css';

// 🔗 全局事件监听器初始化
import { wireAnalysisEventsGlobally } from './application/analysis/wire-global-events';

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-density', 'default');

  // 🌐 延迟初始化全局分析事件监听器，等待Tauri完全加载
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 [main.tsx] DOMContentLoaded 事件触发');
    // 使用setTimeout确保在Tauri初始化之后
    setTimeout(() => {
      console.log('🕒 [main.tsx] 准备初始化全局事件监听器');
      wireAnalysisEventsGlobally()
        .then(() => {
          console.log('✅ [main.tsx] 全局事件监听器初始化成功');
        })
        .catch(error => {
          console.error('❌ [main.tsx] 全局事件监听器初始化失败:', error);
        });
    }, 100);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

