// src/modules/universal-ui/pages/intelligent-analysis-real-demo.tsx
// module: universal-ui | layer: pages | role: demo
// summary: 真实智能分析演示页面 - 展示如何使用真实Tauri后端

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Alert, Progress, Tag, Divider } from 'antd';
import { ThunderboltOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { useIntelligentAnalysisReal } from '../hooks/use-intelligent-analysis-real';
import type { ElementSelectionContext, AnalysisResult } from '../types/intelligent-analysis-types';

const { Title, Text, Paragraph } = Typography;

/**
 * 真实智能分析演示页面
 * 
 * 展示:
 * 1. 如何使用 useIntelligentAnalysisReal Hook
 * 2. 真实的 Tauri 命令调用
 * 3. 事件监听和三重校验
 * 4. 元素切换自动取消
 */
export default function IntelligentAnalysisRealDemo() {
  // 模拟元素上下文
  const [mockElementContext] = useState<ElementSelectionContext>({
    snapshotId: 'demo-snapshot-' + Date.now(),
    elementPath: '/hierarchy/android.widget.Button[2]',
    elementText: '确定按钮',
    elementType: 'Button',
    elementBounds: '[100,200][300,400]',
    keyAttributes: {
      'resource-id': 'com.example:id/btn_confirm',
      'class': 'android.widget.Button',
    },
  });
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  
  // 🎯 使用真实分析 Hook
  const {
    currentJob,
    currentSelectionHash,
    startAnalysis,
    cancelAnalysis,
    isAnalyzing,
  } = useIntelligentAnalysisReal({
    elementContext: mockElementContext,
    stepId: 'demo-step-1',
    lockContainer: false,
    onAnalysisComplete: (analysisResult) => {
      console.log('✅ 分析完成回调', analysisResult);
      setResult(analysisResult);
      setError(null);
      addProgressLog(`✅ 分析完成! 推荐策略: ${analysisResult.recommendedKey}`);
    },
    onAnalysisError: (errorMsg) => {
      console.error('❌ 分析失败回调', errorMsg);
      setError(errorMsg);
      setResult(null);
      addProgressLog(`❌ 分析失败: ${errorMsg}`);
    },
    onProgressUpdate: (progress, step) => {
      console.log('📊 进度更新', { progress, step });
      addProgressLog(`📊 ${progress}% - ${step}`);
    },
  });
  
  const addProgressLog = (log: string) => {
    setProgressLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };
  
  const handleStart = async () => {
    setProgressLog([]);
    setResult(null);
    setError(null);
    addProgressLog('🚀 启动智能分析...');
    await startAnalysis();
  };
  
  const handleCancel = async () => {
    addProgressLog('⏹️ 取消分析...');
    await cancelAnalysis();
  };
  
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <ThunderboltOutlined /> 真实智能分析演示
      </Title>
      
      <Paragraph type="secondary">
        此页面展示如何使用 <code>useIntelligentAnalysisReal</code> Hook 调用真实的 Tauri 后端服务
      </Paragraph>
      
      <Divider />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 左侧：控制面板 */}
        <div>
          <Card title="📋 控制面板" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 元素信息 */}
              <div>
                <Text strong>元素上下文</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  marginTop: 8,
                  fontSize: 12,
                }}>
                  <div>📍 路径: {mockElementContext.elementPath}</div>
                  <div>📝 文本: {mockElementContext.elementText}</div>
                  <div>🆔 Resource-ID: {mockElementContext.keyAttributes?.['resource-id']}</div>
                  <div>🔐 Hash: <code>{currentSelectionHash.slice(0, 8)}...</code></div>
                </div>
              </div>
              
              {/* 当前任务状态 */}
              {currentJob && (
                <div>
                  <Text strong>当前任务</Text>
                  <div style={{ 
                    background: '#e6f7ff', 
                    padding: 12, 
                    borderRadius: 4,
                    marginTop: 8,
                  }}>
                    <div>Job ID: <code>{currentJob.jobId.slice(0, 8)}...</code></div>
                    <div>状态: <Tag color={
                      currentJob.state === 'running' ? 'processing' :
                      currentJob.state === 'completed' ? 'success' :
                      currentJob.state === 'failed' ? 'error' : 'default'
                    }>{currentJob.state}</Tag></div>
                    <div>进度: {currentJob.progress}%</div>
                    {currentJob.estimatedTimeLeft && (
                      <div>预计剩余: {Math.ceil(currentJob.estimatedTimeLeft / 1000)}s</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 操作按钮 */}
              <Space>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleStart}
                  loading={isAnalyzing}
                  disabled={isAnalyzing}
                >
                  启动分析
                </Button>
                
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={handleCancel}
                  disabled={!isAnalyzing}
                >
                  取消分析
                </Button>
                
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setProgressLog([]);
                    setResult(null);
                    setError(null);
                  }}
                >
                  清空日志
                </Button>
              </Space>
              
              {/* 进度条 */}
              {isAnalyzing && currentJob && (
                <div>
                  <Text strong>分析进度</Text>
                  <Progress 
                    percent={currentJob.progress} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              )}
            </Space>
          </Card>
          
          {/* 进度日志 */}
          <Card 
            title="📝 实时日志" 
            size="small" 
            style={{ marginTop: 16 }}
            bodyStyle={{ maxHeight: 300, overflow: 'auto' }}
          >
            {progressLog.length === 0 ? (
              <Text type="secondary">暂无日志...</Text>
            ) : (
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {progressLog.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        
        {/* 右侧：结果展示 */}
        <div>
          {/* 错误信息 */}
          {error && (
            <Alert
              type="error"
              message="分析失败"
              description={error}
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}
          
          {/* 成功结果 */}
          {result && (
            <Card title="✅ 分析结果" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>推荐策略</Text>
                  <div style={{ 
                    background: '#f6ffed', 
                    padding: 12, 
                    borderRadius: 4,
                    marginTop: 8,
                    border: '1px solid #b7eb8f',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                      {result.smartCandidates.find(c => c.key === result.recommendedKey)?.name}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      置信度: <Tag color="success">{result.recommendedConfidence}%</Tag>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      XPath: <code>{result.smartCandidates.find(c => c.key === result.recommendedKey)?.xpath}</code>
                    </div>
                  </div>
                </div>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <div>
                  <Text strong>所有候选策略 ({result.smartCandidates.length})</Text>
                  <div style={{ marginTop: 8 }}>
                    {result.smartCandidates.map((candidate) => (
                      <div
                        key={candidate.key}
                        style={{
                          background: candidate.isRecommended ? '#f6ffed' : '#fafafa',
                          padding: 8,
                          borderRadius: 4,
                          marginBottom: 8,
                          border: candidate.isRecommended ? '1px solid #b7eb8f' : '1px solid #d9d9d9',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{candidate.name}</Text>
                          <Space>
                            {candidate.isRecommended && <Tag color="success">推荐</Tag>}
                            <Tag color="blue">{candidate.confidence}%</Tag>
                          </Space>
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          {candidate.description}
                        </div>
                        <div style={{ fontSize: 11, marginTop: 4, color: '#999' }}>
                          <code>{candidate.xpath}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <div>
                  <Text strong>兜底策略</Text>
                  <div style={{ 
                    background: '#fff7e6', 
                    padding: 8, 
                    borderRadius: 4,
                    marginTop: 8,
                    border: '1px solid #ffd591',
                  }}>
                    <div>{result.fallbackStrategy.name}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      {result.fallbackStrategy.description}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, color: '#999' }}>
                      <code>{result.fallbackStrategy.xpath}</code>
                    </div>
                  </div>
                </div>
              </Space>
            </Card>
          )}
          
          {/* 等待状态 */}
          {!result && !error && !isAnalyzing && (
            <Card size="small">
              <div style={{ textAlign: 'center', padding: 40 }}>
                <ThunderboltOutlined style={{ fontSize: 48, color: '#999' }} />
                <div style={{ marginTop: 16, color: '#999' }}>
                  点击"启动分析"开始测试
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      <Divider />
      
      <Card title="📖 使用说明" size="small">
        <Paragraph>
          <Text strong>功能特点:</Text>
        </Paragraph>
        <ul>
          <li>✅ 真实的 Tauri 后端调用 (非模拟)</li>
          <li>✅ 实时进度更新 (analysis:progress 事件)</li>
          <li>✅ 三重防串扰校验 (jobId + selectionHash + stepId)</li>
          <li>✅ 元素切换自动取消旧任务</li>
          <li>✅ 完整的错误处理</li>
        </ul>
        
        <Paragraph style={{ marginTop: 16 }}>
          <Text strong>技术栈:</Text>
        </Paragraph>
        <ul>
          <li>前端: React + TypeScript + Ant Design</li>
          <li>后端: Rust + Tauri 2.0</li>
          <li>通信: Tauri Commands + Events</li>
          <li>Hash: SHA1 (前后端一致)</li>
        </ul>
      </Card>
    </div>
  );
}
