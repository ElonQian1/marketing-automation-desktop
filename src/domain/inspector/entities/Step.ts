// src/domain/inspector/entities/Step.ts
// module: domain | layer: domain | role: entity
// summary: 实体定义

import { NodeLocator } from './NodeLocator';

export interface Step {
  id: string;
  sessionId: string;
  name: string;
  actionType: string;
  params: Record<string, any>;
  locator: NodeLocator;
  createdAt: number;
  // Optional redundancy for portability
  xmlHash?: string;
  xmlSnapshot?: string | null;
}
