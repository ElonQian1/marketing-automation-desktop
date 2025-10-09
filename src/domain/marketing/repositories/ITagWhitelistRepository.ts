import { TagWhitelist } from "../entities/TagWhitelist";

export interface ITagWhitelistRepository {
  getWhitelist(): Promise<TagWhitelist>;
}
