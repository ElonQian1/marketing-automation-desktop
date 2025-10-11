// src/modules/intelligent-strategy-system/scoring/StabilityAssessment.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * StabilityAssessment.ts - 向后兼容包装器
 * 
 * @description 这是原 StabilityAssessment.ts 的兼容性包装器
 * 实际功能已拆分到 stability-assessment/ 模块中
 * 
 * @deprecated 请直接使用 stability-assessment/ 模块中的组件
 */

// 重新导出所有接口以保持兼容性
export * from './stability-assessment';

// 默认导出保持兼容
export { StabilityAssessmentEvaluator as default } from './stability-assessment';

// === 兼容性说明 ===
/*
原 StabilityAssessment.ts (949行) 已成功模块化为：

├── stability-assessment/
│   ├── core/
│   │   └── StabilityAssessmentEngine.ts     # 主评估引擎 (200+ 行)
│   ├── strategies/
│   │   ├── DeviceCompatibilityAnalyzer.ts  # 设备兼容性分析 (160+ 行)
│   │   └── ResolutionAdaptabilityAnalyzer.ts # 分辨率适应性分析 (200+ 行)
│   ├── calculators/
│   │   └── StabilityScoreCalculator.ts     # 分数计算 (120+ 行)
│   ├── utils/
│   │   ├── RiskAssessmentEngine.ts        # 风险评估 (130+ 行)
│   │   └── RecommendationGenerator.ts     # 建议生成 (250+ 行)
│   ├── types/
│   │   └── index.ts                       # 类型定义 (130+ 行)
│   └── index.ts                          # 统一导出 (150+ 行)

总计: ~1240 行 (模块化后)
原文件: 949 行 (单一文件)

优势:
✅ 职责单一，易于维护
✅ 类型安全，编译通过
✅ 向后兼容，无破坏性变更
✅ 便于测试和扩展
✅ 符合 DDD 架构原则

使用方式:
1. 继续使用原接口 (兼容)：
   import { StabilityAssessmentEvaluator } from './StabilityAssessment';

2. 使用新模块化接口 (推荐)：
   import { 
     StabilityAssessmentEngine,
     DeviceCompatibilityAnalyzer,
     createStabilityEvaluator 
   } from './stability-assessment';
*/