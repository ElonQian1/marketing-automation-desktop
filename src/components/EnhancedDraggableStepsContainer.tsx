// src/components/EnhancedDraggableStepsContainer.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 增强版可拖拽的步骤列表容器，支持循环逻辑

import React from 'react';
import { Card, Button, Space } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { DraggableStepsContainer } from './DraggableStepsContainer';
import type { ExtendedSmartScriptStep, LoopConfig } from '../types/loopScript';
import { useLoopPairing } from './universal-ui/script-builder/hooks/useLoopPairing';
import { buildAutoName } from './universal-ui/script-builder/utils/stepNaming';
import { useDefaultDeviceId } from '../application/hooks/useDefaultDeviceId';

export interface EnhancedDraggableStepsContainerProps {
  /** 扩展步骤列表 */
  steps: ExtendedSmartScriptStep[];
  /** 循环配置列表 */
  loopConfigs: LoopConfig[];
  /** 更新步骤列表回调 */
  onStepsChange: (steps: ExtendedSmartScriptStep[]) => void;
  /** 更新循环配置回调 */
  onLoopConfigsChange: (configs: LoopConfig[]) => void;
  /** 当前设备ID */
  currentDeviceId?: string;
  /** 设备列表 */
  devices: any[];
  /** 编辑步骤回调 */
  onEditStep: (step: ExtendedSmartScriptStep) => void;
  /** 删除步骤回调 */
  onDeleteStep: (stepId: string) => void;
  /** 删除循环回调 */
  onDeleteLoop: (loopId: string) => void;
  /** 切换步骤启用状态回调 */
  onToggleStep: (stepId: string) => void;
  /** 打开页面分析器回调 */
  onOpenPageAnalyzer?: () => void;
  /** 修改步骤参数回调 */
  onEditStepParams?: (step: ExtendedSmartScriptStep) => void;
  /** 测试步骤组件 */
  StepTestButton?: React.ComponentType<any>;
  /** 容器标题 */
  title?: React.ReactNode;
  /** 创建循环回调 */
  onCreateLoop?: () => void;
  /** 创建通讯录导入工作流回调 */
  onCreateContactImport?: () => void;
  /** 添加步骤回调 */
  onAddStep?: () => void;
  /** 批量匹配操作回调 */
  onBatchMatch?: (stepId: string) => void;
  /** 创建屏幕交互步骤（如滚动/滑动等）回调 */
  onCreateScreenInteraction?: (template: any | any[]) => void;
  /** 创建系统按键步骤回调 */
  onCreateSystemAction?: (template: any) => void;
  /** 更新步骤元信息（名称/描述） */
  onUpdateStepMeta?: (stepId: string, meta: { name?: string; description?: string }) => void;
  /** 🔄 重新分析步骤 */
  onReanalyze?: (stepId: string) => Promise<void>;
  /** 智能分析状态 */
  isAnalyzing?: boolean;
}

const EnhancedDraggableStepsContainer: React.FC<EnhancedDraggableStepsContainerProps> = ({
  steps,
  loopConfigs,
  onStepsChange,
  onLoopConfigsChange,
  currentDeviceId,
  devices,
  onEditStep,
  onDeleteStep,
  onDeleteLoop,
  onToggleStep,
  onOpenPageAnalyzer,
  onEditStepParams,
  StepTestButton,
  title = <span>智能步骤列表</span>,
  onCreateLoop,
  onCreateContactImport,
  onAddStep,
  onBatchMatch,
  onCreateScreenInteraction,
  onCreateSystemAction,
  onUpdateStepMeta,
  // 🔄 智能分析功能
  onReanalyze,
  isAnalyzing,
}) => {
  // 兜底：当未传 currentDeviceId 时，自动选择默认设备
  const { defaultDeviceId } = useDefaultDeviceId({ preferSelected: true });
  const effectiveDeviceId = currentDeviceId || defaultDeviceId;
  
  // 暂时使用基础的DraggableStepsContainer，后续可以扩展
  const handleStepsChange = (newSteps: any[]) => {
    // 转换为ExtendedSmartScriptStep类型
    const extendedSteps: ExtendedSmartScriptStep[] = newSteps.map((step, index) => ({
      ...step,
      order: index + 1,
      // 确保有所有必需的扩展属性
      parent_loop_id: step.parent_loop_id,
    }));
    onStepsChange(extendedSteps);
  };

  const { syncLoopParameters } = useLoopPairing();

  // 处理步骤参数更新
  const handleUpdateStepParameters = (stepId: string, parameters: any) => {
    // 判断是否使用自动命名：若当前名称等于基于旧参数计算的自动名，则更新后同步重算
    const prevStep = (steps as any as ExtendedSmartScriptStep[]).find(s => s.id === stepId);
    const wasAutoNamed = prevStep ? (prevStep.name || '') === buildAutoName(prevStep as any) : false;

    const next = syncLoopParameters(stepId, parameters, steps as any) as any as ExtendedSmartScriptStep[];

    let updated = next;
    if (wasAutoNamed) {
      updated = next.map(s => {
        if (s.id === stepId) {
          const auto = buildAutoName(s as any);
          return { ...s, name: auto } as ExtendedSmartScriptStep;
        }
        return s;
      });
    }
    onStepsChange(updated as any);
  };

  return (
    <Card title={
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg font-medium">📋 智能脚本步骤</span>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {steps.length} 个步骤
          </span>
          {loopConfigs.length > 0 && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              {loopConfigs.length} 个循环
            </span>
          )}
        </div>
        {onAddStep && (
          <Button 
            type="primary" 
            size="small"
            icon={<PlusOutlined />}
            onClick={onAddStep}
          >
            添加智能步骤
          </Button>
        )}
      </div>
    }>
      {/* 使用基础的拖拽容器 */}
      <DraggableStepsContainer
        steps={steps}
        onStepsChange={handleStepsChange}
        onUpdateStepMeta={onUpdateStepMeta}
        currentDeviceId={effectiveDeviceId}
        devices={devices}
        onEditStep={onEditStep}
        onDeleteStep={onDeleteStep}
        onToggleStep={onToggleStep}
        onOpenPageAnalyzer={onOpenPageAnalyzer}
        onEditStepParams={onEditStepParams}
        StepTestButton={StepTestButton}
        title="步骤列表"
        onUpdateStepParameters={handleUpdateStepParameters}
        onCreateLoop={onCreateLoop}
        onCreateContactImport={onCreateContactImport}
        onBatchMatch={onBatchMatch}
        onCreateScreenInteraction={onCreateScreenInteraction}
        onCreateSystemAction={onCreateSystemAction}
        // 🔄 智能分析功能
        onReanalyze={onReanalyze}
        isAnalyzing={isAnalyzing}
      />
    </Card>
  );
};

export { EnhancedDraggableStepsContainer };
export default EnhancedDraggableStepsContainer;