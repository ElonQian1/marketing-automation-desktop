// src/modules/precise-acquisition/shared/components/EnhancedWatchTargetManager.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 增强的候选池管理组件
 * 
 * 基于WatchTarget实体的完整功能，提供候选池的增删改查界面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Select, 
  Input, 
  Modal, 
  Form, 
  message, 
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Alert,
  Switch,
  Typography,
  Divider,
  Dropdown,
  Menu,
  Upload
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
  FilterOutlined,
  TagOutlined,
  LinkOutlined,
  BulbOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { WatchTarget } from '../../../../domain/precise-acquisition/entities/WatchTarget';
import { Platform, TargetType, SourceType, IndustryTag, RegionTag } from '../../../../constants/precise-acquisition-enums';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 候选池视图模型
 */
interface WatchTargetViewModel {
  id: number | null;
  dedupKey: string;
  targetType: TargetType;
  platform: Platform;
  idOrUrl: string;
  title: string | null;
  source: SourceType | null;
  industryTags: IndustryTag[];
  region: RegionTag | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * 过滤器状态
 */
interface FilterState {
  platform?: Platform;
  targetType?: TargetType;
  source?: SourceType;
  region?: RegionTag;
  industryTag?: IndustryTag;
  keyword?: string;
  onlyRecent?: boolean;
}

interface EnhancedWatchTargetManagerProps {
  onTargetSelect?: (target: WatchTarget) => void;
}

/**
 * 增强的候选池管理组件
 */
export const EnhancedWatchTargetManager: React.FC<EnhancedWatchTargetManagerProps> = ({
  onTargetSelect
}) => {
  const [data, setData] = useState<WatchTargetViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTarget, setEditingTarget] = useState<WatchTargetViewModel | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();

  /**
   * 加载候选池数据
   */
  const loadWatchTargets = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 调用实际的数据加载逻辑
      // const targets = await watchTargetService.list(filters);
      
      // 模拟数据
      const mockData: WatchTargetViewModel[] = [
        {
          id: 1,
          dedupKey: 'douyin_video_123',
          targetType: TargetType.VIDEO,
          platform: Platform.DOUYIN,
          idOrUrl: 'https://www.douyin.com/video/123',
          title: '示例抖音视频',
          source: SourceType.MANUAL,
          industryTags: [IndustryTag.BEAUTY],
          region: RegionTag.EAST_CHINA,
          notes: '手动添加的测试数据',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];
      
      setData(mockData);
    } catch (error) {
      message.error(`加载候选池失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadWatchTargets();
  }, [loadWatchTargets]);

  /**
   * 表格列定义
   */
  const columns: ColumnsType<WatchTargetViewModel> = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: Platform) => (
        <Tag color={platform === Platform.DOUYIN ? 'red' : platform === Platform.XIAOHONGSHU ? 'pink' : 'blue'}>
          {platform}
        </Tag>
      ),
      filters: Object.values(Platform).map(p => ({ text: p, value: p })),
      onFilter: (value, record) => record.platform === value
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      render: (type: TargetType) => (
        <Tag color={type === TargetType.VIDEO ? 'green' : 'orange'}>
          {type === TargetType.VIDEO ? '视频' : '账号'}
        </Tag>
      )
    },
    {
      title: '链接/ID',
      dataIndex: 'idOrUrl',
      key: 'idOrUrl',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <LinkOutlined /> {url.length > 30 ? url.substring(0, 30) + '...' : url}
          </a>
        </Tooltip>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string | null) => title || <Text type="secondary">未设置</Text>
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: SourceType | null) => source ? (
        <Tag color={source === SourceType.MANUAL ? 'blue' : source === SourceType.CSV ? 'green' : 'purple'}>
          {source}
        </Tag>
      ) : '-'
    },
    {
      title: '行业标签',
      dataIndex: 'industryTags',
      key: 'industryTags',
      width: 200,
      render: (tags: IndustryTag[]) => (
        <Space wrap>
          {tags.map(tag => (
            <Tag key={tag} color="processing" icon={<TagOutlined />}>
              {tag}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      width: 100,
      render: (region: RegionTag | null) => region ? (
        <Tag color="cyan">{region}</Tag>
      ) : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: Date | null) => date ? date.toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => editTarget(record)}
            />
          </Tooltip>
          <Tooltip title="选择">
            <Button
              type="text"
              size="small"
              onClick={() => onTargetSelect?.(convertToEntity(record))}
            >
              选择
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定删除这个候选池目标吗？"
            onConfirm={() => deleteTarget(record.dedupKey)}
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

  /**
   * 批量操作菜单
   */
  const bulkActionMenu = (
    <Menu>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
        批量删除
      </Menu.Item>
      <Menu.Item key="export" icon={<ExportOutlined />}>
        导出选中
      </Menu.Item>
      <Menu.Item key="tag" icon={<TagOutlined />}>
        批量标签
      </Menu.Item>
    </Menu>
  );

  /**
   * 渲染过滤器
   */
  const renderFilters = () => (
    <Card size="small" title="筛选条件" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={4}>
          <Select
            placeholder="平台"
            allowClear
            value={filters.platform}
            onChange={(value) => setFilters(prev => ({ ...prev, platform: value }))}
            style={{ width: '100%' }}
          >
            {Object.values(Platform).map(platform => (
              <Option key={platform} value={platform}>{platform}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="类型"
            allowClear
            value={filters.targetType}
            onChange={(value) => setFilters(prev => ({ ...prev, targetType: value }))}
            style={{ width: '100%' }}
          >
            <Option value={TargetType.VIDEO}>视频</Option>
            <Option value={TargetType.ACCOUNT}>账号</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="来源"
            allowClear
            value={filters.source}
            onChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
            style={{ width: '100%' }}
          >
            {Object.values(SourceType).map(source => (
              <Option key={source} value={source}>{source}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="区域"
            allowClear
            value={filters.region}
            onChange={(value) => setFilters(prev => ({ ...prev, region: value }))}
            style={{ width: '100%' }}
          >
            {Object.values(RegionTag).map(region => (
              <Option key={region} value={region}>{region}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Input
            placeholder="关键词搜索"
            allowClear
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
          />
        </Col>
        <Col span={2}>
          <Switch
            checkedChildren="仅最近"
            unCheckedChildren="全部"
            checked={filters.onlyRecent}
            onChange={(checked) => setFilters(prev => ({ ...prev, onlyRecent: checked }))}
          />
        </Col>
      </Row>
    </Card>
  );

  /**
   * 渲染统计信息
   */
  const renderStatistics = () => (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="总候选池" value={data.length} />
        </Col>
        <Col span={6}>
          <Statistic 
            title="视频类型" 
            value={data.filter(d => d.targetType === TargetType.VIDEO).length} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="账号类型" 
            value={data.filter(d => d.targetType === TargetType.ACCOUNT).length} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="已选择" 
            value={selectedRowKeys.length} 
          />
        </Col>
      </Row>
    </Card>
  );

  /**
   * 编辑目标
   */
  const editTarget = (target: WatchTargetViewModel) => {
    setEditingTarget(target);
    form.setFieldsValue({
      targetType: target.targetType,
      platform: target.platform,
      idOrUrl: target.idOrUrl,
      title: target.title,
      source: target.source,
      industryTags: target.industryTags,
      region: target.region,
      notes: target.notes
    });
    setModalVisible(true);
  };

  /**
   * 删除目标
   */
  const deleteTarget = async (dedupKey: string) => {
    try {
      // TODO: 调用删除API
      message.success('删除成功');
      loadWatchTargets();
    } catch (error) {
      message.error(`删除失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 保存目标
   */
  const saveTarget = async (values: any) => {
    try {
      // TODO: 调用保存API
      message.success(editingTarget ? '更新成功' : '创建成功');
      setModalVisible(false);
      setEditingTarget(null);
      form.resetFields();
      loadWatchTargets();
    } catch (error) {
      message.error(`保存失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 转换为实体对象
   */
  const convertToEntity = (vm: WatchTargetViewModel): WatchTarget => {
    return WatchTarget.create({
      targetType: vm.targetType,
      platform: vm.platform,
      idOrUrl: vm.idOrUrl,
      title: vm.title,
      source: vm.source,
      industryTags: vm.industryTags,
      region: vm.region,
      notes: vm.notes
    });
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: 16 }}>
      <Title level={3}>候选池管理</Title>
      
      {renderStatistics()}
      {renderFilters()}
      
      <Card
        title="候选池列表"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTarget(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              添加候选池
            </Button>
            
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              批量导入
            </Button>
            
            <Button
              icon={<ExportOutlined />}
              onClick={() => message.info('导出功能开发中...')}
            >
              导出数据
            </Button>
            
            {selectedRowKeys.length > 0 && (
              <Dropdown overlay={bulkActionMenu}>
                <Button icon={<BulbOutlined />}>
                  批量操作 ({selectedRowKeys.length})
                </Button>
              </Dropdown>
            )}
            
            <Button
              icon={<ReloadOutlined />}
              onClick={loadWatchTargets}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
            type: 'checkbox'
          }}
          columns={columns}
          dataSource={data}
          rowKey="dedupKey"
          loading={loading}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 共 ${total} 条`
          }}
        />
      </Card>

      {/* 编辑/新增模态框 */}
      <Modal
        title={editingTarget ? '编辑候选池' : '新增候选池'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTarget(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveTarget}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
                <Select placeholder="选择平台">
                  {Object.values(Platform).map(platform => (
                    <Option key={platform} value={platform}>{platform}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetType" label="类型" rules={[{ required: true }]}>
                <Select placeholder="选择类型">
                  <Option value={TargetType.VIDEO}>视频</Option>
                  <Option value={TargetType.ACCOUNT}>账号</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="idOrUrl" label="链接/ID" rules={[{ required: true }]}>
            <Input placeholder="输入链接或ID" />
          </Form.Item>

          <Form.Item name="title" label="标题">
            <Input placeholder="输入标题（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="source" label="来源">
                <Select placeholder="选择来源">
                  {Object.values(SourceType).map(source => (
                    <Option key={source} value={source}>{source}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="region" label="区域">
                <Select placeholder="选择区域">
                  {Object.values(RegionTag).map(region => (
                    <Option key={region} value={region}>{region}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="industryTags" label="行业标签">
                <Select mode="multiple" placeholder="选择行业标签">
                  {Object.values(IndustryTag).map(tag => (
                    <Option key={tag} value={tag}>{tag}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入模态框 */}
      <Modal
        title="批量导入候选池"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="导入说明"
          description="请上传CSV文件，确保包含必要的字段：platform, target_type, id_or_url"
          type="info"
          style={{ marginBottom: 16 }}
        />
        
        <Upload.Dragger
          accept=".csv"
          beforeUpload={() => false}
          onChange={(info) => {
            // TODO: 处理文件上传
            message.info('文件上传功能开发中...');
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持CSV格式文件</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default EnhancedWatchTargetManager;