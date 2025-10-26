// src/services/step-pack-service.ts
// module: services | layer: services | role: ✅ 脚本包导出导入服务（已升级V3智能策略分析）
// summary: 实现步骤包的导出和导入功能，使用V3智能自动链进行Step 0-6策略分析的本地重评
//
// 🎯 【重要】此服务已升级到 V3 智能策略分析系统：
// ✅ 正确路径：execute_chain_test_v3 → V3智能自动链 → Step 0-6策略分析 → 精准匹配
// ❌ 旧路径：start_intelligent_analysis → V2简化分析 → 绕过策略分析 → 不准确匹配
//
// 🔄 修复历史：
// - 2025-10-26: 修正执行路径，从V2升级到V3智能策略分析
// - 解决"已关注"vs"关注"混淆问题：现在会精确识别用户选择的文本
// - 确保空文本元素不会直接坐标兜底，而是通过智能策略分析

import { invoke } from '@tauri-apps/api/core';
import { useStepScoreStore } from '../stores/step-score-store';
import { useStepCardStore } from '../store/stepcards';

export interface StepPack {
  id: string;
  name: string;
  version: string;
  locator_bundle: {
    primary: string;
    fallbacks: string[];
    constraints: Record<string, unknown>;
  };
  screen_signature: {
    app: string;
    activity?: string;
    layout_hash?: string;
  };
  last_score?: {
    confidence: number;
    evidence: Record<string, number>;
    timestamp: number;
    origin: 'single' | 'chain';
  };
  policy: {
    min_confidence: number;
  };
  metadata?: {
    created_at: number;
    exported_by: string;
    description?: string;
  };
}

export interface StepPackImportResult {
  stepId: string;
  confidence: number;
  evidence: Record<string, number>;
  recommended: string;
  candidates: Array<{
    key: string;
    name: string;
    confidence: number;
    xpath: string;
  }>;
}

/**
 * 导出步骤包
 */
export function exportStepPack(cardId: string, options?: {
  includeScore?: boolean;
  description?: string;
}): StepPack | null {
  const cardStore = useStepCardStore.getState();
  const scoreStore = useStepScoreStore.getState();
  
  const card = cardStore.getCard(cardId);
  if (!card) {
    throw new Error(`找不到卡片: ${cardId}`);
  }
  
  // 获取关联的评分
  let lastScore: StepPack['last_score'] | undefined;
  if (options?.includeScore) {
    // 优先使用 meta.singleStepScore（新的单步置信度）
    if (card.meta?.singleStepScore) {
      const singleScore = card.meta.singleStepScore;
      lastScore = {
        confidence: singleScore.confidence,
        evidence: {
          model: 0.85, // 默认模型置信度
          locator: 0.9, // 定位器置信度
          visibility: 0.8, // 可见性置信度
          device: 0.75, // 设备兼容性
        },
        timestamp: new Date(singleScore.at).getTime(),
        origin: 'single'
      };
    } else {
      // 回退到旧的评分系统
      const score = scoreStore.getByCardId(cardId);
      if (score) {
        lastScore = {
          confidence: score.confidence,
          evidence: {
            model: score.evidence?.model || 0,
            locator: score.evidence?.locator || 0,
            visibility: score.evidence?.visibility || 0,
            device: score.evidence?.device || 0,
          },
          timestamp: score.timestamp,
          origin: score.origin
        };
      }
    }
  }
  
  // 构建定位包
  const locatorBundle = {
    primary: card.elementContext?.xpath || card.elementUid,
    fallbacks: card.strategy?.candidates?.map(c => c.xpath).filter(Boolean) || [],
    constraints: {
      text: card.elementContext?.text,
      resourceId: card.elementContext?.resourceId,
      className: card.elementContext?.className,
      bounds: card.elementContext?.bounds,
    }
  };
  
  // 构建屏幕签名
  const screenSignature = {
    app: 'unknown', // TODO: 从设备上下文获取
    activity: undefined,
    layout_hash: undefined, // TODO: 计算布局哈希
  };
  
  const stepPack: StepPack = {
    id: card.elementUid,
    name: `Step Pack ${card.elementUid.slice(-6)}`,
    version: '1.0.0',
    locator_bundle: locatorBundle,
    screen_signature: screenSignature,
    last_score: lastScore,
    policy: {
      min_confidence: 0.75
    },
    metadata: {
      created_at: Date.now(),
      exported_by: 'system',
      description: options?.description || `导出自卡片 ${cardId}`
    }
  };
  
  return stepPack;
}

/**
 * 导入步骤包并进行本地重评
 */
export async function importStepPack(stepPack: StepPack): Promise<StepPackImportResult> {
  try {
    // 构造分析上下文
    const elementContext = {
      snapshot_id: "import_" + Date.now(),
      element_path: stepPack.locator_bundle.primary,
      element_text: stepPack.locator_bundle.constraints.text,
      element_bounds: stepPack.locator_bundle.constraints.bounds,
      element_type: "imported",
      key_attributes: {
        "resource-id": stepPack.locator_bundle.constraints.resourceId,
        "class": stepPack.locator_bundle.constraints.className
      }
    };
    
    const config = {
      element_context: elementContext,
      step_id: stepPack.id,
      lock_container: false,
      enable_smart_candidates: true,
      enable_static_candidates: true
    };
    
    // 🎯 【关键执行路径 - 请勿修改】
    // ✅ 正确：execute_chain_test_v3 → V3智能自动链 → Step 0-6策略分析
    // ❌ 错误：start_intelligent_analysis → V2简化分析（已弃用，会导致文本匹配不准确）
    // 
    // 🚨 重要说明：此调用确保"已关注"按钮被正确识别为"已关注"，而不是"关注"
    //             空文本元素会通过智能策略分析，而不是直接坐标兜底
    console.log('🔄 开始V3智能策略重评步骤包（Step 0-6 完整分析）...', stepPack.id);
    // 🎯 使用正确的V3调用格式：envelope + spec
    const envelope = {
      deviceId: config.element_context.snapshot_id || 'default',
      app: {
        package: 'com.xingin.xhs',
        activity: null
      },
      snapshot: {
        analysisId: stepPack.id,
        screenHash: null,
        xmlCacheId: null
      },
      executionMode: 'relaxed'
    };

    const spec = {
      chainId: `step_pack_analysis_${stepPack.id}`,
      orderedSteps: [{
        ref: null,
        inline: {
          stepId: stepPack.id,
          elementContext: config.element_context,
          action: {
            type: 'analyze',
            params: {}
          },
          selectionMode: 'match-original',
          batchConfig: null
        }
      }],
      threshold: 0.5, // 较低阈值，获取更多策略选项
      mode: 'dryrun', // 只分析不执行
      quality: {
        enableOfflineValidation: true,
        enableControlledFallback: true,
        enableRegionOptimization: true
      },
      constraints: {
        maxAnalysisTime: 10000,
        maxExecutionTime: 5000,
        allowFallback: true
      },
      validation: {
        requireUniqueness: false,
        minConfidence: 0.3
      }
    };

    await invoke('execute_chain_test_v3', {
      envelope,
      spec
    });
    
    // 监听分析完成事件
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('分析超时'));
      }, 10000); // 10秒超时
      
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen('analysis:done', (event: { 
          payload: { 
            result: { step_id?: string; recommended_key: string; smart_candidates?: Array<{key: string; name: string; confidence: number; xpath: string}> };
            confidence: number;
            evidence: Record<string, number>;
          }
        }) => {
          const { result, confidence, evidence } = event.payload;
          
          if (result.step_id === stepPack.id) {
            clearTimeout(timeout);
            // Note: unlisten function not available in this context
            
            // 写入共享缓存
            const scoreStore = useStepScoreStore.getState();
            const cacheKey = scoreStore.generateKey(stepPack.id);
            scoreStore.upsert({
              key: cacheKey,
              recommended: result.recommended_key,
              confidence,
              evidence,
              origin: 'single', // 导入重评视为单步
              elementUid: stepPack.id,
              timestamp: Date.now()
            });
            
            // 🆕 同时更新卡片的 meta.singleStepScore
            const cardStore = useStepCardStore.getState();
            cardStore.setSingleStepConfidence(stepPack.id, {
              confidence,
              source: 'model', // 使用模型重评
              reasons: ['导入重评'],
              at: new Date().toISOString()
            });
            
            resolve({
              stepId: stepPack.id,
              confidence,
              evidence,
              recommended: result.recommended_key,
              candidates: result.smart_candidates || []
            });
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ 导入步骤包失败', error);
    throw new Error(`导入失败: ${error}`);
  }
}

/**
 * 将步骤包导出为JSON字符串
 */
export function serializeStepPack(stepPack: StepPack): string {
  return JSON.stringify(stepPack, null, 2);
}

/**
 * 从JSON字符串导入步骤包
 */
export function deserializeStepPack(jsonString: string): StepPack {
  return JSON.parse(jsonString) as StepPack;
}

/**
 * 下载步骤包为JSON文件
 */
export function downloadStepPack(stepPack: StepPack): void {
  const jsonString = serializeStepPack(stepPack);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `step-pack-${stepPack.id.slice(-6)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('✅ 步骤包已下载', stepPack.id);
}