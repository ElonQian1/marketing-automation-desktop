// src/pages/ExecutionFlowTestPage.tsx
// module: pages | layer: ui | role: 测试页面
// summary: 执行流程控制功能测试页面

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, message, Alert } from 'antd';
import { PlayCircleOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { ModernStepCard } from '../components/step-cards/ModernStepCard';
import { 
  ExecutionFailureStrategy,
  hasValidFailureHandling,
  getStepFailureStrategy
} from '../modules/execution-flow-control';
import type { ExtendedSmartScriptStep } from '../types/loopScript';

const { Title, Text, Paragraph } = Typography;

// 创建测试步骤数据
const createTestSteps = (): ExtendedSmartScriptStep[] => [
  {
    id: 'step-1',
    step_type: 'click',
    name: '点击按钮1',
    description: '点击第一个按钮',
    parameters: { selector: 'button#btn1' },
    enabled: true,
    order: 1,
    failureHandling: {
      strategy: 'CONTINUE_NEXT',
      enabled: true,
      retryCount: 2,
      retryDelay: 1000
    }
  },
  {
    id: 'step-2',
    step_type: 'input',
    name: '输入文本',
    description: '在输入框中输入文本',
    parameters: { selector: 'input#text1', value: 'Hello World' },
    enabled: true,
    order: 2,
    failureHandling: {
      strategy: 'RETRY_CURRENT',
      enabled: true,
      retryCount: 3,
      retryDelay: 500
    }
  },
  {
    id: 'step-3',
    step_type: 'click',
    name: '关键步骤',
    description: '这是一个关键步骤，失败时停止执行',
    parameters: { selector: 'button#critical' },
    enabled: true,
    order: 3,
    failureHandling: {
      strategy: 'STOP_SCRIPT',
      enabled: true,
      retryCount: 1,
      retryDelay: 1000
    }
  },
  {
    id: 'step-4',
    step_type: 'click',
    name: '点击按钮4',
    description: '点击第四个按钮',
    parameters: { selector: 'button#btn4' },
    enabled: true,
    order: 4
    // 没有失败处理配置
  },
  {
    id: 'step-5',
    step_type: 'click',
    name: '跳转步骤',
    description: '失败时跳转到第二步',
    parameters: { selector: 'button#jump' },
    enabled: true,
    order: 5,
    failureHandling: {
      strategy: 'JUMP_TO_STEP',
      jumpTarget: 'step-2',
      enabled: true,
      retryCount: 1,
      retryDelay: 1000
    }
  }
];

export const ExecutionFlowTestPage: React.FC = () => {
  const [steps, setSteps] = useState<ExtendedSmartScriptStep[]>(createTestSteps());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  // 更新步骤
  const handleStepUpdate = (updatedStep: ExtendedSmartScriptStep) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === updatedStep.id ? updatedStep : step
      )
    );
    message.success('步骤已更新');
  };

  // 模拟步骤执行器
  const mockStepExecutor = async (step: ExtendedSmartScriptStep): Promise<{
    success: boolean;
    message: string;
    executorType: string;
  }> => {
    console.log(`执行步骤: ${step.name}`);
    
    // 模拟延时
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟不同的执行结果
    switch (step.id) {
      case 'step-1':
        return { success: true, message: '点击成功', executorType: 'mock' };
      case 'step-2':
        // 50% 概率失败
        const success = Math.random() > 0.5;
        return { 
          success, 
          message: success ? '输入成功' : '输入框未找到', 
          executorType: 'mock' 
        };
      case 'step-3':
        // 总是失败，用于测试 STOP_SCRIPT
        return { success: false, message: '关键步骤失败', executorType: 'mock' };
      case 'step-4':
        return { success: true, message: '按钮4点击成功', executorType: 'mock' };
      case 'step-5':
        // 总是失败，用于测试 JUMP_TO_STEP
        return { success: false, message: '跳转触发失败', executorType: 'mock' };
      default:
        return { success: true, message: '步骤执行成功', executorType: 'mock' };
    }
  };

  // 执行脚本
  const handleExecuteScript = async () => {
    setIsExecuting(true);
    setExecutionLogs([]);
    
    try {
      console.log('🚀 开始执行测试脚本...');
      
      // 检查是否有失败处理配置
      const hasFailureHandling = steps.some(step => hasValidFailureHandling(step));
      
      console.log('失败处理检查:', hasFailureHandling);
      
      if (hasFailureHandling) {
        message.info('检测到失败处理配置，使用增强执行器');
        
        // 使用增强执行器（这里简化实现）
        const logs: string[] = [];
        let executedCount = 0;
        let failedCount = 0;
        
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          console.log(`执行步骤 ${i + 1}: ${step.name}`);
          logs.push(`开始执行步骤 ${i + 1}: ${step.name}`);
          setExecutionLogs([...logs]);
          
          try {
            const result = await mockStepExecutor(step);
            
            if (result.success) {
              executedCount++;
              logs.push(`✅ 步骤 ${i + 1}: ${step.name} - 成功`);
              console.log(`✅ 步骤 ${i + 1} 执行成功`);
            } else {
              failedCount++;
              logs.push(`❌ 步骤 ${i + 1}: ${step.name} - 失败: ${result.message}`);
              console.log(`❌ 步骤 ${i + 1} 执行失败: ${result.message}`);
              
              // 检查失败处理策略
              const strategy = getStepFailureStrategy(step);
              if (strategy) {
                logs.push(`🔧 应用失败处理策略: ${strategy}`);
                console.log(`应用失败处理策略: ${strategy}`);
                
                switch (strategy) {
                  case ExecutionFailureStrategy.STOP_SCRIPT:
                    logs.push('🛑 根据配置停止脚本执行');
                    console.log('🛑 停止脚本执行');
                    setExecutionLogs([...logs]);
                    message.error('脚本执行已停止');
                    return;
                    
                  case ExecutionFailureStrategy.CONTINUE_NEXT:
                    logs.push('⏭️ 继续执行下一步');
                    console.log('⏭️ 继续下一步');
                    break;
                    
                  case ExecutionFailureStrategy.JUMP_TO_STEP:
                    if (step.failureHandling?.jumpTarget) {
                      const targetIndex = steps.findIndex(s => s.id === step.failureHandling?.jumpTarget);
                      if (targetIndex >= 0) {
                        logs.push(`🎯 跳转到步骤 ${targetIndex + 1}`);
                        console.log(`🎯 跳转到步骤 ${targetIndex + 1}`);
                        i = targetIndex - 1; // -1 因为循环会自增
                      }
                    }
                    break;
                    
                  case ExecutionFailureStrategy.RETRY_CURRENT:
                    logs.push('🔄 重试当前步骤（简化实现，跳过重试逻辑）');
                    console.log('🔄 重试逻辑');
                    break;
                    
                  case ExecutionFailureStrategy.SKIP_CURRENT:
                    logs.push('⏭️ 跳过当前步骤');
                    console.log('⏭️ 跳过步骤');
                    break;
                }
              } else {
                logs.push('⏭️ 未配置失败处理，继续执行');
                console.log('⏭️ 使用默认行为');
              }
            }
            
            setExecutionLogs([...logs]);
            
            // 模拟步骤间延时
            if (i < steps.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
          } catch (error) {
            logs.push(`💥 步骤 ${i + 1} 执行异常: ${error}`);
            setExecutionLogs([...logs]);
            break;
          }
        }
        
        logs.push(`🏁 脚本执行完成: 成功${executedCount}/${steps.length}个步骤`);
        setExecutionLogs([...logs]);
        
        if (failedCount === 0) {
          message.success('所有步骤执行成功！');
        } else {
          message.warning(`部分步骤失败: 成功${executedCount}，失败${failedCount}`);
        }
        
      } else {
        message.info('未检测到失败处理配置，使用标准执行流程');
        setExecutionLogs(['使用标准执行流程...']);
      }
      
    } catch (error) {
      console.error('执行脚本时出错:', error);
      message.error('执行脚本时出错');
    } finally {
      setIsExecuting(false);
    }
  };

  // 添加测试步骤
  const addTestStep = () => {
    const newStep: ExtendedSmartScriptStep = {
      id: `step-${Date.now()}`,
      step_type: 'click',
      name: `新步骤 ${steps.length + 1}`,
      description: '这是一个新添加的测试步骤',
      parameters: { selector: `#btn${steps.length + 1}` },
      enabled: true,
      order: steps.length + 1
    };
    
    setSteps([...steps, newStep]);
    message.success('已添加新步骤');
  };

  return (
    <div style={{ padding: '24px', background: 'var(--bg-light-base)' }} className="light-theme-force">
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>执行流程控制功能测试</Title>
          <Paragraph>
            这个页面用于测试执行流程控制功能，包括失败处理策略的配置和执行。
            每个步骤都可以配置不同的失败处理策略。
          </Paragraph>
        </div>

        <Alert
          type="info"
          message="功能说明"
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>停止脚本</strong>：失败时立即停止整个脚本执行</li>
              <li><strong>继续下一步</strong>：忽略失败，继续执行下一步</li>
              <li><strong>跳转到指定步骤</strong>：失败时跳转到指定的步骤</li>
              <li><strong>重试当前步骤</strong>：失败时重试指定次数</li>
              <li><strong>跳过当前步骤</strong>：跳过当前步骤并继续</li>
            </ul>
          }
          style={{ marginBottom: '24px' }}
        />

        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              loading={isExecuting}
              onClick={handleExecuteScript}
            >
              执行脚本
            </Button>
            <Button 
              icon={<PlusOutlined />}
              onClick={addTestStep}
            >
              添加测试步骤
            </Button>
            <Text type="secondary">
              共 {steps.length} 个步骤，
              {steps.filter(s => hasValidFailureHandling(s)).length} 个配置了失败处理
            </Text>
          </Space>
        </div>

        <Divider>步骤配置</Divider>

        <div style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {steps.map((step, index) => (
              <ModernStepCard
                key={step.id}
                step={step}
                index={index}
                allSteps={steps}
                onStepUpdate={handleStepUpdate}
                style={{ width: '100%' }}
              />
            ))}
          </Space>
        </div>

        {executionLogs.length > 0 && (
          <>
            <Divider>执行日志</Divider>
            <Card 
              size="small" 
              style={{ 
                maxHeight: '300px', 
                overflow: 'auto',
                background: 'var(--bg-base)',
                color: 'var(--text-1)'
              }}
            >
              {executionLogs.map((log, index) => (
                <div key={index} style={{ 
                  padding: '4px 0', 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  borderBottom: index < executionLogs.length - 1 ? '1px solid var(--border-secondary)' : 'none'
                }}>
                  {log}
                </div>
              ))}
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};