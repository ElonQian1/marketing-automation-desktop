// src/components/confidence-debug-panel.tsx
// module: shared | layer: ui | role: 置信度系统调试面板
// summary: 置信度系统的综合调试工具，提供实时监控和测试功能

import { useState, useEffect } from 'react';
import { Card, Button, Tabs, Typography, Space, Tag, Alert, Input } from 'antd';
import { ReloadOutlined, BugOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useStepCardStore } from '../store/stepcards';
import { ConfidenceBadge } from './common/ConfidenceBadge';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface DebugStepCard {
  id: string;
  confidence: number;
  evidence?: string;
  status: string;
  content: string;
}

export const ConfidenceDebugPanel = () => {
  const { cards, setSingleStepConfidence } = useStepCardStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [testCardId, setTestCardId] = useState('debug-test-card');

  // 刷新数据
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 创建测试卡片
  const createTestCard = (confidence: number, evidence?: string) => {
    const testId = `${testCardId}-${Date.now()}`;
    setSingleStepConfidence(testId, confidence, evidence);
    console.log(`Created test card: ${testId} with confidence ${confidence}%`);
  };

  // 获取有置信度的卡片
  const cardsWithConfidence = Object.entries(cards)
    .filter(([_, card]) => card.confidence !== undefined)
    .map(([id, card]) => ({
      id,
      confidence: card.confidence!,
      evidence: card.evidence,
      status: card.status,
      content: card.content || 'No content'
    }));

  return (
    <div className="confidence-debug-panel p-6">
      <div className="mb-6">
        <Title level={3}>
          <BugOutlined className="mr-2" />
          置信度系统调试面板
        </Title>
        <Text type="secondary">
          实时监控置信度数据流，测试UI组件显示效果
        </Text>
      </div>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="数据概览" key="overview">
          <Space direction="vertical" size="large" className="w-full">
            <Card 
              title="实时统计" 
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  size="small"
                >
                  刷新
                </Button>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(cards).length}
                  </div>
                  <div className="text-gray-500">总卡片数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {cardsWithConfidence.length}
                  </div>
                  <div className="text-gray-500">有置信度</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {cardsWithConfidence.filter(card => card.confidence >= 60).length}
                  </div>
                  <div className="text-gray-500">高置信度</div>
                </div>
              </div>
            </Card>

            {cardsWithConfidence.length === 0 ? (
              <Alert
                message="暂无置信度数据"
                description="当前没有卡片包含置信度信息。请运行智能分析或使用测试功能创建数据。"
                type="info"
                showIcon
              />
            ) : (
              <Card title={`置信度数据列表 (${cardsWithConfidence.length} 项)`}>
                <div className="space-y-3">
                  {cardsWithConfidence.map((card) => (
                    <div key={card.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Text strong className="text-sm font-mono">
                          {card.id}
                        </Text>
                        <div className="flex items-center gap-2">
                          <ConfidenceBadge 
                            value={card.confidence}
                            compact
                          />
                          <Tag color={card.status === 'completed' ? 'green' : 'blue'}>
                            {card.status}
                          </Tag>
                        </div>
                      </div>
                      <Text type="secondary" className="text-xs block truncate">
                        元素 {card.id.slice(-8)}
                      </Text>
                      {card.evidence && (
                        <Text type="secondary" className="text-xs block mt-1">
                          证据: {JSON.stringify(card.evidence)}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Space>
        </TabPane>

        <TabPane tab="测试工具" key="testing">
          <Space direction="vertical" size="large" className="w-full">
            <Card title="创建测试数据" extra={<ExperimentOutlined />}>
              <div className="mb-4">
                <Text strong>测试卡片ID前缀:</Text>
                <Input
                  value={testCardId}
                  onChange={(e) => setTestCardId(e.target.value)}
                  placeholder="debug-test-card"
                  className="mt-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card size="small" title="置信度测试">
                  <Space direction="vertical" size="small" className="w-full">
                    <Button 
                      onClick={() => createTestCard(95, "高质量匹配")}
                      block
                      type="primary"
                    >
                      高置信度 (95%)
                    </Button>
                    <Button 
                      onClick={() => createTestCard(75, "部分匹配")}
                      block
                    >
                      中置信度 (75%)
                    </Button>
                    <Button 
                      onClick={() => createTestCard(45, "弱匹配")}
                      block
                      danger
                    >
                      低置信度 (45%)
                    </Button>
                  </Space>
                </Card>

                <Card size="small" title="边界测试">
                  <Space direction="vertical" size="small" className="w-full">
                    <Button 
                      onClick={() => createTestCard(85, "临界高值")}
                      block
                    >
                      临界值 (85%)
                    </Button>
                    <Button 
                      onClick={() => createTestCard(60, "临界中值")}
                      block
                    >
                      临界值 (60%)
                    </Button>
                    <Button 
                      onClick={() => createTestCard(0, "最低值")}
                      block
                    >
                      最低值 (0%)
                    </Button>
                  </Space>
                </Card>
              </div>
            </Card>

            <Card title="置信度标签预览">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center space-y-2">
                  <Text strong>高置信度 (≥85%)</Text>
                  <div>
                    <ConfidenceBadge value={0.90} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <Text strong>中置信度 (≥60%)</Text>
                  <div>
                    <ConfidenceBadge value={0.72} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <Text strong>低置信度 (&lt;60%)</Text>
                  <div>
                    <ConfidenceBadge value={0.35} />
                  </div>
                </div>
              </div>
            </Card>
          </Space>
        </TabPane>

        <TabPane tab="调试信息" key="debug">
          <Card title="Store 状态">
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify({ 
                totalCards: Object.keys(cards).length,
                cardsWithConfidence: cardsWithConfidence.length,
                sampleCards: Object.fromEntries(
                  Object.entries(cards)
                    .slice(0, 3)
                    .map(([id, card]) => [id, {
                      status: card.status,
                      confidence: card.confidence,
                      evidence: card.evidence,
                      hasElementUid: !!card.elementUid
                    }])
                )
              }, null, 2)}
            </pre>
          </Card>

          <Card title="浏览器控制台日志" className="mt-4">
            <Alert
              message="查看控制台输出"
              description="打开浏览器开发者工具 (F12) → Console 标签，查看置信度相关的实时日志输出。"
              type="info"
              showIcon
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ConfidenceDebugPanel;