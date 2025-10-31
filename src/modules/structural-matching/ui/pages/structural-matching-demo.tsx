// src/modules/structural-matching/ui/pages/structural-matching-demo.tsx
// module: structural-matching | layer: ui | role: 智能配置模板演示页面
// summary: 用于测试和演示智能配置模板功能的页面

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Descriptions, Tag } from 'antd';
import { PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { StructuralMatchingModal } from '../components/structural-matching-modal/structural-matching-modal';

const { Title, Text, Paragraph } = Typography;

/**
 * 模拟笔记卡片元素数据
 */
const MOCK_NOTE_CARD_ELEMENT = {
  resource_id: 'com.xingin.xhs:id/note_card_container',
  class_name: 'android.widget.RelativeLayout',
  content_desc: '笔记 来自@小红书用户 赞342 收藏156',
  text: '',
  bounds: '[40,200][360,500]',
  clickable: true,
  children: [
    {
      resource_id: 'com.xingin.xhs:id/note_image',
      class_name: 'android.widget.ImageView',
      content_desc: '笔记封面图',
    },
    {
      resource_id: 'com.xingin.xhs:id/note_title',
      text: '超好看的夏日穿搭分享',
      class_name: 'android.widget.TextView',
    },
  ],
};

/**
 * 模拟普通按钮元素数据
 */
const MOCK_BUTTON_ELEMENT = {
  resource_id: 'com.xingin.xhs:id/follow_btn',
  class_name: 'android.widget.Button',
  text: '关注',
  content_desc: '关注按钮',
  bounds: '[300,100][400,140]',
  clickable: true,
};

export const StructuralMatchingDemo: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  const handleOpenModal = (element: any, elementType: string) => {
    setSelectedElement(element);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedElement(null);
  };

  const handleConfigConfirm = (config: any) => {
    console.log('配置确认:', config);
    // 这里可以保存配置或执行其他操作
  };

  return (
    <div className="light-theme-force" style={{ padding: '24px', background: 'var(--bg-light-base)' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            <SettingOutlined style={{ marginRight: 8 }} />
            智能配置模板演示
          </Title>
          <Paragraph>
            本页面用于演示智能配置模板功能。系统能够自动识别不同类型的元素（如笔记卡片、按钮等），
            并应用最适合的匹配策略配置。
          </Paragraph>
        </div>

        <div>
          <Title level={3}>测试样本</Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            
            {/* 笔记卡片样本 */}
            <Card 
              title={
                <Space>
                  <Tag color="blue">笔记卡片</Tag>
                  <Text>小红书笔记卡片元素</Text>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleOpenModal(MOCK_NOTE_CARD_ELEMENT, '笔记卡片')}
                >
                  测试配置
                </Button>
              }
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Resource ID">
                  {MOCK_NOTE_CARD_ELEMENT.resource_id}
                </Descriptions.Item>
                <Descriptions.Item label="Content Desc">
                  {MOCK_NOTE_CARD_ELEMENT.content_desc}
                </Descriptions.Item>
                <Descriptions.Item label="Class Name">
                  {MOCK_NOTE_CARD_ELEMENT.class_name}
                </Descriptions.Item>
                <Descriptions.Item label="子元素数量">
                  {MOCK_NOTE_CARD_ELEMENT.children.length}
                </Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <strong>特征:</strong> content-desc包含"笔记"、"来自"、"赞"等关键词，
                  系统应该自动识别为笔记卡片并应用对应的配置模板
                </Text>
              </div>
            </Card>

            {/* 普通按钮样本 */}
            <Card 
              title={
                <Space>
                  <Tag color="green">普通按钮</Tag>
                  <Text>通用点击按钮元素</Text>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleOpenModal(MOCK_BUTTON_ELEMENT, '普通按钮')}
                >
                  测试配置
                </Button>
              }
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Resource ID">
                  {MOCK_BUTTON_ELEMENT.resource_id}
                </Descriptions.Item>
                <Descriptions.Item label="Text">
                  {MOCK_BUTTON_ELEMENT.text}
                </Descriptions.Item>
                <Descriptions.Item label="Content Desc">
                  {MOCK_BUTTON_ELEMENT.content_desc}
                </Descriptions.Item>
                <Descriptions.Item label="Class Name">
                  {MOCK_BUTTON_ELEMENT.class_name}
                </Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <strong>特征:</strong> class包含"Button"且clickable为true，
                  系统应该识别为普通按钮并应用对应的配置模板
                </Text>
              </div>
            </Card>

          </Space>
        </div>

        <div>
          <Title level={3}>功能说明</Title>
          <Card>
            <Space direction="vertical">
              <div>
                <Text strong>🎯 智能识别:</Text>
                <br />
                <Text>
                  系统会根据元素的 content-desc、resource-id、class-name 等特征，
                  自动识别元素类型并应用最适合的配置模板。
                </Text>
              </div>
              
              <div>
                <Text strong>📋 配置模板:</Text>
                <br />
                <Text>
                  • <strong>笔记卡片模板:</strong> Resource-ID完全匹配，Content-Desc都非空即可，Text保持空/非空一致
                  <br />
                  • <strong>普通按钮模板:</strong> 重点关注Resource-ID和Text字段的精确匹配
                </Text>
              </div>
              
              <div>
                <Text strong>⚙️ 手动调整:</Text>
                <br />
                <Text>
                  即使应用了模板，您仍然可以在配置界面中手动调整每个字段的匹配策略，
                  以适应特定的业务需求。
                </Text>
              </div>
            </Space>
          </Card>
        </div>
      </Space>

      {/* 结构匹配模态框 */}
      <StructuralMatchingModal
        visible={modalVisible}
        selectedElement={selectedElement}
        onClose={handleModalClose}
        onConfirm={handleConfigConfirm}
      />
    </div>
  );
};