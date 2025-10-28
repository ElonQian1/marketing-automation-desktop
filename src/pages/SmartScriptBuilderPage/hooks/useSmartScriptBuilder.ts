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
import type { UseIntelligentAnalysisWorkflowReturn } from "../../../modules/universal-ui/hooks/use-intelligent-analysis-workflow";
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

interface UseSmartScriptBuilderOptions {
  analysisWorkflow: UseIntelligentAnalysisWorkflowReturn;
}

export function useSmartScriptBuilder(options: UseSmartScriptBuilderOptions) {
  const { analysisWorkflow } = options;
  const { devices, refreshDevices } = useAdb();
  const [form] = Form.useForm();

  // 初始化为空步骤列表，用户可以通过UI添加步骤
  const [steps, setSteps] = useState<LoopScriptStep[]>([]);
  
  // 🔄 步骤卡片重新分析功能
  const { reanalyzeStepCard, isAnalyzing } = useStepCardReanalysis({
    steps,
    setSteps,
    analysisWorkflow
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

  // ✅ 同步智能分析工作流的步骤卡状态到脚本步骤
  useEffect(() => {
    const { stepCards } = analysisWorkflow;
    if (stepCards.length === 0) return;

    setSteps(prevSteps => {
      let hasChanges = false;
      const updated = prevSteps.map(step => {
        if (!step.enableStrategySelector || !step.strategySelector) return step;

        // 🔒 严格匹配：查找对应的智能步骤卡
        const matchingCard = stepCards.find(card => String(card.stepId) === String(step.id));
        if (!matchingCard) {
          // ❌ 没有匹配的卡片,不要更新此步骤
          return step;
        }

        // 检查状态是否需要更新
        const currentStatus = step.strategySelector.analysis.status;
        const newStatus = matchingCard.analysisState === 'analysis_completed' ? 'completed'
          : matchingCard.analysisState === 'analysis_failed' ? 'failed'
          : matchingCard.analysisState === 'analyzing' ? 'analyzing'
          : matchingCard.analysisState === 'idle' ? 'ready'
          : currentStatus;

        const currentProgress = step.strategySelector.analysis.progress || 0;
        // ✅ 完成时强制进度为 100，避免显示 "✅ 0%"
        const newProgress = matchingCard.analysisState === 'analysis_completed' ? 100
          : matchingCard.analysisState === 'analyzing' ? (matchingCard.analysisProgress || 0)
          : 0; // 非 analyzing 状态时进度归零

        // 🔒 只在状态或进度真正变化时更新
        if (newStatus !== currentStatus || newProgress !== currentProgress) {
          hasChanges = true;
          // 🔇 日志优化：只在关键状态变化时打印
          if (newStatus !== currentStatus || Math.abs(newProgress - currentProgress) >= 25) {
            console.log('🔄 [状态同步] 更新步骤卡状态:', {
              stepId: step.id,
              matchingCardId: matchingCard.stepId,
              oldStatus: currentStatus,
              newStatus,
              progressChange: `${currentProgress}% → ${newProgress}%`,
            });
          }

          return {
            ...step,
            strategySelector: {
              ...step.strategySelector,
              analysis: {
                ...step.strategySelector.analysis,
                status: newStatus,
                progress: newProgress,
                // ✅ 同步分析结果（候选策略列表）
                result: matchingCard.analysisState === 'analysis_completed' 
                  ? {
                      smartCandidates: matchingCard.smartCandidates || [],
                      staticCandidates: matchingCard.staticCandidates || [],
                      recommendedKey: matchingCard.recommendedStrategy?.key
                    }
                  : step.strategySelector.analysis.result
              }
            }
          };
        }

        return step;
      });

      return hasChanges ? updated : prevSteps;
    });
  }, [analysisWorkflow.stepCards]);
  
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
