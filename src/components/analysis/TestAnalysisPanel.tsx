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
    
    // 2. 模拟进度更新（部分分数）
    setTimeout(() => {
      analysisStore.setPartialScores([
        { stepId: 'self_anchor', confidence: 0.95, strategy: '自锚定策略' },      // 高置信度-绿色
        { stepId: 'child_driven', confidence: 0.78, strategy: '子元素驱动策略' }   // 中高置信度-蓝色
      ]);
    }, 1000);
    
    setTimeout(() => {
      analysisStore.setPartialScores([
        { stepId: 'self_anchor', confidence: 0.96, strategy: '自锚定策略' },      // 高置信度-绿色
        { stepId: 'child_driven', confidence: 0.80, strategy: '子元素驱动策略' },  // 中高置信度-蓝色
        { stepId: 'region_scoped', confidence: 0.62, strategy: '区域约束策略' }   // 中等置信度-橙色
      ]);
    }, 2000);
    
    // 3. 模拟最终完成（最终分数）- 展示完整颜色梯度
    setTimeout(() => {
      // 设置智能自动链
      analysisStore.setSmartChain({
        orderedSteps: ['self_anchor', 'child_driven', 'region_scoped', 'xpath_fallback', 'emergency_fallback'],
        recommended: 'self_anchor',
        threshold: 0.7,
        reasons: ['主要策略: self_anchor (96%)', '备选策略: 4个', '按置信度降序排列'],
        totalConfidence: 0.96
      });
      
      // 设置最终分数 - 涵盖所有颜色等级
      analysisStore.setFinalScores([
        { 
          stepId: 'self_anchor', 
          confidence: 0.96,  // 绿色：高置信度
          strategy: '自锚定策略',
          metrics: { xpath: '//*[@resource-id="confirm"]', description: '基于resource-id直接定位' }
        },
        { 
          stepId: 'child_driven', 
          confidence: 0.82,  // 蓝色：中高置信度
          strategy: '子元素驱动策略',
          metrics: { xpath: '//*[contains(@text,"确定")]', description: '通过子元素特征定位' }
        },
        { 
          stepId: 'region_scoped', 
          confidence: 0.67,  // 橙色：中等置信度
          strategy: '区域约束策略',
          metrics: { xpath: '//*[@class="Container"]//*[@class="Button"]', description: '限定在特定容器区域内' }
        },
        { 
          stepId: 'xpath_fallback', 
          confidence: 0.45,  // 火山红：中低置信度
          strategy: 'XPath兜底策略',
          metrics: { xpath: '//android.widget.Button[3]', description: '基于XPath索引定位' }
        },
        { 
          stepId: 'emergency_fallback', 
          confidence: 0.28,  // 红色：低置信度
          strategy: '应急兜底策略',
          metrics: { xpath: '//*[contains(@class,"Button")]', description: '应急通用选择器' }
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