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

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-density', 'default');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

