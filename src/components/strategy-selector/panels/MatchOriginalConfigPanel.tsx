// src/components/strategy-selector/panels/MatchOriginalConfigPanel.tsx
// module: ui | layer: panels | role: 精准匹配配置面板
// summary: 提供精准匹配模式的详细配置选项

import React from 'react';
import { Slider, Switch, Checkbox, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { MatchOriginalConfig } from '../types/selection-config';

interface MatchOriginalConfigPanelProps {
  config: MatchOriginalConfig;
  onChange: (config: MatchOriginalConfig) => void;
}

/**
 * 精准匹配配置面板
 * 
 * 提供严格的匹配配置选项：
 * - 最小置信度阈值调节
 * - 失败回退策略
 * - 严格模式开关
 * - 匹配属性选择
 */
export const MatchOriginalConfigPanel: React.FC<MatchOriginalConfigPanelProps> = ({
  config,
  onChange,
}) => {
  const attributeOptions = [
    { value: 'text', label: '文本内容', description: '匹配元素的文本' },
    { value: 'resource_id', label: '资源ID', description: '匹配元素的唯一标识符' },
    { value: 'content_desc', label: '内容描述', description: '匹配元素的描述信息' },
    { value: 'bounds', label: '位置边界', description: '匹配元素的屏幕位置' },
    { value: 'class_name', label: '类名', description: '匹配元素的类型' },
  ] as const;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        background: 'rgba(255, 159, 64, 0.05)',
        border: '1px solid rgba(255, 159, 64, 0.2)',
        borderRadius: '6px',
        width: '100%',
        marginTop: '8px',
      }}
    >
      {/* 标题 */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#F8FAFC',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        🎯 精准匹配配置
        <Tooltip title="精准匹配模式会严格验证元素是否与原始选择一致，适用于需要高可靠性的场景">
          <InfoCircleOutlined style={{ fontSize: '11px', color: '#94A3B8', cursor: 'help' }} />
        </Tooltip>
      </div>

      {/* 最小置信度 */}
      <div style={{ marginTop: '4px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
            最小置信度: <strong style={{ color: '#F8FAFC' }}>{(config.min_confidence * 100).toFixed(0)}%</strong>
          </span>
          <Tooltip title="置信度越高，匹配越严格。建议：普通场景70%，重要场景85%+">
            <InfoCircleOutlined style={{ fontSize: '10px', color: '#94A3B8', cursor: 'help' }} />
          </Tooltip>
        </div>
        <Slider
          min={70}
          max={100}
          step={5}
          value={config.min_confidence * 100}
          onChange={(value) => {
            onChange({
              ...config,
              min_confidence: value / 100,
            });
          }}
          marks={{
            70: '70%',
            85: '85%',
            95: '95%',
            100: '100%',
          }}
          tooltip={{
            formatter: (value) => `${value}%`,
          }}
          styles={{
            track: {
              background: 'linear-gradient(to right, rgba(255, 159, 64, 0.6), rgba(255, 159, 64, 0.9))',
            },
            rail: {
              background: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </div>

      {/* 严格模式 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          background: config.strict_mode ? 'rgba(255, 159, 64, 0.1)' : 'transparent',
          borderRadius: '4px',
          border: config.strict_mode ? '1px solid rgba(255, 159, 64, 0.3)' : '1px solid transparent',
        }}
      >
        <Switch
          checked={config.strict_mode}
          onChange={(checked) => {
            onChange({
              ...config,
              strict_mode: checked,
              // 严格模式下自动调整置信度和属性
              min_confidence: checked ? Math.max(config.min_confidence, 0.85) : config.min_confidence,
              match_attributes: checked
                ? ['text', 'resource_id', 'content_desc', 'bounds']
                : config.match_attributes,
            });
          }}
          size="small"
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#F8FAFC', fontWeight: '500' }}>
            🔒 严格模式
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
            {config.strict_mode ? '启用多属性验证，确保高可靠性' : '标准匹配模式'}
          </div>
        </div>
        <Tooltip title="严格模式会验证更多属性并提高置信度要求，适用于关键操作">
          <InfoCircleOutlined style={{ fontSize: '10px', color: '#94A3B8', cursor: 'help' }} />
        </Tooltip>
      </div>

      {/* 匹配属性选择 */}
      <div style={{ marginTop: '4px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#94A3B8',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          匹配属性
          <Tooltip title="选择需要验证的元素属性。勾选越多，匹配越严格">
            <InfoCircleOutlined style={{ fontSize: '10px', color: '#94A3B8', cursor: 'help' }} />
          </Tooltip>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}
        >
          {attributeOptions.map((option) => (
            <div
              key={option.value}
              style={{
                padding: '6px 8px',
                background: config.match_attributes.includes(option.value)
                  ? 'rgba(255, 159, 64, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: config.match_attributes.includes(option.value)
                  ? '1px solid rgba(255, 159, 64, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => {
                const newAttributes = config.match_attributes.includes(option.value)
                  ? config.match_attributes.filter((attr) => attr !== option.value)
                  : [...config.match_attributes, option.value];

                // 至少保留一个属性
                if (newAttributes.length > 0) {
                  onChange({
                    ...config,
                    match_attributes: newAttributes as MatchOriginalConfig['match_attributes'],
                  });
                }
              }}
            >
              <Checkbox
                checked={config.match_attributes.includes(option.value)}
                style={{ pointerEvents: 'none' }}
              >
                <Tooltip title={option.description}>
                  <span style={{ fontSize: '11px', color: '#F8FAFC' }}>{option.label}</span>
                </Tooltip>
              </Checkbox>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>
          已选择 {config.match_attributes.length} 个属性
          {config.match_attributes.length < 2 && (
            <span style={{ color: '#FAAD14' }}> · 建议至少选择2个属性</span>
          )}
        </div>
      </div>

      {/* 失败回退 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '4px',
        }}
      >
        <Switch
          checked={config.fallback_to_first}
          onChange={(checked) => {
            onChange({
              ...config,
              fallback_to_first: checked,
            });
          }}
          size="small"
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#F8FAFC' }}>匹配失败时回退到第一个</div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
            {config.fallback_to_first
              ? '找不到精确匹配时，选择候选列表中的第一个'
              : '找不到精确匹配时，操作失败'}
          </div>
        </div>
        <Tooltip title="建议开启回退策略以提高脚本稳定性">
          <InfoCircleOutlined style={{ fontSize: '10px', color: '#94A3B8', cursor: 'help' }} />
        </Tooltip>
      </div>

      {/* 配置摘要 */}
      <div
        style={{
          marginTop: '4px',
          padding: '8px',
          background: 'rgba(255, 159, 64, 0.08)',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#94A3B8',
          lineHeight: '1.5',
        }}
      >
        <strong style={{ color: '#F8FAFC' }}>当前策略：</strong>
        {config.strict_mode ? '🔒 严格' : '✅ 标准'}模式，
        置信度 ≥ {(config.min_confidence * 100).toFixed(0)}%，
        验证 {config.match_attributes.length} 个属性，
        {config.fallback_to_first ? '支持' : '不支持'}回退
      </div>
    </div>
  );
};
