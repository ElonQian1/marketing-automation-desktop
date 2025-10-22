// src/pages/test-unified-execution/TestUnifiedExecution.tsx
// module: test | layer: pages | role: 测试页面
// summary: 统一执行管道测试页面

import React, { useState, useCallback } from 'react';
import { Card, Button, Space, Alert, Descriptions, Typography, Divider, message, Spin } from 'antd';
import { PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useSingleStepTest } from '../../hooks/useSingleStepTest';
import { ActionSelector } from '../../components/action-system/ActionSelector';
import { ExecutionModeToggle } from '../../components/step-card/ExecutionModeToggle';
import type { SmartScriptStep } from '../../types/smartScript';
import type { ActionType } from '../../types/action-types';
import type { SingleStepTestResult } from '../../hooks/useSingleStepTest';
import { useAdb } from '../../application/hooks/useAdb';

const { Title, Text } = Typography;

export const TestUnifiedExecution: React.FC = () => {
  const [currentAction, setCurrentAction] = useState<ActionType>({
    type: 'click',
    params: {}
  });
  const [testResult, setTestResult] = useState<SingleStepTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    executeUnifiedStep, 
    executeStepWithMode, 
    executionMode, 
    setExecutionMode 
  } = useSingleStepTest();
  
  const { selectedDevice } = useAdb();

  // 创建测试步骤
  const createTestStep = useCallback((): SmartScriptStep => {
    return {
      id: 'test-unified-step',
      name: '测试统一执行',
      description: '统一执行测试步骤',
      step_type: 'smart_find_element',
      enabled: true,
      order: 1,
      parameters: {
        matching: {
          strategy: 'enhanced',
          selector_type: 'text',
          target_text: '确定',
          confidence_threshold: 0.8
        }
      },
      action: currentAction,
      confidence: 0,
      timestamp: Date.now()
    };
  }, [currentAction]);

  // 测试统一执行管道
  const testUnifiedPipeline = useCallback(async () => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    setIsLoading(true);
    try {
      const testStep = createTestStep();
      console.log('🚀 测试统一执行管道:', testStep);
      
      const result = await executeUnifiedStep(testStep, selectedDevice.id, executionMode);
      console.log('✅ 测试结果:', result);
      
      setTestResult(result);
      
      if (result.success) {
        message.success('统一执行管道测试成功');
      } else {
        message.error('统一执行管道测试失败');
      }
    } catch (error) {
      console.error('❌ 测试异常:', error);
      message.error(`测试异常: ${error}`);
      setTestResult({
        success: false,
        error: String(error),
        message: `测试异常: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice, executeUnifiedStep, executionMode, createTestStep]);

  // 测试模式切换执行
  const testModeToggle = useCallback(async () => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    setIsLoading(true);
    try {
      const testStep = createTestStep();
      console.log('🚀 测试模式切换执行:', testStep, executionMode);
      
      const result = await executeStepWithMode(testStep, selectedDevice.id);
      console.log('✅ 模式切换结果:', result);
      
      setTestResult(result);
      
      if (result.success) {
        message.success(`模式切换执行测试成功 (${executionMode})`);
      } else {
        message.error(`模式切换执行测试失败 (${executionMode})`);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error);
      message.error(`测试异常: ${error}`);
      setTestResult({
        success: false,
        error: String(error),
        message: `测试异常: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice, executeStepWithMode, executionMode, createTestStep]);

  return (
    <div className="light-theme-force" style={{ padding: 24, minHeight: '100vh', background: '#f5f5f5' }}>
      <Title level={2}>统一执行管道测试</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 设备状态 */}
        <Card title="设备状态" className="light-theme-force">
          {selectedDevice ? (
            <Alert 
              type="success" 
              message={`已连接设备: ${selectedDevice.name} (${selectedDevice.id})`}
              showIcon
            />
          ) : (
            <Alert 
              type="warning" 
              message="请先选择设备"
              showIcon
            />
          )}
        </Card>

        {/* 配置面板 */}
        <Card title="测试配置" className="light-theme-force">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>执行模式:</Text>
              <div style={{ marginTop: 8 }}>
                <ExecutionModeToggle 
                  mode={executionMode}
                  onChange={setExecutionMode}
                />
              </div>
            </div>
            
            <div>
              <Text strong>动作类型:</Text>
              <div style={{ marginTop: 8 }}>
                <ActionSelector
                  currentAction={currentAction}
                  onChange={setCurrentAction}
                  size="middle"
                  showIcon
                />
              </div>
            </div>
          </Space>
        </Card>

        {/* 测试按钮 */}
        <Card title="测试操作" className="light-theme-force">
          <Space wrap>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={isLoading}
              onClick={testUnifiedPipeline}
              disabled={!selectedDevice}
            >
              测试统一执行管道
            </Button>
            
            <Button
              icon={executionMode === 'execute-step' ? <PlayCircleOutlined /> : <SearchOutlined />}
              loading={isLoading}
              onClick={testModeToggle}
              disabled={!selectedDevice}
            >
              测试模式切换执行 ({executionMode === 'execute-step' ? '执行步骤' : '仅匹配'})
            </Button>
          </Space>
        </Card>

        {/* 测试结果 */}
        {testResult && (
          <Card title="测试结果" className="light-theme-force">
            <Spin spinning={isLoading}>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="执行状态">
                  <Alert
                    type={testResult.success ? 'success' : 'error'}
                    message={testResult.success ? '成功' : '失败'}
                    showIcon
                  />
                </Descriptions.Item>
                <Descriptions.Item label="消息">
                  {testResult.message}
                </Descriptions.Item>
                <Descriptions.Item label="执行时间">
                  {testResult.duration_ms}ms
                </Descriptions.Item>
                <Descriptions.Item label="时间戳">
                  {new Date(testResult.timestamp).toLocaleString()}
                </Descriptions.Item>
                {testResult.logs && testResult.logs.length > 0 && (
                  <Descriptions.Item label="日志">
                    <div style={{ maxHeight: 200, overflow: 'auto' }}>
                      {testResult.logs.map((log: string, index: number) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  </Descriptions.Item>
                )}
                {testResult.error_details && (
                  <Descriptions.Item label="错误详情">
                    <Text code style={{ color: 'red' }}>
                      {testResult.error_details}
                    </Text>
                  </Descriptions.Item>
                )}
                {testResult.extracted_data && (
                  <Descriptions.Item label="提取数据">
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>
                      {JSON.stringify(testResult.extracted_data, null, 2)}
                    </pre>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Spin>
          </Card>
        )}

        <Divider />
        
        {/* 说明文档 */}
        <Card title="功能说明" className="light-theme-force">
          <Space direction="vertical">
            <div>
              <Text strong>统一执行管道:</Text>
              <p>通过后端 `run_step` 命令实现元素匹配和动作执行的统一流程</p>
            </div>
            
            <div>
              <Text strong>执行模式:</Text>
              <ul>
                <li><Text code>execute-step</Text>: 完整执行步骤（匹配 + 动作）</li>
                <li><Text code>match-only</Text>: 仅执行元素匹配</li>
              </ul>
            </div>
            
            <div>
              <Text strong>动作类型:</Text>
              <ul>
                <li><Text code>Click</Text>: 点击动作</li>
                <li><Text code>LongPress</Text>: 长按动作</li>
                <li><Text code>Input</Text>: 输入动作</li>
                <li><Text code>SwipeUp/Down/Left/Right</Text>: 滑动动作</li>
                <li><Text code>Wait</Text>: 等待动作</li>
              </ul>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default TestUnifiedExecution;