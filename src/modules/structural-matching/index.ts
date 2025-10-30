// src/modules/structural-matching/index.ts
// module: structural-matching | layer: public | role: 模块导出
// summary: 结构匹配模块的公开API

// Domain
export * from './domain/constants/field-types';
export * from './domain/constants/scoring-weights';
export * from './domain/models/structural-field-config';

// Application
export * from './application/create-structural-config';

// Hooks
export * from './hooks/use-structural-matching-modal';
export * from './hooks/use-structural-preview';

// UI Components
export * from './ui/components/structural-matching-modal';
export * from './ui/components/field-config-list';
export * from './ui/components/scoring-preview';

// Services
export * from './services/structural-matching-service';
