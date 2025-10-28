// src/components/strategy-selector/utils/selection-config-saver.ts
// module: ui | layer: utils | role: 选择配置保存器
// summary: 统一处理智能选择配置的保存逻辑

import { invoke } from '@tauri-apps/api/core';
import { useStepCardStore } from '../../../store/stepcards';
import type { SelectionMode, BatchConfig, RandomConfig } from '../types/selection-config';
import type { MessageInstance } from 'antd/es/message/interface';

export interface SaveConfigParams {
  stepId: string;
  selectorId?: string;
  mode: SelectionMode;
  batchConfig?: BatchConfig | null;
  randomConfig?: RandomConfig;
  message: MessageInstance;
}

/**
 * 保存智能选择配置到后端（统一接口）
 */
export async function saveSelectionConfigWithFeedback(params: SaveConfigParams): Promise<boolean> {
  const { stepId, selectorId, mode, batchConfig, randomConfig, message } = params;

  if (!stepId) {
    console.warn('⚠️ [saveSelectionConfig] 无stepId，跳过保存');
    return false;
  }

  try {
    console.log('📤 [saveSelectionConfig] 保存配置:', {
      stepId,
      selectorId,
      mode,
      batchConfig,
      randomConfig,
    });

    // 准备保存参数
    const saveParams: Record<string, unknown> = {
      stepId: stepId,
      selectionMode: mode,
    };

    // 根据模式添加相应配置
    if (mode === 'all' && batchConfig) {
      saveParams.batchConfig = batchConfig;
    } else if (mode === 'random' && randomConfig) {
      saveParams.randomConfig = randomConfig;
    }

    // 保存到主步骤ID
    await invoke('save_smart_selection_config', saveParams);

    // 同时用 selectorId 保存一份（兜底，支持跨步骤复用）
    if (selectorId) {
      const saveParamsForSelector = {
        ...saveParams,
        stepId: selectorId,
      };
      console.log('🔄 [saveSelectionConfig] 用selectorId保存兜底配置:', { selectorId });
      await invoke('save_smart_selection_config', saveParamsForSelector);
    } else {
      // 如果没有提供 selectorId，尝试从 store 获取
      const state = useStepCardStore.getState();
      const canonicalId = state.aliasToCanonical[stepId];
      const card = canonicalId ? state.cards[canonicalId] : undefined;

      if (card?.elementUid) {
        const fallbackSelectorId = card.elementUid;
        const saveParamsForSelector = {
          ...saveParams,
          stepId: fallbackSelectorId,
        };
        console.log('🔄 [saveSelectionConfig] 用elementUid保存兜底配置:', { fallbackSelectorId });
        await invoke('save_smart_selection_config', saveParamsForSelector);
      }
    }

    // 根据模式显示成功消息
    const modeLabels: Record<SelectionMode, string> = {
      first: '🎯 第一个',
      last: '🎯 最后一个',
      all: '📋 批量全部',
      random: '🎲 随机选择',
      'match-original': '🔍 精确匹配',
      auto: '🤖 智能选择',
    };

    message.success(`已切换到: ${modeLabels[mode]}`);
    console.log('✅ [saveSelectionConfig] 配置保存成功');
    return true;
  } catch (error) {
    console.error('❌ [saveSelectionConfig] 保存配置失败:', error);
    message.error(`保存失败: ${error}`);
    return false;
  }
}
