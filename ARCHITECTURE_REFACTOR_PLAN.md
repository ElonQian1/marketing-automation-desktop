# 架构重构行动计划

## 📋 背景
基于用户的深度分析，当前系统存在三大核心问题：
1. **事件流不闭环**：进度/完成事件未强制落store，导致"60%卡住"
2. **脚本散落**：分析/诊断/验证工具分散在根目录，难以测试和复用
3. **策略缺少评分**：兄弟/邻域策略无唯一性阈值，稳定性无法保证

---

## 🎯 第一阶段：紧急修复（今天完成）

### ✅ 任务 1：完成事件闭环
**文件**: `src/modules/universal-ui/hooks/use-intelligent-analysis-workflow.ts`  
**位置**: 第 110 行（unlistenProgress 之后，unlistenError 之前）  
**操作**: 插入以下代码

```typescript
// 分析完成事件 - ✅ 使用 jobId 精确匹配 + 强制结束 Loading
const unlistenDone = await intelligentAnalysisBackend.listenToAnalysisComplete((jobId, result) => {
  console.log('✅ [Workflow] 收到分析完成', { jobId, result });
  
  setCurrentJobs(prev => {
    const updated = new Map(prev);
    const job = updated.get(jobId);
    
    if (!job) {
      console.warn('⚠️ [Workflow] 收到未知任务的完成事件，尝试懒绑定', { jobId });
      const orphanCard = Array.from(stepCards).find(
        c => (c.analysisState === 'analyzing' || c.analysisState === 'idle') && !c.analysisJobId
      );
      
      if (orphanCard) {
        console.log('🔗 [Workflow] 懒绑定孤立完成事件到步骤', { jobId, stepId: orphanCard.stepId });
        updated.set(jobId, {
          jobId,
          stepId: orphanCard.stepId,
          selectionHash: result.selectionHash,
          state: 'completed',
          progress: 100,
          completedAt: Date.now(),
          result,
          startedAt: Date.now()
        });
      }
    } else {
      updated.set(jobId, {
        ...job,
        state: 'completed',
        progress: 100,
        completedAt: Date.now(),
        result
      });
      console.log('🔗 [Workflow] 更新任务状态为已完成', { jobId, stepId: job.stepId });
    }
    
    return updated;
  });
  
  setStepCards(prevCards => {
    return prevCards.map(card => {
      if (card.analysisJobId === jobId) {
        console.log('🎯 [Workflow] 更新步骤卡片为完成状态', { stepId: card.stepId, jobId });
        return {
          ...card,
          analysisState: 'analysis_completed',
          analysisProgress: 100,
          analysisJobId: undefined,
          smartCandidates: result.smartCandidates,
          staticCandidates: result.staticCandidates,
          recommendedStrategy: result.smartCandidates.find(c => c.key === result.recommendedKey),
          analyzedAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      return card;
    });
  });
});
```

**验证**: 搜索文件应能找到 `const unlistenDone`

---

## 🏗️ 第二阶段：模块化重构（本周）

### A. 创建核心模块目录结构

```bash
mkdir -p src/analysis src/strategies src/stepcard/executor src/diagnostics
```

### B. 迁移现有脚本

#### 1. XML 解析与索引 → `src/analysis/`
**源文件**:
- `analyze_xml_structure.js`
- `final_hierarchy_analysis.cjs`
- `analyze_element_hierarchy.cjs`

**目标**:
```
src/analysis/
  parseXml.ts          # XML → AST
  buildIndex.ts        # 构建 id/parent/sibling 索引
  occlusion.ts         # 遮挡判定算法
  types.ts             # NodeMeta, Bounds, SnapshotMeta
  __tests__/           # 单元测试
```

#### 2. 诊断工具 → `src/diagnostics/`
**源文件**:
- `diagnose_element_mapping.mjs`
- `verify_hierarchy_fix.mjs`
- `debug_clickable_elements.cjs`
- `strategy-display-test.html`

**目标**:
```
src/diagnostics/
  uniquenessChecker.ts    # 唯一性冲突检测
  stabilityTester.ts      # 跨快照稳定性测试
  occlusionReport.ts      # 遮挡报告生成
  DiagnosticsPanel.tsx    # 统一诊断 UI
```

#### 3. 策略评分系统 → `src/strategies/`
**新建文件**:
```
src/strategies/
  score.ts              # 评分算法
    - uniqueness(node): 0~1  (唯一性)
    - stability(snapshots): 0~1 (跨快照稳定性)
    - consistency(history): 0~1 (历史一致性)
    - composite(weights): 综合分数
  
  threshold.ts          # 阈值规则
    - PRIMARY_MIN = 0.8
    - BACKUP_MIN = 0.6
    - REVIEW_THRESHOLD = 0.6
  
  degrade.ts            # 降级链路
    - selectPrimary(candidates): 选主策略
    - buildBackups(candidates): 构建备选链
    - fallbackChain(node): 生成完整降级路径
```

---

## 🔒 第三阶段：硬性约束（下周）

### 1. 策略生成规则强制执行

**文件**: `src/strategies/standard.ts`

```typescript
export function generateStandardStrategy(node: NodeMeta): Strategy {
  // ❌ 硬性排除：index 和 bounds 不得作为默认匹配条件
  const excludeKeys = ['index', 'bounds', 'x', 'y', 'width', 'height'];
  
  const attributes = Object.entries(node.attributes)
    .filter(([key]) => !excludeKeys.includes(key))
    .filter(([_, value]) => value && value.length > 0);
  
  return {
    type: 'standard',
    matchers: buildMatchers(attributes),
    score: calculateScore(node),
    metadata: { excludedKeys }
  };
}
```

### 2. 兄弟/邻域策略准入门槛

**文件**: `src/strategies/neighbor.ts`

```typescript
export function generateNeighborStrategy(node: NodeMeta, context: AnalysisContext): Strategy | null {
  const candidates = findNeighbors(node, context);
  const score = calculateUniqueness(candidates);
  
  // ✅ 硬性门槛：唯一性低于 0.7 拒绝生成
  if (score < 0.7) {
    console.warn(`🚫 邻域策略唯一性不足: ${score.toFixed(2)}, 已拒绝`);
    return null;
  }
  
  // ⚠️ 0.7~0.8 允许但标记为"需审查"
  if (score < 0.8) {
    return {
      type: 'neighbor',
      matchers: candidates,
      score,
      confidence: 'low',
      requiresReview: true
    };
  }
  
  return { type: 'neighbor', matchers: candidates, score, confidence: 'high' };
}
```

### 3. 步骤卡片状态机

**文件**: `src/stepcard/model.ts`

```typescript
type StepCardState = 
  | 'draft'           // 初始创建，未开始分析
  | 'analyzing'       // 分析中（有 jobId）
  | 'analysis_failed' // 分析失败
  | 'needs_review'    // 无高置信度策略，需人工审查
  | 'ready'           // 就绪，可执行
  | 'running'         // 执行中
  | 'success'         // 执行成功
  | 'failed';         // 执行失败

// ✅ 状态转换规则（幂等 + 单向）
const ALLOWED_TRANSITIONS: Record<StepCardState, StepCardState[]> = {
  'draft': ['analyzing'],
  'analyzing': ['ready', 'needs_review', 'analysis_failed'],
  'analysis_failed': ['analyzing'],  // 允许重试
  'needs_review': ['ready'],         // 人工确认后
  'ready': ['running'],
  'running': ['success', 'failed'],
  'success': [],                     // 终态
  'failed': ['running']              // 允许重试
};

export function transitionState(
  currentState: StepCardState,
  targetState: StepCardState
): { allowed: boolean; reason?: string } {
  const allowed = ALLOWED_TRANSITIONS[currentState]?.includes(targetState);
  
  if (!allowed) {
    return {
      allowed: false,
      reason: `非法转换: ${currentState} → ${targetState}`
    };
  }
  
  return { allowed: true };
}
```

---

## 📊 验收标准（Done Definition）

### 第一阶段验收
- [ ] `unlistenDone` 定义存在且编译通过
- [ ] 创建步骤 → 60% → **100% 完成状态**（不卡住）
- [ ] Console 日志完整：BackendService 完成事件 + Workflow 更新卡片

### 第二阶段验收
- [ ] `src/analysis/`, `src/strategies/`, `src/diagnostics/` 目录存在
- [ ] 至少 3 个模块有 TypeScript 类型定义 + 单元测试
- [ ] 根目录脚本减少 50%（迁移到 `src/` 或 `tools/`）

### 第三阶段验收
- [ ] 策略生成器拒绝使用 `index`/`bounds` 作为默认匹配
- [ ] 邻域策略 uniqueness < 0.7 时自动拒绝
- [ ] 步骤卡片状态转换非法时抛出错误并记录日志

---

## 🚀 立即行动清单

**今天（优先级 P0）**:
1. 手动修复 `use-intelligent-analysis-workflow.ts` 插入 `unlistenDone`
2. 运行应用验证完成事件闭环
3. 提交修复并标记为 `fix: 完成事件精确匹配 + 懒绑定`

**明天（优先级 P1）**:
1. 创建 `src/analysis/types.ts` 定义核心类型
2. 迁移 `analyze_xml_structure.js` → `src/analysis/parseXml.ts`
3. 创建 `src/strategies/score.ts` 评分算法骨架

**本周（优先级 P2）**:
1. 完成诊断工具统一入口 `DiagnosticsPanel.tsx`
2. 实现策略评分与阈值规则
3. 添加步骤卡片状态机与非法转换检查

---

## 📚 参考文档
- 用户架构分析（本次对话）
- `STEP_CARD_REFACTOR_COMPLETED.md`
- `xml-capture-fix-summary.md`
- `WORKFLOW_FIX_MANUAL.md`

---

**创建时间**: 2025-10-17  
**负责人**: AI Agent + 用户协作  
**预计完成**: 第一阶段（今天），第二/三阶段（2周内）
