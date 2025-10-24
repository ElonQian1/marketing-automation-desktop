// src/test-smart-selection.tsx
// module: test | layer: ui | role: 智能选择集成测试页面
// summary: 验证智能选择功能在步骤卡片中的集成

import React, { useState } from 'react';
import { Card, Typography, Divider } from 'antd';
import { ActionSelector } from './components/step-card/ActionSelector';
import type { StepAction } from './types/smartScript';

const { Title, Paragraph } = Typography;

const TestSmartSelection: React.FC = () => {
  const [action, setAction] = useState<StepAction>({ 
    kind: 'smart_selection',
    params: {
      smartSelection: {
        mode: 'first',
        targetText: '关注',
        minConfidence: 0.8,
        batchConfig: {
          intervalMs: 2000,
          maxCount: 10,
          continueOnError: true,
          showProgress: true
        }
      }
    }
  });

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>智能选择步骤卡片集成测试</Title>
      
      <Card>
        <Title level={4}>动作选择器测试</Title>
        <Paragraph>
          测试智能选择功能是否正确集成到步骤卡片系统中：
        </Paragraph>
        
        <ActionSelector
          action={action}
          onChange={setAction}
          size="middle"
        />
        
        <Divider />
        
        <Title level={5}>当前配置：</Title>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          {JSON.stringify(action, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default TestSmartSelection;