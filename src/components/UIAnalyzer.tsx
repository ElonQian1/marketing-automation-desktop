// src/components/UIAnalyzer.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Checkbox,
  Alert,
  List,
  Tag,
  Collapse,
  Descriptions,
  Badge,
  message
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  BugOutlined,
  MobileOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface UIElement {
  text: string;
  resource_id: string;
  class: string;
  package: string;
  content_desc: string;
  clickable: boolean;
  bounds: string;
}

interface DeviceUIState {
  device_id: string;
  xml_content: string;
  elements: UIElement[];
  timestamp: string;
  page_type: string;
  suggested_action: string;
}

/**
 * 设备UI状态分析器 - 原生 Ant Design 实现
 * 提供设备UI元素分析和查找功能
 */
const UIAnalyzer: React.FC = () => {
  const [deviceId, setDeviceId] = useState('emulator-5554');
  const [uiState, setUiState] = useState<DeviceUIState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 读取UI状态
  const readUIState = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 开始读取设备UI状态:', deviceId);
      const result = await invoke<DeviceUIState>('read_device_ui_state', {
        deviceId: deviceId,
      });
      
      console.log('✅ UI状态读取成功:', result);
      setUiState(result);
      message.success('UI状态读取成功');
    } catch (err) {
      console.error('❌ UI状态读取失败:', err);
      const errorMsg = err as string;
      setError(errorMsg);
      message.error('UI状态读取失败');
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        readUIState();
      }, 3000); // 每3秒刷新一次
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, deviceId]);

  // 查找特定UI元素
  const findElements = async (elementType: string, searchValue: string) => {
    try {
      const elements = await invoke<UIElement[]>('find_ui_elements', {
        deviceId: deviceId,
        elementType: elementType,
        searchValue: searchValue,
      });
      
      console.log(`找到 ${elements.length} 个匹配元素:`, elements);
      message.success(`找到 ${elements.length} 个匹配的UI元素`);
    } catch (err) {
      console.error('查找UI元素失败:', err);
      setError(err as string);
      message.error('查找UI元素失败');
    }
  };

  // 渲染UI元素
  const renderElement = (element: UIElement) => (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Descriptions size="small" column={2}>
        <Descriptions.Item label="文本">
          {element.text || <Text type="secondary">(空)</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="可点击">
          {element.clickable ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : '❌'}
        </Descriptions.Item>
        <Descriptions.Item label="类名">
          <Text code style={{ fontSize: '11px' }}>{element.class}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="资源ID">
          <Text code style={{ fontSize: '11px' }}>{element.resource_id || '(无)'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="内容描述">
          {element.content_desc || <Text type="secondary">(无)</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="位置">
          <Text code style={{ fontSize: '11px' }}>{element.bounds}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const clickableElements = uiState?.elements.filter(e => e.clickable) || [];
  const textElements = uiState?.elements.filter(e => e.text.trim().length > 0) || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          <BugOutlined style={{ marginRight: 8 }} />
          设备UI状态分析器
        </Title>

        {/* 控制面板 */}
        <Card 
          size="small" 
          title={<><MobileOutlined style={{ marginRight: 8 }} />控制面板</>}
          style={{ marginBottom: 16 }}
        >
          <Space wrap>
            <Space>
              <Text strong>设备ID:</Text>
              <Input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="emulator-5554"
                style={{ width: 160 }}
              />
            </Space>
            
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={readUIState}
              loading={loading}
            >
              {loading ? '读取中...' : '读取UI状态'}
            </Button>

            <Checkbox 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            >
              自动刷新 (3秒)
            </Checkbox>
          </Space>

          {/* 快速查找工具 */}
          <div style={{ marginTop: 16 }}>
            <Text strong style={{ marginRight: 16 }}>快速查找:</Text>
            <Space wrap>
              <Button
                size="small"
                type="default"
                onClick={() => findElements('clickable', 'true')}
              >
                可点击元素
              </Button>
              <Button
                size="small"
                type="default"
                onClick={() => findElements('text', 'vcf')}
              >
                VCF相关
              </Button>
              <Button
                size="small"
                type="default"
                onClick={() => findElements('text', '联系人')}
              >
                联系人相关
              </Button>
            </Space>
          </div>
        </Card>

        {/* 错误显示 */}
        {error && (
          <Alert
            message="错误信息"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* UI状态显示 */}
        {uiState && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 状态概览 */}
            <Card 
              size="small" 
              title="📊 状态概览" 
              type="inner"
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Badge status="processing" text="设备ID" />
                  <br />
                  <Text code>{uiState.device_id}</Text>
                </Col>
                <Col span={6}>
                  <Badge status="default" text="读取时间" />
                  <br />
                  <Text code>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {uiState.timestamp}
                  </Text>
                </Col>
                <Col span={6}>
                  <Badge status="success" text="页面类型" />
                  <br />
                  <Tag color="blue">{uiState.page_type}</Tag>
                </Col>
                <Col span={6}>
                  <Badge status="warning" text="建议操作" />
                  <br />
                  <Tag color="purple">{uiState.suggested_action}</Tag>
                </Col>
              </Row>
            </Card>

            {/* 分类显示 */}
            <Collapse>
              <Panel 
                header={`👆 可点击元素 (${clickableElements.length} 个)`} 
                key="clickable"
              >
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {clickableElements.slice(0, 10).map((element, index) => (
                    <div key={index}>
                      {renderElement(element)}
                    </div>
                  ))}
                  {clickableElements.length > 10 && (
                    <Text type="secondary">
                      ... 还有 {clickableElements.length - 10} 个元素
                    </Text>
                  )}
                </div>
              </Panel>

              <Panel 
                header={`📝 文本元素 (${textElements.length} 个)`} 
                key="text"
              >
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {textElements.slice(0, 10).map((element, index) => (
                    <div key={index}>
                      {renderElement(element)}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel 
                header={`🔧 XML源码 (${uiState.xml_content.length} 字符)`} 
                key="xml"
              >
                <TextArea
                  value={uiState.xml_content}
                  readOnly
                  rows={10}
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </Panel>
            </Collapse>
          </Space>
        )}

        {/* 使用说明 */}
        <Card 
          size="small" 
          title="💡 使用说明" 
          type="inner" 
          style={{ marginTop: 16 }}
        >
          <List
            size="small"
            dataSource={[
              '确保设备已连接并可通过ADB访问',
              '点击"读取UI状态"可获取当前屏幕的所有UI元素',
              '页面类型会自动识别当前应用界面',
              '建议操作会根据当前状态推荐下一步操作',
              '可以开启自动刷新实时监控UI变化'
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text>• {item}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Card>
    </div>
  );
};

export default UIAnalyzer;

