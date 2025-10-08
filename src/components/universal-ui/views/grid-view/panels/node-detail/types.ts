// UI 层策略类型：包含隐藏元素父查找策略
export type MatchStrategy = 'absolute' | 'strict' | 'relaxed' | 'positionless' | 'standard' | 'custom' | 'hidden-element-parent';

export interface MatchCriteria {
  strategy: MatchStrategy;
  fields: string[];
  values: Record<string, string>;
  excludes?: Record<string, string[]>;
  includes?: Record<string, string[]>;
  matchMode?: Record<string, 'equals' | 'contains' | 'regex'>;
  regexIncludes?: Record<string, string[]>;
  regexExcludes?: Record<string, string[]>;
  
  // 隐藏元素父查找策略特定配置
  hiddenElementParentConfig?: {
    targetText: string;
    maxTraversalDepth?: number;
    clickableIndicators?: string[];
    excludeIndicators?: string[];
    confidenceThreshold?: number;
  };
}

export interface MatchResultSummary {
  ok: boolean;
  message: string;
  matchedIndex?: number;
  total?: number;
  preview?: { 
    text?: string; 
    resource_id?: string; 
    class_name?: string; 
    xpath?: string; 
    bounds?: string; 
    package?: string; 
  };
}
