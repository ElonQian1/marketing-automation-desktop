// src/components/native-dashboard/NativeAntDashboard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 原生Ant Design仪表板组件
 * 使用纯原生Ant Design组件，无自定义样式
 */

import React from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  List,
  Avatar,
  Typography,
  Space,
  Tag,
  Button,
  Alert,
  Timeline,
} from 'antd';
import {
  MobileOutlined,
  UserOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const mockDevices = [
  { id: '1', name: 'Xiaomi 13 Pro', status: 'online', battery: 85 },
  { id: '2', name: 'Samsung Galaxy S23', status: 'offline', battery: 42 },
  { id: '3', name: 'OnePlus 11', status: 'online', battery: 67 },
  { id: '4', name: 'iPhone 14 Pro', status: 'unauthorized', battery: 91 },
];

const mockTasks = [
  { id: '1', title: '小红书关注任务', status: 'running', progress: 75 },
  { id: '2', title: '联系人导入', status: 'completed', progress: 100 },
  { id: '3', title: '脚本执行测试', status: 'pending', progress: 0 },
  { id: '4', title: '权限配置', status: 'running', progress: 45 },
];

const mockActivity = [
  {
    time: '10:30',
    action: '设备连接成功',
    device: 'Xiaomi 13 Pro',
    type: 'success',
  },
  {
    time: '10:25',
    action: '开始执行关注任务',
    device: 'Samsung Galaxy S23',
    type: 'info',
  },
  {
    time: '10:20',
    action: '联系人导入完成',
    device: 'OnePlus 11',
    type: 'success',
  },
  {
    time: '10:15',
    action: '权限验证失败',
    device: 'iPhone 14 Pro',
    type: 'error',
  },
];

export const NativeAntDashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>仪表板</Title>
      
      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在线设备"
              value={2}
              suffix="/ 4"
              valueStyle={{ color: '#3f8600' }}
              prefix={<MobileOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日任务"
              value={23}
              valueStyle={{ color: '#1677ff' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功关注"
              value={189}
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={1250}
              valueStyle={{ color: '#cf1322' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* 设备状态 */}
        <Col xs={24} md={12}>
          <Card title="设备状态" style={{ height: 400 }}>
            <List
              itemLayout="horizontal"
              dataSource={mockDevices}
              renderItem={(device) => (
                <List.Item
                  actions={[
                    <Tag color={
                      device.status === 'online' ? 'green' :
                      device.status === 'offline' ? 'red' : 'orange'
                    }>
                      {device.status === 'online' ? '在线' :
                       device.status === 'offline' ? '离线' : '未授权'}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<MobileOutlined />} />}
                    title={device.name}
                    description={
                      <Space>
                        <Text>电量: {device.battery}%</Text>
                        <Progress 
                          percent={device.battery} 
                          size="small" 
                          style={{ width: 100 }}
                          strokeColor={
                            device.battery > 50 ? '#52c41a' :
                            device.battery > 20 ? '#faad14' : '#ff4d4f'
                          }
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 任务进度 */}
        <Col xs={24} md={12}>
          <Card title="任务进度" style={{ height: 400 }}>
            <List
              itemLayout="horizontal"
              dataSource={mockTasks}
              renderItem={(task) => (
                <List.Item
                  actions={[
                    task.status === 'running' ? (
                      <Button type="text" icon={<PauseCircleOutlined />} />
                    ) : task.status === 'pending' ? (
                      <Button type="text" icon={<PlayCircleOutlined />} />
                    ) : (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    )
                  ]}
                >
                  <List.Item.Meta
                    title={task.title}
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <Tag color={
                            task.status === 'running' ? 'blue' :
                            task.status === 'completed' ? 'green' : 'default'
                          }>
                            {task.status === 'running' ? '进行中' :
                             task.status === 'completed' ? '已完成' : '等待中'}
                          </Tag>
                        </div>
                        <Progress 
                          percent={task.progress} 
                          size="small"
                          strokeColor={
                            task.status === 'completed' ? '#52c41a' :
                            task.status === 'running' ? '#1677ff' : '#d9d9d9'
                          }
                        />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 系统通知 */}
        <Col xs={24} md={12}>
          <Card title="系统通知">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="设备连接成功"
                description="Xiaomi 13 Pro 已成功连接，可以开始执行任务。"
                type="success"
                showIcon
                action={
                  <Button size="small" ghost>
                    查看
                  </Button>
                }
              />
              <Alert
                message="权限验证失败"
                description="iPhone 14 Pro 权限验证失败，请检查USB调试设置。"
                type="warning"
                showIcon
                action={
                  <Button size="small" ghost>
                    修复
                  </Button>
                }
              />
              <Alert
                message="任务执行完成"
                description="联系人导入任务已完成，共导入150个联系人。"
                type="info"
                showIcon
              />
            </Space>
          </Card>
        </Col>

        {/* 活动时间线 */}
        <Col xs={24} md={12}>
          <Card title="最近活动">
            <Timeline
              items={mockActivity.map((activity) => ({
                color: activity.type === 'success' ? 'green' :
                       activity.type === 'error' ? 'red' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {activity.time} - {activity.action}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      设备: {activity.device}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};