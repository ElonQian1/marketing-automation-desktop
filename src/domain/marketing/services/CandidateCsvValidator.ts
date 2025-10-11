// src/domain/marketing/services/CandidateCsvValidator.ts
// module: domain | layer: domain | role: service
// summary: 服务定义

import { createHash } from "crypto";
import { ITagWhitelistRepository } from "../repositories/ITagWhitelistRepository";
import { ImportError, ImportSummary } from "../entities/TagWhitelist";
import { Platform, SourceTag, TargetType, WatchTarget } from "../entities/WatchTarget";

export interface CandidateCsvRow {
  type: string;
  platform: string;
  id_or_url: string;
  title?: string;
  source: string;
  industry_tags?: string;
  region?: string;
  notes?: string;
}

export interface CandidateCsvValidatorOutput {
  summary: ImportSummary;
  parsed: WatchTarget[]; // only valid rows
}

export class CandidateCsvValidator {
  constructor(private whitelistRepo: ITagWhitelistRepository) {}

  private sha1(input: string): string {
    return createHash('sha1').update(input).digest('hex');
  }

  private isValidUrl(s: string): boolean {
    try {
      const u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async validate(rows: CandidateCsvRow[]): Promise<CandidateCsvValidatorOutput> {
    const wl = await this.whitelistRepo.getWhitelist();
    const errors: ImportError[] = [];
    const parsed: WatchTarget[] = [];

    // Precompute maps for enums
    const industrySet = new Set(wl.industry_tags);
    const regionSet = new Set(wl.region_tags);
    const sourceSet = new Set(wl.sources);

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // assuming headers at line 1
      // Required: type/platform/id_or_url/source
      if (!row.type) errors.push({ row: rowNum, code: 'E_REQUIRED', field: 'type', message: 'type 必填' });
      if (!row.platform) errors.push({ row: rowNum, code: 'E_REQUIRED', field: 'platform', message: 'platform 必填' });
      if (!row.id_or_url) errors.push({ row: rowNum, code: 'E_REQUIRED', field: 'id_or_url', message: 'id_or_url 必填' });
      if (!row.source) errors.push({ row: rowNum, code: 'E_REQUIRED', field: 'source', message: 'source 必填' });

      // Type enum
      const type = row.type as TargetType;
      if (row.type && type !== 'video' && type !== 'account') {
        errors.push({ row: rowNum, code: 'E_ENUM', field: 'type', message: 'type 仅支持 video/account' });
      }

      // Platform enum
      const platform = row.platform as Platform;
      if (row.platform && platform !== 'douyin' && platform !== 'oceanengine' && platform !== 'public') {
        errors.push({ row: rowNum, code: 'E_ENUM', field: 'platform', message: 'platform 仅支持 douyin/oceanengine/public' });
      }

      // URL format when looks like url
      if (row.id_or_url && (row.id_or_url.startsWith('http://') || row.id_or_url.startsWith('https://'))) {
        if (!this.isValidUrl(row.id_or_url)) {
          errors.push({ row: rowNum, code: 'E_URL', field: 'id_or_url', message: 'URL 非法' });
        }
      }

      // Source enum
      const source = row.source as SourceTag;
      if (row.source && !sourceSet.has(source)) {
        errors.push({ row: rowNum, code: 'E_ENUM', field: 'source', message: 'source 非法' });
      }

      // public platform must be whitelisted source page (policy gate) - we mark as NOT_ALLOWED, require external evidence; here we check source === 'whitelist'
      if (platform === 'public' && source !== 'whitelist') {
        errors.push({ row: rowNum, code: 'E_NOT_ALLOWED', field: 'platform', message: 'platform=public 仅允许 source=whitelist' });
      }

      // industry_tags mapping and validation
      let industry_tags: string[] | undefined = undefined;
      if (row.industry_tags && row.industry_tags.trim().length > 0) {
        industry_tags = row.industry_tags.split(';').map(s => s.trim()).filter(Boolean).map(label => wl.industry_label_map?.[label] || label);
        const invalid = industry_tags.filter(t => !industrySet.has(t));
        if (invalid.length > 0) {
          errors.push({ row: rowNum, code: 'E_ENUM', field: 'industry_tags', message: `不在白名单: ${invalid.join(',')}` });
        }
      }

      // region validation
      let region_tag: string | undefined = undefined;
      if (row.region && row.region.trim().length > 0) {
        region_tag = row.region.trim();
        if (!regionSet.has(region_tag)) {
          errors.push({ row: rowNum, code: 'E_ENUM', field: 'region', message: `region 不在白名单: ${row.region}` });
        }
      }

      // If any required missing, skip parse
      const hasRequired = !!row.type && !!row.platform && !!row.id_or_url && !!row.source;
      if (hasRequired) {
        const dedup_key = this.sha1(`${row.platform}:${row.id_or_url}`);
        const now = new Date().toISOString();
        const wt: WatchTarget = {
          id: `wt_${dedup_key.slice(0, 12)}`,
          target_type: type,
          platform,
          platform_id_or_url: row.id_or_url,
          title: row.title?.trim() || undefined,
          source,
          industry_tags,
          region_tag,
          last_fetch_at: undefined,
          notes: row.notes?.trim() || undefined,
          created_at: now,
          updated_at: now,
          dedup_key,
        };
        parsed.push(wt);
      }
    });

    const summary: ImportSummary = {
      total: rows.length,
      success: Math.max(0, rows.length - errors.length),
      failed: errors.length,
      errors,
    };

    return { summary, parsed };
  }
}
