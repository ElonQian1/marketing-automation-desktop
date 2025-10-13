// src/modules/universal-ui/demo/EnhancedStepCardDemo.tsx
// module: universal-ui | layer: demo | role: 增强步骤卡片演示
// summary: 演示完整的智能分析工作流程，包括策略分类和实时状态更新

import React from 'react';
import { Card, Space, Typography, Button, Divider, Row, Col } from 'antd';
import { EnhancedStepCard } from '../ui/components/EnhancedStepCard';
import { useInspectorStore } from '../stores/inspectorStore';

const { Title, Paragraph, Text } = Typography;

/**
 * 增强步骤卡片演示组件
 * 展示增强版步骤卡片的各种功能特性
 */
export const EnhancedStepCardDemo: React.FC = () => {
  const { analysisState } = useInspectorStore();

  // 模拟开始分析
  const handleStartDemo = () => {
    console.log('🎬 开始演示增强步骤卡片功能');
  };

  // 模拟生成策略
  const handleGenerateStrategy = () => {
    console.log('📋 演示策略生成功能');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>增强步骤卡片演示</Title>
      
      <Paragraph>
        本演示展示了 <Text strong>增强版步骤卡片</Text> 的功能特性：
      </Paragraph>
      
      <ul>
        <li><Text code>策略分类管理</Text> → 智能匹配、智能手动选择、用户自建静态</li>
        <li><Text code>实时分析状态</Text> → 显示分析进度和状态更新</li>
        <li><Text code>策略切换</Text> → 支持三种策略类型的无缝切换</li>
        <li><Text code>用户交互</Text> → 策略创建、编辑和管理功能</li>
      </ul>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="操作控制">
            <Space>
              <Button 
                type="primary" 
                onClick={handleStartDemo}
                loading={analysisState === 'pending'}
              >
                开始演示功能
              </Button>
              <Button onClick={handleGenerateStrategy}>
                生成策略示例
              </Button>
            </Space>
            
            <div style={{ marginTop: '12px' }}>
              <Text type="secondary">
                当前分析状态: <Text code>{analysisState}</Text>
              </Text>
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="增强步骤卡片">
            <EnhancedStepCard 
              title="智能分析步骤卡片"
              size="default"
              showSettings
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="功能特性说明" style={{ marginTop: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small" title="1. 智能匹配">
              <ul style={{ paddingLeft: '16px', margin: 0 }}>
                <li>自动分析元素特征</li>
                <li>生成多种匹配策略</li>
                <li>智能推荐最佳策略</li>
                <li>支持自动回退机制</li>
              </ul>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="2. 智能手动选择">
              <ul style={{ paddingLeft: '16px', margin: 0 }}>
                <li>显示分析出的多个策略</li>
                <li>用户手动选择最佳</li>
                <li>提供策略详细信息</li>
                <li>支持策略比较功能</li>
              </ul>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="3. 用户自建">
              <ul style={{ paddingLeft: '16px', margin: 0 }}>
                <li>支持用户创建策略</li>
                <li>策略模板和向导</li>
                <li>策略版本管理</li>
                <li>策略导入导出</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default EnhancedStepCardDemo;