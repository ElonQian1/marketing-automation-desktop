// src/domain/inspector/repositories/IStepRepository.ts
// module: domain | layer: domain | role: repository
// summary: 仓储定义

import { Step } from '../entities/Step';

export interface IStepRepository {
  get(id: string): Promise<Step | null>;
  save(step: Step): Promise<void>;
  listBySession(sessionId: string): Promise<Step[]>;
}
