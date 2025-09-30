/**
 * 主题预览组件
 * 展示不同主题下的 UI 效果
 */

import React, { useMemo } from 'react';
import { 
  Card, 
  Space, 
  Button, 
  Input, 
  Select, 
  Switch, 
  Progress, 
  Tag, 
  Avatar,
  Divider,
  Typography,
  Row,
  Col,
} from 'antd';
import { 
  HeartOutlined, 
  LikeOutlined, 
  MessageOutlined,
  ShareAltOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useThemeState, useThemeActions } from '../providers/EnhancedThemeProvider';
import type { ThemeMode } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * 主题预览属性
 */
export interface ThemePreviewProps {
  /** 预览的主题模式，如果不提供则使用当前主题 */
  previewMode?: ThemeMode;
  /** 是否显示切换按钮 */
  showSwitcher?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 主题预览组件
 */
export const ThemePreview: React.FC<ThemePreviewProps> = ({
  previewMode,
  showSwitcher = true,
  className,
  style,
}) => {
  const { mode: currentMode } = useThemeState();
  const { setMode } = useThemeActions();
  
  const displayMode = previewMode || currentMode;
  const isCurrentTheme = displayMode === currentMode;

  // 主题相关的演示数据
  const demoData = useMemo(() => ({
    user: {
      name: '张小明',
      avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
      followers: 1234,
      following: 567,
    },
    post: {
      title: '探索 Ant Design 5 暗色主题的魅力',
      content: '在现代应用设计中，暗色主题不仅能够减少眼部疲劳，还能提供更加沉浸式的用户体验。本文将介绍如何在项目中优雅地实现主题切换功能。',
      likes: 89,
      comments: 23,
      shares: 12,
      tags: ['前端开发', 'React', 'Ant Design', '主题系统'],
    },
    stats: {
      completion: 75,
      performance: 92,
      quality: 88,
    },
  }), []);

  // 应用主题的处理函数
  const handleApplyTheme = () => {
    if (!isCurrentTheme && previewMode) {
      setMode(previewMode);
    }
  };

  return (
    <Card
      className={`theme-preview ${className || ''}`}
      style={style}
      title={
        <Space>
          <span>{displayMode === 'dark' ? '🌙' : '☀️'}</span>
          <span>{displayMode === 'dark' ? '暗色主题预览' : '亮色主题预览'}</span>
        </Space>
      }
      extra={
        showSwitcher && !isCurrentTheme && (
          <Button type="primary" size="small" onClick={handleApplyTheme}>
            应用此主题
          </Button>
        )
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 用户信息卡片 */}
        <Card size="small" title="用户信息">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Avatar src={demoData.user.avatar} size={48} />
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  {demoData.user.name}
                </Title>
                <Text type="secondary">
                  {demoData.user.followers} 关注者 · {demoData.user.following} 关注中
                </Text>
              </div>
            </Space>
            
            <Row gutter={16}>
              <Col span={12}>
                <Button type="primary" block>
                  关注
                </Button>
              </Col>
              <Col span={12}>
                <Button block>
                  私信
                </Button>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 内容卡片 */}
        <Card size="small" title="动态内容">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>
              {demoData.post.title}
            </Title>
            
            <Paragraph style={{ margin: 0 }}>
              {demoData.post.content}
            </Paragraph>
            
            <Space wrap>
              {demoData.post.tags.map(tag => (
                <Tag key={tag} color="blue">
                  {tag}
                </Tag>
              ))}
            </Space>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Row gutter={16}>
              <Col span={6}>
                <Button 
                  type="text" 
                  icon={<LikeOutlined />} 
                  size="small"
                >
                  {demoData.post.likes}
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  type="text" 
                  icon={<MessageOutlined />} 
                  size="small"
                >
                  {demoData.post.comments}
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  type="text" 
                  icon={<ShareAltOutlined />} 
                  size="small"
                >
                  {demoData.post.shares}
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  type="text" 
                  icon={<HeartOutlined />} 
                  size="small"
                />
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 表单控件演示 */}
        <Card size="small" title="表单控件">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Input placeholder="输入框演示" />
              </Col>
              <Col span={12}>
                <Select placeholder="选择器演示" style={{ width: '100%' }}>
                  <Option value="option1">选项 1</Option>
                  <Option value="option2">选项 2</Option>
                  <Option value="option3">选项 3</Option>
                </Select>
              </Col>
            </Row>
            
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Space>
                  <Text>开关控件：</Text>
                  <Switch defaultChecked />
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <StarOutlined />
                  <Text>收藏功能</Text>
                </Space>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 数据统计 */}
        <Card size="small" title="数据统计">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text>完成度 {demoData.stats.completion}%</Text>
              </div>
              <Progress percent={demoData.stats.completion} />
            </div>
            
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text>性能指标 {demoData.stats.performance}%</Text>
              </div>
              <Progress 
                percent={demoData.stats.performance} 
                status="active"
                strokeColor="#52c41a"
              />
            </div>
            
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text>质量评分 {demoData.stats.quality}%</Text>
              </div>
              <Progress 
                percent={demoData.stats.quality}
                strokeColor="#faad14"
              />
            </div>
          </Space>
        </Card>

        {/* 主题信息 */}
        {isCurrentTheme && (
          <Card size="small">
            <Text type="success">
              ✓ 当前正在使用此主题
            </Text>
          </Card>
        )}
      </Space>
    </Card>
  );
};

/**
 * 主题对比预览组件
 * 同时显示亮色和暗色主题的对比效果
 */
export interface ThemeComparisonProps {
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export const ThemeComparison: React.FC<ThemeComparisonProps> = ({
  className,
  style,
}) => {
  return (
    <div className={`theme-comparison ${className || ''}`} style={style}>
      <Row gutter={16}>
        <Col span={12}>
          <ThemePreview previewMode="light" />
        </Col>
        <Col span={12}>
          <ThemePreview previewMode="dark" />
        </Col>
      </Row>
    </div>
  );
};