// src/components/smart-selection/ExcludeRuleEditor.tsx
// module: smart-selection | layer: ui | role: 规则编辑器组件
// summary: 高级排除规则可视化编辑器

import React, { useState } from 'react';
import { Space, Select, Input, Button, Tag, Tooltip, Card, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, ExperimentOutlined } from '@ant-design/icons';

/**
 * 排除规则定义
 */
export interface ExcludeRule {
  id: string;
  attr: 'text' | 'content-desc' | 'resource-id' | 'class';
  op: 'equals' | 'contains' | 'regex';
  value: string;
  enabled?: boolean;
}

/**
 * 规则编辑器属性
 */
export interface ExcludeRuleEditorProps {
  /** 规则列表 */
  rules: ExcludeRule[];
  /** 规则变化回调 */
  onChange: (rules: ExcludeRule[]) => void;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否显示测试按钮 */
  showTest?: boolean;
  /** 测试回调（返回命中数量） */
  onTest?: (rule: ExcludeRule) => Promise<number>;
}

/**
 * 属性选项
 */
const ATTR_OPTIONS = [
  { value: 'text', label: '📝 文本 (text)' },
  { value: 'content-desc', label: '📋 描述 (content-desc)' },
  { value: 'resource-id', label: '🆔 资源ID (resource-id)' },
  { value: 'class', label: '🏷️ 类名 (class)' },
];

/**
 * 匹配方式选项
 */
const OP_OPTIONS = [
  { value: 'equals', label: '= 等于', color: 'green', perf: '⚡ 最快' },
  { value: 'contains', label: '⊃ 包含', color: 'blue', perf: '⚡ 快' },
  { value: 'regex', label: '🔍 正则', color: 'orange', perf: '⚠️ 慢' },
];

/**
 * 排除规则编辑器组件
 */
export const ExcludeRuleEditor: React.FC<ExcludeRuleEditorProps> = ({
  rules,
  onChange,
  compact = false,
  showTest = true,
  onTest,
}) => {
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, number>>({});

  // 添加新规则
  const handleAddRule = () => {
    const newRule: ExcludeRule = {
      id: `rule-${Date.now()}`,
      attr: 'text',
      op: 'contains',
      value: '',
      enabled: true,
    };
    onChange([...rules, newRule]);
  };

  // 删除规则
  const handleDeleteRule = (id: string) => {
    onChange(rules.filter(rule => rule.id !== id));
  };

  // 更新规则
  const handleUpdateRule = (id: string, updates: Partial<ExcludeRule>) => {
    onChange(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  // 测试规则
  const handleTestRule = async (rule: ExcludeRule) => {
    if (!onTest) return;
    
    setTestingRuleId(rule.id);
    try {
      const matchCount = await onTest(rule);
      setTestResults({ ...testResults, [rule.id]: matchCount });
    } catch (error) {
      console.error('测试规则失败:', error);
    } finally {
      setTestingRuleId(null);
    }
  };

  // 获取性能提示
  const getPerformanceTip = (op: string) => {
    const option = OP_OPTIONS.find(o => o.value === op);
    return option?.perf || '';
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 使用说明 */}
      {!compact && (
        <Alert
          message="💡 排除规则说明"
          description={
            <div style={{ fontSize: '12px' }}>
              <div>• <strong>优先级顺序</strong>：等于 &gt; 包含 &gt; 正则（性能考虑）</div>
              <div>• <strong>推荐用法</strong>：优先使用"等于"或"包含"，正则仅在必要时使用</div>
              <div>• <strong>测试功能</strong>：点击 🧪 测试按钮可查看规则命中数量</div>
            </div>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: 12, fontSize: '12px' }}
        />
      )}

      {/* 规则列表 */}
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {rules.map((rule, index) => (
          <Card
            key={rule.id}
            size="small"
            style={{
              background: rule.enabled ? '#fff' : '#f5f5f5',
              border: `1px solid ${rule.enabled ? '#d9d9d9' : '#e8e8e8'}`,
            }}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <Space size={8} wrap style={{ width: '100%' }}>
              {/* 规则编号 */}
              <Tag color={rule.enabled ? 'blue' : 'default'}>
                规则 #{index + 1}
              </Tag>

              {/* 属性选择 */}
              <Select
                value={rule.attr}
                onChange={(attr) => handleUpdateRule(rule.id, { attr })}
                options={ATTR_OPTIONS}
                size="small"
                style={{ width: 160 }}
                disabled={!rule.enabled}
              />

              {/* 匹配方式 */}
              <Select
                value={rule.op}
                onChange={(op) => handleUpdateRule(rule.id, { op })}
                size="small"
                style={{ width: 120 }}
                disabled={!rule.enabled}
              >
                {OP_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Space size={4}>
                      <span>{opt.label}</span>
                      {rule.enabled && (
                        <Tag color={opt.color} style={{ fontSize: '10px', margin: 0, padding: '0 4px' }}>
                          {opt.perf}
                        </Tag>
                      )}
                    </Space>
                  </Select.Option>
                ))}
              </Select>

              {/* 值输入 */}
              <Input
                value={rule.value}
                onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                placeholder={
                  rule.op === 'regex' 
                    ? '^(已关注|Following)$' 
                    : rule.op === 'equals'
                    ? '已关注'
                    : '关注'
                }
                size="small"
                style={{ width: 180 }}
                disabled={!rule.enabled}
              />

              {/* 测试按钮 */}
              {showTest && (
                <Tooltip title="测试此规则（查看命中数量）">
                  <Button
                    icon={<ExperimentOutlined />}
                    size="small"
                    loading={testingRuleId === rule.id}
                    onClick={() => handleTestRule(rule)}
                    disabled={!rule.enabled || !rule.value}
                  >
                    {testResults[rule.id] !== undefined 
                      ? `命中 ${testResults[rule.id]}` 
                      : '测试'
                    }
                  </Button>
                </Tooltip>
              )}

              {/* 删除按钮 */}
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={() => handleDeleteRule(rule.id)}
              >
                删除
              </Button>

              {/* 性能提示 */}
              {rule.op === 'regex' && rule.enabled && (
                <Tag color="orange" style={{ fontSize: '10px' }}>
                  ⚠️ 正则表达式会降低性能
                </Tag>
              )}
            </Space>

            {/* 规则解释 */}
            {!compact && rule.enabled && rule.value && (
              <div style={{
                marginTop: 8,
                padding: '4px 8px',
                background: '#f0f7ff',
                borderRadius: 4,
                fontSize: '11px',
                color: '#1890ff',
              }}>
                📖 解释：排除所有 <strong>{ATTR_OPTIONS.find(o => o.value === rule.attr)?.label}</strong> {' '}
                {rule.op === 'equals' && '等于'}
                {rule.op === 'contains' && '包含'}
                {rule.op === 'regex' && '匹配正则'}
                {' '}<code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: 2 }}>{rule.value}</code> 的元素
              </div>
            )}
          </Card>
        ))}
      </Space>

      {/* 添加规则按钮 */}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAddRule}
        block
        style={{ marginTop: 8 }}
      >
        添加排除规则
      </Button>

      {/* 规则统计 */}
      {rules.length > 0 && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: 4,
          fontSize: '12px',
          color: '#666',
        }}>
          📊 共 {rules.length} 条规则，
          已启用 {rules.filter(r => r.enabled).length} 条，
          包含正则 {rules.filter(r => r.op === 'regex').length} 条
          {testResults && Object.keys(testResults).length > 0 && (
            <>
              {' '}| 📈 总命中数：{Object.values(testResults).reduce((a, b) => a + b, 0)}
            </>
          )}
        </div>
      )}
    </div>
  );
};
