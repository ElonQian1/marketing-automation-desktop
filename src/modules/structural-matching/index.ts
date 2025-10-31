// src/modules/structural-matching/index.ts
// module: structural-matching | layer: public | role: 模块导出
// summary: 结构匹配模块的公开API

// Domain
export * from './domain/constants/field-types';
export * from './domain/constants/scoring-weights';
export * from './domain/constants/match-strategies';
export * from './domain/constants/field-strategy-presets';
export * from './domain/constants/element-templates';
export * from './domain/models/structural-field-config';
export * from './domain/models/hierarchical-field-config';

// Application
export * from './application/create-structural-config';
export * from './application/test-field-matching';

// Hooks
export * from './hooks/use-structural-matching-modal';
export * from './hooks/use-hierarchical-matching-modal';
export * from './hooks/use-structural-preview';
export * from './hooks/use-field-strategy-config';

// UI Components
export * from './ui/components/structural-matching-modal';
export * from './ui/components/element-structure-tree';
export * from './ui/components/scoring-preview';
export * from './ui/components/field-strategy-selector';
export * from './ui/components/enhanced-field-config-panel';
export * from './ui/components/enhanced-field-config-panel-compact';
export * from './ui/pages/structural-matching-demo';
export * from './ui/pages/field-strategy-demo';
export * from './ui/pages/enhanced-field-config-demo';

// Services
export * from './services/structural-matching-service';
