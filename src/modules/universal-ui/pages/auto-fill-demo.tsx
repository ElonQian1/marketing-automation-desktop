// src/modules/universal-ui/pages/auto-fill-demo.tsx
// module: universal-ui | layer: pages | role: demo
// summary: 自动回填功能演示页面

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Alert, Tag, Divider, Steps } from 'antd';
import { 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  UndoOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useIntelligentAnalysisReal } from '../hooks/use-intelligent-analysis-real';
import { useAnalysisAutoFill } from '../hooks/use-analysis-auto-fill';
import type { 
  ElementSelectionContext, 
  AnalysisResult 
} from '../types/intelligent-analysis-types';

const { Title, Text, Paragraph } = Typography;

/**
 * 自动回填功能演示
 * 
 * 展示:
 * 1. 完整的分析→回填流程
 * 2. 用户确认对话框
 * 3. 填充历史记录
 * 4. 撤销功能
 */
export default function AutoFillDemo() {
  const [mockStepId] = useState('demo-step-001');
  const [mockElementContext] = useState<ElementSelectionContext>({
    snapshotId: 'snapshot-' + Date.now(),
    elementPath: '/hierarchy/android.widget.Button[@text="确定"]',
    elementText: '确定',
    elementType: 'Button',
    elementBounds: '[100,200][300,400]',
    keyAttributes: {
      'resource-id': 'com.example:id/btn_confirm',
      'text': '确定',
    },
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // 使用智能分析 Hook
  const {
    startAnalysis,
    isAnalyzing,
  } = useIntelligentAnalysisReal({
    elementContext: mockElementContext,
    stepId: mockStepId,
    lockContainer: false,
    onAnalysisComplete: (result) => {
      console.log('✅ 分析完成', result);
      setAnalysisResult(result);
      setCurrentStep(1);
    },
    onAnalysisError: (error) => {
      console.error('❌ 分析失败', error);
    },
  });
  
  // 使用自动回填 Hook
  const {
    fillStep,
    isFilling,
    fillHistory,
    undoLastFill,
    clearHistory,
  } = useAnalysisAutoFill({
    requireConfirmation: true,
    onFillSuccess: (stepId, strategy) => {
      console.log('✅ 填充成功', stepId, strategy);
      setCurrentStep(2);
    },
    onFillError: (stepId, error) => {
      console.error('❌ 填充失败', stepId, error);
    },
  });
  
  const handleStartAnalysis = async () => {
    setCurrentStep(0);
    setAnalysisResult(null);
    await startAnalysis();
  };
  
  const handleFillStep = async () => {
    if (!analysisResult) return;
    
    await fillStep(
      mockStepId,
      analysisResult,
      undefined, // 使用推荐策略
      {
        name: '旧策略 (文本匹配)',
        xpath: '//android.widget.Button[@text="确定"]',
      }
    );
  };
  
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <ExperimentOutlined /> 自动回填功能演示
      </Title>
      
      <Paragraph type="secondary">
        展示智能分析结果自动填充到步骤卡的完整流程
      </Paragraph>
      
      <Divider />
      
      {/* 流程步骤指示器 */}
      <Card size="small" style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={[
            {
              title: '智能分析',
              description: '分析元素并生成策略',
              icon: <ThunderboltOutlined />,
            },
            {
              title: '确认回填',
              description: '用户确认策略',
              icon: <CheckCircleOutlined />,
            },
            {
              title: '完成',
              description: '策略已填充',
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      </Card>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 左侧：操作面板 */}
        <div>
          <Card title="📋 操作流程" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 步骤 1: 启动分析 */}
              <div>
                <Text strong>步骤 1: 启动智能分析</Text>
                <div style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleStartAnalysis}
                    loading={isAnalyzing}
                    disabled={isAnalyzing}
                  >
                    启动分析
                  </Button>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  对模拟元素进行智能分析,生成推荐策略
                </div>
              </div>
              
              {/* 步骤 2: 确认回填 */}
              <div>
                <Text strong>步骤 2: 确认并回填</Text>
                <div style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleFillStep}
                    loading={isFilling}
                    disabled={!analysisResult || isFilling}
                  >
                    回填到步骤
                  </Button>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  将推荐策略填充到步骤卡 (会显示确认对话框)
                </div>
              </div>
              
              <Divider style={{ margin: '12px 0' }} />
              
              {/* 高级功能 */}
              <div>
                <Text strong>高级功能</Text>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <Button
                      icon={<UndoOutlined />}
                      onClick={undoLastFill}
                      disabled={fillHistory.length === 0}
                    >
                      撤销上次填充
                    </Button>
                    
                    <Button
                      onClick={clearHistory}
                      disabled={fillHistory.length === 0}
                    >
                      清空历史
                    </Button>
                  </Space>
                </div>
              </div>
            </Space>
          </Card>
          
          {/* 填充历史 */}
          <Card 
            title="📜 填充历史" 
            size="small" 
            style={{ marginTop: 16 }}
          >
            {fillHistory.length === 0 ? (
              <Text type="secondary">暂无填充记录...</Text>
            ) : (
              <div>
                {fillHistory.map((record, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      步骤: {record.stepId}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      策略: {record.strategy.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      时间: {new Date(record.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        
        {/* 右侧：分析结果 */}
        <div>
          <Card title="📊 分析结果" size="small">
            {!analysisResult ? (
              <Alert
                message="等待分析"
                description='点击"启动分析"开始智能分析'
                type="info"
                showIcon
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 推荐策略 */}
                <div>
                  <Text strong>🎯 推荐策略</Text>
                  <div style={{
                    background: '#f6ffed',
                    padding: 12,
                    borderRadius: 4,
                    marginTop: 8,
                    border: '1px solid #b7eb8f',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                      {analysisResult.smartCandidates.find(
                        c => c.key === analysisResult.recommendedKey
                      )?.name}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="success">
                        置信度: {analysisResult.recommendedConfidence}%
                      </Tag>
                    </div>
                  </div>
                </div>
                
                {/* 所有候选策略 */}
                <div>
                  <Text strong>📋 所有候选策略 ({analysisResult.smartCandidates.length})</Text>
                  <div style={{ marginTop: 8 }}>
                    {analysisResult.smartCandidates.map((candidate) => (
                      <div
                        key={candidate.key}
                        style={{
                          background: candidate.isRecommended ? '#f6ffed' : '#fafafa',
                          padding: 8,
                          borderRadius: 4,
                          marginBottom: 8,
                          border: candidate.isRecommended 
                            ? '1px solid #b7eb8f' 
                            : '1px solid #d9d9d9',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>{candidate.name}</Text>
                          <Space>
                            {candidate.isRecommended && (
                              <Tag color="success">推荐</Tag>
                            )}
                            <Tag color="blue">{candidate.confidence}%</Tag>
                          </Space>
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                          <code>{candidate.xpath}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Space>
            )}
          </Card>
        </div>
      </div>
      
      <Divider />
      
      {/* 使用说明 */}
      <Card title="📖 功能说明" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>✅ 核心功能:</Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>自动将分析结果填充到步骤卡</li>
              <li>用户确认对话框 (可配置)</li>
              <li>支持覆盖现有策略</li>
              <li>填充历史记录</li>
              <li>撤销功能</li>
            </ul>
          </div>
          
          <div>
            <Text strong>🎯 使用场景:</Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>智能脚本构建器中的快速策略填充</li>
              <li>批量步骤优化</li>
              <li>策略A/B测试</li>
            </ul>
          </div>
          
          <div>
            <Text strong>🔧 技术实现:</Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Hook: <code>useAnalysisAutoFill</code></li>
              <li>后端命令: <code>bind_analysis_result_to_step</code></li>
              <li>确认对话框: Ant Design Modal</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  );
}
