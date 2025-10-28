// src/migrations/step-schema-v2.ts
// module: migrations | layer: migrations | role: 步骤数据迁移
// summary: 处理旧版步骤数据迁移到新架构（只存引用，不存XML内容）

import XmlCacheManager from '../services/xml-cache-manager';
import { generateXmlHash } from '../types/self-contained/xmlSnapshot';
import type { ExtendedSmartScriptStep } from '../types/loopScript';

/**
 * 步骤迁移结果
 */
export interface MigrationResult {
  success: boolean;
  migratedSteps: number;
  errors: string[];
  warnings: string[];
}

/**
 * 旧版步骤参数（包含已废弃字段）
 */
interface LegacyStepParameters {
  // 已废弃：直接存储XML内容
  xmlContent?: string;
  
  // 已废弃：旧的XPath字段
  elementGlobalXPath?: string;
  
  // 新字段
  element_selector?: string;
  xmlSnapshot?: {
    xmlCacheId?: string;
    xmlHash?: string;
    xmlContent?: string; // 遗留字段，需要迁移
    timestamp?: number;
  };
  
  [key: string]: unknown;
}

/**
 * 迁移单个步骤
 * 
 * 迁移策略：
 * 1. elementGlobalXPath -> element_selector
 * 2. xmlContent -> xmlHash/xmlCacheId (写入缓存)
 * 3. 清理已废弃字段
 */
export function migrateStep(step: ExtendedSmartScriptStep): {
  step: ExtendedSmartScriptStep;
  migrated: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let migrated = false;
  const params = step.parameters as LegacyStepParameters;
  
  // 1. 迁移 elementGlobalXPath -> element_selector
  if (params.elementGlobalXPath && !params.element_selector) {
    params.element_selector = params.elementGlobalXPath;
    delete params.elementGlobalXPath;
    migrated = true;
    warnings.push(`步骤 ${step.id}: 已迁移 elementGlobalXPath -> element_selector`);
  }
  
  // 2. 迁移 xmlContent -> xmlHash/xmlCacheId
  // 🔥 FIX: 保留完整xmlContent用于跨设备/导出场景 (WRONG_ELEMENT_SELECTION_ROOT_CAUSE_ANALYSIS.md)
  if (params.xmlContent || params.xmlSnapshot?.xmlContent) {
    const xmlContent = params.xmlContent || params.xmlSnapshot?.xmlContent;
    
    if (xmlContent) {
      const xmlCacheManager = XmlCacheManager.getInstance();
      const xmlHash = generateXmlHash(xmlContent);
      const cacheId = params.xmlSnapshot?.xmlCacheId || `migrated-${step.id}-${Date.now()}`;
      
      // 写入缓存（用于本地快速访问）
      xmlCacheManager.putXml(cacheId, xmlContent, xmlHash);
      
      // ✅ 更新步骤参数（保留完整XML）
      params.xmlSnapshot = {
        xmlCacheId: cacheId,
        xmlHash: xmlHash,
        xmlContent: xmlContent,  // ✅ 保留完整XML用于跨设备/导出场景
        timestamp: params.xmlSnapshot?.timestamp || Date.now()
      };
      
      // ✅ 清理旧的顶级xmlContent字段（但保留xmlSnapshot.xmlContent）
      delete params.xmlContent;
      
      migrated = true;
      warnings.push(`步骤 ${step.id}: 已迁移 xmlContent -> 缓存 (hash: ${xmlHash.substring(0, 16)}..., 保留完整XML)`);
    }
  }
  
  return {
    step,
    migrated,
    warnings
  };
}

/**
 * 批量迁移步骤
 */
export function migrateSteps(steps: ExtendedSmartScriptStep[]): MigrationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let migratedCount = 0;
  
  for (const step of steps) {
    try {
      const result = migrateStep(step);
      if (result.migrated) {
        migratedCount++;
      }
      warnings.push(...result.warnings);
    } catch (error) {
      errors.push(`步骤 ${step.id} 迁移失败: ${error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    migratedSteps: migratedCount,
    errors,
    warnings
  };
}

/**
 * 检查步骤是否需要迁移
 */
export function needsMigration(step: ExtendedSmartScriptStep): boolean {
  const params = step.parameters as LegacyStepParameters;
  
  return !!(
    params.elementGlobalXPath || 
    params.xmlContent || 
    params.xmlSnapshot?.xmlContent
  );
}

/**
 * 验证步骤是否符合新架构规范
 */
export function validateStepSchema(step: ExtendedSmartScriptStep): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const params = step.parameters as LegacyStepParameters;
  
  // 不允许包含废弃字段
  if (params.xmlContent) {
    errors.push('步骤参数不应包含 xmlContent 字段');
  }
  
  if (params.elementGlobalXPath) {
    errors.push('步骤参数不应包含 elementGlobalXPath 字段');
  }
  
  // ✅ 允许xmlContent字段（用于跨设备/导出场景）
  // Note: xmlContent是必要的，不应该报错
  // if (params.xmlSnapshot?.xmlContent) {
  //   errors.push('xmlSnapshot 不应包含 xmlContent 字段');
  // }
  
  // 必须包含必要字段
  if (!params.element_selector && step.step_type !== 'loop_start' && step.step_type !== 'loop_end') {
    errors.push('步骤参数缺少 element_selector 字段');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
