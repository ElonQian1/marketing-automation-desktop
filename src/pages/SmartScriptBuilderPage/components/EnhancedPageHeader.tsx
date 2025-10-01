import React from "react";
import { Row, Col, Typography, Space, Select, Button, Divider, Tag, Card, Switch } from "antd";
import { 
  AndroidOutlined, 
  SyncOutlined, 
  RocketOutlined, 
  SettingOutlined 
} from "@ant-design/icons";
import { Device, DeviceStatus } from "../../../domain/adb/entities/Device";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

export interface ExecutorConfig {
  default_timeout_ms: number;
  default_retry_count: number;
  page_recognition_enabled: boolean;
  auto_verification_enabled: boolean;
  smart_recovery_enabled: boolean;
  detailed_logging: boolean;
}

export interface PageHeaderProps {
  devices: Device[];
  currentDeviceId: string | null;
  onDeviceChange: (deviceId: string) => void;
  onRefreshDevices: () => void;
  onQuickAddApp?: () => void;
  executorConfig: ExecutorConfig;
  setExecutorConfig: React.Dispatch<React.SetStateAction<ExecutorConfig>>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  devices,
  currentDeviceId,
  onDeviceChange,
  onRefreshDevices,
  onQuickAddApp,
  executorConfig,
  setExecutorConfig,
}) => {
  return (
    <>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ marginBottom: 8 }}>
              🤖 智能脚本构建器
            </Title>
            <Paragraph type="secondary">
              基于AI的智能自动化脚本构建系统，支持页面识别、元素智能定位、操作验证和智能恢复
            </Paragraph>
          </Col>
          <Col>
            <Space>
              <Text type="secondary">目标设备:</Text>
              <Select
                placeholder="选择设备"
                value={currentDeviceId || undefined}
                onChange={(value) => onDeviceChange(value)}
                style={{ width: 240 }}
                loading={devices.length === 0}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Button
                        type="text"
                        icon={<SyncOutlined />}
                        onClick={() => onRefreshDevices()}
                        size="small"
                      >
                        刷新设备
                      </Button>
                    </Space>
                  </>
                )}
              >
                {devices.map((device) => (
                  <Option key={device.id} value={device.id}>
                    <Space>
                      <AndroidOutlined
                        style={{
                          color:
                            device.status === DeviceStatus.ONLINE
                              ? "#52c41a"
                              : "#d9d9d9",
                        }}
                      />
                      <Text>{device.id}</Text>
                      <Tag
                        color={
                          device.status === DeviceStatus.ONLINE
                            ? "success"
                            : "default"
                        }
                      >
                        {device.status === DeviceStatus.ONLINE
                          ? "在线"
                          : "离线"}
                      </Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
              {onQuickAddApp && (
                <Button
                  icon={<RocketOutlined />}
                  onClick={onQuickAddApp}
                  disabled={!currentDeviceId}
                >
                  快速添加应用
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* 执行器配置 */}
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
                checked={executorConfig.page_recognition_enabled}
                onChange={(checked) =>
                  setExecutorConfig((prev) => ({
                    ...prev,
                    page_recognition_enabled: checked,
                  }))
                }
              />
              <div style={{ marginTop: 4, fontSize: 12 }}>页面识别</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Switch
                checked={executorConfig.auto_verification_enabled}
                onChange={(checked) =>
                  setExecutorConfig((prev) => ({
                    ...prev,
                    auto_verification_enabled: checked,
                  }))
                }
              />
              <div style={{ marginTop: 4, fontSize: 12 }}>自动验证</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Switch
                checked={executorConfig.smart_recovery_enabled}
                onChange={(checked) =>
                  setExecutorConfig((prev) => ({
                    ...prev,
                    smart_recovery_enabled: checked,
                  }))
                }
              />
              <div style={{ marginTop: 4, fontSize: 12 }}>智能恢复</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Switch
                checked={executorConfig.detailed_logging}
                onChange={(checked) =>
                  setExecutorConfig((prev) => ({
                    ...prev,
                    detailed_logging: checked,
                  }))
                }
              />
              <div style={{ marginTop: 4, fontSize: '12px' }}>详细日志</div>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default PageHeader;