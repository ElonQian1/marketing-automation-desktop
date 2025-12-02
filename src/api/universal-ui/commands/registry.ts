// src/api/universal-ui/commands/registry.ts
// module: api | layer: api | role: universal-ui-commands
// summary: Universal UI命令注册表，管理UI操作命令的映射（支持Tauri v2插件格式）

import { invoke } from '@tauri-apps/api/core';

// ==================== 插件格式命令映射（Tauri v2 Plugin） ====================
// 格式: plugin:<插件名>|<命令名>
export const PluginCommands = {
  analyzeUniversalUIPage: 'plugin:universal_ui|analyze_page',
  extractPageElements: 'plugin:universal_ui|extract_elements',
  classifyUIElements: 'plugin:universal_ui|classify_elements',
  deduplicateElements: 'plugin:universal_ui|deduplicate',
  identifyPageType: 'plugin:universal_ui|identify_page',
} as const;

// 轻量入参校验（无第三方依赖）
export interface AnalyzeParams { deviceId: string }
export interface ExtractParams { xmlContent: string }
function assertAnalyzeParams(p: unknown): asserts p is AnalyzeParams {
  if (!p || typeof (p as AnalyzeParams).deviceId !== 'string' || (p as AnalyzeParams).deviceId.trim().length === 0) {
    throw new Error('[invokeUniversal] analyzeUniversalUIPage 缺少有效的 deviceId');
  }
}
function assertExtractParams(p: unknown): asserts p is ExtractParams {
  if (!p || typeof (p as ExtractParams).xmlContent !== 'string' || (p as ExtractParams).xmlContent.trim().length === 0) {
    throw new Error('[invokeUniversal] extractPageElements 缺少有效的 xmlContent');
  }
}

// 单一调用入口：自动做 camel/snake 兼容与入参校验
export async function invokeUniversal<T>(command: 'analyzeUniversalUIPage' | 'extractPageElements', params: unknown): Promise<T> {
  switch (command) {
    case 'analyzeUniversalUIPage':
      assertAnalyzeParams(params);
      return await invoke<T>(PluginCommands.analyzeUniversalUIPage, { deviceId: params.deviceId });
    case 'extractPageElements':
      assertExtractParams(params);
      return await invoke<T>(PluginCommands.extractPageElements, { xmlContent: params.xmlContent });
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
