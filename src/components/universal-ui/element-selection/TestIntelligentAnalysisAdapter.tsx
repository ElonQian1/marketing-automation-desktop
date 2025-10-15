// src/components/universal-ui/element-selection/TestIntelligentAnalysisAdapter.tsx
// module: ui | layer: ui | role: test-component
// summary: 智能分析适配器测试组件

import React, { useState } from 'react';
import { Button, Card, Space, Typography, Tag } from 'antd';
import { ElementSelectionPopover } from './ElementSelectionPopover';
import type { UIElement } from '../../../api/universalUIAPI';
import type { ElementSelectionState } from './ElementSelectionPopover';

const { Title, Text } = Typography;

// 模拟测试数据
const mockElement: UIElement = {
  id: 'test-element-001',
  element_type: 'Button',
  class_name: 'android.widget.Button',
  text: '立即购买',
  content_desc: '购买按钮',
  resource_id: 'com.example:id/buy_button',
  xpath: '//android.widget.Button[@resource-id="com.example:id/buy_button"]',
  bounds: {
    left: 100,
    top: 200,
    right: 300,
    bottom: 250,
  },
  is_clickable: true,
  is_scrollable: false,
  is_enabled: true,
  is_focused: false,
  checkable: false,
  checked: false,
  selected: false,
  password: false,
};

/**
 * 智能分析适配器测试组件
 */
export const TestIntelligentAnalysisAdapter: React.FC = () => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectionState, setSelectionState] = useState<ElementSelectionState | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleStartTest = () => {
    addTestResult('开始测试智能分析适配器');
    
    const selection: ElementSelectionState = {
      element: mockElement,
      position: { x: 200, y: 225 },
      confirmed: false,
    };
    
    setSelectionState(selection);
    setPopoverVisible(true);
    addTestResult('显示元素选择气泡，启用智能分析功能');
  };

  const handleConfirm = () => {
    addTestResult('用户确认选择元素');
    setPopoverVisible(false);
    setSelectionState(null);
  };

  const handleCancel = () => {
    addTestResult('用户取消选择元素');
    setPopoverVisible(false);
    setSelectionState(null);
  };

  const handleStrategySelect = (strategy: { name: string; confidence: number }) => {
    addTestResult(`用户选择策略: ${strategy.name} (置信度: ${strategy.confidence})`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>智能分析适配器测试</Title>
      
      <Card title="测试控制" style={{ marginBottom: '20px' }}>
        <Space>
          <Button type="primary" onClick={handleStartTest}>
            开始测试智能分析
          </Button>
          <Button onClick={clearResults}>
            清空日志
          </Button>
        </Space>
      </Card>

      <Card title="模拟元素信息" style={{ marginBottom: '20px' }}>
        <Space direction="vertical">
          <div>
            <Text strong>元素ID:</Text> <Tag>{mockElement.id}</Tag>
          </div>
          <div>
            <Text strong>类名:</Text> <Tag>{mockElement.class_name}</Tag>
          </div>
          <div>
            <Text strong>文本:</Text> <Tag>{mockElement.text}</Tag>
          </div>
          <div>
            <Text strong>资源ID:</Text> <Tag>{mockElement.resource_id}</Tag>
          </div>
          <div>
            <Text strong>边界:</Text> 
            <Tag>{`(${mockElement.bounds.left}, ${mockElement.bounds.top}) - (${mockElement.bounds.right}, ${mockElement.bounds.bottom})`}</Tag>
          </div>
        </Space>
      </Card>

      <Card title="测试日志" style={{ marginBottom: '20px' }}>
        <div style={{ 
          height: '200px', 
          overflow: 'auto', 
          border: '1px solid #d9d9d9', 
          padding: '10px',
          backgroundColor: '#fafafa',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          {testResults.length === 0 ? (
            <Text type="secondary">等待测试开始...</Text>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {result}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 智能分析适配器测试 */}
      <ElementSelectionPopover
        visible={popoverVisible}
        selection={selectionState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        enableIntelligentAnalysis={true}
        stepId="test-step-001"
        onStrategySelect={handleStrategySelect}
        actionTokens={{}}
        autoPlacement={true}
        autoPlacementMode="area"
        snapToAnchor={true}
        clampRatio={0.9}
      />
    </div>
  );
};