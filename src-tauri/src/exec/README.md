# V3 智能执行系统（Rust）

> ⚠️ **注意**：核心逻辑已迁移至 `src/automation` 目录。本目录目前仅作为兼容层保留。

## 概述

V3 是新一代“智能自动链 + 策略分析”执行引擎。

新的目录结构请参考 `src/automation`：
```
src-tauri/src/automation/
├── analysis/        # 智能分析 (原 helpers/intelligent_analysis 等)
├── pipeline/        # 执行管线 (原 chain_engine, single_step 等)
├── adapters/        # 外部适配器 (device, xml_source)
├── matching/        # 元素匹配
├── types.rs         # 核心类型
└── events.rs        # 事件模型
```

旧文档归档：

V3 是新一代“智能自动链 + 策略分析”执行引擎，相比 V2 提供：
- 完整的 Step 0-6 策略分析链路（匹配、验证、容错、回退）
- 链式执行（chain）与单步执行（single_step）统一协议
- 事件与日志更丰富，便于前端实时追踪
- 更好的类型约束与扩展性（by-ref 模式、静态执行等）

目录结构：
```
src-tauri/src/exec/v3/
├── mod.rs           # 模块入口
├── types.rs         # 核心类型定义（请求、响应、上下文等）
├── events.rs        # 事件/日志模型
├── commands.rs      # Tauri 命令导出（前端直接调用）
├── single_step.rs   # 单步智能执行
├── chain_engine.rs  # 智能自动链（多步执行 + 策略分析）
└── static_exec.rs   # 静态策略执行（无需设备）
```

相关新架构（进行中）：
```
src-tauri/src/exec/v3_new/
├── types/           # 新的规格/事件/结果类型
└── core/executor.rs # 新执行器（演进方向）
```

## 关键命令（前端可调用）

在 `src-tauri/src/main.rs` 中注册了以下命令：
- `execute_single_step_test_v3`：单步智能执行（替代手动步骤）
- `execute_chain_test_v3`：智能自动链 + Step 0-6 策略分析（替代 `start_intelligent_analysis`）
- `execute_static_strategy_test_v3`：静态策略执行（不连接设备，用于纯策略验证）

前端调用示例（TypeScript）：
```ts
import { invoke } from '@tauri-apps/api/core';

// 1) 单步执行（V3）
await invoke('execute_single_step_test_v3', {
  deviceId: 'emulator-5554',
  step: {/* Step 数据（与 AI/步骤卡片对齐） */},
  mode: 'execute-step' // 或 'match-only'
});

// 2) 智能自动链（推荐）
const result = await invoke('execute_chain_test_v3', {
  deviceId: 'emulator-5554',
  steps: [/* 多个 Step */],
  threshold: 0.72,             // 置信度阈值
  dryRun: false,               // 仅分析不执行
  options: { byRef: true }     // by-ref 模式，避免大对象拷贝
});

// 3) 静态策略执行（无需设备）
await invoke('execute_static_strategy_test_v3', {
  scenario: {/* 策略与元素的静态描述 */}
});
```

注意：`step-pack-service.ts` 已切换到 `execute_chain_test_v3` 路径，确保前端优先使用 V3。

## 类型与事件

- `types.rs` 定义了 V3 的请求/响应/上下文等类型
- `events.rs` 定义了链路过程中产生的事件（如匹配开始/结束、执行结果、验证日志）

事件用途：
- 在链执行时，前端可以订阅（或读取汇总）这些事件以渲染实时进度与诊断信息

## 核心执行流程

- 单步（`single_step.rs`）
  1. 解析 Step → 生成候选元素
  2. 策略打分（文本/属性/位置/上下文）
  3. 选择最优候选并执行动作
  4. 执行后验证与回退策略

- 链式执行（`chain_engine.rs`）
  1. 遍历步骤并维护上下文
  2. Step 0-6 策略分析（含容错与跳过）
  3. 事件流记录（供前端回放/展示）

- 静态执行（`static_exec.rs`）
  - 不连接设备，仅验证策略/选择逻辑，适合离线分析

## 与 V2 的差异

| 维度 | V2 | V3 |
|---|---|---|
| 执行粒度 | 单步为主 | 单步 + 链式（主） |
| 策略分析 | 简化版 | 完整 Step 0-6 分析 |
| 事件/日志 | 基础 | 结构化事件，便于回放 |
| 数据传输 | 普通结构 | 支持 by-ref，减少拷贝 |
| 静态能力 | 无 | 有（static_exec） |

## 前端集成建议

- 生产环境：保留 V2 为稳定回退；新功能优先调用 V3 的 `execute_chain_test_v3`
- 特性开关：使用 `src/config/feature-flags.ts` 中的 `getExecutionVersion()` 或 `USE_V3_EXECUTION` 控制灰度
- 调试：配合 `script-execution-diagnostics.ts` 提示信息与日志开关

示例（服务层集成）：
```ts
import { invoke } from '@tauri-apps/api/core';
import { getExecutionVersion } from '@/config/feature-flags';

export async function runSmartChain(deviceId: string, steps: any[]) {
  const version = getExecutionVersion(); // 'v2' | 'v3'
  if (version === 'v3') {
    return invoke('execute_chain_test_v3', { deviceId, steps, threshold: 0.72, dryRun: false });
  }
  // 回退到 V2（保持兼容）
  // ...通过 StepExecutionGateway 或 V2 适配器
}
```

## 迁移路径

1. 新增功能优先落到 V3（链式执行、策略完善）
2. 保留 V2 作为回退路径，借助特性开关灰度
3. 将 V2 的关键策略移植/统一到 V3，逐步收敛
4. 等 V3 稳定后，由前端统一从 V2 → V3 的网关切换

## 相关文件

- `src-tauri/src/main.rs`：命令注册（execute_single_step_test_v3 / execute_chain_test_v3 / execute_static_strategy_test_v3）
- `src/services/step-pack-service.ts`：示例前端服务（已走 V3）
- `src/config/feature-flags.ts`：执行版本与灰度控制

## 更新记录

- 2025-10-26：补充文档；确认前端服务使用 `execute_chain_test_v3`；强调 by-ref 模式与事件化
- 2025-09-30：完成 `chain_engine.rs` 重构，支持链式执行
- 2025-09-15：增加 `static_exec.rs` 静态执行能力
