// src/application/services/MarketingApplicationService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

import { CandidateCsvValidator, CandidateCsvRow } from "../../domain/marketing/services/CandidateCsvValidator";
import { IWatchTargetRepository } from "../../domain/marketing/repositories/IWatchTargetRepository";
import { ITagWhitelistRepository } from "../../domain/marketing/repositories/ITagWhitelistRepository";
import { ImportSummary } from "../../domain/marketing/entities/TagWhitelist";
import { WatchTarget } from "../../domain/marketing/entities/WatchTarget";

export class MarketingApplicationService {
  private validator: CandidateCsvValidator;

  constructor(
    private watchRepo: IWatchTargetRepository,
    private whitelistRepo: ITagWhitelistRepository
  ) {
    this.validator = new CandidateCsvValidator(whitelistRepo);
  }

  // parse CSV content (UTF-8, comma-separated) into rows respecting template columns
  parseCsv(csv: string): CandidateCsvRow[] {
    const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const header = lines[0].split(',').map(h => h.trim());
    const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const rows: CandidateCsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this.safeSplitCsvLine(lines[i]);
      rows.push({
        type: cols[idx('type')] || '',
        platform: cols[idx('platform')] || '',
        id_or_url: cols[idx('id_or_url')] || '',
        title: cols[idx('title')] || '',
        source: cols[idx('source')] || '',
        industry_tags: cols[idx('industry_tags')] || '',
        region: cols[idx('region')] || '',
        notes: cols[idx('notes')] || '',
      });
    }
    return rows;
  }

  // very small CSV split supporting quoted fields
  private safeSplitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map(s => s.trim());
  }

  async importCandidates(rowsOrCsv: string | CandidateCsvRow[]): Promise<{ summary: ImportSummary; saved: number; errors: ImportSummary['errors'] }>{
    const rows = typeof rowsOrCsv === 'string' ? this.parseCsv(rowsOrCsv) : rowsOrCsv;
    const { summary, parsed } = await this.validator.validate(rows);

    // deduplicate against repo and bulk upsert
    const uniqueByDedup = new Map<string, WatchTarget>();
    parsed.forEach(wt => uniqueByDedup.set(wt.dedup_key, wt));
    const uniques = Array.from(uniqueByDedup.values());
    await this.watchRepo.bulkUpsert(uniques);
    return { summary, saved: uniques.length, errors: summary.errors };
  }
}
