import React, { useState } from 'react';
import { 
  theme, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Input, 
  Select, 
  Tag, 
  Tooltip, 
  Modal 
} from 'antd';
import { 
  ReloadOutlined, 
  SettingOutlined, 
  DeleteOutlined,
  SearchOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

/**
 * UI组件库展示页面
 * 展示基于 Ant Design + Design Tokens 的组件用法
 * 符合员工A Design Tokens 架构要求
 */
const UIShowcasePage: React.FC = () => {
  const { token } = theme.useToken();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const demoOptions = [
    { label: '选项1', value: '1' },
    { label: '选项2', value: '2' },
    { label: '选项3', value: '3' },
    { label: '选项4', value: '4' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: token.paddingLG,
      backgroundColor: token.colorBgLayout 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: token.marginXL }}>
          <Title level={2} style={{ marginBottom: token.marginSM }}>
            UI 组件库展示
          </Title>
          <Paragraph type="secondary">
            展示基于 Ant Design + Design Tokens 的组件库用法，符合统一的设计系统规范。
          </Paragraph>
        </div>

        <Card 
          title="按钮组件" 
          style={{ marginBottom: token.marginLG }}
          extra={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={isLoading}
            >
              刷新
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Title level={5}>主要按钮</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Button type="primary" size="small">小按钮</Button>
                  <Button type="primary">中按钮</Button>
                  <Button type="primary" size="large">大按钮</Button>
                </Space>
                <Space wrap>
                  <Button type="primary" loading>加载中</Button>
                  <Button type="primary" disabled>禁用状态</Button>
                  <Button type="primary" icon={<SettingOutlined />}>图标按钮</Button>
                </Space>
              </Space>
            </Col>
            
            <Col span={8}>
              <Title level={5}>次要按钮</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Button size="small">小按钮</Button>
                  <Button>中按钮</Button>
                  <Button size="large">大按钮</Button>
                </Space>
                <Space wrap>
                  <Button loading>加载中</Button>
                  <Button disabled>禁用状态</Button>
                  <Button icon={<DeleteOutlined />} danger>危险操作</Button>
                </Space>
              </Space>
            </Col>

            <Col span={8}>
              <Title level={5}>文本按钮</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap>
                  <Button type="text">文本按钮</Button>
                  <Button type="link">链接按钮</Button>
                  <Button type="dashed">虚线按钮</Button>
                </Space>
                <Space wrap>
                  <Button type="text" icon={<InfoCircleOutlined />}>信息</Button>
                  <Button type="link" disabled>禁用链接</Button>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        <Modal
          title="示例对话框"
          open={modalVisible}
          onOk={() => setModalVisible(false)}
          onCancel={() => setModalVisible(false)}
        >
          <p>这是一个示例对话框，展示 Modal 组件的用法。</p>
          <p>对话框内容可以包含各种组件和信息。</p>
        </Modal>
      </div>
    </div>
  );
};

export default UIShowcasePage;
