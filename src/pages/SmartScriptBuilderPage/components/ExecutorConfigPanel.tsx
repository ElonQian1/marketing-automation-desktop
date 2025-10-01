import React from "react";
import { Card, Row, Col, Switch, InputNumber, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ExecutorConfig {
  default_timeout_ms: number;
  default_retry_count: number;
  page_recognition_enabled: boolean;
  auto_verification_enabled: boolean;
  smart_recovery_enabled: boolean;
  detailed_logging: boolean;
}

interface ExecutorConfigPanelProps {
  config: ExecutorConfig;
  onChange: (config: ExecutorConfig) => void;
}

const ExecutorConfigPanel: React.FC<ExecutorConfigPanelProps> = ({
  config,
  onChange,
}) => {
  const updateConfig = (key: keyof ExecutorConfig, value: any) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <Card
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          执行器配置
        </span>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Switch
              checked={config.page_recognition_enabled}
              onChange={(checked) =>
                updateConfig("page_recognition_enabled", checked)
              }
            />
            <div style={{ fontSize: 12, marginTop: 4 }}>页面识别</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Switch
              checked={config.auto_verification_enabled}
              onChange={(checked) =>
                updateConfig("auto_verification_enabled", checked)
              }
            />
            <div style={{ fontSize: 12, marginTop: 4 }}>自动验证</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Switch
              checked={config.smart_recovery_enabled}
              onChange={(checked) =>
                updateConfig("smart_recovery_enabled", checked)
              }
            />
            <div style={{ fontSize: 12, marginTop: 4 }}>智能恢复</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Switch
              checked={config.detailed_logging}
              onChange={(checked) => updateConfig("detailed_logging", checked)}
            />
            <div style={{ fontSize: 12, marginTop: 4 }}>详细日志</div>
          </div>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              默认超时(ms)
            </Text>
            <InputNumber
              size="small"
              value={config.default_timeout_ms}
              onChange={(value) =>
                updateConfig("default_timeout_ms", value || 10000)
              }
              min={1000}
              max={60000}
              step={1000}
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>
        </Col>
        <Col span={12}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              默认重试次数
            </Text>
            <InputNumber
              size="small"
              value={config.default_retry_count}
              onChange={(value) =>
                updateConfig("default_retry_count", value || 3)
              }
              min={1}
              max={10}
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default ExecutorConfigPanel;