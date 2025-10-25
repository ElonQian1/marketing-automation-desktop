// src/pages/smart-selection-test.tsx
// module: pages | layer: pages | role: 智能选择功能测试页面
// summary: 测试智能选择模式和操作方式切换功能

import React from 'react';
import { Card, Space, Typography, Divider } from 'antd';
import { UnifiedCompactStrategyMenu } from '../components/strategy-selector/UnifiedCompactStrategyMenu';

const { Title, Paragraph } = Typography;

const SmartSelectionTestPage: React.FC = () => {
  const mockElementData = {
    uid: 'test_element_123',
    xpath: '//android.widget.TextView[@text="关注"]',
    text: '关注',
    bounds: '[100,200][300,400]',
    resourceId: 'com.example:id/follow_button',
    className: 'android.widget.TextView'
  };

  return (
    <div style={{ 
      padding: '24px', 
      background: '#0f172a', 
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      <Title level={2} style={{ color: '#f8fafc', marginBottom: '24px' }}>
        🎯 智能选择功能测试
      </Title>
      
      <Card 
        title="智能选择按钮测试" 
        style={{ 
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          marginBottom: '24px'
        }}
        headStyle={{ 
          color: '#f8fafc',
          background: 'rgba(51, 65, 85, 0.3)'
        }}
        bodyStyle={{ 
          color: '#f8fafc',
          background: 'transparent'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Paragraph style={{ color: '#cbd5e1' }}>
            测试智能选择的三个按钮：策略选择、选择模式、操作方式
          </Paragraph>
          
          <div style={{ 
            padding: '16px', 
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(51, 65, 85, 0.3)'
          }}>
            <Paragraph style={{ color: '#10b981', marginBottom: '12px' }}>
              📋 测试元素信息:
            </Paragraph>
            <ul style={{ color: '#94a3b8', fontSize: '12px' }}>
              <li>UID: {mockElementData.uid}</li>
              <li>文本: {mockElementData.text}</li>
              <li>XPath: {mockElementData.xpath}</li>
              <li>资源ID: {mockElementData.resourceId}</li>
            </ul>
          </div>
          
          <div style={{ 
            padding: '16px', 
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(110, 139, 255, 0.3)'
          }}>
            <Paragraph style={{ color: '#6e8bff', marginBottom: '12px' }}>
              🎯 智能选择组件:
            </Paragraph>
            <UnifiedCompactStrategyMenu 
              elementData={mockElementData}
              onStrategyReady={(cardId, strategy) => {
                console.log('🎯 策略就绪回调:', { cardId, strategy });
              }}
            />
          </div>
          
          <Divider style={{ borderColor: 'rgba(51, 65, 85, 0.3)' }} />
          
          <div style={{ 
            padding: '16px', 
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '8px'
          }}>
            <Paragraph style={{ color: '#f59e0b', marginBottom: '12px' }}>
              🧪 测试说明:
            </Paragraph>
            <ul style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
              <li><strong>第一个按钮</strong>: 策略选择 (智能·自动链 / 智能·单步 / 静态策略)</li>
              <li><strong>第二个按钮</strong>: 选择模式 (🎯 第一个 / 🎯 最后一个 / 🔍 精确匹配 / 🎲 随机选择 / 📋 批量全部)</li>
              <li><strong>第三个按钮</strong>: 操作方式 (👆 点击 / ⏸️ 长按 / 👆👆 双击 / 👉 滑动 / ⌨️ 输入 / ⏳ 等待)</li>
              <li><strong>🧪 按钮</strong>: 测试执行 (开发模式可见)</li>
            </ul>
          </div>
          
          <div style={{ 
            padding: '16px', 
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <Paragraph style={{ color: '#10b981', marginBottom: '12px' }}>
              ✅ 测试步骤:
            </Paragraph>
            <ol style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
              <li>点击第二个按钮 (🎯 第一个)，应该看到下拉菜单</li>
              <li>选择 "🎯 最后一个"，按钮文字应该更新</li>
              <li>点击第三个按钮 (👆 点击)，应该看到操作方式菜单</li>
              <li>选择 "⏸️ 长按"，按钮文字应该更新</li>
              <li>打开开发者工具，查看状态变化日志</li>
              <li>点击 🧪 按钮测试完整执行链路</li>
            </ol>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default SmartSelectionTestPage;