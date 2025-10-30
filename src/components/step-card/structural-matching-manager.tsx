// src/components/step-card/structural-matching-manager.tsx
// module: step-card | layer: ui | role: 结构匹配全局管理器
// summary: 提供全局的结构匹配配置入口

import React, { createContext, useContext, useState, useCallback } from 'react';
import { StructuralMatchingModal } from '../../modules/structural-matching';
import type { StructuralMatchingConfig } from '../../modules/structural-matching';
import { message } from 'antd';

interface StructuralMatchingContextValue {
  /** 打开结构匹配配置模态框 */
  openStructuralMatching: (params: {
    stepId: string;
    selectedElement: any;
    initialConfig?: StructuralMatchingConfig;
    onSave: (config: StructuralMatchingConfig) => void;
  }) => void;
}

const StructuralMatchingContext = createContext<StructuralMatchingContextValue | null>(null);

export const useStructuralMatching = () => {
  const context = useContext(StructuralMatchingContext);
  if (!context) {
    throw new Error('useStructuralMatching must be used within StructuralMatchingProvider');
  }
  return context;
};

export const StructuralMatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    visible: boolean;
    stepId?: string;
    selectedElement?: any;
    initialConfig?: StructuralMatchingConfig;
    onSave?: (config: StructuralMatchingConfig) => void;
  }>({
    visible: false,
  });

  const openStructuralMatching = useCallback((params: {
    stepId: string;
    selectedElement: any;
    initialConfig?: StructuralMatchingConfig;
    onSave: (config: StructuralMatchingConfig) => void;
  }) => {
    if (!params.selectedElement) {
      message.warning('请先选择一个元素');
      return;
    }

    console.log('🏗️ [StructuralMatching] 打开配置模态框', params);
    setModalState({
      visible: true,
      ...params,
    });
  }, []);

  const handleClose = useCallback(() => {
    setModalState(prev => ({ ...prev, visible: false }));
  }, []);

  const handleConfirm = useCallback((config: StructuralMatchingConfig) => {
    console.log('✅ [StructuralMatching] 保存配置', config);
    modalState.onSave?.(config);
    setModalState(prev => ({ ...prev, visible: false }));
  }, [modalState.onSave]);

  return (
    <StructuralMatchingContext.Provider value={{ openStructuralMatching }}>
      {children}
      {modalState.visible && modalState.selectedElement && (
        <StructuralMatchingModal
          visible={modalState.visible}
          selectedElement={modalState.selectedElement}
          initialConfig={modalState.initialConfig}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      )}
    </StructuralMatchingContext.Provider>
  );
};
