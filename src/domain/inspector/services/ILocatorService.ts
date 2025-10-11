// src/domain/inspector/services/ILocatorService.ts
// module: domain | layer: domain | role: service
// summary: 服务定义

import { NodeLocator } from '../entities/NodeLocator';

export interface ILocatorService<UiNode> {
  resolve(root: UiNode | null, locator: NodeLocator): UiNode | null;
}
