// src/hooks/singleStepTest/types.ts
// module: shared | layer: application | role: 状态钩子
// summary: React状态管理和业务逻辑封装

import type { MatchCriteriaDTO, MatchResultDTO } from '../../domain/page-analysis/repositories/IUiMatcherRepository';

export interface StrategyTestResult {
  success: boolean;
  output: string;
  matchResult?: MatchResultDTO;
  criteria?: MatchCriteriaDTO;
  error?: string;
}
