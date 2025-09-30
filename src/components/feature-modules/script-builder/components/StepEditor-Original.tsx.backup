/**
 * 步骤编辑器组件
 * 提供步骤参数的详细编辑功能
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Button,
  Tabs,
  Row,
  Col,
  Card,
  Divider,
  Alert,
  Tooltip,
  Tag,
  Collapse,
} from 'antd';
import {
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
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

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

/**
 * StepEditor 组件属性
 */
interface StepEditorProps {
  /** 是否显示编辑器 */
  visible: boolean;
  /** 编辑的步骤数据 */
  step: ScriptStep | null;
  /** 是否为新建步骤 */
  isNew?: boolean;
  /** 验证结果 */
  validation?: StepValidation;
  /** 可用的步骤类型 */
  availableStepTypes?: StepType[];
  /** 关闭编辑器 */
  onClose: () => void;
  /** 保存步骤 */
  onSave: (step: ScriptStep) => void;
  /** 测试步骤 */
  onTest?: (step: ScriptStep) => void;
}

/**
 * 步骤类型配置
 */
const STEP_TYPE_CONFIG: Record<StepType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  tap: {
    name: '点击操作',
    description: '点击屏幕上的元素或坐标',
    icon: '👆',
    color: 'blue',
  },
  input: {
    name: '文本输入',
    description: '在输入框中输入文本',
    icon: '✏️',
    color: 'green',
  },
  swipe: {
    name: '滑动操作',
    description: '在屏幕上进行滑动手势',
    icon: '👆',
    color: 'orange',
  },
  wait: {
    name: '等待操作',
    description: '等待指定时间或条件',
    icon: '⏱️',
    color: 'purple',
  },
  screenshot: {
    name: '截图操作',
    description: '保存当前屏幕截图',
    icon: '📷',
    color: 'cyan',
  },
  loop: {
    name: '循环操作',
    description: '重复执行一组步骤',
    icon: '🔄',
    color: 'magenta',
  },
  condition: {
    name: '条件判断',
    description: '根据条件决定执行路径',
    icon: '❓',
    color: 'yellow',
  },
  custom: {
    name: '自定义操作',
    description: '执行自定义脚本或命令',
    icon: '⚙️',
    color: 'gray',
  },
};

/**
 * 步骤编辑器组件
 */
export const StepEditor: React.FC<StepEditorProps> = ({
  visible,
  step,
  isNew = false,
  validation,
  availableStepTypes = Object.keys(STEP_TYPE_CONFIG) as StepType[],
  onClose,
  onSave,
  onTest,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [currentStep, setCurrentStep] = useState<ScriptStep | null>(null);

  // 重置表单数据
  useEffect(() => {
    if (step && visible) {
      setCurrentStep({ ...step });
      form.setFieldsValue({
        name: step.name,
        description: step.description,
        type: step.type,
        enabled: step.enabled,
        ...step.parameters,
      });
    } else if (!step && visible) {
      // 新建步骤
      const newStep: ScriptStep = {
        id: Date.now().toString(),
        type: 'tap',
        name: '新步骤',
        description: '',
        parameters: {
          delay: 1000,
          retries: 3,
          timeout: 10000,
        },
        status: 'pending',
        enabled: true,
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setCurrentStep(newStep);
      form.setFieldsValue(newStep);
    }
  }, [step, visible, form]);

  // 处理步骤类型变更
  const handleTypeChange = (type: StepType) => {
    if (!currentStep) return;

    const updatedStep = {
      ...currentStep,
      type,
      name: STEP_TYPE_CONFIG[type].name,
      parameters: {
        ...currentStep.parameters,
        // 根据类型设置默认参数
        ...(type === 'input' && {
          text: '',
          clearFirst: true,
          inputMethod: 'type',
          hidden: false,
        }),
        ...(type === 'swipe' && {
          direction: 'down',
          distance: 500,
          duration: 1000,
          velocity: 'normal',
        }),
        ...(type === 'wait' && {
          duration: 3000,
        }),
        ...(type === 'loop' && {
          iterations: 3,
          interval: 1000,
        }),
      },
    };

    setCurrentStep(updatedStep);
    form.setFieldsValue(updatedStep);
  };

  // 处理表单值变更
  const handleFormChange = (changedFields: any, allFields: any) => {
    if (!currentStep) return;

    const updatedStep = {
      ...currentStep,
      ...allFields,
      updatedAt: Date.now(),
    };

    setCurrentStep(updatedStep);
  };

  // 保存步骤
  const handleSave = () => {
    form.validateFields().then((values) => {
      if (!currentStep) return;

      const updatedStep: ScriptStep = {
        ...currentStep,
        ...values,
        parameters: {
          ...currentStep.parameters,
          ...values,
        },
        updatedAt: Date.now(),
      };

      onSave(updatedStep);
      onClose();
    });
  };

  // 测试步骤
  const handleTest = () => {
    if (!currentStep || !onTest) return;
    
    form.validateFields().then((values) => {
      const testStep: ScriptStep = {
        ...currentStep,
        ...values,
        parameters: {
          ...currentStep.parameters,
          ...values,
        },
      };
      
      onTest(testStep);
    });
  };

  // 渲染基础配置
  const renderBasicConfig = () => (
    <Card title="基础配置" size="small">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item
            name="type"
            label="步骤类型"
            rules={[{ required: true, message: '请选择步骤类型' }]}
          >
            <Select onChange={handleTypeChange}>
              {availableStepTypes.map(type => (
                <Option key={type} value={type}>
                  <Space>
                    <span>{STEP_TYPE_CONFIG[type].icon}</span>
                    <span>{STEP_TYPE_CONFIG[type].name}</span>
                    <Tag color={STEP_TYPE_CONFIG[type].color}>
                      {type}
                    </Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="name"
            label="步骤名称"
            rules={[
              { required: true, message: '请输入步骤名称' },
              { max: 50, message: '名称长度不能超过50字符' },
            ]}
          >
            <Input placeholder="输入步骤名称" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="description"
            label="步骤描述"
          >
            <TextArea 
              rows={3} 
              placeholder="输入步骤描述（可选）"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 渲染参数配置
  const renderParameterConfig = () => {
    if (!currentStep) return null;

    switch (currentStep.type) {
      case 'tap':
        return renderTapParameters();
      case 'input':
        return renderInputParameters();
      case 'swipe':
        return renderSwipeParameters();
      case 'wait':
        return renderWaitParameters();
      case 'loop':
        return renderLoopParameters();
      default:
        return renderGenericParameters();
    }
  };

  // 点击参数配置
  const renderTapParameters = () => (
    <Card title="点击参数" size="small">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            name="clickType"
            label="点击类型"
            initialValue="single"
          >
            <Select>
              <Option value="single">单击</Option>
              <Option value="double">双击</Option>
              <Option value="long">长按</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="holdDuration"
            label="长按时间(ms)"
            dependencies={['clickType']}
          >
            <InputNumber
              min={0}
              max={10000}
              placeholder="仅长按时有效"
              disabled={form.getFieldValue('clickType') !== 'long'}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="coordinatesX" label="X坐标">
            <InputNumber min={0} max={9999} placeholder="像素位置" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="coordinatesY" label="Y坐标">
            <InputNumber min={0} max={9999} placeholder="像素位置" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 输入参数配置
  const renderInputParameters = () => (
    <Card title="输入参数" size="small">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item
            name="text"
            label="输入文本"
            rules={[{ required: true, message: '请输入要输入的文本' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="输入要填写的文本内容"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            name="clearFirst"
            label="清空现有文本"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            name="hidden"
            label="隐藏输入内容"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            name="inputMethod"
            label="输入方式"
            initialValue="type"
          >
            <Select>
              <Option value="type">逐字输入</Option>
              <Option value="paste">粘贴输入</Option>
              <Option value="replace">替换文本</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 滑动参数配置
  const renderSwipeParameters = () => (
    <Card title="滑动参数" size="small">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            name="direction"
            label="滑动方向"
            initialValue="down"
          >
            <Select>
              <Option value="up">向上</Option>
              <Option value="down">向下</Option>
              <Option value="left">向左</Option>
              <Option value="right">向右</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="velocity"
            label="滑动速度"
            initialValue="normal"
          >
            <Select>
              <Option value="slow">慢速</Option>
              <Option value="normal">正常</Option>
              <Option value="fast">快速</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="distance"
            label="滑动距离(px)"
            initialValue={500}
          >
            <InputNumber min={50} max={2000} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="duration"
            label="滑动时长(ms)"
            initialValue={1000}
          >
            <InputNumber min={100} max={5000} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 等待参数配置
  const renderWaitParameters = () => (
    <Card title="等待参数" size="small">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item
            name="duration"
            label="等待时间(ms)"
            rules={[{ required: true, message: '请输入等待时间' }]}
            initialValue={3000}
          >
            <InputNumber<number>
              min={100} 
              max={300000} 
              style={{ width: '100%' }}
              formatter={(value) => `${value} ms`}
              parser={(value) => {
                const v = (value ?? '').toString().replace(' ms', '').trim();
                const n = Number(v);
                return isNaN(n) ? 0 : n;
              }}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="conditionType"
            label="等待条件"
            initialValue="time"
          >
            <Select>
              <Option value="time">仅等待时间</Option>
              <Option value="element_visible">等待元素出现</Option>
              <Option value="element_gone">等待元素消失</Option>
              <Option value="text_present">等待文本出现</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 循环参数配置
  const renderLoopParameters = () => (
    <Card title="循环参数" size="small">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item
            name="iterations"
            label="循环次数"
            rules={[{ required: true, message: '请输入循环次数' }]}
            initialValue={3}
          >
            <InputNumber min={1} max={100} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="interval"
            label="循环间隔(ms)"
            initialValue={1000}
          >
            <InputNumber min={0} max={10000} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // 通用参数配置
  const renderGenericParameters = () => (
    <Card title="参数配置" size="small">
      <Alert
        message="该步骤类型暂无特殊参数配置"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
    </Card>
  );

  // 渲染高级配置
  const renderAdvancedConfig = () => (
    <Collapse defaultActiveKey={['timing', 'error']}>
      <Panel header="执行时机" key="timing">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="delay"
              label="延迟时间(ms)"
              initialValue={1000}
              tooltip="步骤执行前的等待时间"
            >
              <InputNumber min={0} max={60000} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="timeout"
              label="超时时间(ms)"
              initialValue={10000}
              tooltip="步骤执行的最大等待时间"
            >
              <InputNumber min={1000} max={300000} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="retries"
              label="重试次数"
              initialValue={3}
              tooltip="失败时的重试次数"
            >
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Panel>

      <Panel header="错误处理" key="error">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="screenshot"
              label="自动截图"
              valuePropName="checked"
              initialValue={false}
              tooltip="执行步骤时自动保存截图"
            >
              <Switch />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="continueOnError"
              label="错误时继续"
              valuePropName="checked"
              initialValue={false}
              tooltip="步骤失败时是否继续执行后续步骤"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Panel>
    </Collapse>
  );

  // 渲染验证信息
  const renderValidation = () => {
    if (!validation) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        {!validation.isValid && validation.errors.length > 0 && (
          <Alert
            message="配置错误"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 8 }}
          />
        )}

        {validation.warnings.length > 0 && (
          <Alert
            message="配置警告"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 8 }}
          />
        )}

        {validation.suggestions.length > 0 && (
          <Alert
            message="优化建议"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            }
            type="info"
            showIcon
          />
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <span>{isNew ? '添加' : '编辑'}步骤</span>
          {currentStep && (
            <Tag color={STEP_TYPE_CONFIG[currentStep.type].color}>
              {STEP_TYPE_CONFIG[currentStep.type].icon} {STEP_TYPE_CONFIG[currentStep.type].name}
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        onTest && (
          <Button
            key="test"
            icon={<PlayCircleOutlined />}
            onClick={handleTest}
            disabled={validation && !validation.isValid}
          >
            测试
          </Button>
        ),
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          disabled={validation && !validation.isValid}
        >
          保存
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        {renderValidation()}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基础配置" key="basic">
            {renderBasicConfig()}
          </TabPane>

          <TabPane tab="参数配置" key="parameters">
            {renderParameterConfig()}
          </TabPane>

          <TabPane tab="高级设置" key="advanced">
            {renderAdvancedConfig()}
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};