// src/domain/inspector/repositories/ISessionRepository.ts
// module: domain | layer: domain | role: repository
// summary: 仓储定义

import { AnalysisSession } from '../entities/AnalysisSession';

export interface ISessionRepository {
  get(id: string): Promise<AnalysisSession | null>;
  save(session: AnalysisSession): Promise<void>;
  findByHash(xmlHash: string): Promise<AnalysisSession | null>;
}
