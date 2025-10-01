import React, { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Space,
  Row,
  Col,
  Typography,
  Button,
  DatePicker,
  Select,
  Statistic,
  Tag,
  message,
  Divider,
  List,
  Avatar,
  Progress
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserAddOutlined,
  MessageOutlined,
  TrophyOutlined,
  RiseOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { Device } from '../../../domain/adb/entities/Device';
import { shouldBypassDeviceCheck, getMockMonitoringData } from '../../../config/developmentMode';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface DailyReportModuleProps {
  onlineDevices: Device[];
  selectedDevice?: Device | null;
  refreshDevices: () => void;
}

// 关注记录类型
interface FollowRecord {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  platform: 'xiaohongshu' | 'douyin';
  deviceId: string;
  deviceName: string;
  source: string;
  success: boolean;
}

// 回复记录类型
interface ReplyRecord {
  id: string;
  date: string;
  videoUrl: string;
  videoTitle: string;
  commentAccountId: string;
  commentAccountName: string;
  commentContent: string;
  replyAccountId: string;
  replyAccountName: string;
  replyContent: string;
  platform: 'xiaohongshu' | 'douyin';
  deviceId: string;
  deviceName: string;
  success: boolean;
}

// 日报统计类型
interface DailyStats {
  date: string;
  totalFollows: number;
  successfulFollows: number;
  totalReplies: number;
  successfulReplies: number;
  successRate: number;
}

/**
 * 日报模块
 * 统计每日关注/回复数量，生成可下载的关注清单和回复清单
 */
export const DailyReportModule: React.FC<DailyReportModuleProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string] | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // 开发模式检测
  const isDevelopmentBypass = shouldBypassDeviceCheck();
  const mockData = isDevelopmentBypass ? getMockMonitoringData() : null;

  // 模拟数据
  const [followRecords] = useState<FollowRecord[]>(mockData?.analytics?.weeklyStats?.map((stat, index) => ({
    id: `follow_${index}`,
    date: stat.date,
    accountId: `user_${index}`,
    accountName: `美妆达人_${index}`,
    platform: index % 2 === 0 ? 'xiaohongshu' : 'douyin' as 'xiaohongshu' | 'douyin',
    deviceId: 'mock_device_1',
    deviceName: '华为 P40 Pro (模拟)',
    source: '行业监控-模拟数据',
    success: true
  })) || [
    {
      id: '1',
      date: '2024-09-30',
      accountId: 'user123',
      accountName: '美妆达人小李',
      platform: 'xiaohongshu',
      deviceId: 'device1',
      deviceName: '设备-1',
      source: '行业监控-美妆关键词',
      success: true
    },
    {
      id: '2',
      date: '2024-09-30',
      accountId: 'user456',
      accountName: '护肤专家Amy',
      platform: 'douyin',
      deviceId: 'device2',
      deviceName: '设备-2',
      source: '账号监控-护肤达人',
      success: true
    },
    {
      id: '3',
      date: '2024-09-29',
      accountId: 'user789',
      accountName: '时尚博主Emma',
      platform: 'xiaohongshu',
      deviceId: 'device1',
      deviceName: '设备-1',
      source: '行业监控-时尚关键词',
      success: false
    }
  ]);

  const [replyRecords] = useState<ReplyRecord[]>(mockData?.analytics?.weeklyStats?.map((stat, index) => ({
    id: `reply_${index}`,
    date: stat.date,
    videoUrl: `https://xiaohongshu.com/video/${index}`,
    videoTitle: `护肤分享视频_${index}`,
    commentAccountId: `comment_user_${index}`,
    commentAccountName: `用户_${index}`,
    commentContent: '这个方法真的有效吗？',
    replyAccountId: 'mock_account',
    replyAccountName: '美妆小助手 (模拟)',
    replyContent: '确实很有效果，推荐试试！',
    platform: index % 2 === 0 ? 'xiaohongshu' : 'douyin' as 'xiaohongshu' | 'douyin',
    deviceId: 'mock_device_1',
    deviceName: '华为 P40 Pro (模拟)',
    source: '行业监控-模拟数据',
    success: true
  })) || [
    {
      id: '1',
      date: '2024-09-30',
      videoUrl: 'https://xiaohongshu.com/video/123',
      videoTitle: '秋季护肤小贴士',
      commentAccountId: 'user111',
      commentAccountName: '小仙女',
      commentContent: '这个方法真的有效吗？',
      replyAccountId: 'account1',
      replyAccountName: '美妆小助手',
      replyContent: '确实很有效果，我用了一个月皮肤明显改善了！',
      platform: 'xiaohongshu',
      deviceId: 'device1',
      deviceName: '设备-1',
      success: true
    },
    {
      id: '2',
      date: '2024-09-30',
      videoUrl: 'https://douyin.com/video/456',
      videoTitle: '夏季防晒攻略',
      commentAccountId: 'user222',
      commentAccountName: '阳光女孩',
      commentContent: '求推荐平价防晒霜',
      replyAccountId: 'account2',
      replyAccountName: '护肤顾问',
      replyContent: '推荐几款性价比很高的防晒霜，私信发给你',
      platform: 'douyin',
      deviceId: 'device2',
      deviceName: '设备-2',
      success: true
    }
  ]);

  // 计算日报统计
  const calculateDailyStats = useCallback((): DailyStats[] => {
    const statsMap = new Map<string, DailyStats>();

    // 统计关注数据
    followRecords.forEach(record => {
      if (!statsMap.has(record.date)) {
        statsMap.set(record.date, {
          date: record.date,
          totalFollows: 0,
          successfulFollows: 0,
          totalReplies: 0,
          successfulReplies: 0,
          successRate: 0
        });
      }
      const stats = statsMap.get(record.date)!;
      stats.totalFollows++;
      if (record.success) stats.successfulFollows++;
    });

    // 统计回复数据
    replyRecords.forEach(record => {
      if (!statsMap.has(record.date)) {
        statsMap.set(record.date, {
          date: record.date,
          totalFollows: 0,
          successfulFollows: 0,
          totalReplies: 0,
          successfulReplies: 0,
          successRate: 0
        });
      }
      const stats = statsMap.get(record.date)!;
      stats.totalReplies++;
      if (record.success) stats.successfulReplies++;
    });

    // 计算成功率
    Array.from(statsMap.values()).forEach(stats => {
      const total = stats.totalFollows + stats.totalReplies;
      const successful = stats.successfulFollows + stats.successfulReplies;
      stats.successRate = total > 0 ? (successful / total) * 100 : 0;
    });

    return Array.from(statsMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [followRecords, replyRecords]);

  // 导出关注清单
  const handleExportFollowList = useCallback(async () => {
    try {
      let filteredRecords = followRecords;

      if (selectedDateRange) {
        filteredRecords = filteredRecords.filter(record => 
          record.date >= selectedDateRange[0] && record.date <= selectedDateRange[1]
        );
      }

      if (selectedPlatform !== 'all') {
        filteredRecords = filteredRecords.filter(record => 
          record.platform === selectedPlatform
        );
      }

      // 创建CSV内容
      const headers = ['关注日期', '关注账号ID', '账号名称', '平台', '执行设备', '来源', '状态'];
      const csvContent = [
        headers.join(','),
        ...filteredRecords.map(record => [
          record.date,
          record.accountId,
          record.accountName,
          record.platform,
          record.deviceName,
          record.source,
          record.success ? '成功' : '失败'
        ].join(','))
      ].join('\n');

      // 下载文件
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `关注清单_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      message.success('关注清单导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  }, [followRecords, selectedDateRange, selectedPlatform]);

  // 导出回复清单
  const handleExportReplyList = useCallback(async () => {
    try {
      let filteredRecords = replyRecords;

      if (selectedDateRange) {
        filteredRecords = filteredRecords.filter(record => 
          record.date >= selectedDateRange[0] && record.date <= selectedDateRange[1]
        );
      }

      if (selectedPlatform !== 'all') {
        filteredRecords = filteredRecords.filter(record => 
          record.platform === selectedPlatform
        );
      }

      // 创建CSV内容
      const headers = [
        '日期', '视频链接', '视频标题', '评论账户ID', '评论账户名', 
        '评论内容', '回复账号ID', '回复账号名', '回复内容', '平台', '执行设备', '状态'
      ];
      const csvContent = [
        headers.join(','),
        ...filteredRecords.map(record => [
          record.date,
          record.videoUrl,
          record.videoTitle,
          record.commentAccountId,
          record.commentAccountName,
          `"${record.commentContent}"`,
          record.replyAccountId,
          record.replyAccountName,
          `"${record.replyContent}"`,
          record.platform,
          record.deviceName,
          record.success ? '成功' : '失败'
        ].join(','))
      ].join('\n');

      // 下载文件
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `回复清单_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      message.success('回复清单导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  }, [replyRecords, selectedDateRange, selectedPlatform]);

  const dailyStats = calculateDailyStats();
  const todayStats = dailyStats[0] || {
    date: new Date().toISOString().split('T')[0],
    totalFollows: 0,
    successfulFollows: 0,
    totalReplies: 0,
    successfulReplies: 0,
    successRate: 0
  };

  // 获取平台标签
  const getPlatformTag = (platform: string) => {
    return platform === 'xiaohongshu' 
      ? <Tag color="red">小红书</Tag>
      : <Tag color="black">抖音</Tag>;
  };

  // 关注清单表格列
  const followColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: '关注账号',
      key: 'account',
      render: (record: FollowRecord) => (
        <div>
          <Text strong>{record.accountName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.accountId}
          </Text>
        </div>
      )
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => getPlatformTag(platform)
    },
    {
      title: '执行设备',
      dataIndex: 'deviceName',
      key: 'deviceName'
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source'
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'green' : 'red'}>
          {success ? '成功' : '失败'}
        </Tag>
      )
    }
  ];

  // 回复清单表格列
  const replyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: '视频信息',
      key: 'video',
      render: (record: ReplyRecord) => (
        <div>
          <Button
            type="link"
            size="small"
            onClick={() => window.open(record.videoUrl, '_blank')}
            style={{ padding: 0, height: 'auto' }}
          >
            {record.videoTitle}
          </Button>
        </div>
      )
    },
    {
      title: '评论信息',
      key: 'comment',
      render: (record: ReplyRecord) => (
        <div>
          <Text strong>{record.commentAccountName}</Text>
          <br />
          <Text style={{ fontSize: '12px' }}>
            {record.commentContent}
          </Text>
        </div>
      )
    },
    {
      title: '回复信息',
      key: 'reply',
      render: (record: ReplyRecord) => (
        <div>
          <Text strong>{record.replyAccountName}</Text>
          <br />
          <Text style={{ fontSize: '12px' }}>
            {record.replyContent}
          </Text>
        </div>
      )
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => getPlatformTag(platform)
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'green' : 'red'}>
          {success ? '成功' : '失败'}
        </Tag>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">数据报告</Title>
          <Text type="secondary">每日关注和回复统计，数据导出与分析</Text>
        </div>
        <Space>
          <RangePicker
            onChange={(dates, dateStrings) => {
              setSelectedDateRange(dateStrings as [string, string]);
            }}
          />
          <Select
            value={selectedPlatform}
            onChange={setSelectedPlatform}
            style={{ width: 120 }}
          >
            <Option value="all">全部平台</Option>
            <Option value="xiaohongshu">小红书</Option>
            <Option value="douyin">抖音</Option>
          </Select>
        </Space>
      </div>

      {/* 今日数据概览 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="今日关注"
              value={todayStats.totalFollows}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={`/ ${todayStats.successfulFollows} 成功`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="今日回复"
              value={todayStats.totalReplies}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${todayStats.successfulReplies} 成功`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="今日成功率"
              value={todayStats.successRate}
              precision={1}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="在线设备"
              value={onlineDevices.length}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 历史统计 */}
      <Card title="历史统计" extra={<BarChartOutlined />}>
        <List
          dataSource={dailyStats.slice(0, 7)}
          renderItem={(stat) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<CalendarOutlined />} />}
                title={stat.date}
                description={
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text>关注: {stat.successfulFollows}/{stat.totalFollows}</Text>
                    </Col>
                    <Col span={6}>
                      <Text>回复: {stat.successfulReplies}/{stat.totalReplies}</Text>
                    </Col>
                    <Col span={6}>
                      <Text>成功率: {stat.successRate.toFixed(1)}%</Text>
                    </Col>
                    <Col span={6}>
                      <Progress 
                        percent={stat.successRate} 
                        size="small" 
                        showInfo={false}
                      />
                    </Col>
                  </Row>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 数据导出 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="关注清单导出" 
            extra={
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExportFollowList}
              >
                导出CSV
              </Button>
            }
          >
            <Table
              columns={followColumns}
              dataSource={followRecords.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
            />
            <div className="mt-2 text-center">
              <Text type="secondary">
                显示最近5条记录，导出包含所有数据
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="回复清单导出" 
            extra={
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExportReplyList}
              >
                导出CSV
              </Button>
            }
          >
            <Table
              columns={replyColumns}
              dataSource={replyRecords.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
            <div className="mt-2 text-center">
              <Text type="secondary">
                显示最近5条记录，导出包含所有数据
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};