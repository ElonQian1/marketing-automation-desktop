// src/pages/SmartScriptBuilderPage/hooks/step-form/handlers/StepSaveHandler.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

import type { ExtendedSmartScriptStep } from '../../../../../types/loopScript';
import { SmartActionType } from '../../../../../types/smartComponents';

/**
 * 步骤保存处理器 - 简化版本
 * 处理步骤的保存、更新和管理逻辑
 */
export class StepSaveHandler {
  private steps: ExtendedSmartScriptStep[];
  private setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  private currentDeviceId: string;
  private allowSaveWithoutXmlOnce: boolean;
  private setAllowSaveWithoutXmlOnce: (v: boolean) => void;
  private onContactWorkflow?: () => void;

  constructor(
    steps: ExtendedSmartScriptStep[],
    setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>,
    currentDeviceId: string,
    allowSaveWithoutXmlOnce: boolean,
    setAllowSaveWithoutXmlOnce: (v: boolean) => void,
    onContactWorkflow?: () => void
  ) {
    this.steps = steps;
    this.setSteps = setSteps;
    this.currentDeviceId = currentDeviceId;
    this.allowSaveWithoutXmlOnce = allowSaveWithoutXmlOnce;
    this.setAllowSaveWithoutXmlOnce = setAllowSaveWithoutXmlOnce;
    this.onContactWorkflow = onContactWorkflow;
  }

  /**
   * 保存步骤
   */
  public async saveStep(
    formValues: any,
    editingStep: ExtendedSmartScriptStep | null
  ): Promise<void> {
    const { step_type, name, description, parameters } = formValues;
    
    console.log('💾 保存步骤，editingStep:', editingStep?.id || 'null (新增模式)');
    console.log('📋 表单数据:', { step_type, name, description, parametersCount: Object.keys(parameters || {}).length });

    // 特殊处理：通讯录导入工作流
    if (step_type === SmartActionType.CONTACT_IMPORT_WORKFLOW) {
      if (this.onContactWorkflow) {
        this.onContactWorkflow();
      }
      return;
    }

    const stepId = editingStep?.id || `step_${Date.now()}`;
    const isQuickMode = this.allowSaveWithoutXmlOnce;

    // 创建或更新步骤
    const stepData: ExtendedSmartScriptStep = {
      id: stepId,
      step_type,
      name: name || `步骤 ${this.steps.length + 1}`,
      description: description || '',
      parameters: this.processParameters(parameters, isQuickMode),
      enabled: editingStep?.enabled ?? true,
      order: editingStep?.order ?? this.steps.length,
    };

    // 更新步骤列表
    if (editingStep) {
      // 编辑现有步骤
      this.setSteps(prev => prev.map(step => 
        step.id === stepId ? stepData : step
      ));
      console.log('✅ 步骤更新完成:', stepId);
    } else {
      // 添加新步骤
      this.setSteps(prev => [...prev, stepData]);
      console.log('✅ 新步骤添加完成:', stepId);
    }

    // 重置快速保存标志
    if (isQuickMode) {
      this.setAllowSaveWithoutXmlOnce(false);
    }
  }

  /**
   * 删除步骤
   */
  public deleteStep(stepId: string): void {
    this.setSteps(prev => prev.filter(step => step.id !== stepId));
    console.log('🗑️ 步骤删除完成:', stepId);
  }

  /**
   * 复制步骤
   */
  public duplicateStep(step: ExtendedSmartScriptStep): void {
    const newStep: ExtendedSmartScriptStep = {
      ...step,
      id: `step_${Date.now()}`,
      name: `${step.name} (副本)`,
      order: this.steps.length,
    };
    
    this.setSteps(prev => [...prev, newStep]);
    console.log('📋 步骤复制完成:', newStep.id);
  }

  /**
   * 处理参数
   */
  private processParameters(parameters: any, isQuickMode: boolean): any {
    if (!parameters) return {};

    // 简化参数处理逻辑
    const processedParams = { ...parameters };

    // 添加设备信息
    if (this.currentDeviceId) {
      processedParams.deviceId = this.currentDeviceId;
    }

    // 添加时间戳
    processedParams.timestamp = Date.now();

    // 快速模式下跳过复杂验证
    if (isQuickMode) {
      processedParams.quickMode = true;
    }

    return processedParams;
  }

  /**
   * 获取步骤
   */
  public getStepById(stepId: string): ExtendedSmartScriptStep | undefined {
    return this.steps.find(step => step.id === stepId);
  }

  /**
   * 更新配置
   */
  public updateConfig(
    steps: ExtendedSmartScriptStep[],
    setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>,
    currentDeviceId: string,
    allowSaveWithoutXmlOnce: boolean,
    setAllowSaveWithoutXmlOnce: (v: boolean) => void
  ): void {
    this.steps = steps;
    this.setSteps = setSteps;
    this.currentDeviceId = currentDeviceId;
    this.allowSaveWithoutXmlOnce = allowSaveWithoutXmlOnce;
    this.setAllowSaveWithoutXmlOnce = setAllowSaveWithoutXmlOnce;
  }
}