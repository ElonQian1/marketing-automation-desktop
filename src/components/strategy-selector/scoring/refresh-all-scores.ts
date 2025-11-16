// src/components/strategy-selector/scoring/refresh-all-scores.ts
// module: strategy-selector | layer: scoring | role: 刷新所有评分工具函数
// summary: 提供统一的刷新所有评分功能，供各组件调用

import { message } from 'antd';
import type { StepCard } from '../../../store/stepcards';

/**
 * 刷新所有评分的配置参数
 */
export interface RefreshAllScoresConfig {
  /** 步骤ID */
  stepId: string;
  /** 步骤卡片数据 */
  card: StepCard;
  /** 启动智能分析的函数 */
  startAnalysis: (config: unknown) => Promise<void>;
}

/**
 * 刷新所有评分（Step1-8）
 * 
 * 此函数提供统一的评分刷新逻辑，可被多个组件调用
 * - 点击"刷新所有评分"按钮
 * - 点击评分徽章
 * - 其他需要刷新评分的场景
 * 
 * @param config 刷新配置
 * @returns Promise<void>
 */
export async function refreshAllScores(config: RefreshAllScoresConfig): Promise<void> {
  const { stepId, card, startAnalysis } = config;

  console.log('🎯 [刷新评分] 开始刷新所有评分（Step1-8）', { stepId });

  if (!card) {
    message.warning('步骤卡片数据不完整');
    return;
  }

  if (!startAnalysis) {
    message.error('智能分析功能不可用');
    return;
  }

  try {
    message.loading({ content: '🔄 重新评分中...', key: 'refresh-all', duration: 0 });

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

    // 调用智能分析
    await startAnalysis(analysisConfig);

    console.log('✅ [刷新评分] 智能分析已启动');
    message.success({ content: '✅ 评分刷新完成！', key: 'refresh-all' });
  } catch (error) {
    console.error('❌ [刷新评分] 失败:', error);
    message.error({ content: `刷新失败: ${error}`, key: 'refresh-all' });
  }
}

/**
 * 创建刷新评分函数的工厂方法
 * 用于绑定特定的步骤和卡片数据
 * 
 * @param config 刷新配置
 * @returns 绑定了配置的刷新函数
 */
export function createRefreshScoresHandler(config: RefreshAllScoresConfig): () => Promise<void> {
  return () => refreshAllScores(config);
}
