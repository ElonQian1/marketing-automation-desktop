// src/modules/prospecting/ui/prospecting-dashboard.tsx
// module: prospecting | layer: ui | role: 精准获客主页面
// summary: 精准获客功能的主界面，包含评论列表、分析、回复等功能

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Select, 
  Space, 
  Tag, 
  Progress, 
  Modal, 
  message, 
  Tooltip,
  Badge,
  Card,
  Statistic,
  Row,
  Col
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlayCircleOutlined, 
  ExperimentOutlined, 
  ImportOutlined,
  ReloadOutlined,
  FilterOutlined,
  RobotOutlined,
  MessageOutlined
} from '@ant-design/icons';
import type { 
  ProspectingComment, 
  ProspectingIntentType,
  ProspectingSocialPlatform
} from '../domain';
import { ProspectingUseCases } from '../application/prospecting-use-cases';

const { Option } = Select;

/**
 * 筛选条件接口
 */
interface ProspectingCommentFilter {
  platform?: ProspectingSocialPlatform;
  intent?: ProspectingIntentType;
  hasAnalysis?: boolean;
}

/**
 * 精准获客仪表板组件
 */
export const ProspectingDashboard: React.FC = () => {
  // 状态管理
  const [comments, setComments] = useState<ProspectingComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filter, setFilter] = useState<ProspectingCommentFilter>({});
  const [statistics, setStatistics] = useState<any>(null);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });

  // 业务用例
  const useCases = new ProspectingUseCases();

  // 初始化数据
  useEffect(() => {
    loadComments();
    loadStatistics();
  }, [filter]);

  /**
   * 加载评论数据
   */
  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await useCases.getComments(filter);
      setComments(data);
    } catch (error) {
      message.error('加载评论数据失败');
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    try {
      const stats = await useCases.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Load statistics error:', error);
    }
  };

  /**
   * 批量分析评论
   */
  const handleBatchAnalyze = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要分析的评论');
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress({ current: 0, total: selectedRowKeys.length });

    try {
      const result = await useCases.batchAnalyzeComments(
        selectedRowKeys as string[],
        {
          concurrency: 3,
          onProgress: (completed, total, current) => {
            setAnalysisProgress({ current: completed, total });
          }
        }
      );

      if (result.success) {
        message.success(`分析完成！成功: ${result.analyzed}, 失败: ${result.failed}`);
        await loadComments();
        await loadStatistics();
        setSelectedRowKeys([]);
      } else {
        message.error('分析失败');
      }
    } catch (error) {
      message.error('分析过程出错');
      console.error('Batch analyze error:', error);
    } finally {
      setAnalyzing(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  /**
   * 创建模拟回复计划
   */
  const handleCreateReplyPlans = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要回复的评论');
      return;
    }

    // 筛选出已分析的评论
    const analyzedComments = selectedRowKeys.filter(id => {
      const comment = comments.find(c => c.id === id);
      return comment?.analysis;
    });

    if (analyzedComments.length === 0) {
      message.warning('选中的评论尚未进行AI分析');
      return;
    }

    try {
      const result = await useCases.createReplyPlans(
        analyzedComments as string[],
        { isSimulation: true }
      );

      if (result.success) {
        message.success(`创建回复计划成功！共 ${result.plans.length} 个计划`);
        
        // 执行模拟回复
        Modal.confirm({
          title: '执行模拟回复',
          content: `已创建 ${result.plans.length} 个回复计划，是否立即执行模拟回复？`,
          onOk: () => handleExecuteReplyPlans(result.plans.map(p => p.id))
        });
      } else {
        message.error('创建回复计划失败');
      }
    } catch (error) {
      message.error('创建回复计划出错');
      console.error('Create reply plans error:', error);
    }
  };

  /**
   * 执行回复计划
   */
  const handleExecuteReplyPlans = async (planIds: string[]) => {
    try {
      const results = await useCases.executeReplyPlans(planIds, {
        concurrency: 2,
        onProgress: (completed, total, current) => {
          console.log(`执行进度: ${completed}/${total}, 当前: ${current}`);
        }
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      message.success(`回复计划执行完成！成功: ${successCount}, 失败: ${failCount}`);
      setSelectedRowKeys([]);
      await loadStatistics();
    } catch (error) {
      message.error('执行回复计划出错');
      console.error('Execute reply plans error:', error);
    }
  };

  /**
   * 导入示例数据
   */
  const handleImportSampleData = async () => {
    const sampleComments = [
      {
        id: 'dy_001',
        platform: 'douyin' as ProspectingSocialPlatform,
        videoUrl: 'https://v.douyin.com/sample1',
        author: '小王',
        content: '这个产品多少钱一套？支持发货到广州吗？',
        timestamp: Date.now()
      },
      {
        id: 'xhs_001',
        platform: 'xhs' as ProspectingSocialPlatform,
        videoUrl: 'https://www.xiaohongshu.com/explore/sample1',
        author: 'Lynn',
        content: '实体店地址在哪？可以线下看样品吗',
        timestamp: Date.now()
      },
      {
        id: 'dy_002',
        platform: 'douyin' as ProspectingSocialPlatform,
        videoUrl: 'https://v.douyin.com/sample2',
        author: '老张',
        content: '售后怎么联系？我这边安装有问题',
        timestamp: Date.now()
      }
    ];

    try {
      const result = await useCases.importComments(sampleComments);
      if (result.success) {
        message.success(`导入成功！共导入 ${result.imported} 条评论`);
        await loadComments();
        await loadStatistics();
      }
    } catch (error) {
      message.error('导入示例数据失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<ProspectingComment> = [
    {
      title: '平台',
      dataIndex: 'platform',
      width: 80,
      render: (platform: ProspectingSocialPlatform) => {
        const platformMap = {
          douyin: { name: '抖音', color: 'red' },
          xhs: { name: '小红书', color: 'orange' },
          weibo: { name: '微博', color: 'blue' },
          kuaishou: { name: '快手', color: 'purple' }
        };
        const info = platformMap[platform];
        return <Tag color={info.color}>{info.name}</Tag>;
      }
    },
    {
      title: '作者',
      dataIndex: 'author',
      width: 100,
      ellipsis: true
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      width: 200,
      ellipsis: {
        showTitle: false
      },
      render: (content: string) => (
        <Tooltip title={content} placement="topLeft">
          {content}
        </Tooltip>
      )
    },
    {
      title: '意图分析',
      width: 120,
      render: (_, record) => {
        if (!record.analysis) {
          return <Tag color="default">待分析</Tag>;
        }
        
        const intentColors: Record<ProspectingIntentType, string> = {
          '询价': 'gold',
          '询地址': 'green',
          '售后': 'red',
          '咨询': 'blue',
          '购买': 'purple',
          '比较': 'cyan',
          '无效': 'default'
        };

        return (
          <Space direction="vertical" size="small">
            <Tag color={intentColors[record.analysis.intent]}>
              {record.analysis.intent}
            </Tag>
            <span style={{ fontSize: '12px', color: '#666' }}>
              置信度: {Math.round(record.analysis.confidence * 100)}%
            </span>
          </Space>
        );
      }
    },
    {
      title: 'AI建议回复',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        if (!record.analysis?.suggestedReply) {
          return '-';
        }
        return (
          <Tooltip title={record.analysis.suggestedReply} placement="topLeft">
            {record.analysis.suggestedReply}
          </Tooltip>
        );
      }
    },
    {
      title: '回复状态',
      width: 100,
      render: (_, record) => {
        if (record.isReplied) {
          return <Badge status="success" text="已回复" />;
        }
        return <Badge status="default" text="未回复" />;
      }
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {record.analysis && (
            <Tooltip title="查看详情">
              <Button 
                type="link" 
                size="small"
                icon={<MessageOutlined />}
                onClick={() => {
                  Modal.info({
                    title: '评论详情',
                    width: 600,
                    content: (
                      <div className="light-theme-force">
                        <p><strong>作者:</strong> {record.author}</p>
                        <p><strong>内容:</strong> {record.content}</p>
                        <p><strong>意图:</strong> {record.analysis.intent} (置信度: {Math.round(record.analysis.confidence * 100)}%)</p>
                        <p><strong>建议回复:</strong> {record.analysis.suggestedReply}</p>
                        {record.analysis.entities && Object.keys(record.analysis.entities).length > 0 && (
                          <div>
                            <p><strong>提取信息:</strong></p>
                            <ul>
                              {Object.entries(record.analysis.entities).map(([key, value]) => (
                                value && <li key={key}>{key}: {value}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  });
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="prospecting-dashboard light-theme-force" style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic title="总评论数" value={statistics.totalComments} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已分析" 
                value={statistics.analyzedComments}
                suffix={`/ ${statistics.totalComments}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="回复计划" 
                value={statistics.replyPlans.total}
                suffix={
                  <span style={{ fontSize: '12px' }}>
                    (完成: {statistics.replyPlans.completed})
                  </span>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="高价值线索" 
                value={
                  statistics.intentDistribution['询价'] + 
                  statistics.intentDistribution['购买']
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 工具栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<ImportOutlined />}
            onClick={handleImportSampleData}
          >
            导入示例数据
          </Button>
          
          <Button 
            icon={<ExperimentOutlined />}
            loading={analyzing}
            disabled={selectedRowKeys.length === 0}
            onClick={handleBatchAnalyze}
          >
            AI批量分析 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </Button>

          <Button 
            icon={<RobotOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={handleCreateReplyPlans}
          >
            模拟回复 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </Button>

          <Button 
            icon={<ReloadOutlined />}
            onClick={() => {
              loadComments();
              loadStatistics();
            }}
          >
            刷新
          </Button>

          <Select
            placeholder="筛选平台"
            allowClear
            style={{ width: 120 }}
            onChange={platform => setFilter(prev => ({ ...prev, platform }))}
          >
            <Option value="douyin">抖音</Option>
            <Option value="xhs">小红书</Option>
            <Option value="weibo">微博</Option>
            <Option value="kuaishou">快手</Option>
          </Select>

          <Select
            placeholder="筛选意图"
            allowClear
            style={{ width: 120 }}
            onChange={intent => setFilter(prev => ({ ...prev, intent }))}
          >
            <Option value="询价">询价</Option>
            <Option value="询地址">询地址</Option>
            <Option value="售后">售后</Option>
            <Option value="咨询">咨询</Option>
            <Option value="购买">购买</Option>
            <Option value="比较">比较</Option>
          </Select>

          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 120 }}
            onChange={hasAnalysis => setFilter(prev => ({ ...prev, hasAnalysis }))}
          >
            <Option value={true}>已分析</Option>
            <Option value={false}>未分析</Option>
          </Select>
        </Space>
      </Card>

      {/* 分析进度 */}
      {analyzing && (
        <Card style={{ marginBottom: '16px' }}>
          <div>
            <span>AI分析进度: </span>
            <Progress 
              percent={Math.round((analysisProgress.current / analysisProgress.total) * 100)} 
              status={analyzing ? 'active' : 'success'}
              format={() => `${analysisProgress.current}/${analysisProgress.total}`}
            />
          </div>
        </Card>
      )}

      {/* 评论表格 */}
      <Card>
        <Table
          className="light-theme-force"
          columns={columns}
          dataSource={comments}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              name: record.id,
            }),
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};