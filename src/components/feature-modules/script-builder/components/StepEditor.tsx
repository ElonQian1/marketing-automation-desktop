// src/components/feature-modules/script-builder/components/StepEditor.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 步骤编辑器组件 - 重构版本
 * 使用模块化组件，控制在 500 行以内
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Space,
  Button,
  Tabs,
  Alert,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';

// 导入模块化组件
import {
  BasicConfig,
  TapParameters,
} from './step-editor';

import type { 
  ScriptStep, 
  StepType, 
  StepValidation,
  TapStepParameters,
  InputStepParameters,
  SwipeStepParameters,
  WaitStepParameters,
  LoopStepParameters,
} from '../types';

const { TabPane } = Tabs;

/**
 * StepEditor 组件属性
 */
interface StepEditorProps {
  visible: boolean;
  step: ScriptStep | null;
  isNew?: boolean;
  validation?: StepValidation;
  availableStepTypes?: StepType[];
  onClose: () => void;
  onSave: (step: ScriptStep) => void;
  onTest?: (step: ScriptStep) => void;
  onOpenPageSelector?: () => void;
}

const StepEditor: React.FC<StepEditorProps> = ({
  visible,
  step,
  isNew = false,
  validation,
  availableStepTypes,
  onClose,
  onSave,
  onTest,
  onOpenPageSelector,
}) => {
  const [form] = Form.useForm();
  const [currentStepType, setCurrentStepType] = useState<StepType>('tap');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 初始化表单数据
  useEffect(() => {
    if (visible && step) {
      form.setFieldsValue(step);
      setCurrentStepType(step.type);
      setActiveTab('basic');
    } else if (visible && isNew) {
      form.resetFields();
      setCurrentStepType('tap');
      setActiveTab('basic');
    }
  }, [visible, step, isNew, form]);

  // 处理步骤类型变化
  const handleTypeChange = (type: StepType) => {
    setCurrentStepType(type);
    // 清空当前参数，设置默认参数
    const defaultParameters = getDefaultParametersForType(type);
    form.setFieldsValue({ parameters: defaultParameters });
  };

  // 获取默认参数
  const getDefaultParametersForType = (type: StepType) => {
    switch (type) {
      case 'tap':
        return {
          method: 'coordinates',
          coordinates: { x: 0, y: 0 },
          duration: 100,
          pressure: 1.0,
        } as TapStepParameters;
      case 'input':
        return {
          text: '',
          method: 'element',
          clearBefore: true,
        } as InputStepParameters;
      case 'swipe':
        return {
          startCoordinates: { x: 0, y: 0 },
          endCoordinates: { x: 0, y: 0 },
          duration: 300,
        } as SwipeStepParameters;
      case 'wait':
        return {
          duration: 1000,
          condition: { 
            type: 'custom' as const,
            timeout: 5000
          },
        } as WaitStepParameters;
      case 'loop':
        return {
          count: 1,
          steps: [],
        } as LoopStepParameters;
      default:
        return {};
    }
  };

  // 处理参数变化
  const handleParametersChange = (params: any) => {
    const currentParams = form.getFieldValue('parameters') || {};
    const newParams = { ...currentParams, ...params };
    form.setFieldsValue({ parameters: newParams });
  };

  // 保存步骤
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const newStep: ScriptStep = {
        id: step?.id || `step_${Date.now()}`,
        type: currentStepType,
        name: values.name,
        description: values.description || '',
        enabled: values.enabled !== false,
        parameters: values.parameters || {},
        status: step?.status || 'pending',
        order: step?.order || 0,
        createdAt: step?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      onSave(newStep);
      message.success(isNew ? '步骤创建成功' : '步骤更新成功');
      onClose();
    } catch (error) {
      console.error('保存步骤失败:', error);
      message.error('保存失败，请检查输入内容');
    } finally {
      setLoading(false);
    }
  };

  // 测试步骤
  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      const testStep: ScriptStep = {
        id: 'test_step',
        type: currentStepType,
        name: values.name,
        description: values.description || '',
        enabled: true,
        parameters: values.parameters || {},
        status: 'pending',
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onTest?.(testStep);
    } catch (error) {
      message.error('请先完善步骤配置');
    }
  };

  // 渲染参数配置
  const renderParameterConfig = () => {
    switch (currentStepType) {
      case 'tap':
        return (
          <TapParameters
            parameters={form.getFieldValue('parameters') || {}}
            onParametersChange={handleParametersChange}
            onOpenSelector={onOpenPageSelector}
            loading={loading}
          />
        );
      
      case 'input':
        return (
          <Alert
            message="输入参数配置"
            description="输入参数配置组件开发中..."
            type="info"
            showIcon
          />
        );
      
      case 'swipe':
        return (
          <Alert
            message="滑动参数配置"
            description="滑动参数配置组件开发中..."
            type="info"
            showIcon
          />
        );
      
      case 'wait':
        return (
          <Alert
            message="等待参数配置"
            description="等待参数配置组件开发中..."
            type="info"
            showIcon
          />
        );
      
      case 'loop':
        return (
          <Alert
            message="循环参数配置"
            description="循环参数配置组件开发中..."
            type="info"
            showIcon
          />
        );
      
      default:
        return (
          <Alert
            message="参数配置"
            description="请先选择步骤类型"
            type="warning"
            showIcon
          />
        );
    }
  };

  // 渲染验证状态
  const renderValidationStatus = () => {
    if (!validation) return null;

    const { isValid, errors, warnings } = validation;
    
    return (
      <Space direction="vertical">
        {!isValid && errors?.length > 0 && (
          <Alert
            message="配置错误"
            description={
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
          />
        )}
        
        {warnings?.length > 0 && (
          <Alert
            message="配置警告"
            description={
              <ul>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
          />
        )}
      </Space>
    );
  };

  return (
    <Modal
      title={`${isNew ? '新建' : '编辑'}步骤`}
      open={visible}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          {onTest && (
            <Button
              icon={<PlayCircleOutlined />}
              onClick={handleTest}
              disabled={loading}
            >
              测试
            </Button>
          )}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
          >
            保存
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enabled: true,
          type: 'tap',
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基础配置" key="basic">
            <BasicConfig
              stepType={currentStepType}
              onTypeChange={handleTypeChange}
              form={form}
              loading={loading}
            />
          </TabPane>
          
          <TabPane tab="参数配置" key="parameters">
            {renderParameterConfig()}
          </TabPane>
          
          {validation && (
            <TabPane 
              tab={
                <Space>
                  <span>验证结果</span>
                  {validation.isValid ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )}
                </Space>
              } 
              key="validation"
            >
              {renderValidationStatus()}
            </TabPane>
          )}
        </Tabs>
      </Form>
    </Modal>
  );
};

export default StepEditor;