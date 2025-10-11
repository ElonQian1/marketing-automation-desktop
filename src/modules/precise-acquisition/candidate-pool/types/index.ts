// src/modules/precise-acquisition/candidate-pool/types/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 候选池管理模块类型定义
 */

export * from '../../shared/types/core';

// 候选池特有的扩展类型可以在这里定义
export interface CandidatePoolFilters {
  platform?: string;
  target_type?: string;
  source?: string;
  industry_tags?: string[];
  region_tag?: string;
  keyword?: string;
}

export interface CandidatePoolTableRow {
  key: string;
  id: string;
  target_type: string;
  platform: string;
  title?: string;
  source: string;
  industry_tags?: string[];
  region_tag?: string;
  last_fetch_at?: Date;
  created_at: Date;
}