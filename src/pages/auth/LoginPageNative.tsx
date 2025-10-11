// src/pages/auth/LoginPageNative.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 登录页面（原生 Ant Design 版本）
 * 使用纯原生 Ant Design 组件和样式
 */

import React, { useState } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Space,
  Alert,
  Avatar,
  theme
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone 
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

/**
 * 原生登录页面
 */
export const LoginPageNative: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = theme.useToken();

  const handleSubmit = async (values: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      // 模拟登录 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟登录验证
      if (values.username === 'admin' && values.password === 'password') {
        console.log('登录成功:', values);
        // 这里可以添加路由跳转逻辑
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: token.paddingLG,
          background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorSuccess}15 100%)`
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 400,
            boxShadow: token.boxShadowTertiary
          }}
          bodyStyle={{ padding: token.paddingXL }}
        >
          {/* 头部 */}
          <Space 
            direction="vertical" 
            align="center" 
            style={{ width: '100%', marginBottom: token.marginLG }}
          >
            <Avatar 
              size={64} 
              icon={<UserOutlined />}
              style={{ 
                backgroundColor: token.colorPrimary,
                fontSize: 24
              }}
            />
            <Title level={2} style={{ margin: 0, textAlign: 'center' }}>
              员工登录
            </Title>
            <Paragraph 
              type="secondary" 
              style={{ margin: 0, textAlign: 'center' }}
            >
              社交平台自动化操作系统
            </Paragraph>
          </Space>

          {/* 错误提示 */}
          {error && (
            <Alert
              message={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: token.marginMD }}
            />
          )}

          {/* 登录表单 */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="请输入用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="请输入密码"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <Button type="link" style={{ padding: 0 }}>
                  忘记密码？
                </Button>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          {/* 底部提示 */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: token.marginLG,
            padding: token.paddingMD,
            borderTop: `1px solid ${token.colorBorder}`
          }}>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
              还没有账号？ 
              <Button type="link" style={{ padding: 0, fontSize: 12 }}>
                联系管理员注册
              </Button>
            </Paragraph>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPageNative;