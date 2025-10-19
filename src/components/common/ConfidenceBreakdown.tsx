// src/components/common/ConfidenceBreakdown.tsx
// module: shared | layer: ui | role: 置信度明细展示组件
// summary: 展示置信度的详细分解信息，包括推荐策略和证据分析

import React from 'react';
import { Progress, Divider } from 'antd';
import { normalizeEvidence, formatPercent, type Evidence } from '../../utils/confidence-format';

export interface ConfidenceBreakdownProps {
  /** 总体置信度 (0-1) */
  value?: number;
  /** 推荐策略 */
  recommended?: string;
  /** 证据详情 */
  evidence?: Evidence;
  /** 数据来源 */
  source?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export function ConfidenceBreakdown({ 
  value, 
  recommended, 
  evidence, 
  source,
  style = {}
}: ConfidenceBreakdownProps) {
  const items = normalizeEvidence(evidence);
  
  const containerStyle: React.CSSProperties = {
    minWidth: 280,
    maxWidth: 350,
    padding: '4px 0',
    ...style
  };

  // 策略名称映射
  const getStrategyLabel = (key?: string) => {
    const labels: Record<string, string> = {
      'self_anchor': '自身锚点定位',
      'vision_anchor': '视觉锚点定位', 
      'text_match': '文本精确匹配',
      'semantic_match': '语义智能匹配',
      'xpath_direct': 'XPath直接定位',
      'coordinates': '坐标定位',
    };
    return labels[key || ''] || key || '未知策略';
  };

  const getSourceLabel = (src?: string) => {
    const labels: Record<string, string> = {
      'auto_chain': '智能链式分析',
      'manual_select': '手动选择',
      'history_learn': '历史学习',
      'rule_based': '规则匹配',
    };
    return labels[src || ''] || src || '未知来源';
  };

  return (
    <div style={containerStyle}>
      {/* 总体信息 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 6 
        }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            总体可信度
          </span>
          <span style={{ 
            fontWeight: 700, 
            fontSize: 16,
            color: value && value >= 0.80 ? 'var(--success)' : 
                   value && value >= 0.60 ? 'var(--warning)' : 'var(--error)'
          }}>
            {formatPercent(value)}
          </span>
        </div>
        
        {recommended && (
          <div style={{ fontSize: 13, color: 'var(--text-2, rgba(255,255,255,0.75))' }}>
            推荐策略：<strong>{getStrategyLabel(recommended)}</strong>
          </div>
        )}
      </div>

      {/* 证据分解 */}
      {items.length > 0 && (
        <>
          <Divider style={{ margin: '12px 0 8px 0' }} />
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              分项证据分析
            </div>
            
            {items.map((item, index) => (
              <div key={item.key} style={{ marginBottom: 8 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4
                }}>
                  <span style={{ color: 'var(--text-2, rgba(255,255,255,0.85))' }}>
                    {item.label}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {formatPercent(item.percent)}
                  </span>
                </div>
                <Progress 
                  percent={Math.round(item.percent * 100)} 
                  showInfo={false}
                  strokeColor={index === 0 ? 'var(--brand, #6E8BFF)' : 'var(--neutral-400)'}
                  trailColor="var(--bg-secondary, rgba(255,255,255,0.1))"
                  size="small"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 来源信息 */}
      {source && (
        <>
          <Divider style={{ margin: '8px 0 6px 0' }} />
          <div style={{ 
            fontSize: 12, 
            color: 'var(--text-3, rgba(255,255,255,0.65))',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>数据来源</span>
            <span>{getSourceLabel(source)}</span>
          </div>
        </>
      )}
    </div>
  );
}