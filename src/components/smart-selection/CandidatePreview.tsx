// src/components/smart-selection/CandidatePreview.tsx
// module: smart-selection | layer: ui | role: 候选元素预览组件
// summary: 显示候选元素列表，支持高亮和过滤状态

import React from 'react';
import { Table, Tag, Space, Typography, Tooltip, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, FilterOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * 候选元素数据
 */
export interface CandidateElement {
  id: string;
  text?: string;
  contentDesc?: string;
  resourceId?: string;
  className?: string;
  bounds?: { x: number; y: number; width: number; height: number };
  status: 'included' | 'excluded-auto' | 'excluded-manual' | 'deduped';
  matchedRules?: string[];  // 命中的规则列表
}

/**
 * 预览组件属性
 */
export interface CandidatePreviewProps {
  /** 候选元素列表 */
  candidates: CandidateElement[];
  /** 是否显示仅被排除的 */
  showExcludedOnly?: boolean;
  /** 高亮规则ID */
  highlightRuleId?: string;
  /** 点击元素回调 */
  onElementClick?: (element: CandidateElement) => void;
}

/**
 * 状态颜色映射
 */
const STATUS_CONFIG = {
  'included': {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: '✅ 保留',
    bgColor: '#f6ffed',
  },
  'excluded-auto': {
    color: 'processing',
    icon: <FilterOutlined />,
    label: '🤖 自动排除',
    bgColor: '#e6f7ff',
  },
  'excluded-manual': {
    color: 'error',
    icon: <CloseCircleOutlined />,
    label: '🚫 手动排除',
    bgColor: '#fff1f0',
  },
  'deduped': {
    color: 'warning',
    icon: <FilterOutlined />,
    label: '🔄 已去重',
    bgColor: '#fffbe6',
  },
};

/**
 * 候选元素预览组件
 */
export const CandidatePreview: React.FC<CandidatePreviewProps> = ({
  candidates,
  showExcludedOnly = false,
  highlightRuleId,
  onElementClick,
}) => {
  // 过滤数据
  const filteredCandidates = showExcludedOnly
    ? candidates.filter(c => c.status !== 'included')
    : candidates;

  // 统计数据
  const stats = {
    total: candidates.length,
    included: candidates.filter(c => c.status === 'included').length,
    excludedAuto: candidates.filter(c => c.status === 'excluded-auto').length,
    excludedManual: candidates.filter(c => c.status === 'excluded-manual').length,
    deduped: candidates.filter(c => c.status === 'deduped').length,
  };

  // 表格列定义
  const columns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: CandidateElement['status']) => {
        const config = STATUS_CONFIG[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '文本',
      dataIndex: 'text',
      key: 'text',
      width: 200,
      render: (text?: string, record: CandidateElement) => (
        <Tooltip title={text || record.contentDesc || '(无文本)'}>
          <Text ellipsis style={{ maxWidth: 180 }}>
            {text || record.contentDesc || <Text type="secondary">(无文本)</Text>}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '资源ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      width: 180,
      render: (id?: string) => (
        <Text code style={{ fontSize: '11px' }}>
          {id || <Text type="secondary">-</Text>}
        </Text>
      ),
    },
    {
      title: '位置',
      dataIndex: 'bounds',
      key: 'bounds',
      width: 100,
      render: (bounds?: CandidateElement['bounds']) => (
        bounds ? (
          <Tooltip title={`宽:${bounds.width} 高:${bounds.height}`}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              ({bounds.x}, {bounds.y})
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: '命中规则',
      dataIndex: 'matchedRules',
      key: 'matchedRules',
      render: (rules?: string[], record: CandidateElement) => (
        rules && rules.length > 0 ? (
          <Space size={4} wrap>
            {rules.map((rule, idx) => (
              <Tag 
                key={idx} 
                color={record.status.includes('auto') ? 'blue' : 'red'}
                style={{ fontSize: '10px', margin: 0 }}
              >
                {rule}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* 统计卡片 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space size={16} wrap>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>总候选数</Text>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
              {stats.total}
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>✅ 保留</Text>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
              {stats.included}
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>🤖 自动排除</Text>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
              {stats.excludedAuto}
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>🚫 手动排除</Text>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
              {stats.excludedManual}
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>🔄 去重</Text>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
              {stats.deduped}
            </div>
          </div>
        </Space>
      </Card>

      {/* 流水线可视化 */}
      <div style={{
        padding: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 6,
        marginBottom: 12,
        color: '#fff',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 8 }}>
          ⚡ 流水线处理
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', flexWrap: 'wrap' }}>
          <Tag color="default" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>
            📋 候选 {stats.total}
          </Tag>
          <span>→</span>
          <Tag color="processing" style={{ background: 'rgba(24,144,255,0.3)', border: 'none', color: '#fff' }}>
            🤖 自动排除 -{stats.excludedAuto}
          </Tag>
          <span>→</span>
          <Tag color="error" style={{ background: 'rgba(255,77,79,0.3)', border: 'none', color: '#fff' }}>
            🚫 手动排除 -{stats.excludedManual}
          </Tag>
          <span>→</span>
          <Tag color="warning" style={{ background: 'rgba(250,173,20,0.3)', border: 'none', color: '#fff' }}>
            🔄 去重 -{stats.deduped}
          </Tag>
          <span>→</span>
          <Tag color="success" style={{ background: 'rgba(82,196,26,0.3)', border: 'none', color: '#fff' }}>
            ✅ 结果 {stats.included}
          </Tag>
        </div>
      </div>

      {/* 元素列表 */}
      <Table
        dataSource={filteredCandidates}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个元素`,
        }}
        rowClassName={(record) => {
          const config = STATUS_CONFIG[record.status];
          return 'candidate-row';
        }}
        onRow={(record) => ({
          onClick: () => onElementClick?.(record),
          style: {
            background: STATUS_CONFIG[record.status].bgColor,
            cursor: onElementClick ? 'pointer' : 'default',
          },
        })}
        scroll={{ x: 800 }}
      />

      <style>{`
        .candidate-row:hover {
          background: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
};
