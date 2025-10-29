// src/pages/TextMatchingSettingsPage.tsx
// module: ui | layer: ui | role: page
// summary: 文本匹配设置页面，集成反义词检查等配置

import React, { useState } from 'react';
import {
  Row,
  Col,
  Space,
  Typography,
  Card,
  Button,
  Divider,
  Alert,
  Tabs
} from 'antd';
import {
  SettingOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

import { 
  TextMatchingConfigPanel, 
  useTextMatchingConfig,
  type TextMatchingConfig 
} from '../components/text-matching';
import { SemanticAnalyzerSettingsPage } from './SemanticAnalyzerSettingsPage';

const { Title, Paragraph } = Typography;

export const TextMatchingSettingsPage: React.FC = () => {
  const { config, updateConfig } = useTextMatchingConfig();
  const [activeTab, setActiveTab] = useState('basic');

  const handleConfigChange = (newConfig: TextMatchingConfig) => {
    updateConfig(newConfig);
    // 这里可以添加保存到后端的逻辑
    console.log('文本匹配配置已更新:', newConfig);
  };

  const tabItems = [
    {
      key: 'basic',
      label: (
        <Space>
          <SettingOutlined />
          <span>基础配置</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 页面说明 */}
          <Alert
            type="info"
            showIcon
            message="文本匹配模式配置"
            description={
              <div>
                <p>配置系统如何在UI界面中匹配文本内容：</p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li><strong>绝对匹配</strong>：只匹配完全相同的文本，精确但不灵活</li>
                  <li><strong>部分匹配</strong>：启用智能算法，包括反义词检测、语义分析等</li>
                </ul>
              </div>
            }
          />

          {/* 文本匹配配置面板 */}
          <TextMatchingConfigPanel
            config={config}
            onChange={handleConfigChange}
          />

          {/* 使用场景说明 */}
          <Card title="使用场景说明" className="light-theme-force">
            <Row gutter={16}>
              <Col span={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <SafetyOutlined style={{ color: 'var(--warning, #f59e0b)' }} />
                      <span>绝对匹配模式</span>
                    </Space>
                  }
                  className="light-theme-force"
                >
                  <Paragraph style={{ fontSize: 12, color: 'var(--text-2, #4b5563)' }}>
                    <strong>适用场景：</strong>
                    <br />• 金融、医疗等高精度要求的应用
                    <br />• 系统设置、安全操作等关键功能
                    <br />• 需要严格按照UI文本执行的场景
                  </Paragraph>
                  <Paragraph style={{ fontSize: 12, color: 'var(--text-2, #4b5563)' }}>
                    <strong>特点：</strong>
                    <br />• 零误差，高可靠性
                    <br />• 不会误触相似元素
                    <br />• 适合稳定不变的UI界面
                  </Paragraph>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: 'var(--primary, #3b82f6)' }} />
                      <span>部分匹配模式</span>
                    </Space>
                  }
                  className="light-theme-force"
                >
                  <Paragraph style={{ fontSize: 12, color: 'var(--text-2, #4b5563)' }}>
                    <strong>适用场景：</strong>
                    <br />• 社交媒体、电商等内容频繁变化的应用
                    <br />• 需要处理动态文本的自动化脚本
                    <br />• 多语言、多版本的应用适配
                  </Paragraph>
                  <Paragraph style={{ fontSize: 12, color: 'var(--text-2, #4b5563)' }}>
                    <strong>特点：</strong>
                    <br />• 智能化，高容错性
                    <br />• 能处理同义词、反义词等复杂情况
                    <br />• 适合动态变化的UI界面
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </Card>
        </Space>
      )
    },
    {
      key: 'advanced',
      label: (
        <Space>
          <ExperimentOutlined />
          <span>高级设置</span>
        </Space>
      ),
      children: config.mode === 'partial' ? (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            type="warning"
            showIcon
            message="高级语义分析配置"
            description="以下设置仅在'部分文本匹配模式'下生效，可以精细控制反义词检测和语义分析算法。"
          />
          <SemanticAnalyzerSettingsPage />
        </Space>
      ) : (
        <Alert
          type="info"
          showIcon
          message="高级设置不可用"
          description="请先在基础配置中启用'部分文本匹配模式'，然后可以在此配置反义词检测、语义分析等高级功能。"
        />
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 页面标题 */}
        <div>
          <Title level={2} style={{ margin: 0, color: 'var(--text-1, #1f2937)' }}>
            <Space>
              <SettingOutlined />
              <span>文本匹配设置</span>
            </Space>
          </Title>
          <Paragraph style={{ color: 'var(--text-3, #6b7280)', margin: '8px 0 0 0' }}>
            配置系统如何在UI界面中识别和匹配文本内容，包括绝对匹配和智能匹配模式
          </Paragraph>
        </div>

        {/* 标签页内容 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Space>
    </div>
  );
};