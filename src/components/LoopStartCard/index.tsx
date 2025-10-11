// src/components/LoopStartCard/index.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环开始卡片主组件 - 模块化版本

import React, { useState } from "react";
import { Card, message } from "antd";
import { noDragProps } from '../universal-ui/dnd/noDrag';
import { LoopHeader } from './LoopHeader';
import { LoopConfigForm } from './LoopConfigForm';
import type { LoopStartCardProps } from './types';
import type { LoopConfig } from "../../types/loopScript";
import "../DraggableStepCard/styles/loopTheme.css";

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
  const [tempConfig, setTempConfig] = useState<LoopConfig>(
    loopConfig || {
      loopId: step.parameters?.loop_id || `loop_${Date.now()}`,
      name: step.parameters?.loop_name || "新循环",
      iterations: step.parameters?.iterations || 1,
      enabled: true,
    }
  );

  // 保存配置
  const handleSave = () => {
    try {
      onLoopConfigUpdate(tempConfig);
      setIsEditing(false);
      message.success("循环配置已保存");
    } catch (error) {
      message.error("保存失败，请重试");
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setTempConfig(
      loopConfig || {
        loopId: step.parameters?.loop_id || `loop_${Date.now()}`,
        name: step.parameters?.loop_name || "新循环",
        iterations: step.parameters?.iterations || 1,
        enabled: true,
      }
    );
    setIsEditing(false);
  };

  // 临时配置更新
  const handleTempConfigChange = (updates: Partial<LoopConfig>) => {
    setTempConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Card
      {...noDragProps}
      className="loop-start-card"
      style={{
        width: '100%',
        marginBottom: 16,
        border: '3px solid #3b82f6',
        borderRadius: 12,
        boxShadow: isDragging 
          ? '0 8px 32px rgba(59, 130, 246, 0.3)' 
          : '0 4px 16px rgba(59, 130, 246, 0.15)',
        position: 'relative',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        ...(isDragging ? { 
          transform: 'rotate(2deg)', 
          zIndex: 1000 
        } : {}),
      }}
      bordered={false}
      title={
        <LoopHeader
          tempConfig={tempConfig}
          isEditing={isEditing}
          onEditStart={() => setIsEditing(true)}
          onEditSave={handleSave}
          onEditCancel={handleCancel}
          onTempConfigChange={handleTempConfigChange}
          onDeleteLoop={onDeleteLoop}
        />
      }
    >
      {/* 装饰性元素 */}
      <div className="loop-top-accent"></div>
      <div className="loop-left-accent"></div>

      {/* 配置表单 */}
      <LoopConfigForm
        tempConfig={tempConfig}
        isEditing={isEditing}
        onTempConfigChange={handleTempConfigChange}
      />
    </Card>
  );
};

// 导出类型
export type { LoopStartCardProps } from './types';