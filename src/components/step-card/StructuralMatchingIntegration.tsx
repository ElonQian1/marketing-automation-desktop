// src/components/step-card/StructuralMatchingIntegration.tsx
// module: step-card | layer: ui | role: 结构匹配集成组件
// summary: 将结构匹配功能集成到步骤卡片系统

import React from 'react';
import { Button, message } from 'antd';
import { StructuralMatchingModal } from '../../modules/structural-matching';
import { useStructuralMatchingIntegration } from './hooks/use-structural-matching-integration';

export interface StructuralMatchingIntegrationProps {
  /** 步骤ID */
  stepId: string;
  
  /** 选中的元素 */
  selectedElement: any;
  
  /** 初始配置（从步骤数据加载） */
  initialConfig?: any;
  
  /** 保存回调 */
  onSave?: (config: any) => void;
  
  /** 是否显示触发按钮 */
  showTriggerButton?: boolean;
  
  /** 触发按钮文本 */
  triggerButtonText?: string;
}

export const StructuralMatchingIntegration: React.FC<StructuralMatchingIntegrationProps> = ({
  stepId,
  selectedElement,
  initialConfig,
  onSave,
  showTriggerButton = true,
  triggerButtonText = '🏗️ 配置结构匹配',
}) => {
  const {
    modalVisible,
    savedConfig,
    hasConfig,
    openModal,
    closeModal,
    handleConfirm,
    clearConfig,
  } = useStructuralMatchingIntegration({
    stepId,
    selectedElement,
    initialConfig,
    onSave,
  });

  const handleOpenModal = () => {
    if (!selectedElement) {
      message.warning('请先选择一个元素');
      return;
    }
    openModal();
  };

  return (
    <>
      {showTriggerButton && (
        <Button
          type={hasConfig ? 'primary' : 'default'}
          onClick={handleOpenModal}
          size="small"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {triggerButtonText}
          {hasConfig && <span style={{ fontSize: '10px' }}>✅</span>}
        </Button>
      )}

      <StructuralMatchingModal
        visible={modalVisible}
        selectedElement={selectedElement}
        initialConfig={savedConfig}
        onClose={closeModal}
        onConfirm={handleConfirm}
      />
    </>
  );
};
