// src/components/LoopCards/LoopSyncDemo.tsx
// module: ui | layer: ui | role: component
// summary: 循环卡片同步演示组件 - 展示如何正确设置循环次数

/**
 * 循环卡片同步演示组件
 * 展示如何使用 useLoopSync Hook 来统一管理循环配置
 */

import React, { useState } from 'react';
import { Card, InputNumber, Button, Space, Typography, message, Divider } from 'antd';
import { SyncOutlined, RedoOutlined } from '@ant-design/icons';
import useLoopSync from './useLoopSync';
import type { ExtendedSmartScriptStep } from '../../types/loopScript';

const { Title, Text } = Typography;

interface LoopSyncDemoProps {
  /** 循环开始步骤 */
  startStep: ExtendedSmartScriptStep;
  /** 循环结束步骤 */
  endStep?: ExtendedSmartScriptStep;
  /** 所有步骤（用于自动查找） */
  allSteps?: ExtendedSmartScriptStep[];
  /** 步骤参数更新回调 */
  onUpdateStepParameters?: (stepId: string, parameters: Record<string, unknown>) => void;
}

export const LoopSyncDemo: React.FC<LoopSyncDemoProps> = ({
  startStep,
  endStep,
  allSteps = [],
  onUpdateStepParameters,
}) => {
  const [tempIterations, setTempIterations] = useState<number>(1);

  // 使用同步Hook管理循环配置
  const {
    getLoopConfig,
    updateLoopConfig,
    getIterationsText,
    associatedStep,
    hasAssociatedStep,
  } = useLoopSync({
    currentStep: startStep,
    allSteps,
    onUpdateStepParameters,
  });

  const currentConfig = getLoopConfig();

  // 更新循环次数
  const handleUpdateIterations = () => {
    if (tempIterations < 1) {
      message.error('循环次数必须大于0');
      return;
    }

    updateLoopConfig({ iterations: tempIterations });
    message.success(`循环次数已更新为 ${tempIterations} 次，${hasAssociatedStep() ? '已同步到关联步骤' : '无关联步骤'}`);
  };

  return (
    <div className="light-theme-force" style={{ padding: 16, background: 'var(--bg-light-base, #ffffff)' }}>
      <Title level={4}>循环卡片同步管理演示</Title>
      
      {/* 当前循环配置 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>当前循环配置：</Text>
          <Text>循环ID: {currentConfig.loopId}</Text>
          <Text>循环名称: {currentConfig.name}</Text>
          <Text>当前次数: {getIterationsText()}</Text>
          <Text>启用状态: {currentConfig.enabled ? '已启用' : '已禁用'}</Text>
        </Space>
      </Card>

      {/* 关联步骤信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>关联步骤信息：</Text>
          {hasAssociatedStep() ? (
            <>
              <Text type="success">✓ 已找到关联步骤</Text>
              <Text>关联步骤ID: {associatedStep?.id}</Text>
              <Text>关联步骤类型: {associatedStep?.step_type}</Text>
              <Text>关联步骤名称: {associatedStep?.name}</Text>
            </>
          ) : (
            <Text type="warning">⚠ 未找到关联的循环步骤</Text>
          )}
        </Space>
      </Card>

      <Divider />

      {/* 循环次数设置 */}
      <Card size="small">
        <Space align="center">
          <Text strong>设置循环次数：</Text>
          <InputNumber
            min={1}
            max={1000}
            value={tempIterations}
            onChange={(value) => setTempIterations(value || 1)}
            placeholder="输入循环次数"
          />
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleUpdateIterations}
          >
            同步更新
          </Button>
          <Button
            icon={<RedoOutlined />}
            onClick={() => setTempIterations(currentConfig.iterations)}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* 使用说明 */}
      <Card size="small" style={{ marginTop: 16, background: '#f6f8fa' }}>
        <Text strong>使用说明：</Text>
        <div style={{ marginTop: 8 }}>
          <Text>1. 修改循环次数后点击"同步更新"</Text><br />
          <Text>2. 系统会自动同步到关联的循环开始/结束步骤</Text><br />
          <Text>3. 所有循环配置都统一存储在 step.parameters 中</Text><br />
          <Text>4. 支持自动查找关联步骤（基于 loop_id）</Text>
        </div>
      </Card>
    </div>
  );
};

export default LoopSyncDemo;