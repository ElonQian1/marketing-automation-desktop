import React from 'react';
import { Card, Typography, Empty, Space, Button } from 'antd';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AccountMonitoringModuleProps {
  onlineDevices: any[];
  selectedDevice: any;
  refreshDevices: () => void;
}

/**
 * 账号监控模块
 * 用于监控指定小红书账号或视频的评论和互动
 */
export const AccountMonitoringModule: React.FC<AccountMonitoringModuleProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Title level={3}>
          <UserOutlined className="mr-2" />
          账号监控
        </Title>
        <Text type="secondary">
          监控指定账号或视频的评论区，获取潜在客户线索
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 账号监控 */}
        <Card title="账号监控" extra={<Button type="primary" size="small">添加账号</Button>}>
          <Empty 
            image={<UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
            description="暂无监控账号"
          >
            <Text type="secondary" className="text-sm">
              添加要监控的小红书账号，系统将实时监控其动态和评论
            </Text>
          </Empty>
        </Card>

        {/* 视频监控 */}
        <Card title="视频监控" extra={<Button type="primary" size="small">添加视频</Button>}>
          <Empty 
            image={<VideoCameraOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
            description="暂无监控视频"
          >
            <Text type="secondary" className="text-sm">
              添加要监控的小红书视频链接，系统将持续监控评论区
            </Text>
          </Empty>
        </Card>
      </div>

      {/* 监控任务列表 */}
      <Card title="活动监控任务">
        <Empty description="暂无活动监控任务">
          <Space>
            <Button type="primary">添加账号监控</Button>
            <Button>添加视频监控</Button>
          </Space>
        </Empty>
      </Card>
    </div>
  );
};