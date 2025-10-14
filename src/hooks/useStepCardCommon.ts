// src/hooks/useStepCardCommon.ts
// module: hooks | layer: hooks | role: shared-logic
// summary: 提取步骤卡片通用逻辑，消除 DraggableStepCard 和 UnifiedStepCard 之间的重复

import { useState, useCallback } from 'react';

/**
 * 通用的步骤卡片编辑状态管理
 * 直接适配现有组件的接口模式
 */
export const useStepCardEdit = (initialName: string, initialDescription: string) => {
  // 标题编辑状态
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialName);

  // 描述编辑状态  
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(initialDescription);

  // 标题编辑方法（适配 StepCardHeader 接口）
  const beginEditName = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setNameDraft(initialName);
    setEditingName(true);
  }, [initialName]);

  const saveName = useCallback(() => {
    setEditingName(false);
    return nameDraft.trim();
  }, [nameDraft]);

  const cancelName = useCallback(() => {
    setEditingName(false);
    setNameDraft(initialName);
  }, [initialName]);

  // 描述编辑方法
  const beginEditDescription = useCallback(() => {
    setDescriptionDraft(initialDescription);
    setEditingDescription(true);
  }, [initialDescription]);

  const saveDescription = useCallback(() => {
    setEditingDescription(false);
    return descriptionDraft.trim();
  }, [descriptionDraft]);

  const cancelDescription = useCallback(() => {
    setEditingDescription(false);
    setDescriptionDraft(initialDescription);
  }, [initialDescription]);

  return {
    // 名称编辑状态
    editingName,
    nameDraft,
    setNameDraft,
    beginEditName,
    saveName,
    cancelName,
    
    // 描述编辑状态
    editingDescription,
    descriptionDraft,
    setDescriptionDraft,
    beginEditDescription,
    saveDescription,
    cancelDescription
  };
};

/**
 * 通用的步骤卡片操作按钮逻辑
 * 统一处理编辑、删除、测试等操作
 */
export const useStepCardActions = (callbacks: {
  onEdit?: () => void;
  onDelete?: () => void;
  onTest?: () => void;
  onCopy?: () => void;
  onToggle?: () => void;
  onOpenPageAnalyzer?: () => void;
  onEditStepParams?: (step: unknown) => void;
}) => {
  const handleEdit = useCallback(() => {
    if (callbacks.onOpenPageAnalyzer) {
      callbacks.onOpenPageAnalyzer();
    } else if (callbacks.onEditStepParams) {
      // 传入具体的 step 参数需要在使用时处理
      // callbacks.onEditStepParams 将在具体使用时调用
    } else {
      callbacks.onEdit?.();
    }
  }, [callbacks]);

  const handleDelete = useCallback(() => {
    callbacks.onDelete?.();
  }, [callbacks.onDelete]);

  const handleTest = useCallback(() => {
    callbacks.onTest?.();
  }, [callbacks.onTest]);

  const handleCopy = useCallback(() => {
    callbacks.onCopy?.();
  }, [callbacks.onCopy]);

  const handleToggle = useCallback(() => {
    callbacks.onToggle?.();
  }, [callbacks.onToggle]);

  return {
    handleEdit,
    handleDelete,
    handleTest,
    handleCopy,
    handleToggle
  };
};

/**
 * 通用的模态框状态管理
 * 管理 XML 检查器、循环配置等模态框状态
 */
export const useStepCardModals = () => {
  const [xmlInspectorOpen, setXmlInspectorOpen] = useState(false);
  const [loopConfigVisible, setLoopConfigVisible] = useState(false);

  const openXmlInspector = useCallback(() => {
    setXmlInspectorOpen(true);
  }, []);

  const closeXmlInspector = useCallback(() => {
    setXmlInspectorOpen(false);
  }, []);

  const openLoopConfig = useCallback(() => {
    setLoopConfigVisible(true);
  }, []);

  const closeLoopConfig = useCallback(() => {
    setLoopConfigVisible(false);
  }, []);

  return {
    xmlInspectorOpen,
    setXmlInspectorOpen,
    openXmlInspector,
    closeXmlInspector,
    
    loopConfigVisible,
    setLoopConfigVisible,
    openLoopConfig,
    closeLoopConfig
  };
};

/**
 * 通用的循环配置状态管理
 * 管理循环次数、无限循环等状态
 */
export const useStepCardLoopConfig = (initialLoopCount = 3, initialIsInfinite = false) => {
  const [loopCount, setLoopCount] = useState(initialLoopCount);
  const [isInfiniteLoop, setIsInfiniteLoop] = useState(initialIsInfinite);

  const resetLoopConfig = useCallback(() => {
    setLoopCount(initialLoopCount);
    setIsInfiniteLoop(initialIsInfinite);
  }, [initialLoopCount, initialIsInfinite]);

  return {
    loopCount,
    setLoopCount,
    isInfiniteLoop,
    setIsInfiniteLoop,
    resetLoopConfig
  };
};