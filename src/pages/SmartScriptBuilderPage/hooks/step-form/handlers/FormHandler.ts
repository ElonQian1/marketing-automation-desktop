// src/pages/SmartScriptBuilderPage/hooks/step-form/handlers/FormHandler.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

import type { FormInstance } from 'antd';
import type { ExtendedSmartScriptStep } from '../../../../../types/loopScript';

/**
 * 表单处理器 - 简化版本
 * 处理表单的显示、编辑和基础操作逻辑
 */
export class FormHandler {
  private form: FormInstance;
  private editingStep: ExtendedSmartScriptStep | null;
  private setEditingStep: (step: ExtendedSmartScriptStep | null) => void;
  private setIsModalVisible: (visible: boolean) => void;

  constructor(
    form: FormInstance,
    editingStep: ExtendedSmartScriptStep | null,
    setEditingStep: (step: ExtendedSmartScriptStep | null) => void,
    setIsModalVisible: (visible: boolean) => void
  ) {
    this.form = form;
    this.editingStep = editingStep;
    this.setEditingStep = setEditingStep;
    this.setIsModalVisible = setIsModalVisible;
  }

  /**
   * 显示添加模态框
   */
  public showAddModal(options?: { resetFields?: boolean }): void {
    this.setEditingStep(null);
    if (options?.resetFields !== false) {
      this.form.resetFields();
    }
    this.setIsModalVisible(true);
  }

  /**
   * 显示编辑模态框
   */
  public showEditModal(step: ExtendedSmartScriptStep): void {
    this.setEditingStep(step);
    this.form.setFieldsValue({
      step_type: step.step_type,
      name: step.name,
      description: step.description,
      ...(step.parameters || {}),
    });
    this.setIsModalVisible(true);
  }

  /**
   * 隐藏模态框
   */
  public hideModal(): void {
    this.setIsModalVisible(false);
  }

  /**
   * 获取表单值并合并额外字段
   */
  public async getFormValues(): Promise<any> {
    const values = await this.form.validateFields();
    const { step_type, name, description, ...parameters } = values;

    // 合并未注册但通过 setFieldValue 写入的关键字段
    try {
      const extraFields = ['matching', 'elementBinding', 'xmlSnapshot', 'elementLocator'];
      
      for (const fieldName of extraFields) {
        const extraValue = this.form.getFieldValue(fieldName);
        if (extraValue && !(parameters as any)[fieldName]) {
          (parameters as any)[fieldName] = extraValue;
        }
      }
    } catch (e) {
      // 兼容性容错：即便取不到也不阻断保存
      console.warn('合并表单额外字段失败（可忽略）:', e);
    }

    return { step_type, name, description, parameters };
  }

  /**
   * 更新配置
   */
  public updateConfig(
    editingStep: ExtendedSmartScriptStep | null,
    setEditingStep: (step: ExtendedSmartScriptStep | null) => void,
    setIsModalVisible: (visible: boolean) => void
  ): void {
    this.editingStep = editingStep;
    this.setEditingStep = setEditingStep;
    this.setIsModalVisible = setIsModalVisible;
  }
}