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
  Select,
  App,
} from "antd";
import {
  PlayCircleOutlined,
  SettingOutlined,
  BulbOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SkinOutlined,
  ToolOutlined,
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
  // New props from ControlPanel
  onShowQualityPanel?: () => void;
  onTestElementMapping?: () => void;
  onTestSmartStepGenerator?: () => void;
  loopTheme?: string | null;
  nonLoopTheme?: string | null;
  onApplyLoopTheme?: (theme: string | null) => void;
  onApplyNonLoopTheme?: (theme: string | null) => void;
  isScriptValid?: boolean;
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
  onShowQualityPanel,
  onTestElementMapping,
  onTestSmartStepGenerator,
  loopTheme,
  nonLoopTheme,
  onApplyLoopTheme,
  onApplyNonLoopTheme,
  isScriptValid = true,
}) => {
  const { message } = App.useApp();
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
        },
        {
          key: '2',
          label: '外观与调试',
          extra: <ToolOutlined />,
          children: (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Divider orientation="left" plain><SkinOutlined /> 外观换肤</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>循环体皮肤</div>
                  <Select
                    size="small"
                    value={loopTheme ?? ''}
                    placeholder="默认皮肤"
                    onChange={(v) => onApplyLoopTheme?.(v || null)}
                    options={[
                      { label: '默认', value: '' },
                      { label: '玫瑰（rose）', value: 'rose' },
                      { label: '晴空（sky）', value: 'sky' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>非循环步骤皮肤</div>
                  <Select
                    size="small"
                    value={nonLoopTheme ?? ''}
                    placeholder="默认皮肤"
                    onChange={(v) => onApplyNonLoopTheme?.(v || null)}
                    options={[
                      { label: '默认', value: '' },
                      { label: '玫瑰（rose）', value: 'rose' },
                      { label: '晴空（sky）', value: 'sky' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              <Divider orientation="left" plain><ToolOutlined /> 调试工具</Divider>
              
              {/* 分布式脚本质量检查按钮 */}
              <Button
                size="small"
                type={isScriptValid ? "default" : "primary"}
                danger={!isScriptValid}
                block
                icon={isScriptValid ? <CheckCircleOutlined /> : <WarningOutlined />}
                onClick={onShowQualityPanel}
                disabled={steps.length === 0}
              >
                {isScriptValid ? "质量检查通过" : "需要质量修复"} ({steps.length} 步骤)
              </Button>

              <Row gutter={8} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Button
                    size="small"
                    block
                    icon={<BulbOutlined />}
                    onClick={() => {
                      console.log("🧪 运行元素名称映射测试...");
                      onTestElementMapping?.();
                      message.info("元素名称映射测试功能暂时禁用");
                    }}
                  >
                    测试映射
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    size="small"
                    block
                    icon={<RobotOutlined />}
                    onClick={() => {
                      console.log("🧪 运行智能步骤生成器测试...");
                      onTestSmartStepGenerator?.();
                    }}
                  >
                    测试生成
                  </Button>
                </Col>
              </Row>
            </Space>
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
