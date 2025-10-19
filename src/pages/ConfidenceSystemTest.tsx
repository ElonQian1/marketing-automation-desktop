// src/pages/ConfidenceSystemTest.tsx
// module: pages | layer: ui | role: confidence-system-testing
// summary: 置信度系统测试页面，验证后端分析->前端显示->持久化完整链路

import React, { useState } from 'react';
import { Card, Button, Space, Divider, notification, Timeline } from 'antd';
import { PlayCircleOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { UnifiedSmartStepCard } from '../components/step-cards/UnifiedSmartStepCard';
import { ConfidenceTag } from '../components/confidence-tag';
import { useStepCardStore } from '../store/stepcards';
import { exportStepPack, downloadStepPack } from '../services/step-pack-service';

export default function ConfidenceSystemTest() {
  const { create: createCard, clear: clearAll } = useStepCardStore();
  const [testCardId, setTestCardId] = useState<string>('');

  // 创建测试卡片
  const createTestCard = () => {
    const cardId = `test-${Date.now()}`;
    
    createCard({
      elementUid: cardId, // elementUid 即为 cardId
      elementContext: {
        xpath: '//*[@resource-id="com.xhs:id/search_input"]',
        text: '搜索框',
        resourceId: 'com.xhs:id/search_input',
        className: 'android.widget.EditText',
        bounds: '[100,200][500,250]'
      }
    });
    
    setTestCardId(cardId);
    notification.success({ message: '创建测试卡片成功', description: `卡片ID: ${cardId}` });
  };

  // 导出测试
  const testExport = () => {
    if (!testCardId) {
      notification.error({ message: '请先创建测试卡片' });
      return;
    }
    
    try {
      const stepPack = exportStepPack(testCardId, { 
        includeScore: true, 
        description: '置信度系统测试导出' 
      });
      
      if (stepPack) {
        downloadStepPack(stepPack);
        notification.success({ 
          message: '导出成功', 
          description: '步骤包已下载到本地' 
        });
      }
    } catch (error) {
      notification.error({ 
        message: '导出失败', 
        description: String(error) 
      });
    }
  };

  // 测试不同置信度级别的标签
  const confidenceTestCases = [
    { value: 0.95, label: '高置信度 (95%)', color: 'success' },
    { value: 0.75, label: '中等置信度 (75%)', color: 'warning' },
    { value: 0.45, label: '低置信度 (45%)', color: 'error' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card title="🧪 置信度系统完整性测试" size="small">
        <Timeline
          items={[
            {
              color: 'blue',
              children: (
                <div>
                  <strong>1. 创建测试卡片</strong>
                  <div style={{ marginTop: 8 }}>
                    <Button type="primary" onClick={createTestCard}>
                      创建测试卡片
                    </Button>
                  </div>
                </div>
              )
            },
            {
              color: testCardId ? 'green' : 'gray',
              children: (
                <div>
                  <strong>2. 智能分析 (后端事件 → 前端状态)</strong>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
                    点击"🧠 智能分析"按钮，验证 ANALYSIS_DONE 事件能正确更新 meta.singleStepScore
                  </div>
                </div>
              )
            },
            {
              color: 'orange',
              children: (
                <div>
                  <strong>3. 置信度标签显示</strong>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      {confidenceTestCases.map((testCase, index) => (
                        <ConfidenceTag
                          key={index}
                          value={testCase.value}
                          size="default"
                        />
                      ))}
                    </Space>
                  </div>
                </div>
              )
            },
            {
              color: 'purple',
              children: (
                <div>
                  <strong>4. 导出持久化测试</strong>
                  <div style={{ marginTop: 8 }}>
                    <Button 
                      icon={<SaveOutlined />}
                      onClick={testExport}
                      disabled={!testCardId}
                    >
                      导出步骤包
                    </Button>
                  </div>
                </div>
              )
            }
          ]}
        />

        <Divider>测试说明</Divider>
        
        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
          <h4>测试步骤：</h4>
          <ol>
            <li><strong>创建测试卡片</strong> - 生成一个带有模拟元素信息的步骤卡片</li>
            <li><strong>触发智能分析</strong> - 点击"🧠 智能分析"，验证后端分析完成后前端能接收到置信度数据</li>
            <li><strong>检查置信度显示</strong> - 验证卡片标题区域是否正确显示置信度标签</li>
            <li><strong>测试导出功能</strong> - 验证导出的步骤包包含置信度信息</li>
          </ol>

          <h4>验证点：</h4>
          <ul>
            <li>✅ 后端 <code>AnalysisDoneEvent</code> 包含 confidence 字段</li>
            <li>✅ 前端 <code>setSingleStepConfidence</code> 方法工作正常</li>
            <li>✅ <code>ConfidenceTag</code> 组件颜色编码正确 (绿≥85%, 琥珀≥60%, 红&lt;60%)</li>
            <li>✅ 导出/导入包含 <code>meta.singleStepScore</code></li>
          </ul>
        </div>
      </Card>

      <Divider />

      {/* 测试卡片区域 */}
      {testCardId && (
        <Card title="📋 测试卡片" size="small">
          <UnifiedSmartStepCard 
            cardId={testCardId}
            mockElement={{
              uid: 'test-element',
              xpath: '//*[@resource-id="com.xhs:id/search_input"]',
              text: '搜索框',
              resourceId: 'com.xhs:id/search_input',
              className: 'android.widget.EditText',
              bounds: '[100,200][500,250]'
            }}
          />
        </Card>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button danger onClick={clearAll}>
          清除所有测试卡片
        </Button>
      </div>
    </div>
  );
}