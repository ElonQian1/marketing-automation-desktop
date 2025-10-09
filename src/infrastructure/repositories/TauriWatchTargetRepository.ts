import { invoke } from '@tauri-apps/api/core';
import { IWatchTargetRepository } from '../../domain/marketing/repositories/IWatchTargetRepository';
import { WatchTarget } from '../../domain/marketing/entities/WatchTarget';

type WatchTargetPayload = {
  dedup_key: string;
  target_type: string;
  platform: string;
  id_or_url: string;
  title?: string | null;
  source?: string | null;
  industry_tags?: string | null;
  region?: string | null;
  notes?: string | null;
};

export class TauriWatchTargetRepository implements IWatchTargetRepository {
  async findByDedupKey(dedupKey: string): Promise<WatchTarget | null> {
  const row = await invoke<any>('get_watch_target_by_dedup_key', { dedup_key: dedupKey });
    if (!row) return null;
    return this.rowToWatchTarget(row);
  }

  async upsert(target: WatchTarget): Promise<void> {
    const payload = this.toPayload(target);
    await invoke<number>('bulk_upsert_watch_targets', { payloads: [payload] });
  }

  async bulkUpsert(targets: WatchTarget[]): Promise<void> {
    const payloads = targets.map(t => this.toPayload(t));
    await invoke<number>('bulk_upsert_watch_targets', { payloads });
  }

  async list(query: { limit?: number; offset?: number; platform?: string; target_type?: string }): Promise<WatchTarget[]> {
    const rows = await invoke<any[]>('list_watch_targets', {
      limit: query.limit ?? 200,
      offset: query.offset ?? 0,
      platform: query.platform ?? null,
      target_type: query.target_type ?? null,
    });
    return (rows || []).map(r => this.rowToWatchTarget(r));
  }

  private toPayload(t: WatchTarget): WatchTargetPayload {
    return {
      dedup_key: t.dedup_key,
      target_type: t.target_type,
      platform: t.platform,
      id_or_url: t.platform_id_or_url,
      title: t.title ?? null,
      source: t.source ?? null,
      industry_tags: t.industry_tags?.join(',') ?? null,
      region: t.region_tag ?? null,
      notes: t.notes ?? null,
    };
  }

  private rowToWatchTarget(row: any): WatchTarget {
    const wt: WatchTarget = {
      id: String(row.id ?? `wt_${row.dedup_key?.slice?.(0,12)}`),
      target_type: row.target_type,
      platform: row.platform,
      platform_id_or_url: row.id_or_url,
      title: row.title ?? undefined,
      source: row.source ?? undefined,
      industry_tags: (row.industry_tags ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0),
      region_tag: row.region ?? undefined,
      last_fetch_at: undefined,
      notes: row.notes ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      dedup_key: row.dedup_key,
    };
    return wt;
  }
}

export default TauriWatchTargetRepository;
