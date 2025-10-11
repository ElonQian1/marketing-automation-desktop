// src/components/universal-ui/DesignSystemPreview.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Universal UI 设计系统预览组件
 * 展示新的现代化设计系统各个组件的视觉效果
 */

import React from 'react';
import { 
  Modal, 
  Button, 
  Select, 
  Card, 
  Input, 
  Space, 
  Tag, 
  Alert, 
  Divider,
  Row,
  Col 
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  MobileOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import './styles/universal-ui-integration.css';

interface DesignSystemPreviewProps {
  visible: boolean;
  onCancel: () => void;
}

const DesignSystemPreview: React.FC<DesignSystemPreviewProps> = ({
  visible,
  onCancel
}) => {
  return (
    <Modal
      title="Universal UI 现代化设计系统预览"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      className="universal-page-finder"
    >
      <div className="universal-ui-container">
        
        {/* 设备连接面板演示 */}
        <div className="device-connection-panel">
          <div className="device-connection-header">
            <div className="device-connection-title">
              <MobileOutlined className="device-connection-title-icon" />
              <h3>设备连接</h3>
            </div>
            <div className="connection-status online">
              <div className="connection-status-dot"></div>
              已连接
            </div>
          </div>
          
          <div className="device-connection-content">
            {/* 设备选择器演示 */}
            <div className="device-selector-container">
              <label className="device-selector-label">选择设备</label>
              <div className="device-selector">
                <div className="device-selector-content">
                  <div className="device-selector-indicator online"></div>
                  <div className="device-selector-info">
                    <div className="device-selector-name">Pixel 6 Pro</div>
                    <div className="device-selector-details">Android 13 • API 33</div>
                  </div>
                </div>
                <div className="device-selector-arrow">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* 连接控制演示 */}
            <div className="connection-controls">
              <button className="connection-btn primary">
                <ReloadOutlined className="connection-btn-icon" />
                <span className="connection-btn-text">刷新设备</span>
              </button>
              <button className="connection-btn" data-tooltip="重新连接设备">
                <span className="connection-btn-icon">🔗</span>
                <span className="connection-btn-text">重新连接</span>
              </button>
              <button className="connection-btn warning">
                <span className="connection-btn-icon">⚡</span>
                <span className="connection-btn-text">ADB 重启</span>
              </button>
            </div>
          </div>
        </div>

        <Divider>Ant Design 组件现代化</Divider>

        {/* Ant Design 组件重设计演示 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="输入组件" className="modern-demo-card">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input 
                  placeholder="搜索设备或元素..."
                  prefix={<SearchOutlined />}
                />
                <Select 
                  placeholder="选择匹配策略"
                  style={{ width: '100%' }}
                  options={[
                    { value: 'standard', label: '标准匹配' },
                    { value: 'strict', label: '严格匹配' },
                    { value: 'relaxed', label: '宽松匹配' }
                  ]}
                />
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="按钮组件" className="modern-demo-card">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Button type="primary" icon={<CheckOutlined />}>
                    主要操作
                  </Button>
                  <Button icon={<ReloadOutlined />}>
                    刷新
                  </Button>
                  <Button danger icon={<CloseOutlined />}>
                    取消
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="状态指示器和标签">
              <Space wrap>
                <Tag color="blue">蓝色标签</Tag>
                <Tag color="green">成功状态</Tag>
                <Tag color="orange">警告状态</Tag>
                <Tag color="red">错误状态</Tag>
              </Space>
              
              <Divider />
              
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert 
                  message="信息提示" 
                  description="这是一个信息提示的示例。" 
                  type="info" 
                  showIcon 
                />
                <Alert 
                  message="成功提示" 
                  description="操作已成功完成。" 
                  type="success" 
                  showIcon 
                />
                <Alert 
                  message="警告提示" 
                  description="请注意这个警告信息。" 
                  type="warning" 
                  showIcon 
                />
                <Alert 
                  message="错误提示" 
                  description="发生了一个错误，请检查。" 
                  type="error" 
                  showIcon 
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 状态指示器演示 */}
        <Divider>状态指示器</Divider>
        <Space>
          <div className="universal-ui-status ready">
            <div className="universal-ui-status-dot"></div>
            就绪
          </div>
          <div className="universal-ui-status pending">
            <div className="universal-ui-status-dot"></div>
            连接中
          </div>
          <div className="universal-ui-status error">
            <div className="universal-ui-status-dot"></div>
            错误
          </div>
        </Space>

      </div>
    </Modal>
  );
};

export default DesignSystemPreview;