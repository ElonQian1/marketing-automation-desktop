# 策略评分系统设计（MVP）

## 🎯 核心目标
为每个匹配策略计算 0~1 的置信度分数，确保：
1. **高分策略优先**：≥0.8 可作主策略
2. **低分策略拦截**：<0.6 拒绝使用
3. **可追溯**：分数包含子维度详情

---

## 📊 评分公式

```typescript
Score = w1·Uniqueness + w2·Stability + w3·Robustness

默认权重:
w1 = 0.5  // 唯一性（最重要）
w2 = 0.3  // 稳定性（跨快照）
w3 = 0.2  // 鲁棒性（容错能力）
```

---

## 🔬 三大维度算法

### 1. Uniqueness（唯一性）- 0~1
**定义**: 当前快照中,该策略能唯一定位到目标节点的概率

**算法**:
```typescript
function calculateUniqueness(
  strategy: Strategy,
  snapshot: Snapshot
): number {
  const matches = executeMatch(strategy, snapshot.nodes);
  
  if (matches.length === 0) return 0;        // 匹配失败
  if (matches.length === 1) return 1.0;      // 完美唯一
  
  // 多匹配：根据相似度降权
  const targetSimilarity = calculateSimilarity(matches[0], strategy.originalNode);
  const othersSimilarity = matches.slice(1).map(n => calculateSimilarity(n, strategy.originalNode));
  const maxOtherSimilarity = Math.max(...othersSimilarity);
  
  // 目标与次优相似度差距越大，唯一性越高
  const gap = targetSimilarity - maxOtherSimilarity;
  return Math.max(0, Math.min(1, gap / 0.5)); // 差距 ≥0.5 时达到满分
}
```

**示例**:
```typescript
// 场景1：resource-id 唯一
strategy = { resourceId: "com.app:id/login_btn" }
matches = [loginButton]
uniqueness = 1.0

// 场景2：class 不唯一（10个Button）
strategy = { class: "Button" }
matches = [btn1, btn2, ..., btn10]
targetSimilarity = 0.9 (text匹配)
maxOtherSimilarity = 0.3
gap = 0.6
uniqueness = 1.0

// 场景3：兄弟策略模糊
strategy = { sibling: "TextView[text='用户名']", relation: "next" }
matches = [inputField1, inputField2] (两个输入框都在"用户名"后)
uniqueness = 0.0~0.5 (根据gap)
```

---

### 2. Stability（稳定性）- 0~1
**定义**: 该策略在多个历史快照中命中同一元素的一致性

**算法**:
```typescript
function calculateStability(
  strategy: Strategy,
  snapshots: Snapshot[]  // 最近3~5个快照
): number {
  if (snapshots.length < 2) return 0.8; // 无历史数据，默认中等分
  
  let successCount = 0;
  let totalAttempts = snapshots.length;
  
  for (const snapshot of snapshots) {
    const matches = executeMatch(strategy, snapshot.nodes);
    
    if (matches.length === 1) {
      // 检查是否为"等效节点"（bounds/text可能变，但语义不变）
      if (isSameLogicalElement(matches[0], strategy.originalNode)) {
        successCount++;
      }
    }
  }
  
  return successCount / totalAttempts;
}
```

**示例**:
```typescript
// 场景1：resource-id 跨版本稳定
snapshots = [v1, v1.1, v1.2]
strategy = { resourceId: "login_btn" }
命中率 = 3/3 = 1.0

// 场景2：text 变化（"登录" → "立即登录"）
strategy = { text: "登录" }
命中率 = 1/3 = 0.33

// 场景3：邻域策略依赖布局
strategy = { sibling: "TextView[0]", relation: "below" }
命中率 = 2/3 = 0.67 (有一个快照布局改变)
```

---

### 3. Robustness（鲁棒性）- 0~1
**定义**: 策略对环境变化（分辨率/DPI/旋转/主题）的容错能力

**算法**:
```typescript
function calculateRobustness(strategy: Strategy): number {
  let score = 1.0;
  
  // ❌ 使用 index → 扣 0.4
  if (strategy.matchers.some(m => m.type === 'index')) {
    score -= 0.4;
  }
  
  // ❌ 使用 bounds 绝对坐标 → 扣 0.3
  if (strategy.matchers.some(m => m.type === 'bounds' && !m.relative)) {
    score -= 0.3;
  }
  
  // ❌ 依赖 text 精确匹配（非模糊/正则） → 扣 0.2
  if (strategy.matchers.some(m => m.type === 'text' && !m.fuzzy)) {
    score -= 0.2;
  }
  
  // ✅ 有 resource-id → 加 0.2
  if (strategy.matchers.some(m => m.type === 'resourceId')) {
    score += 0.2;
  }
  
  // ✅ 有 content-desc → 加 0.1
  if (strategy.matchers.some(m => m.type === 'contentDesc')) {
    score += 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}
```

**示例**:
```typescript
// 场景1：纯 resource-id
strategy = { resourceId: "btn_login" }
robustness = 1.0 + 0.2 = 1.0 (截断)

// 场景2：index + class
strategy = { class: "Button", index: 3 }
robustness = 1.0 - 0.4 = 0.6

// 场景3：text 精确匹配
strategy = { text: "登录" }
robustness = 1.0 - 0.2 = 0.8

// 场景4：bounds + index
strategy = { bounds: "[100,200][200,300]", index: 5 }
robustness = 1.0 - 0.3 - 0.4 = 0.3
```

---

## 🚦 阈值规则

```typescript
export const SCORE_THRESHOLDS = {
  PRIMARY_MIN: 0.8,      // 主策略最低分
  BACKUP_MIN: 0.6,       // 备选策略最低分
  REJECT_BELOW: 0.6,     // 低于此分数拒绝
  REVIEW_REQUIRED: 0.7   // 0.6~0.7 标记"需审查"
};

export function classifyStrategy(score: number): StrategyClass {
  if (score >= SCORE_THRESHOLDS.PRIMARY_MIN) {
    return { type: 'primary', confidence: 'high' };
  }
  if (score >= SCORE_THRESHOLDS.REVIEW_REQUIRED) {
    return { type: 'backup', confidence: 'medium', requiresReview: true };
  }
  if (score >= SCORE_THRESHOLDS.BACKUP_MIN) {
    return { type: 'backup', confidence: 'low' };
  }
  return { type: 'rejected', reason: '分数低于阈值' };
}
```

---

## 🎨 UI 展示

### 策略卡片
```tsx
<StrategyCard>
  <Badge color={getScoreColor(score)}>
    {(score * 100).toFixed(0)}%
  </Badge>
  
  <Tooltip>
    <div>唯一性: {uniqueness.toFixed(2)}</div>
    <div>稳定性: {stability.toFixed(2)}</div>
    <div>鲁棒性: {robustness.toFixed(2)}</div>
    <div>综合分: {score.toFixed(2)}</div>
  </Tooltip>
  
  {score < 0.7 && (
    <Alert type="warning">
      ⚠️ 低置信度策略，建议人工审查
    </Alert>
  )}
</StrategyCard>
```

### 颜色规则
```typescript
function getScoreColor(score: number): string {
  if (score >= 0.8) return 'green';      // 高置信度
  if (score >= 0.7) return 'orange';     // 中置信度（需审查）
  if (score >= 0.6) return 'red';        // 低置信度（仅备选）
  return 'gray';                         // 拒绝使用
}
```

---

## 📝 实现清单

### Phase 1: 核心算法
- [ ] `src/strategies/score/uniqueness.ts`
- [ ] `src/strategies/score/stability.ts`
- [ ] `src/strategies/score/robustness.ts`
- [ ] `src/strategies/score/composite.ts`
- [ ] 单元测试覆盖率 ≥80%

### Phase 2: 阈值与分类
- [ ] `src/strategies/threshold.ts`
- [ ] `src/strategies/classifier.ts`
- [ ] 集成测试：10个真实场景

### Phase 3: UI 集成
- [ ] `StrategyScoreCard.tsx`
- [ ] `StrategyComparison.tsx`（对比多个策略）
- [ ] `ScoreExplainer.tsx`（详细说明子维度）

---

## 🧪 测试用例

```typescript
describe('Strategy Scoring', () => {
  it('纯 resource-id 应得满分', () => {
    const strategy = { resourceId: 'btn_login' };
    const score = calculateScore(strategy, [snapshot1, snapshot2]);
    expect(score).toBeGreaterThan(0.95);
  });
  
  it('仅 index 匹配应低于 0.6', () => {
    const strategy = { index: 3 };
    const score = calculateScore(strategy, [snapshot1]);
    expect(score).toBeLessThan(0.6);
  });
  
  it('邻域策略多匹配应降权', () => {
    const strategy = { sibling: 'TextView', relation: 'next' };
    const score = calculateScore(strategy, [snapshotWithDuplicates]);
    expect(score).toBeLessThan(0.7);
  });
});
```

---

**创建时间**: 2025-10-17  
**版本**: MVP v1.0  
**参考**: 用户架构分析 + ARCHITECTURE_REFACTOR_PLAN.md
