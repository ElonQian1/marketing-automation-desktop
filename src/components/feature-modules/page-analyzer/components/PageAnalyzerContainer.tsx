import React from 'react';
import { Layout, Row, Col, Card, Space, Button, Typography, Divider } from 'antd';
import { 
  AppstoreOutlined, 
  SettingOutlined, 
  SearchOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { usePageAnalyzerState } from '../hooks/usePageAnalyzerState';
import { ElementTree } from './ElementTree';
import { PropertyPanel } from './PropertyPanel';
import { UnifiedStrategyConfigurator } from '../../../universal-ui/strategy-selector';
import type { MatchCriteria, UIElement } from '../types';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

/**
 * 页面分析器容器组件Props
 */
export interface PageAnalyzerContainerProps {
  /** 初始XML内容 */
  initialXmlContent?: string;
  /** 设备信息 */
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
  };
  /** 匹配测试回调 */
  onMatchTest?: (criteria: MatchCriteria) => Promise<any>;
  /** 元素选择回调 */
  onElementSelect?: (element: UIElement | null) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 页面分析器容器组件
 * 整合元素树、属性面板、匹配策略选择器的主容器
 * 文件大小: ~180行
 */
export const PageAnalyzerContainer: React.FC<PageAnalyzerContainerProps> = ({
  initialXmlContent,
  deviceInfo,
  onMatchTest,
  onElementSelect,
  className,
}) => {
  const {
    // 状态
    xmlContent,
    elements,
    selectedElement,
    searchKeyword,
    filteredElements,
    matchCriteria,
    isLoading,
    error,
    statistics,
    
    // 操作方法
    setXmlContent,
    setSelectedElement,
    searchElements,
    setMatchCriteria,
    clearError,
    resetState,
  } = usePageAnalyzerState();

  // 初始化XML内容
  React.useEffect(() => {
    if (initialXmlContent) {
      setXmlContent(initialXmlContent);
    }
  }, [initialXmlContent, setXmlContent]);

  // 处理元素选择
  const handleElementSelect = (element: UIElement | null) => {
    setSelectedElement(element);
    onElementSelect?.(element);
  };

  // 处理匹配策略变化
  const handleMatchCriteriaChange = (criteria: MatchCriteria) => {
    setMatchCriteria(criteria);
  };

  // 处理匹配测试
  const handleMatchTest = async (criteria: MatchCriteria) => {
    if (onMatchTest) {
      try {
        const result = await onMatchTest(criteria);
        console.log('匹配测试结果:', result);
      } catch (error) {
        console.error('匹配测试失败:', error);
      }
    }
  };

  // 刷新页面数据
  const handleRefresh = () => {
    if (initialXmlContent) {
      setXmlContent(initialXmlContent);
    }
  };

  return (
    <div className={`page-analyzer-container ${className || ''}`}>
      {/* 头部工具栏 */}
      <Card size="small" style={{ marginBottom: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <AppstoreOutlined />
              <Title level={5} style={{ margin: 0 }}>
                页面分析器
              </Title>
              {deviceInfo && (
                <Text type="secondary">
                  设备: {deviceInfo.deviceName} ({deviceInfo.deviceId})
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                共 {statistics.totalElements} 个元素
              </Text>
              <Divider type="vertical" />
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={isLoading}
              >
                刷新
              </Button>
              <Button 
                size="small" 
                icon={<SettingOutlined />} 
                onClick={resetState}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
        
        {/* 错误提示 */}
        {error && (
          <div style={{ marginTop: 8 }}>
            <Text type="danger" style={{ fontSize: '12px' }}>
              错误: {error}
              <Button 
                type="link" 
                size="small" 
                onClick={clearError}
                style={{ padding: '0 4px' }}
              >
                清除
              </Button>
            </Text>
          </div>
        )}
      </Card>

      {/* 主要内容区域 */}
      <Layout 
        style={{ 
          background: 'var(--bg-light-base, #ffffff)',
          color: 'var(--text-inverse, #1e293b)'
        }}
        className="light-theme-force"
      >
        {/* 左侧元素树 */}
        <Sider 
          width={320} 
          style={{ 
            background: 'var(--bg-light-base, #ffffff)',
            color: 'var(--text-inverse, #1e293b)',
            borderRight: '1px solid #f0f0f0'
          }}
          className="light-theme-force"
        >
          <div style={{ padding: '0 8px' }}>
            <ElementTree
              elements={filteredElements}
              selectedElement={selectedElement}
              onElementSelect={handleElementSelect}
              searchKeyword={searchKeyword}
              onSearch={searchElements}
              size="small"
            />
          </div>
        </Sider>

        {/* 右侧面板区域 */}
        <Content style={{ padding: '0 8px' }}>
          <Row gutter={[8, 8]} style={{ height: '100%' }}>
            {/* 属性面板 */}
            <Col span={12}>
              <PropertyPanel
                selectedElement={selectedElement}
                showCopyButtons={true}
                compact={false}
              />
            </Col>
            
            {/* 匹配策略面板 */}
            <Col span={12}>
              <UnifiedStrategyConfigurator
                matchCriteria={matchCriteria}
                referenceElement={selectedElement}
                onChange={handleMatchCriteriaChange}
                onTestMatch={handleMatchTest}
                mode="compact"
              />
            </Col>
          </Row>
        </Content>
      </Layout>

      {/* 底部状态栏 */}
      <Card size="small" style={{ marginTop: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space split={<Divider type="vertical" />} style={{ fontSize: '12px' }}>
              <Text type="secondary">
                <SearchOutlined /> 显示: {statistics.filteredElements}/{statistics.totalElements}
              </Text>
              <Text type="secondary">
                可点击: {statistics.clickableElements}
              </Text>
              <Text type="secondary">
                可编辑: {statistics.editableElements}
              </Text>
              <Text type="secondary">
                有文本: {statistics.elementsWithText}
              </Text>
            </Space>
          </Col>
          <Col>
            {selectedElement && (
              <Text style={{ fontSize: '12px' }}>
                已选择: {selectedElement.type} 
                {selectedElement.text && ` - ${selectedElement.text.substring(0, 20)}${selectedElement.text.length > 20 ? '...' : ''}`}
              </Text>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};