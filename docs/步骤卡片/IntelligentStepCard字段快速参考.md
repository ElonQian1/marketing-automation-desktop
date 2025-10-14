# IntelligentStepCard 字段快速参考

> **最后更新**: 2024-01-XX  
> **类型文件**: `src/modules/universal-ui/types/intelligent-analysis-types.ts`

---

## 🔥 最常用字段（Top 10）

| 字段                 | 类型                  | 说明                               | 必填 |
| -------------------- | --------------------- | ---------------------------------- | ---- |
| `stepId`             | `string`              | 步骤唯一ID                         | ✅   |
| `stepName`           | `string`              | 步骤名称                           | ✅   |
| `analysisState`      | `StepAnalysisState`   | 分析状态（7种状态）                | ✅   |
| `analysisProgress`   | `number`              | 分析进度（0-100）                  | ✅   |
| `strategyMode`       | `StrategyMode`        | 策略模式（3种）                    | ✅   |
| `smartCandidates`    | `StrategyCandidate[]` | 智能候选策略                       | ✅   |
| `fallbackStrategy`   | `StrategyCandidate`   | 兜底策略                           | ✅   |
| `activeStrategy`     | `StrategyCandidate?`  | 当前激活策略                       | ❌   |
| `isFallbackActive`   | `boolean?`            | **是否使用兜底**（驱动徽标显示）   | ❌   |
| `canUpgrade`         | `boolean?`            | **是否可升级**（显示升级按钮）     | ❌   |

---

## 📊 字段分组速查

### 🟢 基础信息（3 字段）
```typescript
stepId: string;         // 唯一ID
stepName: string;       // 显示名称
stepType: string;       // 类型（如 "点击"、"输入"）
```

### 🔵 分析状态（7 字段）
```typescript
analysisState: StepAnalysisState;  // idle | analyzing | completed | failed...
analysisJobId?: string;            // 后端任务ID
analysisProgress: number;          // 0-100
analysisError?: string;            // 错误信息
estimatedTimeLeft?: number;        // ETA（毫秒）
pendingAnalysis?: boolean;         // 兼容：等待分析
isAnalyzing?: boolean;             // 兼容：正在分析
```

**状态枚举**：
- `idle` - 初始状态
- `pending_analysis` - 等待分析
- `analyzing` - 分析中
- `analysis_completed` - 分析完成
- `analysis_failed` - 分析失败
- `analysis_stale` - 结果过期
- `upgrade_available` - 可升级

### 🟣 策略信息（7 字段）
```typescript
strategyMode: StrategyMode;               // intelligent | smart_variant | static_user
smartCandidates: StrategyCandidate[];     // Step1-6 智能策略
staticCandidates: StrategyCandidate[];    // 用户自建策略
activeStrategy?: StrategyCandidate;       // 当前生效
recommendedStrategy?: StrategyCandidate;  // 推荐策略
fallbackStrategy: StrategyCandidate;      // 兜底策略（必需）
```

### 🟡 UI 状态（3 字段 - 新增）
```typescript
isFallbackActive?: boolean;    // 是否使用兜底（橙色徽标）
canUpgrade?: boolean;          // 是否可升级（显示按钮）
showUpgradeButton?: boolean;   // UI 控制升级按钮
```

### 🟠 配置开关（6 字段）
```typescript
autoFollowSmart: boolean;         // 自动跟随智能推荐
lockContainer: boolean;           // 锁定容器
smartThreshold: number;           // 置信度阈值（0.82）
allowBackendFallback?: boolean;   // 允许后端回退（新增）
candidateTimeoutMs?: number;      // 单次超时（新增）
totalBudgetMs?: number;           // 总预算（新增）
```

### ⏰ 时间戳（3 字段）
```typescript
createdAt: number;    // 创建时间
analyzedAt?: number;  // 分析完成时间
updatedAt: number;    // 最后更新时间
```

### 📜 执行历史（2 字段 - 新增）
```typescript
lastExecutionResult?: StepExecutionResult;  // 最近执行结果
executionHistory?: StepExecutionResult[];   // 历史记录（最多10条）
```

---

## 🎯 常见使用场景

### ✅ 场景 1：判断是否显示"暂用兜底"徽标

```typescript
function shouldShowFallbackBadge(card: IntelligentStepCard): boolean {
  // 方法 1：使用新增字段（推荐）
  return card.isFallbackActive === true;
  
  // 方法 2：手动计算
  return card.activeStrategy?.key === card.fallbackStrategy.key;
}
```

### ✅ 场景 2：判断是否可以升级

```typescript
function canUpgradeToSmart(card: IntelligentStepCard): boolean {
  // 方法 1：使用新增字段（推荐）
  if (card.canUpgrade !== undefined) {
    return card.canUpgrade;
  }
  
  // 方法 2：手动计算
  return !!(
    card.recommendedStrategy &&
    card.recommendedStrategy.confidence >= card.smartThreshold &&
    card.activeStrategy?.key !== card.recommendedStrategy.key
  );
}
```

### ✅ 场景 3：显示分析进度

```tsx
function AnalysisProgress({ card }: { card: IntelligentStepCard }) {
  const isAnalyzing = card.analysisState === 'analyzing';
  const progress = card.analysisProgress;
  const eta = card.estimatedTimeLeft;
  
  if (!isAnalyzing) return null;
  
  return (
    <div>
      <Progress percent={progress} />
      {eta && <span>预计 {Math.round(eta / 1000)}s</span>}
    </div>
  );
}
```

### ✅ 场景 4：显示策略候选列表

```tsx
<UniversalStrategyCandidatesSection
  candidates={card.smartCandidates}
  activeStrategy={card.activeStrategy}
  recommendedStrategy={card.recommendedStrategy}
  onApply={(candidate) => handleApplyStrategy(card.stepId, candidate)}
/>
```

### ✅ 场景 5：切换策略模式

```tsx
<UniversalStrategyModeSelector
  currentMode={card.strategyMode}
  onChange={(mode) => updateStrategyMode(card.stepId, mode)}
  disabled={card.analysisState === 'analyzing'}
/>
```

---

## 🔢 字段统计

| 分类       | 必填字段 | 可选字段 | 总计 |
| ---------- | -------- | -------- | ---- |
| 基础信息   | 3        | 0        | 3    |
| 元素上下文 | 2        | 0        | 2    |
| 分析状态   | 2        | 5        | 7    |
| 策略信息   | 4        | 3        | 7    |
| UI 状态    | 0        | 3        | 3    |
| 配置开关   | 3        | 3        | 6    |
| 时间戳     | 2        | 1        | 3    |
| 执行历史   | 0        | 2        | 2    |
| **总计**   | **16**   | **17**   | **33** |

---

## 🚀 新增字段迁移路径

### 阶段 1：UI 状态字段（立即使用）

1. 在 `StepCardSystem` 中计算并设置：
   ```typescript
   card.isFallbackActive = card.activeStrategy?.key === card.fallbackStrategy.key;
   card.canUpgrade = shouldShowUpgrade(card);
   card.showUpgradeButton = card.canUpgrade && !card.isAnalyzing;
   ```

2. 在组件中直接使用：
   ```tsx
   <UniversalFallbackBadge isFallbackActive={card.isFallbackActive} />
   ```

### 阶段 2：执行配置（1-2 天）

1. 配置默认值：
   ```typescript
   const DEFAULT_CONFIG = {
     allowBackendFallback: true,
     candidateTimeoutMs: 3000,
     totalBudgetMs: 10000,
   };
   ```

2. 在执行引擎中使用：
   ```typescript
   await executeWithTimeout(
     card.activeStrategy,
     card.candidateTimeoutMs || DEFAULT_CONFIG.candidateTimeoutMs
   );
   ```

### 阶段 3：执行历史（1 周）

1. 记录执行结果：
   ```typescript
   card.lastExecutionResult = {
     executionId: uuid(),
     success: true,
     executedAt: Date.now(),
     duration: 1234,
     strategy: card.activeStrategy.name,
     strategyType: 'smart',
   };
   ```

2. 构建历史记录：
   ```typescript
   card.executionHistory = [
     card.lastExecutionResult,
     ...(card.executionHistory || []).slice(0, 9), // 保留最近10条
   ];
   ```

---

## 📝 备注

- **所有新增字段都是可选的**，不会破坏现有代码
- **建议优先使用新增字段**（如 `isFallbackActive`），而不是手动计算
- **执行历史建议最多保留 10 条**，避免数据膨胀
- **时间戳统一使用毫秒**（`Date.now()` 格式）

---

## 🔗 相关文档

- [状态字段补齐报告](./状态字段补齐报告.md)
- [快速使用指南](./快速使用指南.md)
- [缺失功能补充完成报告](./步骤卡片缺失功能补充完成报告.md)
