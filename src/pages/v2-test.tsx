// src/pages/v2-test.tsx
// module: v2-test | layer: pages | role: V2执行链测试页面
// summary: 测试V2统一执行协议的三条执行链功能
import React, { useState } from 'react';
import { Card, Button, Input, Select, Form, Typography, Space, Alert, Divider } from 'antd';
import { invoke } from '@tauri-apps/api/core';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface V2TestRequest {
  engine: string;
  flow: string;
  mode: string;
  dry_run: boolean;
  allow_exec: boolean;
  step?: any;
  plan?: any;
  device_id?: string;
}

interface V2TestResponse {
  outcome: string;
  message: string;
  bridge: string;
  dump_source: string;
  match_info?: {
    uniqueness: number;
    confidence: number;
    elements_found: number;
  };
  exec_info?: {
    ok: boolean;
    action: string;
    execution_time_ms: number;
  };
}

export default function V2TestPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<V2TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async (values: any) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 构造V2请求
      const request: V2TestRequest = {
        engine: 'v2',
        flow: values.flow,
        mode: values.mode || 'match_and_execute',
        dry_run: values.dry_run || false,
        allow_exec: values.allow_exec !== false,
        device_id: values.device_id || 'emulator-5554',
      };

      // 根据执行链类型添加相应参数
      if (values.flow === 'static' || values.flow === 'step') {
        request.step = {
          action_type: values.action_type || 'tap',
          coordinates: {
            x: parseInt(values.x) || 100,
            y: parseInt(values.y) || 100,
          },
          input_text: values.input_text || undefined,
        };
      } else if (values.flow === 'chain') {
        request.plan = {
          steps: [
            {
              action_type: values.action_type || 'tap',
              coordinates: {
                x: parseInt(values.x) || 100,
                y: parseInt(values.y) || 100,
              },
            },
          ],
        };
      }

      console.log('发送V2测试请求:', request);

      // 调用V2后端命令
      const response = await invoke<V2TestResponse>('run_step_v2', { request });
      
      console.log('V2测试响应:', response);
      setResult(response);
    } catch (err: any) {
      console.error('V2测试失败:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>V2执行链测试</Title>
      <Text type="secondary">
        测试三条执行链：Static（静态坐标）、Step（智能匹配）、Chain（链式自动化）
      </Text>

      <Divider />

      <div style={{ display: 'flex', gap: '24px' }}>
        <Card title="测试参数" style={{ flex: 1 }}>
          <Form form={form} layout="vertical" onFinish={handleTest}>
            <Form.Item name="flow" label="执行链类型" rules={[{ required: true }]}>
              <Select placeholder="选择执行链">
                <Option value="static">Static - 静态坐标执行</Option>
                <Option value="step">Step - 智能匹配执行</Option>
                <Option value="chain">Chain - 链式自动化执行</Option>
              </Select>
            </Form.Item>

            <Form.Item name="mode" label="执行模式" initialValue="match_and_execute">
              <Select>
                <Option value="match_only">仅匹配</Option>
                <Option value="match_and_execute">匹配并执行</Option>
                <Option value="execute_only">仅执行</Option>
              </Select>
            </Form.Item>

            <Form.Item name="action_type" label="操作类型" initialValue="tap">
              <Select>
                <Option value="tap">点击</Option>
                <Option value="type">文本输入</Option>
                <Option value="back">返回键</Option>
              </Select>
            </Form.Item>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Form.Item name="x" label="X坐标" style={{ flex: 1 }} initialValue="100">
                <Input type="number" />
              </Form.Item>
              <Form.Item name="y" label="Y坐标" style={{ flex: 1 }} initialValue="100">
                <Input type="number" />
              </Form.Item>
            </div>

            <Form.Item name="input_text" label="输入文本（文本操作用）">
              <Input placeholder="输入要键入的文本" />
            </Form.Item>

            <Form.Item name="device_id" label="设备ID" initialValue="emulator-5554">
              <Input />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <Form.Item name="dry_run" valuePropName="checked">
                <Button type="dashed">模拟运行</Button>
              </Form.Item>
              <Form.Item name="allow_exec" valuePropName="checked" initialValue={true}>
                <Button type="dashed">允许执行</Button>
              </Form.Item>
            </div>

            <Button type="primary" htmlType="submit" loading={loading} block>
              执行V2测试
            </Button>
          </Form>
        </Card>

        <Card title="测试结果" style={{ flex: 1 }}>
          {error && (
            <Alert
              type="error"
              message="测试失败"
              description={error}
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {result && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                type={result.outcome === 'executed' ? 'success' : 'info'}
                message={`执行结果: ${result.outcome}`}
                description={result.message}
                showIcon
              />

              <div style={{ fontSize: '14px' }}>
                <Text strong>执行信息:</Text>
                <br />
                <Text>桥接: {result.bridge}</Text>
                <br />
                <Text>数据源: {result.dump_source}</Text>
              </div>

              {result.match_info && (
                <div style={{ fontSize: '14px' }}>
                  <Text strong>匹配信息:</Text>
                  <br />
                  <Text>唯一性: {result.match_info.uniqueness}</Text>
                  <br />
                  <Text>置信度: {(result.match_info.confidence * 100).toFixed(1)}%</Text>
                  <br />
                  <Text>找到元素: {result.match_info.elements_found}</Text>
                </div>
              )}

              {result.exec_info && (
                <div style={{ fontSize: '14px' }}>
                  <Text strong>执行信息:</Text>
                  <br />
                  <Text>状态: {result.exec_info.ok ? '✅ 成功' : '❌ 失败'}</Text>
                  <br />
                  <Text>操作: {result.exec_info.action}</Text>
                  <br />
                  <Text>耗时: {result.exec_info.execution_time_ms}ms</Text>
                </div>
              )}

              <TextArea
                rows={6}
                value={JSON.stringify(result, null, 2)}
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Space>
          )}
        </Card>
      </div>
    </div>
  );
}