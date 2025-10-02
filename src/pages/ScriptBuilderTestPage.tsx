/**
 * 脚本构建器模块测试页面
 * 用于验证脚本构建器模块的功能
 */

import React, { useState } from 'react';
import { Card, Space, Typography, Button, Alert, Divider, theme } from 'antd';
import { ScriptBuilderContainer } from '../components/feature-modules/script-builder';
import type { Script } from '../components/feature-modules/script-builder';

const { Title, Paragraph, Text } = Typography;

/**
 * 模拟设备数据
 */
const MOCK_DEVICES = [
  { id: 'device1', name: 'Android Device 1', status: 'online' },
  { id: 'device2', name: 'Android Device 2', status: 'offline' },
  { id: 'device3', name: 'Android Device 3', status: 'online' },
];

/**
 * 示例脚本数据
 */
const EXAMPLE_SCRIPT: Script = {
  id: 'example-script-1',
  name: '示例脚本 - 小红书自动点赞',
  description: '这是一个示例脚本，演示如何在小红书上进行自动点赞操作',
  version: '1.0.0',
  author: '脚本构建器',
  targetPackage: 'com.xingin.xhs',
  steps: [
    {
      id: 'step-1',
      type: 'tap',
      name: '点击搜索框',
      description: '点击顶部搜索框准备输入',
      parameters: {
        matching: {
          strategy: 'standard',
          fields: ['resource-id'],
          values: { 'resource-id': 'com.xingin.xhs:id/search_edit' },
        },
        delay: 1000,
        retries: 3,
        timeout: 10000,
        screenshot: true,
      },
      status: 'pending',
      enabled: true,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'step-2',
      type: 'input',
      name: '输入搜索关键词',
      description: '在搜索框中输入要搜索的内容',
      parameters: {
        text: '美食推荐',
        clearFirst: true,
        inputMethod: 'type',
        hidden: false,
        matching: {
          strategy: 'standard',
          fields: ['resource-id'],
          values: { 'resource-id': 'com.xingin.xhs:id/search_edit' },
        },
        delay: 500,
        retries: 3,
        timeout: 10000,
      },
      status: 'pending',
      enabled: true,
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'step-3',
      type: 'tap',
      name: '点击搜索按钮',
      description: '点击搜索按钮执行搜索',
      parameters: {
        matching: {
          strategy: 'standard',
          fields: ['text'],
          values: { text: '搜索' },
        },
        delay: 1000,
        retries: 3,
        timeout: 10000,
      },
      status: 'pending',
      enabled: true,
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'step-4',
      type: 'wait',
      name: '等待搜索结果加载',
      description: '等待搜索结果页面完全加载',
      parameters: {
        duration: 3000,
        condition: {
          type: 'element_visible',
          timeout: 10000,
        },
        delay: 0,
      },
      status: 'pending',
      enabled: true,
      order: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'step-5',
      type: 'tap',
      name: '点击第一个笔记',
      description: '点击搜索结果中的第一个笔记',
      parameters: {
        matching: {
          strategy: 'relaxed',
          fields: ['class'],
          values: { class: 'android.view.ViewGroup' },
        },
        delay: 1000,
        retries: 5,
        timeout: 15000,
        screenshot: true,
      },
      status: 'pending',
      enabled: true,
      order: 4,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'step-6',
      type: 'tap',
      name: '点击点赞按钮',
      description: '点击笔记的点赞按钮',
      parameters: {
        matching: {
          strategy: 'standard',
          fields: ['resource-id'],
          values: { 'resource-id': 'com.xingin.xhs:id/like_button' },
        },
        delay: 1500,
        retries: 3,
        timeout: 10000,
        screenshot: true,
      },
      status: 'pending',
      enabled: true,
      order: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'step-7',
      type: 'wait',
      name: '等待点赞完成',
      description: '等待点赞动画和反馈完成',
      parameters: {
        duration: 2000,
        delay: 0,
      },
      status: 'pending',
      enabled: true,
      order: 6,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  config: {
    executionMode: 'sequential',
    globalDelay: 1000,
    globalRetries: 3,
    globalTimeout: 30000,
    autoScreenshot: true,
    screenshotInterval: 5000,
    errorHandling: 'stop',
    logLevel: 'info',
  },
  status: 'ready',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: ['小红书', '自动化', '点赞', '测试'],
};

/**
 * 脚本构建器测试页面组件
 */
export const ScriptBuilderTestPage: React.FC = () => {
  const { token } = theme.useToken();
  const [selectedDevice, setSelectedDevice] = useState<string>('device1');
  const [useExampleScript, setUseExampleScript] = useState(false);

  const handleScriptSave = (script: Script) => {
    console.log('保存脚本:', script);
    // 这里可以实现脚本保存逻辑
  };

  const handleScriptLoad = (scriptId: string) => {
    console.log('加载脚本:', scriptId);
    // 这里可以实现脚本加载逻辑
  };

  const handleScriptDelete = (scriptId: string) => {
    console.log('删除脚本:', scriptId);
    // 这里可以实现脚本删除逻辑
  };

  return (
    <div style={{ padding: token.paddingLG, background: token.colorBgLayout, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card style={{ marginBottom: token.marginLG }}>
          <Title level={2}>脚本构建器模块测试</Title>
          <Paragraph>
            这个页面用于测试脚本构建器模块的各项功能，包括：
          </Paragraph>
          <ul>
            <li><Text strong>脚本创建和编辑</Text> - 创建新脚本、编辑脚本信息</li>
            <li><Text strong>步骤管理</Text> - 添加、编辑、删除、排序脚本步骤</li>
            <li><Text strong>参数配置</Text> - 详细配置每个步骤的执行参数</li>
            <li><Text strong>执行控制</Text> - 模拟脚本执行、监控进度、查看日志</li>
            <li><Text strong>验证功能</Text> - 步骤参数验证和错误提示</li>
          </ul>

          <Divider />

          <Space wrap>
            <Button
              type={useExampleScript ? 'default' : 'primary'}
              onClick={() => setUseExampleScript(false)}
            >
              创建新脚本
            </Button>
            <Button
              type={useExampleScript ? 'primary' : 'default'}
              onClick={() => setUseExampleScript(true)}
            >
              加载示例脚本
            </Button>
          </Space>

          {useExampleScript && (
            <Alert
              style={{ marginTop: token.margin }}
              message="示例脚本已加载"
              description="当前加载的是一个小红书自动点赞的示例脚本，包含7个步骤，您可以查看、编辑或执行这个脚本。"
              type="info"
              showIcon
            />
          )}
        </Card>

        {/* 脚本构建器主界面 */}
        <div 
          style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: 6, 
            overflow: 'hidden',
            background: 'var(--bg-light-base, #ffffff)',
            color: 'var(--text-inverse, #1e293b)',
          }}
          className="light-theme-force"
        >
          <ScriptBuilderContainer
            initialScript={useExampleScript ? EXAMPLE_SCRIPT : undefined}
            availableDevices={MOCK_DEVICES}
            selectedDevice={selectedDevice}
            onDeviceSelect={setSelectedDevice}
            onScriptSave={handleScriptSave}
            onScriptLoad={handleScriptLoad}
            onScriptDelete={handleScriptDelete}
          />
        </div>

        {/* 功能说明 */}
        <Card style={{ marginTop: token.marginLG }} title="功能说明">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>🎯 基本操作：</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>点击左侧"添加步骤"创建新的脚本步骤</li>
                <li>点击步骤卡片进行选择，使用更多操作菜单编辑或删除</li>
                <li>拖拽步骤卡片可以调整执行顺序</li>
                <li>切换步骤的启用/禁用状态</li>
              </ul>
            </div>

            <div>
              <Text strong>⚙️ 步骤编辑：</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>支持点击、输入、滑动、等待、截图、循环等多种步骤类型</li>
                <li>每种步骤类型都有专门的参数配置界面</li>
                <li>实时参数验证和错误提示</li>
                <li>高级设置包括延迟、超时、重试等选项</li>
              </ul>
            </div>

            <div>
              <Text strong>🚀 执行控制：</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>选择执行设备和执行范围</li>
                <li>实时监控执行进度和当前步骤</li>
                <li>查看详细的执行日志</li>
                <li>支持暂停、继续、停止执行</li>
              </ul>
            </div>

            <div>
              <Text strong>💾 脚本管理：</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>保存、加载、复制、删除脚本</li>
                <li>导出/导入脚本文件</li>
                <li>脚本版本管理和标签分类</li>
              </ul>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};