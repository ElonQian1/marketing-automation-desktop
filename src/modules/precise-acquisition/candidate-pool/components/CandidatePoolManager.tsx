// src/modules/precise-acquisition/candidate-pool/components/CandidatePoolManager.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 候选池管理主界面组件
 * 
 * 集成候选池的查看、添加、编辑、删除、导入导出等功能
 */

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  message,
  Upload,
  Dropdown,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';

import { useCandidatePool } from '../hooks/useCandidatePool';
import { 
  WatchTarget, 
  Platform, 
  TargetType, 
  SourceType,
  IndustryTag,
  RegionTag
} from '../../shared/types/core';
import {
  PLATFORM_LABELS,
  TARGET_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  INDUSTRY_TAG_CONFIG,
  REGION_TAG_CONFIG
} from '../../shared/constants';
import { formatDateTime } from '../../shared/utils';

const { Search } = Input;
const { Option } = Select;

export interface CandidatePoolManagerProps {
  className?: string;
}

export const CandidatePoolManager: React.FC<CandidatePoolManagerProps> = ({
  className
}) => {
  const {
    targets,
    stats,
    loading,
    pagination,
    filters,
    refreshTargets,
    addTarget,
    updateTarget,
    deleteTarget,
    batchDeleteTargets,
    validateCsvData,
    importFromCsv,
    exportToCsv,
    searchTargets,
    setFilters,
    clearFilters,
    changePage
  } = useCandidatePool();

  // 本地状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<WatchTarget | null>(null);
  const [importFile, setImportFile] = useState<UploadFile | null>(null);

  // 表格列定义
  const columns: ColumnsType<WatchTarget> = [
    {
      title: '类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 80,
      render: (type: TargetType) => (
        <Tag color={type === TargetType.VIDEO ? 'blue' : 'green'}>
          {TARGET_TYPE_LABELS[type]}
        </Tag>
      ),
      filters: Object.values(TargetType).map(type => ({
        text: TARGET_TYPE_LABELS[type],
        value: type
      })),
      filteredValue: filters.target_type ? [filters.target_type] : null
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: Platform) => (
        <Tag color={platform === Platform.DOUYIN ? 'red' : platform === Platform.OCEANENGINE ? 'orange' : 'gray'}>
          {PLATFORM_LABELS[platform]}
        </Tag>
      ),
      filters: Object.values(Platform).map(platform => ({
        text: PLATFORM_LABELS[platform],
        value: platform
      })),
      filteredValue: filters.platform ? [filters.platform] : null
    },
    {
      title: '标题/昵称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string | undefined, record: WatchTarget) => (
        <Tooltip title={record.platform_id_or_url}>
          <span>{title || '未填写'}</span>
        </Tooltip>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: SourceType) => (
        <Tag>{SOURCE_TYPE_LABELS[source]}</Tag>
      ),
      filters: Object.values(SourceType).map(source => ({
        text: SOURCE_TYPE_LABELS[source],
        value: source
      })),
      filteredValue: filters.source ? [filters.source] : null
    },
    {
      title: '行业标签',
      dataIndex: 'industry_tags',
      key: 'industry_tags',
      width: 150,
      render: (tags: IndustryTag[] | undefined) => (
        <Space size={[0, 4]} wrap>
          {tags?.map(tag => (
            <Tag 
              key={tag} 
              color={INDUSTRY_TAG_CONFIG[tag]?.color}
              style={{ fontSize: '12px' }}
            >
              {INDUSTRY_TAG_CONFIG[tag]?.label || tag}
            </Tag>
          )) || <span style={{ color: '#999' }}>未设置</span>}
        </Space>
      )
    },
    {
      title: '地区',
      dataIndex: 'region_tag',
      key: 'region_tag',
      width: 80,
      render: (region: RegionTag | undefined) => 
        region ? (
          <Tag color="purple">{REGION_TAG_CONFIG[region]?.label || region}</Tag>
        ) : (
          <span style={{ color: '#999' }}>未设置</span>
        )
    },
    {
      title: '最后拉取',
      dataIndex: 'last_fetch_at',
      key: 'last_fetch_at',
      width: 120,
      render: (date: Date | undefined) => 
        date ? formatDateTime(date) : <span style={{ color: '#999' }}>从未拉取</span>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: Date) => formatDateTime(date)
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: WatchTarget) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除这个目标吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 处理编辑
  const handleEdit = (target: WatchTarget) => {
    setCurrentTarget(target);
    setEditModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    await deleteTarget(id);
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的目标');
      return;
    }
    
    Modal.confirm({
      title: '确定批量删除吗？',
      content: `将删除 ${selectedRowKeys.length} 个目标，此操作不可恢复。`,
      onOk: async () => {
        await batchDeleteTargets(selectedRowKeys as string[]);
        setSelectedRowKeys([]);
      }
    });
  };

  // 处理CSV导入
  const handleImportCsv = async () => {
    if (!importFile) {
      message.error('请先选择文件');
      return;
    }

    try {
      // 读取CSV文件内容
      const text = await importFile.originFileObj?.text();
      if (!text) {
        message.error('文件读取失败');
        return;
      }

      // 解析CSV（简单实现，生产环境建议使用专业CSV解析库）
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // 验证数据
      const validation = validateCsvData(data);
      
      if (validation.invalid_rows.length > 0) {
        message.error(`发现 ${validation.invalid_rows.length} 行无效数据，请检查后重新上传`);
        return;
      }

      // 执行导入
      await importFromCsv(validation.valid_rows);
      setImportModalVisible(false);
      setImportFile(null);
      
    } catch (err) {
      console.error('Import error:', err);
      message.error('导入失败');
    }
  };

  // 处理表格筛选变化
  const handleTableChange = (paginationParams: any, filtersParams: any) => {
    // 更新筛选条件
    const newFilters: any = {};
    
    if (filtersParams.target_type?.length > 0) {
      newFilters.target_type = filtersParams.target_type[0];
    }
    if (filtersParams.platform?.length > 0) {
      newFilters.platform = filtersParams.platform[0];
    }
    if (filtersParams.source?.length > 0) {
      newFilters.source = filtersParams.source[0];
    }
    
    setFilters(newFilters);
    
    // 更新分页
    if (paginationParams.current !== pagination.current || 
        paginationParams.pageSize !== pagination.pageSize) {
      changePage(paginationParams.current, paginationParams.pageSize);
    }
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: WatchTarget) => ({
      disabled: false,
      name: record.id,
    }),
  };

  return (
    <div className={className}>
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总目标数" value={stats.total_count} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="最近7天新增" value={stats.recent_added} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="抖音目标" 
                value={stats.by_platform[Platform.DOUYIN] || 0} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="视频目标" 
                value={stats.by_type[TargetType.VIDEO] || 0} 
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 主要内容卡片 */}
      <Card
        title="候选池管理"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshTargets}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setEditModalVisible(true)}
            >
              添加目标
            </Button>
          </Space>
        }
      >
        {/* 工具栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索标题、URL..."
              allowClear
              onSearch={searchTargets}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={16}>
            <Space style={{ float: 'right' }}>
              <Button 
                icon={<ImportOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                CSV导入
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={() => exportToCsv(filters)}
              >
                导出CSV
              </Button>
              <Button 
                icon={<FilterOutlined />}
                onClick={clearFilters}
                disabled={Object.keys(filters).length === 0}
              >
                清除筛选
              </Button>
              {selectedRowKeys.length > 0 && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={targets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* CSV导入弹窗 */}
      <Modal
        title="CSV导入"
        open={importModalVisible}
        onOk={handleImportCsv}
        onCancel={() => {
          setImportModalVisible(false);
          setImportFile(null);
        }}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <p>请选择CSV文件进行批量导入：</p>
            <Upload
              accept=".csv"
              maxCount={1}
              fileList={importFile ? [importFile] : []}
              beforeUpload={(file) => {
                setImportFile(file as UploadFile);
                return false; // 阻止自动上传
              }}
              onRemove={() => setImportFile(null)}
            >
              <Button icon={<ImportOutlined />}>选择CSV文件</Button>
            </Upload>
          </div>
          
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>CSV格式要求：</p>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>必填列：type(类型), platform(平台), id_or_url(ID或URL), source(来源)</li>
              <li>可选列：title(标题), industry_tags(行业标签，用;分隔), region(地区), notes(备注)</li>
              <li>支持的类型：video, account</li>
              <li>支持的平台：douyin, oceanengine, public</li>
            </ul>
          </div>
        </Space>
      </Modal>

      {/* 编辑/添加弹窗 */}
      <Modal
        title={currentTarget ? '编辑目标' : '添加目标'}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentTarget(null);
        }}
        footer={null}
        width={600}
      >
        {/* TODO: 实现编辑表单组件 */}
        <p>编辑表单组件待实现...</p>
      </Modal>
    </div>
  );
};