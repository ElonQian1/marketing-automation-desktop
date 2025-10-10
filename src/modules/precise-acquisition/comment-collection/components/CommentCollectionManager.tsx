/**
 * 评论采集管理界面
 * 
 * 提供评论采集的监控、配置和执行功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Progress,
  Alert,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  List,
  Typography,
  Badge,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { 
  EnhancedCommentAdapterManager,
  createEnhancedCommentAdapterManager,
  BatchCollectionConfig, 
  BatchCollectionResult,
  CollectionStats
} from '../../../../application/services/comment-collection/EnhancedCommentAdapterManager';
import { UnifiedAdapterStatus as AdapterStatus } from '../../../../application/services/comment-collection/UnifiedCommentAdapter';
import { WatchTarget, Platform, Comment } from '../../shared/types/core';
import { PLATFORM_LABELS } from '../../shared/constants';
import { formatDateTime } from '../../shared/utils';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { Option } = Select;

export interface CommentCollectionManagerProps {
  className?: string;
  targets?: WatchTarget[];
  onTargetsChange?: (targets: WatchTarget[]) => void;
}

export const CommentCollectionManager: React.FC<CommentCollectionManagerProps> = ({
  className,
  targets = [],
  onTargetsChange
}) => {
  const [service] = useState(() => createEnhancedCommentAdapterManager({
    default_strategy: 'auto',
    fallback_enabled: true
  }));
  
  // 状态管理
  const [adaptersStatus, setAdaptersStatus] = useState<Record<Platform, AdapterStatus>>({} as Record<Platform, AdapterStatus>);
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentTarget?: string;
  } | null>(null);

  // 配置状态
  const [batchConfig, setBatchConfig] = useState<BatchCollectionConfig>({
    targets: [],
    max_comments_per_target: 50,
    collection_interval_ms: 2000,
    respect_rate_limits: true,
    skip_failed_targets: true
  });

  // UI状态
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  // 初始化数据
  useEffect(() => {
    loadAdaptersStatus();
    loadCollectionStats();
    loadRecentComments();
  }, []);

  // 加载适配器状态
  const loadAdaptersStatus = async () => {
    try {
      const status = await service.getAllAdapterStatus();
      setAdaptersStatus(status);
    } catch (error) {
      console.error('Failed to load adapters status:', error);
    }
  };

  // 加载统计数据
  const loadCollectionStats = async () => {
    try {
      const stats = await service.getCollectionStats();
      setCollectionStats(stats);
    } catch (error) {
      console.error('Failed to load collection stats:', error);
    }
  };

  // 加载最近评论
  const loadRecentComments = async () => {
    try {
      const result = await service.getComments({ limit: 20 });
      setComments(result.comments);
    } catch (error) {
      console.error('Failed to load recent comments:', error);
    }
  };

  // 执行批量采集
  const handleBatchCollection = async () => {
    if (selectedTargets.length === 0) {
      Modal.warning({
        title: '请选择目标',
        content: '请至少选择一个目标进行采集'
      });
      return;
    }

    const selectedTargetObjects = targets.filter(t => selectedTargets.includes(t.id));
    
    setCollecting(true);
    setBatchProgress({ current: 0, total: selectedTargetObjects.length });

    try {
      const config: BatchCollectionConfig = {
        ...batchConfig,
        targets: selectedTargetObjects
      };

      const result = await service.batchCollectComments(config);
      
      // 处理结果
      Modal.success({
        title: '批量采集完成',
        content: (
          <div>
            <p>总目标数: {result.total_targets}</p>
            <p>成功: {result.successful_targets}</p>
            <p>失败: {result.failed_targets}</p>
            <p>采集评论数: {result.total_comments_collected}</p>
            <p>耗时: {Math.round(result.elapsed_time_ms / 1000)}秒</p>
          </div>
        )
      });

      // 刷新数据
      await loadCollectionStats();
      await loadRecentComments();

    } catch (error) {
      Modal.error({
        title: '批量采集失败',
        content: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setCollecting(false);
      setBatchProgress(null);
    }
  };

  // 单个目标采集
  const handleSingleCollection = async (target: WatchTarget) => {
    setLoading(true);
    
    try {
      const result = await service.collectComments({
        target,
        limit: batchConfig.max_comments_per_target
      });

      Modal.success({
        title: '采集完成',
        content: `成功采集 ${result.comments.length} 条评论`
      });

      await loadRecentComments();
    } catch (error) {
      Modal.error({
        title: '采集失败',
        content: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  };

  // 目标表格列定义
  const targetColumns: ColumnsType<WatchTarget> = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (platform: Platform) => (
        <Tag color={platform === Platform.DOUYIN ? 'red' : platform === Platform.OCEANENGINE ? 'orange' : 'gray'}>
          {PLATFORM_LABELS[platform]}
        </Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string | undefined) => title || '未填写'
    },
    {
      title: '最后采集',
      dataIndex: 'last_fetch_at',
      key: 'last_fetch_at',
      width: 150,
      render: (date: Date | undefined) => 
        date ? formatDateTime(date) : <Text type="secondary">从未采集</Text>
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: WatchTarget) => (
        <Space>
          <Tooltip title="立即采集">
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleSingleCollection(record)}
              loading={loading}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 评论表格列定义
  const commentColumns: ColumnsType<Comment> = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (platform: Platform) => (
        <Tag color={platform === Platform.DOUYIN ? 'red' : platform === Platform.OCEANENGINE ? 'orange' : 'gray'}>
          {PLATFORM_LABELS[platform]}
        </Tag>
      )
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => (
        <Tooltip title={content}>
          <Text>{content}</Text>
        </Tooltip>
      )
    },
    {
      title: '点赞数',
      dataIndex: 'like_count',
      key: 'like_count',
      width: 80,
      render: (count: number) => count || 0
    },
    {
      title: '发布时间',
      dataIndex: 'publish_time',
      key: 'publish_time',
      width: 150,
      render: (date: Date) => formatDateTime(date)
    },
    {
      title: '采集时间',
      dataIndex: 'inserted_at',
      key: 'inserted_at',
      width: 150,
      render: (date: Date) => formatDateTime(date)
    }
  ];

  return (
    <div className={className}>
      {/* 适配器状态卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {Object.values(adaptersStatus).map(status => (
          <Col span={8} key={status.platform}>
            <Card size="small">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text strong>{PLATFORM_LABELS[status.platform]}</Text>
                  <div>
                    <Badge 
                      status={status.available ? 'success' : 'error'} 
                      text={status.available ? '可用' : '不可用'} 
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {status.rate_limit_remaining !== undefined && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        剩余: {status.rate_limit_remaining}
                      </Text>
                    </div>
                  )}
                  <div>
                    <Tag color={status.auth_status === 'authenticated' ? 'green' : 'red'}>
                      {status.auth_status}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 统计数据 */}
      {collectionStats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="今日采集" 
                value={collectionStats.comments_collected_today} 
                suffix="条" 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="本周采集" 
                value={collectionStats.comments_collected_this_week} 
                suffix="条" 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="总采集次数" 
                value={collectionStats.total_collections} 
                suffix="次" 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Button 
                type="link" 
                icon={<BarChartOutlined />}
                onClick={() => setStatsModalVisible(true)}
              >
                详细统计
              </Button>
            </Card>
          </Col>
        </Row>
      )}

      {/* 主要内容 */}
      <Row gutter={16}>
        {/* 目标管理 */}
        <Col span={12}>
          <Card
            title="候选目标"
            size="small"
            extra={
              <Space>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setConfigModalVisible(true)}
                >
                  配置
                </Button>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleBatchCollection}
                  loading={collecting}
                  disabled={selectedTargets.length === 0}
                >
                  批量采集 ({selectedTargets.length})
                </Button>
              </Space>
            }
          >
            {/* 进度条 */}
            {batchProgress && (
              <div style={{ marginBottom: 16 }}>
                <Progress
                  percent={Math.round((batchProgress.current / batchProgress.total) * 100)}
                  status="active"
                  format={(percent) => `${batchProgress!.current}/${batchProgress!.total}`}
                />
                {batchProgress.currentTarget && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    正在处理: {batchProgress.currentTarget}
                  </Text>
                )}
              </div>
            )}

            <Table
              rowSelection={{
                selectedRowKeys: selectedTargets,
                onChange: (keys) => setSelectedTargets(keys as string[])
              }}
              columns={targetColumns}
              dataSource={targets}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: false
              }}
            />
          </Card>
        </Col>

        {/* 最近评论 */}
        <Col span={12}>
          <Card
            title="最近采集"
            size="small"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={loadRecentComments}
              >
                刷新
              </Button>
            }
          >
            <Table
              columns={commentColumns}
              dataSource={comments}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: false
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 配置弹窗 */}
      <Modal
        title="批量采集配置"
        open={configModalVisible}
        onOk={() => setConfigModalVisible(false)}
        onCancel={() => setConfigModalVisible(false)}
        width={600}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>采集参数</Text>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <div>
                  <Text>每个目标最大评论数</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    value={batchConfig.max_comments_per_target}
                    onChange={(value) => setBatchConfig(prev => ({
                      ...prev,
                      max_comments_per_target: value || 50
                    }))}
                    min={1}
                    max={1000}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text>采集间隔 (毫秒)</Text>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    value={batchConfig.collection_interval_ms}
                    onChange={(value) => setBatchConfig(prev => ({
                      ...prev,
                      collection_interval_ms: value || 2000
                    }))}
                    min={0}
                  />
                </div>
              </Col>
            </Row>
          </div>

          <div>
            <Text strong>时间范围</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 8 }}
              value={batchConfig.since && batchConfig.until ? [
                dayjs(batchConfig.since),
                dayjs(batchConfig.until)
              ] : null}
              onChange={(dates) => {
                setBatchConfig(prev => ({
                  ...prev,
                  since: dates?.[0]?.toDate(),
                  until: dates?.[1]?.toDate()
                }));
              }}
            />
          </div>

          <div>
            <Text strong>选项</Text>
            <div style={{ marginTop: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text>遵守频率限制</Text>
                    <Switch
                      checked={batchConfig.respect_rate_limits}
                      onChange={(checked) => setBatchConfig(prev => ({
                        ...prev,
                        respect_rate_limits: checked
                      }))}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text>跳过失败目标</Text>
                    <Switch
                      checked={batchConfig.skip_failed_targets}
                      onChange={(checked) => setBatchConfig(prev => ({
                        ...prev,
                        skip_failed_targets: checked
                      }))}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Space>
      </Modal>

      {/* 统计详情弹窗 */}
      <Modal
        title="采集统计详情"
        open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={null}
        width={800}
      >
        {collectionStats && (
          <div>
            {/* TODO: 实现详细统计图表 */}
            <p>详细统计图表将在此显示...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};