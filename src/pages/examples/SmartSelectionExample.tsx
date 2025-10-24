// src/pages/examples/SmartSelectionExample.tsx
// module: pages | layer: ui | role: 智能选择功能演示
// summary: 展示三条执行链与五种选择模式的15种组合UI

import React, { useState } from 'react';
import { Card, Divider, Space, Typography, Button, Tag } from 'antd';
import { RocketOutlined, ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { SmartSelectionConfigPanel } from '../../components/smart-selection/SmartSelectionConfigPanel';
import type { SmartSelectionConfig } from '../../components/smart-selection/SmartSelectionConfigPanel';

const { Title, Text, Paragraph } = Typography;

export const SmartSelectionExample: React.FC = () => {
  const [config, setConfig] = useState<SmartSelectionConfig>({
    executionChain: 'intelligent_chain',
    selectionMode: { type: 'first' },
    containerXPath: '//android.widget.RecyclerView',
    i18nAliases: ['关注', '+关注', 'Follow', 'Following'],
    targetText: '关注',
    minConfidence: 0.8
  });

  // 15种组合的预设配置
  const presetCombinations = [
    // 智能自动链 (5种)
    {
      name: '🧠自动链 × 精确匹配',
      level: 'excellent',
      config: {
        executionChain: 'intelligent_chain' as const,
        selectionMode: { type: 'match_original' as const, min_confidence: 0.8, fallback_to_first: true },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '🔥 最推荐：稳定可靠，支持指纹匹配'
      }
    },
    {
      name: '🧠自动链 × 批量全部', 
      level: 'excellent',
      config: {
        executionChain: 'intelligent_chain' as const,
        selectionMode: { 
          type: 'all' as const, 
          batch_config: { maxPerSession: 10, intervalMs: 2000, jitterMs: 500 }
        },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '🚀 批量首选：一次dump高效处理'
      }
    },
    {
      name: '🧠自动链 × 第一个',
      level: 'good',
      config: {
        executionChain: 'intelligent_chain' as const,
        selectionMode: { type: 'first' as const },
        containerXPath: '//android.widget.RecyclerView', 
        i18nAliases: ['关注', 'Follow'],
        description: '✅ 稳妥选择：语义分析后取首个'
      }
    },
    {
      name: '🧠自动链 × 最后一个',
      level: 'good', 
      config: {
        executionChain: 'intelligent_chain' as const,
        selectionMode: { type: 'last' as const },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '✅ 适用：语义分析后取末个'
      }
    },
    {
      name: '🧠自动链 × 随机选择',
      level: 'warning',
      config: {
        executionChain: 'intelligent_chain' as const,
        selectionMode: { type: 'random' as const, seed: 12345, ensure_stable_sort: true },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'], 
        description: '⚠️ 少用：随机性可能影响稳定性'
      }
    },

    // 智能单步 (5种)
    {
      name: '🧪单步 × 第一个',
      level: 'excellent',
      config: {
        executionChain: 'single_step' as const,
        selectionMode: { type: 'first' as const },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '⭐ 默认推荐：调试验证的最佳选择'
      }
    },
    {
      name: '🧪单步 × 精确匹配',
      level: 'good',
      config: {
        executionChain: 'single_step' as const,
        selectionMode: { type: 'match_original' as const, min_confidence: 0.8, fallback_to_first: true },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '✅ 有指纹时可用：精确重现'
      }
    },
    {
      name: '🧪单步 × 最后一个',
      level: 'normal',
      config: {
        executionChain: 'single_step' as const,
        selectionMode: { type: 'last' as const },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '✅ 可用：调试时查看末尾元素'
      }
    },
    {
      name: '🧪单步 × 随机选择',
      level: 'normal',
      config: {
        executionChain: 'single_step' as const,
        selectionMode: { type: 'random' as const, seed: 54321, ensure_stable_sort: true },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '✅ 测试用：验证随机性'
      }
    },
    {
      name: '🧪单步 × 批量全部',
      level: 'warning',
      config: {
        executionChain: 'single_step' as const,
        selectionMode: { 
          type: 'all' as const,
          batch_config: { maxPerSession: 5, intervalMs: 3000, jitterMs: 300 }
        },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '⚠️ 调试慎用：批量操作影响测试'
      }
    },

    // 静态策略 (5种)  
    {
      name: '⚡静态 × 第一个',
      level: 'excellent',
      config: {
        executionChain: 'static_strategy' as const,
        selectionMode: { type: 'first' as const },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '⭐ 默认推荐：高性能直接取首个'
      }
    },
    {
      name: '⚡静态 × 批量全部',
      level: 'good',
      config: {
        executionChain: 'static_strategy' as const,
        selectionMode: {
          type: 'all' as const,
          batch_config: { maxPerSession: 20, intervalMs: 1500, jitterMs: 200 }
        },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'], 
        description: '✅ 高频批量：配合轻校验使用'
      }
    },
    {
      name: '⚡静态 × 精确匹配',
      level: 'warning',
      config: {
        executionChain: 'static_strategy' as const,
        selectionMode: { type: 'match_original' as const, min_confidence: 0.8, fallback_to_first: true },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '⚠️ 有指纹才建议：否则别用'
      }
    },
    {
      name: '⚡静态 × 最后一个',
      level: 'normal',
      config: {
        executionChain: 'static_strategy' as const,
        selectionMode: { type: 'last' as const },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '✅ 可用：静态获取末尾'
      }
    },
    {
      name: '⚡静态 × 随机选择',
      level: 'normal', 
      config: {
        executionChain: 'static_strategy' as const,
        selectionMode: { type: 'random' as const, seed: 99999, ensure_stable_sort: true },
        containerXPath: '//android.widget.RecyclerView',
        i18nAliases: ['关注', 'Follow'],
        description: '✅ 可用：简单随机选择'
      }
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return '#52c41a';
      case 'good': return '#1890ff';
      case 'warning': return '#fa8c16';
      default: return '#666666';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'excellent': return '强烈推荐';
      case 'good': return '推荐使用';
      case 'warning': return '谨慎使用';
      default: return '可以使用';
    }
  };

  return (
    <div className="light-theme-force" style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* 标题说明 */}
        <div>
          <Title level={2}>🎯 智能选择：三条执行链 × 五种模式 = 15种组合</Title>
          <Paragraph>
            <Text>
              项目支持<Text strong>3条执行链</Text>（智能自动链、智能单步、静态策略）
              和<Text strong>5种选择模式</Text>（第一个、最后、精确匹配、随机、批量全部），
              共计<Text strong style={{ color: '#1890ff' }}>3 × 5 = 15种组合</Text>。
            </Text>
          </Paragraph>
          <Paragraph>
            <Text type="secondary">
              每种组合都有其适用场景，下面展示所有15种组合的推荐度和使用说明。
            </Text>
          </Paragraph>
        </div>

        <Divider />

        {/* 动态配置面板 */}
        <Card title="🛠️ 动态配置测试" size="small">
          <SmartSelectionConfigPanel 
            config={config}
            onChange={setConfig}
            size="small"
          />
          
          <Divider />
          
          <div>
            <Text strong>当前配置预览：</Text>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 4, 
              marginTop: 8,
              fontSize: '12px'
            }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </Card>

        <Divider />

        {/* 15种预设组合展示 */}
        <div>
          <Title level={3}>📋 全部15种组合预览</Title>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {presetCombinations.map((combo, index) => (
              <Card 
                key={index}
                size="small"
                title={
                  <Space>
                    {combo.name}
                    <Tag color={getLevelColor(combo.level)} size="small">
                      {getLevelText(combo.level)}
                    </Tag>
                  </Space>
                }
                extra={
                  <Button 
                    size="small"
                    type="link"
                    onClick={() => setConfig(combo.config as SmartSelectionConfig)}
                  >
                    应用
                  </Button>
                }
                style={{ 
                  borderColor: getLevelColor(combo.level),
                  borderWidth: combo.level === 'excellent' ? 2 : 1
                }}
              >
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {combo.config.description}
                </Text>
                
                <div style={{ marginTop: 8, fontSize: '11px' }}>
                  <Text code>
                    {combo.config.executionChain} × {combo.config.selectionMode.type}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 使用建议总结 */}
        <Card title="💡 使用建议总结" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>🔥 最佳实践组合：</Text>
              <ul>
                <li><Text mark>智能自动链 × 精确匹配</Text> - 稳定可靠的首选</li>
                <li><Text mark>智能自动链 × 批量全部</Text> - 批量操作的最佳选择</li>
                <li><Text mark>智能单步 × 第一个</Text> - 调试验证的默认选择</li>
                <li><Text mark>静态策略 × 第一个</Text> - 高性能场景的首选</li>
              </ul>
            </div>
            
            <div>
              <Text strong>⚠️ 需要谨慎的组合：</Text>
              <ul>
                <li><Text type="warning">智能自动链 × 随机选择</Text> - 随机性影响稳定性</li>
                <li><Text type="warning">智能单步 × 批量全部</Text> - 调试时避免批量</li>
                <li><Text type="warning">静态策略 × 精确匹配</Text> - 没有指纹时别用</li>
              </ul>
            </div>

            <div>
              <Text strong>🎯 选择原则：</Text>
              <ul>
                <li><Text>有指纹数据 → 优先选择"精确匹配"模式</Text></li>
                <li><Text>需要批量操作 → 智能自动链 + 批量全部模式</Text></li>
                <li><Text>调试验证 → 智能单步 + 第一个模式</Text></li>
                <li><Text>追求性能 → 静态策略 + 第一个模式</Text></li>
              </ul>
            </div>
          </Space>
        </Card>

      </Space>
    </div>
  );
};