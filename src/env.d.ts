// src/env.d.ts
// module: shared | layer: types | role: 类型声明
// summary: TypeScript类型定义文件

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVICE_WATCHING_LOG_LEVEL?: string;
  readonly VITE_DEVICE_WATCHING_ENABLE_DIAGNOSTICS?: string;
  readonly VITE_DEVICE_WATCHING_ENABLE_PERFORMANCE_MONITORING?: string;
  readonly VITE_DEVICE_WATCHING_ENABLE_AUTO_RECOVERY?: string;
  readonly VITE_DEVICE_WATCHING_HEALTH_CHECK_INTERVAL?: string;
  readonly VITE_DEVICE_WATCHING_ENABLE_CONTINUOUS_MONITORING?: string;
  readonly VITE_DEVICE_WATCHING_ENABLE_LEGACY_TOOLS?: string;
  readonly VITE_DEVICE_WATCH_STRATEGY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}