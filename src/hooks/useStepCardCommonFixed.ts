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
 * 通用的步骤卡片操作处理
 * 统一按钮操作的处理逻辑
 */
export interface StepCardCallbacks {
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onTest?: () => Promise<{ success: boolean; message: string; details?: unknown }>;
}

export const useStepCardActions = (callbacks: StepCardCallbacks) => {
  const handleEdit = useCallback(() => {
    callbacks.onEdit();
  }, [callbacks]);

  const handleDelete = useCallback(() => {
    callbacks.onDelete();
  }, [callbacks]);

  const handleToggle = useCallback(() => {
    callbacks.onToggle();
  }, [callbacks]);

  const handleTest = useCallback(async () => {
    if (callbacks.onTest) {
      return await callbacks.onTest();
    }
    return { success: false, message: '测试功能未配置' };
  }, [callbacks]);

  return {
    handleEdit,
    handleDelete,
    handleToggle,
    handleTest
  };
};

/**
 * 通用的模态框状态管理
 */
export const useStepCardModals = () => {
  const [xmlInspectorOpen, setXmlInspectorOpen] = useState(false);
  const [loopConfigVisible, setLoopConfigVisible] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testResultOpen, setTestResultOpen] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    executionTime?: number;
    details?: unknown;
  } | null>(null);

  return {
    // XML 检查器
    xmlInspectorOpen,
    setXmlInspectorOpen,
    openXmlInspector: () => setXmlInspectorOpen(true),
    closeXmlInspector: () => setXmlInspectorOpen(false),
    
    // 循环配置
    loopConfigVisible,
    setLoopConfigVisible,
    openLoopConfig: () => setLoopConfigVisible(true),
    closeLoopConfig: () => setLoopConfigVisible(false),
    
    // 删除确认
    deleteConfirmOpen,
    openDeleteConfirm: () => setDeleteConfirmOpen(true),
    closeDeleteConfirm: () => setDeleteConfirmOpen(false),
    
    // 测试结果
    testResultOpen,
    testResult,
    openTestResult: (result: typeof testResult) => {
      setTestResult(result);
      setTestResultOpen(true);
    },
    closeTestResult: () => {
      setTestResultOpen(false);
      setTestResult(null);
    }
  };
};

/**
 * 循环配置管理
 */
export interface LoopConfig {
  isLoop: boolean;
  maxIterations: number;
  continueOnError?: boolean;
  breakCondition?: string;
}

export const useStepCardLoopConfig = (initialConfig: LoopConfig) => {
  const [loopCount, setLoopCount] = useState(initialConfig.maxIterations);
  const [isInfiniteLoop, setIsInfiniteLoop] = useState(initialConfig.isLoop);

  const resetLoopConfig = useCallback(() => {
    setLoopCount(initialConfig.maxIterations);
    setIsInfiniteLoop(initialConfig.isLoop);
  }, [initialConfig]);

  return {
    loopCount,
    setLoopCount,
    isInfiniteLoop,
    setIsInfiniteLoop,
    resetLoopConfig
  };
};