// src/pages/ExecutionControlTestPage.tsx
// module: ui | layer: ui | role: 测试页面
// summary: 用于测试执行控制和失败处理功能的独立页面

import React, { useState } from 'react';
import { Card, Space, Button, Typography, Row, Col, message } from 'antd';
import { ExecutionControlButtons, AbortButton } from '../modules/execution-control';
import { StepFailureConfigPanel } from '../modules/execution-flow-control/ui/step-failure-config-panel';
import { ModernStepCard } from '../components/step-cards/ModernStepCard';
import type { ExtendedSmartScriptStep } from '../types/loopScript';
import type { ExecutionFailureHandlingConfig } from '../modules/execution-flow-control/domain/failure-handling-strategy';

const { Title, Text } = Typography;

const ExecutionControlTestPage: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [testSteps, setTestSteps] = useState<ExtendedSmartScriptStep[]>([
    {
      id: 'test_step_1',
      name: '测试步骤1',
      description: '点击我按钮',
      step_type: 'smart_selection',
      enabled: true,
      parameters: {
        xpath: "//android.widget.TextView[@text='我']",
        text: '我'
      }
    },
    {
      id: 'test_step_2', 
      name: '测试步骤2',
      description: '滚动查找',
      step_type: 'scroll_to_find',
      enabled: true,
      parameters: {
        direction: 'down',
        target: '设置'
      }
    },
    {
      id: 'test_step_3',
      name: '测试步骤3', 
      description: '点击设置',
      step_type: 'smart_selection',
      enabled: true,
      parameters: {
        xpath: "//android.widget.TextView[@text='设置']",
        text: '设置'
      }
    }
  ]);

  const handleExecuteScript = async () => {
    console.log('🚀 [测试页面] 开始执行测试脚本');
    setIsExecuting(true);
    
    try {
      // 模拟执行过程
      for (let i = 0; i < testSteps.length; i++) {
        const step = testSteps[i];
        console.log(`📍 [测试页面] 执行步骤 ${i + 1}: ${step.description}`);
        
        // 模拟步骤执行时间
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 模拟第一步失败
        if (i === 0) {
          console.error(`❌ [测试页面] 步骤 ${i + 1} 失败`);
          message.error(`步骤 ${i + 1} 执行失败`, 3);
          // 这里可以根据失败处理策略决定是否继续
        } else {
          console.log(`✅ [测试页面] 步骤 ${i + 1} 成功`);
          message.success(`步骤 ${i + 1} 执行成功`, 1);
        }
      }
      
      message.success('🎉 测试脚本执行完成', 3);
    } catch (error) {
      console.error('❌ [测试页面] 执行失败:', error);
      message.error('脚本执行失败', 3);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAbort = async () => {
    console.log('🛑 [测试页面] 用户请求中止执行');
    message.warning('脚本执行已中止', 3);
    setIsExecuting(false);
  };

  const handleStepUpdate = (index: number, updatedStep: ExtendedSmartScriptStep) => {
    setTestSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = updatedStep;
      return newSteps;
    });
    console.log('📝 [测试页面] 步骤更新:', updatedStep);
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card>
          <Title level={2}>🧪 执行控制与失败处理功能测试</Title>
          <Text type="secondary">
            这个页面用于测试执行控制按钮和步骤失败处理配置功能
          </Text>
        </Card>

        <Row gutter={[16, 16]}>
          {/* 左侧：步骤列表 */}
          <Col xs={24} lg={16}>
            <Card title="📋 测试步骤列表" style={{ height: 'fit-content' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {testSteps.map((step, index) => (
                  <ModernStepCard
                    key={step.id}
                    step={step}
                    index={index}
                    allSteps={testSteps}
                    onStepUpdate={(updatedStep) => handleStepUpdate(index, updatedStep)}
                    onEdit={(step) => console.log('编辑步骤:', step)}
                    onToggle={(step) => {
                      const updatedStep = { ...step, enabled: !step.enabled };
                      handleStepUpdate(index, updatedStep);
                    }}
                    onDelete={(step) => {
                      setTestSteps(prev => prev.filter(s => s.id !== step.id));
                      message.info('步骤已删除');
                    }}
                  />
                ))}
              </Space>
            </Card>
          </Col>

          {/* 右侧：控制面板 */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 执行控制测试 */}
              <Card title="🎮 执行控制测试">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>完整执行控制按钮组:</Text>
                  <ExecutionControlButtons
                    executeText="执行测试脚本"
                    abortText="中止执行"
                    loading={isExecuting}
                    onExecute={handleExecuteScript}
                    onAbort={handleAbort}
                    confirmAbort={true}
                    size="middle"
                    direction="horizontal"
                  />
                  
                  <Text strong style={{ marginTop: '16px' }}>单独的中止按钮:</Text>
                  <AbortButton
                    text="中止"
                    size="middle"
                    confirmAbort={true}
                    onAbort={handleAbort}
                  />
                  
                  <Text strong style={{ marginTop: '16px' }}>传统按钮 + 中止按钮:</Text>
                  <Space>
                    <Button 
                      type="primary" 
                      loading={isExecuting}
                      onClick={handleExecuteScript}
                    >
                      {isExecuting ? '正在执行...' : '执行脚本'}
                    </Button>
                    <AbortButton
                      text="中止"
                      size="middle"
                      confirmAbort={true}
                      onAbort={handleAbort}
                    />
                  </Space>
                </Space>
              </Card>

              {/* 失败处理配置测试 */}
              <Card title="⚙️ 失败处理配置测试">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>独立的失败配置面板:</Text>
                  <StepFailureConfigPanel
                    step={testSteps[0]}
                    allSteps={testSteps}
                    onConfigChange={(config) => {
                      console.log('失败配置更新:', config);
                      message.success('失败处理配置已更新');
                    }}
                    mode="inline"
                    compact={false}
                    showTitle={true}
                    showStatusIndicator={true}
                  />
                </Space>
              </Card>

              {/* 状态显示 */}
              <Card title="📊 当前状态">
                <Space direction="vertical">
                  <Text>执行状态: {isExecuting ? '🟡 执行中' : '🟢 空闲'}</Text>
                  <Text>步骤数量: {testSteps.length}</Text>
                  <Text>启用步骤: {testSteps.filter(s => s.enabled).length}</Text>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default ExecutionControlTestPage;