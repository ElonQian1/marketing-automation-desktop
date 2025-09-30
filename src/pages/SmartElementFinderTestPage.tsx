import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Space, Typography, Alert, Empty } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { SmartElementFinder } from '../components/smart-element-finder';
import { useAdb } from '../application/hooks/useAdb';
import { MobileOutlined, RobotOutlined, BugOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface Device {
    id: string;
    name: string;
    status: string;
}

const SmartElementFinderTestPage: React.FC = () => {
    const { devices, refreshDevices } = useAdb(); // 使用统一的设备状态
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // 获取设备列表
    useEffect(() => {
        const loadDevices = async () => {
            try {
                await refreshDevices(); // 使用统一的刷新方法
                if (devices.length > 0) {
                    setSelectedDevice(devices[0].id);
                }
            } catch (error) {
                console.error('获取设备列表失败:', error);
            }
        };

        loadDevices();
    }, []);

    // 刷新设备列表
    const handleRefreshDevices = async () => {
        setLoading(true);
        try {
            await refreshDevices(); // 使用统一的刷新方法
        } catch (error) {
            console.error('刷新设备列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 步骤创建回调
    const handleStepCreated = (step: any) => {
        console.log('创建的步骤:', step);
        // 这里可以添加到脚本构建器或执行队列
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Title level={2}>
                        <Space>
                            <RobotOutlined />
                            智能元素查找器测试页面
                        </Space>
                    </Title>
                    <Paragraph>
                        这个工具可以智能识别应用的导航栏并精确定位特定按钮。
                        专为小红书等应用的自动化操作设计，支持底部导航、侧边导航等多种布局。
                    </Paragraph>
                </Space>

                <Card
                    size="small"
                    title="设备连接"
                    extra={
                        <Button onClick={handleRefreshDevices} loading={loading}>
                            刷新设备
                        </Button>
                    }
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12} lg={8}>
                            <Space>
                                <MobileOutlined />
                                <Text strong>选择设备：</Text>
                                <Select
                                    value={selectedDevice}
                                    onChange={setSelectedDevice}
                                    placeholder="请选择设备"
                                    options={devices.map((device) => ({
                                        value: device.id,
                                        label: `${device.name} (${device.status})`,
                                    }))}
                                />
                            </Space>
                        </Col>
                    </Row>

                    {devices.length === 0 && (
                        <Alert
                            type="warning"
                            message="未找到连接的设备"
                            description="请确保设备已连接并启用USB调试"
                        />
                    )}
                </Card>

                {selectedDevice ? (
                    <Card title="智能元素查找器" size="small">
                        <SmartElementFinder deviceId={selectedDevice} onStepCreated={handleStepCreated} />
                    </Card>
                ) : (
                    <Empty description="请选择设备后使用智能元素查找器" />
                )}

                <Card size="small" title="功能说明">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Card size="small">
                                <Space direction="vertical">
                                    <Text strong>🎯 预设配置</Text>
                                    <Text type="secondary">
                                        内置小红书、微信、抖音等常用应用的导航栏配置，
                                        一键应用无需手动设置。
                                    </Text>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size="small">
                                <Space direction="vertical">
                                    <Text strong>🤖 智能识别</Text>
                                    <Text type="secondary">
                                        基于UI结构分析，自动识别导航栏区域和按钮，
                                        无需手动指定坐标。
                                    </Text>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size="small">
                                <Space direction="vertical">
                                    <Text strong>📱 多场景支持</Text>
                                    <Text type="secondary">
                                        支持底部导航、顶部导航、侧边导航等多种布局，
                                        适配不同应用设计。
                                    </Text>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                <Card size="small" title="测试指南">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text><BugOutlined /> <strong>步骤1：</strong> 确保设备已连接并打开小红书应用</Text>
                        <Text><BugOutlined /> <strong>步骤2：</strong> 选择预设配置"小红书_底部导航"</Text>
                        <Text><BugOutlined /> <strong>步骤3：</strong> 目标按钮设置为"我"</Text>
                        <Text><BugOutlined /> <strong>步骤4：</strong> 点击"智能检测"查看识别结果</Text>
                        <Text><BugOutlined /> <strong>步骤5：</strong> 如果检测成功，可以点击"点击元素"测试交互</Text>
                        <Text><BugOutlined /> <strong>步骤6：</strong> 点击"创建步骤"将配置保存为脚本步骤</Text>
                    </Space>
                </Card>
            </Card>
        </Space>
    );
};

export default SmartElementFinderTestPage;