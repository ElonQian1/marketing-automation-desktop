import React from "react";
import { Form, Input, Collapse, Space, Typography, Row, Col } from "antd";
import type { FormInstance } from "antd/es/form";

const { Panel } = Collapse;
const { Text } = Typography;

interface ParametersFormSectionProps {
  form: FormInstance;
  stepType: string;
  config: any;
}

/**
 * 参数表单区域 - 原生 Ant Design 版本  
 * 移除所有 Tailwind CSS 类名，使用原生样式
 */
export const ParametersFormSection: React.FC<ParametersFormSectionProps> = ({
  form,
  stepType,
  config,
}) => {
  if (!config?.parameters) return null;

  return (
    <div>
      <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>
        步骤参数配置
      </Text>
      
      <Row gutter={16}>
        {Object.entries(config.parameters).map(([key, paramConfig]: [string, any]) => (
          <Col span={12} key={key}>
            <Form.Item
              name={key}
              label={paramConfig.label || key}
              help={paramConfig.description}
              rules={[
                {
                  required: paramConfig.required,
                  message: `请输入${paramConfig.label || key}`,
                },
              ]}
            >
              {paramConfig.type === "text" ? (
                <Input placeholder={paramConfig.placeholder} />
              ) : (
                <Input placeholder={`请输入${paramConfig.label || key}`} />
              )}
            </Form.Item>
          </Col>
        ))}
      </Row>

      <Collapse size="small" style={{ marginTop: 16 }}>
        <Panel header="高级参数设置" key="advanced">
          <Form.Item
            name="wait_after"
            label="执行后等待时间 (ms)"
            help="步骤执行完成后的等待时间，单位毫秒"
          >
            <Input type="number" placeholder="1000" />
          </Form.Item>
          
          <Form.Item
            name="retry_count"
            label="重试次数"
            help="失败时的重试次数，默认为 3"
          >
            <Input type="number" placeholder="3" />
          </Form.Item>
          
          <Form.Item
            name="timeout_ms"
            label="超时时间 (ms)"
            help="单步执行超时时间，默认为 10000 毫秒"
          >
            <Input type="number" placeholder="10000" />
          </Form.Item>
          
          <Form.Item
            name="error_handling"
            label="错误处理策略"
            help="失败时的处理策略：continue(继续), stop(停止), retry(重试)"
          >
            <Input placeholder="continue" />
          </Form.Item>
        </Panel>
      </Collapse>
    </div>
  );
};