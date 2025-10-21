# V3 三链执行架构实施进度

## ✅ 已完成的工作

### 1. 前端协议类型（TypeScript）
- ✅ `src/protocol/v3/types.ts` - 完整的 V3 类型定义
  - ContextEnvelope（上下文信封）
  - QualitySettings（质量设置）
  - ConstraintSettings（约束条件）
  - ValidationSettings（验证规则）
  - SingleStepSpecV3（智能单步）
  - ChainSpecV3（智能自动链）
  - StaticSpecV3（静态策略）
  - 事件类型（ProgressEventV3, CompleteEventV3）

### 2. 后端协议类型（Rust）
- ✅ `src-tauri/src/exec/v3/types.rs` - 与前端对应的 Rust 类型
  - 所有结构体已定义
  - SingleStepAction 添加了 Unknown 枚举兜底

### 3. 统一事件发射器
- ✅ `src-tauri/src/exec/v3/events.rs` - 事件发射封装
  - emit_progress() - 进度事件
  - emit_complete() - 完成事件
  - 便捷方法（device_ready, snapshot_ready, matched, validated, executed）

### 4. 命令骨架
- ✅ `src-tauri/src/exec/v3/commands.rs` - 三个命令入口
  - execute_single_step_test_v3()
  - execute_chain_test_v3()
  - execute_static_strategy_test_v3()
  - execute_task_v3()（可选聚合入口）

### 5. 单步执行器骨架
- ✅ `src-tauri/src/exec/v3/single_step.rs` - FastPath 执行流程
  - 完整的事件发射流程
  - TODO 标记需要接入现有逻辑的位置

### 6. 模块结构
- ✅ `src-tauri/src/exec/v3/mod.rs` - 模块导出

---

## 🚧 待完成的工作

### A. 前端工作

#### 1. 类型映射层（已有，需确认）
**文件**: `src/workflow/normalizeStepForBackend.ts`
- 确认映射规则正确
- footer_* → smart_navigation ✅
- 其他未知类型 → smart_tap ✅

#### 2. 执行路由器（需创建）
**文件**: `src/workflow/executeRouter.ts`

```typescript
import { invoke } from '@tauri-apps/api/core';
import { normalizeStepForBackend } from './normalizeStepForBackend';
import type { ContextEnvelope, TaskKind } from '../protocol/v3/types';

// 构建上下文信封
export function buildContextEnvelope(
  deviceId: string,
  packageName: string,
  snapshotInfo?: {
    analysisId?: string;
    screenHash?: string;
    xmlCacheId?: string;
  }
): ContextEnvelope {
  return {
    deviceId,
    app: {
      package: packageName,
    },
    snapshot: snapshotInfo || {},
    executionMode: 'strict', // 默认严格模式
  };
}

// 根据步骤卡片决定执行模式
export async function executeByStepCard(
  stepCard: any,
  deviceId: string,
  packageName: string
) {
  const context = buildContextEnvelope(deviceId, packageName, {
    analysisId: stepCard.analysisResult?.analysisId,
    screenHash: stepCard.analysisResult?.screenHash,
    xmlCacheId: stepCard.snapshotId,
  });

  // 决定执行类型
  if (stepCard.isStaticStrategy) {
    // 静态策略
    return invoke('execute_static_strategy_test_v3', {
      spec: {
        strategyId: stepCard.id,
        action: stepCard.action,
        locator: stepCard.locator,
        dryrun: false,
        context,
      },
    });
  } else if (stepCard.analysisResult?.selectedStepId) {
    // 用户选择了具体单步
    const normalized = normalizeStepForBackend({
      stepId: stepCard.id,
      type: stepCard.type,
      params: stepCard.parameters,
    });
    
    return invoke('execute_single_step_test_v3', {
      step: {
        stepId: normalized.stepId,
        action: normalized.action,
        params: normalized.params,
        context,
      },
    });
  } else {
    // 默认使用智能自动链
    return invoke('execute_chain_test_v3', {
      spec: {
        chainId: stepCard.analysisResult?.analysisId,
        orderedSteps: [], // TODO: 从 ChainResult 缓存加载
        threshold: 0.7,
        mode: 'execute',
        context,
      },
    });
  }
}
```

#### 3. 事件监听（需更新）
**文件**: 相关的 Hook 或 Store

```typescript
import { listen } from '@tauri-apps/api/event';
import type { ProgressEventV3, CompleteEventV3 } from '../protocol/v3/types';

// 监听进度事件
listen<ProgressEventV3>('analysis:progress', (event) => {
  const { phase, confidence, stepId, message } = event.payload;
  console.log(`📊 进度: ${phase}, 置信度: ${confidence}`);
  // TODO: 更新 UI 状态
});

// 监听完成事件
listen<CompleteEventV3>('analysis:complete', (event) => {
  const { summary, scores, result } = event.payload;
  console.log(`✅ 完成: 耗时 ${summary?.elapsedMs}ms`);
  // TODO: 更新最终结果
});
```

---

### B. 后端工作

#### 1. 自动链执行器（需创建）
**文件**: `src-tauri/src/exec/v3/chain_engine.rs`

```rust
// 核心逻辑骨架
pub async fn execute_chain_internal(
    app: &AppHandle,
    spec: ChainSpecV3,
) -> Result<Value> {
    // 1. 获取当前快照
    // 2. 决定是否重评（strict/relaxed）
    // 3. 按顺序评分候选步骤
    // 4. 短路执行：score >= threshold 则执行
    // 5. 失败则回退到下一步
    // 6. 发射统一事件
    
    // TODO: 实现
    Ok(json!({ "ok": true }))
}
```

#### 2. 静态执行器（需创建）
**文件**: `src-tauri/src/exec/v3/static_exec.rs`

```rust
// 核心逻辑骨架
pub async fn execute_static_internal(
    app: &AppHandle,
    spec: StaticSpecV3,
) -> Result<Value> {
    // 1. 按 locator 命中节点
    // 2. 校验可见性/唯一性/可点击性
    // 3. 计算静态置信度
    // 4. dryrun? 决定是否真点
    // 5. 验证后置条件
    // 6. 发射统一事件
    
    // TODO: 包装旧代码
    Ok(json!({ "ok": true }))
}
```

#### 3. 单步执行器完善
**文件**: `src-tauri/src/exec/v3/single_step.rs`

需要填充的 TODO：
- 获取当前屏幕快照（调用现有 ADB 服务）
- 根据 action 类型分发到现有处理函数
- 应用 quality/constraints 参数
- 执行后置验证
- 获取实际执行坐标

#### 4. 注册命令到 main.rs
**文件**: `src-tauri/src/main.rs`

```rust
// 添加导入
use exec::v3::{
    execute_single_step_test_v3,
    execute_chain_test_v3,
    execute_static_strategy_test_v3,
    execute_task_v3,
};

// 在 tauri::Builder 中注册
.invoke_handler(tauri::generate_handler![
    // ... 现有命令 ...
    
    // V3 执行命令
    execute_single_step_test_v3,
    execute_chain_test_v3,
    execute_static_strategy_test_v3,
    execute_task_v3,
])
```

#### 5. 添加 exec 模块到 lib.rs
**文件**: `src-tauri/src/lib.rs` 或 `main.rs`

```rust
mod exec {
    pub mod v3;
}
```

---

## 🔍 关键集成点

### 1. 复用现有 ADB 服务
需要从以下位置获取：
- `services::adb_session_manager::get_device_session`
- `services::execution::matching::find_element_in_ui`
- `services::execution::actions::smart::handle_smart_navigation`

### 2. 复用现有匹配引擎
- `services::execution::run_unified_match`
- 应用 ROI/OCR/语言标准化参数

### 3. 复用现有验证逻辑
- 等待节点消失
- 等待 Activity 切换
- 等待文本出现

---

## 📝 实施步骤建议

1. **Phase 1**: 完成后端骨架（chain_engine.rs, static_exec.rs）
2. **Phase 2**: 在 main.rs 注册命令，编译通过
3. **Phase 3**: 完成前端路由器（executeRouter.ts）
4. **Phase 4**: 接入现有业务逻辑到 TODO 位置
5. **Phase 5**: 端到端测试三条链路

---

## ✅ 验收标准

### 智能单步
- [ ] 点击测试按钮 → 不再出现 unknown variant 错误
- [ ] DevTools 看到 `action: "smart_navigation", params: { target: "footer_other" }`
- [ ] 收到 progress 和 complete 事件
- [ ] confidence 在 0..1 范围内

### 智能自动链
- [ ] 设置 threshold=0.7
- [ ] 观察短路执行（≥阈值立即执行）
- [ ] 失败时回退到下一步
- [ ] screenHash 不同时触发重评

### 静态策略
- [ ] dryrun=true 仅验证不执行
- [ ] dryrun=false 真实执行
- [ ] 根据 locator 正确定位元素
- [ ] 返回置信度评分

---

## 🎯 下一步行动

**优先级 1**（立即可做）：
1. 创建 chain_engine.rs 和 static_exec.rs 骨架
2. 注册命令到 main.rs
3. 编译通过

**优先级 2**（需业务知识）：
1. 在 single_step.rs 中接入现有逻辑
2. 完善 chain_engine.rs 短路执行
3. 包装 static_exec.rs 旧代码

**优先级 3**（前端集成）：
1. 创建 executeRouter.ts
2. 更新事件监听
3. 端到端测试

---

现在你可以：
1. 让我继续完成剩余的骨架代码
2. 或者你自己根据 TODO 标记填充业务逻辑
3. 或者我们一起讨论哪些地方需要调整
