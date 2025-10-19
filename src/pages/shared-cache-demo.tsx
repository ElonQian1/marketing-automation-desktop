// src/pages/shared-cache-demo.tsx
// module: pages | layer: ui | role: 共享缓存演示页面
// summary: 演示智能单步和自动链共享缓存机制，验证专家建议的实施效果

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Table, Tag, message, Divider, Tooltip } from 'antd';
import { SyncOutlined, CheckCircleOutlined, DashboardOutlined } from '@ant-design/icons';
import { useStepScoreStore } from '../stores/step-score-store';
import type { StepScore } from '../stores/step-score-store';
import { ConfidenceTag } from '../modules/universal-ui';
import { UnifiedCompactStrategyMenu } from '../components/strategy-selector/UnifiedCompactStrategyMenu';

const SharedCacheDemo: React.FC = () => {
  const { 
    getAll, 
    clear, 
    cleanExpired, 
    upsert,
    generateKey
  } = useStepScoreStore();
  
  const [scores, setScores] = useState<StepScore[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 刷新缓存数据
  const refreshScores = () => {
    setScores(getAll());
    setRefreshKey(prev => prev + 1);
  };

  // 自动刷新
  useEffect(() => {
    refreshScores();
    const interval = setInterval(refreshScores, 2000); // 每2秒刷新
    return () => clearInterval(interval);
  }, []);

  // 模拟添加测试数据
  const addTestScore = (origin: 'single' | 'chain') => {
    const testElementUid = `test_element_${Date.now()}`;
    const confidence = 0.7 + Math.random() * 0.3; // 70%-100%
    
    upsert({
      key: generateKey(testElementUid),
      recommended: Math.random() > 0.5 ? 'self_anchor' : 'xpath_fallback',
      confidence,
      evidence: {
        model: Math.random() * 0.8,
        locator: Math.random() * 0.2,
        visibility: Math.random() * 0.1,
        device: Math.random() * 0.1
      },
      origin,
      elementUid: testElementUid,
      timestamp: Date.now()
    });
    
    message.success(`添加了${origin === 'single' ? '智能单步' : '自动链'}测试数据`);
    refreshScores();
  };

  // 表格列定义
  const columns = [
    {
      title: '缓存键',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text: string) => (
        <Tooltip title={text}>
          <code className="text-xs">{text.slice(0, 20)}...</code>
        </Tooltip>
      )
    },
    {
      title: '来源',
      dataIndex: 'origin',
      key: 'origin',
      width: 80,
      render: (origin: 'single' | 'chain') => (
        <Tag color={origin === 'single' ? 'blue' : 'green'}>
          {origin === 'single' ? '单步' : '链路'}
        </Tag>
      )
    },
    {
      title: '推荐策略',
      dataIndex: 'recommended',
      key: 'recommended',
      width: 120,
      render: (text: string) => <code className="text-xs">{text}</code>
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      render: (confidence: number, record: StepScore) => (
        <ConfidenceTag 
          confidence={confidence} 
          evidence={record.evidence}
          size="small"
        />
      )
    },
    {
      title: '证据详情',
      dataIndex: 'evidence',
      key: 'evidence',
      width: 200,
      render: (evidence?: Record<string, number>) => {
        if (!evidence) return '-';
        return (
          <div className="text-xs space-y-1">
            {Object.entries(evidence).map(([key, value]) => (
              <div key={key}>
                {key}: {(value * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        );
      }
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (timestamp: number) => (
        <span className="text-xs">
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      )
    }
  ];

  // 模拟元素数据
  const mockElements = [
    {
      uid: 'demo_publish_btn',
      xpath: '//button[@text="发布"]',
      text: '发布',
      resourceId: 'com.app:id/publish_btn'
    },
    {
      uid: 'demo_search_input',
      xpath: '//input[@resource-id="search"]',
      text: '',
      resourceId: 'com.app:id/search_input'
    },
    {
      uid: 'demo_like_btn',
      xpath: '//button[@content-desc="点赞"]',
      text: '♥',
      resourceId: 'com.app:id/like_button'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto light-theme-force">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        📊 共享缓存机制演示
      </h1>
      
      <div className="mb-4 text-sm text-gray-600">
        <p>💡 <strong>专家建议实施</strong>：智能单步和自动链共享同一套评分缓存，避免重复计算，确保口径一致。</p>
      </div>

      {/* 控制面板 */}
      <Card title="缓存控制" className="mb-6">
        <Space wrap>
          <Button 
            icon={<CheckCircleOutlined />} 
            onClick={() => addTestScore('single')}
            type="primary"
          >
            模拟单步分析
          </Button>
          
          <Button 
            icon={<CheckCircleOutlined />} 
            onClick={() => addTestScore('chain')}
            type="primary"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            模拟自动链评分
          </Button>
          
          <Button 
            icon={<SyncOutlined />} 
            onClick={refreshScores}
          >
            刷新缓存
          </Button>
          
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => {
              cleanExpired(10000); // 清理10秒前的数据
              refreshScores();
              message.success('已清理过期缓存');
            }}
          >
            清理过期
          </Button>
          
          <Button 
            icon={<DashboardOutlined />} 
            danger
            onClick={() => {
              clear();
              refreshScores();
              message.success('已清空所有缓存');
            }}
          >
            清空缓存
          </Button>
        </Space>
      </Card>

      {/* 策略菜单集成演示 */}
      <Card title="策略菜单缓存集成演示" className="mb-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            这些策略菜单会优先从共享缓存读取置信度信息，如果缓存命中，将立即显示（无需重新分析）：
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockElements.map((element) => (
              <div key={element.uid} className="border rounded p-4">
                <h4 className="font-medium mb-2">{element.text || element.resourceId}</h4>
                <p className="text-xs text-gray-500 mb-3">UID: {element.uid}</p>
                <UnifiedCompactStrategyMenu 
                  elementData={element}
                  onStrategyReady={(cardId, strategy) => {
                    message.info(`策略就绪: ${strategy.primary}`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 缓存数据表格 */}
      <Card title={`共享缓存数据 (${scores.length} 条记录)`} className="mb-6">
        <Table
          columns={columns}
          dataSource={scores}
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
          locale={{ emptyText: '暂无缓存数据' }}
        />
      </Card>

      <Divider />

      {/* 说明文档 */}
      <Card title="💡 专家建议的核心价值" size="small">
        <div className="text-sm space-y-3">
          <div>
            <strong>1. 统一口径</strong>：智能单步和自动链使用同一套评分引擎，确保同一元素在同一屏幕下的置信度完全一致。
          </div>
          
          <div>
            <strong>2. 性能优化</strong>：通过共享缓存避免重复计算。自动链先分析的结果，单步可直接复用显示。
          </div>
          
          <div>
            <strong>3. 实时同步</strong>：任何一方产生的评分结果，另一方都能立即看到，用户体验更流畅。
          </div>
          
          <div>
            <strong>4. 可追溯性</strong>：每条缓存记录都标注了来源（单步/链路），便于调试和优化。
          </div>
          
          <div>
            <strong>5. 自动过期</strong>：缓存会自动清理过期数据，避免内存泄漏和陈旧信息干扰。
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SharedCacheDemo;