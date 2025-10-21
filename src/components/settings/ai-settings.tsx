// src/components/settings/ai-settings.tsx
// module: ai | layer: ui | role: AI 设置界面组件
// summary: 提供 AI Provider 选择、模型配置、参数调整的设置界面

import { useState, useEffect } from 'react';
import { Card, Select, Input, Button, Form, InputNumber, Switch, Space, message, Divider } from 'antd';
import { SyncOutlined, SaveOutlined, ApiOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/tauri';

/**
 * AI Provider 类型
 */
type AIProvider = 'openai' | 'hunyuan';

/**
 * AI 设置配置
 */
interface AISettings {
  provider: AIProvider;
  defaultChatModel: string;
  defaultEmbedModel: string;
  temperature: number;
  stream: boolean;
  maxRetries: number;
  baseUrlOpenAI?: string;
  baseUrlHunyuan?: string;
}

/**
 * AI 设置组件
 */
export function AISettingsComponent() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [settings, setSettings] = useState<AISettings>({
    provider: 'openai',
    defaultChatModel: 'gpt-4o-mini',
    defaultEmbedModel: 'text-embedding-3-large',
    temperature: 0.2,
    stream: true,
    maxRetries: 3,
  });
  const [openaiKey, setOpenaiKey] = useState('');
  const [hunyuanKey, setHunyuanKey] = useState('');

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * 从后端加载设置
   */
  const loadSettings = async () => {
    try {
      const cfg = await invoke<AISettings>('get_ai_settings');
      setSettings(cfg);
      form.setFieldsValue(cfg);
    } catch (error) {
      console.error('[AI Settings] Failed to load settings:', error);
      message.error('加载设置失败');
    }
  };

  /**
   * 刷新模型列表
   */
  const refreshModels = async () => {
    setLoading(true);
    try {
      const list = await invoke<string[]>('list_models');
      setModels(list);
      message.success(`已加载 ${list.length} 个模型`);
    } catch (error) {
      console.error('[AI Settings] Failed to refresh models:', error);
      message.error('刷新模型列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存设置
   */
  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      
      setLoading(true);
      await invoke('save_ai_settings', {
        settings: {
          ...settings,
          ...values,
        },
        openaiKey: openaiKey || null,
        hunyuanKey: hunyuanKey || null,
      });

      message.success('设置保存成功');
      
      // 清空密钥输入框
      setOpenaiKey('');
      setHunyuanKey('');
      
      // 刷新模型列表
      await refreshModels();
    } catch (error) {
      console.error('[AI Settings] Failed to save settings:', error);
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Provider 改变时的处理
   */
  const handleProviderChange = (provider: AIProvider) => {
    setSettings({ ...settings, provider });
    form.setFieldsValue({ provider });
  };

  return (
    <Card
      title={
        <Space>
          <ApiOutlined />
          AI 设置
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<SyncOutlined />}
            onClick={refreshModels}
            loading={loading}
          >
            刷新模型
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
          >
            保存设置
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
      >
        {/* Provider 选择 */}
        <Form.Item
          label="AI 服务提供商"
          name="provider"
          rules={[{ required: true, message: '请选择 AI 服务提供商' }]}
        >
          <Select
            onChange={handleProviderChange}
            options={[
              { label: 'OpenAI', value: 'openai' },
              { label: '腾讯混元', value: 'hunyuan' },
            ]}
          />
        </Form.Item>

        <Divider>API 密钥配置</Divider>

        {/* API Key 输入 */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="OpenAI API Key">
            <Input.Password
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              disabled={settings.provider !== 'openai'}
            />
            <div className="text-xs text-gray-500 mt-1">
              密钥存储在系统凭据库中，安全加密
            </div>
          </Form.Item>

          <Form.Item label="混元 API Key">
            <Input.Password
              value={hunyuanKey}
              onChange={(e) => setHunyuanKey(e.target.value)}
              placeholder="hy-..."
              disabled={settings.provider !== 'hunyuan'}
            />
            <div className="text-xs text-gray-500 mt-1">
              密钥存储在系统凭据库中，安全加密
            </div>
          </Form.Item>
        </div>

        <Divider>模型配置</Divider>

        {/* 模型选择 */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="默认聊天模型"
            name="defaultChatModel"
            rules={[{ required: true, message: '请选择聊天模型' }]}
          >
            <Select
              placeholder="请先刷新模型列表"
              options={models.map(m => ({ label: m, value: m }))}
            />
          </Form.Item>

          <Form.Item
            label="默认嵌入向量模型"
            name="defaultEmbedModel"
            rules={[{ required: true, message: '请选择嵌入模型' }]}
          >
            <Select
              placeholder="请先刷新模型列表"
              options={models
                .filter(m => m.toLowerCase().includes('embedding'))
                .map(m => ({ label: m, value: m }))}
            />
          </Form.Item>
        </div>

        <Divider>推理参数</Divider>

        {/* 参数配置 */}
        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            label="温度 (Temperature)"
            name="temperature"
            rules={[{ required: true }, { type: 'number', min: 0, max: 2 }]}
            tooltip="控制输出的随机性，0-2 之间，越低越确定"
          >
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="最大重试次数"
            name="maxRetries"
            rules={[{ required: true }, { type: 'number', min: 0, max: 10 }]}
          >
            <InputNumber
              min={0}
              max={10}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="启用流式输出"
            name="stream"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>

        <Divider>高级配置（可选）</Divider>

        {/* Base URL 配置 */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="OpenAI Base URL"
            name="baseUrlOpenAI"
            tooltip="自定义 OpenAI API 端点，留空使用默认"
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            label="混元 Base URL"
            name="baseUrlHunyuan"
            tooltip="自定义混元 API 端点，留空使用默认"
          >
            <Input placeholder="https://api.hunyuan.cloud.tencent.com/v1" />
          </Form.Item>
        </div>
      </Form>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h4 className="text-sm font-semibold mb-2">提示</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• API Key 存储在操作系统的凭据管理器中（Windows CredMan / macOS Keychain / Linux Secret Service）</li>
          <li>• 切换 Provider 后需要重新刷新模型列表</li>
          <li>• 温度值越低，输出越确定；越高，输出越随机</li>
          <li>• 流式输出可以实时展示 AI 生成过程，但会增加网络开销</li>
        </ul>
      </div>
    </Card>
  );
}
