// src/test-smart-step-demo.tsx
// module: test | layer: pages | role: 智能步骤演示页面
// summary: 智能步骤系统的临时测试演示页面

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