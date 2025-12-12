// src/application/store/uiDumpStore.ts
// module: application | layer: store | role: ui-dump-state
// summary: UI Dump 状态管理 - Zustand store，管理模式、诊断日志、测试状态

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// 类型定义
// ============================================================================

/** UI Dump 模式 */
export type DumpMode = 'auto' | 'exec_out' | 'dump_pull' | 'a11y';

/** 诊断日志级别 */
export type DiagnosticLevel = 'info' | 'warn' | 'error' | 'debug';

/** 诊断日志条目 */
export interface DiagnosticEntry {
  level: DiagnosticLevel;
  message: string;
  device_id?: string;
  mode?: DumpMode;
  elapsed_ms?: number;
  timestamp: number;
  context?: Record<string, string>;
}

/** Dump 执行结果 */
export interface DumpResult {
  success: boolean;
  mode_used: DumpMode;
  xml_content?: string;
  error?: string;
  elapsed_ms: number;
  timestamp: number;
  device_id: string;
  xml_length: number;
}

/** Dump 并保存的结果 */
export interface DumpAndSaveResult {
  dump_result: DumpResult;
  xml_saved: boolean;
  xml_path?: string;
  screenshot_saved: boolean;
  screenshot_path?: string;
  total_elapsed_ms: number;
}

/** 配置摘要 */
export interface ConfigSummary {
  preferred_mode: DumpMode;
  exec_out_timeout_ms: number;
  dump_pull_timeout_ms: number;
  a11y_timeout_ms: number;
  device_compat_count: number;
  verbose_logging: boolean;
}

/** 诊断摘要 */
export interface DiagnosticSummary {
  total_entries: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  avg_elapsed_ms: number;
  mode_usage: Record<DumpMode, number>;
  has_recent_errors: boolean;
}

/** 模式信息 */
export interface ModeInfo {
  mode: DumpMode;
  name: string;
  description: string;
  implemented: boolean;
}

/** Android App 连接状态 */
export interface AndroidAppStatus {
  connected: boolean;
  port: number;
  message: string;
  suggestion: string;
}

/** 诊断步骤结果 */
export interface DiagnosticStep {
  name: string;
  passed: boolean;
  message: string;
  elapsed_ms: number;
  details: string | null;
}

/** 完整诊断结果 */
export interface AndroidAppDiagnosis {
  success: boolean;
  steps: DiagnosticStep[];
  total_elapsed_ms: number;
  summary: string;
}

// ============================================================================
// Store 状态接口
// ============================================================================

interface UiDumpState {
  // ===== 状态 =====
  currentMode: DumpMode;
  config: ConfigSummary | null;
  diagnostics: DiagnosticEntry[];
  diagnosticSummary: DiagnosticSummary | null;
  availableModes: ModeInfo[];
  
  // 加载状态
  isLoading: boolean;
  isTestRunning: boolean;
  lastTestResult: DumpResult | null;
  lastError: string | null;
  
  // ===== Actions =====
  
  /** 初始化：加载配置和模式列表 */
  initialize: () => Promise<void>;
  
  /** 获取当前模式 */
  fetchMode: () => Promise<void>;
  
  /** 设置模式 */
  setMode: (mode: DumpMode) => Promise<void>;
  
  /** 执行 UI Dump */
  executeDump: (deviceId: string) => Promise<DumpResult>;
  
  /** 执行 UI Dump 并保存到文件 */
  executeDumpAndSave: (deviceId: string, options?: { saveDir?: string; takeScreenshot?: boolean }) => Promise<DumpAndSaveResult>;
  
  /** 测试指定模式 */
  testMode: (deviceId: string, mode: DumpMode) => Promise<DumpResult>;
  
  /** 获取诊断日志 */
  fetchDiagnostics: () => Promise<void>;
  
  /** 获取诊断摘要 */
  fetchDiagnosticSummary: () => Promise<void>;
  
  /** 清空诊断日志 */
  clearDiagnostics: () => Promise<void>;
  
  /** 获取配置 */
  fetchConfig: () => Promise<void>;
  
  /** 设置 ExecOut 超时 */
  setExecOutTimeout: (timeoutMs: number) => Promise<void>;
  
  /** 设置 DumpPull 超时 */
  setDumpPullTimeout: (timeoutMs: number) => Promise<void>;
  
  /** 清除设备兼容性缓存 */
  clearDeviceCompat: (deviceId?: string) => Promise<void>;
  
  /** 重置配置 */
  resetConfig: () => Promise<void>;
  
  /** 获取可用模式列表 */
  fetchAvailableModes: () => Promise<void>;
  
  /** 检查 Android App 连接状态（简单版） */
  checkAndroidAppStatus: (deviceId: string) => Promise<AndroidAppStatus>;
  
  /** 完整诊断 Android App 连接 */
  diagnoseAndroidApp: (deviceId: string) => Promise<AndroidAppDiagnosis>;
}

// ============================================================================
// Store 实现
// ============================================================================

export const useUiDumpStore = create<UiDumpState>((set, get) => ({
  // ===== 初始状态 =====
  currentMode: 'auto',
  config: null,
  diagnostics: [],
  diagnosticSummary: null,
  availableModes: [],
  isLoading: false,
  isTestRunning: false,
  lastTestResult: null,
  lastError: null,
  
  // ===== Actions 实现 =====
  
  initialize: async () => {
    set({ isLoading: true, lastError: null });
    try {
      await Promise.all([
        get().fetchMode(),
        get().fetchConfig(),
        get().fetchAvailableModes(),
        get().fetchDiagnosticSummary(),
      ]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ lastError: errorMsg });
      console.error('UI Dump Store 初始化失败:', errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchMode: async () => {
    try {
      const mode = await invoke<DumpMode>('plugin:ui_dump|get_mode');
      set({ currentMode: mode });
    } catch (error) {
      console.error('获取模式失败:', error);
      throw error;
    }
  },
  
  setMode: async (mode: DumpMode) => {
    set({ isLoading: true, lastError: null });
    try {
      await invoke('plugin:ui_dump|set_mode', { mode });
      set({ currentMode: mode });
      // 刷新配置
      await get().fetchConfig();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ lastError: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  executeDump: async (deviceId: string) => {
    set({ isLoading: true, lastError: null });
    try {
      const result = await invoke<DumpResult>('plugin:ui_dump|dump', { deviceId });
      // 刷新诊断
      await get().fetchDiagnosticSummary();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ lastError: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  executeDumpAndSave: async (deviceId: string, options?: { saveDir?: string; takeScreenshot?: boolean }) => {
    set({ isLoading: true, lastError: null });
    try {
      const result = await invoke<DumpAndSaveResult>('plugin:ui_dump|dump_and_save', {
        deviceId,
        saveDir: options?.saveDir ?? null,
        takeScreenshot: options?.takeScreenshot ?? false,
      });
      // 刷新诊断
      await get().fetchDiagnosticSummary();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ lastError: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  testMode: async (deviceId: string, mode: DumpMode) => {
    set({ isTestRunning: true, lastError: null, lastTestResult: null });
    try {
      const result = await invoke<DumpResult>('plugin:ui_dump|test_mode', { deviceId, mode });
      set({ lastTestResult: result });
      // 刷新诊断
      await get().fetchDiagnostics();
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ lastError: errorMsg });
      throw error;
    } finally {
      set({ isTestRunning: false });
    }
  },
  
  fetchDiagnostics: async () => {
    try {
      const diagnostics = await invoke<DiagnosticEntry[]>('plugin:ui_dump|get_diagnostics');
      set({ diagnostics });
    } catch (error) {
      console.error('获取诊断日志失败:', error);
    }
  },
  
  fetchDiagnosticSummary: async () => {
    try {
      const summary = await invoke<DiagnosticSummary>('plugin:ui_dump|get_diagnostic_summary');
      set({ diagnosticSummary: summary });
    } catch (error) {
      console.error('获取诊断摘要失败:', error);
    }
  },
  
  clearDiagnostics: async () => {
    try {
      await invoke('plugin:ui_dump|clear_diagnostics');
      set({ diagnostics: [], diagnosticSummary: null });
    } catch (error) {
      console.error('清空诊断日志失败:', error);
    }
  },
  
  fetchConfig: async () => {
    try {
      const config = await invoke<ConfigSummary>('plugin:ui_dump|get_config');
      set({ config });
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  },
  
  setExecOutTimeout: async (timeoutMs: number) => {
    try {
      await invoke('plugin:ui_dump|set_exec_out_timeout', { timeoutMs });
      await get().fetchConfig();
    } catch (error) {
      console.error('设置 ExecOut 超时失败:', error);
      throw error;
    }
  },
  
  setDumpPullTimeout: async (timeoutMs: number) => {
    try {
      await invoke('plugin:ui_dump|set_dump_pull_timeout', { timeoutMs });
      await get().fetchConfig();
    } catch (error) {
      console.error('设置 DumpPull 超时失败:', error);
      throw error;
    }
  },
  
  clearDeviceCompat: async (deviceId?: string) => {
    try {
      await invoke('plugin:ui_dump|clear_device_compat', { deviceId: deviceId ?? null });
      await get().fetchConfig();
    } catch (error) {
      console.error('清除设备兼容性缓存失败:', error);
      throw error;
    }
  },
  
  resetConfig: async () => {
    try {
      await invoke('plugin:ui_dump|reset_config');
      await Promise.all([
        get().fetchMode(),
        get().fetchConfig(),
      ]);
    } catch (error) {
      console.error('重置配置失败:', error);
      throw error;
    }
  },
  
  fetchAvailableModes: async () => {
    try {
      const modes = await invoke<ModeInfo[]>('plugin:ui_dump|list_modes');
      set({ availableModes: modes });
    } catch (error) {
      console.error('获取可用模式列表失败:', error);
    }
  },
  
  checkAndroidAppStatus: async (deviceId: string) => {
    try {
      const status = await invoke<AndroidAppStatus>('plugin:ui_dump|check_android_app_status', { deviceId });
      return status;
    } catch (error) {
      console.error('检查 Android App 状态失败:', error);
      return {
        connected: false,
        port: 11451,
        message: error instanceof Error ? error.message : String(error),
        suggestion: '请检查设备连接',
      };
    }
  },
  
  diagnoseAndroidApp: async (deviceId: string) => {
    try {
      const diagnosis = await invoke<AndroidAppDiagnosis>('plugin:ui_dump|diagnose_android_app', { deviceId });
      return diagnosis;
    } catch (error) {
      console.error('诊断 Android App 失败:', error);
      return {
        success: false,
        steps: [],
        total_elapsed_ms: 0,
        summary: error instanceof Error ? error.message : String(error),
      };
    }
  },
}));

// ============================================================================
// 选择器 Hooks
// ============================================================================

/** 获取当前模式 */
export const useCurrentDumpMode = () => useUiDumpStore(state => state.currentMode);

/** 获取配置 */
export const useDumpConfig = () => useUiDumpStore(state => state.config);

/** 获取诊断摘要 */
export const useDiagnosticSummary = () => useUiDumpStore(state => state.diagnosticSummary);

/** 获取可用模式 */
export const useAvailableModes = () => useUiDumpStore(state => state.availableModes);

/** 获取加载状态 */
export const useUiDumpLoading = () => useUiDumpStore(state => state.isLoading);

/** 获取测试状态 */
export const useTestRunning = () => useUiDumpStore(state => state.isTestRunning);

/** 获取最后一次测试结果 */
export const useLastTestResult = () => useUiDumpStore(state => state.lastTestResult);

/** 获取所有 actions */
export const useUiDumpActions = () => useUiDumpStore(state => ({
  initialize: state.initialize,
  setMode: state.setMode,
  executeDump: state.executeDump,
  executeDumpAndSave: state.executeDumpAndSave,
  testMode: state.testMode,
  fetchDiagnostics: state.fetchDiagnostics,
  clearDiagnostics: state.clearDiagnostics,
  resetConfig: state.resetConfig,
  setExecOutTimeout: state.setExecOutTimeout,
  setDumpPullTimeout: state.setDumpPullTimeout,
  clearDeviceCompat: state.clearDeviceCompat,
  checkAndroidAppStatus: state.checkAndroidAppStatus,
}));
