// src/pages/SmartScriptBuilderPage/components/QuickAppSelectionModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState } from "react";
import { Modal, Alert, message, Button } from "antd";
import { LaunchAppSmartComponent } from "../../../components/smart/LaunchAppSmartComponent";
import type { SmartScriptStep } from "../../../types/smartScript";
import { SmartActionType, LaunchAppComponentParams } from "../../../types/smartComponents";
import { smartAppService } from "../../../services/smart-app-service";

interface QuickAppSelectionModalProps {
  open: boolean;
  currentDeviceId?: string;
  steps: any[];
  onCancel: () => void;
  onStepAdded: (step: SmartScriptStep) => void;
}

const QuickAppSelectionModal: React.FC<QuickAppSelectionModalProps> = ({
  open,
  currentDeviceId,
  steps,
  onCancel,
  onStepAdded,
}) => {
  const [currentParams, setCurrentParams] = useState<LaunchAppComponentParams | undefined>();

  const handleAddStep = () => {
    if (currentParams?.selected_app) {
      const newStep: SmartScriptStep = {
        id: `step_${Date.now()}`,
        step_type: SmartActionType.LAUNCH_APP,
        name: `启动${currentParams.selected_app.app_name}`,
        description: `智能启动应用: ${currentParams.selected_app.app_name}`,
        parameters: currentParams,
        enabled: true,
        order: steps.length,
      };

      onStepAdded(newStep);
      onCancel();
      message.success(
        `已添加应用启动步骤: ${currentParams.selected_app.app_name}`
      );
    }
  };

  return (
    <Modal
      title="快速添加应用启动步骤"
      open={open}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={!currentParams?.selected_app}
          onClick={handleAddStep}
        >
          添加步骤
        </Button>,
      ]}
    >
      <Alert
        message="快速创建应用启动步骤"
        description="选择一个应用并配置启动参数，将自动创建一个智能应用启动步骤。无需连接设备即可配置。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <LaunchAppSmartComponent
        deviceId={currentDeviceId}
        value={currentParams}
        onChange={(params) => {
          setCurrentParams(params);
        }}
        onExecute={async (params) => {
          // 提供测试功能
          if (currentDeviceId && params.package_name) {
             const result = await smartAppService.launchDeviceApp(currentDeviceId, params.package_name);
             return result.success;
          }
          return false;
        }}
      />
    </Modal>
  );
};

export default QuickAppSelectionModal;