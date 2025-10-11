// src/pages/ui-showcase/UIShowcasePageNative.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * UI组件库展示页面（原生 Ant Design 版本）
 * 展示所有可用的原生 Ant Design 组件及其用法
 */

import React, { useState } from 'react';
import { 
  Layout,
  Card,
  Button,
  Input,
  Select,
  Form,
  Space,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Tag,
  Badge,
  Avatar,
  Tooltip,
  Progress,
  Switch,
  Slider,
  theme
} from 'antd';
import { 
  ReloadOutlined, 
  SettingOutlined, 
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  HeartOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 原生 UI 组件展示页面
 */
export const UIShowcasePageNative: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    category: '',
    description: '',
  });

  const handleFormSubmit = () => {
    setIsLoading(true);
    // 模拟异步操作
    setTimeout(() => {
      setIsLoading(false);
      console.log('表单提交:', formData);
    }, 2000);
  };

  const selectOptions = [
    { label: '选项1', value: 'option1' },
    { label: '选项2', value: 'option2' },
    { label: '选项3', value: 'option3' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: token.paddingLG }}>
        <div style={{ marginBottom: token.marginLG }}>
          <Title level={1}>原生 Ant Design 组件展示</Title>
          <Paragraph>
            展示所有可用的原生 Ant Design 组件及其使用示例，
            统一的暗黑模式主题，原生颜值设计。
          </Paragraph>
        </div>

        {/* 按钮组件展示 */}
        <Card 
          title={<Title level={3}>按钮组件</Title>} 
          style={{ marginBottom: token.marginLG }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Title level={4}>主要按钮</Title>
              <Space wrap>
                <Button type="primary" size="small">小按钮</Button>
                <Button type="primary" size="middle">中按钮</Button>
                <Button type="primary" size="large">大按钮</Button>
                <Button type="primary" loading>加载中</Button>
                <Button type="primary" disabled>禁用状态</Button>
              </Space>
            </Col>
            
            <Col span={8}>
              <Title level={4}>次要按钮</Title>
              <Space wrap>
                <Button size="small">小按钮</Button>
                <Button size="middle">中按钮</Button>
                <Button size="large">大按钮</Button>
                <Button loading>加载中</Button>
                <Button disabled>禁用状态</Button>
              </Space>
            </Col>
            
            <Col span={8}>
              <Title level={4}>图标按钮</Title>
              <Space wrap>
                <Tooltip title="刷新">
                  <Button type="primary" icon={<ReloadOutlined />} />
                </Tooltip>
                <Tooltip title="设置">
                  <Button icon={<SettingOutlined />} />
                </Tooltip>
                <Tooltip title="删除">
                  <Button danger icon={<DeleteOutlined />} />
                </Tooltip>
                <Tooltip title="搜索">
                  <Button type="text" shape="circle" icon={<SearchOutlined />} />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 表单组件展示 */}
        <Card 
          title={<Title level={3}>表单组件</Title>} 
          style={{ marginBottom: token.marginLG }}
        >
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFormSubmit}
              >
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input 
                    placeholder="请输入用户名" 
                    prefix={<UserOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="邮箱"
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '邮箱格式不正确' }
                  ]}
                >
                  <Input placeholder="请输入邮箱地址" />
                </Form.Item>

                <Form.Item
                  label="分类"
                  name="category"
                  rules={[{ required: true, message: '请选择分类' }]}
                >
                  <Select placeholder="请选择分类">
                    {selectOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="描述"
                  name="description"
                >
                  <TextArea 
                    rows={4} 
                    placeholder="请输入描述信息"
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={isLoading}>
                      {isLoading ? '提交中...' : '提交表单'}
                    </Button>
                    <Button htmlType="reset">重置</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Col>

            <Col span={12}>
              <Title level={4}>其他组件</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="提示信息"
                  description="这是一条原生 Ant Design 提示信息"
                  type="info"
                  showIcon
                  closable
                />

                <div>
                  <Text strong>进度条：</Text>
                  <Progress 
                    percent={75} 
                    size="small" 
                    style={{ marginTop: token.marginXS }}
                  />
                </div>

                <div>
                  <Text strong>标签：</Text>
                  <div style={{ marginTop: token.marginXS }}>
                    <Space wrap>
                      <Tag color="blue">蓝色标签</Tag>
                      <Tag color="green">绿色标签</Tag>
                      <Tag color="orange">橙色标签</Tag>
                      <Tag color="red">红色标签</Tag>
                    </Space>
                  </div>
                </div>

                <div>
                  <Text strong>徽章：</Text>
                  <div style={{ marginTop: token.marginXS }}>
                    <Space>
                      <Badge count={5}>
                        <Avatar shape="square" icon={<UserOutlined />} />
                      </Badge>
                      <Badge dot>
                        <Avatar shape="square" icon={<HeartOutlined />} />
                      </Badge>
                      <Badge count={0} showZero>
                        <Avatar shape="square" icon={<StarOutlined />} />
                      </Badge>
                    </Space>
                  </div>
                </div>

                <div>
                  <Text strong>开关和滑块：</Text>
                  <div style={{ marginTop: token.marginXS }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>启用功能</Text>
                        <Switch defaultChecked />
                      </div>
                      <div>
                        <Text>音量: </Text>
                        <Slider 
                          defaultValue={30} 
                          style={{ width: 200, marginLeft: token.marginXS }}
                        />
                      </div>
                    </Space>
                  </div>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 加载状态展示 */}
        <Card title={<Title level={3}>加载状态</Title>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>加载指示器：</Text>
              <Space style={{ marginLeft: token.marginMD }}>
                <Spin size="small" />
                <Spin />
                <Spin size="large" />
              </Space>
            </div>

            <div>
              <Text strong>包装加载状态：</Text>
              <Spin spinning={isLoading}>
                <Card size="small" style={{ marginTop: token.marginXS }}>
                  <Paragraph>
                    这是一个可以被加载状态包装的内容区域。
                    当 spinning 为 true 时，整个区域会显示加载效果。
                  </Paragraph>
                </Card>
              </Spin>
            </div>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default UIShowcasePageNative;