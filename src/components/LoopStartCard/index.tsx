// src/components/LoopStartCard/index.tsx
// module: ui | layer: ui | role: component
// summary: 循环开始卡片 - 支持与结束卡片数据同步

import React, { useState } from "react";
import { Card, Space, Typography, Button, Tooltip, message } from "antd";
import { RedoOutlined, SettingOutlined, DeleteOutlined, PlayCircleOutlined } from "@ant-design/icons";
import ConfirmPopover from '../universal-ui/common-popover/ConfirmPopover';
import { LoopConfigModal } from '../LoopCards/LoopConfigModal';
import type { LoopStartCardProps } from './types';
import type { LoopConfig } from "../../types/loopScript";
import "./styles.css";

const { Text } = Typography;

export const LoopStartCard: React.FC<LoopStartCardProps> = ({
  step,
  loopConfig,
  isDragging,
  onLoopConfigUpdate,
  onDeleteLoop,
}) => {
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  
  // 统一数据源：优先从 step.parameters 读取，确保与 LoopEndCard 同步
  const currentIterations = (step.parameters?.loop_count as number) || loopConfig?.iterations || 1;
  const isInfinite = currentIterations === -1;

  // 保存配置 - 使用共享的 LoopConfigModal
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

  return (
    <>
      <Card
        className={`loop-card loop-start-card light-theme-force ${isDragging ? 'dragging' : ''}`}
        size="small"
        bordered={false}
      >
        {/* 左侧循环指示器 */}
        <div className="loop-indicator loop-start-indicator" />
        
        {/* 顶部标题栏 */}
        <div className="loop-card-header">
          <Space size="small">
            <RedoOutlined className="loop-icon" />
            <Text strong className="loop-title">{loopName}</Text>
            <Text type="secondary" className="loop-badge">循环开始</Text>
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

        {/* 循环配置区域 */}
        <div className="loop-card-body">
          <Space size="middle">
            <Space size="small">
              <PlayCircleOutlined style={{ color: '#10b981' }} />
              <Text type="secondary">执行次数:</Text>
              <Text strong style={{ fontSize: 16, color: '#10b981' }}>
                {isInfinite ? '∞' : currentIterations}
              </Text>
            </Space>
          </Space>
        </div>
        
        {/* 底部提示 */}
        <div className="loop-card-footer">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isInfinite 
              ? '🔄 无限循环：将不断重复执行' 
              : '👇 将步骤拖拽到此循环内'
            }
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

// 导出类型
export type { LoopStartCardProps } from './types';