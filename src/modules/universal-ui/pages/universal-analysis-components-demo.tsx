// src/modules/universal-ui/pages/universal-analysis-components-demo.tsx
// module: universal-ui | layer: pages | role: demo
// summary: 演示所有智能分析相关组件的功能

import React, { useState } from 'react';
import { Card, Space, Typography, Button, Divider, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import {
  UniversalFallbackBadge,
  UniversalRecommendedBadge,
  UniversalStrategyCandidatesSection,
  UniversalStrategyModeSelector,
  UniversalPublishReadinessModal
} from '../ui/components';
import type { IntelligentStepCard, StrategyMode } from '../types/intelligent-analysis-types';

const { Title, Paragraph, Text } = Typography;

/**
 * 创建模拟步骤卡片
 */
const createMockStep = (id: number, state: 'idle' | 'analyzing' | 'analysis_completed' | 'analysis_failed'): IntelligentStepCard => {
  return {
    stepId: `step_${id}`,
    stepName: `点击元素 #${id}`,
    stepType: 'tap',
    elementContext: {
      snapshotId: `snapshot_${id}`,
      elementPath: `//*[@id="element${id}"]`,
      elementText: `元素文本 ${id}`,
      elementType: 'button'
    },
    selectionHash: `hash_${id}`,
    analysisState: state,
    analysisProgress: state === 'analyzing' ? 65 : state === 'analysis_completed' ? 100 : 0,
    analysisError: state === 'analysis_failed' ? '分析超时' : undefined,
    strategyMode: 'intelligent',
    smartCandidates: state === 'analysis_completed' ? [
      {
        key: 'self_anchor',
        name: 'Step1 自我锚点',
        confidence: 0.95,
        description: '基于元素自身属性定位',
        variant: 'self_anchor',
        enabled: true,
        isRecommended: true
      },
      {
        key: 'child_driven',
        name: 'Step2 子树锚点',
        confidence: 0.87,
        description: '基于子元素结构定位',
        variant: 'child_driven',
        enabled: true,
        isRecommended: false
      },
      {
        key: 'region_scoped',
        name: 'Step3 区域限定',
        confidence: 0.82,
        description: '限定在特定区域内查找',
        variant: 'region_scoped',
        enabled: true,
        isRecommended: false
      }
    ] : [],
    staticCandidates: [
      {
        key: 'absolute_xpath',
        name: '绝对XPath',
        confidence: 0.6,
        description: '使用完整的XPath路径',
        variant: 'index_fallback',
        enabled: true,
        isRecommended: false
      }
    ],
    activeStrategy: state === 'analysis_completed' ? {
      key: 'self_anchor',
      name: 'Step1 自我锚点',
      confidence: 0.95,
      description: '基于元素自身属性定位',
      variant: 'self_anchor',
      enabled: true,
      isRecommended: true
    } : {
      key: 'absolute_xpath',
      name: '绝对XPath',
      confidence: 0.6,
      description: '使用完整的XPath路径',
      variant: 'index_fallback',
      enabled: true,
      isRecommended: false
    },
    recommendedStrategy: state === 'analysis_completed' ? {
      key: 'self_anchor',
      name: 'Step1 自我锚点',
      confidence: 0.95,
      description: '基于元素自身属性定位',
      variant: 'self_anchor',
      enabled: true,
      isRecommended: true
    } : undefined,
    fallbackStrategy: {
      key: 'absolute_xpath',
      name: '绝对XPath',
      confidence: 0.6,
      description: '使用完整的XPath路径',
      variant: 'index_fallback',
      enabled: true,
      isRecommended: false
    },
    autoFollowSmart: true,
    lockContainer: false,
    smartThreshold: 0.82,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
};

/**
 * 智能分析组件演示页面
 */
export const UniversalAnalysisComponentsDemo: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<StrategyMode>('intelligent');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [mockSteps] = useState<IntelligentStepCard[]>([
    createMockStep(1, 'analysis_completed'),
    createMockStep(2, 'analyzing'),
    createMockStep(3, 'idle'),
    createMockStep(4, 'analysis_failed')
  ]);

  const mockStep = mockSteps[0];

  const handleApplyStrategy = (key: string) => {
    message.success(`应用策略: ${key}`);
  };

  const handleModeChange = (mode: StrategyMode) => {
    setCurrentMode(mode);
    message.info(`切换模式: ${mode}`);
  };

  const handlePublish = () => {
    message.success('发布成功！');
    setShowPublishModal(false);
  };

  const handleCompleteAndPublish = async () => {
    message.info('开始补齐分析...');
    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success('分析完成，发布成功！');
    setShowPublishModal(false);
  };

  return (
    <div className="light-theme-force" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        {/* 页面标题 */}
        <Card className="light-theme-force">
          <Title level={2} style={{ margin: 0, color: 'var(--text-1, #1e293b)' }}>
            🎯 智能分析组件演示
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            展示步骤卡片缺失的4个关键功能组件
          </Paragraph>
        </Card>

        {/* 1. 徽标组件演示 */}
        <Card 
          title="1️⃣ 暂用兜底徽标" 
          className="light-theme-force"
          style={{ backgroundColor: 'var(--bg-light-base, #ffffff)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Paragraph>
              用于标识当前步骤使用的是兜底策略（如绝对XPath），提示用户智能分析完成后可升级。
            </Paragraph>
            
            <Divider>效果展示</Divider>
            
            <Space wrap>
              <UniversalFallbackBadge
                isFallbackActive={true}
                fallbackName="绝对XPath"
                isAnalyzing={false}
              />
              
              <UniversalFallbackBadge
                isFallbackActive={true}
                fallbackName="全局索引"
                isAnalyzing={true}
              />
              
              <UniversalRecommendedBadge
                isRecommended={true}
                confidence={0.95}
              />
              
              <UniversalRecommendedBadge
                isRecommended={true}
                confidence={0.75}
              />
            </Space>
          </Space>
        </Card>

        {/* 2. 候选策略展示区演示 */}
        <Card 
          title="2️⃣ 候选策略展示区" 
          className="light-theme-force"
          style={{ backgroundColor: 'var(--bg-light-base, #ffffff)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Paragraph>
              展示 Top-3 智能候选策略，包含分数、命中数、理由和操作按钮。
            </Paragraph>
            
            <Divider>效果展示</Divider>
            
            <UniversalStrategyCandidatesSection
              smartCandidates={mockStep.smartCandidates}
              staticCandidates={mockStep.staticCandidates}
              activeStrategyKey="self_anchor"
              recommendedKey="self_anchor"
              onApplyStrategy={handleApplyStrategy}
              maxCandidates={3}
              showStaticCandidates={false}
            />
          </Space>
        </Card>

        {/* 3. 策略模式切换器演示 */}
        <Card 
          title="3️⃣ 策略模式切换器" 
          className="light-theme-force"
          style={{ backgroundColor: 'var(--bg-light-base, #ffffff)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Paragraph>
              支持三种策略模式：智能匹配（推荐）、智能-单步固定、用户自建静态。
            </Paragraph>
            
            <Divider>紧凑模式</Divider>
            <UniversalStrategyModeSelector
              currentMode={currentMode}
              onModeChange={handleModeChange}
              smartCandidates={mockStep.smartCandidates}
              displayMode="compact"
            />

            <Divider>详细模式</Divider>
            <UniversalStrategyModeSelector
              currentMode={currentMode}
              onModeChange={handleModeChange}
              smartCandidates={mockStep.smartCandidates}
              displayMode="detailed"
            />
          </Space>
        </Card>

        {/* 4. 发布准备度闸门演示 */}
        <Card 
          title="4️⃣ 发布准备度闸门" 
          className="light-theme-force"
          style={{ backgroundColor: 'var(--bg-light-base, #ffffff)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Paragraph>
              检查步骤分析完成度，提供"一键完成分析后再发布"或"直接发布（带兜底）"选项。
            </Paragraph>
            
            <Button 
              type="primary" 
              icon={<RocketOutlined />}
              onClick={() => setShowPublishModal(true)}
            >
              打开发布准备度检查
            </Button>
            
            <UniversalPublishReadinessModal
              visible={showPublishModal}
              onClose={() => setShowPublishModal(false)}
              steps={mockSteps}
              onPublish={handlePublish}
              onCompleteAnalysisAndPublish={handleCompleteAndPublish}
            />
          </Space>
        </Card>

        {/* 使用说明 */}
        <Card 
          title="📋 使用说明" 
          className="light-theme-force"
          style={{ backgroundColor: 'var(--bg-light-base, #ffffff)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Text strong>集成到 StepCardSystem 的方法：</Text>
            <Paragraph style={{ fontSize: 13, margin: 0 }}>
              1. 在步骤卡片头部添加 <Text code>UniversalFallbackBadge</Text>，标识兜底状态<br/>
              2. 在高级选项中添加 <Text code>UniversalStrategyModeSelector</Text>，支持模式切换<br/>
              3. 在模式下方添加 <Text code>UniversalStrategyCandidatesSection</Text>，展示候选策略<br/>
              4. 在发布流程中使用 <Text code>UniversalPublishReadinessModal</Text>，确保分析完整性
            </Paragraph>
            
            <Divider />
            
            <Text strong>完整示例代码：</Text>
            <Paragraph style={{ fontSize: 12, margin: 0 }}>
              参考文件：<Text code>universal-enhanced-step-card-integration.tsx</Text>
            </Paragraph>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default UniversalAnalysisComponentsDemo;
