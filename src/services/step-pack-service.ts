// src/services/step-pack-service.ts
// module: services | layer: services | role: 脚本包导出导入服务
// summary: 实现步骤包的导出和导入功能，支持本地重评机制

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
    constraints: Record<string, any>;
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
    
    // 🆕 调用后端的共用引擎重评
    console.log('🔄 开始本地重评步骤包...', stepPack.id);
    await invoke('start_intelligent_analysis', { config });
    
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