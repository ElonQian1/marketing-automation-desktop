export interface TagWhitelist {
  industry_tags: string[]; // canonical enum values
  region_tags: string[];   // canonical enum values
  sources: ('manual' | 'csv' | 'whitelist' | 'ads')[];
  // mapping external labels (zh) to internal enums when importing
  industry_label_map?: Record<string, string>; // e.g. "口腔" -> "口腔"
}

export const DEFAULT_TAG_WHITELIST: TagWhitelist = {
  industry_tags: [
    '口腔', '母婴', '医疗健康', '美妆', '教育培训', '健身', '食品饮料', '家居', '3C', '汽车', '旅游', '宠物', '服饰'
  ],
  region_tags: [
    '全国', '华东', '华北', '华南', '华中', '西南', '西北', '东北'
  ],
  sources: ['manual', 'csv', 'whitelist', 'ads'],
  industry_label_map: {}
};

export type ImportErrorCode = 'E_REQUIRED' | 'E_ENUM' | 'E_URL' | 'E_DUP' | 'E_NOT_ALLOWED';

export interface ImportError {
  row: number;
  code: ImportErrorCode;
  field: string;
  message: string;
}

export interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  errors: ImportError[];
}
