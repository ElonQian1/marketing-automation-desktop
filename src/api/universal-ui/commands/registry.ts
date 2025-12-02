// src/api/universal-ui/commands/registry.ts
// module: api | layer: api | role: universal-ui-commands
// summary: Universal UI命令注册表，管理UI操作命令的映射（支持Tauri v2插件格式）

import { invoke } from '@tauri-apps/api/core';
import invokeCompat from '../../core/tauriInvoke';

// ==================== 插件格式命令映射（Tauri v2 Plugin） ====================
// 格式: plugin:<插件名>|<命令名>
const PluginCommands = {
  analyzeUniversalUIPage: 'plugin:universal_ui|analyze_page',
  extractPageElements: 'plugin:universal_ui|extract_elements',
  classifyUIElements: 'plugin:universal_ui|classify_elements',
  deduplicateElements: 'plugin:universal_ui|deduplicate',
  identifyPageType: 'plugin:universal_ui|identify_page',
} as const;

// ==================== 旧格式命令映射（向后兼容） ====================
export const UniversalCommands = {
  analyzeUniversalUIPage: 'analyze_universal_ui_page',
  extractPageElements: 'extract_page_elements',
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

/**
 * 插件优先调用：先尝试 plugin:universal_ui|xxx 格式，失败回退到旧格式
 */
async function invokeWithPluginFallback<T>(
  pluginCmd: string,
  legacyCmd: string | undefined,
  params: Record<string, unknown>
): Promise<T> {
  try {
    // 尝试插件格式（Tauri v2）
    return await invoke<T>(pluginCmd, params);
  } catch (pluginError) {
    // 如果是"命令未找到"类错误，尝试回退
    const errorMsg = String(pluginError);
    if (legacyCmd && (errorMsg.includes('not found') || errorMsg.includes('未找到'))) {
      console.warn(`[invokeUniversal] 插件命令 ${pluginCmd} 失败，回退到 ${legacyCmd}`);
      return await invokeCompat<T>(legacyCmd, params as Record<string, unknown>, { forceCamel: true });
    }
    throw pluginError;
  }
}

// 单一调用入口：自动做 camel/snake 兼容与入参校验
export async function invokeUniversal<T>(command: keyof typeof UniversalCommands, params: unknown): Promise<T> {
  switch (command) {
    case 'analyzeUniversalUIPage':
      assertAnalyzeParams(params);
      return await invokeWithPluginFallback<T>(
        PluginCommands.analyzeUniversalUIPage,
        UniversalCommands.analyzeUniversalUIPage,
        { deviceId: params.deviceId }
      );
    case 'extractPageElements':
      assertExtractParams(params);
      return await invokeWithPluginFallback<T>(
        PluginCommands.extractPageElements,
        UniversalCommands.extractPageElements,
        { xmlContent: params.xmlContent }
      );
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
