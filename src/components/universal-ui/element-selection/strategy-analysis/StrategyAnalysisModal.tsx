// src/components/universal-ui/element-selection/strategy-analysis/StrategyAnalysisModal.tsx
// module: universal-ui | layer: ui | role: 策略分析模态框
// summary: 元素选择策略分析结果的可视化展示模态框

import React from 'react';
import { Modal, Card, Row, Col, Button, Progress, Typography, Tag, Space, Divider } from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { StrategyCandidate } from '../../../../modules/universal-ui/types/intelligent-analysis-types';

const { Title, Text, Paragraph } = Typography;

export interface AnalysisResult {
  recommendedStrategy: StrategyCandidate;
  alternatives: StrategyCandidate[];
  analysisMetadata: {
    totalTime: number;
    elementComplexity: 'simple' | 'medium' | 'complex';
    containerStability: number;
    textStability: number;
  };
}

export interface StrategyAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  element: UIElement;
  analysisResult: AnalysisResult;
  onStrategySelect: (strategy: StrategyCandidate) => void;
}

export const StrategyAnalysisModal: React.FC<StrategyAnalysisModalProps> = ({
  open,
  onClose,
  element,
  analysisResult,
  onStrategySelect
}) => {
  
  // 获取策略类别的显示信息
  const getCategoryInfo = (variant: StrategyCandidate['variant']) => {
    const categoryMap = {
      'self_anchor': { name: '自我定位', icon: <CheckCircleOutlined />, color: '#52c41a' },
      'child_driven': { name: '子树锚点', icon: <InfoCircleOutlined />, color: '#1890ff' },
      'region_scoped': { name: '区域限定', icon: <SafetyOutlined />, color: '#722ed1' },
      'neighbor_relative': { name: '邻居相对', icon: <ThunderboltOutlined />, color: '#fa8c16' },
      'index_fallback': { name: '索引兜底', icon: <ClockCircleOutlined />, color: '#8c8c8c' }
    };
    return categoryMap[variant] || categoryMap['index_fallback'];
  };

  // 获取性能指标的颜色
  const getPerformanceColor = (level: string) => {
    const colorMap: Record<string, string> = {
      'fast': '#52c41a', 'high': '#52c41a', 'excellent': '#52c41a',
      'medium': '#faad14', 'good': '#faad14',
      'slow': '#ff4d4f', 'low': '#ff4d4f', 'fair': '#ff4d4f'
    };
    return colorMap[level] || '#8c8c8c';
  };

  // 渲染策略卡片
  const renderStrategyCard = (strategy: StrategyCandidate, isRecommended: boolean = false) => {
    const categoryInfo = getCategoryInfo(strategy.variant);
    
    return (
      <Card
        key={strategy.name}
        size="small"
        style={{ 
          marginBottom: 12,
          border: isRecommended ? '2px solid #52c41a' : '1px solid #d9d9d9',
          background: isRecommended ? '#f6ffed' : '#ffffff'
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              {isRecommended && <TrophyOutlined style={{ color: '#faad14' }} />}
              {categoryInfo.icon}
              <Text strong>{strategy.name}</Text>
              {isRecommended && <Tag color="gold">推荐</Tag>}
            </Space>
            <Tag color={strategy.confidence >= 90 ? 'green' : strategy.confidence >= 70 ? 'orange' : 'red'}>
              {Math.round(strategy.confidence)}%
            </Tag>
          </div>
        }
        extra={
          <Button 
            type={isRecommended ? "primary" : "default"}
            size="small" 
            onClick={() => onStrategySelect(strategy)}
          >
            选择此策略
          </Button>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <Text>{strategy.description}</Text>
        </div>
        
        {/* 性能指标 */}
        {strategy.performance && (
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>执行速度</div>
                <Tag color={getPerformanceColor(strategy.performance.speed)}>
                  {strategy.performance.speed}
                </Tag>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>稳定性</div>
                <Tag color={getPerformanceColor(strategy.performance.stability)}>
                  {strategy.performance.stability}
                </Tag>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>跨设备</div>
                <Tag color={getPerformanceColor(strategy.performance.crossDevice)}>
                  {strategy.performance.crossDevice}
                </Tag>
              </div>
            </Col>
          </Row>
        )}

        {/* 优缺点 */}
        {(strategy.pros || strategy.cons) && (
          <Row gutter={16}>
            {strategy.pros && strategy.pros.length > 0 && (
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#52c41a', marginBottom: 4 }}>✅ 优势:</div>
                <ul style={{ fontSize: '11px', color: '#666', margin: 0, paddingLeft: 16 }}>
                  {strategy.pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </Col>
            )}
            {strategy.cons && strategy.cons.length > 0 && (
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#ff4d4f', marginBottom: 4 }}>⚠️ 注意:</div>
                <ul style={{ fontSize: '11px', color: '#666', margin: 0, paddingLeft: 16 }}>
                  {strategy.cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </Col>
            )}
          </Row>
        )}

        {/* 适用场景 */}
        {strategy.scenarios && strategy.scenarios.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '12px', color: '#1890ff', marginBottom: 4 }}>🎯 适用场景:</div>
            <div>
              {strategy.scenarios.map((scenario, index) => (
                <Tag key={index} style={{ marginBottom: 2, fontSize: '12px' }}>
                  {scenario}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            🧠 智能策略分析结果
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            目标元素: {element.text || element.resource_id || element.class_name || '未知元素'}
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button 
          key="use-recommended" 
          type="primary" 
          onClick={() => onStrategySelect(analysisResult.recommendedStrategy)}
        >
          使用推荐策略
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
    >
      {/* 分析概览 */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>分析耗时</div>
              <Text strong>{analysisResult.analysisMetadata.totalTime}ms</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>元素复杂度</div>
              <Tag color={
                analysisResult.analysisMetadata.elementComplexity === 'simple' ? 'green' :
                analysisResult.analysisMetadata.elementComplexity === 'medium' ? 'orange' : 'red'
              }>
                {analysisResult.analysisMetadata.elementComplexity}
              </Tag>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>容器稳定性</div>
              <Progress 
                type="circle" 
                size={40} 
                percent={Math.round(analysisResult.analysisMetadata.containerStability * 100)} 
                format={() => `${Math.round(analysisResult.analysisMetadata.containerStability * 100)}`}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>文本稳定性</div>
              <Progress 
                type="circle" 
                size={40} 
                percent={Math.round(analysisResult.analysisMetadata.textStability * 100)} 
                format={() => `${Math.round(analysisResult.analysisMetadata.textStability * 100)}`}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Divider orientation="left">🏆 推荐策略</Divider>
      {renderStrategyCard(analysisResult.recommendedStrategy, true)}

      {analysisResult.alternatives.length > 0 && (
        <>
          <Divider orientation="left">🔄 备选策略</Divider>
          {analysisResult.alternatives.map(strategy => renderStrategyCard(strategy, false))}
        </>
      )}

      {/* 说明文字 */}
      <Card size="small" style={{ background: '#f0f2f5', marginTop: 16 }}>
        <Paragraph style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          💡 <Text strong>使用建议:</Text> 推荐策略基于元素特征、容器稳定性和跨设备兼容性综合评估得出。
          在大多数情况下推荐使用置信度最高的策略。如需特殊场景适配，可查看各策略的适用场景说明。
        </Paragraph>
      </Card>
    </Modal>
  );
};

export default StrategyAnalysisModal;