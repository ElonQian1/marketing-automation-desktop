// src/pages/UnifiedAnalysisDemo.tsx
// module: demo | layer: pages | role: 统一分析系统演示
// summary: 演示新的统一状态管理和事件路由系统，解决分析完成但UI不更新的问题

import React from 'react';
import { Card, Space, Typography, Divider, Alert, Button } from 'antd';
import { UnifiedCompactStrategyMenu } from '../components/strategy-selector/UnifiedCompactStrategyMenu';
import { UnifiedSmartStepCard } from '../components/step-cards/UnifiedSmartStepCard';
import { useStepCardStore } from '../store/stepcards';
import { useUnifiedAnalysisEvents } from '../services/unified-analysis-events';

const { Title, Text, Paragraph } = Typography;

export const UnifiedAnalysisDemo: React.FC = () => {
  const { getAllCards, clear } = useStepCardStore();
  const { isReady: eventsReady } = useUnifiedAnalysisEvents();
  
  const allCards = getAllCards();

  // Mock 元素数据
  const mockElements = [
    {
      uid: 'login-button-unified',
      xpath: '//android.widget.Button[@text="登录"]',
      text: '登录',
      bounds: '100,200,220,248',
      resourceId: 'com.example.app:id/login_button',
      className: 'android.widget.Button'
    },
    {
      uid: 'search-input-unified', 
      xpath: '//android.widget.EditText[@hint="搜索"]',
      text: '搜索',
      bounds: '50,100,300,140',
      resourceId: 'com.example.app:id/search_input',
      className: 'android.widget.EditText'
    }
  ];

  return (
    <div style={{
      padding: '20px',
      background: '#0F172A',
      minHeight: '100vh',
      color: '#F8FAFC'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Title level={1} style={{ color: '#6E8BFF', textAlign: 'center' }}>
          🔄 统一分析系统演示
        </Title>

        {/* 系统状态 */}
        <Card 
          title="🔧 系统状态" 
          style={{ marginBottom: '20px' }}
          className="light-theme-force"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>事件系统: </Text>
              {eventsReady ? (
                <Text style={{ color: '#10B981' }}>✅ 已就绪</Text>
              ) : (
                <Text style={{ color: '#EF4444' }}>❌ 未就绪</Text>
              )}
            </div>
            <div>
              <Text strong>活跃卡片数量: </Text>
              <Text>{allCards.length}</Text>
            </div>
            <Button size="small" onClick={clear} type="default">
              🧹 清空所有卡片
            </Button>
          </Space>
        </Card>

        {/* 问题说明 */}
        <Alert
          message="🐛 问题修复演示"
          description={
            <div>
              <Paragraph>
                <strong>原问题</strong>：后端分析完成显示 "✅ 分析完成"，但前端按钮仍显示加载状态 "🧠 智能·自动链 🔄 0%"
              </Paragraph>
              <Paragraph>
                <strong>根本原因</strong>：两个分析系统（useIntelligentAnalysisWorkflow vs useSmartStrategyAnalysis）各自为政，事件路由不统一
              </Paragraph>
              <Paragraph>
                <strong>解决方案</strong>：统一状态管理 + jobId 精确路由 + 事件系统重构
              </Paragraph>
            </div>
          }
          type="info"
          style={{ marginBottom: '20px' }}
        />

        {/* 紧凑策略菜单演示 */}
        <Card 
          title="🎯 紧凑策略菜单 (新版本)" 
          style={{ marginBottom: '20px' }}
          className="light-theme-force"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text>登录按钮元素分析：</Text>
              <div style={{ marginTop: '8px' }}>
                <UnifiedCompactStrategyMenu
                  elementData={mockElements[0]}
                  onStrategyReady={(cardId, strategy) => {
                    console.log('🎉 策略就绪回调:', { cardId, strategy });
                  }}
                />
              </div>
            </div>
            
            <div>
              <Text>搜索框元素分析：</Text>
              <div style={{ marginTop: '8px' }}>
                <UnifiedCompactStrategyMenu
                  elementData={mockElements[1]}
                  onStrategyReady={(cardId, strategy) => {
                    console.log('🎉 策略就绪回调:', { cardId, strategy });
                  }}
                />
              </div>
            </div>
          </Space>
        </Card>

        {/* 步骤卡片列表 */}
        <Card 
          title="📋 活跃步骤卡片" 
          style={{ marginBottom: '20px' }}
          className="light-theme-force"
        >
          {allCards.length === 0 ? (
            <Text type="secondary">暂无活跃卡片，请点击上方按钮创建分析任务</Text>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {allCards.map(card => (
                <UnifiedSmartStepCard
                  key={card.id}
                  cardId={card.id}
                  mockElement={{
                    uid: card.elementUid,
                    xpath: card.elementContext?.xpath || '',
                    text: card.elementContext?.text || '',
                    bounds: card.elementContext?.bounds || '',
                    resourceId: card.elementContext?.resourceId || '',
                    className: card.elementContext?.className || '',
                  }}
                  compact={false}
                  onExecute={(cardId, strategy) => {
                    console.log('执行策略:', { cardId, strategy });
                  }}
                  onRemove={(cardId) => {
                    console.log('删除卡片:', { cardId });
                  }}
                />
              ))}
            </Space>
          )}
        </Card>

        {/* 调试信息 */}
        <Card 
          title="🔍 调试信息" 
          size="small"
          className="light-theme-force"
        >
          <pre style={{ 
            fontSize: '12px', 
            background: '#1E293B', 
            color: '#CBD5E1',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify({
              eventsReady,
              totalCards: allCards.length,
              cards: allCards.map(card => ({
                id: card.id.slice(-8),
                uid: card.elementUid.slice(-8),
                status: card.status,
                jobId: card.jobId?.slice(-8),
                hasStrategy: !!card.strategy,
                progress: card.progress
              }))
            }, null, 2)}
          </pre>
        </Card>

      </div>
    </div>
  );
};