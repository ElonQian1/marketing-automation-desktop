// src/modules/agent-chat/ui/AgentConfigModal.tsx
// module: agent-chat | layer: ui | role: 配置弹窗组件
// summary: AI 提供商配置弹窗

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Alert,
  Typography,
  Divider,
} from 'antd';
import {
  KeyOutlined,
  ApiOutlined,
  RobotOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { AgentProvider } from '../domain/agent-chat-types';

const { Text, Link } = Typography;
const { Option } = Select;

interface AgentConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfigure: (provider: AgentProvider, apiKey: string, model?: string) => Promise<boolean>;
  loading?: boolean;
}

interface FormValues {
  provider: AgentProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

const PROVIDER_MODELS: Record<AgentProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  hunyuan: ['hunyuan-pro', 'hunyuan-standard', 'hunyuan-lite'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  custom: [],
};

const PROVIDER_INFO: Record<AgentProvider, { name: string; docsUrl: string }> = {
  openai: { name: 'OpenAI', docsUrl: 'https://platform.openai.com/api-keys' },
  hunyuan: { name: '腾讯混元', docsUrl: 'https://cloud.tencent.com/product/hunyuan' },
  deepseek: { name: 'DeepSeek', docsUrl: 'https://platform.deepseek.com/' },
  custom: { name: '自定义', docsUrl: '' },
};

/**
 * AI 配置弹窗
 */
export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  open,
  onClose,
  onConfigure,
  loading = false,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [provider, setProvider] = useState<AgentProvider>('hunyuan');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setError(null);
      
      const result = await onConfigure(values.provider, values.apiKey, values.model);
      
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1000);
      } else {
        setError('配置失败，请检查 API Key 是否正确');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleProviderChange = (value: AgentProvider) => {
    setProvider(value);
    form.setFieldValue('model', PROVIDER_MODELS[value][0]);
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined />
          <span>配置 AI 助手</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnHidden
    >
      {success ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <div style={{ marginTop: 16 }}>
            <Text>配置成功！</Text>
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            provider: 'hunyuan',
            model: 'hunyuan-pro',
          }}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            name="provider"
            label="AI 提供商"
            rules={[{ required: true, message: '请选择 AI 提供商' }]}
          >
            <Select onChange={handleProviderChange}>
              <Option value="hunyuan">
                <Space>
                  <span>🇨🇳</span>
                  <span>腾讯混元</span>
                  <Text type="secondary">(推荐)</Text>
                </Space>
              </Option>
              <Option value="openai">
                <Space>
                  <span>🌐</span>
                  <span>OpenAI</span>
                </Space>
              </Option>
              <Option value="deepseek">
                <Space>
                  <span>🔮</span>
                  <span>DeepSeek</span>
                </Space>
              </Option>
              <Option value="custom">
                <Space>
                  <span>⚙️</span>
                  <span>自定义 (OpenAI 兼容)</span>
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={
              <Space>
                <KeyOutlined />
                <span>API Key</span>
              </Space>
            }
            rules={[
              { required: true, message: '请输入 API Key' },
              { 
                validator: async (_, value) => {
                  if (!value) return;
                  const trimmed = value.trim();
                  // 检查是否有重复的 API Key（常见粘贴错误）
                  if (trimmed.length > 60 && /^(sk-[A-Za-z0-9]+)\1$/.test(trimmed)) {
                    throw new Error('检测到 API Key 重复粘贴，请检查输入');
                  }
                  // 基本格式检查
                  if (trimmed.startsWith('sk-') && trimmed.length < 20) {
                    throw new Error('API Key 格式不正确');
                  }
                },
              },
            ]}
            normalize={(value) => value?.trim()}
            extra={
              PROVIDER_INFO[provider].docsUrl && (
                <Text type="secondary">
                  <Link href={PROVIDER_INFO[provider].docsUrl} target="_blank">
                    获取 {PROVIDER_INFO[provider].name} API Key →
                  </Link>
                </Text>
              )
            }
          >
            <Input.Password
              placeholder="sk-..."
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          {provider !== 'custom' ? (
            <Form.Item
              name="model"
              label="模型"
              rules={[{ required: true, message: '请选择模型' }]}
            >
              <Select>
                {PROVIDER_MODELS[provider].map((model) => (
                  <Option key={model} value={model}>
                    {model}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="baseUrl"
                label={
                  <Space>
                    <ApiOutlined />
                    <span>API Base URL</span>
                  </Space>
                }
                rules={[{ required: true, message: '请输入 API Base URL' }]}
              >
                <Input placeholder="https://api.example.com/v1" />
              </Form.Item>
              <Form.Item
                name="model"
                label="模型名称"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="gpt-4" />
              </Form.Item>
            </>
          )}

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                确认配置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};
