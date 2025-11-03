// src/modules/structural-matching/services/structural-matching-service.ts
// module: structural-matching | layer: services | role: Tauri调用服务
// summary: 封装结构匹配的Tauri命令调用（已升级到 Runtime 匹配系统）

import { invoke } from '@tauri-apps/api/core';
import type {
  StructuralMatchingConfig,
  StructuralMatchResult,
} from '../domain/models/structural-field-config';

// ==================== 新 Runtime 系统类型定义 ====================

interface SmConfigDTO {
  mode: string;
  skeletonRules: string | null;
  fieldRules: FieldRuleDTO[] | null;
  earlyStopEnabled: boolean | null;
}

interface FieldRuleDTO {
  fieldName: string;
  expected: string | null;
  regex: string | null;
}

interface SmMatchRequest {
  xmlContent: string;
  config: SmConfigDTO;
  containerHint: string | null;
}

interface SmMatchResponse {
  success: boolean;
  error: string | null;
  result: SmResultDTO | null;
  elapsedMs: number;
}

interface SmResultDTO {
  containerId: number;
  layoutType: string;
  items: SmItemDTO[];
  score: number;
}

interface SmItemDTO {
  nodeId: number;
  score: number;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

// ==================== 配置转换函数 ====================

/**
 * 将旧的 StructuralMatchingConfig 转换为新的 SmConfigDTO
 */
function convertToSmConfig(config: StructuralMatchingConfig): SmConfigDTO {
  // 根据阈值决定模式
  let mode = 'default';
  if (config.globalThreshold >= 0.8) {
    mode = 'robust';
  } else if (config.globalThreshold <= 0.6) {
    mode = 'speed';
  }

  return {
    mode,
    skeletonRules: null, // 暂时不使用骨架规则
    fieldRules: null,    // 暂时不使用字段规则
    earlyStopEnabled: true,
  };
}

/**
 * 将新的 SmResultDTO 转换为旧的 StructuralMatchResult
 */
function convertToStructuralResult(
  smResult: SmResultDTO,
  targetElement: unknown,
  config: StructuralMatchingConfig
): StructuralMatchResult {
  return {
    element: targetElement,
    totalScore: smResult.score * 100, // 转换为百分比分数
    maxScore: 100,
    fieldResults: [], // Runtime系统不提供字段级别的详细结果
    passed: smResult.score >= config.globalThreshold,
  };
}

// ==================== 设备XML缓存 ====================

let cachedDeviceXml: string | null = null;
let cachedDeviceId: string | null = null;

/**
 * 获取当前设备的UI XML
 */
async function getDeviceXml(deviceId?: string): Promise<string> {
  // 如果有缓存且设备ID相同，直接返回
  if (cachedDeviceXml && cachedDeviceId === deviceId) {
    console.log('📦 [Service] 使用缓存的设备XML');
    return cachedDeviceXml;
  }

  console.log('🔄 [Service] 获取设备XML...');
  try {
    // 调用后端获取UI Dump
    const xml = await invoke<string>('get_ui_dump', { deviceId: deviceId || '' });
    
    // 更新缓存
    cachedDeviceXml = xml;
    cachedDeviceId = deviceId || null;
    
    console.log(`✅ [Service] 获取设备XML成功，长度: ${xml.length}`);
    return xml;
  } catch (error) {
    console.error('❌ [Service] 获取设备XML失败', error);
    throw new Error(`获取设备UI信息失败: ${error}`);
  }
}

/**
 * 清除XML缓存（当设备切换或页面刷新时调用）
 */
export function clearDeviceXmlCache(): void {
  cachedDeviceXml = null;
  cachedDeviceId = null;
  console.log('🗑️ [Service] 已清除设备XML缓存');
}

// ==================== 主要API函数 ====================

/**
 * 评估单个元素是否匹配模板（使用新 Runtime 系统）
 */
export async function evaluateStructuralMatch(
  config: StructuralMatchingConfig,
  templateElement: unknown,
  targetElement: unknown,
  deviceId?: string,
): Promise<StructuralMatchResult> {
  console.log('🏗️ [Service] 调用结构匹配评估 (Runtime系统)', { 
    configId: config.configId,
    templateElement, 
    targetElement 
  });
  
  try {
    // 1. 获取设备XML
    const xmlContent = await getDeviceXml(deviceId);
    
    // 2. 转换配置
    const smConfig = convertToSmConfig(config);
    
    // 3. 调用新的 Runtime 匹配命令
    const request: SmMatchRequest = {
      xmlContent,
      config: smConfig,
      containerHint: null,
    };
    
    const response = await invoke<SmMatchResponse>('sm_match_once', { request });
    
    if (!response.success || !response.result) {
      throw new Error(response.error || '匹配失败');
    }
    
    // 4. 转换结果
    const result = convertToStructuralResult(response.result, targetElement, config);
    
    console.log('✅ [Service] 结构匹配评估完成 (Runtime)', {
      score: result.totalScore,
      passed: result.passed,
      elapsedMs: response.elapsedMs,
    });
    
    return result;
  } catch (error) {
    console.error('❌ [Service] 结构匹配评估失败', error);
    throw error;
  }
}

/**
 * 批量评估多个元素（使用新 Runtime 系统）
 */
export async function evaluateStructuralMatchBatch(
  config: StructuralMatchingConfig,
  templateElement: unknown,
  targetElements: unknown[],
  deviceId?: string,
): Promise<StructuralMatchResult[]> {
  console.log('🏗️ [Service] 批量评估 (Runtime系统)', { 
    configId: config.configId,
    targetCount: targetElements.length 
  });
  
  try {
    // 1. 获取设备XML
    const xmlContent = await getDeviceXml(deviceId);
    
    // 2. 转换配置
    const smConfig = convertToSmConfig(config);
    
    // 3. 调用新的 Runtime 匹配命令
    const request: SmMatchRequest = {
      xmlContent,
      config: smConfig,
      containerHint: null,
    };
    
    const response = await invoke<SmMatchResponse>('sm_match_once', { request });
    
    if (!response.success || !response.result) {
      throw new Error(response.error || '匹配失败');
    }
    
    // 4. 为每个目标元素创建结果
    // 注意：新系统返回的是容器内的所有匹配项，我们需要映射到目标元素
    const results: StructuralMatchResult[] = targetElements.map((targetElement, index) => {
      // 使用对应的匹配项（如果存在）
      const matchedItem = response.result!.items[index];
      const score = matchedItem ? matchedItem.score : 0;
      
      return {
        element: targetElement,
        totalScore: score * 100,
        maxScore: 100,
        fieldResults: [],
        passed: score >= config.globalThreshold,
      };
    });
    
    const passedCount = results.filter(r => r.passed).length;
    console.log(`✅ [Service] 批量评估完成 (Runtime)，通过: ${passedCount} / ${results.length}`);
    
    return results;
  } catch (error) {
    console.error('❌ [Service] 批量评估失败', error);
    throw error;
  }
}

/**
 * 获取匹配的元素（筛选，使用新 Runtime 系统）
 */
export async function getMatchedElements(
  config: StructuralMatchingConfig,
  templateElement: unknown,
  targetElements: unknown[],
  deviceId?: string,
): Promise<unknown[]> {
  console.log('🔍 [Service] 筛选匹配元素 (Runtime系统)', { 
    configId: config.configId,
    candidateCount: targetElements.length 
  });
  
  try {
    // 使用批量评估
    const results = await evaluateStructuralMatchBatch(
      config,
      templateElement,
      targetElements,
      deviceId
    );
    
    // 筛选通过的元素
    const matchedElements = results
      .filter(r => r.passed)
      .map(r => r.element)
      .filter((el): el is unknown => el !== undefined);
    
    console.log(`✅ [Service] 筛选完成 (Runtime)，匹配数: ${matchedElements.length}`);
    return matchedElements;
  } catch (error) {
    console.error('❌ [Service] 筛选失败', error);
    throw error;
  }
}
