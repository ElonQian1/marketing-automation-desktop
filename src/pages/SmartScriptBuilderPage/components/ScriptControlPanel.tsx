// src/pages/SmartScriptBuilderPage/components/ScriptControlPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import {
  Card,
  Button,
  Space,
  Form,
  InputNumber,
  Row,
  Col,
  Typography,
  Collapse,
  Divider,
  Switch,
} from "antd";
import {
  PlayCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import TestResultsDisplay from "../../../components/TestResultsDisplay";
import { ScriptBuilderIntegration } from "../../../modules/smart-script-management/components/ScriptBuilderIntegration";
import MultiDeviceScriptLauncher from "./MultiDeviceScriptLauncher";
import { useExecutionControl } from "../../../modules/execution-control";
import { SimpleAbortButton } from "./SimpleAbortButton";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import type {
  ExecutorConfig,
  SmartExecutionResult,
} from "../../../types/execution";

const { Title } = Typography;
// Note: rc-collapse warns against using children Panels; use items API instead.

interface ScriptControlPanelProps {
  steps: ExtendedSmartScriptStep[];
  executorConfig: ExecutorConfig;
  setExecutorConfig: (config: ExecutorConfig) => void;
  executionResult: SmartExecutionResult | null;
  isExecuting: boolean;
  currentDeviceId: string;
  onExecuteScript: () => void;
  onLoadScript: (script: any) => void;
  onUpdateSteps: (steps: any[]) => void;
  onUpdateConfig: (config: any) => void;
}

const ScriptControlPanel: React.FC<ScriptControlPanelProps> = ({
  steps,
  executorConfig,
  setExecutorConfig,
  executionResult,
  isExecuting,
  currentDeviceId,
  onExecuteScript,
  onLoadScript,
  onUpdateSteps,
  onUpdateConfig,
}) => {
  // 🔥 集成执行控制系统（用于中止按钮状态）
  const { canAbort } = useExecutionControl();

  // 直接使用原有的执行脚本逻辑（已集成执行控制）
  const handleExecuteScript = () => {
    console.log('🔴🔴🔴 [ScriptControlPanel] ============ 执行脚本按钮被点击! ============');
    console.log('📋 [ScriptControlPanel] 当前步骤数:', steps.length);
    console.log('📱 [ScriptControlPanel] 当前设备ID:', currentDeviceId);
    console.log('⚡ [ScriptControlPanel] 正在执行状态:', isExecuting);
    console.log('🛑 [ScriptControlPanel] 可中止状态:', canAbort);
    
    // 调用原有的执行脚本逻辑（executeScript.ts中已集成执行控制）
    onExecuteScript();
  };

  return (
    <Card>
      <Title level={4}>脚本控制中心</Title>
      <Divider />

      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 执行控制按钮组 */}
        <Space direction="horizontal" style={{ width: "100%" }}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecuteScript}
            loading={isExecuting}
            disabled={!currentDeviceId || steps.length === 0}
            style={{ flex: 1 }}
          >
            {isExecuting ? "正在执行脚本..." : "执行脚本"}
          </Button>
          
          {/* 中止按钮 - 一键立即中止，无需确认 */}
          <SimpleAbortButton 
            text="中止" 
            size="middle"
            forceShow={isExecuting} // 执行时强制显示
            onAbort={() => {
              console.log('🛑 [ScriptControlPanel] 脚本执行已中止');
            }}
          />
        </Space>

        <MultiDeviceScriptLauncher steps={steps} />

        <ScriptBuilderIntegration
          steps={steps}
          executorConfig={executorConfig}
          onLoadScript={onLoadScript}
          onUpdateSteps={onUpdateSteps}
          onUpdateConfig={onUpdateConfig}
        />
      </Space>

      <Divider />

      <Collapse
        items={[{
          key: '1',
          label: '执行器配置',
          extra: <SettingOutlined />,
          children: (
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="默认超时(ms)">
                  <InputNumber
                    value={executorConfig.default_timeout_ms}
                    onChange={(value) =>
                      setExecutorConfig({
                        ...executorConfig,
                        default_timeout_ms: value || 10000,
                      })
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="默认重试次数">
                  <InputNumber
                    value={executorConfig.default_retry_count}
                    onChange={(value) =>
                      setExecutorConfig({
                        ...executorConfig,
                        default_retry_count: value || 3,
                      })
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="页面识别"
              tooltip="启用后，执行器会尝试识别当前页面状态，以提高鲁棒性。"
            >
              <Switch
                checked={executorConfig.page_recognition_enabled}
                onChange={(checked) =>
                  setExecutorConfig({
                    ...executorConfig,
                    page_recognition_enabled: checked,
                  })
                }
              />
            </Form.Item>
            <Form.Item
              label="自动验证"
              tooltip="操作执行后，自动验证结果是否符合预期。"
            >
              <Switch
                checked={executorConfig.auto_verification_enabled}
                onChange={(checked) =>
                  setExecutorConfig({
                    ...executorConfig,
                    auto_verification_enabled: checked,
                  })
                }
              />
            </Form.Item>
            <Form.Item
              label="智能恢复"
              tooltip="执行失败时，尝试使用备用策略或回退机制进行恢复。"
            >
              <Switch
                checked={executorConfig.smart_recovery_enabled}
                onChange={(checked) =>
                  setExecutorConfig({
                    ...executorConfig,
                    smart_recovery_enabled: checked,
                  })
                }
              />
            </Form.Item>
            <Form.Item
              label="详细日志"
              tooltip="记录详细的执行日志，方便调试。"
            >
              <Switch
                checked={executorConfig.detailed_logging}
                onChange={(checked) =>
                  setExecutorConfig({
                    ...executorConfig,
                    detailed_logging: checked,
                  })
                }
              />
            </Form.Item>
          </Form>
          )
        }]}>
      </Collapse>

      <Divider />

      {executionResult && (
        <TestResultsDisplay />
      )}
    </Card>
  );
};

export default ScriptControlPanel;
