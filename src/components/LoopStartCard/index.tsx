// src/components/LoopStartCard/index.tsx
// module: ui | layer: ui | role: component
// summary: 循环开始卡片 - 支持与结束卡片数据同步

import React, { useState } from "react";
import { Card, Space, Typography, Button, Tooltip, message, InputNumber, Switch } from "antd";
import { RedoOutlined, SettingOutlined, DeleteOutlined, PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import ConfirmPopover from '../universal-ui/common-popover/ConfirmPopover';
import { LoopConfigModal } from '../LoopCards/LoopConfigModal';
import { useLoopTestExecution } from '../../modules/loop-control/application/use-loop-test-execution';
import { CompactLoopTestButton } from '../../modules/loop-control/ui/loop-test-button';
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
  allSteps,
  deviceId,
}) => {
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  const [isEditingIterations, setIsEditingIterations] = useState(false);
  const [tempIterations, setTempIterations] = useState<number>(1);
  
  // 统一数据源：优先从 step.parameters 读取，确保与 LoopEndCard 同步
  const currentIterations = (step.parameters?.loop_count as number) || loopConfig?.iterations || 1;
  const isInfinite = currentIterations === -1;
  const currentLoopId = loopConfig?.loopId || (step.parameters?.loop_id as string) || `loop_${step.id}`;

  // 🐛 调试日志
  console.log('🔍 LoopStartCard 渲染:', {
    currentLoopId,
    hasAllSteps: !!allSteps,
    stepsLength: allSteps?.length || 0,
    hasDeviceId: !!deviceId,
    deviceId,
    testState: testState.status,
  });

  // 🎯 循环测试执行 Hook
  const {
    state: testState,
    canStart: canStartTest,
    canStop: canStopTest,
    startTest,
    stopTest,
    getDuration,
  } = useLoopTestExecution({
    steps: allSteps || [],
    deviceId: deviceId || '',
    onComplete: (success) => {
      if (success) {
        const duration = getDuration();
        message.success(`✅ 循环测试完成 (${(duration / 1000).toFixed(1)}秒)`);
      }
    },
    onError: (error) => {
      message.error(`❌ 循环测试失败: ${error}`);
    },
    onProgress: (progress) => {
      console.log(`循环测试进度: ${progress}%`);
    },
  });

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

  // 🎯 内联编辑：双击次数开始编辑
  const handleDoubleClickIterations = () => {
    if (!isInfinite) {
      setTempIterations(currentIterations);
      setIsEditingIterations(true);
    }
  };

  // 🎯 内联编辑：保存循环次数
  const handleSaveIterations = (value: number | null) => {
    if (value && value > 0 && value !== currentIterations) {
      const updatedConfig: LoopConfig = {
        loopId: loopConfig?.loopId || (step.parameters?.loop_id as string) || `loop_${step.id}`,
        name: loopConfig?.name || (step.parameters?.loop_name as string) || step.name || "新循环",
        iterations: value,
        isInfinite: false,
        enabled: loopConfig?.enabled ?? true,
      };
      onLoopConfigUpdate(updatedConfig);
      message.success(`循环次数已更新为 ${value} 次`);
    }
    setIsEditingIterations(false);
  };

  // 🎯 切换无限循环
  const handleToggleInfinite = (checked: boolean) => {
    const updatedConfig: LoopConfig = {
      loopId: loopConfig?.loopId || (step.parameters?.loop_id as string) || `loop_${step.id}`,
      name: loopConfig?.name || (step.parameters?.loop_name as string) || step.name || "新循环",
      iterations: checked ? -1 : 1,
      isInfinite: checked,
      enabled: loopConfig?.enabled ?? true,
    };
    onLoopConfigUpdate(updatedConfig);
    message.success(checked ? '已设置为无限循环 ∞' : '已关闭无限循环');
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
            {/* 🎯 循环测试按钮 - 放在设置按钮左边（始终显示，条件不满足时禁用） */}
            <CompactLoopTestButton
              loopId={currentLoopId}
              state={testState}
              canStart={canStartTest && !!allSteps && allSteps.length > 0 && !!deviceId}
              canStop={canStopTest}
              onStart={startTest}
              onStop={stopTest}
              size="small"
            />
            
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

        {/* 循环配置区域 - 支持内联编辑 */}
        <div className="loop-card-body">
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            {/* 左侧：循环次数（支持双击编辑） */}
            <Space size="small">
              <PlayCircleOutlined style={{ color: '#10b981' }} />
              <Text type="secondary">执行次数:</Text>
              
              {isEditingIterations && !isInfinite ? (
                <InputNumber
                  size="small"
                  min={1}
                  max={999}
                  value={tempIterations}
                  onChange={(value) => setTempIterations(value || 1)}
                  onBlur={() => handleSaveIterations(tempIterations)}
                  onPressEnter={() => handleSaveIterations(tempIterations)}
                  autoFocus
                  style={{ width: 70 }}
                />
              ) : (
                <Tooltip title={isInfinite ? "无限循环" : "双击修改次数"}>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: 16, 
                      color: '#10b981',
                      cursor: isInfinite ? 'default' : 'pointer',
                      userSelect: 'none'
                    }}
                    onDoubleClick={handleDoubleClickIterations}
                  >
                    {isInfinite ? '∞' : currentIterations}
                  </Text>
                </Tooltip>
              )}
            </Space>

            {/* 右侧：无限循环开关 */}
            <Space size="small">
              <Tooltip title="无限循环">
                <ReloadOutlined style={{ color: isInfinite ? '#f59e0b' : '#94a3b8' }} />
              </Tooltip>
              <Switch
                size="small"
                checked={isInfinite}
                onChange={handleToggleInfinite}
                checkedChildren="∞"
                unCheckedChildren="数"
              />
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