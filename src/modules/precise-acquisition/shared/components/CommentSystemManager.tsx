// src/modules/precise-acquisition/shared/components/CommentSystemManager.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 评论系统管理组件
 * 
 * 基于Comment实体的完整功能，提供评论的创建、编辑、状态管理和批量操作
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
  Typography,
  Divider,
  Dropdown,
  Menu,
  DatePicker,
  Badge,
  Avatar
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  MessageOutlined, 
  HeartOutlined, 
  UserOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SearchOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { Comment } from '../../../../domain/precise-acquisition/entities/Comment';
import { Platform, RegionTag } from '../../../../constants/precise-acquisition-enums';
import dayjs, { Dayjs } from 'dayjs';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 评论视图模型
 */
interface CommentViewModel {
  id: string | null;
  platform: Platform;
  videoId: string;
  authorId: string;
  content: string;
  likeCount: number | null;
  publishTime: Date;
  region: RegionTag | null;
  sourceTargetId: string;
  insertedAt: Date | null;
  
  // 扩展字段（关联信息）
  authorName?: string;
  videoTitle?: string;
  isReplied?: boolean;
  replyCount?: number;
  lastReplyTime?: Date;
}

/**
 * 过滤器状态
 */
interface CommentFilterState {
  platform?: Platform;
  region?: RegionTag;
  sourceTargetId?: string;
  dateRange?: [Dayjs, Dayjs];
  keyword?: string;
  hasReplies?: boolean;
  minLikes?: number;
  maxLikes?: number;
}

interface CommentSystemManagerProps {
  onCommentSelect?: (comment: Comment) => void;
  onReplyToComment?: (comment: Comment) => void;
}

/**
 * 评论系统管理组件
 */
export const CommentSystemManager: React.FC<CommentSystemManagerProps> = ({
  onCommentSelect,
  onReplyToComment
}) => {
  const [data, setData] = useState<CommentViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<CommentFilterState>({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentViewModel | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  /**
   * 加载评论数据
   */
  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 调用实际的数据加载逻辑
      // const comments = await commentService.list(filters);
      
      // 模拟数据
      const mockData: CommentViewModel[] = [
        {
          id: 'cmt_001',
          platform: Platform.DOUYIN,
          videoId: 'video_123',
          authorId: 'user_456',
          content: '这个产品真的很不错，我已经用了一个月了，效果明显！推荐给大家～',
          likeCount: 15,
          publishTime: new Date('2024-01-15T10:30:00'),
          region: RegionTag.EAST_CHINA,
          sourceTargetId: '1',
          insertedAt: new Date('2024-01-15T10:35:00'),
          authorName: '美妆小达人',
          videoTitle: '口腔护理产品测评',
          isReplied: false,
          replyCount: 0
        },
        {
          id: 'cmt_002',
          platform: Platform.XIAOHONGSHU,
          videoId: 'video_789',
          authorId: 'user_101',
          content: '想了解更多详情，有联系方式吗？',
          likeCount: 3,
          publishTime: new Date('2024-01-16T14:20:00'),
          region: RegionTag.SOUTH_CHINA,
          sourceTargetId: '2',
          insertedAt: new Date('2024-01-16T14:25:00'),
          authorName: '健康生活家',
          videoTitle: '健康生活小贴士',
          isReplied: true,
          replyCount: 1,
          lastReplyTime: new Date('2024-01-16T15:00:00')
        }
      ];
      
      setData(mockData);
    } catch (error) {
      message.error(`加载评论失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  /**
   * 表格列定义
   */
  const columns: ColumnsType<CommentViewModel> = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (platform: Platform) => (
        <Tag color={platform === Platform.DOUYIN ? 'red' : platform === Platform.XIAOHONGSHU ? 'pink' : 'blue'}>
          {platform}
        </Tag>
      )
    },
    {
      title: '评论者',
      key: 'author',
      width: 120,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {record.authorName || '匿名用户'}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              {record.authorId.substring(0, 8)}...
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string, record) => (
        <div>
          <Paragraph
            ellipsis={{ rows: 2, expandable: true }}
            style={{ marginBottom: 4, fontSize: '13px' }}
          >
            {content}
          </Paragraph>
          <Space size="small">
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.videoTitle}
            </Text>
          </Space>
        </div>
      )
    },
    {
      title: '互动数据',
      key: 'engagement',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ fontSize: '12px' }}>
          <Space size="small">
            <HeartOutlined style={{ color: '#ff4d4f' }} />
            <span>{record.likeCount || 0}</span>
          </Space>
          {record.isReplied && (
            <Space size="small">
              <MessageOutlined style={{ color: '#52c41a' }} />
              <span>{record.replyCount || 0}</span>
            </Space>
          )}
        </Space>
      )
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      width: 80,
      render: (region: RegionTag | null) => region ? (
        <Tag color="cyan" style={{ fontSize: '11px' }}>{region}</Tag>
      ) : '-'
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_, record) => (
        <div>
          {record.isReplied ? (
            <Badge status="success" text="已回复" />
          ) : (
            <Badge status="processing" text="待回复" />
          )}
        </div>
      )
    },
    {
      title: '时间',
      key: 'time',
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: '11px' }}>
          <div>发布: {dayjs(record.publishTime).format('MM-DD HH:mm')}</div>
          {record.lastReplyTime && (
            <div style={{ color: '#52c41a' }}>
              回复: {dayjs(record.lastReplyTime).format('MM-DD HH:mm')}
            </div>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item 
                key="view" 
                icon={<EyeOutlined />}
                onClick={() => viewCommentDetail(record)}
              >
                查看详情
              </Menu.Item>
              <Menu.Item 
                key="reply" 
                icon={<MessageOutlined />}
                onClick={() => handleReplyToComment(record)}
              >
                回复评论
              </Menu.Item>
              <Menu.Item 
                key="select" 
                icon={<FileTextOutlined />}
                onClick={() => onCommentSelect?.(convertToEntity(record))}
              >
                选择评论
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
                删除评论
              </Menu.Item>
            </Menu>
          }
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

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
            placeholder="地域"
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
        <Col span={4}>
          <Select
            placeholder="回复状态"
            allowClear
            value={filters.hasReplies}
            onChange={(value) => setFilters(prev => ({ ...prev, hasReplies: value }))}
            style={{ width: '100%' }}
          >
            <Option value={true}>已回复</Option>
            <Option value={false}>待回复</Option>
          </Select>
        </Col>
        <Col span={6}>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            value={filters.dateRange}
            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            style={{ width: '100%' }}
            size="middle"
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="关键词搜索"
            allowClear
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
          />
        </Col>
      </Row>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <Row gutter={16}>
        <Col span={4}>
          <Input
            placeholder="最少点赞数"
            type="number"
            value={filters.minLikes}
            onChange={(e) => setFilters(prev => ({ ...prev, minLikes: Number(e.target.value) || undefined }))}
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="最多点赞数"
            type="number"
            value={filters.maxLikes}
            onChange={(e) => setFilters(prev => ({ ...prev, maxLikes: Number(e.target.value) || undefined }))}
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="视频ID"
            value={filters.sourceTargetId}
            onChange={(e) => setFilters(prev => ({ ...prev, sourceTargetId: e.target.value }))}
          />
        </Col>
      </Row>
    </Card>
  );

  /**
   * 渲染统计信息
   */
  const renderStatistics = () => {
    const totalComments = data.length;
    const repliedComments = data.filter(d => d.isReplied).length;
    const avgLikes = Math.round(data.reduce((sum, d) => sum + (d.likeCount || 0), 0) / totalComments || 0);
    const todayComments = data.filter(d => 
      dayjs(d.publishTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length;
    
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总评论数" value={totalComments} prefix={<MessageOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="已回复" 
              value={repliedComments} 
              suffix={`/ ${totalComments}`}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic title="平均点赞" value={avgLikes} prefix={<HeartOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="今日新增" value={todayComments} prefix={<ClockCircleOutlined />} />
          </Col>
        </Row>
      </Card>
    );
  };

  /**
   * 查看评论详情
   */
  const viewCommentDetail = (comment: CommentViewModel) => {
    setSelectedComment(comment);
    setDetailModalVisible(true);
  };

  /**
   * 处理回复评论
   */
  const handleReplyToComment = (comment: CommentViewModel) => {
    onReplyToComment?.(convertToEntity(comment));
  };

  /**
   * 转换为实体对象
   */
  const convertToEntity = (vm: CommentViewModel): Comment => {
    return Comment.create({
      platform: vm.platform,
      videoId: vm.videoId,
      authorId: vm.authorId,
      content: vm.content,
      likeCount: vm.likeCount,
      publishTime: vm.publishTime,
      region: vm.region,
      sourceTargetId: vm.sourceTargetId
    });
  };

  /**
   * 批量操作菜单
   */
  const bulkActionMenu = (
    <Menu>
      <Menu.Item key="reply" icon={<MessageOutlined />}>
        批量回复
      </Menu.Item>
      <Menu.Item key="export" icon={<ExportOutlined />}>
        导出选中
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
        批量删除
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: 16 }}>
      <Title level={3}>评论系统管理</Title>
      
      {renderStatistics()}
      {renderFilters()}
      
      <Card
        title="评论列表"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Dropdown overlay={bulkActionMenu}>
                <Button icon={<BarChartOutlined />}>
                  批量操作 ({selectedRowKeys.length})
                </Button>
              </Dropdown>
            )}
            
            <Button
              icon={<ExportOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              导出数据
            </Button>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={loadComments}
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
          rowKey={(record) => record.id || 'unknown'}
          loading={loading}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 共 ${total} 条`
          }}
        />
      </Card>

      {/* 评论详情模态框 */}
      <Modal
        title="评论详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedComment(null);
        }}
        footer={null}
        width={700}
      >
        {selectedComment && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>评论者：</Text>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{selectedComment.authorName || '匿名用户'}</span>
                  <Tag>{selectedComment.platform}</Tag>
                </Space>
              </div>
              
              <div>
                <Text strong>评论内容：</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '6px',
                  marginTop: '8px'
                }}>
                  {selectedComment.content}
                </div>
              </div>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>发布时间：</Text>
                  <div>{dayjs(selectedComment.publishTime).format('YYYY-MM-DD HH:mm:ss')}</div>
                </Col>
                <Col span={12}>
                  <Text strong>点赞数：</Text>
                  <div>{selectedComment.likeCount || 0}</div>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>地域：</Text>
                  <div>{selectedComment.region || '未知'}</div>
                </Col>
                <Col span={12}>
                  <Text strong>回复状态：</Text>
                  <div>
                    {selectedComment.isReplied ? (
                      <Badge status="success" text="已回复" />
                    ) : (
                      <Badge status="processing" text="待回复" />
                    )}
                  </div>
                </Col>
              </Row>
              
              <div>
                <Text strong>关联视频：</Text>
                <div>{selectedComment.videoTitle || selectedComment.videoId}</div>
              </div>
            </Space>
            
            <Divider />
            
            <Space>
              <Button 
                type="primary" 
                icon={<MessageOutlined />}
                onClick={() => handleReplyToComment(selectedComment)}
              >
                回复评论
              </Button>
              <Button 
                icon={<FileTextOutlined />}
                onClick={() => onCommentSelect?.(convertToEntity(selectedComment))}
              >
                选择评论
              </Button>
            </Space>
          </div>
        )}
      </Modal>

      {/* 导出数据模态框 */}
      <Modal
        title="导出评论数据"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={() => {
          message.info('导出功能开发中...');
          setExportModalVisible(false);
        }}
      >
        <Alert
          message="导出说明"
          description="将导出当前筛选条件下的所有评论数据，包括评论内容、作者信息、互动数据等。"
          type="info"
          style={{ marginBottom: 16 }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>导出格式：</Text>
            <Select defaultValue="csv" style={{ width: 120, marginLeft: 8 }}>
              <Option value="csv">CSV</Option>
              <Option value="excel">Excel</Option>
              <Option value="json">JSON</Option>
            </Select>
          </div>
          
          <div>
            <Text strong>包含字段：</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                {['评论内容', '作者信息', '发布时间', '点赞数', '地域', '回复状态'].map(field => (
                  <Tag key={field} color="blue">{field}</Tag>
                ))}
              </Space>
            </div>
          </div>
          
          <div>
            <Text strong>数据量：</Text>
            <span>{selectedRowKeys.length > 0 ? `已选择 ${selectedRowKeys.length} 条` : `全部 ${data.length} 条`}</span>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default CommentSystemManager;