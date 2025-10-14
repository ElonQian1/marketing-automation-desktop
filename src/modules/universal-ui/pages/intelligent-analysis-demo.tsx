// src/modules/universal-ui/pages/intelligent-analysis-demo.tsx
// module: universal-ui | layer: pages | role: demo-page
// summary: 智能分析工作流演示页面，展示完整的元素选择到步骤卡片生成流程

import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider, Alert, Steps } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';

import { useIntelligentAnalysisWorkflow } from '../hooks/use-intelligent-analysis-workflow';
import { EnhancedElementSelectionPopover } from '../components/enhanced-element-selection-popover';
import { UnifiedStepCard as IntelligentStepCard } from '../components/unified-step-card';

import type { ElementSelectionContext } from '../types/intelligent-analysis-types';

const { Title, Paragraph, Text } = Typography;

/**
 * 智能分析工作流演示页面
 */
const IntelligentAnalysisDemo: React.FC = () => {
  const {
    stepCards,
    currentJobs,
    startAnalysis,
    createStepCardQuick,
    deleteStepCard
  } = useIntelligentAnalysisWorkflow();

  const [demoStep, setDemoStep] = useState(0);

  // 模拟元素选择上下文
  const mockElementContext: ElementSelectionContext = {
    snapshotId: 'demo_snapshot_001',
    elementPath: '[0][1][2][3][4]', // node_index_chain
    elementText: '请输入用户名',
    elementBounds: '150,200,450,240',
    elementType: 'input',
    keyAttributes: {
      'resource-id': 'username-input',
      'class': 'form-control username-field',
      'text': '请输入用户名'
    },
    containerInfo: {
      containerType: 'form',
      containerPath: '[0][1][2][3]',
      itemIndex: 0,
      totalItems: 3
    },
    pageContext: {
      currentUrl: 'https://demo.app/login',
      pageType: 'login_page',
      appVersion: '1.0.0'
    }
  };

  // 处理演示步骤
  const handleDemoStep = async (step: number) => {
    setDemoStep(step);
    
    switch (step) {
      case 1:
        // 快速创建步骤卡片（使用默认值）
        await createStepCardQuick(mockElementContext, false);
        break;
        
      case 2:
        // 启动智能分析
        if (stepCards.length > 0) {
          await startAnalysis(mockElementContext, stepCards[0].stepId);
        }
        break;
        
      case 3:
        // 模拟分析完成后的操作
        break;
    }
  };

  // 获取分析作业状态
  const getAnalysisJobsInfo = () => {
    const jobs = Array.from(currentJobs.values());
    const running = jobs.filter(j => j.state === 'running').length;
    const queued = jobs.filter(j => j.state === 'queued').length;
    const completed = jobs.filter(j => j.state === 'completed').length;
    
    return { running, queued, completed, total: jobs.length };
  };

  const jobsInfo = getAnalysisJobsInfo();

  return (
    <div className="light-theme-force p-6 bg-slate-50 min-h-screen">
      <Card className="mb-6" bordered={false}>
        <Title level={2}>智能分析工作流演示</Title>
        <Paragraph>
          本页面演示了完整的智能分析工作流：从元素选择到步骤卡片生成，包括"不等分析完成，先采用默认值"的处理流程。
        </Paragraph>
      </Card>

      {/* 演示流程步骤 */}
      <Card className="mb-6" title="演示流程" bordered={false}>
        <Steps
          current={demoStep}
          items={[
            {
              title: '选择元素',
              description: '用户点击页面元素，触发选择弹窗'
            },
            {
              title: '快速创建',
              description: '使用默认值立即创建步骤卡片'
            },
            {
              title: '智能分析',
              description: '后台进行智能分析，生成策略候选'
            },
            {
              title: '结果应用',
              description: '分析完成后自动更新步骤卡片'
            }
          ]}
        />
        
        <div className="mt-4">
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleDemoStep(1)}
              disabled={demoStep >= 1}
            >
              开始演示
            </Button>
            <Button 
              onClick={() => handleDemoStep(2)}
              disabled={demoStep < 1 || stepCards.length === 0}
            >
              启动分析
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                setDemoStep(0);
                // 清理所有步骤卡片
                stepCards.forEach(card => deleteStepCard(card.stepId));
              }}
            >
              重置演示
            </Button>
          </Space>
        </div>
      </Card>

      {/* 分析状态概览 */}
      <Card className="mb-6" title="分析作业状态" bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            总作业数: <Text strong>{jobsInfo.total}</Text> | 
            运行中: <Text type="warning">{jobsInfo.running}</Text> | 
            队列中: <Text type="secondary">{jobsInfo.queued}</Text> | 
            已完成: <Text type="success">{jobsInfo.completed}</Text>
          </Text>
          
          {jobsInfo.running > 0 && (
            <Alert
              type="info"
              message="分析进行中"
              description="智能分析正在后台运行，您可以继续使用默认值的步骤卡片，分析完成后会自动更新。"
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* 元素选择演示 */}
      <Card className="mb-6" title="元素选择组件" bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>以下组件演示了增强的元素选择弹窗：</Text>
          
          <div className="p-4 border border-dashed border-gray-300 rounded-lg">
            <EnhancedElementSelectionPopover
              elementContext={mockElementContext}
              state={demoStep >= 2 ? 'analyzing' : 'idle'}
              visible={true}
              onStartAnalysis={async () => {
                console.log('启动智能分析');
                const stepId = await createStepCardQuick(mockElementContext);
                await startAnalysis(mockElementContext, stepId);
              }}
              onDirectConfirm={async () => {
                console.log('直接确认');
                await createStepCardQuick(mockElementContext);
              }}
              onCancel={() => console.log('取消选择')}
            />
          </div>
        </Space>
      </Card>

      {/* 步骤卡片展示 */}
      <Card title="生成的步骤卡片" bordered={false}>
        {stepCards.length === 0 ? (
          <Alert
            type="info"
            message="暂无步骤卡片"
            description="点击上方的'开始演示'按钮来创建步骤卡片"
            showIcon
          />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {stepCards.map((card, index) => (
              <IntelligentStepCard 
                key={card.stepId}
                stepCard={card}
                stepIndex={index + 1}
                showDebugInfo={true}
                onUpgradeStrategy={() => {
                  console.log(`升级步骤 ${card.stepId} 的策略`);
                  // 实际使用中会调用 upgradeStep(card.stepId)
                }}
                onRetryAnalysis={() => {
                  console.log(`重试分析步骤 ${card.stepId}`);
                  // 实际使用中会调用 retryAnalysis(card.stepId)
                }}
                onSwitchStrategy={(strategyKey, followSmart) => {
                  console.log(`切换步骤 ${card.stepId} 的策略到 ${strategyKey}，跟随智能推荐: ${followSmart}`);
                  // 实际使用中会调用 switchStrategy(card.stepId, strategyKey, followSmart)
                }}
                onViewDetails={() => {
                  console.log(`查看步骤 ${card.stepId} 的详情`);
                }}
                onCancelAnalysis={() => {
                  console.log(`取消步骤 ${card.stepId} 的分析`);
                  if (card.analysisJobId) {
                    // 实际使用中会调用 cancelAnalysis(card.analysisJobId)
                  }
                }}
              />
            ))}
          </Space>
        )}
      </Card>

      <Divider />
      
      {/* 技术说明 */}
      <Card title="技术实现说明" bordered={false}>
        <Space direction="vertical">
          <div>
            <Title level={4}>核心特性</Title>
            <ul>
              <li><strong>选择哈希防干扰</strong>: 使用 selection_hash 确保分析结果不会错误关联</li>
              <li><strong>默认值优先</strong>: 不等分析完成，立即使用默认值创建步骤卡片</li>
              <li><strong>智能升级</strong>: 分析完成后自动或手动升级到推荐策略</li>
              <li><strong>策略切换</strong>: 支持在智能策略和静态策略间切换</li>
              <li><strong>进度追踪</strong>: 实时显示分析进度和状态</li>
            </ul>
          </div>
          
          <div>
            <Title level={4}>工作流步骤</Title>
            <ol>
              <li>用户选择页面元素，触发选择弹窗</li>
              <li>立即使用默认值创建步骤卡片（满足"不等分析完成"需求）</li>
              <li>可选启动后台智能分析</li>
              <li>分析过程中显示进度，用户可继续操作</li>
              <li>分析完成后自动更新步骤卡片或提供升级选项</li>
            </ol>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default IntelligentAnalysisDemo;