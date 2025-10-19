// src/pages/complete-confidence-demo.tsx
// module: complete-confidence-demo | layer: pages | role: 完整置信度系统演示页面
// summary: 综合展示后端共用引擎、前端事件桥接、共享缓存、UI展示、脚本导出导入的完整流程

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Divider, Typography, Row, Col, message, Table, Tag, Progress, Alert } from 'antd';
import { SyncOutlined, CheckCircleOutlined, DashboardOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useStepCardStore } from '../store/stepcards';
import { useStepScoreStore } from '../stores/step-score-store';
import { ConfidenceTag } from '../modules/universal-ui/components/confidence-tag';
import { UnifiedCompactStrategyMenu } from '../components/strategy-selector/UnifiedCompactStrategyMenu';
import { exportStepPack, importStepPack, serializeStepPack, downloadStepPack, deserializeStepPack } from '../services/step-pack-service';
import type { StepPack } from '../services/step-pack-service';

const { Title, Text, Paragraph } = Typography;

const CompleteConfidenceDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, number>>({});
  const [exportedPacks, setExportedPacks] = useState<StepPack[]>([]);
  
  const { cards, create: createCard, getAllCards } = useStepCardStore();
  const { scores, clear: clearScores, getAllScores } = useStepScoreStore();

  // 测试元素数据
  const testElements = [
    {
      uid: 'demo_login_btn',
      xpath: '//button[@text="登录"]',
      text: '登录',
      bounds: '[100,300][200,350]',
      resourceId: 'com.app:id/login_btn',
      className: 'android.widget.Button'
    },
    {
      uid: 'demo_search_input', 
      xpath: '//input[@resource-id="search"]',
      text: '',
      bounds: '[50,100][350,140]',
      resourceId: 'com.app:id/search_input',
      className: 'android.widget.EditText'
    },
    {
      uid: 'demo_publish_btn',
      xpath: '//button[@text="发布"]',
      text: '发布',
      bounds: '[300,500][400,550]',
      resourceId: 'com.app:id/publish_btn', 
      className: 'android.widget.Button'
    }
  ];

  // 触发智能分析
  const triggerAnalysis = async (element: typeof testElements[0]) => {
    setLoading(true);
    
    try {
      // 创建步骤卡片
      const cardId = createCard({
        elementUid: element.uid,
        elementContext: {
          xpath: element.xpath,
          text: element.text,
          bounds: element.bounds,
          resourceId: element.resourceId,
          className: element.className,
        },
        status: 'draft'
      });

      // 构造分析配置
      const config = {
        element_context: {
          snapshot_id: "demo_" + Date.now(),
          element_path: element.xpath,
          element_text: element.text,
          element_bounds: element.bounds,
          element_type: element.className,
          key_attributes: {
            "resource-id": element.resourceId,
            "class": element.className
          }
        },
        step_id: cardId,
        lock_container: true,
        enable_smart_candidates: true,
        enable_static_candidates: true
      };

      console.log('🚀 触发智能分析', { element: element.uid, cardId });
      const result = await invoke('start_intelligent_analysis', { config });
      
      message.success(`智能分析已启动: ${element.text || element.uid}`);
      console.log('✅ 分析启动成功', result);
      
    } catch (error) {
      message.error(`分析启动失败: ${error}`);
      console.error('❌ 分析启动失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 导出步骤包
  const exportStep = (cardId: string) => {
    try {
      const stepPack = exportStepPack(cardId, { 
        includeScore: true,
        description: `演示导出 - ${new Date().toLocaleString()}`
      });
      
      if (stepPack) {
        setExportedPacks(prev => [...prev, stepPack]);
        downloadStepPack(stepPack);
        message.success('步骤包导出成功！');
      }
    } catch (error) {
      message.error(`导出失败: ${error}`);
    }
  };

  // 导入步骤包
  const importStep = async (stepPack: StepPack) => {
    try {
      message.loading('正在本地重评...', 0);
      const result = await importStepPack(stepPack);
      message.destroy();
      message.success(`导入成功！置信度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log('✅ 导入成功', result);
    } catch (error) {
      message.destroy();
      message.error(`导入失败: ${error}`);
    }
  };

  // 清理所有数据
  const clearAllData = () => {
    const { clear: clearCards } = useStepCardStore.getState();
    clearCards();
    clearScores();
    setExportedPacks([]);
    message.success('所有数据已清理');
  };

  // 监听进度事件
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('analysis:progress', (event: { payload: { job_id: string; progress: number } }) => {
        const { job_id, progress } = event.payload;
        setAnalysisProgress(prev => ({ ...prev, [job_id]: progress }));
      }).then(fn => {
        unlisten = fn;
      });
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // 表格列定义
  const cardColumns = [
    {
      title: '元素',
      dataIndex: 'elementUid',
      key: 'elementUid',
      width: 120,
      render: (uid: string) => <Text code>{uid.slice(-6)}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string, record: any) => {
        const progressValue = Object.values(analysisProgress).find(p => typeof p === 'number') as number || record.progress || 0;
        
        if (status === 'analyzing') {
          return <Progress percent={progressValue} size="small" />;
        }
        
        const colorMap: Record<string, string> = {
          draft: 'default',
          ready: 'success', 
          failed: 'error',
          analyzing: 'processing'
        };
        
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: '策略',
      dataIndex: 'strategy',
      key: 'strategy',
      width: 120,
      render: (strategy: any) => strategy?.primary ? <Text code>{strategy.primary}</Text> : '-'
    },
    {
      title: '置信度',
      key: 'confidence',
      width: 120,
      render: (_: any, record: any) => {
        const score = useStepScoreStore.getState().getByCardId(record.id);
        const confidence = score?.confidence ?? record.confidence;
        const evidence = score?.evidence ?? record.evidence;
        
        return confidence !== undefined ? (
          <ConfidenceTag confidence={confidence} evidence={evidence} size="small" />
        ) : '-';
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => exportStep(record.id)}
            disabled={record.status !== 'ready'}
          >
            导出
          </Button>
        </Space>
      )
    }
  ];

  const exportedPackColumns = [
    {
      title: '包ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <Text code>{id.slice(-6)}</Text>
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '上次评分',
      dataIndex: 'last_score',
      key: 'last_score',
      width: 120,
      render: (score: any) => score ? (
        <ConfidenceTag confidence={score.confidence} size="small" />
      ) : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: StepPack) => (
        <Button 
          size="small" 
          icon={<UploadOutlined />}
          onClick={() => importStep(record)}
        >
          导入
        </Button>
      )
    }
  ];

  const allCards = getAllCards();
  const allScores = getAllScores();

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>🎯 完整置信度系统演示</Title>
      
      <Alert
        message="系统功能演示"
        description={
          <div>
            <Paragraph style={{ marginBottom: '8px' }}>
              ✅ <Text strong>后端共用引擎</Text>：统一评分逻辑，八维度证据分析<br/>
              ✅ <Text strong>前端事件桥接</Text>：实时置信度显示，自动缓存写入<br/>
              ✅ <Text strong>共享缓存系统</Text>：单步和链式统一存储<br/>
              ✅ <Text strong>UI集成展示</Text>：颜色编码，详细证据提示<br/>
              ✅ <Text strong>脚本导出导入</Text>：本地重评，离线分享
            </Paragraph>
          </div>
        }
        type="success"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[16, 16]}>
        {/* 测试触发区 */}
        <Col span={24}>
          <Card title="🚀 智能分析测试" extra={
            <Space>
              <Button danger onClick={clearAllData}>
                清理数据
              </Button>
            </Space>
          }>
            <Row gutter={[8, 8]}>
              {testElements.map(element => (
                <Col span={8} key={element.uid}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>{element.text || element.uid}</Text>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {element.resourceId}
                      </Text>
                    </div>
                    <UnifiedCompactStrategyMenu
                      elementData={element}
                      disabled={loading}
                    />
                    <Divider style={{ margin: '8px 0' }} />
                    <Button 
                      type="primary"
                      size="small"
                      loading={loading}
                      onClick={() => triggerAnalysis(element)}
                      icon={<SyncOutlined />}
                      block
                    >
                      触发分析
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 实时状态监控 */}
        <Col span={12}>
          <Card title="📊 步骤卡片状态" extra={
            <Text type="secondary">共 {allCards.length} 个卡片</Text>
          }>
            <Table
              columns={cardColumns}
              dataSource={allCards}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无卡片数据' }}
            />
          </Card>
        </Col>

        {/* 共享缓存状态 */}
        <Col span={12}>
          <Card title="🗄️ 共享缓存状态" extra={
            <Text type="secondary">共 {allScores.length} 条评分</Text>
          }>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {allScores.length === 0 ? (
                <Text type="secondary">暂无缓存数据</Text>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {allScores.map(score => (
                    <div key={score.key} style={{ 
                      padding: '8px', 
                      border: '1px solid #f0f0f0', 
                      borderRadius: '4px' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text code>{score.key.slice(-8)}</Text>
                        <ConfidenceTag confidence={score.confidence} evidence={score.evidence} size="small" />
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {score.recommended} • {score.origin} • {new Date(score.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </div>
          </Card>
        </Col>

        {/* 导出的步骤包 */}
        <Col span={24}>
          <Card title="📦 导出的步骤包" extra={
            <Text type="secondary">共 {exportedPacks.length} 个包</Text>
          }>
            <Table
              columns={exportedPackColumns}
              dataSource={exportedPacks}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无导出包' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CompleteConfidenceDemo;