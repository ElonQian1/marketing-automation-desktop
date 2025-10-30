// src/components/step-card/hooks/use-structural-matching-integration.ts
// module: step-card | layer: hooks | role: 结构匹配集成
// summary: 集成结构匹配功能到步骤卡片

import { useState, useCallback } from 'react';
import { StructuralMatchingConfig } from '../../../modules/structural-matching';

export interface UseStructuralMatchingIntegrationProps {
  /** 步骤ID */
  stepId: string;
  
  /** 选中的元素 */
  selectedElement: any;
  
  /** 初始配置（如果已保存） */
  initialConfig?: StructuralMatchingConfig;
  
  /** 保存回调 */
  onSave?: (config: StructuralMatchingConfig) => void;
}

export function useStructuralMatchingIntegration({
  stepId,
  selectedElement,
  initialConfig,
  onSave,
}: UseStructuralMatchingIntegrationProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [savedConfig, setSavedConfig] = useState<StructuralMatchingConfig | undefined>(initialConfig);

  // 打开模态框
  const openModal = useCallback(() => {
    if (!selectedElement) {
      console.warn('⚠️ [StructuralMatching] 未选中元素，无法配置结构匹配');
      return;
    }
    console.log('🔧 [StructuralMatching] 打开配置模态框', { stepId, selectedElement });
    setModalVisible(true);
  }, [stepId, selectedElement]);

  // 关闭模态框
  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // 确认保存配置
  const handleConfirm = useCallback((config: StructuralMatchingConfig) => {
    console.log('✅ [StructuralMatching] 保存配置', { stepId, config });
    setSavedConfig(config);
    onSave?.(config);
    setModalVisible(false);
  }, [stepId, onSave]);

  // 清除配置
  const clearConfig = useCallback(() => {
    console.log('🗑️ [StructuralMatching] 清除配置', { stepId });
    setSavedConfig(undefined);
    onSave?.(undefined as any);
  }, [stepId, onSave]);

  return {
    modalVisible,
    savedConfig,
    hasConfig: !!savedConfig,
    openModal,
    closeModal,
    handleConfirm,
    clearConfig,
  };
}
