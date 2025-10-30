// src/pages/SmartScriptBuilderPage/components/StepListPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { EnhancedDraggableStepsContainer } from '../../../components/EnhancedDraggableStepsContainer';
import StepTestButton from '../../../components/StepTestButton';
import { ExtendedSmartScriptStep, LoopConfig } from '../../../types/loopScript';
import { Device } from '../../../domain/adb/entities/Device';
import { App } from 'antd';
import { SmartActionType } from '../../../types/smartComponents';
import { generateContactImportWorkflowSteps } from '../../../modules/contact-automation';

interface StepListPanelProps {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  loopConfigs: LoopConfig[];
  setLoopConfigs: React.Dispatch<React.SetStateAction<LoopConfig[]>>;
  currentDeviceId: string;
  devices: Device[];
  handleEditStep: (step: ExtendedSmartScriptStep) => void;
  openQuickPageFinder: () => void;
  handleEditStepParams: (step: ExtendedSmartScriptStep) => void;
  handleAddStep: () => void;
  // 🔄 智能分析功能
  handleReanalyze?: (stepId: string) => Promise<void>;
  isAnalyzing?: boolean;
}

const StepListPanel: React.FC<StepListPanelProps> = (props) => {
  const { message, modal } = App.useApp();
  const {
    steps,
    setSteps,
    loopConfigs,
    setLoopConfigs,
    currentDeviceId,
    devices,
    handleEditStep,
    openQuickPageFinder,
    handleEditStepParams,
    handleAddStep,
    // 🔄 智能分析功能
    handleReanalyze,
    isAnalyzing,
  } = props;



  // 删除步骤
  const handleDeleteStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    message.success("步骤删除成功");
  };

  // 切换步骤启用状态
  const handleToggleStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // 更新步骤元信息（名称/描述）
  const handleUpdateStepMeta = (stepId: string, meta: { name?: string; description?: string }) => {
    setSteps(prev => prev.map(s => (s.id === stepId ? { ...s, ...meta } : s)));
  };

  // 🔑 关键修复：更新步骤参数
  const handleUpdateStepParameters = (stepId: string, parameters: Record<string, unknown>) => {
    console.log('🔄 [StepListPanel] 更新步骤参数:', { stepId, parameters });
    setSteps(prev => prev.map(s => (s.id === stepId ? { ...s, parameters } : s)));
  };

    // 处理批量匹配操作
  const handleBatchMatch = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          if (step.step_type === "smart_find_element") {
            return {
              ...step,
              step_type: "batch_match",
              name: step.name.replace("智能元素查找", "批量匹配"),
              description: `${step.description} (批量匹配模式 - 动态查找)`,
              parameters: {
                ...step.parameters,
                is_batch_match: true,
                original_step_type: "smart_find_element",
              },
            };
          }

          if (step.step_type === "batch_match") {
            const cleanedParameters = { ...step.parameters };
            delete cleanedParameters.is_batch_match;
            delete cleanedParameters.original_step_type;

            return {
              ...step,
              step_type: "smart_find_element",
              name: step.name.replace("批量匹配", "智能元素查找"),
              description: step.description.replace(
                /\s*\(批量匹配模式 - 动态查找\)$/,
                ""
              ),
              parameters: cleanedParameters,
            };
          }
        }
        return step;
      })
    );
    const currentStep = steps.find((s) => s.id === stepId);
    if (currentStep?.step_type === "smart_find_element") {
      message.success("已转换为批量匹配模式，将使用动态元素查找");
    } else if (currentStep?.step_type === "batch_match") {
      message.success("已切换回智能元素查找模式，将使用预设坐标");
    }
  };

  // 创建新循环
  const handleCreateLoop = () => {
    const loopId = `loop_${Date.now()}`;
    const startStepId = `step_${Date.now()}_start`;
    const endStepId = `step_${Date.now()}_end`;

    const newLoopConfig: LoopConfig = {
      loopId,
      name: "新循环",
      iterations: 3,
      enabled: true,
      description: "智能循环",
    };

    const loopStartStep: ExtendedSmartScriptStep = {
      id: startStepId,
      step_type: SmartActionType.LOOP_START,
      name: "循环开始",
      description: `开始执行 ${newLoopConfig.name}`,
      parameters: {
        loop_id: loopId,
        loop_name: newLoopConfig.name,
        loop_count: newLoopConfig.iterations,
        is_infinite_loop: false,
      },
      enabled: true,
      order: steps.length + 1,
      find_condition: null,
      verification: null,
      retry_config: null,
      fallback_actions: [],
      pre_conditions: [],
      post_conditions: [],
    };

    const loopEndStep: ExtendedSmartScriptStep = {
      id: endStepId,
      step_type: SmartActionType.LOOP_END,
      name: "循环结束",
      description: `结束执行 ${newLoopConfig.name}`,
      parameters: {
        loop_id: loopId,
        loop_name: newLoopConfig.name,
        loop_count: newLoopConfig.iterations,
        is_infinite_loop: false,
      },
      enabled: true,
      order: steps.length + 2,
      find_condition: null,
      verification: null,
      retry_config: null,
      fallback_actions: [],
      pre_conditions: [],
      post_conditions: [],
    };

    setLoopConfigs((prev) => [...prev, newLoopConfig]);
    setSteps((prev) => [...prev, loopStartStep, loopEndStep]);

    message.success("创建循环成功！可以拖拽其他步骤到循环体内");
  };

  // 创建通讯录导入工作流
  const handleCreateContactImport = () => {
    const contactSteps = generateContactImportWorkflowSteps(
      "",
      currentDeviceId
    );

    const updatedSteps = contactSteps.map((step, index) => ({
      ...step,
      order: steps.length + index + 1,
    }));

    setSteps((prev) => [...prev, ...updatedSteps]);

    message.success("通讯录导入步骤创建成功！已添加3个步骤到脚本中");
  };

  // 删除循环
  const handleDeleteLoop = (loopId: string) => {
    modal.confirm({
      title: "确认删除循环",
      content:
        "确定要删除整个循环吗？这将删除循环开始和结束标记，循环内的步骤会保留。",
      onOk: () => {
        setLoopConfigs((prev) =>
          prev.filter((config) => config.loopId !== loopId)
        );

        setSteps((prev) => {
          const updatedSteps = prev
            .filter((step) => {
              if (
                (step.step_type === SmartActionType.LOOP_START ||
                  step.step_type === SmartActionType.LOOP_END) &&
                step.parameters?.loop_id === loopId
              ) {
                return false;
              }
              return true;
            })
            .map((step) => {
              if (step.parent_loop_id === loopId) {
                return { ...step, parent_loop_id: undefined };
              }
              return step;
            });

          return updatedSteps.map((step, index) => ({
            ...step,
            order: index + 1,
          }));
        });

        message.success("循环删除成功");
      },
    });
  };

  const onCreateScreenInteraction = (tpl: any | any[]) => {
    console.log('🔍 [StepListPanel] 收到屏幕交互模板:', tpl);
    
    const baseOrder = steps.length;
    const now = Date.now();
    const ensureStep = (s: any, idx: number): ExtendedSmartScriptStep => {
      const step = { ...(s || {}) } as ExtendedSmartScriptStep;
      if (!step.id) step.id = `step_${now + idx}_scroll`;
      if (!step.step_type) step.step_type = 'smart_scroll';
      if (!step.parameters)
        step.parameters = {
          direction: 'down',
          distance: 600,
          speed_ms: 300,
        } as any;
      step.order = baseOrder + idx + 1;
      
      console.log('✅ [StepListPanel] 步骤准备完成:', {
        stepId: step.id,
        stepType: step.step_type,
        stepName: step.name,
      });
      
      return step;
    };
    const list = Array.isArray(tpl)
      ? tpl.map(ensureStep)
      : [ensureStep(tpl, 0)];
    
    console.log('📝 [StepListPanel] 即将添加步骤:', list.length, '个:', list.map(s => ({ id: s.id, step_type: s.step_type })));
    
    setSteps((prev) => [...prev, ...list]);
    if (list.length === 1) {
      const dir = (list[0].parameters as any)?.direction || 'down';
      message.success(`已添加屏幕交互步骤：智能滚动（${dir}）`);
    } else {
      message.success(`已添加屏幕交互步骤 ${list.length} 个`);
    }
  };

  // 轻点快捷添加已移入统一弹窗入口（SMART_ACTION_CONFIGS），不再保留单独入口

  const onCreateSystemAction = (tpl: any) => {
    const baseOrder = steps.length;
    const now = Date.now();
    const ensureStep = (s: any, idx: number): ExtendedSmartScriptStep => {
      const step = { ...(s || {}) } as ExtendedSmartScriptStep;
      if (!step.id) step.id = `step_${now + idx}_syskey`;
      if (!step.step_type) step.step_type = 'keyevent' as any;
      if (!step.parameters) step.parameters = { code: 4 } as any; // 默认返回
      step.order = baseOrder + idx + 1;
      return step;
    };
    const list = Array.isArray(tpl) ? tpl.map(ensureStep) : [ensureStep(tpl, 0)];
    setSteps((prev) => [...prev, ...list]);
    if (list.length === 1) {
      const code = (list[0].parameters as any)?.code;
      const label = code === 3 ? '首页' : code === 4 ? '返回' : code === 187 ? '最近任务' : `code=${code}`;
      message.success(`已添加系统按键步骤：${label}`);
    } else {
      message.success(`已添加系统按键步骤 ${list.length} 个`);
    }
  };

  return (
    <div style={{ height: '100%' }}>
      <EnhancedDraggableStepsContainer
        steps={steps}
        loopConfigs={loopConfigs}
        onStepsChange={setSteps}
        onLoopConfigsChange={setLoopConfigs}
        currentDeviceId={currentDeviceId}
        devices={devices}
        onEditStep={handleEditStep}
        onDeleteStep={handleDeleteStep}
        onDeleteLoop={handleDeleteLoop}
        onToggleStep={handleToggleStep}
        onOpenPageAnalyzer={openQuickPageFinder}
        onEditStepParams={handleEditStepParams}
        StepTestButton={StepTestButton}
        onCreateLoop={handleCreateLoop}
        onCreateContactImport={handleCreateContactImport}
        onAddStep={handleAddStep}
        onBatchMatch={handleBatchMatch}
        onCreateScreenInteraction={onCreateScreenInteraction}
        onCreateSystemAction={onCreateSystemAction}
        onUpdateStepMeta={handleUpdateStepMeta}
        onUpdateStepParameters={handleUpdateStepParameters}  // 🔑 关键修复：传递参数更新回调
        // 🔄 智能分析功能
        onReanalyze={handleReanalyze}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};

export default StepListPanel;
