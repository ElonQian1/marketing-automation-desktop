// src/pages/click-normalizer-test.tsx
// module: pages | layer: ui | role: 点击规范化测试页面
// summary: 测试点击规范化功能，验证重叠层回收和容器限域

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Button, Card, Input, message, Spin, Divider, Typography, Row, Col, Tag, Space } from 'antd';
import { PlayCircleOutlined, AnalyticsOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface ClickNormalizeRequest {
  xmlContent: string;
  clickedBounds: [number, number, number, number];
}

interface ClickNormalizeResponse {
  success: boolean;
  error?: string;
  result?: ClickNormalizeResult;
}

interface ClickNormalizeResult {
  container: NodeInfo;
  cardRoot: NodeInfo;
  clickableParent: NodeInfo;
  originalClicked: NodeInfo;
  columnInfo: ColumnInfo;
}

interface NodeInfo {
  nodeIndex: number;
  className?: string;
  text?: string;
  contentDesc?: string;
  resourceId?: string;
  clickable?: boolean;
  bounds: [number, number, number, number];
  xpath: string;
}

interface ColumnInfo {
  column: string;
  positionInColumn: number;
  columnCardCount: number;
}

interface AnalyzeResponse {
  success: boolean;
  error?: string;
  result?: AnalyzeResult;
}

interface AnalyzeResult {
  totalNodes: number;
  containerCandidates: NodeInfo[];
  cardRootCandidates: NodeInfo[];
  clickableStats: ClickableStats;
}

interface ClickableStats {
  totalClickable: number;
  clickableFramelayouts: number;
  descFramelayouts: number;
}

const ClickNormalizerTest: React.FC = () => {
  const [xmlContent, setXmlContent] = useState('');
  const [clickedBounds, setClickedBounds] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClickNormalizeResult | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);

  const handleClickNormalizeTest = async () => {
    if (!xmlContent.trim()) {
      message.error('请输入XML内容');
      return;
    }

    if (!clickedBounds.trim()) {
      message.error('请输入点击bounds（格式：left,top,right,bottom）');
      return;
    }

    // 解析bounds
    const boundsArray = clickedBounds.split(',').map(s => parseInt(s.trim()));
    if (boundsArray.length !== 4 || boundsArray.some(isNaN)) {
      message.error('bounds格式错误，请使用：left,top,right,bottom');
      return;
    }

    const request: ClickNormalizeRequest = {
      xmlContent,
      clickedBounds: boundsArray as [number, number, number, number],
    };

    setLoading(true);
    try {
      const response = await invoke<ClickNormalizeResponse>('test_click_normalization', { request });
      
      if (response.success && response.result) {
        setResult(response.result);
        message.success('点击规范化测试成功');
      } else {
        message.error(`测试失败: ${response.error}`);
        setResult(null);
      }
    } catch (error) {
      console.error('点击规范化测试失败:', error);
      message.error('测试失败');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeXml = async () => {
    if (!xmlContent.trim()) {
      message.error('请输入XML内容');
      return;
    }

    setLoading(true);
    try {
      const response = await invoke<AnalyzeResponse>('analyze_xml_structure', { xmlContent });
      
      if (response.success && response.result) {
        setAnalyzeResult(response.result);
        message.success('XML结构分析完成');
      } else {
        message.error(`分析失败: ${response.error}`);
        setAnalyzeResult(null);
      }
    } catch (error) {
      console.error('XML结构分析失败:', error);
      message.error('分析失败');
      setAnalyzeResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatBounds = (bounds: [number, number, number, number]) => {
    return `[${bounds.join(', ')}]`;
  };

  const NodeCard: React.FC<{ title: string; node: NodeInfo; color?: string }> = ({ title, node, color = 'blue' }) => (
    <Card 
      size="small" 
      title={<Text style={{ color }}>{title}</Text>}
      className="light-theme-force"
      style={{ marginBottom: 8 }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div><Text strong>索引:</Text> {node.nodeIndex}</div>
        <div><Text strong>类名:</Text> {node.className || '无'}</div>
        <div><Text strong>文本:</Text> {node.text || '无'}</div>
        <div><Text strong>描述:</Text> {node.contentDesc || '无'}</div>
        <div><Text strong>可点击:</Text> <Tag color={node.clickable ? 'green' : 'red'}>{node.clickable ? '是' : '否'}</Tag></div>
        <div><Text strong>Bounds:</Text> {formatBounds(node.bounds)}</div>
        <div><Text strong>XPath:</Text> <Text code style={{ fontSize: '10px' }}>{node.xpath}</Text></div>
      </Space>
    </Card>
  );

  return (
    <div className="light-theme-force" style={{ padding: 24, background: 'var(--bg-light-base)' }}>
      <Title level={2}>
        <PlayCircleOutlined style={{ marginRight: 8 }} />
        点击规范化测试工具
      </Title>
      
      <Paragraph>
        此工具用于测试点击规范化功能，验证重叠层回收和容器限域逻辑。
      </Paragraph>

      <Card 
        title={<><FileTextOutlined style={{ marginRight: 8 }} />输入参数</>}
        className="light-theme-force"
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>XML内容 (UI Dump):</Text>
            <TextArea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              placeholder="请粘贴XML内容..."
              rows={6}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <Text strong>点击Bounds (格式: left,top,right,bottom):</Text>
            <Input
              value={clickedBounds}
              onChange={(e) => setClickedBounds(e.target.value)}
              placeholder="例如: 100,200,300,400"
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Card>

      <Card 
        title="操作"
        className="light-theme-force"
        style={{ marginBottom: 24 }}
      >
        <Space>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleClickNormalizeTest}
            loading={loading}
            size="large"
          >
            执行点击规范化测试
          </Button>
          
          <Button 
            icon={<AnalyticsOutlined />}
            onClick={handleAnalyzeXml}
            loading={loading}
            size="large"
          >
            分析XML结构
          </Button>
        </Space>
      </Card>

      {loading && (
        <Card className="light-theme-force" style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>正在处理...</Text>
          </div>
        </Card>
      )}

      {analyzeResult && (
        <Card 
          title={<><AnalyticsOutlined style={{ marginRight: 8 }} />XML结构分析结果</>}
          className="light-theme-force"
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card size="small" title="统计信息" className="light-theme-force">
                <Space direction="vertical">
                  <div><Text strong>总节点数:</Text> {analyzeResult.totalNodes}</div>
                  <div><Text strong>容器候选:</Text> {analyzeResult.containerCandidates.length}</div>
                  <div><Text strong>卡片根候选:</Text> {analyzeResult.cardRootCandidates.length}</div>
                </Space>
              </Card>
            </Col>
            
            <Col span={16}>
              <Card size="small" title="可点击统计" className="light-theme-force">
                <Space direction="vertical">
                  <div><Text strong>可点击节点总数:</Text> {analyzeResult.clickableStats.totalClickable}</div>
                  <div><Text strong>可点击FrameLayout:</Text> {analyzeResult.clickableStats.clickableFramelayouts}</div>
                  <div><Text strong>有描述FrameLayout:</Text> {analyzeResult.clickableStats.descFramelayouts}</div>
                </Space>
              </Card>
            </Col>
          </Row>

          {analyzeResult.containerCandidates.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={4}>容器候选节点 (前3个)</Title>
              {analyzeResult.containerCandidates.slice(0, 3).map((node, index) => (
                <NodeCard key={index} title={`容器 #${index + 1}`} node={node} color="purple" />
              ))}
            </div>
          )}
        </Card>
      )}

      {result && (
        <Card 
          title={<><PlayCircleOutlined style={{ marginRight: 8 }} />点击规范化结果</>}
          className="light-theme-force"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <NodeCard title="📦 容器节点" node={result.container} color="purple" />
              <NodeCard title="🎯 卡片根节点" node={result.cardRoot} color="green" />
            </Col>
            
            <Col span={12}>
              <NodeCard title="👆 可点父节点" node={result.clickableParent} color="orange" />
              <NodeCard title="🔘 原始点击节点" node={result.originalClicked} color="blue" />
            </Col>
          </Row>

          <Divider />

          <Card 
            size="small" 
            title="📊 列位置信息"
            className="light-theme-force"
          >
            <Space direction="vertical">
              <div>
                <Text strong>所在列:</Text> 
                <Tag color={result.columnInfo.column === 'left' ? 'blue' : result.columnInfo.column === 'right' ? 'green' : 'orange'}>
                  {result.columnInfo.column === 'left' ? '左列' : result.columnInfo.column === 'right' ? '右列' : '未知'}
                </Tag>
              </div>
              <div><Text strong>列内位置:</Text> 第 {result.columnInfo.positionInColumn + 1} 个</div>
              <div><Text strong>同列卡片总数:</Text> {result.columnInfo.columnCardCount} 个</div>
            </Space>
          </Card>
        </Card>
      )}
    </div>
  );
};

export default ClickNormalizerTest;