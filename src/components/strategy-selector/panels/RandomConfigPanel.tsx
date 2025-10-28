// src/components/strategy-selector/panels/RandomConfigPanel.tsx
// module: ui | layer: ui | role: 随机选择配置面板
// summary: 提供随机选择的种子配置、排序稳定性等设置

import React from 'react';
import { Tooltip, Switch, InputNumber } from 'antd';
import type { RandomConfig } from '../types/selection-config';

interface RandomConfigPanelProps {
  config: RandomConfig;
  onChange: (config: RandomConfig) => void;
}

/**
 * 随机选择配置面板组件
 */
export const RandomConfigPanel: React.FC<RandomConfigPanelProps> = ({
  config,
  onChange,
}) => {
  return (
    <div
      style={{
        marginTop: "12px",
        padding: "12px",
        background: "rgba(139, 92, 246, 0.05)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        borderRadius: "6px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#A78BFA", marginBottom: "8px", fontWeight: 500 }}>
        🎲 随机选择配置
      </div>

      {/* 自定义种子开关 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", color: "#94A3B8", minWidth: "80px" }}>自定义种子:</span>
        <Switch
          size="small"
          checked={config.custom_seed_enabled}
          onChange={(checked) => {
            onChange({
              ...config,
              custom_seed_enabled: checked,
              seed: checked ? (config.seed || Date.now()) : undefined,
            });
          }}
        />
        <Tooltip
          title="启用后可设置固定种子，用于复现相同的随机结果"
          placement="top"
        >
          <span style={{ fontSize: "11px", color: "#8B5CF6", cursor: "help" }}>?</span>
        </Tooltip>
      </div>

      {/* 种子值输入 */}
      {config.custom_seed_enabled && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", color: "#94A3B8", minWidth: "80px" }}>种子值:</span>
          <InputNumber
            size="small"
            min={0}
            max={Number.MAX_SAFE_INTEGER}
            value={config.seed || Date.now()}
            onChange={(value) => {
              onChange({
                ...config,
                seed: value || Date.now(),
              });
            }}
            style={{
              width: "120px",
              fontSize: "11px",
            }}
          />
          <Tooltip
            title="使用相同的种子值可以复现相同的随机序列"
            placement="top"
          >
            <span style={{ fontSize: "11px", color: "#8B5CF6", cursor: "help" }}>📌</span>
          </Tooltip>
        </div>
      )}

      {/* 稳定排序开关 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", color: "#94A3B8", minWidth: "80px" }}>稳定排序:</span>
        <Switch
          size="small"
          checked={config.ensure_stable_sort}
          onChange={(checked) => {
            onChange({
              ...config,
              ensure_stable_sort: checked,
            });
          }}
        />
        <Tooltip
          title="确保每次执行时，相同的候选列表产生相同的随机结果"
          placement="top"
        >
          <span style={{ fontSize: "11px", color: "#8B5CF6", cursor: "help" }}>?</span>
        </Tooltip>
      </div>

      {/* 说明文字 */}
      <div
        style={{
          marginTop: "8px",
          padding: "6px",
          background: "rgba(139, 92, 246, 0.08)",
          borderRadius: "4px",
          fontSize: "10px",
          color: "#A78BFA",
          lineHeight: "1.5",
        }}
      >
        <div>💡 <strong>使用场景</strong>：</div>
        <div style={{ marginLeft: "16px", marginTop: "2px" }}>
          • 测试不同元素的点击效果<br />
          • 避免机器检测（随机行为）<br />
          • 复现问题（使用固定种子）
        </div>
      </div>
    </div>
  );
};
