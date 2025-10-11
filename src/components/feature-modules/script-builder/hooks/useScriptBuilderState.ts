// src/components/feature-modules/script-builder/hooks/useScriptBuilderState.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 脚本构建器状态管理 Hook
 * 提供脚本创建、编辑、执行等状态管理功能
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Script,
  ScriptStep,
  ScriptBuilderState,
  ExecutionLog,
  ExecutionResult,
  StepValidation,
  StepTemplate,
  DragOperation,
} from '../types';

/**
 * 脚本构建器默认配置
 */
const DEFAULT_SCRIPT_CONFIG = {
  executionMode: 'sequential' as const,
  globalDelay: 1000,
  globalRetries: 3,
  globalTimeout: 30000,
  autoScreenshot: true,
  screenshotInterval: 5000,
  errorHandling: 'stop' as const,
  logLevel: 'info' as const,
};

/**
 * 创建新脚本的默认值
 */
const createDefaultScript = (): Script => ({
  id: Date.now().toString(),
  name: '新脚本',
  description: '',
  version: '1.0.0',
  author: '',
  targetPackage: '',
  steps: [],
  config: DEFAULT_SCRIPT_CONFIG,
  status: 'draft',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
});

/**
 * 创建新步骤的默认值
 */
const createDefaultStep = (type: ScriptStep['type'], order: number): ScriptStep => ({
  id: Date.now().toString(),
  type,
  name: `${type} 步骤`,
  description: '',
  parameters: {
    delay: 1000,
    retries: 3,
    timeout: 10000,
    screenshot: false,
  },
  status: 'pending',
  enabled: true,
  order,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

/**
 * 脚本构建器主要状态管理 Hook
 */
export const useScriptBuilderState = () => {
  // 基础状态
  const [state, setState] = useState<ScriptBuilderState>({
    currentScript: null,
    scripts: [],
    selectedStep: null,
    editingStep: null,
    showStepEditor: false,
    isExecuting: false,
    executionProgress: {
      current: 0,
      total: 0,
      percentage: 0,
    },
    executionLogs: [],
    error: null,
    showPreview: false,
  });

  // 执行控制引用
  const executionRef = useRef<{
    abortController?: AbortController;
    isRunning: boolean;
  }>({
    isRunning: false,
  });

  // 创建新脚本
  const createNewScript = useCallback((name?: string) => {
    const newScript = createDefaultScript();
    if (name) {
      newScript.name = name;
    }
    
    setState(prev => ({
      ...prev,
      currentScript: newScript,
      scripts: [...prev.scripts, newScript],
      selectedStep: null,
      editingStep: null,
      showStepEditor: false,
      error: null,
    }));
    
    return newScript;
  }, []);

  // 加载脚本
  const loadScript = useCallback((script: Script) => {
    setState(prev => ({
      ...prev,
      currentScript: script,
      selectedStep: null,
      editingStep: null,
      showStepEditor: false,
      error: null,
    }));
  }, []);

  // 保存当前脚本
  const saveCurrentScript = useCallback(() => {
    setState(prev => {
      if (!prev.currentScript) return prev;
      
      const updatedScript = {
        ...prev.currentScript,
        updatedAt: Date.now(),
      };
      
      const updatedScripts = prev.scripts.map(s => 
        s.id === updatedScript.id ? updatedScript : s
      );
      
      return {
        ...prev,
        currentScript: updatedScript,
        scripts: updatedScripts,
      };
    });
  }, []);

  // 更新脚本信息
  const updateScriptInfo = useCallback((updates: Partial<Script>) => {
    setState(prev => {
      if (!prev.currentScript) return prev;
      
      const updatedScript = {
        ...prev.currentScript,
        ...updates,
        updatedAt: Date.now(),
      };
      
      return {
        ...prev,
        currentScript: updatedScript,
      };
    });
  }, []);

  // 添加步骤
  const addStep = useCallback((type: ScriptStep['type'], insertIndex?: number) => {
    setState(prev => {
      if (!prev.currentScript) return prev;
      
      const steps = [...prev.currentScript.steps];
      const order = insertIndex !== undefined ? insertIndex : steps.length;
      const newStep = createDefaultStep(type, order);
      
      if (insertIndex !== undefined) {
        steps.splice(insertIndex, 0, newStep);
        // 重新排序后续步骤
        steps.slice(insertIndex + 1).forEach((step, idx) => {
          step.order = insertIndex + idx + 1;
        });
      } else {
        steps.push(newStep);
      }
      
      const updatedScript = {
        ...prev.currentScript,
        steps,
        updatedAt: Date.now(),
      };
      
      return {
        ...prev,
        currentScript: updatedScript,
        selectedStep: newStep,
      };
    });
  }, []);

  // 更新步骤
  const updateStep = useCallback((stepId: string, updates: Partial<ScriptStep>) => {
    setState(prev => {
      if (!prev.currentScript) return prev;
      
      const steps = prev.currentScript.steps.map(step =>
        step.id === stepId
          ? { ...step, ...updates, updatedAt: Date.now() }
          : step
      );
      
      const updatedScript = {
        ...prev.currentScript,
        steps,
        updatedAt: Date.now(),
      };
      
      return {
        ...prev,
        currentScript: updatedScript,
        selectedStep: prev.selectedStep?.id === stepId 
          ? { ...prev.selectedStep, ...updates, updatedAt: Date.now() }
          : prev.selectedStep,
        editingStep: prev.editingStep?.id === stepId
          ? { ...prev.editingStep, ...updates, updatedAt: Date.now() }
          : prev.editingStep,
      };
    });
  }, []);

  // 删除步骤
  const deleteStep = useCallback((stepId: string) => {
    setState(prev => {
      if (!prev.currentScript) return prev;
      
      const steps = prev.currentScript.steps.filter(step => step.id !== stepId);
      // 重新排序
      steps.forEach((step, index) => {
        step.order = index;
      });
      
      const updatedScript = {
        ...prev.currentScript,
        steps,
        updatedAt: Date.now(),
      };
      
      return {
        ...prev,
        currentScript: updatedScript,
        selectedStep: prev.selectedStep?.id === stepId ? null : prev.selectedStep,
        editingStep: prev.editingStep?.id === stepId ? null : prev.editingStep,
        showStepEditor: prev.editingStep?.id === stepId ? false : prev.showStepEditor,
      };
    });
  }, []);

  // 移动步骤
  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      if (!prev.currentScript) return prev;
      
      const steps = [...prev.currentScript.steps];
      const [movedStep] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, movedStep);
      
      // 重新排序
      steps.forEach((step, index) => {
        step.order = index;
      });
      
      const updatedScript = {
        ...prev.currentScript,
        steps,
        updatedAt: Date.now(),
      };
      
      return {
        ...prev,
        currentScript: updatedScript,
      };
    });
  }, []);

  // 选择步骤
  const selectStep = useCallback((step: ScriptStep | null) => {
    setState(prev => ({
      ...prev,
      selectedStep: step,
    }));
  }, []);

  // 开始编辑步骤
  const startEditingStep = useCallback((step: ScriptStep) => {
    setState(prev => ({
      ...prev,
      editingStep: { ...step },
      showStepEditor: true,
    }));
  }, []);

  // 取消编辑步骤
  const cancelEditingStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      editingStep: null,
      showStepEditor: false,
    }));
  }, []);

  // 保存编辑的步骤
  const saveEditingStep = useCallback(() => {
    setState(prev => {
      if (!prev.editingStep) return prev;
      
      updateStep(prev.editingStep.id, prev.editingStep);
      
      return {
        ...prev,
        editingStep: null,
        showStepEditor: false,
      };
    });
  }, [updateStep]);

  // 复制步骤
  const duplicateStep = useCallback((stepId: string) => {
    setState(prev => {
      if (!prev.currentScript) return prev;
      
      const originalStep = prev.currentScript.steps.find(s => s.id === stepId);
      if (!originalStep) return prev;
      
      const newStep: ScriptStep = {
        ...originalStep,
        id: Date.now().toString(),
        name: `${originalStep.name} (副本)`,
        order: originalStep.order + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const steps = [...prev.currentScript.steps];
      steps.splice(originalStep.order + 1, 0, newStep);
      
      // 重新排序后续步骤
      steps.slice(originalStep.order + 2).forEach((step, idx) => {
        step.order = originalStep.order + idx + 2;
      });
      
      const updatedScript = {
        ...prev.currentScript,
        steps,
        updatedAt: Date.now(),
      };
      
      return {
        ...prev,
        currentScript: updatedScript,
      };
    });
  }, []);

  // 添加执行日志
  const addExecutionLog = useCallback((log: Omit<ExecutionLog, 'id'>) => {
    const newLog: ExecutionLog = {
      ...log,
      id: Date.now().toString(),
    };
    
    setState(prev => ({
      ...prev,
      executionLogs: [...prev.executionLogs, newLog],
    }));
  }, []);

  // 清空执行日志
  const clearExecutionLogs = useCallback(() => {
    setState(prev => ({
      ...prev,
      executionLogs: [],
    }));
  }, []);

  // 设置错误
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  // 切换预览模式
  const togglePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      showPreview: !prev.showPreview,
    }));
  }, []);

  // 清理执行状态
  const cleanupExecution = useCallback(() => {
    setState(prev => ({
      ...prev,
      isExecuting: false,
      executionProgress: {
        current: 0,
        total: 0,
        percentage: 0,
      },
    }));
    
    executionRef.current.isRunning = false;
    if (executionRef.current.abortController) {
      executionRef.current.abortController.abort();
      executionRef.current.abortController = undefined;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupExecution();
    };
  }, [cleanupExecution]);

  return {
    // 状态
    ...state,
    
    // 脚本操作
    createNewScript,
    loadScript,
    saveCurrentScript,
    updateScriptInfo,
    
    // 步骤操作
    addStep,
    updateStep,
    deleteStep,
    moveStep,
    duplicateStep,
    
    // 选择和编辑
    selectStep,
    startEditingStep,
    cancelEditingStep,
    saveEditingStep,
    
    // 日志管理
    addExecutionLog,
    clearExecutionLogs,
    
    // 错误处理
    setError,
    
    // UI 控制
    togglePreview,
    
    // 执行控制
    cleanupExecution,
  };
};