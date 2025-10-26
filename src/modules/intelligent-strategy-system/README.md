# Intelligent Strategy System (智能策略系统)

> **模块前缀**: `strategy-` / `Strategy`  
> **别名路径**: `@strategy`  
> **核心职责**: 智能元素识别和策略决策系统，提供多策略自动降级能力

---

## 📁 目录结构

```
src/modules/intelligent-strategy-system/
├── core/                      # 核心引擎
│   ├── StrategyDecisionEngine.ts    # 策略决策引擎
│   ├── ElementContextAnalyzer.ts    # 元素上下文分析器
│   ├── ConfidenceCalculator.ts      # 置信度计算器
│   └── ElementAnalyzer.ts           # 元素分析器
├── engines/                   # 策略引擎
│   └── EnhancedStrategyDecisionEngine.ts
├── analyzers/                 # 分析器集合
│   ├── BaseAnalyzer.ts
│   ├── TextAnalyzer.ts
│   ├── BoundsAnalyzer.ts
│   └── HierarchyAnalyzer.ts
├── validation/                # 验证系统
│   └── OfflineValidationSystem.ts
├── fallback/                  # 降级机制
│   └── ControlledFallbackMechanism.ts
├── optimization/              # 优化器
│   └── RegionLimitedSearchOptimizer.ts
├── scoring/                   # 评分系统
├── plan/                      # 执行计划
├── types/                     # 类型定义
├── utils/                     # 工具函数
├── i18n/                      # 国际化
└── index.ts                   # 模块门牌导出
```

---

## 🎯 核心功能

### 1. 策略决策引擎
- **多策略支持**: Smart Auto, Text-Only, Bounds-Only, XPath 等
- **智能降级**: 自动从高精度策略降级到低精度策略
- **置信度评估**: 实时计算每个策略的成功置信度

### 2. 元素分析系统
- **上下文分析**: 分析元素的上下文环境
- **特征提取**: 提取元素的关键特征
- **相似度计算**: 计算候选元素的相似度评分

### 3. 验证系统
- **离线验证**: 不依赖设备的元素验证
- **规则引擎**: 灵活的验证规则配置
- **结果评分**: 验证结果的置信度评分

### 4. 降级机制
- **自动降级**: 策略失败自动切换
- **降级顺序**: 可配置的降级优先级
- **降级记录**: 完整的降级路径追踪

---

## 📦 对外导出

```typescript
// 核心引擎
import {
  StrategyDecisionEngine,
  ElementContextAnalyzer,
  ConfidenceCalculator,
  ElementAnalyzer
} from '@strategy';

// 策略类型
import type {
  Strategy,
  StrategyType,
  StrategyResult,
  ElementDescriptor
} from '@strategy';

// 分析器
import {
  BaseAnalyzer,
  TextAnalyzer,
  BoundsAnalyzer
} from '@strategy';
```

---

## 🏗️ 架构设计

### 策略决策流程
```
元素描述 → 策略决策引擎 → 选择策略
                ↓
        执行策略 → 候选元素
                ↓
        置信度计算 → 最佳匹配
                ↓
        验证系统 → 最终结果
```

### 策略层次
```
Level 1: Smart Auto (最高精度)
    ├── Text + Bounds + Hierarchy
    └── 置信度 > 0.9
    
Level 2: Text-Only (中等精度)
    ├── Text 精确匹配
    └── 置信度 > 0.7
    
Level 3: Bounds-Only (基础精度)
    ├── 位置区域匹配
    └── 置信度 > 0.5
    
Level 4: XPath Fallback (保底)
    ├── XPath 直接匹配
    └── 置信度 > 0.3
```

---

## 🚀 使用示例

### 1. 基础使用

```typescript
import { StrategyDecisionEngine } from '@strategy';

// 创建决策引擎
const engine = new StrategyDecisionEngine({
  enableFallback: true,
  minConfidence: 0.7
});

// 执行策略决策
const element: ElementDescriptor = {
  nodeId: 'btn_submit',
  tagName: 'button',
  text: '提交',
  bounds: '100,200,200,50',
  xpath: '//button[@text="提交"]'
};

const result = await engine.decide(element, currentPage);

console.log('选择的策略:', result.strategy);
console.log('置信度:', result.confidence);
console.log('匹配元素:', result.element);
```

### 2. 自定义策略配置

```typescript
const customConfig = {
  strategies: [
    { type: 'smart-auto', weight: 1.0, enabled: true },
    { type: 'text-only', weight: 0.8, enabled: true },
    { type: 'bounds-only', weight: 0.6, enabled: false },
    { type: 'xpath', weight: 0.4, enabled: true }
  ],
  fallbackOrder: ['smart-auto', 'text-only', 'xpath'],
  minConfidenceByStrategy: {
    'smart-auto': 0.9,
    'text-only': 0.7,
    'xpath': 0.5
  }
};

const engine = new StrategyDecisionEngine(customConfig);
```

### 3. 使用元素分析器

```typescript
import { ElementAnalyzer } from '@strategy';

const analyzer = new ElementAnalyzer();

// 分析元素特征
const analysis = analyzer.analyze(element);

console.log('文本特征:', analysis.textFeatures);
console.log('位置特征:', analysis.boundsFeatures);
console.log('层级特征:', analysis.hierarchyFeatures);
```

### 4. 置信度计算

```typescript
import { ConfidenceCalculator } from '@strategy';

const calculator = new ConfidenceCalculator();

const confidence = calculator.calculate({
  targetElement: element,
  candidate: candidateElement,
  strategy: 'smart-auto',
  context: pageContext
});

console.log('匹配置信度:', confidence.total);
console.log('详细得分:', confidence.breakdown);
```

---

## 🔧 策略类型

### Smart Auto Strategy (智能自动策略)
**优先级**: 最高  
**特点**: 综合文本、位置、层级信息  
**适用场景**: 元素信息完整的情况

```typescript
{
  type: 'smart-auto',
  weights: {
    text: 0.4,
    bounds: 0.3,
    hierarchy: 0.3
  }
}
```

### Text-Only Strategy (纯文本策略)
**优先级**: 高  
**特点**: 仅基于文本匹配  
**适用场景**: 文本具有唯一性

```typescript
{
  type: 'text-only',
  options: {
    exactMatch: true,
    caseSensitive: false,
    trimWhitespace: true
  }
}
```

### Bounds-Only Strategy (纯位置策略)
**优先级**: 中  
**特点**: 仅基于位置区域  
**适用场景**: 位置固定的元素

```typescript
{
  type: 'bounds-only',
  options: {
    tolerance: 10, // 像素容差
    relativePosition: true
  }
}
```

### XPath Strategy (XPath 策略)
**优先级**: 低（保底）  
**特点**: 直接使用 XPath 匹配  
**适用场景**: 其他策略失败时的保底方案

```typescript
{
  type: 'xpath',
  options: {
    strict: false,
    timeout: 5000
  }
}
```

---

## 📊 性能优化

### 1. 区域限定搜索
```typescript
import { RegionLimitedSearchOptimizer } from '@strategy';

const optimizer = new RegionLimitedSearchOptimizer({
  searchRadius: 100, // 只搜索半径100像素内
  expandOnFail: true // 失败时扩大搜索范围
});
```

### 2. 缓存机制
```typescript
// 缓存分析结果
const cache = new Map<string, AnalysisResult>();

function analyzeWithCache(element: ElementDescriptor) {
  const key = generateElementKey(element);
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = analyzer.analyze(element);
  cache.set(key, result);
  return result;
}
```

### 3. 并行分析
```typescript
// 并行执行多个策略
const results = await Promise.all([
  engine.tryStrategy('smart-auto', element),
  engine.tryStrategy('text-only', element),
  engine.tryStrategy('bounds-only', element)
]);

// 选择置信度最高的结果
const best = results.reduce((a, b) => 
  a.confidence > b.confidence ? a : b
);
```

---

## 🧪 测试

```bash
# 运行所有测试
npm test intelligent-strategy-system

# 测试决策引擎
npm test strategy-decision-engine

# 测试分析器
npm test analyzers

# 集成测试
npm test integration.test.ts
```

---

## 🔍 调试

### 开启调试日志
```typescript
const engine = new StrategyDecisionEngine({
  debug: true,
  logLevel: 'verbose'
});
```

### 策略决策可视化
```typescript
// 获取决策详情
const decision = await engine.decideWithDetails(element);

console.log('尝试的策略:', decision.triedStrategies);
console.log('降级路径:', decision.fallbackPath);
console.log('每个策略的得分:', decision.scoreBreakdown);
```

---

## 📚 相关文档

- [策略系统设计](../../../docs/architecture/strategy-system.md)
- [置信度计算算法](../../../docs/algorithms/confidence-calculation.md)
- [元素分析原理](../../../docs/algorithms/element-analysis.md)

---

## 🤝 贡献

### 添加新策略
1. 在 `types/StrategyTypes.ts` 定义策略类型
2. 创建策略实现类
3. 在决策引擎中注册策略
4. 添加单元测试
5. 更新文档

### 添加新分析器
1. 继承 `BaseAnalyzer`
2. 实现 `analyze` 方法
3. 在 `analyzers/index.ts` 导出
4. 编写测试用例

---

## ⚠️ 注意事项

1. **置信度阈值**: 根据实际场景调整最小置信度
2. **降级顺序**: 合理配置降级策略顺序
3. **性能影响**: Smart Auto 策略计算开销较大
4. **缓存管理**: 注意缓存失效和内存占用

---

**最后更新**: 2025-10-26  
**维护者**: @团队  
**版本**: 3.0.0
