// src/pages/auth/LoginPageNative.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 登录页面（原生 Ant Design 版本）
 * 使用纯原生 Ant Design 组件和样式
 * 支持本地认证和试用期管理
 */

import React, { useState } from "react";
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
  theme,
  Divider,
  Tag,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../stores/authStore";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface LoginCredentials {
  username: string;
  password: string;
  remember: boolean;
}

/**
 * 原生登录页面
 */
export const LoginPageNative: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token: themeToken } = theme.useToken();
  const { login } = useAuthStore();

  // 组件挂载时，从 localStorage 读取保存的用户名和密码
  React.useEffect(() => {
    const savedUsername = localStorage.getItem("remembered-username");
    const savedPassword = localStorage.getItem("remembered-password");

    if (savedUsername && savedPassword) {
      form.setFieldsValue({
        username: savedUsername,
        password: savedPassword,
        remember: true,
      });
    }
  }, [form]);

  const handleSubmit = async (values: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const result = await login(values.username, values.password);

      if (!result.success) {
        setError(result.error || "登录失败");
      } else {
        // 登录成功后，根据"记住我"选项保存或清除凭据
        if (values.remember) {
          localStorage.setItem("remembered-username", values.username);
          localStorage.setItem("remembered-password", values.password);
        } else {
          localStorage.removeItem("remembered-username");
          localStorage.removeItem("remembered-password");
        }
      }
      // 登录成功后，AuthGuard 会自动切换到主应用
    } catch (err) {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: themeToken.paddingLG,
          background: `linear-gradient(135deg, ${themeToken.colorPrimary}15 0%, ${themeToken.colorSuccess}15 100%)`,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 460,
            boxShadow: themeToken.boxShadowTertiary,
          }}
          bodyStyle={{ padding: themeToken.paddingXL }}
        >
          {/* 头部 */}
          <Space
            direction="vertical"
            align="center"
            style={{ width: "100%", marginBottom: themeToken.marginLG }}
          >
            <Avatar
              size={64}
              icon={<UserOutlined />}
              style={{
                backgroundColor: themeToken.colorPrimary,
                fontSize: 24,
              }}
            />
            <Title level={2} style={{ margin: 0, textAlign: "center" }}>
              员工登录
            </Title>
            <Paragraph
              type="secondary"
              style={{ margin: 0, textAlign: "center" }}
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
              style={{ marginBottom: themeToken.marginMD }}
            />
          )}

          {/* 测试账户提示 */}
          <Alert
            message="测试账户"
            description={
              <div>
                <Text strong>试用账户：</Text>
                <Tag color="orange" style={{ marginLeft: 8 }}>
                  test / test123
                </Tag>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  (15天试用期)
                </Text>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginBottom: themeToken.marginLG }}
          />

          {/* 登录表单 */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            initialValues={{ remember: false }}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 3, message: "用户名至少3个字符" },
              ]}
            >
              <Input
                prefix={
                  <UserOutlined
                    style={{ color: themeToken.colorTextTertiary }}
                  />
                }
                placeholder="请输入用户名"
                size="large"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码至少6个字符" },
              ]}
            >
              <Input.Password
                prefix={
                  <LockOutlined
                    style={{ color: themeToken.colorTextTertiary }}
                  />
                }
                placeholder="请输入密码"
                size="large"
                autoComplete="current-password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <Button type="link" style={{ padding: 0 }} disabled>
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
                {loading ? "登录中..." : "登录"}
              </Button>
            </Form.Item>
          </Form>

          {/* 底部提示 */}
          <Divider
            style={{
              marginTop: themeToken.marginLG,
              marginBottom: themeToken.marginMD,
            }}
          />
          <div style={{ textAlign: "center" }}>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
              还没有账号？
              <Button type="link" style={{ padding: 0, fontSize: 12 }} disabled>
                联系管理员注册
              </Button>
            </Paragraph>
            <Paragraph
              type="secondary"
              style={{ margin: "8px 0 0", fontSize: 11 }}
            >
              版权所有 © {new Date().getFullYear()} 社交平台自动化操作系统
            </Paragraph>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPageNative;
