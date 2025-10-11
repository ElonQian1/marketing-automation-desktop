// src/pages/SmartNavigationTestPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Typography, Button, message, List, Tag, Row, Col, Empty } from 'antd';
import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover';
import { invoke } from '@tauri-apps/api/core';
import { 
  MobileOutlined, 
  PlusOutlined, 
  PlayCircleOutlined, 
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { SmartNavigationStepBuilder } from '../components/smart-navigation-finder';
import { useAdb } from '../application/hooks/useAdb';
import type { ElementFinderResult, DetectedElement } from '../components/smart-element-finder/SmartElementFinder';

const { Title, Text } = Typography;

interface Device {
  id: string;
  name: string;
  status: string;
}

interface SmartStep {
  id: number;
  type: string;
  name: string;
  description: string;
  config: {
    navigation_type: string;
    app_name: string;
    button_name: string;
    click_action: string;
    custom_config?: any;
  };
  execution_config?: any;
  result?: ElementFinderResult;
}

// 为 invoke 调用定义结果类型
interface InvokeResult {
  success: boolean;
  message?: string;
  target_element?: DetectedElement;
  all_elements?: DetectedElement[];
}

const SmartNavigationTestPage: React.FC = () => {
  const { devices, refreshDevices } = useAdb(); // 使用统一的设备状态
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [smartSteps, setSmartSteps] = useState<SmartStep[]>([]);

  // 获取设备列表
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      await refreshDevices(); // 使用统一的刷新方法
      if (devices.length > 0) {
        setSelectedDevice(devices[0].id);
      }
    } catch (error) {
      console.error('获取设备失败:', error);
      message.error('获取设备失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理步骤生成
  const handleStepGenerated = (step: SmartStep) => {
    setSmartSteps(prev => [...prev, step]);
    console.log('新增智能导航步骤:', step);
  };

  // 删除步骤
  const handleDeleteStep = (stepId: number) => {
    setSmartSteps(prev => prev.filter(step => step.id !== stepId));
    message.success('已删除步骤');
  };

  // 执行单个步骤
  const handleExecuteStep = async (step: SmartStep) => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    try {
      setLoading(true);
      message.info(`正在执行: ${step.name}`);

      // 调用智能元素查找来执行步骤
      const result = await invoke<InvokeResult>('smart_element_finder', {
        deviceId: selectedDevice,
        config: step.execution_config
      });

      console.log('步骤执行结果:', result);
      
      if (result.success && result.target_element) {
        // 点击目标元素
        await invoke('click_detected_element', {
          deviceId: selectedDevice,
          element: result.target_element,
          clickType: step.config.click_action
        });
        message.success(`步骤执行成功: ${step.name}`);
      } else {
        message.warning(`步骤执行有问题: ${result.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('步骤执行失败:', error);
      message.error(`步骤执行失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 执行所有步骤
  const handleExecuteAllSteps = async () => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    if (smartSteps.length === 0) {
      message.warning('没有可执行的步骤');
      return;
    }

    try {
      setLoading(true);
      message.info('开始执行智能导航序列...');

      for (const step of smartSteps) {
        try {
          console.log(`执行步骤: ${step.name}`);
          await handleExecuteStep(step);
          // 步骤间延时
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`步骤 ${step.name} 执行失败:`, error);
          message.error(`步骤 ${step.name} 执行失败，停止后续执行`);
          break;
        }
      }

      message.success('智能导航序列执行完成！');
    } catch (error) {
      console.error('批量执行失败:', error);
      message.error(`批量执行失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 清空所有步骤
  const handleClearAllSteps = () => {
    setSmartSteps([]);
    message.success('已清空所有步骤');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <Space>
          <MobileOutlined />
          智能导航栏操作测试
        </Space>
      </Title>

      <Card
        title="设备管理"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} size="small" loading={loading} onClick={fetchDevices}>
            刷新设备
          </Button>
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12} lg={8}>
            <Space>
              <Text>选择设备:</Text>
              <Select
                placeholder="选择Android设备"
                value={selectedDevice}
                onChange={setSelectedDevice}
                loading={loading}
                style={{ minWidth: 260 }}
                options={devices.map((device) => ({
                  value: device.id,
                  label: `${device.id} (${device.status})`,
                }))}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="步骤构建器">
            <SmartNavigationStepBuilder deviceId={selectedDevice} onStepGenerated={handleStepGenerated} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <PlusOutlined />
                <span>智能导航步骤</span>
                <Tag color="blue">{smartSteps.length} 个步骤</Tag>
              </Space>
            }
            size="small"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  size="small"
                  disabled={smartSteps.length === 0 || !selectedDevice}
                  loading={loading}
                  onClick={handleExecuteAllSteps}
                >
                  执行全部
                </Button>
                <ConfirmPopover mode="default" title="确定要清空所有步骤吗？" onConfirm={handleClearAllSteps} disabled={smartSteps.length === 0}>
                  <Button danger size="small" icon={<DeleteOutlined />} disabled={smartSteps.length === 0}>
                    清空
                  </Button>
                </ConfirmPopover>
              </Space>
            }
          >
            {smartSteps.length === 0 ? (
              <Empty description="还没有智能导航步骤，使用左侧的步骤构建器来创建步骤" />
            ) : (
              <List
                dataSource={smartSteps}
                renderItem={(step, index) => (
                  <List.Item
                    actions={[
                      <Button
                        key="execute"
                        type="link"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleExecuteStep(step)}
                        disabled={!selectedDevice || loading}
                      >
                        执行
                      </Button>,
                      <ConfirmPopover key="delete" mode="default" title="确定删除这个步骤吗？" onConfirm={() => handleDeleteStep(step.id)}>
                        <Button type="link" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </ConfirmPopover>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="blue">#{index + 1}</Tag>
                          {step.name}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4}>
                          <Text type="secondary">{step.description}</Text>
                          <Space wrap>
                            <Tag>应用: {step.config.app_name}</Tag>
                            <Tag>位置: {step.config.navigation_type}</Tag>
                            <Tag>按钮: {step.config.button_name}</Tag>
                            <Tag>动作: {step.config.click_action}</Tag>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="使用说明" size="small">
        <Space direction="vertical">
          <div>
            <Title level={5}>功能特点：</Title>
            <ul>
              <li>🎯 <strong>智能导航识别</strong>：自动识别应用的底部导航栏、顶部导航栏等</li>
              <li>📱 <strong>多应用预设</strong>：内置小红书、微信、抖音等常用应用配置</li>
              <li>🔧 <strong>灵活配置</strong>：支持预设按钮选择和手动输入</li>
              <li>⚡ <strong>即时执行</strong>：可单步执行或批量执行导航操作</li>
            </ul>
          </div>
          <div>
            <Title level={5}>操作流程：</Title>
            <ol>
              <li>选择并连接Android设备</li>
              <li>在步骤构建器中选择导航栏类型（下方导航栏、顶部导航栏等）</li>
              <li>选择目标应用（小红书、微信等）</li>
              <li>选择或输入目标按钮（我、首页、消息等）</li>
              <li>选择操作动作（单击、双击、长按）</li>
              <li>点击"智能检测"验证配置</li>
              <li>点击"添加到步骤"生成智能脚本步骤</li>
              <li>执行单个步骤或批量执行所有步骤</li>
            </ol>
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export default SmartNavigationTestPage;