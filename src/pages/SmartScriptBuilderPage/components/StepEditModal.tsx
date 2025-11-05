// src/pages/SmartScriptBuilderPage/components/StepEditModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Space,
  Tag,
  Divider,
  Alert,
  Card,
  Button,
  Typography,
  Collapse,
  Tabs,
  message,
} from "antd";
import { SettingOutlined, EyeOutlined, BugOutlined, CodeOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd/es/form";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import { SmartActionType } from "../../../types/smartComponents";
import { SMART_ACTION_CONFIGS } from "../helpers/constants";
import { LaunchAppSmartComponent } from "../../../components/smart/LaunchAppSmartComponent";
import type { LaunchAppComponentParams } from "../../../types/smartComponents";
import { renderParameterInput } from "../helpers/parameterRenderers";
import { noDragProps } from "../../../components/universal-ui/dnd/noDrag";
import { OverlayThemeSwitch, useOverlayTheme } from "../../../components/ui/overlay";
import { 
  ParameterInferenceIndicator,
  useParameterInferenceStatus 
} from "../../../modules/structural-matching";

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

interface StepEditModalProps {
  open: boolean;
  editingStep?: ExtendedSmartScriptStep | null;
  form: FormInstance;
  currentDeviceId?: string;
  onOk: () => void;
  onCancel: () => void;
  onShowNavigationModal: () => void;
  onShowPageAnalyzer: () => void;
}

const StepEditModal: React.FC<StepEditModalProps> = ({
  open,
  editingStep,
  form,
  currentDeviceId,
  onOk,
  onCancel,
  onShowNavigationModal,
  onShowPageAnalyzer,
}) => {
  // 使用通用 Overlay 主题 Hook（默认 inherit：跟随 GUI 全局主题）
  const { theme, setTheme, classes, popupProps } = useOverlayTheme('inherit');
  
  // 添加参数推断状态 - 使用步骤ID而不是步骤对象
  const stepId = editingStep?.id || 'temp-step';
  const inferenceStatus = useParameterInferenceStatus(stepId);
  const xmlSnapshot = Form.useWatch('xmlSnapshot', form);
  
  // 检查是否有XML数据可以显示
  const hasXmlData = useMemo(() => {
    return xmlSnapshot && typeof xmlSnapshot === 'string' && xmlSnapshot.trim().length > 0;
  }, [xmlSnapshot]);
  
  // 检查是否显示调试面板
  const shouldShowDebugPanel = useMemo(() => {
    return hasXmlData || (inferenceStatus.status !== 'disabled' && inferenceStatus.status !== 'not_needed');
  }, [hasXmlData, inferenceStatus.status]);

  const titleNode = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{editingStep ? "编辑智能步骤" : "添加智能步骤"}</span>
      <OverlayThemeSwitch value={theme} onChange={setTheme} />
    </div>
  );
  return (
    <Modal
      title={titleNode}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={600}
      maskClosable={false}
      zIndex={1000} // 设置基础z-index，确保子模态框可以显示在其上方
      className={classes.className}
      rootClassName={classes.rootClassName}
    >
      <div {...noDragProps}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          step_type: SmartActionType.SMART_FIND_ELEMENT, // 默认选择智能元素查找
          name: "智能元素查找", // 默认步骤名称
          wait_after: 1000,
        }}
      >
        <Form.Item
          name="step_type"
          label="操作类型"
          rules={[{ required: true, message: "请选择操作类型" }]}
        >
          <Select
            placeholder="请选择智能操作类型"
            {...popupProps}
          >
            {Object.entries(SMART_ACTION_CONFIGS).map(([key, config]) => (
              <Option key={key} value={key}>
                <Space>
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                  <Tag color={config.color}>{config.category}</Tag>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="步骤名称 (可选)"
              help="默认为对应操作类型名称"
            >
              <Input placeholder="步骤名称将自动设置为操作类型名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label="步骤描述">
              <Input placeholder="请输入步骤描述" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item dependencies={["step_type"]} noStyle>
          {({ getFieldValue }) => {
            const stepType = getFieldValue("step_type");
            const config = SMART_ACTION_CONFIGS[stepType];

            if (!config) return null;

            // 特殊处理：如果是LAUNCH_APP类型，使用专门的智能组件
            if (stepType === SmartActionType.LAUNCH_APP) {
              return (
                <div>
                  <Divider orientation="left">智能应用启动配置</Divider>
                  <Alert
                    message="使用智能应用启动组件，提供完整的应用选择和启动功能"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <LaunchAppSmartComponent
                    deviceId={currentDeviceId}
                    value={
                      editingStep?.parameters as LaunchAppComponentParams
                    }
                    onChange={(params) => {
                      // 同步更新表单数据
                      form.setFieldsValue(params);
                    }}
                    onExecute={async (params) => {
                      // 这里可以添加执行逻辑
                      message.success("应用启动测试完成");
                      return true;
                    }}
                  />
                </div>
              );
            }

            // 特殊处理：如果是SMART_NAVIGATION类型，显示配置按钮
            if (stepType === SmartActionType.SMART_NAVIGATION) {
              return (
                <div>
                  <Divider orientation="left">智能导航配置</Divider>
                  <Alert
                    message="智能导航支持自动识别导航栏并点击指定按钮，适用于底部导航栏、顶部导航栏等场景"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Card style={{ marginBottom: 16, textAlign: 'center' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SettingOutlined />}
                      onClick={onShowNavigationModal}
                    >
                      打开智能导航配置器
                    </Button>
                    <br />
                    <Text
                      type="secondary"
                      style={{ marginTop: 8, display: "block" }}
                    >
                      包含向导模式（推荐新手）和专业模式（支持自定义配置）
                    </Text>
                  </Card>
                </div>
              );
            }

            // 特殊处理：如果是SMART_FIND_ELEMENT类型，显示智能页面分析器
            if (stepType === SmartActionType.SMART_FIND_ELEMENT) {
              return (
                <div>
                  <Divider orientation="left">智能元素查找配置</Divider>
                  <Alert
                    message="智能元素查找通过分析当前页面UI结构，自动识别可操作元素并支持智能去重和分类，提供精确的元素定位能力"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Card style={{ marginBottom: 16, textAlign: 'center' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<EyeOutlined />}
                      onClick={onShowPageAnalyzer}
                    >
                      打开智能页面分析器
                    </Button>
                    <br />
                    <Text
                      type="secondary"
                      style={{ marginTop: 8, display: "block" }}
                    >
                      配置设备连接并分析页面，智能识别可操作元素
                    </Text>
                  </Card>
                </div>
              );
            }

            // 轻点（TAP）专属：提供常用预设选择，并可自动回填参数
            if (stepType === SmartActionType.TAP) {
              const renderGenericParams = () => (
                <div>
                  <Divider orientation="left">参数配置</Divider>
                  <Alert
                    message={config.description}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  {config.parameters?.map((param) => (
                    <Form.Item
                      key={param.key}
                      name={param.key}
                      label={param.label}
                      rules={
                        param.required
                          ? [
                              {
                                required: true,
                                message: `请输入${param.label}`,
                              },
                            ]
                          : []
                      }
                      initialValue={param.default}
                    >
                      {renderParameterInput(param, undefined, () => {})}
                    </Form.Item>
                  ))}

                  {config.advanced && config.advanced.length > 0 && (
                    <Collapse size="small" style={{ marginTop: 16 }}>
                      <Panel header="高级配置" key="advanced">
                        {config.advanced.map((param) => (
                          <Form.Item
                            key={param.key}
                            name={param.key}
                            label={param.label}
                            initialValue={param.default}
                          >
                            {renderParameterInput(param, undefined, () => {})}
                          </Form.Item>
                        ))}
                      </Panel>
                    </Collapse>
                  )}
                </div>
              );

              return (
                <div>
                  <Divider orientation="left">轻点预设</Divider>
                  <Alert
                    message="选择常用预设快速填写参数；仍可在下方进一步调整。长按会自动设置较长的按住时长。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <Space wrap>
                    <Button
                      onClick={() => {
                        // 轻点中心
                        form.setFieldsValue({
                          position: "center",
                          x: undefined,
                          y: undefined,
                          duration_ms: 100,
                          tap_mode: "single_tap",
                        } as any);
                      }}
                    >
                      👆 轻点屏幕中心
                    </Button>
                    <Button
                      onClick={() => {
                        // 长按中心
                        form.setFieldsValue({
                          position: "center",
                          x: undefined,
                          y: undefined,
                          duration_ms: 800,
                          tap_mode: "long_press",
                        } as any);
                      }}
                    >
                      👆 长按屏幕中心
                    </Button>
                    <Button
                      onClick={() => {
                        // 切换到绝对坐标，方便用户输入
                        form.setFieldsValue({ position: "absolute" } as any);
                      }}
                    >
                      🛠️ 自定义坐标（切换为绝对）
                    </Button>
                  </Space>

                  {renderGenericParams()}
                </div>
              );
            }

            return (
              <div>
                <Divider orientation="left">参数配置</Divider>
                  <Alert
                    message={config.description}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />                {config.parameters?.map((param) => (
                  <Form.Item
                    key={param.key}
                    name={param.key}
                    label={param.label}
                    rules={
                      param.required
                        ? [
                            {
                              required: true,
                              message: `请输入${param.label}`,
                            },
                          ]
                        : []
                    }
                    initialValue={param.default}
                  >
                    {renderParameterInput(param, undefined, () => {})}
                  </Form.Item>
                ))}

                {config.advanced && config.advanced.length > 0 && (
                  <Collapse size="small" style={{ marginTop: 16 }}>
                    <Panel header="高级配置" key="advanced">
                      {config.advanced.map((param) => (
                        <Form.Item
                          key={param.key}
                          name={param.key}
                          label={param.label}
                          initialValue={param.default}
                        >
                          {renderParameterInput(param, undefined, () => {})}
                        </Form.Item>
                      ))}
                    </Panel>
                  </Collapse>
                )}
              </div>
            );
          }}
        </Form.Item>

        {/* 🆕 调试与分析面板 */}
        {shouldShowDebugPanel && (
          <Divider orientation="left" style={{ marginTop: 32, marginBottom: 16 }}>
            <Space>
              <BugOutlined />
              调试与分析
            </Space>
          </Divider>
        )}

        {shouldShowDebugPanel && (
          <Tabs
            size="small"
            style={{ marginBottom: 16 }}
            items={[
              ...(hasXmlData ? [{
                key: 'xml-snapshot',
                label: (
                  <Space size="small">
                    <CodeOutlined />
                    XML快照
                  </Space>
                ),
                children: (
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    {xmlSnapshot ? (
                      <Card size="small" title="XML快照预览">
                        <pre style={{
                          fontSize: '12px',
                          maxHeight: '300px',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          background: '#f6f8fa',
                          padding: '12px',
                          borderRadius: '4px'
                        }}>
                          {typeof xmlSnapshot === 'string' ? 
                            (xmlSnapshot.length > 1000 ? xmlSnapshot.substring(0, 1000) + '\n\n... [数据已截断]' : xmlSnapshot) :
                            JSON.stringify(xmlSnapshot, null, 2).substring(0, 1000)
                          }
                        </pre>
                      </Card>
                    ) : (
                      <Alert
                        type="info"
                        message="没有XML快照数据"
                        description="此步骤尚未生成XML快照数据。"
                        showIcon
                      />
                    )}
                  </div>
                ),
              }] : []),
              ...(inferenceStatus.status === 'pending' || inferenceStatus.status === 'completed' || inferenceStatus.status === 'failed' ? [{
                key: 'parameter-inference',
                label: (
                  <Space size="small">
                    <SettingOutlined />
                    参数推断
                    {inferenceStatus.inferenceResult && (
                      <Tag color={inferenceStatus.status === 'completed' ? 'green' : inferenceStatus.status === 'failed' ? 'red' : 'orange'}>
                        {inferenceStatus.status === 'completed' ? '已完成' : 
                         inferenceStatus.status === 'failed' ? '失败' : '处理中'}
                      </Tag>
                    )}
                  </Space>
                ),
                children: (
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    <ParameterInferenceIndicator stepCardId={stepId} showDetails={true} />
                  </div>
                ),
              }] : []),
            ]}
          />
        )}

        {/* 🆕 隐藏字段：保存元素属性用于指纹匹配 */}
        <Form.Item name="text" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="element_text" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="element_type" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="resource_id" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="content_desc" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="bounds" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="smartDescription" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="smartAnalysis" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="class_name" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="clickable" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="parent" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="siblings" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="xpath" hidden>
          <Input />
        </Form.Item>

        {/* 🆕 XML缓存和增强信息隐藏字段 */}
        <Form.Item name="xmlCacheId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="xmlContent" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="xmlTimestamp" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="deviceId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="deviceName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="elementSummary" hidden>
          <Input />
        </Form.Item>
        {/* 🆕 自包含：注册隐藏字段以承载对象类型的 xmlSnapshot，确保保存时可获取 */}
        <Form.Item name="xmlSnapshot" hidden>
          <Input />
        </Form.Item>
      </Form>
      </div>
    </Modal>
  );
};

export default StepEditModal;