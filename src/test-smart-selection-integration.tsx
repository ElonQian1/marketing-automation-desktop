// src/test-smart-selection-integration.tsx
// module: test | layer: ui | role: 智能选择完整集成测试页面
// summary: 验证智能选择功能在脚本构建器和步骤卡片中的完整集成

import React, { useState } from 'react';
import { Card, Typography, Divider, Space, Button, message } from 'antd';
import { ActionSelector } from './components/step-card/ActionSelector';
import { SmartStepEditorModal } from './pages/SmartScriptBuilderPage/components/smart-step-adder/SmartStepEditorModal';
import type { StepAction } from './types/smartScript';
import { SmartActionType } from './types/smartComponents';
import { Form } from 'antd';

const { Title, Paragraph, Text } = Typography;

const TestSmartSelectionIntegration: React.FC = () => {
  const [form] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  
  // ActionSelector 测试状态
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

  // SmartStepEditorModal 测试状态
  const [editingStep, setEditingStep] = useState({
    id: 'test-smart-selection',
    step_type: SmartActionType.SMART_SELECTION,
    name: '智能选择测试步骤',
    description: '测试智能选择功能在脚本构建器中的集成',
    parameters: {
      target_text: '关注',
      selection_mode: 'first',
      min_confidence: 0.8,
      batch_interval_ms: 2000,
      batch_max_count: 10,
    },
    enabled: true,
  });

  const handleTestActionSelector = () => {
    message.success('ActionSelector 测试成功！智能选择配置已更新');
    console.log('ActionSelector 配置:', action);
  };

  const handleTestStepEditor = () => {
    setShowModal(true);
  };

  const handleModalOk = () => {
    setShowModal(false);
    message.success('SmartStepEditorModal 测试成功！智能选择步骤已配置');
    console.log('步骤编辑器配置:', form.getFieldsValue());
  };

  const handleModalCancel = () => {
    setShowModal(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🧠 智能选择系统 - 完整集成测试</Title>
      
      <Paragraph>
        本页面验证智能选择功能在两个主要组件中的完整集成：
      </Paragraph>

      {/* 测试1: ActionSelector 组件 */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>测试1: ActionSelector 组件集成</Title>
        <Paragraph>
          <Text type="secondary">
            验证步骤卡片中的 ActionSelector 组件是否正确支持智能选择功能
          </Text>
        </Paragraph>
        
        <div style={{ 
          background: '#fafafa', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <ActionSelector
            action={action}
            onChange={setAction}
            size="middle"
          />
        </div>

        <Space>
          <Button type="primary" onClick={handleTestActionSelector}>
            测试 ActionSelector
          </Button>
          <Button 
            onClick={() => console.log('当前配置:', action)}
          >
            查看配置
          </Button>
        </Space>
        
        <Divider />
        
        <Title level={5}>当前 ActionSelector 配置：</Title>
        <pre style={{ 
          background: '#f0f2f5', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '12px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {JSON.stringify(action, null, 2)}
        </pre>
      </Card>

      {/* 测试2: SmartStepEditorModal 组件 */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>测试2: SmartStepEditorModal 组件集成</Title>
        <Paragraph>
          <Text type="secondary">
            验证脚本构建器中的步骤编辑器是否正确支持智能选择功能配置
          </Text>
        </Paragraph>

        <Space>
          <Button type="primary" onClick={handleTestStepEditor}>
            打开步骤编辑器
          </Button>
          <Button 
            onClick={() => console.log('编辑步骤:', editingStep)}
          >
            查看步骤配置
          </Button>
        </Space>
        
        <Divider />
        
        <Title level={5}>当前步骤配置：</Title>
        <pre style={{ 
          background: '#f0f2f5', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '12px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {JSON.stringify(editingStep, null, 2)}
        </pre>
      </Card>

      {/* 功能说明 */}
      <Card>
        <Title level={4}>🎯 智能选择功能说明</Title>
        
        <div style={{ marginBottom: '16px' }}>
          <Title level={5}>支持的选择模式：</Title>
          <ul>
            <li><Text code>first</Text> - 选择第一个匹配的元素</li>
            <li><Text code>last</Text> - 选择最后一个匹配的元素</li>
            <li><Text code>random</Text> - 随机选择一个匹配的元素</li>
            <li><Text code>all</Text> - 选择所有匹配的元素（批量操作）</li>
          </ul>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Title level={5}>主要参数：</Title>
          <ul>
            <li><Text strong>目标文本</Text> - 要查找的元素文本内容</li>
            <li><Text strong>最小置信度</Text> - 元素匹配的最低置信度阈值</li>
            <li><Text strong>批量间隔</Text> - 批量操作时每次点击的间隔时间</li>
            <li><Text strong>最大数量</Text> - 批量操作的最大元素数量</li>
          </ul>
        </div>

        <div>
          <Title level={5}>使用场景：</Title>
          <ul>
            <li>📱 <Text strong>社交应用</Text> - 批量关注/取关用户</li>
            <li>🛒 <Text strong>电商应用</Text> - 批量加购物车</li>
            <li>📰 <Text strong>内容应用</Text> - 批量点赞/收藏</li>
            <li>🎮 <Text strong>游戏应用</Text> - 批量操作道具</li>
          </ul>
        </div>
      </Card>

      {/* SmartStepEditorModal */}
      <SmartStepEditorModal
        visible={showModal}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        form={form}
        currentDeviceId="test-device"
        editingStep={editingStep}
        onOpenSmartNavigation={() => message.info('导航功能演示')}
        onOpenPageAnalyzer={() => message.info('页面分析功能演示')}
      />
    </div>
  );
};

export default TestSmartSelectionIntegration;