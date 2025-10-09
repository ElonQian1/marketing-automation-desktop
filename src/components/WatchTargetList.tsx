/**
 * 候选池列表组件
 * 
 * 显示和管理候选池目标列表
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Space,
  Button,
  Tag,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Modal,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { preciseAcquisitionService } from '../application/services';
import { Platform, TargetType, SourceType, IndustryTag, RegionTag } from '../constants/precise-acquisition-enums';
import type { WatchTarget } from '../domain/precise-acquisition/entities';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 候选池列表组件
 */
export const WatchTargetList: React.FC = () => {
  const [targets, setTargets] = useState<WatchTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    platform: undefined as Platform | undefined,
    targetType: undefined as TargetType | undefined,
    search: '',
  });

  /**
   * 加载候选池列表
   */
  const loadTargets = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const result = await preciseAcquisitionService.getWatchTargets({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        platform: filters.platform,
        target_type: filters.targetType,
      });

      setTargets(result);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize,
        total: result.length, // TODO: 后端应该返回总数
      }));
    } catch (error) {
      message.error(`加载失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadTargets(pagination.current, pagination.pageSize);
  };

  /**
   * 搜索
   */
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    // TODO: 实现搜索逻辑
    loadTargets(1, pagination.pageSize);
  };

  /**
   * 筛选变化
   */
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    loadTargets(1, pagination.pageSize);
  };

  /**
   * 删除目标
   */
  const handleDelete = async (targetId: string) => {
    try {
      // TODO: 实现删除逻辑
      message.success('删除成功');
      handleRefresh();
    } catch (error) {
      message.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的项目');
      return;
    }

    try {
      // TODO: 实现批量删除逻辑
      message.success(`删除 ${selectedRowKeys.length} 个目标成功`);
      setSelectedRowKeys([]);
      handleRefresh();
    } catch (error) {
      message.error(`批量删除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: Platform) => (
        <Tag color={platform === Platform.XIAOHONGSHU ? 'red' : 'blue'}>
          {platform}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      render: (type: TargetType) => (
        <Tag color={type === TargetType.USER ? 'green' : type === TargetType.CONTENT ? 'orange' : 'purple'}>
          {type}
        </Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string | null, record: WatchTarget) => (
        <Tooltip title={record.idOrUrl}>
          <span>{title || record.idOrUrl}</span>
        </Tooltip>
      ),
    },
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
      width: 100,
      render: (region: RegionTag | null) => 
        region ? <Tag color="cyan">{region}</Tag> : '-',
    },
    {
      title: '行业标签',
      dataIndex: 'industryTags',
      key: 'industryTags',
      width: 150,
      render: (tags: IndustryTag[]) => (
        <Space size="small" wrap>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags.length > 2 && (
            <Tooltip title={tags.slice(2).join(', ')}>
              <Tag size="small">+{tags.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: SourceType | null) => 
        source ? <Tag size="small">{source}</Tag> : '-',
    },
    {
      title: '合规状态',
      key: 'compliance',
      width: 120,
      render: (record: WatchTarget) => {
        const info = record.getComplianceInfo();
        return (
          <Tag color={info.isCompliant ? 'success' : 'error'}>
            {info.isCompliant ? '合规' : '不合规'}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: Date | null) => 
        date ? date.toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (record: WatchTarget) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {/* TODO: 查看详情 */}}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => {/* TODO: 编辑 */}}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个目标吗？"
            onConfirm={() => handleDelete(record.id || '')}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                size="small" 
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: WatchTarget) => ({
      disabled: !record.id,
    }),
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadTargets();
  }, []);

  return (
    <div className="watch-target-list">
      <Card>
        <div className="space-y-4">
          {/* 统计信息 */}
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="总目标数" 
                  value={targets.length} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="合规目标" 
                  value={targets.filter(t => t.getComplianceInfo().isCompliant).length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="用户目标" 
                  value={targets.filter(t => t.targetType === TargetType.USER).length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="内容目标" 
                  value={targets.filter(t => t.targetType === TargetType.CONTENT).length}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 筛选和操作区 */}
          <Card size="small">
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <Space size="middle">
                  <Search
                    placeholder="搜索标题、URL、ID..."
                    allowClear
                    style={{ width: 300 }}
                    onSearch={handleSearch}
                  />
                  <Select
                    placeholder="选择平台"
                    style={{ width: 120 }}
                    allowClear
                    value={filters.platform}
                    onChange={(value) => handleFilterChange('platform', value)}
                  >
                    {Object.values(Platform).map(platform => (
                      <Option key={platform} value={platform}>
                        {platform}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="选择类型"
                    style={{ width: 120 }}
                    allowClear
                    value={filters.targetType}
                    onChange={(value) => handleFilterChange('targetType', value)}
                  >
                    {Object.values(TargetType).map(type => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleRefresh}
                    loading={loading}
                  >
                    刷新
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {/* TODO: 添加目标 */}}
                  >
                    添加目标
                  </Button>
                  {selectedRowKeys.length > 0 && (
                    <Popconfirm
                      title={`确定要删除选中的 ${selectedRowKeys.length} 个目标吗？`}
                      onConfirm={handleBatchDelete}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                      >
                        批量删除 ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 表格 */}
          <Table
            columns={columns}
            dataSource={targets}
            rowKey="dedupKey"
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
              onChange: (page, pageSize) => {
                loadTargets(page, pageSize);
              },
            }}
            size="small"
            scroll={{ x: 1200, y: 600 }}
          />
        </div>
      </Card>
    </div>
  );
};