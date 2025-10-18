// src/pages/precise-acquisition/modules/industry-monitoring/hooks/useIndustryMonitoring.ts
// module: precise-acquisition | layer: hooks | role: industry-monitoring-legacy
// summary: 行业监控Hook（已重构为统一useMonitoring的代理）

/**
 * 行业监控Hook - 重构版本
 * 
 * 🔄 重构说明：
 * - 已迁移到统一的 useMonitoring Hook
 * - 保持完全向后兼容的API
 * - 消除184行重复代码，统一监控逻辑
 * 
 * ⚠️ 迁移指导：
 * 推荐直接使用 useMonitoring('industry') 替代此Hook
 * 此文件保留用于向后兼容，未来版本可能移除
 */

import { useMonitoring } from '../../../../../shared/hooks/useMonitoring';

/**
 * 行业监控Hook（向后兼容版本）
 * 
 * @deprecated 推荐使用 useMonitoring('industry') 替代
 * @returns 与原始API完全兼容的监控功能
 */
export const useIndustryMonitoring = () => {
  return useMonitoring('industry');
};