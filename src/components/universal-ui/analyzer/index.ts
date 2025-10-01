/**
 * 通用UI元素智能分析器 - 模块导出
 */

// 导出类型定义
export * from './types';

// 导出主要类
export { UniversalElementAnalyzer } from './UniversalElementAnalyzer';
export { AppSpecificMappings } from './AppSpecificMappings';
export { ElementAnalysisUtils } from './ElementAnalysisUtils';
export { AppSpecificAnalyzer } from './AppSpecificAnalyzer';
export { GenericPatternAnalyzer } from './GenericPatternAnalyzer';

// 默认导出主分析器
export { UniversalElementAnalyzer as default } from './UniversalElementAnalyzer';