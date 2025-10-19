// src/pages/confidence-demo.tsx
// module: pages | layer: ui | role: 置信度演示页面
// summary: 演示置信度标签和分析事件处理功能

import React, { useState } from 'react';
import { Card, Button, Space, Divider, message } from 'antd';
import { ConfidenceTag } from '../modules/universal-ui';
import type { ConfidenceEvidence } from '../modules/universal-ui/types/intelligent-analysis-types';
import { UnifiedCompactStrategyMenu } from '../components/strategy-selector/UnifiedCompactStrategyMenu';

const ConfidenceDemo: React.FC = () => {
  const [testConfidence, setTestConfidence] = useState(0.85);
  const [testEvidence] = useState<ConfidenceEvidence>({
    model: 0.9,
    locator: 0.8,
    visibility: 0.85,
    device: 0.95
  });

  // 模拟元素数据
  const mockElementData = {
    uid: 'demo_element_123',
    xpath: '//button[@class="test-button"]',
    text: '测试按钮',
    bounds: '100,200,200,50',
    resourceId: 'test_button_id',
    className: 'test-button-class'
  };

  const handleConfidenceChange = (newConfidence: number) => {
    setTestConfidence(newConfidence);
    message.info(`置信度更新为: ${Math.round(newConfidence * 100)}%`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto light-theme-force">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">置信度显示系统演示</h1>
      
      {/* 置信度标签演示 */}
      <Card title="置信度标签展示" className="mb-6">
        <Space wrap>
          <div>
            <p className="mb-2 text-sm text-gray-600">高置信度 (≥85%)</p>
            <ConfidenceTag confidence={0.92} evidence={testEvidence} />
          </div>
          
          <div>
            <p className="mb-2 text-sm text-gray-600">中等置信度 (70-84%)</p>
            <ConfidenceTag confidence={0.76} evidence={testEvidence} />
          </div>
          
          <div>
            <p className="mb-2 text-sm text-gray-600">低置信度 (&lt;70%)</p>
            <ConfidenceTag confidence={0.45} evidence={testEvidence} />
          </div>
          
          <div>
            <p className="mb-2 text-sm text-gray-600">无标签版本</p>
            <ConfidenceTag confidence={0.88} evidence={testEvidence} showLabel={false} />
          </div>
          
          <div>
            <p className="mb-2 text-sm text-gray-600">小尺寸</p>
            <ConfidenceTag confidence={0.91} evidence={testEvidence} size="small" />
          </div>
          
          <div>
            <p className="mb-2 text-sm text-gray-600">大尺寸</p>
            <ConfidenceTag confidence={0.73} evidence={testEvidence} size="large" />
          </div>
        </Space>
      </Card>

      {/* 动态测试 */}
      <Card title="动态置信度测试" className="mb-6">
        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600">当前置信度: {Math.round(testConfidence * 100)}%</p>
          <ConfidenceTag confidence={testConfidence} evidence={testEvidence} />
        </div>
        
        <Space wrap>
          <Button onClick={() => handleConfidenceChange(0.95)}>设置高置信度 (95%)</Button>
          <Button onClick={() => handleConfidenceChange(0.77)}>设置中置信度 (77%)</Button>
          <Button onClick={() => handleConfidenceChange(0.42)}>设置低置信度 (42%)</Button>
          <Button onClick={() => handleConfidenceChange(Math.random())}>随机置信度</Button>
        </Space>
      </Card>

      {/* 策略菜单集成测试 */}
      <Card title="策略菜单置信度集成" className="mb-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            测试置信度在策略选择器中的显示效果
          </p>
          <UnifiedCompactStrategyMenu 
            elementData={mockElementData}
            onStrategyReady={(cardId, strategy) => {
              message.success(`策略就绪: ${strategy.primary} (卡片: ${cardId.slice(-6)})`);
            }}
          />
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          💡 点击按钮开始智能分析，完成后将显示置信度标签
        </p>
      </Card>

      <Divider />
      
      <div className="text-xs text-gray-500">
        <p>📊 置信度系统说明:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>高置信度 (≥85%): 绿色标签，表示分析结果可信度高</li>
          <li>中等置信度 (70-84%): 橙色标签，表示分析结果基本可信</li>
          <li>低置信度 (&lt;70%): 红色标签，表示分析结果需要人工确认</li>
          <li>鼠标悬停可查看置信度证据详情（模型、定位、可见性、设备）</li>
        </ul>
      </div>
    </div>
  );
};

export default ConfidenceDemo;