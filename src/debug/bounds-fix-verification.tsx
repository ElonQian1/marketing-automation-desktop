// src/debug/bounds-fix-verification.tsx
// module: debug | layer: debug | role: 验证页面
// summary: 验证菜单bounds修复是否生效

import React, { useState, useCallback } from 'react';
import { Card, Button, Space, Typography, Divider, Alert } from 'antd';
import { BugOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { UIElement } from '../api/universalUIAPI';
import type { SmartScriptStep } from '../types/smartScript';
import { useV2StepTest } from '../hooks/useV2StepTest';
import { MenuBoundsTest } from './menu-bounds-test';
import { BoundsDebuggingTool } from './bounds-debugging';

const { Title, Text, Paragraph } = Typography;

/**
 * Bounds修复验证页面
 */
export const BoundsFixVerificationPage: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    correctElement: any;
    buggyElement: any;
    v2TestResult?: any;
  }>({
    correctElement: null,
    buggyElement: null
  });

  const { executeStep } = useV2StepTest();

  // 测试正确的菜单元素
  const testCorrectMenuElement = useCallback(async () => {
    console.log('🧪 [验证] 测试正确的菜单元素...');
    
    const correctElement = MenuBoundsTest.createMockMenuElement();
    
    // 模拟转换为Step
    const mockStep: SmartScriptStep = {
      id: 'test_correct_menu',
      name: '测试正确菜单',
      step_type: 'smart_find_element',
      parameters: {
        element_selector: correctElement.xpath || '',
        text: correctElement.text || '',
        bounds: JSON.stringify(correctElement.bounds),
        resource_id: correctElement.resource_id || '',
        content_desc: correctElement.content_desc || ''
      },
      enabled: true
    };

    // 验证bounds处理
    const boundsValidation = BoundsDebuggingTool.validateMenuElementBounds(
      correctElement.id,
      correctElement.text,
      correctElement.bounds
    );

    setTestResults(prev => ({
      ...prev,
      correctElement: {
        element: correctElement,
        step: mockStep,
        validation: boundsValidation
      }
    }));

    console.log('✅ [验证] 正确菜单元素测试完成');
  }, []);

  // 测试错误的菜单元素（触发修复逻辑）
  const testBuggyMenuElement = useCallback(async () => {
    console.log('🧪 [验证] 测试错误的菜单元素（应该触发自动修复）...');
    
    const buggyElement = MenuBoundsTest.createBuggyMenuElement();
    
    // 模拟转换为Step
    const mockStep: SmartScriptStep = {
      id: 'test_buggy_menu',
      name: '测试错误菜单（自动修复）',
      step_type: 'smart_find_element',
      parameters: {
        element_selector: buggyElement.xpath || '',
        text: buggyElement.text || '',
        bounds: JSON.stringify(buggyElement.bounds),
        resource_id: buggyElement.resource_id || '',
        content_desc: buggyElement.content_desc || ''
      },
      enabled: true
    };

    // 验证bounds处理
    const boundsValidation = BoundsDebuggingTool.validateMenuElementBounds(
      buggyElement.id,
      buggyElement.text,
      buggyElement.bounds
    );

    setTestResults(prev => ({
      ...prev,
      buggyElement: {
        element: buggyElement,
        step: mockStep,
        validation: boundsValidation
      }
    }));

    console.log('✅ [验证] 错误菜单元素测试完成');
  }, []);

  // 测试V2引擎执行（模拟真实执行）
  const testV2Execution = useCallback(async () => {
    if (!testResults.correctElement) {
      alert('请先测试正确的菜单元素');
      return;
    }

    try {
      console.log('🚀 [验证] 测试V2引擎执行...');
      
      const result = await executeStep(testResults.correctElement.step);
      
      setTestResults(prev => ({
        ...prev,
        v2TestResult: result
      }));

      console.log('✅ [验证] V2引擎测试完成:', result);
    } catch (error) {
      console.error('❌ [验证] V2引擎测试失败:', error);
    }
  }, [testResults.correctElement, executeStep]);

  // 运行所有测试
  const runAllTests = useCallback(() => {
    console.log('🎯 [验证] 开始运行所有bounds测试...');
    
    testCorrectMenuElement();
    setTimeout(() => testBuggyMenuElement(), 500);
    
    // 清除之前的调试日志
    BoundsDebuggingTool.clearDebugLog();
    
    console.log('🎯 [验证] 所有测试已启动');
  }, [testCorrectMenuElement, testBuggyMenuElement]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 页面标题 */}
        <Card>
          <Title level={2}>
            <BugOutlined style={{ color: '#ff4d4f' }} /> Bounds修复验证页面
          </Title>
          <Paragraph>
            验证菜单元素bounds修复逻辑是否正常工作。测试"智能自动链选择模式:第一个"的bounds转换过程。
          </Paragraph>
          
          <Alert
            type="info"
            message="测试说明"
            description={
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>正确元素测试</strong>：验证bounds="[39,143][102,206]"的菜单元素处理</li>
                <li><strong>错误元素测试</strong>：验证bounds为错误对象时的自动修复</li>
                <li><strong>V2引擎测试</strong>：验证修复后的bounds能否正确传递给后端</li>
              </ul>
            }
          />
        </Card>

        {/* 操作按钮 */}
        <Card title="测试操作">
          <Space wrap>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={runAllTests}
            >
              运行所有测试
            </Button>
            <Button onClick={testCorrectMenuElement}>
              测试正确菜单元素
            </Button>
            <Button onClick={testBuggyMenuElement}>
              测试错误菜单元素
            </Button>
            <Button 
              onClick={testV2Execution}
              disabled={!testResults.correctElement}
            >
              测试V2引擎执行
            </Button>
          </Space>
        </Card>

        {/* 测试结果 */}
        {testResults.correctElement && (
          <Card title="✅ 正确菜单元素测试结果">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>原始Element:</Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  {JSON.stringify(testResults.correctElement.element, null, 2)}
                </pre>
              </div>
              <div>
                <Text strong>转换后Step参数:</Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  {JSON.stringify(testResults.correctElement.step.parameters, null, 2)}
                </pre>
              </div>
              <div>
                <Text strong>Bounds验证结果:</Text>
                <Alert
                  type={testResults.correctElement.validation.isValid ? 'success' : 'error'}
                  message={testResults.correctElement.validation.message}
                />
              </div>
            </Space>
          </Card>
        )}

        {testResults.buggyElement && (
          <Card title="🔧 错误菜单元素测试结果（自动修复）">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>原始Element (错误bounds):</Text>
                <pre style={{ background: '#fff2f0', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  {JSON.stringify(testResults.buggyElement.element, null, 2)}
                </pre>
              </div>
              <div>
                <Text strong>转换后Step参数:</Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  {JSON.stringify(testResults.buggyElement.step.parameters, null, 2)}
                </pre>
              </div>
              <div>
                <Text strong>Bounds验证结果:</Text>
                <Alert
                  type={testResults.buggyElement.validation.isValid ? 'success' : 'warning'}
                  message={testResults.buggyElement.validation.message}
                  description={testResults.buggyElement.validation.suggestedFix}
                />
              </div>
            </Space>
          </Card>
        )}

        {testResults.v2TestResult && (
          <Card title="🚀 V2引擎执行结果">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                type={testResults.v2TestResult.success ? 'success' : 'error'}
                message={`执行${testResults.v2TestResult.success ? '成功' : '失败'}: ${testResults.v2TestResult.message}`}
              />
              <div>
                <Text strong>详细结果:</Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                  {JSON.stringify(testResults.v2TestResult, null, 2)}
                </pre>
              </div>
            </Space>
          </Card>
        )}

        <Divider />
        
        {/* 调试信息 */}
        <Card title="🔍 调试信息">
          <Text type="secondary">
            请打开浏览器控制台查看详细的bounds转换调试日志。
            所有修复逻辑都会在控制台输出详细的转换过程。
          </Text>
        </Card>

      </Space>
    </div>
  );
};

export default BoundsFixVerificationPage;