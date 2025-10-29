// src/components/text-matching/TextMatchingDemo.tsx
// module: text-matching | layer: ui | role: demo component
// summary: 文本匹配功能演示组件，展示不同模式的匹配效果

import React, { useState, useMemo } from 'react';
import {
  Card,
  Input,
  Space,
  Typography,
  Alert,
  Tag,
  Button,
  Row,
  Col,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

import { TextMatchingConfigPanel, useTextMatchingConfig } from './index';
import { useAntonymManager } from './hooks/useAntonymManager';
import { TextMatchingEngine } from './core/TextMatchingEngine';
import type { MatchResult } from './core/TextMatchingEngine';

const { Text } = Typography;
const { TextArea } = Input;

export const TextMatchingDemo: React.FC = () => {
  const { config, updateConfig } = useTextMatchingConfig();
  const { antonymPairs } = useAntonymManager();
  const [targetText, setTargetText] = useState('关注');
  const [candidates, setCandidates] = useState('关注\n取消关注\n已关注\n关注他\n点击关注\n关注好友');
  const [results, setResults] = useState<MatchResult[]>([]);

  // 创建文本匹配引擎实例
  const engine = useMemo(() => {
    return new TextMatchingEngine(config, antonymPairs);
  }, [config, antonymPairs]);

  // 执行文本匹配
  const performMatching = () => {
    const candidateList = candidates.split('\n').filter(c => c.trim());
    const matchResults = engine.batchMatch(targetText, candidateList);
    setResults(matchResults);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.5) return 'orange';
    return 'red';
  };

  return (
    <div className="light-theme-force" style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="文本匹配功能演示" className="light-theme-force">
          <Alert
            type="info"
            showIcon
            message="功能说明"
            description="此演示展示不同文本匹配模式的效果差异。你可以配置匹配参数，然后测试不同的候选文本如何被识别。"
            style={{ marginBottom: 16 }}
          />

          {/* 配置面板 */}
          <TextMatchingConfigPanel 
            config={config} 
            onChange={updateConfig}
            className="light-theme-force"
          />

          <Divider />

          {/* 测试输入 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="目标文本" className="light-theme-force">
                <Input
                  value={targetText}
                  onChange={(e) => setTargetText(e.target.value)}
                  placeholder="输入要匹配的目标文本"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="候选文本列表" className="light-theme-force">
                <TextArea
                  value={candidates}
                  onChange={(e) => setCandidates(e.target.value)}
                  placeholder="每行一个候选文本"
                  rows={4}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={performMatching}
            >
              执行匹配测试
            </Button>
          </div>

          {/* 结果展示 */}
          {results.length > 0 && (
            <Card title="匹配结果" className="light-theme-force">
              <Space direction="vertical" style={{ width: '100%' }}>
                {candidates.split('\n').filter(c => c.trim()).map((candidate, index) => {
                  const result = results[index];
                  return (
                    <Card 
                      key={index} 
                      size="small" 
                      className="light-theme-force"
                      style={{ 
                        border: `2px solid ${result.matched ? '#52c41a' : '#ff4d4f'}`,
                        backgroundColor: result.matched ? '#f6ffed' : '#fff2f0'
                      }}
                    >
                      <Row align="middle" justify="space-between">
                        <Col>
                          <Space>
                            {result.matched ? 
                              <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                            }
                            <Text strong>{candidate}</Text>
                          </Space>
                        </Col>
                        <Col>
                          <Space>
                            <Tag color={getConfidenceColor(result.confidence)}>
                              置信度: {(result.confidence * 100).toFixed(0)}%
                            </Tag>
                            <Tag>{result.method}</Tag>
                          </Space>
                        </Col>
                      </Row>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {result.reason}
                      </Text>
                    </Card>
                  );
                })}
              </Space>
            </Card>
          )}
        </Card>
      </Space>
    </div>
  );
};