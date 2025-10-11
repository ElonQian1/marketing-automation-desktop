// src/pages/SmartScriptBuilderPage/components/step-edit-modal/StepEditModalModular.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Modal, Form, Space, theme } from "antd";
import { useOverlayTheme } from "../../../../components/ui/overlay";
import { noDragProps } from "../../../../components/universal-ui/dnd/noDrag";
import { FormBasicSection } from "./components/FormBasicSection";
import { ParametersRenderSection } from "./components/ParametersRenderSection";
import { ActionButtonsSection } from "./components/ActionButtonsSection";
import { ThemeControlSection } from "./components/ThemeControlSection";
import type { StepEditModalProps } from "./types";

/**
 * 步骤编辑模态框 - 模块化版本
 * 将原有的452行代码分解为多个子组件
 */
const StepEditModalModular: React.FC<StepEditModalProps> = ({
  open,
  editingStep,
  form,
  currentDeviceId,
  onOk,
  onCancel,
  onShowNavigationModal,
  onShowPageAnalyzer,
}) => {
  const { token } = theme.useToken();
  const { theme: overlayTheme, setTheme, classes, popupProps } = useOverlayTheme('inherit');

  const titleNode = (
    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
      <span>{editingStep ? '编辑步骤' : '添加步骤'}</span>
      <ThemeControlSection theme={overlayTheme} setTheme={setTheme} />
    </Space>
  );

  return (
    <Modal
      title={titleNode}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={800}
      destroyOnClose
      className={classes.className}
      rootClassName={classes.rootClassName}
      {...popupProps}
      {...noDragProps}
    >
      <div style={{ 
        maxHeight: '70vh', 
        overflowY: 'auto',
        padding: `0 ${token.paddingXS}px`
      }}>
        <Form
          form={form}
          layout="vertical"
          size="middle"
        >
          <Space direction="vertical" style={{ width: '100%' }} size={token.marginMD}>
            {/* 基础表单部分 */}
            <FormBasicSection form={form} />
            
            {/* 参数配置部分 */}
            <ParametersRenderSection 
              form={form}
              editingStep={editingStep}
              currentDeviceId={currentDeviceId}
            />
            
            {/* 操作按钮部分 */}
            <ActionButtonsSection
              onShowNavigationModal={onShowNavigationModal}
              onShowPageAnalyzer={onShowPageAnalyzer}
            />
          </Space>
        </Form>
      </div>
    </Modal>
  );
};

export default StepEditModalModular;