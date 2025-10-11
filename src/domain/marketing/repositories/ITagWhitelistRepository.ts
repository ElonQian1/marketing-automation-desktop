// src/domain/marketing/repositories/ITagWhitelistRepository.ts
// module: domain | layer: domain | role: repository
// summary: 仓储定义

import { TagWhitelist } from "../entities/TagWhitelist";

export interface ITagWhitelistRepository {
  getWhitelist(): Promise<TagWhitelist>;
}
