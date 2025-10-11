// src/domain/page-analysis/index.ts
// module: domain | layer: domain | role: domain-logic
// summary: 领域逻辑定义

/**
 * 页面分析领域模块导出
 */

// 实体
export * from './entities/PageInfo';
export * from './entities/UIElement';
export * from './entities/PageAnalysis';

// 领域服务
export * from './services/PageAnalysisDomainService';

// 仓储接口
export * from './repositories/IPageAnalysisRepository';