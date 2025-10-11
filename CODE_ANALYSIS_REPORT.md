## 📊 代码分散分析报告

### 当前三个模块的职责重叠

| 模块 | 主要职责 | 重叠功能 | 问题 |
|------|----------|----------|------|
| **ElementFieldAnalyzer.ts** | 字段信息定义、基础分析 | 元素属性解析、字段置信度 | 过于基础，缺乏智能决策 |
| **SmartConditionGenerator.ts** | 智能匹配条件生成 | 元素属性解析、层级分析、置信度计算 | 与策略决策重叠，但不够完整 |
| **StrategyDecisionEngine.ts** | Step 0-6 完整决策流程 | 元素分析、策略评估 | 最完整，但与前两者有重复 |

### 重叠功能详细对比

#### 1. 元素属性解析
```typescript
// ElementFieldAnalyzer.ts - 基础版本
private fieldDefinitions: Record<string, ElementFieldInfo> = {
  'resource-id': { confidence: 0.95 },
  'text': { confidence: 0.85 },
  // ...
}

// SmartConditionGenerator.ts - 增强版本  
const fieldPriority: Record<string, number> = {
  'resource-id': 0.95,
  'content-desc': 0.90,
  'text': 0.85,
  // ...
}

// StrategyDecisionEngine.ts - 最完整版本
// 通过各种分析器处理元素属性
```

#### 2. 置信度计算
```typescript
// ElementFieldAnalyzer.ts - 简单规则
recommendMatchingStrategy(element): { strategy, reason, fields }

// SmartConditionGenerator.ts - 考虑层级
calculateFieldConfidence(fieldName, value, level, allAttributes): number

// StrategyDecisionEngine.ts - 复杂决策
ConfidenceCalculator + Step 0-6 流程
```

#### 3. 策略推荐
```typescript
// ElementFieldAnalyzer.ts - 基础推荐
return { strategy: 'traditional' | 'context-aware' | 'hybrid' }

// SmartConditionGenerator.ts - 条件生成
return SmartMatchingConditions (strategy + fields + values)

// StrategyDecisionEngine.ts - 完整推荐
return StrategyRecommendation (strategy + confidence + reason + plan)
```

### 根本问题

1. **职责边界模糊**: 三个模块都在解决"如何分析元素"，但没有清晰的分工
2. **数据结构不一致**: 输入输出格式各异，难以组合使用
3. **功能重复实现**: 相同的元素属性解析逻辑被写了三遍
4. **难以维护**: 修改元素分析逻辑需要改三个地方
