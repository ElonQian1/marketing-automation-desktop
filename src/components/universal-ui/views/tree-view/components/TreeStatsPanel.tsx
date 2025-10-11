// src/components/universal-ui/views/tree-view/components/TreeStatsPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * UIElementTree 统计面板组件
 * 显示树形结构的详细统计信息
 */

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Divider, Tag, Space } from 'antd';
import { 
  NodeIndexOutlined,
  EyeOutlined,
  FilterOutlined,
  SelectOutlined,
  BranchesOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

interface TreeStatsData {
  totalElements: number;
  rootElements: number;
  maxDepth: number;
  avgDepth: number;
  depthDistribution: Record<number, number>;
}

interface FilterStatsData {
  total: number;
  filtered: number;
  hidden: number;
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  typeDistribution: Array<{
    type: string;
    count: number;
  }>;
}

interface TreeStatsPanelProps {
  treeStats: TreeStatsData;
  filterStats: FilterStatsData;
  selectedCount: number;
  className?: string;
}

export const TreeStatsPanel: React.FC<TreeStatsPanelProps> = ({
  treeStats,
  filterStats,
  selectedCount,
  className = '',
}) => {
  const visibilityPercentage = filterStats.total > 0 
    ? Math.round((filterStats.filtered / filterStats.total) * 100) 
    : 0;

  const qualityTotal = filterStats.qualityDistribution.high + 
                      filterStats.qualityDistribution.medium + 
                      filterStats.qualityDistribution.low;

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <InfoCircleOutlined />
          <span>树形统计</span>
        </div>
      }
      size="small"
      className={className}
    >
      {/* 基础统计 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Statistic
            title="总元素"
            value={treeStats.totalElements}
            prefix={<NodeIndexOutlined />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="根元素"
            value={treeStats.rootElements}
            prefix={<BranchesOutlined />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="最大深度"
            value={treeStats.maxDepth}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均深度"
            value={treeStats.avgDepth}
            precision={1}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
      </Row>

      <Divider />

      {/* 可见性统计 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <EyeOutlined />
          <span className="font-medium">可见性统计</span>
        </div>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="可见元素"
              value={filterStats.filtered}
              suffix={`/ ${filterStats.total}`}
              valueStyle={{ fontSize: '14px', color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="已隐藏"
              value={filterStats.hidden}
              valueStyle={{ fontSize: '14px', color: '#ff4d4f' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="已选择"
              value={selectedCount}
              prefix={<SelectOutlined />}
              valueStyle={{ fontSize: '14px', color: '#1890ff' }}
            />
          </Col>
        </Row>
        <div className="mt-2">
          <Progress
            percent={visibilityPercentage}
            strokeColor="#52c41a"
            trailColor="#f5f5f5"
            size="small"
          />
          <div className="text-xs text-gray-500 mt-1">
            显示比例: {visibilityPercentage}%
          </div>
        </div>
      </div>

      <Divider />

      {/* 质量分布 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FilterOutlined />
          <span className="font-medium">质量分布</span>
        </div>
        <Row gutter={8}>
          <Col span={8}>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {filterStats.qualityDistribution.high}
              </div>
              <div className="text-xs text-gray-500">高质量</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">
                {filterStats.qualityDistribution.medium}
              </div>
              <div className="text-xs text-gray-500">中等</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">
                {filterStats.qualityDistribution.low}
              </div>
              <div className="text-xs text-gray-500">低质量</div>
            </div>
          </Col>
        </Row>
        {qualityTotal > 0 && (
          <div className="mt-2">
            <Progress
              percent={100}
              strokeColor={{
                '0%': '#ff4d4f',
                [`${(filterStats.qualityDistribution.low / qualityTotal) * 100}%`]: '#ff4d4f',
                [`${((filterStats.qualityDistribution.low + filterStats.qualityDistribution.medium) / qualityTotal) * 100}%`]: '#faad14',
                '100%': '#52c41a',
              }}
              size="small"
              showInfo={false}
            />
          </div>
        )}
      </div>

      <Divider />

      {/* 层级分布 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <BranchesOutlined />
          <span className="font-medium">层级分布</span>
        </div>
        <div className="space-y-1">
          {Object.entries(treeStats.depthDistribution)
            .sort(([a], [b]) => Number(a) - Number(b))
            .slice(0, 8) // 只显示前8层
            .map(([depth, count]) => (
              <div key={depth} className="flex items-center justify-between text-sm">
                <span>第 {depth} 层:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="bg-blue-500 h-2 rounded"
                    style={{ 
                      width: `${Math.max(4, (count / treeStats.totalElements) * 60)}px` 
                    }}
                  />
                  <span className="text-gray-600 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Divider />

      {/* 元素类型分布 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <NodeIndexOutlined />
          <span className="font-medium">主要元素类型</span>
        </div>
        <Space size={[4, 4]} wrap>
          {filterStats.typeDistribution.slice(0, 6).map(({ type, count }) => (
            <Tag key={type} className="text-xs">
              {type.split('.').pop()}: {count}
            </Tag>
          ))}
        </Space>
      </div>
    </Card>
  );
};