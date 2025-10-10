# CommentCollectionService 使用点更新计划

## 🎯 需要更新的文件列表

### 1. 组件层
- **`src/modules/precise-acquisition/comment-collection/components/CommentCollectionManager.tsx`**
  - 第70行：`const [service] = useState(() => new CommentCollectionService());`
  - 更新：使用 `EnhancedCommentAdapterManager`

### 2. 服务层  
- **`src/modules/precise-acquisition/PreciseAcquisitionService.ts`**
  - 第99行：`private commentService: CommentCollectionService;`
  - 第188行：`this.commentService = new CommentCollectionService();`
  - 第396行：`getCommentService(): CommentCollectionService`
  - 更新：使用 `EnhancedCommentAdapterManager`

### 3. 导入/导出
- **`src/modules/precise-acquisition/comment-collection/index.ts`**
  - 第8行：导出 `CommentCollectionService`
  - 更新：导出 `EnhancedCommentAdapterManager`

### 4. 应用服务层
- **`src/application/services/UnifiedPreciseAcquisitionService.ts`**
  - 第111行和第124行：使用 `commentCollectionService`
  - 更新：使用统一的服务实例

## 🔄 更新策略

### 阶段1: 创建桥接服务
创建一个兼容层，确保现有API调用不中断

### 阶段2: 逐步替换
逐个文件更新导入和实例化

### 阶段3: 验证功能
确保所有功能正常工作

## 📋 具体更新步骤

1. **CommentCollectionManager.tsx**
   ```tsx
   // 旧代码
   import { CommentCollectionService } from '../services/CommentCollectionService';
   const [service] = useState(() => new CommentCollectionService());
   
   // 新代码  
   import { EnhancedCommentAdapterManager, createEnhancedCommentAdapterManager } from '../../../application/services/comment-collection/EnhancedCommentAdapterManager';
   const [service] = useState(() => createEnhancedCommentAdapterManager({
     default_strategy: 'auto',
     fallback_enabled: true
   }));
   ```

2. **PreciseAcquisitionService.ts**
   ```typescript
   // 旧代码
   import { CommentCollectionService } from './comment-collection';
   private commentService: CommentCollectionService;
   this.commentService = new CommentCollectionService();
   
   // 新代码
   import { EnhancedCommentAdapterManager, createEnhancedCommentAdapterManager } from '../application/services/comment-collection/EnhancedCommentAdapterManager';
   private commentService: EnhancedCommentAdapterManager;
   this.commentService = createEnhancedCommentAdapterManager(defaultConfig);
   ```

3. **index.ts 导出更新**
   ```typescript
   // 旧代码
   export { CommentCollectionService } from './services/CommentCollectionService';
   
   // 新代码 (向后兼容)
   export { EnhancedCommentAdapterManager as CommentCollectionService } from '../../../application/services/comment-collection/EnhancedCommentAdapterManager';
   ```

## ⚠️ 注意事项

1. **向后兼容**: 通过类型别名确保现有代码不会立即中断
2. **配置传递**: 确保所有必要的配置正确传递到新的服务
3. **错误处理**: 保持相同的错误处理机制  
4. **测试验证**: 每个更新后都要验证相关功能

## 🎯 预期结果

- ✅ 统一使用 `EnhancedCommentAdapterManager`
- ✅ 保持现有API兼容性
- ✅ 增强功能可用（审计、调度等）
- ✅ 消除代码重复