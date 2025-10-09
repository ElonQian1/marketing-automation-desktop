import { IWatchTargetRepository } from "../../domain/marketing/repositories/IWatchTargetRepository";
import { WatchTarget } from "../../domain/marketing/entities/WatchTarget";

export class InMemoryWatchTargetRepository implements IWatchTargetRepository {
  private store = new Map<string, WatchTarget>(); // key: dedup_key

  async findByDedupKey(dedupKey: string): Promise<WatchTarget | null> {
    return this.store.get(dedupKey) ?? null;
  }

  async upsert(target: WatchTarget): Promise<void> {
    this.store.set(target.dedup_key, target);
  }

  async bulkUpsert(targets: WatchTarget[]): Promise<void> {
    targets.forEach(t => this.store.set(t.dedup_key, t));
  }

  async list(query: { limit?: number; offset?: number; platform?: string; target_type?: string }): Promise<WatchTarget[]> {
    let arr = Array.from(this.store.values());
    if (query.platform) arr = arr.filter(a => a.platform === query.platform);
    if (query.target_type) arr = arr.filter(a => a.target_type === query.target_type);
    const start = query.offset ?? 0;
    const end = start + (query.limit ?? arr.length);
    return arr.slice(start, end);
  }
}
