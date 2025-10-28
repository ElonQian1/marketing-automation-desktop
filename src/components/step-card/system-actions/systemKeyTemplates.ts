// src/components/step-card/system-actions/systemKeyTemplates.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { ExtendedSmartScriptStep } from '../../../types/loopScript';

const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export type SystemKey = 'BACK' | 'HOME' | 'APP_SWITCH' | 'POWER' | 'LOCK' | 'MENU';

// 对应 Android KeyEvent 数值（参考常见键值，保持简单）
const KEYCODES: Record<SystemKey, number> = {
  BACK: 4,
  HOME: 3,
  APP_SWITCH: 187,
  POWER: 26,
  LOCK: 223, // KEYCODE_SLEEP / SCREEN_OFF
  MENU: 82,
};

const DISPLAY_NAME: Record<SystemKey, string> = {
  BACK: '返回键',
  HOME: '首页键',
  APP_SWITCH: '最近任务',
  POWER: '电源键',
  LOCK: '锁屏',
  MENU: '菜单键',
};

export function createSystemKeyStepTemplate(key: SystemKey): ExtendedSmartScriptStep {
  const code = KEYCODES[key];
  return {
    id: genId('step_syskey'),
    step_type: 'keyevent',
    name: `系统按键 - ${DISPLAY_NAME[key]}`,
    description: `发送系统按键:${DISPLAY_NAME[key]}（code=${code}）`,
    parameters: { code },
    enabled: true,
    order: 0,
    find_condition: null,
    verification: null,
    retry_config: null,
    fallback_actions: [],
    pre_conditions: [],
    post_conditions: [],
    parent_loop_id: undefined,
    is_in_loop: false,
  };
}

/**
 * 创建等待步骤模板
 * @param durationMs 等待时长（毫秒），默认1000ms
 */
export function createWaitStepTemplate(durationMs: number = 1000): ExtendedSmartScriptStep {
  return {
    id: genId('step_wait'),
    step_type: 'wait',
    name: `⏱️ 等待 ${durationMs}ms`,
    description: `暂停执行 ${durationMs} 毫秒`,
    parameters: { 
      duration: durationMs,
      wait_duration: durationMs  // 兼容旧参数名
    },
    enabled: true,
    order: 0,
    find_condition: null,
    verification: null,
    retry_config: null,
    fallback_actions: [],
    pre_conditions: [],
    post_conditions: [],
    parent_loop_id: undefined,
    is_in_loop: false,
  };
}

export const SystemKeyTemplates = {
  back: () => createSystemKeyStepTemplate('BACK'),
  home: () => createSystemKeyStepTemplate('HOME'),
  appSwitch: () => createSystemKeyStepTemplate('APP_SWITCH'),
  power: () => createSystemKeyStepTemplate('POWER'),
  lock: () => createSystemKeyStepTemplate('LOCK'),
  menu: () => createSystemKeyStepTemplate('MENU'),
  
  // 基础操作：等待
  wait: (durationMs?: number) => createWaitStepTemplate(durationMs),
};

export default SystemKeyTemplates;
