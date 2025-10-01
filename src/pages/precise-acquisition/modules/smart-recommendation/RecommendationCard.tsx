import React from 'react';
import {
  Card,
  Space,
  Typography,
  Tag,
  Progress,
  Button,
  Avatar,
  Tooltip,
  Divider,
  Badge
} from 'antd';
import {
  EyeOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  EyeInvisibleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import type { RecommendationItem, RecommendationAction } from './types';

const { Title, Text } = Typography;

interface RecommendationCardProps {
  item: RecommendationItem;
  onAction: (action: RecommendationAction, item: RecommendationItem) => void;
}

/**
 * 推荐项目卡片组件
 */
export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onAction
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toLocaleString();
  };

  const formatTime = (timeStr: string): string => {
    const now = new Date();
    const publishTime = new Date(timeStr);
    const diffHours = Math.floor((now.getTime() - publishTime.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return '刚刚发布';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}天前`;
    return publishTime.toLocaleDateString();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    if (score >= 40) return '#fa8c16';
    return '#f5222d';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'added':
        return { color: 'success', text: '已添加' };
      case 'ignored':
        return { color: 'default', text: '已忽略' };
      default:
        return { color: 'processing', text: '待处理' };
    }
  };

  const statusConfig = getStatusConfig(item.status);

  return (
    <Card 
      size="small" 
      className={`hover:shadow-md transition-shadow ${
        item.status === 'pending' ? 'border-blue-200' : ''
      }`}
      actions={
        item.status === 'pending' ? [
          <Button
            key="add"
            type="primary"
            size="small"
            icon={<UserAddOutlined />}
            onClick={() => onAction('add_to_monitoring', item)}
          >
            加入监控
          </Button>,
          <Button
            key="ignore"
            size="small"
            icon={<EyeInvisibleOutlined />}
            onClick={() => onAction('ignore', item)}
          >
            忽略
          </Button>,
          <Button
            key="details"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => onAction('view_details', item)}
          >
            查看详情
          </Button>
        ] : [
          <Button
            key="details"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => onAction('view_details', item)}
          >
            查看详情
          </Button>
        ]
      }
    >
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Avatar
            size="small"
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.authorId}`}
          />
          <div>
            <div className="flex items-center space-x-2">
              <Text strong className="text-sm">{item.author}</Text>
              <Tag color={item.platform === 'xiaohongshu' ? 'red' : 'blue'}>
                {item.platform === 'xiaohongshu' ? '小红书' : '抖音'}
              </Tag>
              <Tag color={item.type === 'account' ? 'green' : 'orange'}>
                {item.type === 'account' ? '账号' : '视频'}
              </Tag>
            </div>
            <Text className="text-xs text-gray-500">{item.authorId}</Text>
          </div>
        </div>
        
        <div className="text-right">
          <Badge 
            color={statusConfig.color} 
            text={statusConfig.text}
            className="text-xs"
          />
        </div>
      </div>

      {/* 标题和链接 */}
      <div className="mb-3">
        <Title level={5} className="m-0 mb-1 leading-tight">
          <Tooltip title={item.url}>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-blue-600"
            >
              {item.title}
            </a>
          </Tooltip>
        </Title>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <ClockCircleOutlined />
          <span>{formatTime(item.metrics.publishTime)}</span>
          {item.metrics.region && (
            <>
              <Divider type="vertical" />
              <span>{item.metrics.region}</span>
            </>
          )}
        </div>
      </div>

      {/* 数据指标 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center space-x-1">
          <EyeOutlined className="text-gray-400 text-xs" />
          <Text className="text-xs">浏览: {formatNumber(item.metrics.views)}</Text>
        </div>
        <div className="flex items-center space-x-1">
          <HeartOutlined className="text-gray-400 text-xs" />
          <Text className="text-xs">点赞: {formatNumber(item.metrics.likes)}</Text>
        </div>
        <div className="flex items-center space-x-1">
          <MessageOutlined className="text-gray-400 text-xs" />
          <Text className="text-xs">评论: {formatNumber(item.metrics.comments)}</Text>
        </div>
        <div className="flex items-center space-x-1">
          <ShareAltOutlined className="text-gray-400 text-xs" />
          <Text className="text-xs">分享: {formatNumber(item.metrics.shares)}</Text>
        </div>
      </div>

      {/* 推荐评分和置信度 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1">
            <TrophyOutlined className="text-yellow-500 text-xs" />
            <Text className="text-xs font-medium">推荐评分</Text>
          </div>
          <Text className="text-xs font-bold" style={{ color: getScoreColor(item.score) }}>
            {item.score.toFixed(1)}分
          </Text>
        </div>
        <Progress
          percent={item.score}
          size="small"
          strokeColor={getScoreColor(item.score)}
          showInfo={false}
        />
        
        <div className="flex items-center justify-between mt-1">
          <Text className="text-xs text-gray-500">置信度</Text>
          <Text className="text-xs">{item.confidence.toFixed(0)}%</Text>
        </div>
      </div>

      {/* 互动率和增长率 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-lg font-bold text-blue-600">
            {item.metrics.engagement.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">互动率</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-lg font-bold text-green-600">
            {item.metrics.growthRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">增长率</div>
        </div>
      </div>

      {/* 推荐原因 */}
      <div>
        <Text className="text-xs text-gray-500 block mb-1">推荐理由：</Text>
        <div className="space-y-1">
          {item.reasons.slice(0, 3).map((reason, index) => (
            <Tag key={index} className="text-xs" color="blue">
              {reason}
            </Tag>
          ))}
          {item.reasons.length > 3 && (
            <Tooltip title={item.reasons.slice(3).join('、')}>
              <Tag className="text-xs">+{item.reasons.length - 3}个理由</Tag>
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  );
};