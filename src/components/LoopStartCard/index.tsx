// src/components/LoopStartCard/index.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环开始卡片 - 简化设计，支持拖拽

import React, { useState } from "react";
import { Card, Space, Typography, InputNumber, Button, Tooltip, message } from "antd";
import { RedoOutlined, SettingOutlined, DeleteOutlined, PlayCircleOutlined } from "@ant-design/icons";
import ConfirmPopover from '../universal-ui/common-popover/ConfirmPopover';
import type { LoopStartCardProps } from './types';
import type { LoopConfig } from "../../types/loopScript";
import "./styles.css";

const { Text } = Typography;

export const LoopStartCard: React.FC<LoopStartCardProps> = ({
  step,
  index,
  loopConfig,
  isDragging,
  onLoopConfigUpdate,
  onDeleteLoop,
  onToggle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempIterations, setTempIterations] = useState<number>(
    loopConfig?.iterations || (step.parameters?.loop_count as number) || 1
  );

  // 保存配置
  const handleSave = () => {
    try {
      const updatedConfig: LoopConfig = {
        loopId: loopConfig?.loopId || (step.parameters?.loop_id as string) || `loop_${Date.now()}`,
        name: loopConfig?.name || (step.parameters?.loop_name as string) || "新循环",
        iterations: tempIterations,
        enabled: loopConfig?.enabled ?? true,
      };
      onLoopConfigUpdate(updatedConfig);
      setIsEditing(false);
      message.success("循环次数已更新");
    } catch (error) {
      message.error("保存失败，请重试");
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setTempIterations(loopConfig?.iterations || (step.parameters?.loop_count as number) || 1);
    setIsEditing(false);
  };

  const currentIterations = loopConfig?.iterations || (step.parameters?.loop_count as number) || 1;
  const loopName = loopConfig?.name || (step.parameters?.loop_name as string) || step.name || "循环";

  return (
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
          <Tooltip title="编辑循环次数">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setIsEditing(!isEditing)}
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
        {isEditing ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space size="small">
              <Text type="secondary">循环次数:</Text>
              <InputNumber
                min={1}
                max={999}
                value={tempIterations}
                onChange={(val) => setTempIterations(val || 1)}
                size="small"
                style={{ width: 80 }}
              />
              <Button type="primary" size="small" onClick={handleSave}>
                保存
              </Button>
              <Button size="small" onClick={handleCancel}>
                取消
              </Button>
            </Space>
          </Space>
        ) : (
          <Space size="middle">
            <Space size="small">
              <PlayCircleOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary">执行次数:</Text>
              <Text strong style={{ fontSize: 16 }}>{currentIterations}</Text>
            </Space>
          </Space>
        )}
      </div>
      
      {/* 底部提示 */}
      <div className="loop-card-footer">
        <Text type="secondary" style={{ fontSize: 12 }}>
          👇 将步骤拖拽到此循环内
        </Text>
      </div>
    </Card>
  );
};

// 导出类型
export type { LoopStartCardProps } from './types';