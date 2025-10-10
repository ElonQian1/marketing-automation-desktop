/**
 * 评论采集模块主入口
 * 
 * 导出评论采集模块的所有公共组件、服务和类型
 */

// 服务层 - 向后兼容导出 (实际使用 EnhancedCommentAdapterManager)
export { 
  EnhancedCommentAdapterManager as CommentCollectionService,
  createEnhancedCommentAdapterManager
} from '../../../application/services/comment-collection/EnhancedCommentAdapterManager';

// 适配器层 - 向后兼容导出 (实际使用 application 层实现)
export type { 
  UnifiedCommentAdapter as CommentCollectionAdapter
} from '../../../application/services/comment-collection/UnifiedCommentAdapter';

export { 
  UnifiedCommentAdapterBase as CommentAdapterBase
} from '../../../application/services/comment-collection/UnifiedCommentAdapter';

export { 
  DouyinCommentAdapter as DouyinAdapter,
  OceanEngineCommentAdapter as OceanEngineAdapter,
  PublicWhitelistAdapter as WhitelistAdapter
} from '../../../application/services/comment-collection/';

// UI组件
export { CommentCollectionManager } from './components/CommentCollectionManager';

// 类型定义 - 统一使用 application 层类型
export type {
  UnifiedAdapterStatus as AdapterStatus,
  UnifiedCommentCollectionParams as CommentCollectionParams,
  UnifiedCommentCollectionResult as CommentCollectionResult
} from '../../../application/services/comment-collection/UnifiedCommentAdapter';

export type {
  CollectionStats,
  BatchCollectionConfig,
  BatchCollectionResult
} from '../../../application/services/comment-collection/EnhancedCommentAdapterManager';