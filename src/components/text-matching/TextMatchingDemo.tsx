// src/components/text-matching/TextMatchingDemo.tsx
// module: text-matching | layer: ui | role: demo component
// summary: 文本匹配功能演示组件，展示不同模式的匹配效果

import React, { useState } from 'react';
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

const { Text } = Typography;
const { TextArea } = Input;

interface MatchResult {
  matched: boolean;
  confidence: number;
  method: string;
  reason: string;
}

export const TextMatchingDemo: React.FC = () => {
  const { config, updateConfig } = useTextMatchingConfig();
  const [targetText, setTargetText] = useState('关注');
  const [candidates, setCandidates] = useState('关注\n取消关注\n已关注\n关注他\n点击关注\n关注好友');
  const [results, setResults] = useState<MatchResult[]>([]);

  // 模拟文本匹配逻辑
  const performMatching = () => {
    const candidateList = candidates.split('\n').filter(c => c.trim());
    const newResults: MatchResult[] = [];

    candidateList.forEach(candidate => {
      if (config.mode === 'exact') {
        // 绝对匹配：完全相同才算匹配
        const matched = candidate.trim() === targetText.trim();
        newResults.push({
          matched,
          confidence: matched ? 1.0 : 0.0,
          method: '绝对匹配',
          reason: matched ? '文本完全相同' : '文本不相同'
        });
      } else {
        // 部分匹配：包含目标文本或相关语义
        const includes = candidate.includes(targetText);
        let confidence = 0;
        let reason = '';
        let method = '';

        if (includes) {
          confidence = 0.9;
          method = '部分文本匹配';
          reason = `包含目标文本 "${targetText}"`;
        } else if (config.antonymCheckEnabled) {
          // 模拟反义词检测
          const antonyms = ['取消关注', '不关注', '拒绝关注'];
          const isAntonym = antonyms.some(ant => candidate.includes(ant.replace('不', '').replace('取消', '').replace('拒绝', '')));
          if (isAntonym) {
            confidence = 0.2;
            method = '反义词检测';
            reason = '检测到反义词或相反操作';
          }
        }

        if (confidence === 0 && config.semanticAnalysisEnabled) {
          // 模拟语义分析
          const semanticKeywords = ['关注', '订阅', '追踪', '跟随'];
          const hasSemanticMatch = semanticKeywords.some(keyword => 
            candidate.includes(keyword) || targetText.includes(keyword)
          );
          if (hasSemanticMatch) {
            confidence = 0.7;
            method = '语义分析';
            reason = '语义相关性匹配';
          }
        }

        newResults.push({
          matched: confidence > 0.5,
          confidence,
          method: method || '无匹配',
          reason: reason || '无相关性'
        });
      }
    });

    setResults(newResults);
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