// src/modules/structural-matching/ui/components/field-config-list/field-config-list.tsx
// module: structural-matching | layer: ui | role: 字段配置列表
// summary: 展示所有字段的配置项，支持启用/禁用、调整权重

import React from 'react';
import { List, Switch, Slider, Select, Space, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { StructuralFieldConfig } from '../../../domain/models/structural-field-config';
import { FieldType, MatchMode, FIELD_TYPE_DISPLAY_NAMES, MATCH_MODE_DISPLAY_NAMES } from '../../../domain/constants/field-types';
import './field-config-list.css';

const { Text } = Typography;
const { Option } = Select;

export interface StructuralFieldConfigListProps {
  /** 字段配置列表 */
  fields: StructuralFieldConfig[];
  
  /** 更新字段配置 */
  onUpdateField: (fieldType: FieldType, updates: Partial<StructuralFieldConfig>) => void;
  
  /** 切换字段启用状态 */
  onToggleField: (fieldType: FieldType) => void;
}

export const StructuralFieldConfigList: React.FC<StructuralFieldConfigListProps> = ({
  fields,
  onUpdateField,
  onToggleField,
}) => {
  return (
    <div className="structural-field-config-list light-theme-force">
      <List
        dataSource={fields}
        renderItem={(field) => (
          <List.Item key={field.fieldType} className="field-config-item">
            <div className="field-config-content">
              {/* 字段名称 */}
              <div className="field-header">
                <Space>
                  <Switch
                    checked={field.enabled}
                    onChange={() => onToggleField(field.fieldType)}
                    size="small"
                  />
                  <Text strong={field.enabled} type={field.enabled ? undefined : 'secondary'}>
                    {field.displayName}
                  </Text>
                  {field.description && (
                    <Tooltip title={field.description}>
                      <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
                    </Tooltip>
                  )}
                </Space>
                {field.templateValue && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    值: {String(field.templateValue).substring(0, 30)}
                  </Text>
                )}
              </div>

              {/* 配置项 */}
              {field.enabled && (
                <div className="field-controls">
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {/* 匹配模式 */}
                    <div className="control-row">
                      <Text type="secondary" style={{ minWidth: 80 }}>匹配模式:</Text>
                      <Select
                        value={field.matchMode}
                        onChange={(value) => onUpdateField(field.fieldType, { matchMode: value })}
                        style={{ width: 200 }}
                        size="small"
                      >
                        {Object.values(MatchMode).map((mode) => (
                          <Option key={mode} value={mode}>
                            {MATCH_MODE_DISPLAY_NAMES[mode]}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    {/* 权重 */}
                    <div className="control-row">
                      <Text type="secondary" style={{ minWidth: 80 }}>权重:</Text>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={field.weight}
                          onChange={(value) => onUpdateField(field.fieldType, { weight: value })}
                          marks={{
                            0: '0',
                            1: '1',
                            2: '2',
                          }}
                          tooltip={{
                            formatter: (value) => `${value?.toFixed(1)}x`,
                          }}
                        />
                      </div>
                    </div>

                    {/* 评分规则预览 */}
                    <div className="control-row scoring-rules-preview">
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        规则: 完全匹配 {(field.scoringRules.exactMatch * field.weight).toFixed(2)} | 
                        都非空 {(field.scoringRules.bothNonEmpty * field.weight).toFixed(2)} | 
                        都为空 {(field.scoringRules.bothEmpty * field.weight).toFixed(2)} | 
                        不匹配 {(field.scoringRules.mismatchPenalty * field.weight).toFixed(2)}
                      </Text>
                    </div>
                  </Space>
                </div>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};
