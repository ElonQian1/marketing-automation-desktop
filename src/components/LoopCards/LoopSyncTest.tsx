// src/components/LoopCards/LoopSyncTest.tsx
// module: ui | layer: ui | role: test
// summary: 循环卡片同步功能测试组件

/**
 * 循环卡片同步功能测试组件
 * 用于验证 useLoopSync Hook 的同步功能是否正常工作
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, message, Alert } from 'antd';
import { CheckCircleOutlined, SyncOutlined, BugOutlined } from '@ant-design/icons';
import useLoopSync from './useLoopSync';
import type { ExtendedSmartScriptStep } from '../../types/loopScript';

const { Title, Text } = Typography;

type TestStep = ExtendedSmartScriptStep

export const LoopSyncTest: React.FC = () => {
  // 模拟循环开始步骤
  const [startStep, setStartStep] = useState<TestStep>({
    id: 'loop_start_1',
    name: '循环开始',
    step_type: 'loop_start',
    enabled: true,
    parameters: {
      loop_id: 'test_loop_001',
      loop_name: '测试循环',
      loop_count: 3,
      loop_description: '这是一个测试循环',
    },
  });

  // 模拟循环结束步骤
  const [endStep, setEndStep] = useState<TestStep>({
    id: 'loop_end_1',
    name: '循环结束',
    step_type: 'loop_end',
    enabled: true,
    parameters: {
      loop_id: 'test_loop_001',
      loop_name: '测试循环',
      loop_count: 3,
      loop_description: '这是一个测试循环',
    },
  });

  const allSteps = [startStep, endStep];

  // 模拟步骤参数更新函数
  const handleUpdateStepParameters = (stepId: string, parameters: Record<string, unknown>) => {
    if (stepId === startStep.id) {
      setStartStep(prev => ({
        ...prev,
        parameters: { ...prev.parameters, ...parameters },
      }));
    } else if (stepId === endStep.id) {
      setEndStep(prev => ({
        ...prev,
        parameters: { ...prev.parameters, ...parameters },
      }));
    }
  };

  // 使用同步Hook（开始步骤视角）
  const startSync = useLoopSync({
    currentStep: startStep,
    allSteps,
    onUpdateStepParameters: handleUpdateStepParameters,
  });

  // 使用同步Hook（结束步骤视角）
  const endSync = useLoopSync({
    currentStep: endStep,
    allSteps,
    onUpdateStepParameters: handleUpdateStepParameters,
  });

  // 测试从开始步骤更新
  const testUpdateFromStart = () => {
    const newIterations = Math.floor(Math.random() * 10) + 1;
    startSync.updateLoopConfig({ iterations: newIterations });
    message.success(`从开始步骤更新循环次数为 ${newIterations}`);
  };

  // 测试从结束步骤更新
  const testUpdateFromEnd = () => {
    const newIterations = Math.floor(Math.random() * 10) + 1;
    endSync.updateLoopConfig({ iterations: newIterations });
    message.success(`从结束步骤更新循环次数为 ${newIterations}`);
  };

  // 检查同步状态
  const checkSyncStatus = () => {
    const startConfig = startSync.getLoopConfig();
    const endConfig = endSync.getLoopConfig();
    
    const isSynced = 
      startConfig.iterations === endConfig.iterations &&
      startStep.parameters?.loop_count === endStep.parameters?.loop_count;

    if (isSynced) {
      message.success('✓ 循环卡片数据完全同步');
    } else {
      message.error('✗ 发现同步问题');
    }
  };

  // 获取步骤的循环次数
  const getStepLoopCount = (step: TestStep) => {
    return step.parameters?.loop_count as number || 0;
  };

  return (
    <div className="light-theme-force" style={{ padding: 24, background: 'var(--bg-light-base, #ffffff)' }}>
      <Title level={3}>循环卡片同步功能测试</Title>
      
      <Alert
        message="测试说明"
        description="此组件用于测试循环开始和结束卡片的数据同步功能。点击更新按钮后，两个卡片的数据应该保持一致。"
        type="info"
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 开始步骤状态 */}
        <Card title="循环开始步骤" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>步骤ID: {startStep.id}</Text>
            <Text>循环ID: {startStep.parameters?.loop_id as string}</Text>
            <Text strong>循环次数 (parameters): {getStepLoopCount(startStep)}</Text>
            <Text>循环次数 (Hook): {startSync.getLoopConfig().iterations}</Text>
            <Text>关联步骤: {startSync.hasAssociatedStep() ? '✓ 已找到' : '✗ 未找到'}</Text>
            
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={testUpdateFromStart}
            >
              从开始步骤更新循环次数
            </Button>
          </Space>
        </Card>

        {/* 结束步骤状态 */}
        <Card title="循环结束步骤" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>步骤ID: {endStep.id}</Text>
            <Text>循环ID: {endStep.parameters?.loop_id as string}</Text>
            <Text strong>循环次数 (parameters): {getStepLoopCount(endStep)}</Text>
            <Text>循环次数 (Hook): {endSync.getLoopConfig().iterations}</Text>
            <Text>关联步骤: {endSync.hasAssociatedStep() ? '✓ 已找到' : '✗ 未找到'}</Text>
            
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={testUpdateFromEnd}
            >
              从结束步骤更新循环次数
            </Button>
          </Space>
        </Card>

        {/* 同步状态检查 */}
        <Card title="同步状态检查" size="small">
          <Space>
            <Button 
              icon={<CheckCircleOutlined />}
              onClick={checkSyncStatus}
            >
              检查同步状态
            </Button>
            
            {/* 同步状态指示器 */}
            {getStepLoopCount(startStep) === getStepLoopCount(endStep) ? (
              <Text type="success">
                <CheckCircleOutlined /> 数据已同步 ({getStepLoopCount(startStep)} 次)
              </Text>
            ) : (
              <Text type="danger">
                <BugOutlined /> 数据不同步 (开始: {getStepLoopCount(startStep)}, 结束: {getStepLoopCount(endStep)})
              </Text>
            )}
          </Space>
        </Card>

        {/* 测试结果分析 */}
        <Card title="测试要点" size="small" style={{ background: '#f6f8fa' }}>
          <Space direction="vertical">
            <Text strong>预期行为:</Text>
            <Text>1. 两个步骤的 loop_count 应始终相等</Text>
            <Text>2. 从任一步骤更新后，另一步骤应自动同步</Text>
            <Text>3. Hook 返回的配置应与 parameters 一致</Text>
            <Text>4. 关联步骤检测应返回 "已找到"</Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default LoopSyncTest;