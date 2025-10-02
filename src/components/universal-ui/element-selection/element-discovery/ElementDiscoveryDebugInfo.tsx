/**
 * 元素发现调试信息组件
 * 显示层次结构分析的详细信息，帮助调试子元素发现问题
 */

import React from 'react';
import { Card, Typography, Tag, Space, Alert, Collapse } from 'antd';
import { BugOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { ElementDiscoveryResult } from './types';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface DebugInfoProps {
  targetElement: UIElement;
  discoveryResult: ElementDiscoveryResult | null;
  hierarchyStats?: {
    totalNodes: number;
    maxDepth: number;
    leafNodes: number;
    rootNodes: number;
  };
}

export const ElementDiscoveryDebugInfo: React.FC<DebugInfoProps> = ({
  targetElement,
  discoveryResult,
  hierarchyStats
}) => {
  
  const renderElementSummary = (element: UIElement) => (
    <Space direction="vertical" size={4}>
      <Text strong>ID: {element.id}</Text>
      <Text>类型: {element.element_type}</Text>
      {element.text && <Text>文本: "{element.text}"</Text>}
      {element.resource_id && <Text>资源ID: {element.resource_id}</Text>}
      <Text>边界: [{element.bounds.left}, {element.bounds.top}, {element.bounds.right}, {element.bounds.bottom}]</Text>
    </Space>
  );

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          <Text strong>调试信息</Text>
        </Space>
      }
      size="small"
      style={{ marginTop: 16 }}
    >
      <Collapse ghost>
        <Panel header="目标元素信息" key="target">
          {renderElementSummary(targetElement)}
        </Panel>

        {hierarchyStats && (
          <Panel header="层次结构统计" key="hierarchy">
            <Space direction="vertical">
              <Text>总节点数: <Tag>{hierarchyStats.totalNodes}</Tag></Text>
              <Text>最大深度: <Tag color={hierarchyStats.maxDepth > 1 ? 'green' : 'red'}>
                {hierarchyStats.maxDepth}
              </Tag></Text>
              <Text>叶子节点数: <Tag>{hierarchyStats.leafNodes}</Tag></Text>
              <Text>根节点数: <Tag color={hierarchyStats.rootNodes === 1 ? 'green' : 'orange'}>
                {hierarchyStats.rootNodes}
              </Tag></Text>
              
              {hierarchyStats.maxDepth === 1 && (
                <Alert
                  message="层次结构可能有问题"
                  description="最大深度为1表明所有元素可能被错误地扁平化为单层结构"
                  type="warning"
                  showIcon
                  style={{ fontSize: 12 }}
                />
              )}
            </Space>
          </Panel>
        )}

        {discoveryResult && (
          <Panel header="发现结果统计" key="results">
            <Space direction="vertical">
              <Text>
                父元素: <Tag color="blue">{discoveryResult.parentElements.length}</Tag>
                {discoveryResult.parentElements.length > 0 && (
                  <span style={{ marginLeft: 8 }}>
                    {discoveryResult.parentElements.map((p, i) => (
                      <Tag key={i} color="cyan" style={{ fontSize: 10 }}>
                        {p.relationship}
                      </Tag>
                    ))}
                  </span>
                )}
              </Text>
              
              <Text>
                子元素: <Tag color={discoveryResult.childElements.length > 0 ? 'green' : 'red'}>
                  {discoveryResult.childElements.length}
                </Tag>
                {discoveryResult.childElements.length > 0 && (
                  <span style={{ marginLeft: 8 }}>
                    {discoveryResult.childElements.map((c, i) => (
                      <Tag key={i} color="lime" style={{ fontSize: 10 }}>
                        {c.relationship}
                      </Tag>
                    ))}
                  </span>
                )}
              </Text>

              <Text>推荐匹配: <Tag>{discoveryResult.recommendedMatches.length}</Tag></Text>

              {discoveryResult.childElements.length === 0 && (
                <Alert
                  message="未发现子元素"
                  description="可能原因：1) 目标元素确实没有子元素 2) 层次结构分析有误 3) 子元素查找逻辑问题"
                  type="info"
                  showIcon
                  style={{ fontSize: 12 }}
                />
              )}
            </Space>
          </Panel>
        )}

        {discoveryResult && discoveryResult.childElements.length > 0 && (
          <Panel header="子元素详情" key="children-details">
            <Space direction="vertical" style={{ width: '100%' }}>
              {discoveryResult.childElements.slice(0, 5).map((child, index) => (
                <Card key={index} size="small" style={{ fontSize: 12 }}>
                  <Space direction="vertical" size={2}>
                    <Text strong>{child.element.id}</Text>
                    <Text>关系: <Tag color="green">{child.relationship}</Tag></Text>
                    <Text>置信度: {(child.confidence * 100).toFixed(1)}%</Text>
                    {child.element.text && (
                      <Text>文本: "<Text code>{child.element.text}</Text>"</Text>
                    )}
                    <Text type="secondary">原因: {child.reason}</Text>
                  </Space>
                </Card>
              ))}
              {discoveryResult.childElements.length > 5 && (
                <Text type="secondary">...还有 {discoveryResult.childElements.length - 5} 个子元素</Text>
              )}
            </Space>
          </Panel>
        )}
      </Collapse>
    </Card>
  );
};

export default ElementDiscoveryDebugInfo;