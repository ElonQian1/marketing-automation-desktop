// src/modules/universal-ui/ui/components/universal-smart-step-demo.tsx
// module: universal-ui | layer: ui | role: demo-component
// summary: 智能步骤系统演示组件，展示完整的分析工作流

import React, { useState, useCallback } from 'react';
import { Card, Space, Button, Typography, message, Divider } from 'antd';
import { PlayCircleOutlined, PlusOutlined, ClearOutlined } from '@ant-design/icons';

import { UniversalSmartStepCard } from './universal-smart-step-card';
import { UniversalEnhancedElementPopover, type PopoverState } from './universal-enhanced-element-popover';
import { 
  useSmartStepWorkflow, 
  type ElementSelectionContext
} from '../hooks/universal-use-smart-step-workflow';

const { Title, Text } = Typography;

/**
 * 智能步骤系统演示属性
 */
export interface UniversalSmartStepDemoProps {
  /** 组件标题 */
  title?: string;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  /** 最大步骤卡片数量 */
  maxSteps?: number;
}

/**
 * 创建模拟元素选择上下文
 */
const createMockElementContext = (index: number): ElementSelectionContext => ({
  snapshotId: `snapshot_${Date.now()}_${index}`,
  elementPath: `//*[@id="contact-list"]/div[${index}]/div[2]/span`,
  elementType: 'text',
  elementText: `联系人姓名 ${index}`,
  elementBounds: `120,${45 + index * 20},200,${65 + index * 20}`
});

/**
 * 智能步骤系统演示组件
 * 演示从元素选择到智能分析的完整工作流
 */
export const UniversalSmartStepDemo: React.FC<UniversalSmartStepDemoProps> = ({
  title = '智能步骤系统演示',
  showDebugInfo = process.env.NODE_ENV === 'development',
  maxSteps = 10
}) => {
  // 状态管理
  const [showPopover, setShowPopover] = useState(false);
  const [popoverState, setPopoverState] = useState<PopoverState>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentElementContext, setCurrentElementContext] = useState<ElementSelectionContext>(
    createMockElementContext(1)
  );

  // 工作流钩子
  const {
    currentJob,
    stepCards,
    isAnalyzing,
    startAnalysisFromPopover,
    createStepCardQuick,
    cancelAnalysis,
    deleteStep,
    clearAllJobs
  } = useSmartStepWorkflow();

  /**
   * 模拟元素选择事件
   */
  const handleSimulateElementSelection = useCallback(() => {
    const newContext = createMockElementContext(stepCards.length + 1);
    
    setCurrentElementContext(newContext);
    setPopoverState('idle');
    setAnalysisProgress(0);
    setShowPopover(true);
    
    message.info('已选择新元素，气泡已显示');
  }, [stepCards.length]);

  /**
   * 启动智能分析
   */
  const handleStartAnalysis = useCallback(async () => {
    setPopoverState('analyzing');
    setAnalysisProgress(0);
    
    try {
      await startAnalysisFromPopover(currentElementContext);
      
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setPopoverState('analyzed');
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
    } catch {
      setPopoverState('failed');
      message.error('分析启动失败');
    }
  }, [currentElementContext, startAnalysisFromPopover]);

  /**
   * 直接确定（创建步骤卡片）
   */
  const handleDirectConfirm = useCallback(async () => {
    try {
      await createStepCardQuick(currentElementContext);
      
      setShowPopover(false);
      setPopoverState('idle');
      
      message.success('步骤卡片已创建');
    } catch {
      message.error('创建步骤卡片失败');
    }
  }, [currentElementContext, createStepCardQuick]);

  /**
   * 不等分析完成，直接确定
   */
  const handleConfirmWithoutWaiting = useCallback(async () => {
    if (currentJob) {
      await cancelAnalysis(currentJob.jobId);
    }
    
    await handleDirectConfirm();
    message.info('已使用静态策略创建步骤，分析完成后会自动优化');
  }, [currentJob, cancelAnalysis, handleDirectConfirm]);

  /**
   * 取消操作
   */
  const handleCancel = useCallback(async () => {
    if (currentJob) {
      await cancelAnalysis(currentJob.jobId);
    }
    
    setShowPopover(false);
    setPopoverState('idle');
    setAnalysisProgress(0);
  }, [currentJob, cancelAnalysis]);

  /**
   * 执行整个工作流
   */
  const handleExecuteWorkflow = useCallback(() => {
    if (stepCards.length === 0) {
      message.warning('没有步骤可执行');
      return;
    }
    
    message.info(`开始执行 ${stepCards.length} 个步骤`);
  }, [stepCards.length]);

  /**
   * 清空所有步骤
   */
  const handleClearAllSteps = useCallback(() => {
    clearAllJobs();
    message.info('已清空所有步骤');
  }, [clearAllJobs]);

  return (
    <div className="light-theme-force universal-smart-step-demo">
      <Card title={title}>
        <Space direction="vertical" style={{ width: '100%' }}>
          
          {/* 工具栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleSimulateElementSelection}
                disabled={stepCards.length >= maxSteps}
              >
                模拟选择元素
              </Button>
              
              <Button 
                type="default"
                icon={<PlayCircleOutlined />}
                onClick={handleExecuteWorkflow}
                disabled={stepCards.length === 0}
              >
                执行工作流 ({stepCards.length})
              </Button>
            </Space>
            
            <Space>
              <Button 
                size="small" 
                icon={<ClearOutlined />}
                onClick={handleClearAllSteps}
                disabled={stepCards.length === 0}
              >
                清空
              </Button>
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* 步骤卡片列表 */}
          <div style={{ minHeight: 200 }}>
            {stepCards.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-3, #94a3b8)',
                fontSize: 14
              }}>
                <Text type="secondary">暂无步骤，点击"模拟选择元素"开始创建</Text>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {stepCards.map((stepCard) => (
                  <UniversalSmartStepCard
                    key={stepCard.stepId}
                    stepId={stepCard.stepId}
                    stepName={stepCard.stepName}
                    stepType={stepCard.stepType}
                    strategyMode={stepCard.strategyMode}
                    analysisState={stepCard.analysisState}
                    analysisProgress={stepCard.analysisProgress}
                    analysisJobId={stepCard.analysisJobId}
                    recommendedStrategy={stepCard.recommendedStrategy}
                    recommendedConfidence={stepCard.recommendedConfidence}
                    strategyCandidates={stepCard.strategyCandidates}
                    activeStrategy={stepCard.activeStrategy}
                    autoFollowSmart={stepCard.autoFollowSmart}
                  />
                ))}
              </Space>
            )}
          </div>

          {/* 元素选择气泡 */}
          {showPopover && (
            <div style={{ 
              position: 'fixed', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 1000 
            }}>
              <UniversalEnhancedElementPopover
                elementContext={currentElementContext}
                state={popoverState}
                analysisProgress={analysisProgress}
                estimatedTimeLeft={popoverState === 'analyzing' ? (100 - analysisProgress) * 50 : 0}
                visible={showPopover}
                onStartAnalysis={handleStartAnalysis}
                onDirectConfirm={handleDirectConfirm}
                onConfirmWithoutWaiting={handleConfirmWithoutWaiting}
                onCancel={handleCancel}
                onHide={() => setShowPopover(false)}
              />
            </div>
          )}

          {/* 调试信息 */}
          {showDebugInfo && (
            <Card size="small" title="调试信息">
              <Space direction="vertical" style={{ width: '100%', fontSize: 12 }}>
                <div>气泡状态: {popoverState}</div>
                <div>分析进度: {analysisProgress}%</div>
                <div>当前任务: {currentJob?.jobId || '无'}</div>
                <div>步骤数量: {stepCards.length}/{maxSteps}</div>
                <div>正在分析: {isAnalyzing ? '是' : '否'}</div>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default UniversalSmartStepDemo;