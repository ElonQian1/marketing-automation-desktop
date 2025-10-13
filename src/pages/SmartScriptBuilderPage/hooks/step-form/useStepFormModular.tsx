// src/pages/SmartScriptBuilderPage/hooks/step-form/useStepFormModular.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useCallback, useState } from 'react';
import { Form, message } from 'antd';
import { theme } from 'antd';
import { FormHandler } from './handlers/FormHandler';
import { StepSaveHandler } from './handlers/StepSaveHandler';
import { 
  UseStepFormDeps, 
  UseStepFormReturn,
  SnapshotFixMode
} from './types/index';
import type { ExtendedSmartScriptStep } from '../../../../types/loopScript';

/**
 * 模块化的步骤表单Hook
 * 将原有的468行代码分解为多个处理器类
 */
export const useStepFormModular = (deps: UseStepFormDeps): UseStepFormReturn => {
  const { token } = theme.useToken();
  
  const {
    form: externalForm,
    steps,
    setSteps,
    currentDeviceId,
    setShowContactWorkflowSelector,
    allowSaveWithoutXmlOnce,
    setAllowSaveWithoutXmlOnce,
  } = deps;

  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState<ExtendedSmartScriptStep | null>(null);
  const [internalForm] = !externalForm ? Form.useForm() : [null];
  const form = externalForm ?? internalForm;

  // 处理器实例
  const formHandler = React.useMemo(() => 
    new FormHandler(
      form,
      editingStep,
      setEditingStep,
      setIsModalVisible
    ),
    [form, editingStep]
  );

  const stepSaveHandler = React.useMemo(() => 
    new StepSaveHandler(
      steps,
      setSteps,
      currentDeviceId,
      allowSaveWithoutXmlOnce,
      setAllowSaveWithoutXmlOnce,
      () => {
        setShowContactWorkflowSelector(true);
        setIsModalVisible(false);
      }
    ),
    [steps, setSteps, currentDeviceId, allowSaveWithoutXmlOnce, setAllowSaveWithoutXmlOnce, setShowContactWorkflowSelector]
  );

  // 显示添加模态框
  const showAddModal = useCallback((options?: { resetFields?: boolean }) => {
    formHandler.showAddModal(options);
  }, [formHandler]);

  // 显示编辑模态框
  const showEditModal = useCallback((step: ExtendedSmartScriptStep) => {
    formHandler.showEditModal(step);
  }, [formHandler]);

  // 隐藏模态框
  const hideModal = useCallback(() => {
    formHandler.hideModal();
  }, [formHandler]);

  // 保存步骤
  const handleSaveStep = useCallback(async () => {
    try {
      const formValues = await formHandler.getFormValues();
      await stepSaveHandler.saveStep(formValues, editingStep);
      
      message.success(editingStep ? '步骤更新成功' : '步骤添加成功');
      setIsModalVisible(false);
    } catch (error) {
      console.error('保存步骤失败:', error);
      message.error('保存步骤失败，请检查表单内容');
    }
  }, [formHandler, stepSaveHandler, editingStep]);

  // 删除步骤
  const handleDeleteStep = useCallback((stepId: string) => {
    stepSaveHandler.deleteStep(stepId);
    message.success('步骤删除成功');
  }, [stepSaveHandler]);

  // 复制步骤
  const duplicateStep = useCallback((step: ExtendedSmartScriptStep) => {
    stepSaveHandler.duplicateStep(step);
    message.success('步骤复制成功');
  }, [stepSaveHandler]);

  // 获取步骤
  const getStepById = useCallback((stepId: string) => {
    return stepSaveHandler.getStepById(stepId);
  }, [stepSaveHandler]);

  // 验证当前步骤
  const validateCurrentStep = useCallback(async () => {
    try {
      await form.validateFields();
      return true;
    } catch (error) {
      console.warn('步骤验证失败:', error);
      return false;
    }
  }, [form]);

  // 返回Hook接口
  return {
    // 状态
    isModalVisible,
    editingStep,
    form,
    
    // 操作方法
    showAddModal,
    showEditModal,
    hideModal,
    handleSaveStep,
    handleDeleteStep,
    duplicateStep,
    
    // 工具方法
    getStepById,
    validateCurrentStep,
  };
};

export default useStepFormModular;