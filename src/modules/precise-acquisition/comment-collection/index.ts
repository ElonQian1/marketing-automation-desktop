/**
 * 评论采集模块主入口
 * 
 * 导出评论采集模块的所有公共组件、服务和类型
 */

// 服务层
export { CommentCollectionService } from './services/CommentCollectionService';

// 适配器层
export { CommentCollectionAdapter } from './adapters/CommentCollectionAdapter';
export { DouyinAdapter } from './adapters/DouyinAdapter';
export { OceanEngineAdapter } from './adapters/OceanEngineAdapter';
export { WhitelistAdapter } from './adapters/WhitelistAdapter';

// UI组件
export { CommentCollectionManager } from './components/CommentCollectionManager';

// 类型定义
export type {
  AdapterStatus,
  CommentCollectionParams,
  CommentCollectionResult
} from './adapters/CommentCollectionAdapter';

export type {
  CollectionStats,
  BatchCollectionConfig,
  BatchCollectionResult
} from './services/CommentCollectionService';