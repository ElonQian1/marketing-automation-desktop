// DEPRECATED SHIM: Temporary stub to satisfy type-checks for legacy contact components.
// TODO: Remove this file after migrating to the unified automation service.

export interface XiaohongshuFollowOptions {
  deviceId: string;
  maxFollows?: number;
  delayMs?: number;
}

export interface XiaohongshuFollowResult {
  // legacy shape expectations from EnhancedImportAndFollow
  success?: boolean;
  total_followed?: number;
  pages_processed?: number;
  duration?: number; // seconds
  message?: string;
  // minimal normalized fields
  followed?: number;
  failed?: number;
  details?: Array<{ account: string; status: 'ok' | 'failed'; reason?: string }>;
}

export interface AppStatusResult {
  // normalized
  installed: boolean;
  launched: boolean;
  version?: string;
  // legacy aliases
  app_installed?: boolean;
  app_running?: boolean;
  app_version?: string;
}

export interface NavigationResult {
  ok?: boolean;
  success?: boolean;
  message?: string;
}

export const XiaohongshuService = {
  async initializeService(_deviceId: string): Promise<void> {
    // no-op stub
  },
  async checkAppStatus(): Promise<AppStatusResult> {
    return {
      installed: true,
      launched: true,
      version: 'stub',
      app_installed: true,
      app_running: true,
      app_version: 'stub',
    };
  },
  async navigateToContacts(): Promise<NavigationResult> {
    return { ok: true, success: true };
  },
  async autoFollowContacts(_options: XiaohongshuFollowOptions): Promise<XiaohongshuFollowResult> {
    return {
      success: true,
      total_followed: 0,
      pages_processed: 0,
      duration: 0,
      message: 'stub',
      followed: 0,
      failed: 0,
      details: [],
    };
  },
};
