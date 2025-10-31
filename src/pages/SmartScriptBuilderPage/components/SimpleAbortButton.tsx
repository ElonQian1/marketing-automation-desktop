// src/pages/SmartScriptBuilderPage/components/SimpleAbortButton.tsx
// module: ui | layer: ui | role: 简化中止按钮
// summary: 确保中止按钮在执行时能正常显示的简化版本

import React, { useState, useEffect } from 'react';
import { Button, Popconfirm, Tooltip } from 'antd';
import { StopOutlined, WarningOutlined } from '@ant-design/icons';
import { ExecutionAbortService } from '../../../modules/execution-control/services/execution-abort-service';

interface SimpleAbortButtonProps {
  /** 按钮文本 */
  text?: string;
  /** 按钮尺寸 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示确认对话框 */
  confirmAbort?: boolean;
  /** 中止成功回调 */
  onAbort?: () => void;
  /** 强制显示模式（调试用） */
  forceShow?: boolean;
}

export const SimpleAbortButton: React.FC<SimpleAbortButtonProps> = ({
  text = '中止',
  size = 'middle',
  confirmAbort = true,
  onAbort,
  forceShow = false
}) => {
  const [canAbort, setCanAbort] = useState(false);
  const [isAborting, setIsAborting] = useState(false);

  // 轮询检查执行状态
  useEffect(() => {
    const checkAbortStatus = () => {
      const service = ExecutionAbortService.getInstance();
      const hasActive = service.hasActiveExecution();
      const currentId = service.getCurrentExecutionId();
      
      console.log('🔍 [SimpleAbortButton] 状态检查:', {
        hasActiveExecution: hasActive,
        currentExecutionId: currentId,
        canAbort: hasActive || forceShow
      });
      
      setCanAbort(hasActive || forceShow);
    };

    // 立即检查
    checkAbortStatus();

    // 每秒检查一次
    const interval = setInterval(checkAbortStatus, 1000);

    return () => clearInterval(interval);
  }, [forceShow]);

  const handleAbort = async () => {
    if (isAborting) return;
    
    setIsAborting(true);
    try {
      console.log('🛑 [SimpleAbortButton] 开始中止执行');
      
      const service = ExecutionAbortService.getInstance();
      const result = await service.abortExecution({
        reason: '用户手动中止'
      });
      
      console.log('✅ [SimpleAbortButton] 中止完成:', result);
      
      if (onAbort) {
        onAbort();
      }
    } catch (error) {
      console.error('❌ [SimpleAbortButton] 中止失败:', error);
    } finally {
      setIsAborting(false);
    }
  };

  // 如果不能中止且不强制显示，则不渲染
  if (!canAbort && !forceShow) {
    console.log('🔍 [SimpleAbortButton] 不显示按钮: canAbort =', canAbort, 'forceShow =', forceShow);
    return null;
  }

  console.log('🔍 [SimpleAbortButton] 显示按钮: canAbort =', canAbort, 'forceShow =', forceShow);

  const button = (
    <Tooltip title="中止当前脚本执行">
      <Button 
        danger 
        icon={<StopOutlined />} 
        onClick={confirmAbort ? undefined : handleAbort}
        loading={isAborting}
        size={size}
      >
        {isAborting ? '中止中...' : text}
      </Button>
    </Tooltip>
  );

  if (confirmAbort) {
    return (
      <Popconfirm
        title="中止执行确认"
        description="确定要中止当前执行吗？"
        onConfirm={handleAbort}
        okText="确定中止"
        cancelText="取消"
        icon={<WarningOutlined style={{ color: 'red' }} />}
      >
        {button}
      </Popconfirm>
    );
  }

  return button;
};