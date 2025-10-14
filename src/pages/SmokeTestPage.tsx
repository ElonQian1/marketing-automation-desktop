// src/pages/SmokeTestPage.tsx
// module: pages | layer: pages | role: test-page
// summary: 冒烟测试页面路由包装器，用于将模块组件暴露给主应用路由

import React from 'react';
import { SmokeTestCompletePage } from '../modules/universal-ui';

/**
 * 智能分析工作流完整冒烟测试页面
 * 
 * 路由路径建议: /smoke-test 或 /debug/smoke-test
 */
const SmokeTestPage: React.FC = () => {
  return <SmokeTestCompletePage />;
};

export default SmokeTestPage;