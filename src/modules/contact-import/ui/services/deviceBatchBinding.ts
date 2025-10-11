// src/modules/contact-import/ui/services/deviceBatchBinding.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

// modules/contact-import/ui/services | deviceBatchBinding.ts | 设备批次绑定状态管理// modules/contact-import/ui/services | deviceBatchBinding.ts | 设备批次绑定状态管理

// 轻量UI层状态（不入库）：跟踪"待导入/已导入"的设备-批次绑定关系// 轻量UI层状态（不入库）：跟踪"待导入/已导入"的设备-批次绑定关系

// 若后续需要持久化，可接到import_sessions或新表，目前仅用于前端卡片/抽屉展示// 若后续需要持久化，可接到import_sessions或新表，目前仅用于前端卡片/抽屉展示



export interface DeviceBatchBindingState {export interface DeviceBatchBindingState {es/contact-import/ui/services | deviceBatchBinding.ts | 设备批次绑定状态管理

  pending: Record<string, string[]>; // deviceId -> [batchId]// 轻量UI层状态（不入库）：跟踪"待导入/已导入"的设备-批次绑定关系

  imported: Record<string, string[]>; // deviceId -> [batchId]// 若后续需要持久化，可接到import_sessions或新表，目前仅用于前端卡片/抽屉展示

}

export interface DeviceBatchBindingState {量 UI 层状态（不入库）：跟踪“待导入/已导入”的设备-批次绑定

const state: DeviceBatchBindingState = { pending: {}, imported: {} };// 若后续需要持久化，可接到 import_sessions 或新表；目前仅用于前端卡片/抽屉展示



// 轻量发布-订阅：用于通知前端 UI 绑定状态已更新export interface DeviceBatchBindingState {

type Listener = () => void;  pending: Record<string, string[]>; // deviceId -> [batchId]

const listeners = new Set<Listener>();  imported: Record<string, string[]>; // deviceId -> [batchId]

function notify() {}

  listeners.forEach((fn) => {

    try { fn(); } catch {}const state: DeviceBatchBindingState = { pending: {}, imported: {} };

  });

}// 轻量发布-订阅：用于通知前端 UI 绑定状态已更新

export function subscribe(listener: Listener): () => void {type Listener = () => void;

  listeners.add(listener);const listeners = new Set<Listener>();

  return () => listeners.delete(listener);function notify() {

}  listeners.forEach((fn) => {

    try { fn(); } catch {}

export function bindBatchToDevice(deviceId: string, batchId: string) {  });

  state.pending[deviceId] = Array.from(new Set([...(state.pending[deviceId] || []), batchId]));}

  notify();export function subscribe(listener: Listener): () => void {

}  listeners.add(listener);

  return () => listeners.delete(listener);

export function markBatchImportedForDevice(deviceId: string, batchId: string) {}

  // 从 pending 移除

  state.pending[deviceId] = (state.pending[deviceId] || []).filter(b => b !== batchId);export function bindBatchToDevice(deviceId: string, batchId: string) {

  // 放到 imported  state.pending[deviceId] = Array.from(new Set([...(state.pending[deviceId] || []), batchId]));

  state.imported[deviceId] = Array.from(new Set([...(state.imported[deviceId] || []), batchId]));  notify();

  notify();}

}

export function markBatchImportedForDevice(deviceId: string, batchId: string) {

export function getBindings(deviceId: string): { pending: string[]; imported: string[] } {  // 从 pending 移除

  return {  state.pending[deviceId] = (state.pending[deviceId] || []).filter(b => b !== batchId);

    pending: state.pending[deviceId] || [],  // 放到 imported

    imported: state.imported[deviceId] || [],  state.imported[deviceId] = Array.from(new Set([...(state.imported[deviceId] || []), batchId]));

  };  notify();

}}



export function getAllBindings(): DeviceBatchBindingState {export function getBindings(deviceId: string): { pending: string[]; imported: string[] } {

  return { ...state };  return {

}    pending: state.pending[deviceId] || [],

    imported: state.imported[deviceId] || [],

export function clearAllBindings() {  };

  state.pending = {};}

  state.imported = {};
  notify();
}