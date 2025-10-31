// src/modules/structural-matching/ui/pages/enhanced-field-config-demo.tsx
// module: structural-matching | layer: ui | role: 增强字段配置演示页面
// summary: 展示如何让用户手动选择每个字段的匹配策略的完整UI

import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Tabs, 
  Space, 
  Button, 
  Modal, 
  Typography, 
  Row, 
  Col,
  Divider,
  Alert,
  Steps,
  Tag
} from 'antd';
import { 
  SettingOutlined, 
  EyeOutlined, 
  PlayCircleOutlined,
  BookOutlined,
  ExperimentOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import { EnhancedFieldConfigPanel } from '../components/enhanced-field-config-panel';
import { FieldStrategyDemo } from './field-strategy-demo';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 配置步骤说明
 */
const ConfigSteps = [
  {
    title: '选择场景',
    description: '从预设场景中选择最符合你需求的配置',
    icon: <BookOutlined />
  },
  {
    title: '调整字段',
    description: '开启或关闭特定字段，选择合适的匹配策略',
    icon: <SettingOutlined />
  },
  {
    title: '优化权重',
    description: '根据字段重要性调整权重值',
    icon: <ExperimentOutlined />
  },
  {
    title: '验证配置',
    description: '检查配置合理性并查看优化建议',
    icon: <CheckCircleOutlined />
  }
];

/**
 * 常见使用场景说明
 */
const UseCaseExamples = [
  {
    title: '📱 小红书笔记识别',
    description: '识别笔记标题、内容、作者等元素',
    config: '启用Content-Desc和Text字段，使用"都非空即可"策略',
    suitable: ['动态内容匹配', '笔记列表抓取', '内容分析']
  },
  {
    title: '🎯 精确按钮定位',
    description: '准确点击特定的按钮或控件',
    config: '启用Resource-ID和Class Name，使用精确匹配策略',
    suitable: ['自动化操作', '界面控制', '功能触发']
  },
  {
    title: '📋 列表项批量处理',
    description: '处理结构相似但内容不同的列表项',
    config: '启用Class Name和Children Structure，使用结构匹配',
    suitable: ['数据抓取', '批量操作', '列表遍历']
  },
  {
    title: '🔄 版本适配匹配',
    description: '应对App版本更新后的界面变化',
    config: '使用值相似匹配和都非空策略，提高容错性',
    suitable: ['版本兼容', '界面适配', '稳定性优化']
  }
];

/**
 * 增强字段配置演示页面
 */
export const EnhancedFieldConfigDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <Layout className="enhanced-field-config-demo light-theme-force">
      <Content style={{ padding: '24px', minHeight: '100vh' }}>
        {/* 页面头部 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2}>
              <SettingOutlined /> 字段匹配策略配置中心
            </Title>
            <Paragraph>
              完全由用户控制每个字段是否参与匹配，以及如何进行匹配。
              支持6种细粒度策略，包括"都非空即可"、"保持一致性"、"值相似匹配"等。
            </Paragraph>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<BookOutlined />} 
                onClick={() => setShowGuideModal(true)}
              >
                配置指南
              </Button>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => setActiveTab('demo')}
              >
                查看演示
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 功能特性展示 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>🎛️</div>
              <Text strong>字段级控制</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                每个字段独立开关和策略选择
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>🚀</div>
              <Text strong>6种匹配策略</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                精确匹配到都非空即可的完整策略
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>📋</div>
              <Text strong>场景预设</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                4种常见业务场景的快速配置
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: 8 }}>🔍</div>
              <Text strong>实时验证</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                配置合理性检查和优化建议
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 主要内容区域 */}
        <Card>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
          >
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  配置面板
                </span>
              } 
              key="config"
            >
              <EnhancedFieldConfigPanel />
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <EyeOutlined />
                  效果演示
                </span>
              } 
              key="demo"
            >
              <FieldStrategyDemo />
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <BookOutlined />
                  使用案例
                </span>
              } 
              key="examples"
            >
              <div style={{ padding: '24px' }}>
                <Title level={4}>常见使用场景</Title>
                <Row gutter={[16, 16]}>
                  {UseCaseExamples.map((example, index) => (
                    <Col span={12} key={index}>
                      <Card 
                        title={example.title}
                        size="small"
                        extra={<Tag color="blue">推荐</Tag>}
                      >
                        <Paragraph style={{ marginBottom: 8 }}>
                          {example.description}
                        </Paragraph>
                        
                        <Alert
                          message="推荐配置"
                          description={example.config}
                          type="info"
                          size="small"
                          style={{ marginBottom: 8 }}
                        />
                        
                        <div>
                          <Text strong style={{ fontSize: '12px' }}>适用场景:</Text>
                          <div style={{ marginTop: 4 }}>
                            {example.suitable.map(item => (
                              <Tag key={item} size="small">{item}</Tag>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </TabPane>
          </Tabs>
        </Card>

        {/* 配置指南模态框 */}
        <Modal
          title="字段配置指南"
          open={showGuideModal}
          onCancel={() => setShowGuideModal(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setShowGuideModal(false)}>
              关闭
            </Button>
          ]}
        >
          <Steps 
            current={currentStep} 
            direction="vertical"
            style={{ marginBottom: 24 }}
          >
            {ConfigSteps.map((step, index) => (
              <Steps.Step
                key={index}
                title={step.title}
                description={step.description}
                icon={step.icon}
                style={{ cursor: 'pointer' }}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </Steps>

          <Divider />

          <Title level={5}>🎯 核心策略说明</Title>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Card size="small" title="精确匹配">
                <Text>适用于固定不变的标识符，如Resource-ID、Class Name</Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="都非空即可">
                <Text>适用于动态内容，只要两个字段都有值就认为匹配</Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="保持一致性">
                <Text>维持原有的空/非空状态，保证UI表现一致</Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="值相似匹配">
                <Text>允许内容有一定差异，适合处理文本变体</Text>
              </Card>
            </Col>
          </Row>

          <Alert
            style={{ marginTop: 16 }}
            message="最佳实践"
            description="建议启用2-4个关键字段，使用多种策略组合以获得最佳的匹配效果。避免过度依赖单一字段或策略。"
            type="success"
            showIcon
          />
        </Modal>
      </Content>
    </Layout>
  );
};

export default EnhancedFieldConfigDemo;