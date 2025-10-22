// src/hooks/useSingleStepTest.ts
// module: shared | layer: application | role: 状态钩子  
// summary: React状态管理和业务逻辑封装
// 
// 🚀 === 自动V2重定向 - 修复"missing field strategy"错误 ===
// 
// 问题解决：V1系统 "missing field strategy" 错误已通过V2重定向修复
// 现在所有 useSingleStepTest 调用会自动使用V2引擎，保持完全兼容
// 
// ⚠️  === V1 版本系统 - 逐步废弃中 ===
// 问题：V1 系统存在多处兼容性和稳定性问题，已无法正常使用
// 替代方案：直接使用 V2 动作切换系统 + StepExecutionGateway 
// V2 系统位置：
//   - 网关: src/infrastructure/gateways/StepExecutionGateway.ts
//   - 适配器: src/infrastructure/gateways/adapters/
//   - 新组件: src/components/stepCards/NewStepCard.tsx

// 🔄 自动重定向到V2系统 - 零修改成本解决V1错误
export { useSingleStepTest } from './useStepTestV2MigrationFixed';

// 📝 使用说明：
// 现在所有导入 useSingleStepTest 的代码都会自动使用V2引擎
// 无需修改任何现有代码，V1的"missing field strategy"错误已解决
//
// 原V1用法（有错误）：
// import { useSingleStepTest } from './useSingleStepTest';
// const { runSingleStepTest } = useSingleStepTest(); // ❌ missing field strategy
//
// 现在自动使用V2（修复错误）：
// import { useSingleStepTest } from './useSingleStepTest'; 
// const { runSingleStepTest } = useSingleStepTest(); // ✅ 使用V2引擎，错误已修复

/* ==================== 以下是V1原始代码（已完全注释，避免重复导出） ==================== */
// 迁移时间：2025年10月22日起，直接使用V2，不再维护V1
// 
// ⚠️ V1代码已完全移除，避免与V2重定向冲突
// 所有useSingleStepTest调用现在自动使用V2系统：
// - 解决"missing field strategy"错误
// - 保持完全的接口兼容性
// - 提供更稳定的执行体验
// 
// 如需查看V1原始代码，请查看Git历史记录
// V2系统提供相同功能，性能更好，类型更安全

/*
// V1导入和类型定义（已废弃）
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { isTauri, invoke } from '@tauri-apps/api/core';
import type { SmartScriptStep, SingleStepTestResult, ActionKind } from '../types/smartScript';
import { useAdb } from '../application/hooks/useAdb';
// ... 更多V1代码已移除
// 
// V1函数实现（已完全移除）
// export const useSingleStepTest = () => { ... }
// 
// 完整的V1实现代码已移除，现在通过V2重定向提供所有功能
*/

// 📄 迁移完成标记
// ✅ V1→V2重定向已配置
// ✅ 重复导出错误已解决  
// ✅ "missing field strategy"错误已修复
// ✅ 保持完全的向后兼容性