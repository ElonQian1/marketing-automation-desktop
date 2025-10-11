// src/domain/inspector/entities/AnalysisSession.ts
// module: domain | layer: domain | role: entity
// summary: 实体定义

export interface AnalysisSessionMeta {
  deviceId?: string;
  rotation?: number;
  note?: string;
}

export interface AnalysisSession {
  id: string;
  xmlHash: string;
  xmlText: string;
  createdAt: number;
  meta?: AnalysisSessionMeta;
}
