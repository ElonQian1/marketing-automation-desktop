// src/components/universal-ui/QuickStylingDemo.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 快速美化示例页面
 * 展示如何在现有功能组件基础上快速应用美化
 */

import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Input, 
  Select, 
  Space, 
  Row, 
  Col, 
  Tag, 
  Alert,
  Modal,
  Form,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

// 导入我们的现代化集成样式
import './styles/universal-ui-integration.css';

const QuickStylingDemo: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  return (
    <div className="min-h-screen bg-background-canvas p-lg">
      {/* 页面标题区域 - 使用 Tailwind 布局 + Ant Design 组件 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              项目功能美化演示
            </h1>
            <p className="text-text-secondary">
              展示 Ant Design + Tailwind CSS + 自定义设计系统的混合美化效果
            </p>
          </div>
          <Button type="primary" icon={<SettingOutlined />} size="large">
            设置
          </Button>
        </div>

        {/* 功能卡片网格 - Tailwind 响应式布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-xl">
          
          {/* 设备连接卡片 - 应用我们的设计系统 */}
          <Card 
            title="设备连接管理" 
            className="hover:shadow-xl transition-all duration-normal"
            extra={<Tag color="green">在线</Tag>}
          >
            <div className="space-y-4">
              <Select 
                placeholder="选择设备" 
                className="w-full"
                options={[
                  { value: 'device1', label: 'Pixel 6 Pro' },
                  { value: 'device2', label: 'iPhone 14' }
                ]}
              />
              <div className="flex gap-2">
                <Button type="primary" icon={<ReloadOutlined />} className="flex-1">
                  刷新
                </Button>
                <Button className="flex-1">
                  重连
                </Button>
              </div>
            </div>
          </Card>

          {/* 数据分析卡片 */}
          <Card 
            title="数据分析" 
            className="hover:shadow-xl transition-all duration-normal"
            extra={<Tag color="blue">实时</Tag>}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-background-surface rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">1,234</div>
                  <div className="text-xs text-text-tertiary">总数据</div>
                </div>
                <div className="text-center p-4 bg-background-surface rounded-lg">
                  <div className="text-2xl font-bold text-device-online">98%</div>
                  <div className="text-xs text-text-tertiary">成功率</div>
                </div>
              </div>
              <Button type="primary" className="w-full">
                查看详情
              </Button>
            </div>
          </Card>

          {/* 工具箱卡片 */}
          <Card 
            title="工具箱" 
            className="hover:shadow-xl transition-all duration-normal"
            extra={<Tag color="orange">工具</Tag>}
          >
            <div className="space-y-3">
              <Button 
                block 
                icon={<SearchOutlined />}
                className="text-left"
              >
                页面元素查找
              </Button>
              <Button 
                block 
                icon={<SettingOutlined />}
                className="text-left"
              >
                脚本构建器
              </Button>
              <Button 
                block 
                onClick={() => setModalVisible(true)}
                className="text-left"
              >
                设计系统预览
              </Button>
            </div>
          </Card>
        </div>

        {/* 状态展示区域 */}
        <Row gutter={[16, 16]} className="mb-xl">
          <Col span={24}>
            <Card title="系统状态" className="hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-background-surface rounded-lg">
                  <CheckCircleOutlined className="text-device-online text-xl" />
                  <div>
                    <div className="font-medium">设备连接</div>
                    <div className="text-sm text-text-tertiary">正常</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-background-surface rounded-lg">
                  <CheckCircleOutlined className="text-device-online text-xl" />
                  <div>
                    <div className="font-medium">服务状态</div>
                    <div className="text-sm text-text-tertiary">运行中</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-background-surface rounded-lg">
                  <CloseCircleOutlined className="text-device-error text-xl" />
                  <div>
                    <div className="font-medium">网络连接</div>
                    <div className="text-sm text-text-tertiary">异常</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-background-surface rounded-lg">
                  <CheckCircleOutlined className="text-device-connecting text-xl" />
                  <div>
                    <div className="font-medium">任务队列</div>
                    <div className="text-sm text-text-tertiary">处理中</div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 操作面板 */}
        <Card title="操作面板" className="hover:shadow-md transition-shadow">
          <Row gutter={[16, 16]}>
            <Col md={12}>
              <Alert 
                message="美化提示" 
                description="这个页面展示了如何将 Ant Design 组件与 Tailwind CSS 工具类结合，快速实现现代化的界面效果。" 
                type="info" 
                showIcon 
                className="mb-4"
              />
              
              <div className="space-y-4">
                <Input 
                  placeholder="搜索功能或设置..." 
                  prefix={<SearchOutlined />}
                  size="large"
                />
                <div className="flex gap-2">
                  <Button type="primary" size="large" className="flex-1">
                    执行操作
                  </Button>
                  <Button size="large" className="flex-1">
                    取消
                  </Button>
                </div>
              </div>
            </Col>
            <Col md={12}>
              <div className="bg-background-surface p-6 rounded-xl">
                <h4 className="font-semibold mb-4">快速操作</h4>
                <Space direction="vertical" className="w-full">
                  <Button block>导入配置</Button>
                  <Button block>导出数据</Button>
                  <Button block>重置设置</Button>
                  <Divider />
                  <Button type="primary" block>
                    保存所有更改
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 设计系统预览模态框 - 应用我们的集成样式 */}
      <Modal
        title="设计系统预览"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        className="universal-page-finder" // 关键：应用我们的集成样式
      >
        <div className="space-y-6">
          <Alert 
            message="样式集成成功" 
            description="这个模态框展示了通过添加 'universal-page-finder' 类名，所有 Ant Design 组件都能自动应用我们的现代化设计系统。" 
            type="success" 
            showIcon 
          />
          
          <div>
            <h4 className="mb-4">表单组件示例</h4>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="用户名" name="username">
                    <Input placeholder="请输入用户名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="角色" name="role">
                    <Select 
                      placeholder="选择角色"
                      options={[
                        { value: 'admin', label: '管理员' },
                        { value: 'user', label: '普通用户' }
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Space>
                  <Button type="primary">提交</Button>
                  <Button>重置</Button>
                  <Button danger>删除</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
          
          <div>
            <h4 className="mb-4">状态标签</h4>
            <Space wrap>
              <Tag color="blue">信息</Tag>
              <Tag color="green">成功</Tag>
              <Tag color="orange">警告</Tag>
              <Tag color="red">错误</Tag>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuickStylingDemo;