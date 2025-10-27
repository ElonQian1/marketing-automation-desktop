// src/components/LoopEndCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环结束卡片 - 简化设计，支持拖拽

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Modal, InputNumber, Switch, Tooltip, message } from 'antd';
import { 
  CheckCircleOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import ConfirmPopover from './universal-ui/common-popover/ConfirmPopover';
import type { LoopConfig, ExtendedSmartScriptStep } from '../types/loopScript';
import './LoopStartCard/styles.css';

const { Text } = Typography;

export interface LoopEndCardProps {
  /** 循环步骤数据 */
  step: ExtendedSmartScriptStep;
  /** 步骤索引 */
  index: number;
  /** 对应的循环配置 */
  loopConfig?: LoopConfig;
  /** 是否正在拖拽 */
  isDragging?: boolean;
  /** 删除循环回调 */
  onDeleteLoop: (loopId: string) => void;
  /** 切换启用状态回调 */
  onToggle: (stepId: string) => void;
  /** 更新步骤参数回调 */
  onUpdateStepParameters?: (stepId: string, parameters: Record<string, any>) => void;
  /** 编辑步骤回调 */
  onEdit?: (step: ExtendedSmartScriptStep) => void;
  /** 删除步骤回调 */
  onDelete?: (stepId: string) => void;
}

export const LoopEndCard: React.FC<LoopEndCardProps> = ({
  step,
  index,
  loopConfig,
  isDragging,
  onDeleteLoop,
  onToggle,
  onUpdateStepParameters
}) => {
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  
  // 统一数据源：优先从 step.parameters 读取，确保与 LoopStartCard 同步
  const currentIterations = (step.parameters?.loop_count as number) || loopConfig?.iterations || 1;
  const [loopCount, setLoopCount] = useState<number>(currentIterations);
  const [isInfiniteLoop, setIsInfiniteLoop] = useState<boolean>(
    (step.parameters?.is_infinite_loop as boolean) || false
  );

  const handleDeleteLoop = () => {
    if (loopConfig) {
      onDeleteLoop(loopConfig.loopId);
      message.success(`已删除循环: ${loopConfig.name || '未命名循环'}`);
    }
  };

  const handleSaveConfig = () => {
    if (onUpdateStepParameters) {
      const newLoopCount = isInfiniteLoop ? -1 : loopCount;
      const parameters = {
        ...step.parameters,
        loop_count: newLoopCount,
        is_infinite_loop: isInfiniteLoop,
        loop_config: {
          ...loopConfig,
          iterations: newLoopCount
        }
      };
      onUpdateStepParameters(step.id, parameters);
      message.success(`循环配置已更新为 ${isInfiniteLoop ? '无限循环' : `${loopCount}次`}，已同步到关联步骤`);
    }
    setIsConfigVisible(false);
  };

  const handleCancelConfig = () => {
    setLoopCount(currentIterations);
    setIsInfiniteLoop((step.parameters?.is_infinite_loop as boolean) || false);
    setIsConfigVisible(false);
  };

  const loopName = loopConfig?.name || (step.parameters?.loop_name as string) || step.name || "新循环";
  const displayIterations = isInfiniteLoop ? '∞' : currentIterations;

  return (
    <>
      <Card
        className={`loop-card loop-end-card light-theme-force ${isDragging ? 'dragging' : ''}`}
        size="small"
        bordered={false}
      >
        {/* 左侧循环指示器 */}
        <div className="loop-indicator loop-end-indicator" />
        
        {/* 顶部标题栏 */}
        <div className="loop-card-header">
          <Space size="small">
            <CheckCircleOutlined className="loop-icon" />
            <Text strong className="loop-title">{loopName}</Text>
            <Text type="secondary" className="loop-badge">循环结束</Text>
          </Space>
          
          <Space size={4}>
            <Tooltip title="循环配置">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => setIsConfigVisible(true)}
                className="loop-action-btn"
              />
            </Tooltip>
            <Tooltip title="删除循环">
              <ConfirmPopover
                mode="default"
                title="确认删除循环"
                description="将删除循环开始和结束标记，循环内的步骤会保留"
                onConfirm={() => {
                  const loopId = loopConfig?.loopId || (step.parameters?.loop_id as string);
                  if (loopId) {
                    onDeleteLoop(loopId);
                  }
                }}
                okText="删除"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  className="loop-action-btn"
                />
              </ConfirmPopover>
            </Tooltip>
          </Space>
        </div>

        {/* 循环信息区域 */}
        <div className="loop-card-body">
          <Space size="middle">
            <Space size="small">
              <ReloadOutlined style={{ color: '#f59e0b' }} />
              <Text type="secondary">完成次数:</Text>
              <Text strong style={{ fontSize: 16, color: '#f59e0b' }}>{displayIterations}</Text>
            </Space>
          </Space>
        </div>
        
        {/* 底部提示 */}
        <div className="loop-card-footer">
          <Text type="secondary" style={{ fontSize: 12 }}>
            🔄 执行完成后返回循环开始
          </Text>
        </div>
      </Card>

      {/* 循环配置模态框 */}
      <Modal
        title="循环结束配置"
        open={isConfigVisible}
        onOk={handleSaveConfig}
        onCancel={handleCancelConfig}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px 0' }}>
          {/* 无限循环开关 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Space>
                <Text strong>无限循环模式</Text>
                <span style={{ fontSize: 16 }}>∞</span>
              </Space>
              <Switch
                checked={isInfiniteLoop}
                onChange={setIsInfiniteLoop}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
            {isInfiniteLoop && (
              <div style={{ padding: 12, background: '#fff7ed', borderRadius: 6, border: '1px solid #fed7aa' }}>
                <Text type="warning" style={{ fontSize: 12 }}>
                  ⚠️ 警告：无限循环将持续执行直到手动停止，请谨慎使用！
                </Text>
              </div>
            )}
          </div>

          {/* 循环次数设置 */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>循环执行次数</Text>
            <Space>
              <InputNumber
                min={1}
                max={999}
                value={loopCount}
                onChange={(val) => setLoopCount(val || 1)}
                disabled={isInfiniteLoop}
                style={{ width: 120 }}
                addonAfter="次"
              />
              <Text type="secondary">
                {isInfiniteLoop ? '已启用无限循环 ∞' : `执行 ${loopCount} 次后结束`}
              </Text>
            </Space>
          </div>
          
          <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 6, border: '1px solid #bae6fd' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 {isInfiniteLoop 
                ? '无限循环模式下，循环体内的步骤将不断重复执行。' 
                : '达到设定次数后，将跳出循环继续执行后续步骤。'
              }
            </Text>
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default LoopEndCard;
