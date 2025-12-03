// src/components/strategy-selector/panels/BatchConfigPanel.tsx
// module: strategy-selector | layer: ui | role: 批量执行配置面板
// summary: 批量选择模式的配置UI（间隔、数量、错误处理等）

import React from 'react';
import { Button, Collapse, Tooltip, message } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import type { BatchConfig } from '../types/selection-config';
import { ExcludeRuleEditor, type ExcludeRule } from '../../smart-selection/ExcludeRuleEditor';
import { ExplanationGenerator } from '../../smart-selection/ExplanationGenerator';

const { Panel } = Collapse;

interface BatchConfigPanelProps {
  config: BatchConfig;
  onChange: (config: BatchConfig) => void;
  selectedDevice?: { id: string } | null;
  executing: boolean;
  onExecute: () => void;
  stepId?: string;
  smartSelectionConfig: {
    mode: string;
    excludeText: string;
    autoExcludeEnabled: boolean;
    dedupeTolerance: number;
    enableLightValidation: boolean;
  };
  advancedRulesExpanded: boolean;
  onAdvancedRulesToggle: (expanded: boolean) => void;
  parseExcludeTextToRules: (text: string) => ExcludeRule[];
  formatRulesToExcludeText: (rules: ExcludeRule[]) => string;
}

export const BatchConfigPanel: React.FC<BatchConfigPanelProps> = ({
  config,
  onChange,
  selectedDevice,
  executing,
  onExecute,
  stepId,
  smartSelectionConfig,
  advancedRulesExpanded,
  onAdvancedRulesToggle,
  parseExcludeTextToRules,
  formatRulesToExcludeText,
}) => {
  const autoSaveConfig = async () => {
    if (!stepId) return;
    
    try {
      await invoke('plugin:enhanced_location|save_smart_selection_config', {
        stepId,
        selectionMode: 'all',
        batchConfig: config
      });
      console.log('✅ [BatchConfig] 配置自动保存成功');
    } catch (error) {
      console.error('❌ [BatchConfig] 保存失败:', error);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "12px",
      background: "rgba(110, 139, 255, 0.05)",
      border: "1px solid rgba(110, 139, 255, 0.2)",
      borderRadius: "6px",
      width: "100%",
      marginTop: "8px"
    }}>
      <div style={{
        fontSize: "12px",
        fontWeight: "600",
        color: "#F8FAFC",
        marginBottom: "4px"
      }}>
        📋 批量执行配置
      </div>
      
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {/* 间隔时间 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>间隔:</span>
          <input
            type="number"
            value={config.interval_ms}
            onChange={(e) => {
              const newInterval = Math.max(1000, parseInt(e.target.value) || 2000);
              onChange({ ...config, interval_ms: newInterval });
            }}
            onBlur={autoSaveConfig}
            style={{
              width: "60px",
              height: "24px",
              fontSize: "11px",
              padding: "2px 4px",
              border: "1px solid rgba(110, 139, 255, 0.3)",
              borderRadius: "3px",
              background: "rgba(0, 0, 0, 0.2)",
              color: "#F8FAFC"
            }}
          />
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>ms</span>
        </div>

        {/* 最大数量 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>最大:</span>
          <input
            type="number"
            value={config.max_count || 10}
            onChange={(e) => {
              const newMaxCount = Math.max(1, parseInt(e.target.value) || 10);
              onChange({ ...config, max_count: newMaxCount });
            }}
            onBlur={autoSaveConfig}
            style={{
              width: "50px",
              height: "24px",
              fontSize: "11px",
              padding: "2px 4px",
              border: "1px solid rgba(110, 139, 255, 0.3)",
              borderRadius: "3px",
              background: "rgba(0, 0, 0, 0.2)",
              color: "#F8FAFC"
            }}
          />
        </div>

        {/* 错误处理 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={config.continue_on_error}
            onChange={async (e) => {
              onChange({ ...config, continue_on_error: e.target.checked });
              await autoSaveConfig();
            }}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>遇错继续</span>
        </div>

        {/* 显示进度 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={config.show_progress}
            onChange={async (e) => {
              onChange({ ...config, show_progress: e.target.checked });
              await autoSaveConfig();
            }}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>显示进度</span>
        </div>

        {/* 匹配方向 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>方向:</span>
          <select
            value={config.match_direction || 'forward'}
            onChange={async (e) => {
              const newDirection = e.target.value as 'forward' | 'backward';
              const newConfig = { ...config, match_direction: newDirection };
              onChange(newConfig);
              
              if (stepId) {
                try {
                  await invoke('plugin:enhanced_location|save_smart_selection_config', {
                    stepId,
                    selectionMode: 'all',
                    batchConfig: newConfig
                  });
                  message.success(`匹配方向已更新为: ${newDirection === 'forward' ? '正向↓' : '反向↑'}`);
                } catch (error) {
                  console.error('❌ [匹配方向] 保存失败:', error);
                  message.error(`保存失败: ${error}`);
                }
              }
            }}
            style={{
              height: "24px",
              fontSize: "11px",
              padding: "0 4px",
              border: "1px solid rgba(110, 139, 255, 0.3)",
              borderRadius: "3px",
              background: "rgba(0, 0, 0, 0.2)",
              color: "#F8FAFC",
              cursor: "pointer"
            }}
          >
            <option value="forward">↓ 正向</option>
            <option value="backward">↑ 反向</option>
          </select>
          <Tooltip title="正向:从上到下执行 | 反向:从下到上执行" placement="top">
            <span style={{ fontSize: "11px", color: "#6E8BFF", cursor: "help" }}>?</span>
          </Tooltip>
        </div>
      </div>
      
      {/* 测试按钮 */}
      <div style={{ marginTop: "8px", display: "flex", justifyContent: "center" }}>
        <Button
          size="small"
          type="primary"
          loading={executing}
          disabled={!selectedDevice || executing}
          onClick={onExecute}
          style={{
            fontSize: "11px",
            height: "28px",
            background: executing ? "#94A3B8" : (!selectedDevice ? "#6B7280" : "rgba(16, 185, 129, 0.8)"),
            borderColor: executing ? "#94A3B8" : (!selectedDevice ? "#6B7280" : "rgba(16, 185, 129, 0.9)")
          }}
        >
          {executing ? "🔄 执行中..." : (!selectedDevice ? "⚠️ 需要ADB设备" : "🧪 测试批量执行")}
        </Button>
      </div>

      {/* 高级排除规则 */}
      <div style={{ 
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "1px solid rgba(110, 139, 255, 0.2)"
      }}>
        <Collapse 
          activeKey={advancedRulesExpanded ? ['advanced-rules'] : []}
          onChange={(keys) => {
            onAdvancedRulesToggle(keys.includes('advanced-rules'));
          }}
          size="small"
          style={{ 
            background: "transparent",
            border: "1px solid rgba(110, 139, 255, 0.3)",
            borderRadius: "4px"
          }}
        >
          <Panel 
            header={
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                🔧 高级排除规则 <span style={{ fontSize: "10px", opacity: 0.7 }}>(可选)</span>
              </div>
            }
            key="advanced-rules"
          >
            <div style={{ padding: "8px 0" }}>
              <ExcludeRuleEditor
                rules={parseExcludeTextToRules(smartSelectionConfig.excludeText)}
                onChange={(rules) => {
                  const excludeText = formatRulesToExcludeText(rules);
                  smartSelectionConfig.excludeText = excludeText;
                  console.log('规则更新:', excludeText);
                }}
                onTest={async (rule) => {
                  message.info(`测试规则: ${rule.attr} ${rule.op} ${rule.value}`);
                  return 0;
                }}
                compact={true}
              />

              <div style={{ marginTop: "8px" }}>
                <ExplanationGenerator
                  config={{
                    mode: smartSelectionConfig.mode as 'auto' | 'first' | 'last' | 'all' | 'manual',
                    autoExcludeEnabled: smartSelectionConfig.autoExcludeEnabled,
                    excludeRules: parseExcludeTextToRules(smartSelectionConfig.excludeText),
                    dedupeTolerance: smartSelectionConfig.dedupeTolerance,
                    enableLightValidation: smartSelectionConfig.enableLightValidation
                  }}
                  compact={true}
                />
              </div>
            </div>
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};
