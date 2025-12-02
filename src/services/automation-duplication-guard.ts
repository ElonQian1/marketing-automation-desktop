// src/services/automation-duplication-guard.ts
// module: automation | layer: service | role: guard
// summary: automation-duplication-guard.ts 文件

import { invoke } from '@tauri-apps/api/core';

export type DupAction = 'follow' | 'reply' | 'like' | 'share';

export interface DuplicationCheckRequest {
  target_id: string;
  action: DupAction;
  device_id: string;
}

export interface DuplicationCheckResult {
  result: 'pass' | 'blocked';
  reason: string;
  confidence: number;
  rule_id?: string | null;
}

export async function checkDuplication(req: DuplicationCheckRequest): Promise<DuplicationCheckResult> {
  // Tauri invoke expects an object map of args; spread into a plain record
  const res = await invoke<DuplicationCheckResult>('plugin:automation|check_duplication', { 
    req: {
      target_id: req.target_id,
      action: req.action,
      device_id: req.device_id,
    }
  });
  return res;
}

export async function recordDuplicationAction(record: { target_id: string; action: DupAction; device_id: string; timestamp?: number; }): Promise<void> {
  const payload = {
    target_id: record.target_id,
    action: record.action,
    device_id: record.device_id,
    timestamp: record.timestamp ?? Date.now()
  };
  await invoke('plugin:automation|record_action', { record: payload });
}
