import { ITagWhitelistRepository } from "../../domain/marketing/repositories/ITagWhitelistRepository";
import { DEFAULT_TAG_WHITELIST, TagWhitelist } from "../../domain/marketing/entities/TagWhitelist";

export class StaticTagWhitelistRepository implements ITagWhitelistRepository {
  constructor(private overrides?: Partial<TagWhitelist>) {}
  async getWhitelist(): Promise<TagWhitelist> {
    return { ...DEFAULT_TAG_WHITELIST, ...(this.overrides || {}) };
  }
}
