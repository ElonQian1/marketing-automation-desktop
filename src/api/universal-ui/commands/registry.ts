import invokeCompat from '../../core/tauriInvoke';

// 命令常量，集中管理，避免散落硬编码
export const UniversalCommands = {
  analyzeUniversalUIPage: 'analyze_universal_ui_page',
  extractPageElements: 'extract_page_elements',
} as const;

// 轻量入参校验（无第三方依赖）
export interface AnalyzeParams { deviceId: string }
export interface ExtractParams { xmlContent: string }
function assertAnalyzeParams(p: any): asserts p is AnalyzeParams {
  if (!p || typeof p.deviceId !== 'string' || p.deviceId.trim().length === 0) {
    throw new Error('[invokeUniversal] analyzeUniversalUIPage 缺少有效的 deviceId');
  }
}
function assertExtractParams(p: any): asserts p is ExtractParams {
  if (!p || typeof p.xmlContent !== 'string' || p.xmlContent.trim().length === 0) {
    throw new Error('[invokeUniversal] extractPageElements 缺少有效的 xmlContent');
  }
}

// 单一调用入口：自动做 camel/snake 兼容与入参校验
export async function invokeUniversal<T>(command: keyof typeof UniversalCommands, params: unknown): Promise<T> {
  switch (command) {
    case 'analyzeUniversalUIPage':
      assertAnalyzeParams(params);
      return await invokeCompat<T>(UniversalCommands[command], params as any);
    case 'extractPageElements':
      assertExtractParams(params);
      return await invokeCompat<T>(UniversalCommands[command], params as any);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
