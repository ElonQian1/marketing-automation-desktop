// src/components/test/TestRealBackendIntegration.tsx
// module: test | layer: ui | role: test-component
// summary: 测试真实后端集成的组件

import React, { useState } from 'react';
import { Button, Card, Space, Typography, Alert, Progress } from 'antd';
import { useIntelligentAnalysisAdapter } from '../../hooks/universal-ui/useIntelligentAnalysisAdapter';
import { getIntelligentAnalysisConfig } from '../../config/intelligentAnalysisConfig';
import type { UIElement } from '../../api/universalUIAPI';

const { Title, Text } = Typography;

/**
 * 测试真实后端集成组件
 */
export const TestRealBackendIntegration: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  
  // 使用真实后端配置
  const config = getIntelligentAnalysisConfig({ 
    useRealBackend: true,
    debug: true 
  });
  
  const adapter = useIntelligentAnalysisAdapter(config);

  // 模拟测试元素
  const testElement: UIElement = {
    id: 'test-element-001',
    element_type: 'android.widget.Button',
    text: '发送消息',
    bounds: { left: 100, top: 200, right: 300, bottom: 250 },
    xpath: '//*[@resource-id="com.example:id/send_button"]',
    resource_id: 'com.example:id/send_button',
    class_name: 'android.widget.Button',
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '发送消息按钮',
  };

  const handleStartAnalysis = async () => {
    setShowResults(true);
    try {
      await adapter.startAnalysis({
        element: testElement,
        stepId: 'test-step-001',
        jobId: 'test-job-001',
        selectionHash: 'test-hash-001',
      });
    } catch (error) {
      console.error('测试分析失败:', error);
    }
  };

  const handleCancelAnalysis = () => {
    adapter.cancelAnalysis();
    setShowResults(false);
  };

  const handleResetAnalysis = () => {
    adapter.resetAnalysis();
    setShowResults(false);
  };

  const getStateDisplayText = (state: string) => {
    switch (state) {
      case 'idle': return '空闲';
      case 'analyzing': return '分析中';
      case 'completed': return '分析完成';
      case 'failed': return '分析失败';
      default: return state;
    }
  };

  const getProgressPercent = () => {
    if (!adapter.analysisProgress) return 0;
    return Math.round((adapter.analysisProgress.currentStep / adapter.analysisProgress.totalSteps) * 100);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🚀 真实后端集成测试</Title>
      
      <Card title="测试配置" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>
            <strong>后端类型:</strong> {adapter.config.useRealBackend ? '真实后端 (Rust)' : '模拟后端'}
          </Text>
          <Text>
            <strong>调试模式:</strong> {adapter.config.debug ? '启用' : '关闭'}
          </Text>
          <Text>
            <strong>测试元素:</strong> {testElement.text} ({testElement.resource_id})
          </Text>
        </Space>
      </Card>

      <Card title="分析控制" style={{ marginBottom: '20px' }}>
        <Space>
          <Button 
            type="primary" 
            onClick={handleStartAnalysis}
            disabled={adapter.analysisState === 'analyzing'}
            loading={adapter.analysisState === 'analyzing'}
          >
            启动智能分析
          </Button>
          
          <Button 
            onClick={handleCancelAnalysis}
            disabled={adapter.analysisState !== 'analyzing'}
          >
            取消分析
          </Button>
          
          <Button onClick={handleResetAnalysis}>
            重置状态
          </Button>
        </Space>
      </Card>

      {showResults && (
        <>
          <Card title="分析状态" style={{ marginBottom: '20px' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>当前状态: </Text>
                <Text 
                  style={{ 
                    color: adapter.analysisState === 'completed' ? '#52c41a' 
                          : adapter.analysisState === 'failed' ? '#ff4d4f'
                          : adapter.analysisState === 'analyzing' ? '#1890ff'
                          : '#8c8c8c'
                  }}
                >
                  {getStateDisplayText(adapter.analysisState)}
                </Text>
              </div>

              {adapter.analysisProgress && (
                <div>
                  <Text strong>分析进度:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Progress 
                      percent={getProgressPercent()} 
                      size="small"
                      status={adapter.analysisState === 'failed' ? 'exception' : 'active'}
                    />
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      步骤 {adapter.analysisProgress.currentStep}/{adapter.analysisProgress.totalSteps}: {adapter.analysisProgress.stepName}
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          {adapter.analysisResult && (
            <Card title="分析结果" style={{ marginBottom: '20px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Alert
                  message="分析完成"
                  description={`使用 ${adapter.analysisResult.metadata.usedBackend === 'real' ? '真实后端' : '模拟后端'} 完成智能分析`}
                  type="success"
                  showIcon
                />
                
                <div>
                  <Text strong>推荐策略:</Text>
                  <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                    <Text style={{ fontWeight: '500' }}>{adapter.analysisResult.recommendedStrategy.name}</Text>
                    <br />
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      置信度: {Math.round(adapter.analysisResult.confidence * 100)}%
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px' }}>
                      {adapter.analysisResult.reasoning}
                    </Text>
                  </div>
                </div>

                {adapter.analysisResult.alternatives.length > 0 && (
                  <div>
                    <Text strong>备选策略 ({adapter.analysisResult.alternatives.length}):</Text>
                    <div style={{ marginTop: '8px' }}>
                      {adapter.analysisResult.alternatives.slice(0, 3).map((alt, index) => (
                        <div
                          key={alt.key}
                          style={{
                            padding: '8px',
                            marginBottom: '4px',
                            backgroundColor: '#fafafa',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                          }}
                        >
                          <Text style={{ fontSize: '12px', fontWeight: '500' }}>{alt.name}</Text>
                          <br />
                          <Text style={{ fontSize: '11px', color: '#666' }}>
                            置信度: {Math.round((alt.confidence || 0) * 100)}%
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Text strong>分析元数据:</Text>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    <div>分析时间: {adapter.analysisResult.metadata.analysisTime}ms</div>
                    <div>策略数量: {adapter.analysisResult.metadata.strategyCount}</div>
                    <div>后端类型: {adapter.analysisResult.metadata.usedBackend}</div>
                  </div>
                </div>
              </Space>
            </Card>
          )}
        </>
      )}

      <Card title="调试信息">
        <Text code style={{ fontSize: '12px' }}>
          {JSON.stringify({
            state: adapter.analysisState,
            hasProgress: !!adapter.analysisProgress,
            hasResult: !!adapter.analysisResult,
            config: adapter.config,
          }, null, 2)}
        </Text>
      </Card>
    </div>
  );
};