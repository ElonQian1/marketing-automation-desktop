/**
 * 精准获客工具函数 - 统一导出
 * 
 * 将原来的大型utils文件拆分为多个功能模块
 */

// 数据验证工具
export * from './validation';

// 数据格式化工具
export * from './formatting';

// 数据处理工具
export * from './data-processing';

// 数据分析工具
export * from './analytics';

// 重新导出常用函数（保持向后兼容）
export { validateUrl, validateIndustryTags, validateRegionTag } from './validation';
export { generateId, formatDateTime, formatTimeRange } from './formatting';
export { generateDedupKey, csvRowToWatchTarget, detectSensitiveWords } from './data-processing';
export { calculateSuccessRate, groupTasksByStatus, groupByDate } from './analytics';