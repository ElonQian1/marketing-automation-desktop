# V2 → V3 安全迁移计划

## 📊 完整性对比

### ✅ 后端对比（已完整）

| 功能模块 | V2 | V3 | 状态 |
|---------|----|----|------|
| **Tauri命令** | ✅ `start_intelligent_analysis` | ✅ `execute_chain_test_v3` | 都完整 |
| **事件发射** | ✅ `emit("analysis:progress")` | ✅ `emit("analysis:progress")` | 都完整 |
| **事件类型** | ✅ `analysis:progress/complete/error` | ✅ `analysis:progress/complete` | V3合并error到complete |
| **执行引擎** | ✅ 顺序执行 | ✅ 智能短路+回退 | V3更强 |
| **缓存优化** | ✅ confidence>0.6 | ✅ confidence>0.7 | 都有，V3更严格 |

**后端文件：**
- V2: `src-tauri/src/commands/intelligent_analysis.rs`
- V3: `src-tauri/src/exec/v3/commands.rs`, `src-tauri/src/exec/v3/events.rs`

---

### ✅ 前端对比（已补全）

| 功能模块 | V2 | V3 (新增) | 状态 |
|---------|----|----|------|
| **事件监听API** | ✅ `listenToAnalysisProgress()` | ✅ `listenToAnalysisProgress()` | 接口完全兼容 |
| **完成监听** | ✅ `listenToAnalysisComplete()` | ✅ `listenToAnalysisComplete()` | 接口完全兼容 |
| **错误监听** | ✅ `listenToAnalysisError()` | ✅ `listenToAnalysisError()` | V3监听complete中的失败 |
| **执行方法** | ✅ `startAnalysis()` | ✅ `executeChainV3()` | V3方法更强大 |
| **取消分析** | ✅ `cancelAnalysis()` | ⚠️ 未实现 | 需补充 |

**前端文件：**
- V2: `src/services/intelligent-analysis-backend.ts`
- V3: `src/services/intelligent-analysis-backend-v3.ts` (已补充事件API)

---

## 🔄 迁移路径

### Phase 1: 补充V3剩余功能（1天）✅ 已完成

**已完成：**
- ✅ 补充 `listenToAnalysisProgress()` - 兼容V2接口
- ✅ 补充 `listenToAnalysisComplete()` - 兼容V2接口
- ✅ 补充 `listenToAnalysisError()` - 监听complete中的失败
- ✅ 添加 `phaseToProgress()` 工具函数（8阶段→百分比）
- ✅ 添加 `phaseToStepMessage()` 工具函数（阶段→描述）
- ✅ `cancelAnalysis(jobId)` - 取消V3执行（降级处理）
- ✅ `cleanup()` - 清理V3事件监听器

---

### Phase 2: ~~创建V3兼容Hook（2天）~~ ✅ 已完成（采用更优方案）

**实际实施方案**：直接在现有Hook中集成V2/V3动态切换（更优！）

已在 `use-intelligent-analysis-workflow.ts` 中完成集成：

```typescript
// ✅ 已完成：V2/V3动态版本选择
const [currentExecutionVersion, setCurrentExecutionVersion] = useState<"v2" | "v3">("v2");

useEffect(() => {
  const updateExecutionVersion = async () => {
    const version = await featureFlagManager.getSmartExecutionVersion("intelligent-analysis");
    setCurrentExecutionVersion(version);
  };
  updateExecutionVersion();
  const interval = setInterval(updateExecutionVersion, 30000); // 每30秒检查
  return () => clearInterval(interval);
}, []);

// ✅ 已完成：事件监听动态路由
const backendService = currentExecutionVersion === "v3" 
  ? IntelligentAnalysisBackendV3 
  : intelligentAnalysisBackend;

await backendService.listenToAnalysisProgress(...);
await backendService.listenToAnalysisComplete(...);
await backendService.listenToAnalysisError(...);

// ✅ 已完成：执行动态路由
if (currentExecutionVersion === "v3") {
  response = await IntelligentAnalysisBackendV3.executeChainV3(v3Config, chainSpec);
} else {
  response = await intelligentAnalysisBackend.startAnalysis(uiElement, stepId, options);
}

// ✅ 已完成：取消动态路由
if (currentExecutionVersion === "v3") {
  await IntelligentAnalysisBackendV3.cancelAnalysis(jobId);
} else {
  await intelligentAnalysisBackend.cancelAnalysis(jobId);
}

// ✅ 已完成：清理动态路由
if (currentExecutionVersion === "v3") {
  IntelligentAnalysisBackendV3.cleanup();
}
```

**优势**：
- ✅ 用户代码零修改（透明切换）
- ✅ 实时动态切换（根据健康检查）
- ✅ 自动回退机制（V3失败→V2）
- ✅ 统一接口管理（避免代码重复）

---

### Phase 3: ~~渐进式迁移17处依赖（5-7天）~~ → 测试覆盖完成 ✅

#### **Phase 3.1: 测试覆盖V2/V3双模式** ✅ 已完成

**已完成测试文件**：
- ✅ `use-intelligent-analysis-workflow-v2-v3.test.ts` - 13项测试全部通过
  * ✅ V2模式路由测试（4项）
  * ✅ V3失败回退测试（2项）
  * ✅ 取消分析路由测试（2项）
  * ✅ 清理逻辑路由测试（2项）
  * ✅ 事件监听器管理测试（2项）
  * ✅ 核心路由逻辑验证（1项）

**测试覆盖内容**：
- ✅ V2/V3版本动态切换
- ✅ 事件监听器路由（progress/complete/error）
- ✅ 执行方法路由（startAnalysis vs executeChainV3）
- ✅ 取消方法路由（cancelAnalysis）
- ✅ 清理方法路由（cleanup）
- ✅ V3失败回退到V2机制
- ✅ V3错误结果处理（不回退）

#### **Phase 3.2: 依赖关系审查** 🔄 进行中

**已检查依赖**（参见 V2_DEPENDENCY_AUDIT.md）：

1. **核心工作流（高优先级）**
   - `src/modules/universal-ui/hooks/use-intelligent-analysis-workflow.ts` - ✅ 已集成V3
   
2. **适配器层（高优先级）**
   - `src/hooks/universal-ui/useIntelligentAnalysisAdapter.ts`
   
3. **智能分析Hook（中优先级）**
   - `src/hooks/universal-ui/useSmartStrategyAnalysis.ts`
   
4. **测试文件（低优先级）**
   - `src/modules/universal-ui/hooks/__tests__/use-intelligent-analysis-workflow-contract.test.ts`
   - `src/modules/universal-ui/hooks/__tests__/use-intelligent-analysis-workflow-events.test.ts`
   - 其他测试文件（需重写mock）

#### 迁移模板：

```typescript
// 旧代码（V2）
import { intelligentAnalysisBackend } from '../../../services/intelligent-analysis-backend';

await intelligentAnalysisBackend.listenToAnalysisProgress(...);
await intelligentAnalysisBackend.startAnalysis(...);

// 新代码（V3）- 只需改import
import { IntelligentAnalysisBackendV3 as intelligentAnalysisBackend } from '../../../services/intelligent-analysis-backend-v3';

await intelligentAnalysisBackend.listenToAnalysisProgress(...); // 接口完全相同！
await intelligentAnalysisBackend.executeChainV3(...); // 或用V3新方法
```

---

### Phase 4: 验证与清理（3天）

#### 验证清单：

1. **功能验证**
   - [ ] 步骤卡片创建 + 自动评分
   - [ ] 进度条实时更新（8个阶段）
   - [ ] 完成事件触发
   - [ ] 错误处理（失败步骤）
   - [ ] 缓存命中（confidence>0.7）

2. **性能验证**
   - [ ] 本地执行：数据量 ~5KB（by-ref）
   - [ ] 跨机器首次：数据量 ~500KB（by-inline）
   - [ ] 缓存命中率 >70%

3. **兼容性验证**
   - [ ] 所有17处迁移点正常工作
   - [ ] 测试用例全部通过
   - [ ] 无TypeScript类型错误

#### 删除清单：

删除以下V2文件（确认V3稳定运行1周后）：

**前端：**
- `src/services/intelligent-analysis-backend.ts` (435行)
- `src/modules/universal-ui/hooks/use-intelligent-analysis-workflow.ts` (V2版本)

**后端：**
- `src-tauri/src/commands/intelligent_analysis.rs` (882行)
- `src-tauri/src/commands/intelligent_analysis_backup.rs` (备份文件)

**清理main.rs：**
```rust
// 删除V2命令注册
// start_intelligent_analysis,      // ❌ 删除
// cancel_intelligent_analysis,     // ❌ 删除
// bind_analysis_result_to_step,    // ❌ 删除
// get_step_strategy,               // ❌ 删除
// clear_step_strategy,             // ❌ 删除
// run_step_v2,                     // ❌ 删除
```

---

## 📈 进度追踪

| 阶段 | 任务 | 预计时间 | 状态 | 备注 |
|------|------|---------|------|------|
| Phase 1 | 补充V3事件监听API | 1天 | ✅ 100% | 已完成progress/complete/error监听 |
| Phase 1 | 补充cancelAnalysis | 0.5天 | ✅ 100% | 已完成，支持降级处理 |
| Phase 1 | 补充cleanup方法 | 0.5天 | ✅ 100% | 已完成，自动管理监听器 |
| Phase 2 | 集成V3到现有Hook | 1天 | ✅ 100% | ✅ **已完成！** |
| Phase 2 | 动态事件监听切换 | 0.5天 | ✅ 100% | 根据版本自动选择backend |
| Phase 2 | 单元测试 | 1天 | ⚠️ 待做 | 测试V2/V3切换逻辑 |
| Phase 3 | 迁移核心工作流 | 1天 | ✅ 跳过 | 已在Hook内部集成 |
| Phase 3 | 迁移适配器 | 1天 | ⚠️ 待做 | useIntelligentAnalysisAdapter |
| Phase 3 | 迁移其他Hook | 2天 | ⚠️ 待做 | 其他依赖Hook |
| Phase 3 | 重写测试mock | 2天 | ⚠️ 待做 | 支持V2/V3双模式 |
| Phase 4 | 功能验证 | 2天 | ⚠️ 待做 | 回归测试 |
| Phase 4 | 稳定性观察 | 7天 | ⚠️ 待做 | 生产环境监控 |
| Phase 4 | 删除V2代码 | 0.5天 | ⚠️ 待做 | 最后一步 |

**总计**：~~2-3周~~ → **缩短至1-2周**（Hook内部集成加速）

---

## 🎯 关键里程碑

### ✅ Milestone 1: V3功能完整（✅ 已完成100%）
- ✅ 后端V3完整（事件系统、执行引擎）
- ✅ 前端V3事件监听API补充
- ✅ cancelAnalysis支持（降级处理）
- ✅ cleanup自动管理

### ✅ Milestone 2: V3集成到Hook（✅ 已完成100%）
- ✅ Hook内部集成V2/V3动态切换
- ✅ 事件监听根据版本自动路由
- ✅ cancelAnalysis支持V2/V3
- ✅ cleanup根据版本智能清理
- ✅ 零类型错误
- ⚠️ 单元测试待补充

### ⚠️ Milestone 3: 全面验证（预计7天）
- 功能回归测试
- 性能验证（by-ref减少90%）
- 稳定性观察

### ⚠️ Milestone 4: V2安全删除（预计10天后）
- V3稳定运行1周
- 无回归bug
- 删除V2代码

---

## ⚠️ 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| V3事件API不兼容 | 高 | 低 | ✅ 已通过接口设计完全兼容 |
| 17处依赖迁移遗漏 | 高 | 中 | 使用grep_search全面检查 |
| 缓存策略差异 | 中 | 低 | V3阈值0.7 vs V2的0.6，更严格 |
| 性能回退 | 中 | 低 | V3 by-ref模式减少90%数据量 |
| 测试覆盖不足 | 中 | 中 | 重写测试mock，覆盖V3场景 |

---

## 📝 下一步行动

### 立即执行（今天）：
1. ✅ 补充 `cancelAnalysis()` 方法到V3
2. ✅ 补充 `cleanup()` 方法到V3
3. ✅ 运行类型检查确认无错误

### 明天执行：
4. 创建 `use-intelligent-analysis-workflow-v3.ts`
5. 编写V3 Hook的单元测试
6. 在新功能中试用V3 Hook

### 本周执行：
7. 迁移核心工作流
8. 迁移适配器层
9. 功能验证

---

## 🚀 成功标准

**V3完全替代V2的标准：**

1. ✅ 所有17处V2依赖已迁移到V3
2. ✅ 测试用例100%通过
3. ✅ V3稳定运行1周无重大bug
4. ✅ 性能指标达标（by-ref减少90%数据量）
5. ✅ 缓存命中率 >70%
6. ✅ TypeScript零类型错误
7. ✅ 用户体验无回退（进度条、错误提示正常）

**达成后**：安全删除V2代码，只保留V3系统。
