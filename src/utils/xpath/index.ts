/**
 * XPath 统一工具模块
 * 
 * 统一管理所有 XPath 相关的验证、生成、解析功能
 * 避免代码重复，提供统一的 API 接口
 * 
 * @module XPathUtils
 */

// 导出所有功能模块
export * from './validation';
export * from './generation';
export * from './parsing';
export * from './types';

// 默认导出统一的 XPath 服务
export { default as XPathService } from './XPathService';

// 便捷导出常用函数（向后兼容）
export { isValidXPath } from './validation';
export { buildXPath } from './generation';
export { parseXPath } from './parsing';