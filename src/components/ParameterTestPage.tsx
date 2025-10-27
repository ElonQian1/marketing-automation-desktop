// src/components/ParameterTestPage.tsx
// module: components | layer: ui | role: 参数面板集成测试页面
// summary: 展示DraggableStepCard参数面板集成功能的测试页面

import React, { useState } from 'react';
import { Card, Space, Typography, message } from 'antd';
import DraggableStepCard from './DraggableStepCard';
import type { SmartScriptStep, DeviceInfo, ActionParams } from './DraggableStepCard';

const { Title, Text } = Typography;

// 模拟设备数据
const mockDevices: DeviceInfo[] = [
  {
    id: 'device1',
    name: '测试设备 1',
    status: 'connected',
    resolution: { width: 1080, height: 2340 }
  }
];

// 模拟步骤数据 - 包含不同类型的交互步骤
const mockSteps: SmartScriptStep[] = [
  {
    id: 'step1',
    name: '向下滑动查看更多内容',
    step_type: 'swipe',
    parameters: {
      direction: 'down',
      distance: 300,
      duration: 500,
      coordinateParams: {
        distance: 300,
        duration: 500,
        startX: 540,
        startY: 1000,
        endX: 540,
        endY: 700
      }
    },
    enabled: true
  },
  {
    id: 'step2',
    name: '点击关注按钮',
    step_type: 'click',
    parameters: {
      x: 900,
      y: 1500,
      coordinateParams: {
        x: 900,
        y: 1500,
        holdDuration: 100
      }
    },
    enabled: true
  },
  {
    id: 'step3',
    name: '长按保存图片',
    step_type: 'long_press',
    parameters: {
      x: 540,
      y: 800,
      duration: 1000,
      coordinateParams: {
        x: 540,
        y: 800,
        duration: 1000
      }
    },
    enabled: true
  },
  {
    id: 'step4',
    name: '双击点赞',
    step_type: 'double_tap',
    parameters: {
      x: 540,
      y: 1200,
      coordinateParams: {
        x: 540,
        y: 1200,
        interval: 150
      }
    },
    enabled: true
  }
];

export const ParameterTestPage: React.FC = () => {
  const [steps, setSteps] = useState<SmartScriptStep[]>(mockSteps);

  // 处理参数变更
  const handleParametersChange = (stepId: string, params: ActionParams) => {
    console.log('🎯 [ParameterTestPage] 参数变更:', { stepId, params });
    
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? {
              ...step,
              parameters: {
                ...step.parameters,
                coordinateParams: params
              }
            }
          : step
      )
    );

    // 显示参数更新提示
    message.success(`步骤 "${steps.find(s => s.id === stepId)?.name}" 参数已更新`);
  };

  // 处理步骤编辑
  const handleEdit = (step: SmartScriptStep) => {
    console.log('✏️ 编辑步骤:', step);
    message.info(`编辑步骤: ${step.name}`);
  };

  // 处理步骤删除
  const handleDelete = (stepId: string) => {
    console.log('🗑️ 删除步骤:', stepId);
    setSteps(prevSteps => prevSteps.filter(step => step.id !== stepId));
    message.success('步骤已删除');
  };

  // 处理步骤启用/禁用
  const handleToggle = (stepId: string) => {
    console.log('🔄 切换步骤状态:', stepId);
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, enabled: !step.enabled }
          : step
      )
    );
  };

  return (
    <div className="parameter-test-page" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>参数面板集成测试</Title>
          <Text type="secondary">
            测试 DraggableStepCard 组件的参数调整功能。每个步骤卡片都支持实时参数调整。
          </Text>
        </div>

        <Card 
          title="功能说明" 
          size="small"
          style={{ backgroundColor: '#f0f8ff', borderColor: '#1890ff' }}
        >
          <Space direction="vertical" size="small">
            <Text>• 点击步骤卡片上的 ⚙️ 按钮可打开/关闭参数面板</Text>
            <Text>• 支持的操作类型：滑动(swipe)、点击(click)、长按(long_press)、双击(double_tap)</Text>
            <Text>• 参数包括：坐标位置、距离、持续时间、间隔等</Text>
            <Text>• 所有参数变更会实时保存到步骤配置中</Text>
          </Space>
        </Card>

        <div>
          <Title level={3}>步骤列表</Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {steps.map((step, index) => (
              <DraggableStepCard
                key={step.id}
                step={step}
                index={index}
                devices={mockDevices}
                currentDeviceId="device1"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onParametersChange={handleParametersChange}
                style={{
                  border: step.enabled ? '1px solid #d9d9d9' : '1px solid #ff4d4f',
                  opacity: step.enabled ? 1 : 0.6
                }}
              />
            ))}
          </Space>
        </div>

        <Card title="当前步骤参数状态" size="small">
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(steps.map(step => ({
              id: step.id,
              name: step.name,
              type: step.step_type,
              enabled: step.enabled,
              parameters: step.parameters
            })), null, 2)}
          </pre>
        </Card>
      </Space>
    </div>
  );
};

export default ParameterTestPage;