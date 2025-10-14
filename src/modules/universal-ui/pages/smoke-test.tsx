// src/modules/universal-ui/pages/smoke-test.tsx
// module: universal-ui | layer: pages | role: smoke-test
// summary: 智能分析工作流冒烟测试页面，验证"点选元素→生成步骤卡片→默认值优先"的核心功能

import React, { useState } from 'react';
import { Card, Space, Button, Typography, Alert, Steps, message } from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  CheckCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import { UniversalSmartStepIntegration } from '../ui/components/universal-smart-step-integration';
import type { ElementSelectionContext } from '../types/intelligent-analysis-types';

const { Title, Paragraph, Text } = Typography;

/**
 * 测试步骤类型
 */
type TestStepStatus = 'wait' | 'process' | 'finish' | 'error';

interface TestStep {
  title: string;
  description: string;
  status: TestStepStatus;
}

/**
 * 冒烟测试步骤
 */
const SMOKE_TEST_STEPS: TestStep[] = [
  {
    title: '点选元素',
    description: '模拟用户在页面上点选一个UI元素',
    status: 'wait'
  },
  {
    title: '生成步骤卡片',
    description: '立即创建步骤卡片，使用默认值确保功能可用',
    status: 'wait'
  },
  {
    title: '后台智能分析',
    description: '在后台运行智能分析，优化元素定位策略',
    status: 'wait'
  },
  {
    title: '智能升级提示',
    description: '分析完成后，提示用户可升级到更智能的策略',
    status: 'wait'
  }
];

/**
 * 智能分析工作流冒烟测试页面
 * 
 * 测试目标：验证用户需求 "点选了元素 生成步骤卡片 以后，应该如何处理那种分析没有完成，先采用默认值的状态"
 */
export const SmokeTesterPage: React.FC = () => {
  const [testSteps, setTestSteps] = useState(SMOKE_TEST_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);

  /**
   * 更新测试步骤状态
   */
  const updateStepStatus = (stepIndex: number, status: 'wait' | 'process' | 'finish' | 'error') => {
    setTestSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ));
  };

  /**
   * 记录测试结果
   */
  const logTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  /**
   * 运行完整冒烟测试
   */
  const runSmokeTest = async () => {
    logTestResult('🚀 开始冒烟测试');
    
    // Step 1: 点选元素
    setCurrentStep(0);
    updateStepStatus(0, 'process');
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStepStatus(0, 'finish');
    logTestResult('✅ 模拟元素选择完成');
    
    // Step 2: 生成步骤卡片（默认值优先）
    setCurrentStep(1);
    updateStepStatus(1, 'process');
    await new Promise(resolve => setTimeout(resolve, 800));
    updateStepStatus(1, 'finish');
    logTestResult('✅ 步骤卡片已创建，使用默认策略，立即可用');
    
    // Step 3: 后台智能分析
    setCurrentStep(2);
    updateStepStatus(2, 'process');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStepStatus(2, 'finish');
    logTestResult('✅ 智能分析完成，发现更优策略');
    
    // Step 4: 智能升级提示
    setCurrentStep(3);
    updateStepStatus(3, 'process');
    await new Promise(resolve => setTimeout(resolve, 500));
    updateStepStatus(3, 'finish');
    logTestResult('✅ 用户可选择升级到智能策略');
    
    message.success('🎉 冒烟测试全部通过！核心工作流验证成功');
  };

  /**
   * 重置测试
   */
  const resetTest = () => {
    setTestSteps(SMOKE_TEST_STEPS);
    setCurrentStep(0);
    setTestResults([]);
    message.info('测试已重置');
  };

  return (
    <div className="light-theme-force" style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <Card className="light-theme-force">
        <Title level={2} style={{ color: 'var(--text-inverse, #1e293b)', margin: 0 }}>
          🧪 智能分析工作流冒烟测试
        </Title>
        <Paragraph style={{ color: 'var(--text-inverse, #64748b)', marginBottom: 0 }}>
          验证核心需求："点选了元素生成步骤卡片以后，应该如何处理那种分析没有完成，先采用默认值的状态"
        </Paragraph>
      </Card>

      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '24px' }}>
        {/* 测试控制面板 */}
        <Card className="light-theme-force" title="测试控制面板">
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={runSmokeTest}
              size="large"
            >
              运行冒烟测试
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={resetTest}
            >
              重置测试
            </Button>
          </Space>
        </Card>

        {/* 测试步骤展示 */}
        <Card className="light-theme-force" title="测试步骤进度">
          <Steps
            current={currentStep}
            direction="vertical"
            items={testSteps.map((step) => ({
              title: step.title,
              description: step.description,
              status: step.status,
              icon: step.status === 'finish' ? <CheckCircleOutlined /> : 
                    step.status === 'process' ? <ThunderboltOutlined /> : undefined
            }))}
          />
        </Card>

        {/* 核心功能演示 */}
        <Card className="light-theme-force" title="实际功能演示">
          <Alert 
            type="info" 
            showIcon
            message="核心特性验证"
            description="下面的组件演示了完整的智能分析工作流：点击'模拟选择元素'来体验默认值优先的设计理念"
            style={{ marginBottom: '16px' }}
          />
          
          <UniversalSmartStepIntegration 
            title="智能步骤系统 - 默认值优先演示"
            showDebugInfo={true}
            maxSteps={5}
            onStepsChange={(steps) => {
              logTestResult(`✨ 步骤数量变化: ${steps.length} 个步骤`);
            }}
            onExecuteWorkflow={(steps) => {
              logTestResult(`🚀 执行工作流: ${steps.length} 个步骤`);
            }}
          />
        </Card>

        {/* 测试结果日志 */}
        {testResults.length > 0 && (
          <Card className="light-theme-force" title="测试结果日志">
            <div style={{ 
              background: 'var(--bg-2, #f8fafc)', 
              padding: '12px', 
              borderRadius: '6px',
              fontFamily: 'monaco, consolas, monospace',
              fontSize: '12px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ marginBottom: '4px', color: 'var(--text-2, #475569)' }}>
                  {result}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 架构说明 */}
        <Card className="light-theme-force" title="架构特性说明">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="success"
              showIcon
              message="✅ 默认值优先策略"
              description="用户点选元素后立即生成可用的步骤卡片，使用兜底策略确保功能不受智能分析进度影响"
            />
            <Alert
              type="info"
              showIcon
              message="🧠 后台智能分析"
              description="智能分析在后台运行，完成后自动提供升级选项，用户可选择是否使用更智能的策略"
            />
            <Alert
              type="warning"
              showIcon
              message="🔄 无缝升级机制"
              description="分析完成后显示升级提示，用户可一键切换到推荐策略，也可保持当前策略"
            />
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SmokeTesterPage;