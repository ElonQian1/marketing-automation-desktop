/**
 * 发现元素调试工具
 * 用于测试和验证层次结构发现功能
 */

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Collapse, Tag, Alert } from 'antd';
import { useElementDiscovery } from './useElementDiscovery';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { DiscoveredElement } from './types';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ElementDiscoveryDebuggerProps {
  allElements: UIElement[];
  selectedElement?: UIElement;
}

export const ElementDiscoveryDebugger: React.FC<ElementDiscoveryDebuggerProps> = ({
  allElements,
  selectedElement
}) => {
  const [testElement, setTestElement] = useState<UIElement | null>(selectedElement || null);
  const { discoveryResult, isAnalyzing, error, discoverElements } = useElementDiscovery(allElements);

  const handleAnalyze = () => {
    if (testElement) {
      console.log('🧪 开始调试分析:', testElement.id);
      discoverElements(testElement);
    }
  };

  const renderElement = (discoveredElement: DiscoveredElement, index: number) => {
    const element = discoveredElement.element;
    const isHidden = element.bounds.left === 0 && element.bounds.top === 0 && 
                     element.bounds.right === 0 && element.bounds.bottom === 0;

    return (
      <Card 
        key={`${element.id}-${index}`}
        size="small" 
        style={{ 
          marginBottom: '8px',
          backgroundColor: isHidden ? '#fff7e6' : '#f6ffed'
        }}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text strong>ID:</Text> <Text code>{element.id}</Text>
            <Tag color={discoveredElement.isClickable ? 'green' : 'default'} style={{ marginLeft: '8px' }}>
              {discoveredElement.isClickable ? '可点击' : '不可点击'}
            </Tag>
            {isHidden && <Tag color="orange">隐藏元素</Tag>}
            {discoveredElement.hasText && <Tag color="blue">有文本</Tag>}
          </div>
          
          {element.text && (
            <div>
              <Text strong>文本:</Text> <Text>"{element.text}"</Text>
            </div>
          )}
          
          <div>
            <Text strong>关系:</Text> <Tag color="purple">{discoveredElement.relationship}</Tag>
            <Text strong>置信度:</Text> <Text>{(discoveredElement.confidence * 100).toFixed(1)}%</Text>
            {discoveredElement.depth && (
              <>
                <Text strong> 深度:</Text> <Text>{discoveredElement.depth}</Text>
              </>
            )}
          </div>
          
          <div>
            <Text strong>坐标:</Text> <Text code>
              [{element.bounds.left},{element.bounds.top}] - [{element.bounds.right},{element.bounds.bottom}]
            </Text>
          </div>
          
          {element.resource_id && (
            <div>
              <Text strong>Resource ID:</Text> <Text code>{element.resource_id}</Text>
            </div>
          )}
          
          <div>
            <Text strong>原因:</Text> <Text type="secondary">{discoveredElement.reason}</Text>
          </div>
        </Space>
      </Card>
    );
  };

  return (
    <Card title="🔍 元素发现调试器" style={{ margin: '16px 0' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 测试选择的元素信息 */}
        {testElement && (
          <Alert
            message="当前测试元素"
            description={
              <div>
                <Text strong>ID:</Text> {testElement.id}<br/>
                <Text strong>文本:</Text> {testElement.text || '无'}<br/>
                <Text strong>可点击:</Text> {testElement.is_clickable ? '是' : '否'}<br/>
                <Text strong>坐标:</Text> [{testElement.bounds.left},{testElement.bounds.top}] - [{testElement.bounds.right},{testElement.bounds.bottom}]
              </div>
            }
            type="info"
            style={{ marginBottom: '16px' }}
          />
        )}

        <Button 
          type="primary" 
          onClick={handleAnalyze}
          loading={isAnalyzing}
          disabled={!testElement}
        >
          🔍 分析元素层次结构
        </Button>

        {error && (
          <Alert
            message="分析错误"
            description={error}
            type="error"
            showIcon
          />
        )}

        {discoveryResult && (
          <div>
            <Title level={4}>📊 发现结果</Title>
            
            <Collapse defaultActiveKey={['parents', 'children']} style={{ marginTop: '16px' }}>
              {/* 自己信息 */}
              <Panel header={`📍 自己 (${discoveryResult.selfElement ? 1 : 0})`} key="self">
                {discoveryResult.selfElement && renderElement(discoveryResult.selfElement, 0)}
              </Panel>

              {/* 父元素 */}
              <Panel 
                header={`⬆️ 父元素 (${discoveryResult.parentElements.length})`} 
                key="parents"
              >
                {discoveryResult.parentElements.length > 0 ? (
                  discoveryResult.parentElements.map((parent, index) => renderElement(parent, index))
                ) : (
                  <Text type="secondary">未发现父元素</Text>
                )}
              </Panel>

              {/* 子元素 */}
              <Panel 
                header={`⬇️ 子元素 (${discoveryResult.childElements.length})`} 
                key="children"
                extra={
                  <span>
                    <Tag color="orange">
                      隐藏: {discoveryResult.childElements.filter(c => 
                        c.element.bounds.left === 0 && c.element.bounds.top === 0 && 
                        c.element.bounds.right === 0 && c.element.bounds.bottom === 0
                      ).length}
                    </Tag>
                  </span>
                }
              >
                {discoveryResult.childElements.length > 0 ? (
                  discoveryResult.childElements.map((child, index) => renderElement(child, index))
                ) : (
                  <Text type="secondary">未发现子元素</Text>
                )}
              </Panel>

              {/* 推荐匹配 */}
              <Panel 
                header={`💡 智能推荐 (${discoveryResult.recommendedMatches.length})`} 
                key="recommended"
              >
                {discoveryResult.recommendedMatches.length > 0 ? (
                  discoveryResult.recommendedMatches.map((rec, index) => renderElement(rec, index))
                ) : (
                  <Text type="secondary">无推荐匹配</Text>
                )}
              </Panel>
            </Collapse>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default ElementDiscoveryDebugger;