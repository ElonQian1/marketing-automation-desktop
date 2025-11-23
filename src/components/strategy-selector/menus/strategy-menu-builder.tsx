// src/components/strategy-selector/menus/strategy-menu-builder.tsx
// module: strategy-selector | layer: ui | role: 策略菜单构建器
// summary: 构建智能·自动链、智能·单步、静态策略三种菜单

import React from 'react';
import { message } from 'antd';
import type { MenuProps } from 'antd';
import type { SmartStep, StrategyEvents, StrategySelector } from '../../../types/strategySelector';
import type { StepCard } from '../../../store/stepcards';
import { StepSequenceMapper } from '../../../config/step-sequence';
import { isValidScore, toPercentInt01 } from '../../../utils/score-utils';
import { useAnalysisStateStore } from '../../../stores/analysis-state-store';
import { refreshAllScores, type RefreshAllScoresConfig } from '../scoring/refresh-all-scores';

/**
 * 菜单构建器配置
 */
export interface StrategyMenuConfig {
  selector: StrategySelector;
  events: StrategyEvents;
  stepId?: string;
  cardStore: { cards: Record<string, StepCard> };
  setFinalScores: (scores: Array<{
    stepId: string;
    confidence: number;
    strategy: string;
    metrics: { source: string; mode: string; timestamp: number };
  }>) => void;
  getStepConfidence: (candidateKey: string) => number | null;
  recommendedKey?: string;
  onUpdateStepParameters?: (stepId: string, params: Record<string, unknown>) => void;
  handleOpenStructuralMatching: () => Promise<void>;
  dataError: Error | null;
  dataLoading: boolean;
  startAnalysis?: (config: unknown) => Promise<void>;
}

/**
 * 创建刷新所有评分的函数
 * @param config 菜单配置
 * @returns 刷新函数
 */
export function createRefreshScoresFunction(config: StrategyMenuConfig): (() => Promise<void>) | undefined {
  const { stepId, cardStore, startAnalysis } = config;
  
  if (!stepId || !startAnalysis) {
    return undefined;
  }

  return async () => {
    const card = cardStore.cards[stepId];
    if (!card) {
      message.warning('步骤卡片数据不完整');
      return;
    }

    await refreshAllScores({
      stepId,
      card,
      startAnalysis,
    });
  };
}

/**
 * 根据置信度百分比返回对应的颜色
 */
function getConfidenceColor(percent: number): string {
  if (percent >= 85) return "green";
  if (percent >= 70) return "blue";
  if (percent >= 55) return "orange";
  if (percent >= 40) return "volcano";
  return "red";
}

/**
 * 构建策略选择菜单
 */
export function buildStrategyMenu(config: StrategyMenuConfig): MenuProps {
  const {
    selector,
    events,
    stepId,
    cardStore,
    setFinalScores,
    getStepConfidence,
    recommendedKey,
    onUpdateStepParameters,
    handleOpenStructuralMatching,
    dataError,
    dataLoading,
    startAnalysis,
  } = config;

  const SMART_STEPS = StepSequenceMapper.getAll().map(cfg => ({
    step: cfg.stepId as SmartStep,
    label: cfg.label,
    candidateKey: cfg.candidateKey,
  }));

  const items: MenuProps['items'] = [
    // 智能·自动链
    {
      key: "smart-auto",
      icon: <span>🧠</span>,
      label: "智能·自动链",
      children: [
        {
          key: "smart-auto-refresh-all",
          icon: <span>🔄</span>,
          label: "刷新所有评分（Step1-8）",
          onClick: async () => {
            console.log('🎯 [菜单] 用户点击：刷新所有评分');
            
            if (!stepId) {
              message.warning('请先创建步骤卡片');
              return;
            }
            
            const card = cardStore.cards[stepId];
            if (!card) {
              message.warning('步骤卡片数据不完整');
              return;
            }
            
            if (!startAnalysis) {
              message.error('智能分析功能不可用');
              return;
            }
            
            // 使用统一的刷新函数
            await refreshAllScores({ stepId, card, startAnalysis });
          },
        },
        {
          key: "smart-auto-execute",
          label: "执行决策链（Step1-8）",
          onClick: async () => {
            console.log('🎯 [菜单] 用户点击：智能·自动链（执行决策链）', { stepId });
            events.onStrategyChange({ type: "smart-auto" });
            
            if (!stepId) {
              console.warn('⚠️ [菜单] 缺少stepId');
              message.warning('请先创建步骤卡片');
              return;
            }
            
            const card = cardStore.cards[stepId];
            console.log('📊 [菜单] 卡片数据:', { 
              hasCard: !!card, 
              cardId: stepId,
              xpath: card?.elementContext?.xpath
            });
            
            if (!card) {
              message.warning('步骤卡片数据不完整，跳过执行');
              return;
            }
            
            if (!startAnalysis) {
              message.error('智能分析功能不可用');
              return;
            }
            
            try {
              console.log('🚀 [菜单] 开始执行智能·自动链决策链（Step1-8）...');
              message.info('将触发智能分析获取所有Step1-8评分');
              
              // 构建分析配置
              const analysisConfig = {
                element_context: {
                  snapshot_id: card.xmlSnapshot?.xmlCacheId || 'unknown',
                  element_path: card.elementContext?.xpath || '',
                  element_text: card.elementContext?.text,
                  element_bounds: card.elementContext?.bounds,
                },
                step_id: stepId,
                lock_container: false,
                enable_smart_candidates: true,
                enable_static_candidates: true,
              };
              
              await startAnalysis(analysisConfig);
              console.log('✅ [菜单] 智能·自动链评分已启动');
            } catch (error) {
              console.error('❌ [智能·自动链] 执行失败:', error);
            }
          },
        },
        {
          key: "smart-auto-refresh-execute",
          icon: <span>🔄</span>,
          label: "强制刷新后执行",
          onClick: async () => {
            console.log('🎯 [菜单] 用户点击：智能·自动链（强制刷新后执行）', { stepId });
            events.onStrategyChange({ type: "smart-auto" });
            
            if (!stepId) {
              console.warn('⚠️ [菜单] 缺少stepId');
              message.warning('请先创建步骤卡片');
              return;
            }
            
            // 🔧 修复：正确通过 stepId 查找 cardId
            const cardId = cardStore.byStepId[stepId];
            const card = cardId ? cardStore.cards[cardId] : undefined;
            
            if (!card) {
              message.warning('步骤卡片数据不完整，跳过执行');
              return;
            }
            
            if (!startAnalysis) {
              message.error('智能分析功能不可用');
              return;
            }
            
            try {
              console.log('🔄 [菜单] 强制刷新所有评分，然后执行决策链...');
              message.info('将强制刷新所有Step1-8评分');
              
              // 构建分析配置
              const analysisConfig = {
                element_context: {
                  snapshot_id: card.xmlSnapshot?.xmlCacheId || 'unknown',
                  element_path: card.elementContext?.xpath || '',
                  element_text: card.elementContext?.text,
                  element_bounds: card.elementContext?.bounds,
                  // 🔥 关键修复：传递 index_path 以启用结构匹配
                  index_path: card.staticLocator?.indexPath,
                },
                step_id: stepId,
                lock_container: false,
                enable_smart_candidates: true,
                enable_static_candidates: true,
              };
              
              await startAnalysis(analysisConfig);
              console.log('✅ [菜单] 智能·自动链强制刷新评分已启动');
            } catch (error) {
              console.error('❌ [智能·自动链] 强制刷新执行失败:', error);
            }
          },
        },
      ],
    },
    
    // 智能·单步
    {
      key: "smart-single",
      icon: <span>🎯</span>,
      label: "智能·单步",
      children: [
        // 🔄 统一刷新所有评分按钮
        {
          key: "smart-single-refresh-all",
          icon: <span>🔄</span>,
          label: "刷新所有评分（Step1-8）",
          onClick: async () => {
            console.log('🎯 [菜单] 用户点击：刷新所有评分');
            
            if (!stepId) {
              message.warning('请先创建步骤卡片');
              return;
            }
            
            // 🔧 修复：正确通过 stepId 查找 cardId
            const cardId = cardStore.byStepId[stepId];
            const card = cardId ? cardStore.cards[cardId] : undefined;

            if (!card) {
              message.warning('步骤卡片数据不完整');
              return;
            }
            
            if (!startAnalysis) {
              message.error('智能分析功能不可用');
              return;
            }
            
            try {
              message.loading({ content: '🔄 重新评分中...', key: 'refresh-all-single', duration: 0 });
              
              // 构建分析配置
              const analysisConfig = {
                element_context: {
                  snapshot_id: card.xmlSnapshot?.xmlCacheId || 'unknown',
                  element_path: card.elementContext?.xpath || '',
                  element_text: card.elementContext?.text,
                  element_bounds: card.elementContext?.bounds,
                  // 🔥 关键修复：传递 index_path 以启用结构匹配
                  index_path: card.staticLocator?.indexPath,
                },
                step_id: stepId,
                lock_container: false,
                enable_smart_candidates: true,
                enable_static_candidates: true,
              };
              
              // 调用 useIntelligentAnalysis Hook 的 startAnalysis
              await startAnalysis(analysisConfig);
              
              console.log('✅ [刷新评分] 智能分析已启动');
              message.success({ content: '✅ 评分刷新完成！', key: 'refresh-all-single' });
              
            } catch (error) {
              console.error('❌ [刷新评分] 失败:', error);
              message.error({ content: `刷新失败: ${error}`, key: 'refresh-all-single' });
            }
          },
        },
        { type: 'divider' as const },
        // 所有步骤列表
        ...SMART_STEPS.map(({ step, label, candidateKey }) => {
          const isRecommended = candidateKey === recommendedKey;
          const confidence = getStepConfidence(candidateKey);
          const displayScore = confidence !== null && isValidScore(confidence) ? confidence : undefined;
          const confidencePercent = toPercentInt01(displayScore);
        
          // 🔍 调试日志：评分查询
          if (step === 'step1' || step === 'step2') {
            console.log(`🔍 [菜单显示] ${label}:`, {
              candidateKey,
              confidence,
              displayScore,
              confidencePercent,
              hasScore: confidence !== null
            });
          }

          return {
            key: `smart-single-${step}`,
            label: (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span>
                  {label}
                  {(step === 'step1' || step === 'step2') && (
                    <span style={{ color: "#1890ff", fontSize: "10px", marginLeft: "4px" }}>（推荐）</span>
                  )}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {isRecommended && <span style={{ color: "blue", fontSize: "10px" }}>荐</span>}
                  {typeof confidencePercent === 'number' && (
                    <span 
                      style={{ 
                        fontSize: "10px", 
                        fontWeight: "bold",
                        color: getConfidenceColor(confidencePercent) === 'green' ? '#52c41a' :
                               getConfidenceColor(confidencePercent) === 'blue' ? '#1890ff' :
                               getConfidenceColor(confidencePercent) === 'orange' ? '#fa8c16' :
                               getConfidenceColor(confidencePercent) === 'volcano' ? '#ff4d4f' : '#f5222d'
                      }}
                    >
                      {confidencePercent}%
                    </span>
                  )}
                </div>
              </div>
            ),
            onClick: async () => {
              events.onStrategyChange({ type: "smart-single", stepName: step });
            },
          };
        }),
      ],
    },
    
    // 静态策略
    {
      key: "static",
      icon: <span>📌</span>,
      label: "静态策略",
      children: [
        // 结构匹配主入口
        {
          key: "structural_matching",
          icon: <span>🏗️</span>,
          label: "结构匹配",
          onClick: async () => {
            console.log('📌 [StrategyMenu] 切换到结构匹配策略');
            
            if (dataError) {
              message.error(`数据获取失败: ${dataError.message}`);
              return;
            }
            
            if (dataLoading) {
              message.info('数据加载中，请稍候...');
              return;
            }
            
            await handleOpenStructuralMatching();
            
            setTimeout(() => {
              events.onStrategyChange({ type: "static", key: "structural_matching" });
            }, 100);
          }
        },
        
        // XPath恢复
        {
          key: "xpath_recovery",
          icon: <span>🔧</span>,
          label: "XPath恢复",
          disabled: true,
        },
        
        { type: "divider" },
        
        // 动态候选项
        ...((selector.candidates?.static?.length ?? 0) > 0
          ? selector.candidates.static!.map((candidate) => ({
              key: `static-${candidate.key}`,
              label: candidate.name,
              onClick: () => {
                events.onStrategyChange({
                  type: "static",
                  key: candidate.key,
                });
              },
            }))
          : [
              {
                key: "no-static",
                label: "暂无分析结果",
                disabled: true,
              },
            ]),
      ],
    },
  ];

  return { items };
}
