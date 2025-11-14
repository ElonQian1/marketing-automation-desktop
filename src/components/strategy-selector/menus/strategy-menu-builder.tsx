// src/components/strategy-selector/menus/strategy-menu-builder.tsx
// module: strategy-selector | layer: ui | role: 策略菜单构建器
// summary: 构建智能·自动链、智能·单步、静态策略三种菜单

import React from 'react';
import { message } from 'antd';
import type { MenuProps } from 'antd';
import type { SmartStep, StrategyEvents, StrategySelector } from '../../../types/strategySelector';
import type { StepCard } from '../../../store/stepcards';
import { StepSequenceMapper } from '../../../config/step-sequence';
import { executeSmartAutoScoring } from '../scoring/smart-auto-scoring';
import { executeSmartSingleScoring } from '../scoring/smart-single-scoring';
import { executeStaticCardSubtreeScoring, executeStaticLeafContextScoring } from '../scoring/static-scoring';
import { isValidScore, toPercentInt01 } from '../../../utils/score-utils';

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
      onClick: async () => {
        console.log('🎯 [菜单] 用户点击：智能·自动链', { stepId });
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
          message.warning('步骤卡片数据不完整，跳过评分');
          return;
        }
        
        try {
          console.log('🚀 [菜单] 开始执行智能·自动链评分...');
          await executeSmartAutoScoring(card, setFinalScores, getStepConfidence);
          console.log('✅ [菜单] 智能·自动链评分完成');
        } catch (error) {
          console.error('❌ [智能·自动链] 评分过程失败:', error);
        }
      },
    },
    
    // 智能·单步
    {
      key: "smart-single",
      icon: <span>🎯</span>,
      label: "智能·单步",
      children: SMART_STEPS.map(({ step, label, candidateKey }) => {
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
              <span>{label}</span>
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
            if (step === 'step1' || step === 'step2') {
              if (!stepId) {
                message.warning('请先创建步骤卡片');
                return;
              }
              
              const card = cardStore.cards[stepId];
              if (!card) {
                message.error('步骤卡片数据不完整，请重新分析页面并选择元素');
                return;
              }
              
              try {
                await executeSmartSingleScoring(
                  step,
                  candidateKey,
                  card,
                  stepId,
                  setFinalScores,
                  onUpdateStepParameters,
                  getStepConfidence
                );
              } catch (error) {
                console.error('❌ [智能·单步] 评分失败:', error);
              }
              return;
            }

            events.onStrategyChange({ type: "smart-single", stepName: step });
          },
        };
      }),
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
        
        // 卡片子树评分
        {
          key: "structural_matching_card_subtree",
          icon: <span>🌳</span>,
          label: "├─ 卡片子树评分",
          onClick: async () => {
            if (!stepId) {
              message.warning('请先创建步骤卡片');
              return;
            }
            
            const step1Config = StepSequenceMapper.getByStepId('step1');
            if (!step1Config) {
              message.error('步骤配置错误：未找到Step1配置');
              return;
            }
            
            const card = cardStore.cards[stepId];
            if (!card) {
              message.error('步骤卡片不存在');
              return;
            }
            
            try {
              await executeStaticCardSubtreeScoring(
                step1Config.candidateKey,
                card,
                stepId,
                setFinalScores,
                events,
                onUpdateStepParameters,
                getStepConfidence
              );
            } catch (error) {
              console.error('❌ [静态策略-卡片子树] 评分失败:', error);
            }
          }
        },
        
        // 叶子上下文评分
        {
          key: "structural_matching_leaf_context",
          icon: <span>🍃</span>,
          label: "└─ 叶子上下文评分",
          onClick: async () => {
            if (!stepId) {
              message.warning('请先创建步骤卡片');
              return;
            }
            
            const step2Config = StepSequenceMapper.getByStepId('step2');
            if (!step2Config) {
              message.error('步骤配置错误：未找到Step2配置');
              return;
            }
            
            const card = cardStore.cards[stepId];
            if (!card) {
              message.error('步骤卡片不存在');
              return;
            }
            
            try {
              await executeStaticLeafContextScoring(
                step2Config.candidateKey,
                card,
                stepId,
                setFinalScores,
                events,
                onUpdateStepParameters,
                getStepConfidence
              );
            } catch (error) {
              console.error('❌ [静态策略-叶子上下文] 诅分失败:', error);
            }
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
