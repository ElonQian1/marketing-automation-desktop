// src/components/SmartStepCardWrapper.tsx
// module: ui | layer: ui | role: 现代化智能步骤卡片包装器
// summary: 使用现代化DraggableStepCard替代旧的UnifiedStepCard，解决白底白字问题

/**
 * 智能步骤卡片包装器
 * - 根据步骤类型自动选择合适的卡片组件
 * - 循环步骤使用专门的 LoopStepCard
 * - 普通步骤使用现代化 DraggableStepCard
 * - 保持完整的向后兼容性
 */

import React from "react";
import { DraggableStepCard } from "./DraggableStepCard";
import { LoopStartCard } from "./LoopStartCard";
import { LoopEndCard } from "./LoopEndCard";
import { useLoopTestManager } from "../modules/loop-control/application/use-loop-test-manager";
import { SmartScriptStep } from "../types/smartScript"; // 使用统一的类型定义
import { message, Space } from "antd";
import { useSmartStrategyAnalysis } from "../hooks/useSmartStrategyAnalysis";
import type { StrategyCandidate } from "../types/strategySelector";
import { 
  ParameterInferenceBadge,
  useParameterInferenceStatus
} from "../modules/structural-matching";

interface SmartStepCardWrapperProps {
  step: SmartScriptStep; // 使用统一的SmartScriptStep类型
  index: number; // 步骤索引
  isDragging?: boolean; // 是否正在拖拽
  currentDeviceId?: string; // 当前设备ID
  devices: { id: string; name: string; status: string }[]; // 设备列表
  onOpenPageAnalyzer?: () => void; // 仅容器层使用，不向下透传
  // 操作回调（与 DraggableStepCard 对齐，必传）
  onEdit: (step: SmartScriptStep) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onEditStepParams?: (step: SmartScriptStep) => void;
  // 更新元信息（名称/描述）
  onUpdateStepMeta?: (stepId: string, meta: { name?: string; description?: string }) => void;
  // 测试按钮组件（向后兼容）
  StepTestButton?: React.ComponentType<{ step: SmartScriptStep; deviceId?: string; disabled?: boolean }>;
  // 其他可能的属性（向后兼容）
  onUpdateStepParameters?: (stepId: string, parameters: Record<string, unknown>) => void;
  onBatchMatch?: (stepId: string) => void;
  ENABLE_BATCH_MATCH?: boolean;
  // 🔄 智能分析功能
  onReanalyze?: (stepId: string) => Promise<void>;
  isAnalyzing?: boolean;
  // 🔄 循环卡片同步支持
  allSteps?: SmartScriptStep[]; // 所有步骤（用于找到关联的循环步骤）
}

export const SmartStepCardWrapper: React.FC<SmartStepCardWrapperProps> = (props) => {
  const { 
    step, 
    index, 
    isDragging,
    currentDeviceId,
    devices,
    onEdit, 
    onDelete, 
    onToggle,
    onEditStepParams,
    onUpdateStepMeta,
    StepTestButton,
    onUpdateStepParameters,
    onBatchMatch,
    ENABLE_BATCH_MATCH,
    onOpenPageAnalyzer,
    // 🔄 智能分析功能
    onReanalyze,
    isAnalyzing,
    // 🔄 循环卡片同步支持
    allSteps = []
  } = props;

  // 🧠 参数推理状态管理（仅对点击步骤启用）
  const shouldShowInference = step.step_type === 'smart_find_element' || step.step_type === 'tap';
  const inferenceStatus = useParameterInferenceStatus(step.id, shouldShowInference);

  // 🎯 循环测试状态管理器 - 支持多个循环同时存在
  const loopTestManager = useLoopTestManager({
    onComplete: (success, loopId) => {
      if (success) {
        const duration = loopTestManager.getDuration(loopId);
        message.success(`✅ 循环测试完成 ${loopId} (${(duration / 1000).toFixed(1)}秒)`);
      }
    },
    onError: (error, loopId) => {
      message.error(`❌ 循环测试失败 ${loopId}: ${error}`);
    },
    onProgress: (progress, loopId) => {
      console.log(`循环测试进度 ${loopId}: ${progress}%`);
    },
  });

  // 🧠 智能策略分析管理（仅对需要策略选择的步骤启用）
  const {
    strategySelector,
    startAnalysis,
    cancelAnalysis,
    applyStrategy,
    saveAsStatic
  } = useSmartStrategyAnalysis({
    step,
    element: undefined // 暂时不传element，依赖步骤已保存的上下文
  });

  // 🎯 策略变更处理
  const handleStrategyChange = React.useCallback((_stepId: string, selection: { type: 'smart-auto' | 'smart-single' | 'static'; key?: string; stepName?: string }) => {
    console.log('🎯 [SmartStepCardWrapper] 策略变更:', { stepId: step.id, selection });
    applyStrategy(selection);
    
    // 通知父组件更新步骤参数
    if (onUpdateStepParameters) {
      onUpdateStepParameters(step.id, {
        strategy: selection.type,
        strategyKey: selection.key,
        strategyStepName: selection.stepName
      });
    }
  }, [step.id, applyStrategy, onUpdateStepParameters]);

  // 🔄 重新分析处理
  const handleReanalyze = React.useCallback(async () => {
    console.log('🔄 [SmartStepCardWrapper] 重新分析:', step.id);
    await startAnalysis();
    // 也调用父组件的onReanalyze（如果有）
    if (onReanalyze) {
      await onReanalyze(step.id);
    }
  }, [step.id, startAnalysis, onReanalyze]);

  // 💾 保存为静态策略处理
  const handleSaveAsStatic = React.useCallback((_stepId: string, candidate: StrategyCandidate) => {
    console.log('💾 [SmartStepCardWrapper] 保存静态策略:', { stepId: step.id, candidate });
    saveAsStatic(candidate);
  }, [step.id, saveAsStatic]);

  // 🔍 打开元素检查器处理
  const handleOpenElementInspector = React.useCallback(() => {
    console.log('🔍 [SmartStepCardWrapper] 打开元素检查器:', step.id);
    // TODO: 实现元素检查器
  }, [step.id]);

  // ⏹️ 取消分析处理
  const handleCancelAnalysis = React.useCallback((_stepId: string, jobId: string) => {
    console.log('⏹️ [SmartStepCardWrapper] 取消分析:', { stepId: step.id, jobId });
    cancelAnalysis();
  }, [step.id, cancelAnalysis]);

  // ✨ 应用推荐策略处理
  const handleApplyRecommendation = React.useCallback((_stepId: string, key: string) => {
    console.log('✨ [SmartStepCardWrapper] 应用推荐策略:', { stepId: step.id, key });
    // 找到推荐的候选策略并应用
    if (strategySelector?.recommended) {
      const allCandidates = [
        ...(strategySelector.candidates?.smart ?? []),
        ...(strategySelector.candidates?.static ?? [])
      ];
      const recommendedCandidate = allCandidates.find(c => c.key === key);
      if (recommendedCandidate) {
        const strategyType = recommendedCandidate.type === 'smart' ? 'smart-auto' : 'static';
        applyStrategy({ type: strategyType, key: recommendedCandidate.key });
      }
    }
  }, [step.id, strategySelector, applyStrategy]);

  // 🎯 智能路由：根据步骤类型选择合适的卡片组件

  // 🔗 联动删除函数 - 删除循环卡片时同时删除配对卡片
  const handleLoopCardDelete = React.useCallback((stepId: string, stepType: 'loop_start' | 'loop_end') => {
    const currentStep = allSteps?.find(s => s.id === stepId);
    if (!currentStep || !allSteps) {
      onDelete(stepId);
      return;
    }

    const currentLoopId = currentStep.parameters?.loop_id as string || `loop_${stepId}`;
    
    // 找到配对的循环卡片
    const pairedType = stepType === 'loop_start' ? 'loop_end' : 'loop_start';
    const pairedStep = allSteps.find(s => 
      s.step_type === pairedType && 
      (s.parameters?.loop_id === currentLoopId || `loop_${s.id}` === currentLoopId)
    );

    console.log('🔗 联动删除循环卡片', {
      currentStepId: stepId,
      currentStepType: stepType,
      currentLoopId,
      pairedStepId: pairedStep?.id,
      pairedStepType: pairedType
    });

    // 删除当前卡片
    onDelete(stepId);
    
    // 删除配对卡片
    if (pairedStep) {
      onDelete(pairedStep.id);
      message.success(`已删除循环${stepType === 'loop_start' ? '开始' : '结束'}卡片及其配对卡片`);
    } else {
      message.warning(`已删除循环${stepType === 'loop_start' ? '开始' : '结束'}卡片，但未找到配对卡片`);
    }
  }, [allSteps, onDelete]);

  // 循环开始步骤 - 使用专门的循环开始卡片
  if (step.step_type === 'loop_start') {
    const currentLoopId = step.parameters?.loop_id as string || `loop_${step.id}`;
    const loopTestState = loopTestManager.getLoopState(currentLoopId);
    
    return (
      <LoopStartCard
        step={step}
        isDragging={isDragging}
        // 循环卡片特定属性
        loopConfig={step.parameters?.loop_config || {
          loopId: currentLoopId,
          name: step.parameters?.loop_name as string || step.name,
          iterations: step.parameters?.loop_count as number || 1,
          enabled: step.enabled
        }}
        // 🎯 循环测试联动 - 通过状态管理器提供
        loopTestState={loopTestState}
        canStartTest={loopTestManager.canStart(currentLoopId)}
        canStopTest={loopTestManager.canStop(currentLoopId)}
        onStartTest={async () => {
          await loopTestManager.startTest(currentLoopId, allSteps, currentDeviceId || '');
        }}
        onStopTest={async () => {
          await loopTestManager.stopTest(currentLoopId);
        }}
        onLoopConfigUpdate={(config) => {
          // 更新循环配置并同步到关联步骤
          if (onUpdateStepParameters && allSteps) {
            const loopParameters = {
              loop_config: config,
              loop_id: config.loopId,
              loop_name: config.name,
              loop_count: config.iterations
            };
            
            // 更新当前步骤
            onUpdateStepParameters(step.id, {
              ...step.parameters,
              ...loopParameters,
            });
            
            // 🔄 查找并同步关联的循环步骤
            const associatedType = step.step_type === 'loop_start' ? 'loop_end' : 'loop_start';
            const associatedStep = allSteps.find(s => 
              s.step_type === associatedType && 
              s.parameters?.loop_id === config.loopId
            );
            
            if (associatedStep) {
              onUpdateStepParameters(associatedStep.id, {
                ...associatedStep.parameters,
                ...loopParameters,
              });
            }
          }
        }}
        onDeleteLoop={() => handleLoopCardDelete(step.id, 'loop_start')}
      />
    );
  }

  // 循环结束步骤 - 使用专门的循环结束卡片
  if (step.step_type === 'loop_end') {
    const currentLoopId = step.parameters?.loop_id as string || `loop_${step.id}`;
    const loopTestState = loopTestManager.getLoopState(currentLoopId);
    
    return (
      <LoopEndCard
        step={step}
        index={index}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        // 循环卡片特定属性
        loopConfig={step.parameters?.loop_config || {
          loopId: currentLoopId,
          name: step.parameters?.loop_name as string || step.name,
          iterations: step.parameters?.loop_count as number || 1,
          enabled: step.enabled
        }}
        // 🎯 循环测试联动 - 通过状态管理器提供
        loopTestState={loopTestState}
        canStopTest={loopTestManager.canStop(currentLoopId)}
        onStopTest={async () => {
          await loopTestManager.stopTest(currentLoopId);
        }}
        onLoopConfigUpdate={(config) => {
          // 更新循环配置并同步到关联步骤
          if (onUpdateStepParameters && allSteps) {
            const loopParameters = {
              loop_config: config,
              loop_id: config.loopId,
              loop_name: config.name,
              loop_count: config.iterations
            };
            
            // 更新当前步骤
            onUpdateStepParameters(step.id, {
              ...step.parameters,
              ...loopParameters,
            });
            
            // 🔄 查找并同步关联的循环步骤
            const associatedType = step.step_type === 'loop_end' ? 'loop_start' : 'loop_end';
            const associatedStep = allSteps.find(s => 
              s.step_type === associatedType && 
              s.parameters?.loop_id === config.loopId
            );
            
            if (associatedStep) {
              onUpdateStepParameters(associatedStep.id, {
                ...associatedStep.parameters,
                ...loopParameters,
              });
            }
          }
        }}
        onDeleteLoop={() => handleLoopCardDelete(step.id, 'loop_end')}
        onUpdateStepParameters={onUpdateStepParameters}
      />
    );
  }

  // 普通步骤 - 使用现代化拖拽卡片
  return (
    <div style={{ position: 'relative' }}>
      <DraggableStepCard
        step={{
          ...step,
          strategySelector: strategySelector || undefined
        }}
        index={index}
        isDragging={isDragging}
        currentDeviceId={currentDeviceId}
        devices={devices}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onEditStepParams={onEditStepParams}
        onUpdateStepMeta={onUpdateStepMeta}
        StepTestButton={StepTestButton}
        onUpdateStepParameters={onUpdateStepParameters}
        onBatchMatch={onBatchMatch}
        ENABLE_BATCH_MATCH={ENABLE_BATCH_MATCH}
        onOpenPageAnalyzer={onOpenPageAnalyzer}
        // 🧠 策略选择器回调
        onStrategyChange={handleStrategyChange}
        onReanalyze={handleReanalyze}
        onSaveAsStatic={handleSaveAsStatic}
        onOpenElementInspector={handleOpenElementInspector}
        onCancelAnalysis={handleCancelAnalysis}
        onApplyRecommendation={handleApplyRecommendation}
        // 🔄 智能分析功能
        isAnalyzing={isAnalyzing}
      />
      
      {/* 🧠 参数推理状态徽章 */}
      {shouldShowInference && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 10,
        }}>
          <ParameterInferenceBadge 
            inferenceResult={inferenceStatus.inferenceResult}
            size="small"
          />
        </div>
      )}
    </div>
  );
};

export default SmartStepCardWrapper;