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
      loopId: (step.parameters?.loop_id as string) || `loop_${Date.now()}`,
      name: (step.parameters?.loop_name as string) || "新循环",
      iterations: (step.parameters?.iterations as number) || 1,
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
        loopId: (step.parameters?.loop_id as string) || `loop_${Date.now()}`,
        name: (step.parameters?.loop_name as string) || "新循环",
        iterations: (step.parameters?.iterations as number) || 1,
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
      className="loop-start-card light-theme-force"
      size="small"
      style={{
        width: '100%',
        marginBottom: 8, // 🎯 与普通卡片一致的间距
        border: '2px solid #0ea5e9', // 🎯 更细的边框，与普通卡片保持一致的视觉权重
        borderRadius: 8, // 🎯 与普通卡片一致的圆角
        boxShadow: isDragging 
          ? '0 4px 16px rgba(14, 165, 233, 0.25)' 
          : '0 2px 8px rgba(14, 165, 233, 0.15)', // 🎯 更轻的阴影
        position: 'relative',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)', // 🎯 更浅的背景
        minHeight: 'auto', // 🎯 允许自然高度，不强制最小高度
        ...(isDragging ? { 
          transform: 'rotate(1deg)', // 🎯 更小的旋转角度
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
      {/* 🎯 移除装饰性元素，减少视觉复杂度 */}
      
      {/* 配置表单 - 简化显示 */}
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