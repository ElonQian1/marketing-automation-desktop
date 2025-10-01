import React from 'react';
import { Alert, List, Typography, Space, theme } from 'antd';
import {
  BulbOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * 设备使用说明组件
 * 使用原生 Ant Design 组件展示使用指南
 */
export const DeviceInstructions: React.FC = () => {
  const { token } = theme.useToken();

  const instructions = [
    '系统支持最多 10 台设备同时连接，确保高效任务执行',
    '只有在线状态的设备才能参与任务执行',
    '任务会根据设备状态智能分配到可用设备',
    '设备断线时系统会自动重连，无需手动干预',
    '建议保持设备网络连接稳定，避免任务执行中断'
  ];

  return (
    <Alert
      message={
        <Space align="center">
          <BulbOutlined style={{ color: token.colorInfo }} />
          <Text strong>设备管理指南</Text>
        </Space>
      }
      description={
        <List
          size="small"
          dataSource={instructions}
          renderItem={(item) => (
            <List.Item style={{ padding: `${token.paddingXS}px 0` }}>
              <Space align="start">
                <CheckOutlined 
                  style={{ 
                    color: token.colorSuccess,
                    marginTop: token.marginXXS
                  }} 
                />
                <Text type="secondary">{item}</Text>
              </Space>
            </List.Item>
          )}
        />
      }
      type="info"
      showIcon={false}
      style={{ 
        borderRadius: token.borderRadiusLG,
        background: token.colorInfoBg,
        border: `1px solid ${token.colorInfoBorder}`
      }}
    />
  );
};