// src/test/button-recognition-fix-test.tsx
// module: test | layer: ui | role: 按钮识别修复测试
// summary: 验证"已关注"vs"关注"按钮识别修复是否生效

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, Row, Col } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useIntelligentStepCardIntegration } from '../pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration';
import { useIntelligentAnalysisWorkflow } from '../modules/universal-ui/hooks/use-intelligent-analysis-workflow';
import type { UIElement } from '../api/universalUIAPI';

const { Title, Text, Paragraph } = Typography;

interface ButtonTestCase {
  id: string;
  name: string;
  element: UIElement;
  expectedType: '已关注按钮' | '关注按钮' | '其他按钮';
  description: string;
}

export const ButtonRecognitionFixTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, {
    success: boolean;
    actualType: string;
    expectedType: string;
    debugInfo?: any;
  }>>({});

  // 初始化智能分析系统
  const analysisWorkflow = useIntelligentAnalysisWorkflow();
  const integration = useIntelligentStepCardIntegration({
    steps: [],
    setSteps: () => {},
    analysisWorkflow
  });

  // 测试用例：基于真实XML中的按钮数据
  const testCases: ButtonTestCase[] = [
    {
      id: 'followed_button_1',
      name: '已关注按钮测试 - 胖嘟嘟',
      expectedType: '已关注按钮',
      description: '用户胖嘟嘟的已关注按钮，应该识别为已关注类型',
      element: {
        id: 'element_followed_1',
        xpath: '//android.view.ViewGroup[@content-desc="已关注"]',
        text: '已关注',
        content_desc: '已关注',
        resource_id: '',
        class_name: 'android.view.ViewGroup',
        element_type: 'tap',
        bounds: { left: 786, top: 749, right: 965, bottom: 822 },
        is_clickable: true,
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false
      }
    },
    {
      id: 'followed_button_2',
      name: '已关注按钮测试 - HaloooCccccc',
      expectedType: '已关注按钮',
      description: '用户HaloooCccccc的已关注按钮，应该识别为已关注类型',
      element: {
        id: 'element_followed_2',
        xpath: '//android.view.ViewGroup[@content-desc="已关注"]',
        text: '已关注',
        content_desc: '已关注',
        resource_id: '',
        class_name: 'android.view.ViewGroup',
        element_type: 'tap',
        bounds: { left: 786, top: 938, right: 965, bottom: 1011 },
        is_clickable: true,
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false
      }
    },
    {
      id: 'follow_button_1',
      name: '关注按钮测试 - 德森烘焙店',
      expectedType: '关注按钮',
      description: '德森烘焙店的关注按钮，应该识别为关注类型',
      element: {
        id: 'element_follow_1',
        xpath: '//android.view.ViewGroup[@content-desc="关注"]',
        text: '关注',
        content_desc: '关注',
        resource_id: '',
        class_name: 'android.view.ViewGroup',
        element_type: 'tap',
        bounds: { left: 786, top: 1505, right: 965, bottom: 1578 },
        is_clickable: true,
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false
      }
    },
    {
      id: 'follow_button_2',
      name: '关注按钮测试 - 嫑',
      expectedType: '关注按钮',
      description: '用户嫑的关注按钮，应该识别为关注类型',
      element: {
        id: 'element_follow_2',
        xpath: '//android.view.ViewGroup[@content-desc="关注"]',
        text: '关注',
        content_desc: '关注',
        resource_id: '',
        class_name: 'android.view.ViewGroup',
        element_type: 'tap',
        bounds: { left: 786, top: 1694, right: 965, bottom: 1767 },
        is_clickable: true,
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false
      }
    },
    {
      id: 'other_button',
      name: '其他按钮测试 - 添加好友',
      expectedType: '其他按钮',
      description: '添加好友按钮，应该识别为其他类型（不是关注相关）',
      element: {
        id: 'element_other',
        xpath: '//android.widget.TextView[@text="添加好友"]',
        text: '添加好友',
        content_desc: '',
        resource_id: '',
        class_name: 'android.widget.TextView',
        element_type: 'tap',
        bounds: { left: 432, top: 140, right: 600, bottom: 196 },
        is_clickable: true,
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false
      }
    }
  ];

  // 执行单个测试用例
  const runTest = async (testCase: ButtonTestCase) => {
    try {
      console.log(`🧪 [ButtonTest] 开始测试: ${testCase.name}`);
      
      // 捕获转换过程中的调试输出
      const originalLog = console.log;
      let capturedDebugInfo: any = null;
      
      console.log = (...args) => {
        if (args[0] && args[0].includes('convertElementToContext') && args[1]?.smartMatching) {
          capturedDebugInfo = args[1].smartMatching;
        }
        originalLog(...args);
      };
      
      // 调用转换函数（这会触发我们的修复逻辑）
      await integration.handleElementSelected(testCase.element);
      
      // 恢复console.log
      console.log = originalLog;
      
      const actualType = capturedDebugInfo?.buttonType || '未识别';
      const success = actualType === testCase.expectedType;
      
      setTestResults(prev => ({
        ...prev,
        [testCase.id]: {
          success,
          actualType,
          expectedType: testCase.expectedType,
          debugInfo: capturedDebugInfo
        }
      }));
      
      console.log(`✅ [ButtonTest] 测试完成: ${testCase.name} - ${success ? '通过' : '失败'}`);
      
    } catch (error) {
      console.error(`❌ [ButtonTest] 测试失败: ${testCase.name}`, error);
      setTestResults(prev => ({
        ...prev,
        [testCase.id]: {
          success: false,
          actualType: '错误',
          expectedType: testCase.expectedType,
          debugInfo: { error: error.message }
        }
      }));
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    console.log('🚀 [ButtonTest] 开始运行按钮识别测试套件');
    setTestResults({});
    
    for (const testCase of testCases) {
      await runTest(testCase);
      // 添加小延迟避免测试冲突
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ [ButtonTest] 所有测试运行完成');
  };

  // 计算测试统计
  const results = Object.values(testResults);
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const allTestsRun = totalTests === testCases.length;
  const allTestsPassed = allTestsRun && passedTests === totalTests;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🎯 按钮识别修复测试</Title>
      
      <Alert 
        type="info" 
        message="测试目标" 
        description="验证V3智能分析系统能否正确区分'已关注'和'关注'按钮，避免生成错误的步骤卡片。" 
        style={{ marginBottom: '24px' }}
      />

      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>测试控制</Title>
              <Text type="secondary">共 {testCases.length} 个测试用例</Text>
            </Space>
          </Col>
          <Col>
            <Button type="primary" onClick={runAllTests} size="large">
              运行所有测试
            </Button>
          </Col>
        </Row>
        
        {allTestsRun && (
          <div style={{ marginTop: '16px' }}>
            <Alert 
              type={allTestsPassed ? 'success' : 'warning'}
              message={
                <Space>
                  {allTestsPassed ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                  <Text strong>
                    测试结果: {passedTests}/{totalTests} 通过
                  </Text>
                </Space>
              }
              description={
                allTestsPassed 
                  ? "🎉 所有测试通过！按钮识别修复成功。" 
                  : `❌ ${failedTests} 个测试失败，需要进一步调试。`
              }
            />
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {testCases.map((testCase) => {
          const result = testResults[testCase.id];
          const status = !result ? 'default' : result.success ? 'success' : 'error';
          
          return (
            <Col xs={24} lg={12} key={testCase.id}>
              <Card 
                size="small"
                title={
                  <Space>
                    <Text strong>{testCase.name}</Text>
                    {result && (
                      result.success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                                    : <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                  </Space>
                }
                extra={
                  <Button size="small" onClick={() => runTest(testCase)}>
                    单独测试
                  </Button>
                }
              >
                <Paragraph style={{ fontSize: '12px', margin: '8px 0' }}>
                  {testCase.description}
                </Paragraph>
                
                <div style={{ fontSize: '12px' }}>
                  <Text strong>元素信息：</Text>
                  <div style={{ marginLeft: '8px', color: '#666' }}>
                    <div>文本: "{testCase.element.text}"</div>
                    <div>描述: "{testCase.element.content_desc}"</div>
                    <div>坐标: {JSON.stringify(testCase.element.bounds)}</div>
                  </div>
                </div>
                
                {result && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ fontSize: '12px' }}>
                      <div>
                        <Text strong>期望类型:</Text> <Text>{result.expectedType}</Text>
                      </div>
                      <div>
                        <Text strong>实际类型:</Text> 
                        <Text type={result.success ? 'success' : 'danger'}>
                          {result.actualType}
                        </Text>
                      </div>
                      
                      {result.debugInfo && (
                        <details style={{ marginTop: '8px' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '11px' }}>
                            调试信息
                          </summary>
                          <pre style={{ 
                            fontSize: '10px', 
                            background: '#f5f5f5', 
                            padding: '8px', 
                            marginTop: '4px',
                            overflow: 'auto'
                          }}>
                            {JSON.stringify(result.debugInfo, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card style={{ marginTop: '24px' }} title="🔧 修复原理说明">
        <Paragraph>
          <Text strong>问题根源：</Text> 
          用户选择"已关注"按钮时，系统错误生成了"关注"类型的步骤卡片，
          说明智能分析系统没有正确区分不同类型的按钮。
        </Paragraph>
        
        <Paragraph>
          <Text strong>修复方案：</Text>
        </Paragraph>
        <ul style={{ paddingLeft: '20px' }}>
          <li><Text code>智能文本分析</Text>: 在convertElementToContext中识别按钮类型</li>
          <li><Text code>互斥排除规则</Text>: 选择"已关注"时排除["关注", "+关注", "Follow"]</li>
          <li><Text code>V3智能分析</Text>: 启用V3系统的Step 0-6策略分析</li>
          <li><Text code>调试增强</Text>: 添加详细的按钮类型识别日志</li>
        </ul>
        
        <Paragraph>
          <Text strong>验证标准：</Text> 
          所有测试用例都应该正确识别按钮类型，并生成对应的智能匹配配置。
        </Paragraph>
      </Card>
    </div>
  );
};

export default ButtonRecognitionFixTest;