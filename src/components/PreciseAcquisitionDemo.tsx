// src/components/PreciseAcquisitionDemo.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 精准获客系统演示组件
 * 
 * 展示统一服务的核心功能和数据流
 */

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Space, 
  Table, 
  Tag, 
  Spin,
  message,
  Divider
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { usePreciseAcquisition } from '../hooks/usePreciseAcquisition';


const { Title, Text } = Typography;

/**
 * 精准获客演示面板
 */
export const PreciseAcquisitionDemo: React.FC = () => {
  const {
    // 数据状态
    watchTargets,
    comments,
    tasks,
    stats,
    
    // 加载状态
    loading,
    
    // 方法
    generateDailyReport,
    refreshAll,
    
    // 错误状态
    error
  } = usePreciseAcquisition();

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // 初始化数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshAll();
      } catch (err) {
        console.error('初始化数据失败:', err);
      }
    };
    
    loadInitialData();
  }, [refreshAll]);

  // 生成并下载日报
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateDailyReport();
      
      // 创建下载链接
      const reportContent = JSON.stringify(report, null, 2);
      const blob = new Blob([reportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `精准获客日报_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('日报生成并下载成功');
    } catch (err) {
      console.error('生成日报失败:', err);
      message.error('生成日报失败');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 候选池表格列定义
  const watchTargetColumns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="blue">{platform}</Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'target_type',
      key: 'target_type',
      render: (type: string) => (
        <Tag color="green">{type}</Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source'
    },
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
      render: (region: string) => region && <Tag>{region}</Tag>
    }
  ];

  // 任务表格列定义
  const taskColumns = [
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type: string) => (
        <Tag color="purple">{type}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          'new': 'default',
          'ready': 'blue',
          'executing': 'orange',
          'completed': 'green',
          'failed': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    }
  ];

  // 评论表格列定义
  const commentColumns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="cyan">{platform}</Tag>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 300
    },
    {
      title: '点赞数',
      dataIndex: 'like_count',
      key: 'like_count'
    },
    {
      title: '发布时间',
      dataIndex: 'publish_time',
      key: 'publish_time',
      render: (date: string) => new Date(date).toLocaleString()
    }
  ];

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="danger">加载数据失败: {error}</Text>
          <br />
          <Button type="primary" onClick={refreshAll} style={{ marginTop: '16px' }}>
            重新加载
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和控制按钮 */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="mb-2">精准获客系统演示</Title>
            <Text type="secondary">
              展示统一服务整合后的精准获客系统功能，包括候选池管理、评论收集、任务执行等完整流程。
            </Text>
          </div>
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={refreshAll}
              loading={loading.watchTargets || loading.comments || loading.tasks}
            >
              刷新数据
            </Button>
            <Button 
              type="primary"
              icon={<FileTextOutlined />} 
              onClick={handleGenerateReport}
              loading={isGeneratingReport}
            >
              生成日报
            </Button>
          </Space>
        </div>
      </Card>

      {/* 统计概览 */}
      <Card title="系统统计概览">
        {loading.stats ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="候选池目标"
                value={stats?.watch_targets_count || 0}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="收集评论"
                value={stats?.comments_count || 0}
                prefix={<MessageOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总任务数"
                value={stats?.tasks_count?.total || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="完成任务"
                value={stats?.tasks_count?.done || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        )}
      </Card>
      
      {/* 候选池数据 */}
      <Card title={`候选池目标 (${watchTargets.length})`}>
        <Table
          dataSource={watchTargets.slice(0, 10)} // 只显示前10条
          columns={watchTargetColumns}
          rowKey="id"
          loading={loading.watchTargets}
          pagination={false}
          size="small"
        />
        {watchTargets.length > 10 && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary">
              显示前10条，共 {watchTargets.length} 条记录
            </Text>
          </div>
        )}
      </Card>

      {/* 任务列表 */}
      <Card title={`任务列表 (${tasks.length})`}>
        <Table
          dataSource={tasks.slice(0, 10)} // 只显示前10条
          columns={taskColumns}
          rowKey="id"
          loading={loading.tasks}
          pagination={false}
          size="small"
        />
        {tasks.length > 10 && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary">
              显示前10条，共 {tasks.length} 条记录
            </Text>
          </div>
        )}
      </Card>

      {/* 评论数据 */}
      <Card title={`评论数据 (${comments.length})`}>
        <Table
          dataSource={comments.slice(0, 10)} // 只显示前10条
          columns={commentColumns}
          rowKey="id"
          loading={loading.comments}
          pagination={false}
          size="small"
        />
        {comments.length > 10 && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary">
              显示前10条，共 {comments.length} 条记录
            </Text>
          </div>
        )}
      </Card>

      {/* 服务信息 */}
      <Card title="服务架构信息">
        <div className="space-y-4">
          <div>
            <Title level={5}>整合的服务模块：</Title>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text strong>核心功能:</Text>
                <ul className="mt-2 ml-4">
                  <li>• 候选池管理 (CSV导入/导出、去重、合规检查)</li>
                  <li>• 评论收集和智能筛选</li>
                  <li>• 任务自动生成和执行</li>
                  <li>• 频率控制和风控策略</li>
                </ul>
              </div>
              <div>
                <Text strong>支持功能:</Text>
                <ul className="mt-2 ml-4">
                  <li>• 全链路审计日志</li>
                  <li>• 统计报告和日报生成</li>
                  <li>• 回复模板管理</li>
                  <li>• 实时数据监控</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Divider />
          
          <div>
            <Text strong>架构特点:</Text>
            <ul className="mt-2 ml-4">
              <li>• 统一服务门面模式，整合所有现有功能</li>
              <li>• React Hook 统一数据访问接口</li>
              <li>• DDD 架构原则，清晰的分层设计</li>
              <li>• 类型安全的 TypeScript 实现</li>
              <li>• 单例模式确保服务一致性</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PreciseAcquisitionDemo;