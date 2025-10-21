# V3 Chain & Static 执行器骨架创建报告

## 执行摘要

已成功创建 `chain_engine.rs` 和 `static_exec.rs` 的执行器骨架,并在 `main.rs` 中注册了 V3 命令。但编译时发现**类型不匹配**问题,需要对齐现有的 `ExecEventV3` 和 `emit_` 函数签名。

---

## 已完成的工作

### 1. 创建 chain_engine.rs 骨架 ✅
**文件路径**: `src-tauri/src/exec/v3/chain_engine.rs`  
**代码行数**: ~280 lines  
**核心功能**:
- 智能自动链执行器主入口 `execute_chain()`
- 有序评分阶段 (Strict vs Relaxed 模式)
- 短路执行逻辑 (分数 ≥ threshold → 执行,成功即返回)
- 失败回退 (执行失败 → 尝试下一个高分步骤)
- 9个 TODO 标记点 (评分、缓存、验证、执行、screenHash计算)

**事件流设计**:
```
device_ready → snapshot_ready → match_started → matched → validated → executed → complete
```

### 2. 创建 static_exec.rs 骨架 ✅
**文件路径**: `src-tauri/src/exec/v3/static_exec.rs`  
**代码行数**: ~320 lines  
**核心功能**:
- 静态策略执行器主入口 `execute_static()`
- 固定定位器匹配 (id/xpath/text/class)
- 确定性评分 (找到且满足约束 → 1.0,不满足 → 0.5,未找到 → 0.0)
- Dryrun 模式支持 (只定位不执行)
- 后置验证 (node_gone/new_activity/text_appears)
- 10个 TODO 标记点 (定位、可见性、动作执行、验证)

**评分规则**:
- 找到元素且满足约束 → confidence = 1.0
- 找到元素但不满足约束 → confidence = 0.5
- 未找到元素 → confidence = 0.0

### 3. 注册 V3 命令到 main.rs ✅
**修改文件**: `src-tauri/src/main.rs`  
**变更内容**:
1. 添加模块声明: `mod exec; // V3 统一执行协议`
2. 创建 `src-tauri/src/exec/mod.rs` → `pub mod v3;`
3. 在 `invoke_handler!` 中添加:
   ```rust
   // V3 统一执行协议命令
   exec::v3::execute_single_step_test_v3,
   exec::v3::execute_chain_test_v3,
   exec::v3::execute_static_strategy_test_v3,
   exec::v3::execute_task_v3
   ```

### 4. 更新 commands.rs 导入和签名 ✅
**修改内容**:
- 修正导入: `use super::single_step::execute_single_step_internal;`
- 所有命令函数添加 `envelope: ContextEnvelope` 参数
- 修复 `StaticSpecV3` 无 `step_id` 字段的日志问题 (使用 `strategy_id`)

---

## 编译错误列表

### 🔴 关键错误 (阻止编译)

1. **类型不匹配**: chain_engine.rs 和 static_exec.rs 使用了错误的类型
   - ❌ 代码中使用: `StepScore { step_id, confidence, cached, reason }`
   - ✅ 实际定义: `StepScore { step_id, confidence }` (只有两个字段)

2. **emit_progress 参数错误**:
   - ❌ 调用方式: `emit_progress(app, device_id, ProgressPhase::DeviceReady, "消息")`
   - ✅ 正确签名:
     ```rust
     pub fn emit_progress(
         app: &AppHandle,
         analysis_id: Option<String>,  // 不是 device_id
         step_id: Option<String>,
         phase: Phase,                 // 不是 ProgressPhase
         confidence: Option<Confidence>,
         message: Option<String>,
         meta: Option<serde_json::Value>,
     ) -> Result<(), String>
     ```

3. **emit_complete 参数错误**:
   - ❌ 调用方式: `emit_complete(app, &event)`
   - ✅ 正确签名:
     ```rust
     pub fn emit_complete(
         app: &AppHandle,
         analysis_id: Option<String>,
         summary: Option<Summary>,
         scores: Option<Vec<StepScore>>,
         result: Option<ResultPayload>,
     ) -> Result<(), String>
     ```

4. **Phase vs ProgressPhase**: 代码中使用了 `ProgressPhase` 但实际类型是 `Phase`

5. **文档注释错误**: chain_engine.rs:305 和 static_exec.rs:312 处有孤立的文档注释 (可能是TODO注释格式不对)

---

## 根本原因分析

**问题**: 两套不同的类型系统混用

1. **新创建的类型** (在我的骨架代码中):
   - `ProgressPhase` enum (device_ready/snapshot_ready/...)
   - `ExecutionEventV3` enum (Progress/Complete)
   - `ExecutionResult` struct
   - `ExecutionSummary` struct
   - 事件流: 统一 envelope 包装

2. **现有的类型** (在 types.rs 中):
   - `Phase` enum (DeviceReady/SnapshotReady/...)
   - `ExecEventV3` enum (Progress/Complete)
   - `ResultPayload` struct
   - `Summary` struct
   - 事件流: 分散的 Option 字段

**结论**: 骨架代码需要重写,完全对齐现有类型系统。

---

## 修复方案

### 方案 A: 完全重写 chain_engine.rs 和 static_exec.rs (推荐)

**步骤**:
1. 使用现有的 `ExecEventV3::Progress` 和 `ExecEventV3::Complete`
2. 调用 `emit_progress` 和 `emit_complete` 时传递所有7个/5个参数
3. 使用 `Phase` enum 而不是 `ProgressPhase`
4. `StepScore` 只包含 `step_id` 和 `confidence` 两个字段
5. 返回类型为 `Result<(), String>` 或通过事件发射结果

**预计工作量**: 2-3小时

### 方案 B: 修改 types.rs 和 events.rs (不推荐)

**原因**: 
- 会破坏现有代码的兼容性
- events.rs 已被其他模块使用 (single_step.rs)
- 架构约束要求"最小改动,包装现有代码"

---

## 下一步行动

### 立即修复 (优先级 P0):

1. **重写 chain_engine.rs**:
   ```rust
   pub async fn execute_chain(...) -> Result<(), String> {
       // 使用 emit_progress(app, Some(analysis_id), Some(step_id), Phase::DeviceReady, None, Some("消息"), None)?;
       // 使用 emit_complete(app, Some(analysis_id), Some(summary), Some(scores), Some(result))?;
   }
   ```

2. **重写 static_exec.rs**:
   ```rust
   pub async fn execute_static(...) -> Result<(), String> {
       // 同上,完全对齐事件签名
   }
   ```

3. **修复 commands.rs**:
   - 移除 `envelope` 参数 (因为现有的 SingleStepSpecV3 已包含 context)
   - 或修改所有 Spec 类型来嵌入 envelope

4. **修复文档注释**: 将 `///` 改为 `//` 或移除孤立的注释

### 中期任务 (优先级 P1):

5. **对齐前后端类型定义**: 确保 `src/protocol/v3/types.ts` 和 `src-tauri/src/exec/v3/types.rs` 的事件格式一致

6. **填充 TODO 标记**: 集成现有的评分、执行、验证逻辑

### 长期任务 (优先级 P2):

7. **创建前端路由器**: `src/workflow/executeRouter.ts`
8. **更新前端事件监听**: 处理新的事件格式
9. **E2E 测试**: 验证三条链路

---

## 待办清单更新

- [x] V3 协议类型 (前端 TS)
- [x] V3 协议类型 (后端 Rust)
- [x] 统一事件发射器
- [x] 命令骨架
- [x] 单步执行器骨架
- [x] 自动链执行器骨架 (创建完成,需修复类型)
- [x] 静态执行器骨架 (创建完成,需修复类型)
- [x] 注册命令到 main.rs
- [⚠️] 修复编译错误 **(当前阻塞项)**
- [ ] 前端执行路由器
- [ ] 前端事件监听
- [ ] 完善单步执行器
- [ ] 完善自动链执行器
- [ ] 完善静态执行器
- [ ] E2E 测试

---

## 总结

### 成果

✅ 已创建完整的 V3 执行器骨架结构  
✅ 所有命令已注册到 Tauri  
✅ 模块导出正确配置  
✅ 核心执行逻辑流程清晰 (短路/回退/dryrun/验证)

### 阻塞

❌ 编译错误: 类型系统不匹配  
❌ emit_ 函数调用签名错误  
❌ StepScore 字段过多  
❌ Phase vs ProgressPhase 混用

### 建议

**用户需要决定**:
- **选项 A**: 我立即修复编译错误 (对齐现有类型系统,预计1小时)
- **选项 B**: 用户根据此报告自行修复
- **选项 C**: 讨论是否需要统一两套类型系统 (需要架构决策)

**我的建议**: 选择 **选项 A**,因为我已经理解了问题的根源,可以快速修复。修复后代码将完全遵循现有的 ExecEventV3 事件协议。
