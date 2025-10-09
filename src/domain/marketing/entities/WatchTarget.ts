export type TargetType = 'video' | 'account';
export type Platform = 'douyin' | 'oceanengine' | 'public';
export type SourceTag = 'manual' | 'csv' | 'whitelist' | 'ads';

export interface WatchTarget {
  id: string; // internal id (uuid)
  target_type: TargetType;
  platform: Platform;
  platform_id_or_url: string;
  title?: string;
  source: SourceTag;
  industry_tags?: string[]; // enum values from whitelist
  region_tag?: string; // enum value from whitelist
  last_fetch_at?: string; // ISO string
  notes?: string;
  created_at: string; // ISO
  updated_at: string; // ISO
  dedup_key: string; // sha1(platform + ':' + id_or_url)
}
