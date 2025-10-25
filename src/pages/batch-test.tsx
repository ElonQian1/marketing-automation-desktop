// src/pages/batch-test.tsx
// module: ui | layer: pages | role: 批量智能选择测试页面
// summary: 测试单个模式和批量模式的智能选择功能

import React, { useState } from 'react';
import { Card, Button, Space, Input, Switch, InputNumber, message, Divider } from 'antd';
import { invoke } from '@tauri-apps/api/core';

interface SmartSelectionResult {
  success: boolean;
  message: string;
  matched_elements?: {
    total_found: number;
    filtered_count: number;
    selected_count: number;
    confidence_scores?: number[];
  };
  execution_info?: {
    used_strategy: string;
    execution_time_ms: number;
    click_coordinates?: Array<{x: number, y: number}>;
  };
  debug_info?: {
    candidate_analysis: string[];
    strategy_attempts: string[];
    error_details?: string;
  };
}

export const BatchTestPage: React.FC = () => {
  const [deviceId, setDeviceId] = useState('');
  const [targetText, setTargetText] = useState('关注');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchInterval, setBatchInterval] = useState(2000);
  const [maxCount, setMaxCount] = useState(5);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<SmartSelectionResult | null>(null);

  const executeTest = async () => {
    if (!deviceId.trim()) {
      message.error('请输入设备ID');
      return;
    }

    if (!targetText.trim()) {
      message.error('请输入目标文本');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      // 构建智能选择协议
      const protocol = {
        anchor: {
          fingerprint: {
            text_content: targetText
          }
        },
        selection: {
          mode: isBatchMode ? 'All' : 'Auto', // 使用Auto模式作为智能选择
          batch_config: isBatchMode ? {
            interval_ms: batchInterval,
            max_count: maxCount,
            continue_on_error: true,
            show_progress: true,
            jitter_ms: 500
          } : undefined,
          filters: {
            min_confidence: 0.7
          }
        },
        matching_context: {
          i18n_aliases: [targetText, targetText.toLowerCase()],
          light_assertions: {
            must_be_clickable: true,
            exclude_text: ['已关注', '关注中']
          }
        }
      };

      console.log('🚀 执行智能选择测试', {
        deviceId,
        mode: isBatchMode ? 'batch' : 'single',
        protocol
      });

      const result = await invoke('execute_smart_selection', {
        deviceId,
        protocol
      }) as SmartSelectionResult;

      console.log('✅ 执行结果:', result);
      setResult(result);
      
      if (result?.success) {
        message.success(`执行成功！${isBatchMode ? `批量点击了 ${result.matched_elements?.selected_count || 0} 个元素` : '单个元素匹配成功'}`);
      } else {
        message.warning(`执行失败: ${result?.message || '未知错误'}`);
      }
      
    } catch (error) {
      console.error('❌ 执行失败:', error);
      message.error(`执行出错: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="light-theme-force" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 批量智能选择测试</h2>
      
      {/* 基础配置 */}
      <Card title="🎯 基础配置" size="small" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <label>设备ID:</label>
            <Input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="输入ADB设备ID"
              style={{ marginLeft: '8px', width: '200px' }}
            />
          </div>
          
          <div>
            <label>目标文本:</label>
            <Input
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              placeholder="如：关注"
              style={{ marginLeft: '8px', width: '200px' }}
            />
          </div>
        </Space>
      </Card>

      {/* 模式选择 */}
      <Card title="🔄 执行模式" size="small" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Switch
              checked={isBatchMode}
              onChange={setIsBatchMode}
              checkedChildren="📋 批量模式"
              unCheckedChildren="🔍 单个模式"
            />
            <span style={{ marginLeft: '12px', color: '#666' }}>
              {isBatchMode ? 
                '一次dump后点击所有匹配的元素' : 
                '只匹配和点击最相似的一个元素'
              }
            </span>
          </div>
          
          {isBatchMode && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Space>
                <label>批量间隔:</label>
                <InputNumber
                  value={batchInterval}
                  onChange={(val) => setBatchInterval(val || 2000)}
                  min={500}
                  max={10000}
                  step={500}
                  formatter={value => `${value}ms`}
                  parser={value => Number(value?.replace('ms', '') || '2000')}
                />
              </Space>
              
              <Space>
                <label>最大数量:</label>
                <InputNumber
                  value={maxCount}
                  onChange={(val) => setMaxCount(val || 5)}
                  min={1}
                  max={20}
                />
              </Space>
            </>
          )}
        </Space>
      </Card>

      {/* 执行按钮 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Button
          type="primary"
          size="large"
          loading={isExecuting}
          onClick={executeTest}
          style={{ width: '100%' }}
        >
          {isExecuting ? 
            '执行中...' : 
            `🚀 执行${isBatchMode ? '批量' : '单个'}智能选择测试`
          }
        </Button>
      </Card>

      {/* 执行结果 */}
      {result && (
        <Card 
          title={
            <Space>
              {result.success ? '✅ 执行成功' : '❌ 执行失败'}
              <span style={{ fontSize: '12px', color: '#666' }}>
                {isBatchMode ? '批量模式' : '单个模式'}
              </span>
            </Space>
          } 
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <strong>消息:</strong> {result.message}
            </div>
            
            {result.matched_elements && (
              <div>
                <strong>匹配信息:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  <li>总共找到: {result.matched_elements.total_found} 个元素</li>
                  <li>过滤后: {result.matched_elements.filtered_count} 个元素</li>
                  <li>选择了: {result.matched_elements.selected_count} 个元素</li>
                  <li>置信度: {result.matched_elements.confidence_scores?.join(', ')}</li>
                </ul>
              </div>
            )}
            
            {result.execution_info && (
              <div>
                <strong>执行信息:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  <li>使用策略: {result.execution_info.used_strategy}</li>
                  <li>执行时间: {result.execution_info.execution_time_ms}ms</li>
                  <li>点击坐标: {result.execution_info.click_coordinates?.length || 0} 个</li>
                </ul>
              </div>
            )}
            
            {result.debug_info?.candidate_analysis && (
              <details>
                <summary style={{ cursor: 'pointer', marginTop: '8px' }}>
                  🔍 调试信息 ({result.debug_info.candidate_analysis.length} 条)
                </summary>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {result.debug_info.candidate_analysis.map((log: string, index: number) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </details>
            )}
          </Space>
        </Card>
      )}

      {/* 使用说明 */}
      <Card title="📋 使用说明" size="small" style={{ marginTop: '20px' }}>
        <Space direction="vertical" size="small">
          <div><strong>🎯 单个模式:</strong></div>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>使用智能自动链 + 精确匹配</li>
            <li>找到最相似的一个"关注"按钮并点击</li>
            <li>适合精确复现之前的操作</li>
          </ul>
          
          <div><strong>📋 批量模式:</strong></div>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>使用智能自动链 + 批量全部</li>
            <li>一次dump后找到所有"关注"按钮</li>
            <li>按配置间隔逐一点击，不重复dump</li>
            <li>自动排除"已关注"状态的按钮</li>
          </ul>
        </Space>
      </Card>
    </div>
  );
};

export default BatchTestPage;