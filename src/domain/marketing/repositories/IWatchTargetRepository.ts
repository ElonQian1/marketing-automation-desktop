// src/domain/marketing/repositories/IWatchTargetRepository.ts
// module: domain | layer: domain | role: repository
// summary: 仓储定义

import { WatchTarget } from "../entities/WatchTarget";

export interface IWatchTargetRepository {
  findByDedupKey(dedupKey: string): Promise<WatchTarget | null>;
  upsert(target: WatchTarget): Promise<void>;
  bulkUpsert(targets: WatchTarget[]): Promise<void>;
  list(query: { limit?: number; offset?: number; platform?: string; target_type?: string }): Promise<WatchTarget[]>;
}
