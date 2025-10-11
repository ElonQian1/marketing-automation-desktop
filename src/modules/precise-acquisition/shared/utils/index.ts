// src/modules/precise-acquisition/shared/utils/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客 - 公共工具方法统一导出
 *
 * 将原本分散的 utils 目录按职责拆分为子模块之后，通过此文件对外导出。
 */

// 校验相关
export * from './validation';

// 数据格式化相关
export * from './formatting';

// 数据处理相关
export * from './data-processing';

// 数据分析相关
export * from './analytics';

// 类型映射相关
export * from './type-mappings';

// 兼容旧代码的默认导出（逐步淘汰中）
export { validateUrl, validateIndustryTags, validateRegionTag, validateCsvImportData } from './validation';
export { generateId, formatDateTime, formatTimeRange } from './formatting';
export { generateDedupKey, csvRowToWatchTarget, detectSensitiveWords, checkCompliance } from './data-processing';
export { calculateSuccessRate, groupTasksByStatus, groupByDate } from './analytics';


