import React, { useState } from 'react';
import { Layout, Typography, Space, Alert, Button } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import { PreciseAcquisitionForm } from '../../components/task';
import { useAdb } from '../../application/hooks/useAdb';
import { Platform } from '../../types';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

/**
 * 精准获客页面 - 原生Ant Design版本
 * 专注于精准获客功能
 */
export const PreciseAcquisitionPage: React.FC = () => {
  const [platform, setPlatform] = useState<Platform>('xiaohongshu');
  const [balance] = useState(1000); // 示例余额
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 使用统一的ADB接口 - 遵循DDD架构约束
  const { 
    devices, 
    onlineDevices,
    refreshDevices,
    initialize
  } = useAdb();

  // 精准获客提交
  const handleAcquisitionSubmit = async (data: {
    platform: Platform;
    searchKeywords: string[];
    competitorAccounts: string[];
    targetKeywords: string[];
    targetCount: number;
    preferenceTags: string[];
    selectedDevices: string[];
  }) => {
    setIsLoading(true);
    try {
      console.log('提交精准获客任务:', data);
      // 这里调用后端API
      alert('任务已提交，开始执行获客操作');
    } catch (error) {
      console.error('任务提交失败:', error);
      alert('任务提交失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 转换设备数据格式以兼容现有组件
  const availableDevices = onlineDevices.map(d => ({
    id: d.id,
    name: d.getDisplayName(),
    phone_name: d.id
  }));

  if (onlineDevices.length === 0) {
    return (
      <Layout>
        <Content style={{ padding: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={2}>精准获客</Title>
            </div>
            
            <Alert
              message="暂无可用设备"
              description="请先到设备管理页面连接设备后再执行获客操作。"
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              action={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refreshDevices}
                  type="primary"
                >
                  刷新设备列表
                </Button>
              }
            />
          </Space>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 页面标题 */}
          <div>
            <Title level={2}>精准获客</Title>
            <Paragraph type="secondary">
              基于关键词和竞对分析的精准用户获取平台
            </Paragraph>
          </div>

          {/* 精准获客表单 */}
          <div style={{ minHeight: '70vh' }}>
            <PreciseAcquisitionForm
              platform={platform}
              onPlatformChange={setPlatform}
              balance={balance}
              onSubmit={handleAcquisitionSubmit}
              availableDevices={availableDevices}
              selectedDevices={selectedDevices}
              onDeviceSelectionChange={setSelectedDevices}
              isLoading={isLoading}
            />
          </div>
        </Space>
      </Content>
    </Layout>
  );
};

