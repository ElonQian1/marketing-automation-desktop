// src/components/analysis/TestAnalysisPanel.tsx
// module: analysis | layer: ui | role: 测试智能分析
// summary: 用于测试和演示智能分析系统的组件

import React, { useState } from 'react';
import { Card, Button, Space, Divider, Tag, Typography } from 'antd';
import { SmartAnalysisPanel } from './SmartAnalysisPanel';
import { useAnalysisStateStore } from '../../stores/analysis-state-store';

const { Title, Text } = Typography;

export const TestAnalysisPanel: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisStore = useAnalysisStateStore();

  // 模拟启动分析
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    
    // 1. 开始分析任务
    const jobId = 'test-job-' + Date.now();
    analysisStore.startAnalysis(jobId);
    
    // 2. 模拟进度更新（部分分数）- 使用candidateKey
    setTimeout(() => {
      analysisStore.setPartialScores([
        { stepId: 'card_subtree_scoring', confidence: 0.85, strategy: '卡片子树评分' },      // Step1 - 高置信度
        { stepId: 'leaf_context_scoring', confidence: 0.78, strategy: '叶子上下文评分' }   // Step2 - 中高置信度
      ]);
    }, 1000);
    
    setTimeout(() => {
      analysisStore.setPartialScores([
        { stepId: 'card_subtree_scoring', confidence: 0.87, strategy: '卡片子树评分' },     // Step1
        { stepId: 'leaf_context_scoring', confidence: 0.80, strategy: '叶子上下文评分' },  // Step2
        { stepId: 'self_anchor', confidence: 0.62, strategy: '自锚定策略' }                  // Step3 - 中等置信度
      ]);
    }, 2000);
    
    // 3. 模拟最终完成（最终分数）- 展示完整颜色梯度
    setTimeout(() => {
      // 设置智能自动链 - 使用candidateKey
      analysisStore.setSmartChain({
        orderedSteps: ['card_subtree_scoring', 'leaf_context_scoring', 'self_anchor', 'child_driven', 'xpath_fallback'],
        recommended: 'card_subtree_scoring',
        threshold: 0.7,
        reasons: ['主要策略: card_subtree_scoring (87%)', '备选策略: 4个', '按置信度降序排列'],
        totalConfidence: 0.87
      });
      
      // 设置最终分数 - 涵盖所有颜色等级，使用candidateKey
      analysisStore.setFinalScores([
        { 
          stepId: 'card_subtree_scoring',  // Step1
          confidence: 0.87,  // 绿色：高置信度
          strategy: '卡片子树评分',
          metrics: { mode: 'CardSubtree', passedGate: true, explain: '结构匹配置信度高' }
        },
        { 
          stepId: 'leaf_context_scoring',  // Step2
          confidence: 0.82,  // 蓝色：中高置信度
          strategy: '叶子上下文评分',
          metrics: { mode: 'LeafContext', passedGate: true, explain: '上下文特征明显' }
        },
        { 
          stepId: 'self_anchor',  // Step3
          confidence: 0.67,  // 橙色：中等置信度
          strategy: '自锚定策略',
          metrics: { xpath: '//*[@resource-id="confirm"]', description: '基于resource-id直接定位' }
        },
        { 
          stepId: 'child_driven',  // Step4
          confidence: 0.45,  // 火山红：中低置信度
          strategy: '子元素驱动策略',
          metrics: { xpath: '//*[contains(@text,"确定")]', description: '通过子元素特征定位' }
        },
        { 
          stepId: 'xpath_fallback',  // Step6
          confidence: 0.28,  // 红色：低置信度
          strategy: 'XPath兜底策略',
          metrics: { xpath: '//android.widget.Button[3]', description: '基于XPath索引定位' }
        }
      ]);
      
      analysisStore.completeAnalysis();
      setIsAnalyzing(false);
    }, 4000);
  };
  
  // 重置状态
  const handleReset = () => {
    analysisStore.reset();
    setIsAnalyzing(false);
  };
  
  // 获取状态摘要
  const summary = analysisStore.getStateSummary();
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <Title level={3}>🎯 智能分析系统测试</Title>
        <Text type="secondary">
          测试"每个智能单步都显示正确可信度"的修复效果
        </Text>
        
        <Divider />
        
        <Space className="mb-4">
          <Button 
            type="primary" 
            onClick={handleStartAnalysis}
            loading={isAnalyzing}
            disabled={summary.analysisStatus === 'running'}
          >
            {isAnalyzing ? '分析中...' : '开始智能分析'}
          </Button>
          
          <Button onClick={handleReset}>
            重置状态
          </Button>
        </Space>
        
        {/* 状态指示器 */}
        <div className="mb-4">
          <Space>
            <Text strong>当前状态：</Text>
            <Tag color={
              summary.analysisStatus === 'running' ? 'blue' :
              summary.analysisStatus === 'completed' ? 'green' :
              summary.analysisStatus === 'error' ? 'red' : 'default'
            }>
              {summary.analysisStatus}
            </Tag>
            
            <Text type="secondary">
              完成步骤: {summary.completedSteps}/{summary.totalSteps}
            </Text>
            
            {summary.hasChain && (
              <Tag color="cyan">智能链已生成</Tag>
            )}
          </Space>
        </div>
        
        <Divider orientation="left">智能分析面板</Divider>
        
        {/* 主要的智能分析面板 */}
        <SmartAnalysisPanel
          stepId="test-element-123"
          showDetails={true}
          onSelectChain={() => {
            console.log('选择智能自动链');
          }}
          onSelectStep={(stepId) => {
            console.log('选择单步策略:', stepId);
          }}
        />
        
        {/* 调试信息 */}
        <Divider orientation="left">调试信息</Divider>
        <Card size="small" className="bg-gray-50">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(summary, null, 2)}
          </pre>
        </Card>
      </Card>
    </div>
  );
};

export default TestAnalysisPanel;