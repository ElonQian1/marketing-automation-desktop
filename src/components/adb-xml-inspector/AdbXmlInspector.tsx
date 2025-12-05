// src/components/adb-xml-inspector/AdbXmlInspector.tsx
// module: adb-xml-inspector | layer: ui | role: main-component
// summary: ADB XML检查器主组件 - 可视化展示和分析Android UI层级结构（调试工具）
// 
// 📍 调用链: ElementNameEditor → TabPane("XML检查器") → AdbXmlInspector
// 📍 用途: 开发者/高级用户调试XML结构、生成XPath的工具
// 📍 数据类型: UiNode (原始XML树结构)
// ⚠️ 注意: 这是独立的调试工具，与以下【元素选择器】组件不同：
//    - universal-ui/views/grid-view/ (智能页面查找器-网格模式)
//    - universal-ui/views/visual-view/ (智能页面查找器-可视化模式)

/**
 * ADB XML检查器主组件
 * 用于可视化展示和分析Android UiAutomator导出的XML层级结构
 * 
 * 功能特性：
 * - XML解析与树状结构展示
 * - 屏幕预览与节点可视化
 * - 支持正确的层级渲染（DrawerLayout、Dialog等覆盖层）
 * - 点击预览区域可选择最顶层节点
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Alert,
  message,
  Tooltip,
  Divider
} from 'antd';
import {
  FileSearchOutlined,
  ReloadOutlined,
  SearchOutlined,
  CopyOutlined,
  EyeOutlined,
  BugOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { UiNode, AdbXmlInspectorProps } from './types';
import {
  parseBounds,
  getNodeLabel,
  buildXPath,
  parseUiAutomatorXml,
  attachParents,
  matchNode,
  getDemoXml,
  inferScreenSize,
} from './utils';
import { LayerAnalyzer, RenderableNode, LayerAnalysisResult } from './rendering';
import './styles.css';

const { Text } = Typography;
const { TextArea } = Input;

// =============== 子组件 ===============

/** 小徽章组件 */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <Tag style={{ fontSize: '10px', margin: 0, padding: '0 4px', lineHeight: '18px' }}>
      {children}
    </Tag>
  );
}

/** 树节点组件 */
interface TreeRowProps {
  node: UiNode;
  depth: number;
  selected: UiNode | null;
  onSelect: (n: UiNode) => void;
  filter: string;
}

function TreeRow({ node, depth, selected, onSelect, filter }: TreeRowProps) {
  const [open, setOpen] = useState(depth <= 2); // 初始展开前两层
  const label = getNodeLabel(node);
  const hasChildren = node.children.length > 0;
  const matched = matchNode(node, filter);

  return (
    <div>
      <div
        style={{
          paddingLeft: depth * 12 + 8,
          padding: '4px 8px',
          cursor: 'pointer',
          backgroundColor: selected === node ? 'rgba(24, 144, 255, 0.2)' : 'transparent',
          border: selected === node ? '1px solid #1890ff' : '1px solid transparent',
          borderRadius: '4px',
          marginBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => onSelect(node)}
        onMouseEnter={(e) => {
          if (selected !== node) {
            e.currentTarget.style.backgroundColor = 'var(--dark-bg-hover, #333333)';
          }
        }}
        onMouseLeave={(e) => {
          if (selected !== node) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Button
          size="small"
          type="text"
          style={{ 
            minWidth: '20px', 
            height: '20px', 
            padding: 0,
            opacity: hasChildren ? 1 : 0,
            pointerEvents: hasChildren ? 'auto' : 'none'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          title={open ? "折叠" : "展开"}
        >
          <span style={{ 
            fontSize: '10px', 
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block'
          }}>
            ▶
          </span>
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
          <Text 
            style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {label}
          </Text>
          <Badge>{node.attrs["class"] || node.tag}</Badge>
          {node.attrs["resource-id"] && (
            <Badge>id:{node.attrs["resource-id"].split("/").pop()}</Badge>
          )}
          {node.attrs["clickable"] === "true" && <Badge>clickable</Badge>}
          {!matched && filter && <Badge>不匹配</Badge>}
        </div>
      </div>
      {open && (
        <div>
          {node.children.map((c, i) => (
            <TreeRow 
              key={i} 
              node={c} 
              depth={depth + 1} 
              selected={selected} 
              onSelect={onSelect} 
              filter={filter} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 节点详情卡片 */
interface NodeDetailProps {
  node: UiNode | null;
}

function NodeDetail({ node }: NodeDetailProps) {
  if (!node) {
    return (
      <Card 
        title={
          <Space>
            <EyeOutlined />
            节点详情
          </Space>
        }
        size="small"
        style={{ height: 'fit-content' }}
      >
        <Text type="secondary">选择一个节点查看详情…</Text>
      </Card>
    );
  }

  const xPath = buildXPath(node);
  const mainFields = [
    "resource-id",
    "text",
    "content-desc",
    "class",
    "package",
    "bounds",
    "clickable",
    "enabled",
    "visible-to-user",
    "index",
  ];
  const restKeys = Object.keys(node.attrs).filter(k => !mainFields.includes(k));

  const handleCopyXPath = () => {
    navigator.clipboard.writeText(xPath).then(() => {
      message.success('XPath已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <EyeOutlined />
            节点详情
          </Space>
          <Tooltip title="复制XPath到剪贴板">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyXPath}
            >
              复制XPath
            </Button>
          </Tooltip>
        </div>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* XPath显示 */}
        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>XPath路径:</Text>
          <div style={{ 
            marginTop: '4px', 
            padding: '8px', 
            background: 'var(--dark-bg-tertiary, #1f1f1f)', 
            border: '1px solid var(--dark-border-primary, #404040)', 
            borderRadius: '4px',
            fontSize: '11px', 
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            lineHeight: 1.4,
            color: 'var(--dark-text-primary, #ffffff)'
          }}>
            {xPath}
          </div>
        </div>

        {/* 主要字段 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          {mainFields.map((k) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600 }}>{k}:</Text>
              <Text style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {node.attrs[k] || <span style={{ color: '#bfbfbf' }}>-</span>}
              </Text>
            </div>
          ))}
        </div>

        {/* 其他属性 */}
        {restKeys.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div>
              <Text style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>其他属性</Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                {restKeys.map(k => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600 }}>{k}:</Text>
                    <Text style={{ fontSize: '12px', wordBreak: 'break-all' }}>{node.attrs[k]}</Text>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Space>
    </Card>
  );
}

/** 屏幕预览卡片 - 使用LayerAnalyzer进行正确的层级渲染 */
interface ScreenPreviewProps {
  root: UiNode | null;
  selected: UiNode | null;
  onNodeSelect?: (node: UiNode) => void;
}

function ScreenPreview({ root, selected, onNodeSelect }: ScreenPreviewProps) {
  // 使用 LayerAnalyzer 进行层级分析
  const analysisResult = useMemo<LayerAnalysisResult>(
    () => LayerAnalyzer.analyze(root), 
    [root]
  );
  
  const { renderOrder, screenSize, metadata } = analysisResult;

  // 画布尺寸
  const viewW = 220;
  const scale = screenSize.width > 0 ? viewW / screenSize.width : 1;
  const viewH = Math.max(80, Math.round(screenSize.height * scale));

  /**
   * 处理预览区域点击 - 选择最顶层节点
   */
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNodeSelect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;
    
    // 使用 LayerAnalyzer 进行点击测试，找到最顶层节点
    const hitResult = LayerAnalyzer.hitTest(renderOrder, {
      point: { x: clickX, y: clickY },
      topMostOnly: true,
    });
    
    if (hitResult.topMost) {
      onNodeSelect(hitResult.topMost.node);
    }
  }, [renderOrder, scale, onNodeSelect]);

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <BugOutlined />
            屏幕预览
          </Space>
          <Space size={4}>
            {metadata.hasDrawerLayout && (
              <Tooltip title="检测到 DrawerLayout">
                <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>Drawer</Tag>
              </Tooltip>
            )}
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {screenSize.width}×{screenSize.height}
            </Text>
          </Space>
        </div>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* 层级统计信息 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          fontSize: '10px', 
          color: 'var(--dark-text-secondary, #a0a0a0)' 
        }}>
          <span>节点: {metadata.totalNodes}</span>
          <span>可点击: {metadata.clickableNodes}</span>
          {analysisResult.overlayCount > 0 && (
            <span style={{ color: '#faad14' }}>覆盖层: {analysisResult.overlayCount}</span>
          )}
        </div>
        
        {/* 可视化预览区域 */}
        <div
          onClick={handlePreviewClick}
          style={{ 
            position: 'relative',
            background: 'var(--dark-bg-tertiary, #1f1f1f)',
            borderRadius: '6px',
            border: '1px solid var(--dark-border-primary, #404040)',
            overflow: 'hidden',
            width: viewW,
            height: viewH,
            minHeight: 120,
            margin: '0 auto',
            cursor: 'crosshair',
          }}
        >
          {/* 按 zIndex 顺序渲染节点（先画底层，后画顶层） */}
          {renderOrder.map((item, i) => {
            const { node, bounds, zIndex, isOverlay, semanticType } = item;
            const isSelected = node === selected;
            
            // 为覆盖层节点添加特殊样式
            const overlayStyle = isOverlay ? {
              borderColor: '#faad14',
              borderStyle: 'dashed' as const,
            } : {};
            
            return (
              <div
                key={`${zIndex}-${i}`}
                style={{
                  position: 'absolute',
                  border: isSelected 
                    ? '2px solid #1890ff' 
                    : `1px solid ${isOverlay ? '#faad14' : '#d9d9d9'}`,
                  borderStyle: isOverlay && !isSelected ? 'dashed' : 'solid',
                  backgroundColor: isSelected 
                    ? 'rgba(24, 144, 255, 0.15)' 
                    : isOverlay 
                      ? 'rgba(250, 173, 20, 0.05)'
                      : 'transparent',
                  boxShadow: isSelected 
                    ? '0 0 0 2px rgba(24, 144, 255, 0.3)' 
                    : 'none',
                  left: Math.round(bounds.x1 * scale),
                  top: Math.round(bounds.y1 * scale),
                  width: Math.max(1, Math.round(bounds.w * scale)),
                  height: Math.max(1, Math.round(bounds.h * scale)),
                  // 使用实际的 zIndex 确保正确的层叠顺序
                  zIndex: zIndex,
                  pointerEvents: 'none', // 让点击穿透到容器，由容器统一处理
                  transition: 'all 0.15s ease',
                  ...overlayStyle,
                }}
                title={`${getNodeLabel(node)} (z:${zIndex})`}
              />
            );
          })}
          
          {renderOrder.length === 0 && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#bfbfbf', 
              fontSize: '12px' 
            }}>
              无可视化元素
            </div>
          )}
        </div>
        
        {/* 选中节点信息 */}
        {selected?.attrs["bounds"] && (
          <div style={{ fontSize: '11px', color: 'var(--dark-text-secondary, #e6e6e6)' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>选中元素bounds:</Text>
            <div style={{ 
              marginTop: '4px', 
              padding: '4px 6px', 
              background: 'var(--dark-bg-tertiary, #1f1f1f)', 
              border: '1px solid var(--dark-border-primary, #404040)', 
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '10px',
              wordBreak: 'break-all',
              color: 'var(--dark-text-primary, #ffffff)'
            }}>
              {selected.attrs["bounds"]}
            </div>
          </div>
        )}
        
        {/* 提示信息 */}
        <div style={{ 
          fontSize: '10px', 
          color: 'var(--dark-text-tertiary, #666)',
          textAlign: 'center',
        }}>
          点击预览区域选择最顶层节点
        </div>
      </Space>
    </Card>
  );
}

// =============== 主组件 ===============

const AdbXmlInspector: React.FC<AdbXmlInspectorProps> = ({
  initialXml = '',
  height = 400,
  showTips = true,
  onNodeSelected,
  className = ''
}) => {
  // 状态管理
  const [xmlText, setXmlText] = useState<string>(initialXml);
  const [root, setRoot] = useState<UiNode | null>(null);
  const [selected, setSelected] = useState<UiNode | null>(null);
  const [filter, setFilter] = useState<string>("");
  
  // 文件上传引用
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 解析XML
  const handleParse = () => {
    if (!xmlText.trim()) {
      message.warning('请输入XML内容');
      return;
    }
    
    const tree = parseUiAutomatorXml(xmlText);
    if (tree) {
      attachParents(tree);
      setRoot(tree);
      setSelected(tree);
      message.success('XML解析成功');
    } else {
      message.error('XML解析失败，请检查格式');
    }
  };

  // 加载示例
  const handleLoadDemo = () => {
    const demo = getDemoXml();
    setXmlText(demo);
    message.info('已加载示例数据');
  };

  // 导入文件
  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result);
      setXmlText(content);
      message.success('文件导入成功');
    };
    reader.onerror = () => {
      message.error('文件读取失败');
    };
    reader.readAsText(file);
  };

  // 节点选择处理
  const handleNodeSelect = (node: UiNode) => {
    setSelected(node);
    if (onNodeSelected) {
      const xpath = buildXPath(node);
      onNodeSelected(node, xpath);
    }
  };

  const containerHeight = height;

  return (
    <div className={`adb-xml-inspector ${className || 'xml-inspector-in-modal'}`} style={{ height: containerHeight }}>
      {/* 顶部工具栏 */}
      <div style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Space>
              <FileSearchOutlined style={{ color: '#1890ff' }} />
              <Text strong style={{ fontSize: '14px' }}>ADB XML可视化检查器</Text>
            </Space>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <Space size="small">
              <input
                ref={fileRef}
                type="file"
                accept=".xml,text/xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                }}
              />
              <Button
                size="small"
                onClick={() => fileRef.current?.click()}
              >
                导入文件
              </Button>
              <Button
                size="small"
                onClick={handleLoadDemo}
              >
                加载示例
              </Button>
            </Space>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <Input
                size="small"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="搜索：resource-id/text/content-desc/class"
                prefix={<SearchOutlined />}
                style={{ maxWidth: '300px' }}
              />
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleParse}
              >
                解析XML
              </Button>
            </div>
          </div>
        </Space>
      </div>

      {/* 主体区域 */}
      <Row gutter={16}>
        {/* 左侧：XML编辑器和树视图 */}
        <Col span={12}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {/* XML编辑器 */}
            <Card 
              title={
                <Space>
                  <span>📄</span>
                  XML源码
                </Space>
              }
              size="small"
            >
              <TextArea
                value={xmlText}
                onChange={(e) => setXmlText(e.target.value)}
                placeholder="粘贴uiautomator dump的XML内容..."
                rows={4}
                style={{ fontSize: '11px', fontFamily: 'monospace' }}
              />
            </Card>

            {/* 节点树 */}
            <Card 
              title={
                <Space>
                  <span>🌲</span>
                  节点树
                </Space>
              }
              size="small"
            >
              <div style={{ maxHeight: 220, overflow: 'auto', padding: '4px' }}>
                {root ? (
                  <TreeRow 
                    node={root} 
                    depth={0} 
                    selected={selected} 
                    onSelect={handleNodeSelect} 
                    filter={filter} 
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#bfbfbf' }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      解析XML后在此展示树结构
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Space>
        </Col>

        {/* 右侧：详情和预览 */}
        <Col span={12}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <NodeDetail node={selected} />
            <ScreenPreview 
              root={root} 
              selected={selected} 
              onNodeSelect={handleNodeSelect}
            />
          </Space>
        </Col>
      </Row>

      {/* 底部提示 */}
      {showTips && (
        <Alert
          style={{ marginTop: '16px' }}
          message="使用提示"
          description={
            <div style={{ fontSize: '12px' }}>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.6' }}>
                <li>支持拖拽XML文件或手动粘贴内容</li>
                <li>使用搜索框快速定位特定元素</li>
                <li>点击节点树查看详细属性信息</li>
                <li>右侧预览区域可视化显示元素位置</li>
                <li>支持一键复制XPath路径</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          closable
        />
      )}
    </div>
  );
};

export default AdbXmlInspector;