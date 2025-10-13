// src/test-smart-step-demo.tsx
// 临时测试页面：智能步骤系统演示

import React from 'react';
import { UniversalSmartStepDemo } from './modules/universal-ui';

/**
 * 测试智能步骤系统演示页面
 */
export const TestSmartStepDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <UniversalSmartStepDemo
        title="智能步骤分析系统测试"
        showDebugInfo={true}
        maxSteps={5}
      />
    </div>
  );
};

export default TestSmartStepDemo;