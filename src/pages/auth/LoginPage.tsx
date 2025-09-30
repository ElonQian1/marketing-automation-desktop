import React from 'react';
import { Card, Form, Input, Button, Checkbox, Typography, Space, Alert, Row, Col, Avatar } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import type { LoginCredentials } from '../../types';

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading = false, error }) => {
  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space direction="vertical" align="center" size={4} style={{ width: '100%' }}>
              <Avatar size={48} icon={<UserOutlined />} />
              <Typography.Title level={3} style={{ margin: 0, textAlign: 'center' }}>员工登录</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ margin: 0, textAlign: 'center' }}>
                社交平台自动化操作系统
              </Typography.Paragraph>
            </Space>

            {error && <Alert type="error" message={error} showIcon />}

            <Form<LoginCredentials>
              layout="vertical"
              initialValues={{ username: '', password: '', remember: false }}
              onFinish={(values) => onLogin(values)}
              disabled={isLoading}
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="输入用户名" autoComplete="username" />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                  <Col>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>记住我</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col>
                    <Typography.Link href="#">忘记密码？</Typography.Link>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<LoginOutlined />} block loading={isLoading}>
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </Form.Item>
            </Form>

            <Typography.Paragraph type="secondary" style={{ textAlign: 'center', margin: 0 }}>
              版权所有 © 2024 社交平台自动化操作系统
            </Typography.Paragraph>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

