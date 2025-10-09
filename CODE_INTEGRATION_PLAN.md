/**
 * 项目级共享工具整合计划
 * 
 * 目标：统一项目中所有重复的工具函数，建立统一的工具库
 */

// 1. 创建项目级通用工具目录
// src/shared/
//   ├── bounds/           # 边界计算工具
//   ├── element/          # 元素操作工具
//   ├── xpath/            # XPath生成工具
//   └── index.ts          # 统一导出

// 2. 整合策略
// - 将 intelligent-strategy-system/shared 提升为项目级 src/shared
// - 替换所有重复的 parseBounds 实现
// - 统一元素验证和XPath生成逻辑

// 3. 迁移映射表
const migrationMap = {
  // 原始分散的实现 -> 统一的新实现
  'src/components/VisualPageAnalyzer.tsx:parseBounds': 'src/shared/bounds/BoundsCalculator.parseBounds',
  'src/components/universal-ui/utils/bounds.ts:parseBoundsString': 'src/shared/bounds/BoundsCalculator.parseBounds', 
  'src/components/universal-ui/views/grid-view/utils.ts:parseBounds': 'src/shared/bounds/BoundsCalculator.parseBounds',
  'src/utils/ContactImportDebugger.ts:parseBounds': 'src/shared/bounds/BoundsCalculator.parseBounds',
  'src/services/customMatchingEngine.ts:parseBounds': 'src/shared/bounds/BoundsCalculator.parseBounds',
  'src/services/XmlPageCacheService.ts:parseBounds': 'src/shared/bounds/BoundsCalculator.parseBounds',
  // ...更多映射
};

export const INTEGRATION_PLAN = {
  migrationMap,
  estimatedFilesToUpdate: 15,
  expectedCodeReduction: '200-300 lines',
  riskLevel: 'LOW', // 工具函数替换风险较低
  testingRequired: ['bounds parsing', 'element validation', 'xpath generation']
};