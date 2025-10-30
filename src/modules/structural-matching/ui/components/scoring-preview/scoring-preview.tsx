// src/modules/structural-matching/ui/components/scoring-preview/scoring-preview.tsx
// module: structural-matching | layer: ui | role: 评分预览
// summary: 展示结构匹配的实时评分预览和详细说明

import React from 'react';
import { Card, Progress, Typography, Space, Tag, List } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { StructuralMatchingConfig, StructuralMatchResult } from '../../../domain/models/structural-field-config';
import { FIELD_TYPE_DISPLAY_NAMES } from '../../../domain/constants/field-types';
import './scoring-preview.css';

const { Title, Text } = Typography;

export interface StructuralScoringPreviewProps {
  /** 配置 */
  config: StructuralMatchingConfig;
  
  /** 总体结果 */
  totalResult: StructuralMatchResult;
}

export const StructuralScoringPreview: React.FC<StructuralScoringPreviewProps> = ({
  config,
  totalResult,
}) => {
  const percentage = totalResult.maxScore && totalResult.maxScore > 0
    ? (totalResult.totalScore / totalResult.maxScore) * 100
    : 0;

  const thresholdPercentage = config.globalThreshold * 100;

  return (
    <div className="structural-scoring-preview light-theme-force">
      {/* 总体得分 */}
      <Card className="preview-card" size="small">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div className="score-header">
            <Title level={4}>总体得分</Title>
            <Space>
              {totalResult.passed ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  预计通过
                </Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">
                  预计不通过
                </Tag>
              )}
            </Space>
          </div>

          <div className="score-progress">
            <Progress
              percent={percentage}
              success={{ percent: thresholdPercentage }}
              strokeColor={totalResult.passed ? '#52c41a' : '#ff4d4f'}
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
            <div className="score-details">
              <Text>
                得分: <Text strong>{totalResult.totalScore.toFixed(2)}</Text>
              </Text>
              <Text type="secondary">
                最大分: {totalResult.maxScore?.toFixed(2) || '0.00'}
              </Text>
              <Text type={totalResult.passed ? 'success' : 'danger'}>
                阈值: {thresholdPercentage.toFixed(0)}%
              </Text>
            </div>
          </div>
        </Space>
      </Card>

      {/* 各字段得分明细 */}
      <Card className="preview-card" size="small" style={{ marginTop: 16 }}>
        <Title level={5}>字段得分明细</Title>
        <List
          dataSource={totalResult.fieldResults}
          renderItem={(fieldResult) => {
            const fieldConfig = config.fields.find(f => f.fieldType === fieldResult.fieldType);
            const fieldPercentage = fieldResult.maxScore > 0
              ? (fieldResult.score / fieldResult.maxScore) * 100
              : 0;

            return (
              <List.Item className="field-result-item">
                <div className="field-result-content">
                  <div className="field-result-header">
                    <Space>
                      <Text strong>
                        {FIELD_TYPE_DISPLAY_NAMES[fieldResult.fieldType]}
                      </Text>
                      {fieldResult.matched ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      )}
                    </Space>
                    <Text>
                      {fieldResult.score.toFixed(2)} / {fieldResult.maxScore.toFixed(2)}
                    </Text>
                  </div>

                  {fieldConfig?.enabled && (
                    <>
                      <Progress
                        percent={fieldPercentage}
                        size="small"
                        strokeColor={fieldResult.matched ? '#52c41a' : '#ff4d4f'}
                        showInfo={false}
                      />
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                        {fieldResult.reason}
                      </Text>
                    </>
                  )}

                  {!fieldConfig?.enabled && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      (字段已禁用)
                    </Text>
                  )}
                </div>
              </List.Item>
            );
          }}
        />
      </Card>

      {/* 说明文字 */}
      <Card className="preview-card" size="small" style={{ marginTop: 16 }}>
        <Space direction="vertical" size="small">
          <Text type="secondary" style={{ fontSize: 12 }}>
            ℹ️ 这是前端简化预览，实际执行时后端会进行精确评分
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ⚠️ "都非空" 模式只要求字段存在值，不检查具体内容
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ✅ 结构匹配权重最高，子元素层级一致性是关键判断标准
          </Text>
        </Space>
      </Card>
    </div>
  );
};
