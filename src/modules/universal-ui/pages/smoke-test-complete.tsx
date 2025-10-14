// src/modules/universal-ui/pages/smoke-test-complete.tsx
// module: universal-ui | layer: pages | role: smoke-test
// summary: 完整的智能分析工作流冒烟测试页面，验证"默认值优先"核心功能

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Space, 
  Button, 
  Typography, 
  Alert, 
  Steps, 
  message, 
  Divider,
  Row,
  Col,
  Timeline,
  Statistic
} from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  CheckCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  RocketOutlined,
  LoadingOutlined,
  BugOutlined
} from '@ant-design/icons';

import { useIntelligentAnalysisWorkflow } from '../hooks/use-intelligent-analysis-workflow';
import { UnifiedStepCard } from '../components/unified-step-card';
import type { ElementSelectionContext } from '../types/intelligent-analysis-types';

const { Paragraph, Text } = Typography;

/**
 * 测试阶段
 */
type TestPhase = 'idle' | 'element-selection' | 'step-creation' | 'analysis' | 'upgrade' | 'completed';

/**
 * 测试结果
 */
interface TestResult {
  timestamp: string;
  phase: TestPhase;
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

/**
 * 智能分析工作流完整冒烟测试页面
 * 
 * 🎯 核心验证：
 * 1. 点选元素后立即生成可用步骤卡片（默认值优先）
 * 2. 后台并行进行智能分析
 * 3. 分析完成后提供升级选项
 * 4. 整个过程用户体验流畅
 */
export const SmokeTestCompletePage: React.FC = () => {
  const [testPhase, setTestPhase] = useState<TestPhase>('idle');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [elementContext, setElementContext] = useState<ElementSelectionContext | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);

  // 使用智能分析工作流Hook
  const {
    stepCards,
    currentJobs,
    isAnalyzing,
    createStepCardQuick,
    startAnalysis,
    upgradeStep,
    getStepCard
  } = useIntelligentAnalysisWorkflow();

  /**
   * 记录测试结果
   */
  const logTestResult = useCallback((
    phase: TestPhase, 
    message: string, 
    status: TestResult['status'] = 'info'
  ) => {
    const result: TestResult = {
      timestamp: new Date().toLocaleTimeString(),
      phase,
      message,
      status
    };
    setTestResults(prev => [...prev, result]);
  }, []);

  /**
   * 创建模拟元素上下文
   */
  const createMockElementContext = useCallback((): ElementSelectionContext => {
    const mockId = Date.now().toString(36);
    return {
      snapshotId: `snapshot_${mockId}`,
      elementPath: `//*[@id="element_${mockId}"]`,
      elementText: `测试按钮 ${mockId.slice(-4)}`,
      elementBounds: JSON.stringify({ x: 100, y: 200, width: 120, height: 32 }),
      elementType: 'button',
      keyAttributes: {
        id: `element_${mockId}`,
        class: 'test-button',
        'data-testid': `btn-${mockId}`
      }
    };
  }, []);

  /**
   * 阶段1：模拟元素选择
   */
  const handleElementSelection = useCallback(async () => {
    setTestPhase('element-selection');
    logTestResult('element-selection', '🎯 开始模拟元素选择...');
    
    // 模拟用户点选元素的延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockContext = createMockElementContext();
    setElementContext(mockContext);
    
    logTestResult('element-selection', `✅ 元素选择完成：${mockContext.elementText}`, 'success');
    setTestPhase('step-creation');
    
    // 立即进入步骤创建阶段
    handleStepCreation(mockContext);
  }, [createMockElementContext, logTestResult]);

  /**
   * 阶段2：创建步骤卡片（默认值优先）
   */
  const handleStepCreation = useCallback(async (context: ElementSelectionContext) => {
    logTestResult('step-creation', '🚀 开始创建步骤卡片（使用默认值）...');
    
    try {
      const stepId = await createStepCardQuick(context);
      setCurrentStepId(stepId);
      
      logTestResult('step-creation', '✅ 步骤卡片创建成功，立即可用！', 'success');
      logTestResult('step-creation', '💡 步骤使用兜底策略，确保功能立即可用', 'info');
      
      setTestPhase('analysis');
      
      // 启动后台智能分析
      handleIntelligentAnalysis(context, stepId);
      
    } catch (error) {
      logTestResult('step-creation', `❌ 步骤创建失败：${error}`, 'error');
      message.error('步骤创建失败');
    }
  }, [createStepCardQuick, logTestResult]);

  /**
   * 阶段3：智能分析（后台运行）
   */
  const handleIntelligentAnalysis = useCallback(async (
    context: ElementSelectionContext, 
    stepId: string
  ) => {
    logTestResult('analysis', '🧠 启动智能分析（后台运行）...');
    
    try {
      await startAnalysis(context, stepId);
      logTestResult('analysis', '⚡ 智能分析已启动，不阻塞用户操作', 'info');
    } catch (error) {
      logTestResult('analysis', `❌ 分析启动失败：${error}`, 'error');
    }
  }, [startAnalysis, logTestResult]);

  /**
   * 阶段4：升级到智能策略
   */
  const handleUpgradeStrategy = useCallback(async () => {
    if (!currentStepId) return;
    
    setTestPhase('upgrade');
    logTestResult('upgrade', '⬆️ 开始升级到推荐策略...');
    
    try {
      await upgradeStep(currentStepId);
      logTestResult('upgrade', '✅ 策略升级成功！', 'success');
      setTestPhase('completed');
      logTestResult('completed', '🎉 冒烟测试全部完成！', 'success');
      message.success('冒烟测试全部通过！');
    } catch (error) {
      logTestResult('upgrade', `❌ 升级失败：${error}`, 'error');
    }
  }, [currentStepId, upgradeStep, logTestResult]);

  /**
   * 重置测试
   */
  const handleResetTest = useCallback(() => {
    setTestPhase('idle');
    setTestResults([]);
    setElementContext(null);
    setCurrentStepId(null);
    message.info('测试已重置');
  }, []);

  /**
   * 获取当前步骤的测试阶段
   */
  const getCurrentStepIndex = () => {
    const phaseOrder: TestPhase[] = ['idle', 'element-selection', 'step-creation', 'analysis', 'upgrade', 'completed'];
    return phaseOrder.indexOf(testPhase);
  };

  // 获取当前步骤卡片
  const currentStepCard = currentStepId ? getStepCard(currentStepId) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="mb-6" title="🧪 智能分析工作流冒烟测试" bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            type="info"
            message="测试目标"
            description="验证'点选元素→生成步骤卡片→默认值优先'的核心工作流是否正常运行"
            showIcon
          />
          
          <Paragraph>
            本测试将模拟完整的用户交互流程：从点选页面元素，到生成可立即使用的步骤卡片，
            再到后台智能分析完成后的策略升级。重点验证<Text strong>默认值优先</Text>的设计理念。
          </Paragraph>
        </Space>
      </Card>

      {/* 测试进度 */}
      <Card className="mb-6" title="测试进度" bordered={false}>
        <Steps
          current={getCurrentStepIndex()}
          items={[
            {
              title: '元素选择',
              description: '模拟用户点选页面元素',
              icon: testPhase === 'element-selection' ? <LoadingOutlined /> : undefined
            },
            {
              title: '步骤创建',
              description: '立即创建可用步骤（默认值）',
              icon: testPhase === 'step-creation' ? <LoadingOutlined /> : undefined
            },
            {
              title: '智能分析',
              description: '后台分析，生成优化策略',
              icon: testPhase === 'analysis' ? <LoadingOutlined /> : undefined
            },
            {
              title: '策略升级',
              description: '应用分析结果，升级策略',
              icon: testPhase === 'upgrade' ? <LoadingOutlined /> : undefined
            },
            {
              title: '测试完成',
              description: '验证完整工作流',
              icon: testPhase === 'completed' ? <CheckCircleOutlined /> : undefined
            }
          ]}
        />
      </Card>

      <Row gutter={[16, 16]}>
        {/* 左侧：控制面板 */}
        <Col xs={24} lg={12}>
          <Card title="控制面板" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              
              {/* 统计信息 */}
              <div className="mb-4">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic 
                      title="步骤卡片" 
                      value={stepCards.length} 
                      prefix={<PlusOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="分析作业" 
                      value={currentJobs.size} 
                      prefix={<ThunderboltOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="测试日志" 
                      value={testResults.length} 
                      prefix={<BugOutlined />}
                    />
                  </Col>
                </Row>
              </div>

              <Divider />

              {/* 操作按钮 */}
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleElementSelection}
                  disabled={testPhase !== 'idle'}
                  block
                >
                  开始冒烟测试
                </Button>
                
                {currentStepCard?.analysisState === 'analysis_completed' && (
                  <Button 
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={handleUpgradeStrategy}
                    block
                  >
                    升级到推荐策略
                  </Button>
                )}
                
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={handleResetTest}
                  disabled={testPhase === 'idle'}
                  block
                >
                  重置测试
                </Button>
              </Space>

              {/* 当前状态 */}
              {testPhase !== 'idle' && (
                <Alert
                  type={testPhase === 'completed' ? 'success' : 'info'}
                  message={`当前阶段: ${testPhase}`}
                  description={isAnalyzing ? '智能分析正在后台运行...' : '等待用户操作'}
                  showIcon
                />
              )}
            </Space>
          </Card>
        </Col>

        {/* 右侧：步骤卡片展示 */}
        <Col xs={24} lg={12}>
          <Card title="生成的步骤卡片" bordered={false}>
            {stepCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PlusOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>还没有生成步骤卡片</div>
                <div>点击"开始冒烟测试"来创建第一个步骤</div>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {stepCards.map((stepCard, index) => (
                  <UnifiedStepCard
                    key={stepCard.stepId}
                    stepCard={stepCard}
                    stepIndex={index + 1}
                    showDebugInfo={true}
                    onUpgradeStrategy={() => handleUpgradeStrategy()}
                    onRetryAnalysis={() => {
                      if (elementContext) {
                        handleIntelligentAnalysis(elementContext, stepCard.stepId);
                      }
                    }}
                  />
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 测试日志 */}
      <Card className="mt-6" title="测试日志" bordered={false}>
        {testResults.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            测试日志将在这里显示...
          </div>
        ) : (
          <Timeline
            items={testResults.map((result, index) => ({
              color: result.status === 'success' ? 'green' : 
                     result.status === 'error' ? 'red' : 
                     result.status === 'warning' ? 'orange' : 'blue',
              children: (
                <div key={index}>
                  <Text strong>[{result.timestamp}]</Text>
                  <Text style={{ marginLeft: 8 }}>{result.message}</Text>
                </div>
              )
            }))}
          />
        )}
      </Card>
    </div>
  );
};

export default SmokeTestCompletePage;