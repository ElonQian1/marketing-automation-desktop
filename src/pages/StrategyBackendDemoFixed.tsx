// src/pages/StrategyBackendDemoFixed.tsx
// module: demo | layer: pages | role: 修复版策略后端集成演示
// summary: 使用统一状态管理系统修复后的策略选择器演示，解决按钮卡在加载状态的问题

import React from 'react';
import { Card, Typography, Space, Alert, Button } from 'antd';
import { UnifiedCompactStrategyMenu } from '../components/strategy-selector/UnifiedCompactStrategyMenu';
import { useUnifiedAnalysisEvents } from '../services/unified-analysis-events';
import { useStepCardStore } from '../store/stepcards';

const { Title, Text, Paragraph } = Typography;

export const StrategyBackendDemoFixed: React.FC = () => {
  const { isReady: eventsReady } = useUnifiedAnalysisEvents();
  const { getAllCards, clear } = useStepCardStore();
  
  const allCards = getAllCards();

  // Mock 元素数据 - 与原版完全相同
  const mockElement = {
    uid: 'login-button-element-fixed',
    xpath: '//android.widget.Button[@text="登录"]',
    text: '登录',
    bounds: '100,200,220,248',
    resourceId: 'com.example.app:id/login_button',
    className: 'android.widget.Button'
  };

  return (
    <div style={{
      padding: '20px',
      background: '#0F172A',
      minHeight: '100vh',
      color: '#F8FAFC'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <Title level={1} style={{ 
          marginBottom: '20px',
          color: '#6E8BFF',
          textAlign: 'center'
        }}>
          🚀 策略选择器真实后端集成演示 (修复版)
        </Title>

        {/* 问题修复说明 */}
        <Alert
          message="🐛➡️✅ 问题修复对比"
          description={
            <div>
              <Paragraph>
                <strong>原问题</strong>：点击 "🧠 智能·自动链" 后，后端显示 "✅ 分析完成: job_id=391daac9..."，但按钮仍显示 "🧠 智能·自动链 🔄 0%"
              </Paragraph>
              <Paragraph>
                <strong>修复方案</strong>：
                <ul>
                  <li>✅ 统一状态管理 (useStepCardStore)</li>
                  <li>✅ jobId 精确路由 (事件系统重构)</li>
                  <li>✅ 状态机：draft → analyzing → ready</li>
                  <li>✅ 一次性创建卡片+绑定Job</li>
                </ul>
              </Paragraph>
            </div>
          }
          type="success"
          style={{ marginBottom: '20px' }}
        />

        <div style={{ marginBottom: '20px' }}>
          <Text>系统状态: </Text>
          {eventsReady ? (
            <Text style={{ color: '#10B981' }}>✅ 事件系统已就绪</Text>
          ) : (
            <Text style={{ color: '#EF4444' }}>❌ 事件系统未就绪</Text>
          )}
          <Text style={{ marginLeft: '20px' }}>活跃卡片: {allCards.length}</Text>
          <Button size="small" onClick={clear} style={{ marginLeft: '10px' }}>
            清空
          </Button>
        </div>

        <div style={{
          background: '#1E293B',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #334155',
          marginBottom: '20px'
        }}>
          <Title level={3} style={{ 
            margin: '0 0 15px 0', 
            color: '#60A5FA',
            fontSize: '16px'
          }}>
            📋 当前元素上下文
          </Title>
          <div style={{ 
            background: '#0F172A', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '15px'
          }}>
            <div><strong>XPath:</strong> <code>{mockElement.xpath}</code></div>
            <div><strong>Text:</strong> {mockElement.text}</div>
            <div><strong>Resource ID:</strong> <code>{mockElement.resourceId}</code></div>
            <div><strong>Class:</strong> <code>{mockElement.className}</code></div>
            <div><strong>Bounds:</strong> {mockElement.bounds}</div>
          </div>

          <Title level={4} style={{ 
            margin: '0 0 10px 0', 
            color: '#60A5FA',
            fontSize: '14px'
          }}>
            🧠 智能策略分析 (修复版)
          </Title>
          
          <div style={{
            background: '#0F172A',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <UnifiedCompactStrategyMenu
              elementData={mockElement}
              onStrategyReady={(cardId, strategy) => {
                console.log('🎉 [StrategyBackendDemoFixed] 策略就绪回调:', { cardId, strategy });
              }}
            />
          </div>
        </div>

        {/* 实时状态展示 */}
        <Card 
          title="🔍 实时状态监控" 
          size="small"
          className="light-theme-force"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>当前测试步骤：</Text>
              <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>点击上方 "🧠 智能·自动链" 按钮</li>
                <li>观察按钮状态变化：🧠 智能·自动链 → 🧠 智能·自动链 🔄 X% → 🧠 智能·自动链 ✅</li>
                <li>查看控制台日志确认事件路由正确</li>
                <li>点击 ✅ 状态的按钮查看推荐策略</li>
              </ol>
            </div>
            
            {allCards.length > 0 && (
              <div>
                <Text strong>活跃卡片状态：</Text>
                <div style={{ marginTop: '8px' }}>
                  {allCards.map(card => (
                    <div key={card.id} style={{ 
                      background: '#1E293B', 
                      padding: '8px', 
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '12px'
                    }}>
                      <Text>ID: {card.id.slice(-8)} | 状态: {card.status} | 进度: {card.progress || 0}%</Text>
                      {card.jobId && <Text> | Job: {card.jobId.slice(-8)}</Text>}
                      {card.strategy && <Text> | 策略: {card.strategy.primary}</Text>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Space>
        </Card>

      </div>
    </div>
  );
};