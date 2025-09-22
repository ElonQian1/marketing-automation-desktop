/**
 * XML检查器组件
 * 用于显示元素的XML上下文信息和节点树
 */

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tabs, 
  Tree, 
  Card, 
  Descriptions, 
  Typography, 
  Space, 
  Tag, 
  Button,
  Alert,
  Divider,
  Input
} from 'antd';
import { 
  BranchesOutlined,
  FileTextOutlined,
  EyeOutlined,
  SearchOutlined,
  HighlightOutlined
} from '@ant-design/icons';
import { EnhancedUIElement, XmlInspectorData } from '../enhanced-element-info/types';

const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Search } = Input;

interface XmlInspectorProps {
  visible: boolean;
  onClose: () => void;
  enhancedElement: EnhancedUIElement | null;
  // 🆕 兼容简化格式的额外参数
  xmlContent?: string;
  xmlCacheId?: string;
  elementInfo?: {
    text?: string;
    element_type?: string;
    bounds?: any;
    resource_id?: string;
    content_desc?: string;
  };
}

interface TreeNodeData {
  title: string;
  key: string;
  children?: TreeNodeData[];
  nodeIndex: number;
  isTarget?: boolean;
  nodeInfo: {
    className: string;
    text?: string;
    contentDesc?: string;
    bounds: string;
    clickable: boolean;
  };
}

export const XmlInspectorModal: React.FC<XmlInspectorProps> = ({
  visible,
  onClose,
  enhancedElement,
  xmlContent: propXmlContent,
  xmlCacheId: propXmlCacheId,
  elementInfo
}) => {
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [xmlContent, setXmlContent] = useState('');
  const [xmlCacheId, setXmlCacheId] = useState('');

  // 当元素变化时重新构建树结构
  useEffect(() => {
    if (visible) {
      // 🔍 兼容多种数据源
      const sourceXmlContent = enhancedElement?.xmlContext?.xmlSourceContent || propXmlContent || '';
      const sourceCacheId = enhancedElement?.xmlContext?.xmlCacheId || propXmlCacheId || 'unknown';
      
      if (sourceXmlContent) {
        setXmlContent(sourceXmlContent);
        setXmlCacheId(sourceCacheId);
        buildTreeFromXml(sourceXmlContent);
        
        // 如果有完整的增强元素信息，自动定位到目标节点
        if (enhancedElement?.nodePath?.nodeIndex) {
          const targetKey = `node_${enhancedElement.nodePath.nodeIndex}`;
          setSelectedNodeKey(targetKey);
          expandToNode(targetKey);
        }
      } else {
        console.warn('⚠️ 没有找到XML内容，无法构建树结构');
      }
    }
  }, [enhancedElement, propXmlContent, propXmlCacheId, visible]);

  /**
   * 从XML构建树结构
   */
  const buildTreeFromXml = (xmlContentSource: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContentSource, 'text/xml');
      
      const rootNodes = Array.from(xmlDoc.children);
      const tree = rootNodes.map(node => buildTreeNode(node, 0));
      
      setTreeData(tree);
    } catch (error) {
      console.error('XML树构建失败:', error);
      setTreeData([]);
    }
  };

  /**
   * 递归构建树节点
   */
  const buildTreeNode = (xmlNode: Element, nodeIndex: number): TreeNodeData => {
    const className = xmlNode.getAttribute('class') || xmlNode.nodeName;
    const text = xmlNode.getAttribute('text') || '';
    const contentDesc = xmlNode.getAttribute('content-desc') || '';
    const bounds = xmlNode.getAttribute('bounds') || '';
    const clickable = xmlNode.getAttribute('clickable') === 'true';
    
    // 判断是否为目标节点
    const isTarget = enhancedElement && nodeIndex === enhancedElement.nodePath.nodeIndex;
    
    // 构建显示标题
    let title = className.split('.').pop() || className;
    if (text) {
      title += ` ("${text}")`;
    } else if (contentDesc) {
      title += ` [${contentDesc}]`;
    }
    
    if (isTarget) {
      title = `🎯 ${title}`;
    }

    // 处理子节点
    const children: TreeNodeData[] = [];
    let childIndex = nodeIndex + 1;
    
    for (const child of Array.from(xmlNode.children)) {
      if (child.nodeName.toLowerCase() === 'node') {
        const childNode = buildTreeNode(child, childIndex);
        children.push(childNode);
        childIndex += countNodes(child) + 1;
      }
    }

    return {
      title,
      key: `node_${nodeIndex}`,
      nodeIndex,
      isTarget,
      children: children.length > 0 ? children : undefined,
      nodeInfo: {
        className,
        text: text || undefined,
        contentDesc: contentDesc || undefined,
        bounds,
        clickable
      }
    };
  };

  /**
   * 计算节点总数（用于索引计算）
   */
  const countNodes = (xmlNode: Element): number => {
    let count = 0;
    for (const child of Array.from(xmlNode.children)) {
      if (child.nodeName.toLowerCase() === 'node') {
        count += 1 + countNodes(child);
      }
    }
    return count;
  };

  /**
   * 展开到指定节点
   */
  const expandToNode = (targetKey: string) => {
    // 找到目标节点的路径并展开所有父节点
    const findPath = (nodes: TreeNodeData[], key: string, path: string[] = []): string[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, node.key];
        if (node.key === key) {
          return currentPath;
        }
        if (node.children) {
          const found = findPath(node.children, key, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findPath(treeData, targetKey);
    if (path) {
      setExpandedKeys(path.slice(0, -1)); // 展开所有父节点
    }
  };

  /**
   * 查找包含指定节点的详细信息
   */
  const findNodeByKey = (nodes: TreeNodeData[], key: string): TreeNodeData | null => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = selectedNodeKey ? findNodeByKey(treeData, selectedNodeKey) : null;

  /**
   * 渲染节点详情
   */
  const renderNodeDetails = () => {
    if (!selectedNode) {
      return <Text type="secondary">请在左侧节点树中选择一个节点</Text>;
    }

    const isTargetNode = selectedNode.isTarget;

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {isTargetNode && (
          <Alert
            message="🎯 这是您选中的目标元素"
            description="此节点对应您在可视化视图中选择的UI元素"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Card title="节点基础信息" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="节点索引">
              {selectedNode.nodeIndex}
            </Descriptions.Item>
            <Descriptions.Item label="类名">
              <Text code>{selectedNode.nodeInfo.className}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="文本内容">
              {selectedNode.nodeInfo.text ? (
                <Text mark>"{selectedNode.nodeInfo.text}"</Text>
              ) : (
                <Text type="secondary">无</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="内容描述">
              {selectedNode.nodeInfo.contentDesc ? (
                <Text italic>[{selectedNode.nodeInfo.contentDesc}]</Text>
              ) : (
                <Text type="secondary">无</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="边界坐标">
              <Text code>{selectedNode.nodeInfo.bounds}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="可点击性">
              {selectedNode.nodeInfo.clickable ? (
                <Tag color="green">可点击</Tag>
              ) : (
                <Tag color="default">不可点击</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {isTargetNode && enhancedElement && (
          <Card title="增强分析信息" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="XPath路径">
                <Text code style={{ fontSize: '12px' }}>
                  {enhancedElement.nodePath.xpath}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="节点深度">
                {enhancedElement.nodePath.depth}
              </Descriptions.Item>
              <Descriptions.Item label="XML缓存ID">
                <Text code>{enhancedElement.xmlContext.xmlCacheId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="应用包名">
                <Text code>{enhancedElement.xmlContext.packageName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="页面信息">
                {enhancedElement.xmlContext.pageInfo.appName} - {enhancedElement.xmlContext.pageInfo.pageName}
              </Descriptions.Item>
              {enhancedElement.smartAnalysis && (
                <Descriptions.Item label="智能分析置信度">
                  <Tag color={enhancedElement.smartAnalysis.confidence > 80 ? 'green' : 'orange'}>
                    {enhancedElement.smartAnalysis.confidence}%
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}
      </Space>
    );
  };

  /**
   * 渲染XML源码
   */
  const renderXmlSource = () => {
    return (
      <div style={{ height: '100%' }}>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索XML内容..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 300 }}
          />
          {enhancedElement && (
            <Button
              icon={<HighlightOutlined />}
              onClick={() => {
                // 高亮显示目标节点相关的XML
                const targetIndex = enhancedElement.nodePath.nodeIndex;
                setSearchValue(`node[${targetIndex}]`);
              }}
            >
              高亮目标元素
            </Button>
          )}
        </Space>
        
        <TextArea
          value={xmlContent}
          readOnly
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            height: 'calc(100% - 60px)',
            backgroundColor: '#f5f5f5'
          }}
        />
      </div>
    );
  };

  // 🆕 检查是否有可用的数据来渲染模态框
  const hasValidData = !!(
    enhancedElement ||           // 完整增强元素
    propXmlContent ||           // 外部传入的XML内容
    elementInfo                 // 基础元素信息
  );

  if (!hasValidData) {
    return (
      <Modal
        title="XML检查器"
        visible={visible}
        onCancel={onClose}
        width={600}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>
        ]}
      >
        <Alert
          message="无可用数据"
          description="没有找到XML内容或元素信息，无法显示检查器界面。"
          type="warning"
          showIcon
        />
      </Modal>
    );
  }

  // 获取标题信息（兼容不同数据源）
  const modalTitle = enhancedElement?.xmlContext?.pageInfo?.appName || 
                    (elementInfo?.element_type ? `${elementInfo.element_type} 元素` : '') ||
                    'XML检查器';

  return (
    <Modal
      title={
        <Space>
          <BranchesOutlined />
          XML检查器 - {modalTitle}
          {xmlCacheId && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {xmlCacheId}
            </Tag>
          )}
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      width={1200}
      height={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      style={{ top: 20 }}
    >
      <div style={{ height: 700 }}>
        <Tabs defaultActiveKey="tree" style={{ height: '100%' }}>
          <TabPane 
            tab={
              <Space>
                <BranchesOutlined />
                节点树视图
              </Space>
            } 
            key="tree"
          >
            <div style={{ display: 'flex', height: 650 }}>
              {/* 左侧：节点树 */}
              <div style={{ flex: '1 1 50%', paddingRight: 12, borderRight: '1px solid #f0f0f0' }}>
                <Title level={5}>XML节点树</Title>
                <Tree
                  treeData={treeData}
                  selectedKeys={[selectedNodeKey]}
                  expandedKeys={expandedKeys}
                  onSelect={(keys) => {
                    setSelectedNodeKey(keys[0] as string);
                  }}
                  onExpand={(keys) => {
                    setExpandedKeys(keys as string[]);
                  }}
                  style={{ 
                    backgroundColor: '#f9f9f9',
                    padding: 8,
                    height: 600,
                    overflow: 'auto'
                  }}
                />
              </div>
              
              {/* 右侧：节点详情 */}
              <div style={{ flex: '1 1 50%', paddingLeft: 12 }}>
                <Title level={5}>节点详情</Title>
                <div style={{ height: 600, overflow: 'auto' }}>
                  {renderNodeDetails()}
                </div>
              </div>
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <FileTextOutlined />
                XML源码
              </Space>
            } 
            key="source"
          >
            {renderXmlSource()}
          </TabPane>
        </Tabs>
      </div>
    </Modal>
  );
};

export default XmlInspectorModal;