// src/components/LoopEndCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环结束卡片 - 简化设计，支持拖拽

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Tooltip, message } from 'antd';
import { 
  CheckCircleOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import ConfirmPopover from './universal-ui/common-popover/ConfirmPopover';
import { LoopConfigModal } from './LoopCards/LoopConfigModal';
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
  /** 🎯 新增：更新循环配置回调（与开始卡片统一） */
  onLoopConfigUpdate: (config: LoopConfig) => void;
  /** 切换启用状态回调 */
  onToggle?: (stepId: string) => void;
  /** 更新步骤参数回调 */
  onUpdateStepParameters?: (stepId: string, parameters: Record<string, unknown>) => void;
  /** 编辑步骤回调 */
  onEdit?: (step: ExtendedSmartScriptStep) => void;
  /** 删除步骤回调 */
  onDelete?: (stepId: string) => void;
}

export const LoopEndCard: React.FC<LoopEndCardProps> = ({
  step,
  loopConfig,
  isDragging,
  onDeleteLoop,
  onLoopConfigUpdate,
}) => {
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  
  // 统一数据源：优先从 step.parameters 读取，确保与 LoopStartCard 同步
  const currentIterations = (step.parameters?.loop_count as number) || loopConfig?.iterations || 1;
  const isInfinite = currentIterations === -1;

  // 🎯 使用统一的保存逻辑
  const handleSaveConfig = (updatedConfig: LoopConfig) => {
    onLoopConfigUpdate(updatedConfig);
    setIsConfigVisible(false);
    message.success(
      updatedConfig.iterations === -1 
        ? '已设置为无限循环 ∞' 
        : `循环次数已更新为 ${updatedConfig.iterations} 次`
    );
  };

  const loopName = loopConfig?.name || (step.parameters?.loop_name as string) || step.name || "新循环";
  const displayIterations = isInfinite ? '∞' : currentIterations;

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

      {/* 🎯 共享的循环配置模态框 */}
      <LoopConfigModal
        open={isConfigVisible}
        loopConfig={loopConfig}
        onSave={handleSaveConfig}
        onCancel={() => setIsConfigVisible(false)}
      />
    </>
  );
};

export default LoopEndCard;
