# Plan 候选链回退机制 - 使用指南

## 🎯 概述

Plan 候选链回退机制是智能策略系统的核心组件，提供了从策略分析到执行的完整解决方案。

## 🏗️ 架构组件

### 核心类

1. **PlanGenerator**: 策略计划生成器
   - 本地验证策略候选
   - 构建候选链与回退机制
   - 轻量级断言系统

2. **StrategyPlanFactory**: 策略计划工厂
   - 统一的计划创建接口
   - 执行策略候选链
   - 错误处理和回退逻辑

3. **StrategyDecisionEngine** (增强): 智能决策引擎
   - 集成 Plan 系统
   - 端到端执行流程
   - 性能优化和调试支持

## 🚀 使用方式

### 方式1: 直接使用 Plan Factory

```typescript
import { getStrategyPlanFactory } from '@/modules/intelligent-strategy-system/plan';

// 创建工厂实例
const planFactory = getStrategyPlanFactory({
  maxCandidates: 5,
  performanceMode: 'fast',
  enableLocalValidation: true
});

// 从推荐创建计划
const plan = await planFactory.createPlanFromRecommendation(
  recommendation, 
  { deviceId: 'device123', xmlSnapshot: xmlContent }
);

// 执行计划
const result = await planFactory.executePlan(plan, { deviceId: 'device123' });
```

### 方式2: 通过决策引擎 (推荐)

```typescript
import { StrategyDecisionEngine } from '@/modules/intelligent-strategy-system/core';

// 创建引擎实例
const engine = new StrategyDecisionEngine({
  debugMode: true,
  performanceMode: 'balanced',
  enableLocalValidation: true
});

// 端到端执行：分析 + 计划 + 执行
const result = await engine.analyzeAndExecute(
  targetElement,
  xmlContent,
  deviceId
);

if (result.success) {
  console.log('执行成功，使用策略:', result.strategy);
  console.log('执行计划:', result.plan);
} else {
  console.log('执行失败:', result.error);
}
```

### 方式3: 分步骤执行

```typescript
// 1. 创建执行计划
const plan = await engine.createExecutionPlan(
  targetElement,
  xmlContent,
  deviceId
);

// 2. 检查计划详情
console.log('候选策略数量:', plan.candidates.length);
console.log('主要策略:', plan.candidates[0]?.strategy);
console.log('验证结果:', plan.localValidation.passed);

// 3. 执行计划
const executionResult = await engine.executePlan(plan, deviceId);
```

## 📋 Plan 数据结构

### StrategyPlan

```typescript
interface StrategyPlan {
  planId: string;                    // 计划唯一ID
  elementFingerprint: string;        // 元素指纹
  candidates: StrategyCandidate[];   // 候选策略列表（已排序）
  recommendedIndex: number;          // 推荐策略索引
  metadata: PlanMetadata;           // 计划元数据
  execution: ExecutionConfig;       // 执行配置
  localValidation: LocalValidationResult; // 本地验证结果
}
```

### 执行配置

```typescript
interface ExecutionConfig {
  allowBackendFallback: boolean;     // 是否允许后端回退
  timeBudgetMs?: number;            // 总时间预算
  perCandidateBudgetMs?: number;    // 每候选时间预算
  strictMode?: boolean;             // 严格模式
  performancePriority: 'speed' | 'accuracy' | 'balanced';
}
```

## 🔄 回退机制

### 候选链执行流程

1. **主策略执行**: 首先尝试推荐的主策略
2. **备选策略回退**: 主策略失败时，按优先级执行备选策略
3. **本地验证**: 每个候选在执行前进行本地验证
4. **时间预算控制**: 超时时中断执行链
5. **错误聚合**: 收集所有失败信息用于调试

### 验证与风险评估

```typescript
interface LocalValidationResult {
  passed: boolean;                   // 整体验证状态
  details: CandidateValidation[];    // 每个候选的验证详情
  validationTimeMs: number;          // 验证耗时
  warnings: string[];               // 验证警告
}

interface ValidationRisk {
  level: 'low' | 'medium' | 'high';  // 风险级别
  type: 'duplicate_match' | 'missing_attribute' | 'structural_change';
  message: string;                   // 风险描述
  suggestion?: string;               // 建议措施
}
```

## ⚡ 性能优化

### 配置选项

```typescript
const config: Partial<PlanGeneratorConfig> = {
  maxCandidates: 3,           // 限制候选数量
  performanceMode: 'fast',    // 性能优先级
  enableLocalValidation: true, // 本地验证开关
  enableAssertions: false     // 轻量级断言
};
```

### 执行监控

```typescript
// 启用调试模式
const engine = new StrategyDecisionEngine({ debugMode: true });

// 执行结果包含性能信息
const result = await engine.analyzeAndExecute(element, xml, deviceId);
console.log('计划创建:', result.plan?.metadata.statistics);
console.log('执行耗时:', result.executionResult?.logs);
```

## 🔧 与现有系统集成

### 与 useAdb() Hook 集成

```typescript
// 在组件中使用
function MyComponent() {
  const { matchElementByCriteria } = useAdb();
  
  const handleIntelligentMatch = async () => {
    const engine = new StrategyDecisionEngine();
    const result = await engine.analyzeAndExecute(
      selectedElement,
      xmlSnapshot,
      selectedDevice?.id
    );
    
    // 结果可以直接用于 UI 更新
    if (result.success) {
      // 策略执行成功
      updateStepCard(result.strategy);
    }
  };
}
```

### 与步骤构建器集成

```typescript
// 在步骤卡片中使用 Plan 结果
const stepCard = {
  action: 'click',
  parameters: {
    matching: {
      strategy: result.plan.candidates[0].strategy,
      fields: result.plan.candidates[0].criteria.fields,
      values: result.plan.candidates[0].criteria.values
    }
  },
  metadata: {
    planId: result.plan.planId,
    confidence: result.plan.metadata.statistics.totalCandidates
  }
};
```

## 🎯 最佳实践

1. **使用端到端方法**: 优先使用 `analyzeAndExecute()` 获得最佳体验
2. **启用本地验证**: 在生产环境中启用验证以提高稳定性
3. **合理设置时间预算**: 根据应用场景设置合适的超时时间
4. **监控执行结果**: 利用调试模式和日志进行性能调优
5. **处理失败情况**: 始终检查 `result.success` 并处理错误

## 🔄 升级路径

现有使用 `StrategyDecisionEngine.analyzeAndRecommend()` 的代码可以无缝升级：

```typescript
// 旧方式
const recommendation = await engine.analyzeAndRecommend(element, xml);

// 新方式（向后兼容）
const recommendation = await engine.analyzeAndRecommend(element, xml);
const plan = await engine.createExecutionPlan(element, xml, deviceId);
const result = await engine.executePlan(plan, deviceId);
```

## 📚 相关文档

- [智能策略系统架构](./ARCHITECTURE.md)
- [策略类型参考](./STRATEGY_TYPES.md)
- [故障排除指南](./TROUBLESHOOTING.md)

---

**注意**: Plan 系统现已完全集成到智能策略系统中，提供从分析到执行的端到端解决方案。所有现有接口保持向后兼容。