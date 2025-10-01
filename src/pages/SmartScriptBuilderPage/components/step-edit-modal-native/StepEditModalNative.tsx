import React from "react";
import { Modal, Form, Button, Space, Typography } from "antd";
import { ActionConfigSection } from "./ActionConfigSection";
import { ParametersFormSection } from "./ParametersFormSection";

const { Title } = Typography;

interface StepEditModalNativeProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (values: any) => void;
  editingStep?: any;
  currentDeviceId?: string | null;
  onShowPageAnalyzer?: () => void;
  onShowNavigationModal?: () => void;
  form: any;
  stepConfigs: any;
}

/**
 * 步骤编辑模态框 - 原生 Ant Design 版本
 * 完全移除 Tailwind CSS，使用原生 Ant Design 5 样式
 */
export const StepEditModalNative: React.FC<StepEditModalNativeProps> = ({
  visible,
  onCancel,
  onConfirm,
  editingStep,
  currentDeviceId,
  onShowPageAnalyzer,
  onShowNavigationModal,
  form,
  stepConfigs,
}) => {
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onConfirm(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const stepType = Form.useWatch('step_type', form);
  const config = stepConfigs[stepType];

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          {editingStep ? '编辑步骤' : '添加新步骤'}
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            {editingStep ? '更新步骤' : '添加步骤'}
          </Button>
        </Space>
      }
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        initialValues={{
          step_type: "SMART_FIND_ELEMENT",
          name: "智能元素查找",
          wait_after: 1000,
        }}
      >
        {/* 基础表单项在这里 - 操作类型、名称等 */}
        
        {/* 操作配置区域 */}
        <ActionConfigSection
          stepType={stepType}
          onShowPageAnalyzer={onShowPageAnalyzer}
          onShowNavigationModal={onShowNavigationModal}
        />

        {/* 参数表单区域 */}
        <ParametersFormSection
          form={form}
          stepType={stepType}
          config={config}
        />
      </Form>
    </Modal>
  );
};