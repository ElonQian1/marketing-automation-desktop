// src/pages/SmartScriptBuilderPage/hooks/useSmartScriptBuilder.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Form } from "antd";
import { useAdb } from "../../../application/hooks/useAdb";
import { DeviceStatus } from "../../../domain/adb/entities/Device";
import { createHandleExecuteScript, buildDistributedSteps } from "../helpers";
import { DistributedStepLookupService } from "../../../application/services/DistributedStepLookupService";
import { usePageFinder } from "./usePageFinder";
import { useScriptPersistence } from "./useScriptPersistence";
import { useWorkflowIntegrations } from "./useWorkflowIntegrations";
import { useStepForm } from "./useStepForm";
import { useStepCardReanalysis } from "../../../hooks/useStepCardReanalysis";
import type { ExtendedSmartScriptStep as LoopScriptStep, LoopConfig } from "../../../types/loopScript";
import type { ExecutorConfig, SmartExecutionResult } from "../../../types/execution";

const DEFAULT_EXECUTOR_CONFIG: ExecutorConfig = {
  default_timeout_ms: 10000,
  default_retry_count: 3,
  page_recognition_enabled: true,
  auto_verification_enabled: true,
  smart_recovery_enabled: true,
  detailed_logging: true,
};

export function useSmartScriptBuilder() {
  const { devices, refreshDevices } = useAdb();
  const [form] = Form.useForm();

  // 添加测试数据来验证 UnifiedStepCard 渲染
  const [steps, setSteps] = useState<LoopScriptStep[]>([
    {
      id: 'test-step-1',
      name: '测试智能分析步骤',
      step_type: 'smart_find_element',
      description: '这是一个测试步骤，用于验证智能分析状态显示',
      parameters: {
        element_selector: '//*[@resource-id="test-element"]',
        text: '测试按钮',
        bounds: '[100,200][300,400]',
        matching: {
          strategy: 'standard',
          fields: ['resource-id', 'text'],
          values: { 'resource-id': 'test-element', text: '测试按钮' }
        }
      },
      enabled: true,
      order: 1,
      find_condition: null,
      verification: null,
      retry_config: null,
      fallback_actions: [],
      pre_conditions: [],
      post_conditions: [],
      enableStrategySelector: true,
      strategySelector: {
        selectedStrategy: 'smart-auto',
        selectedStep: 'step3',
        analysis: {
          status: 'ready',
          progress: 0,
          result: null,
          error: null
        }
      }
    },
    {
      id: 'test-step-2',
      name: '测试点击步骤',
      step_type: 'tap',
      description: '另一个测试步骤，展示不同的分析状态',
      parameters: {
        bounds: '[200,300][400,500]',
        text: '确认按钮'
      },
      enabled: true,
      order: 2,
      find_condition: null,
      verification: null,
      retry_config: null,
      fallback_actions: [],
      pre_conditions: [],
      post_conditions: [],
      enableStrategySelector: true,
      strategySelector: {
        selectedStrategy: 'smart-single',
        selectedStep: 'step2',
        analysis: {
          status: 'ready',
          progress: 0,
          result: null,
          error: null
        }
      }
    }
  ]);
  
  // 🔄 步骤卡片重新分析功能
  const { reanalyzeStepCard, isAnalyzing } = useStepCardReanalysis({
    steps,
    setSteps
  });
  
  // 🔄 重新分析处理程序
  const handleReanalyze = useCallback(async (stepId: string) => {
    try {
      console.log('🔄 [重新分析] 触发步骤重新分析:', stepId);
      await reanalyzeStepCard(stepId);
    } catch (error) {
      console.error('重新分析失败:', error);
    }
  }, [reanalyzeStepCard]);
  const [loopConfigs, setLoopConfigs] = useState<LoopConfig[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");

  const [executionResult, setExecutionResult] = useState<SmartExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executorConfig, setExecutorConfig] = useState<ExecutorConfig>(DEFAULT_EXECUTOR_CONFIG);

  const [showAppComponent, setShowAppComponent] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showContactWorkflowSelector, setShowContactWorkflowSelector] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [isScriptValid, setIsScriptValid] = useState(true);

  // 皮肤选择：循环体与非循环步骤
  const [loopTheme, setLoopTheme] = useState<string | null>(null);
  const [nonLoopTheme, setNonLoopTheme] = useState<string | null>(null);

  const handleSaveStepRef = useRef<() => Promise<void>>(async () => {});
  const showAddModalRef = useRef<(options?: { resetFields?: boolean }) => void>(() => {});
  const setEditingStepRef = useRef<Dispatch<SetStateAction<LoopScriptStep | null>>>(() => {});

  const pageFinder = usePageFinder({
    steps,
    setSteps,
    form,
    currentDeviceId,
    devices,
    showAddModal: (options) => showAddModalRef.current(options),
    setEditingStep: (action) => setEditingStepRef.current(action),
    handleSaveStep: () => handleSaveStepRef.current(),
  });

  const {
    isModalVisible,
    showAddModal,
    showEditModal,
    hideModal,
    editingStep,
    setEditingStep,
    handleSaveStep,
  } = useStepForm({
    form,
    steps,
    setSteps,
    devices,
    currentDeviceId,
    currentXmlContent: pageFinder.currentXmlContent,
    currentDeviceInfo: pageFinder.currentDeviceInfo,
    currentPageInfo: pageFinder.currentPageInfo,
    setShowContactWorkflowSelector,
    setSnapshotFixMode: pageFinder.setSnapshotFixMode,
    setPendingAutoResave: pageFinder.setPendingAutoResave,
    setIsQuickAnalyzer: pageFinder.setIsQuickAnalyzer,
    setEditingStepForParams: pageFinder.setEditingStepForParams,
    setShowPageAnalyzer: pageFinder.setShowPageAnalyzer,
    allowSaveWithoutXmlOnce: pageFinder.allowSaveWithoutXmlOnce,
    setAllowSaveWithoutXmlOnce: pageFinder.setAllowSaveWithoutXmlOnce,
  });

  useEffect(() => {
    handleSaveStepRef.current = handleSaveStep;
    showAddModalRef.current = showAddModal;
    setEditingStepRef.current = setEditingStep;
  }, [handleSaveStep, showAddModal, setEditingStep]);

  const handleExecuteScript = useMemo(
    () =>
      createHandleExecuteScript({
        getSteps: () => steps,
        getDevices: () => devices,
        getCurrentDeviceId: () => currentDeviceId,
        getExecutorConfig: () => executorConfig,
        setExecutionResult,
        setIsExecuting,
      }),
    [steps, devices, currentDeviceId, executorConfig]
  );

  const {
    handleSaveScript,
    handleExportScript,
    handleLoadScript,
    handleLoadScriptFromFile,
  } = useScriptPersistence({
    steps,
    setSteps,
    executorConfig,
    setExecutorConfig,
  });

  const workflowIntegrations = useWorkflowIntegrations({
    form,
    steps,
    setSteps,
    setShowAppComponent,
    setShowNavigationModal,
    setShowContactWorkflowSelector,
    setExecutorConfig,
    setIsScriptValid,
  });

  const handleDeviceChange = useCallback((deviceId: string) => {
    setCurrentDeviceId(deviceId);
  }, []);

  const handleModalCancel = useCallback(() => {
    hideModal();
    form.resetFields();
  }, [form, hideModal]);

  useEffect(() => {
    if (!currentDeviceId && devices.length > 0) {
      const firstOnline = devices.find((device) => device.status === DeviceStatus.ONLINE);
      if (firstOnline) {
        setCurrentDeviceId(firstOnline.id);
      }
    }
  }, [devices, currentDeviceId]);

  useEffect(() => {
    DistributedStepLookupService.setGlobalScriptSteps(buildDistributedSteps(steps));
  }, [steps]);

  // === 主题应用：批量写入步骤参数 ===
  const applyLoopTheme = useCallback((theme: string | null) => {
    setLoopTheme(theme);
    setSteps(prev => prev.map(s => {
      const isAnchor = s.step_type === 'loop_start' || s.step_type === 'loop_end';
      const isInLoop = !!(s.parent_loop_id || (s as unknown as { parentLoopId?: string }).parentLoopId);
      if (isAnchor || isInLoop) {
        const nextParams = { ...(s.parameters || {}) } as Record<string, unknown> & { loopTheme?: string };
        if (theme && theme.trim()) {
          nextParams.loopTheme = theme.trim();
        } else {
          delete nextParams.loopTheme;
        }
        return { ...s, parameters: nextParams };
      }
      return s;
    }));
  }, []);

  const applyNonLoopTheme = useCallback((theme: string | null) => {
    setNonLoopTheme(theme);
    setSteps(prev => prev.map(s => {
      const isAnchor = s.step_type === 'loop_start' || s.step_type === 'loop_end';
      const isInLoop = !!(s.parent_loop_id || (s as unknown as { parentLoopId?: string }).parentLoopId);
      if (!isAnchor && !isInLoop) {
        const nextParams = { ...(s.parameters || {}) } as Record<string, unknown> & { cardTheme?: string };
        if (theme && theme.trim()) {
          nextParams.cardTheme = theme.trim();
        } else {
          delete nextParams.cardTheme;
        }
        return { ...s, parameters: nextParams };
      }
      return s;
    }));
  }, []);

  return {
    headerProps: {
      devices,
      currentDeviceId: currentDeviceId || null,
      onDeviceChange: handleDeviceChange,
      onRefreshDevices: refreshDevices,
      onQuickAddApp: () => setShowAppComponent(true),
    },
    stepListProps: {
      steps,
      setSteps,
      loopConfigs,
      setLoopConfigs,
      currentDeviceId,
      devices,
      handleEditStep: showEditModal,
      openQuickPageFinder: pageFinder.openQuickPageFinder,
      handleEditStepParams: pageFinder.openPageFinderForStep,
      handleAddStep: showAddModal,
      // 🔄 智能分析功能
      handleReanalyze,
      isAnalyzing,
    },
    scriptControlPanelProps: {
      steps,
      executorConfig,
      setExecutorConfig,
      executionResult,
      isExecuting,
      currentDeviceId,
      onExecuteScript: handleExecuteScript,
      onLoadScript: handleLoadScript,
      onUpdateSteps: setSteps,
      onUpdateConfig: setExecutorConfig,
    },
    controlPanelProps: {
      steps,
      isExecuting,
      isScriptValid,
      onExecuteScript: handleExecuteScript,
      onSaveScript: handleSaveScript,
      onLoadScript: handleLoadScriptFromFile,
      onExportScript: handleExportScript,
      onShowQualityPanel: () => setShowQualityPanel(true),
      onTestElementMapping: workflowIntegrations.handleTestElementMapping,
      onTestSmartStepGenerator: workflowIntegrations.handleTestSmartStepGenerator,
      // 皮肤设置
      loopTheme,
      nonLoopTheme,
      onApplyLoopTheme: applyLoopTheme,
      onApplyNonLoopTheme: applyNonLoopTheme,
    },
    stepEditModalProps: {
  open: isModalVisible,
  editingStep,
      form,
      currentDeviceId,
  onOk: handleSaveStep,
      onCancel: handleModalCancel,
      onShowNavigationModal: () => setShowNavigationModal(true),
      onShowPageAnalyzer: pageFinder.openQuickPageFinder,
    },
    quickAppModalProps: {
      open: showAppComponent,
      currentDeviceId,
      steps,
      onCancel: () => setShowAppComponent(false),
      onStepAdded: workflowIntegrations.handleQuickAppStepAdded,
    },
    navigationModalProps: {
      visible: showNavigationModal,
      onClose: workflowIntegrations.handleNavigationModalClose,
      onConfigurationChange: workflowIntegrations.handleNavigationConfigChange,
      onStepGenerated: workflowIntegrations.handleNavigationStepGenerated,
      deviceId: currentDeviceId,
    },
    contactWorkflowProps: {
      visible: showContactWorkflowSelector,
      onCancel: () => setShowContactWorkflowSelector(false),
      onStepsGenerated: workflowIntegrations.handleContactWorkflowStepsGenerated,
      deviceId: currentDeviceId,
    },
    qualityModalProps: {
      open: showQualityPanel,
      steps,
      currentDeviceId,
      onCancel: () => setShowQualityPanel(false),
      onScriptUpdate: workflowIntegrations.handleQualityPanelScriptUpdate,
      onValidationChange: workflowIntegrations.handleQualityValidationChange,
    },
    pageFinderProps: pageFinder.pageFinderProps,
  };
}
