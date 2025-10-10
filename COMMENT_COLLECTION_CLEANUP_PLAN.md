# 评论采集模块清理计划

## 🎯 清理目标

消除重复的 comment-collection 模块文件，统一使用 application 层的实现。

## 📁 待清理的文件和目录

### 1. 重复的服务文件
- ❌ `src/modules/precise-acquisition/comment-collection/services/CommentCollectionService.ts`
  - 理由：已整合到 `EnhancedCommentAdapterManager`
  - 影响：无，已在所有调用点更新导入

### 2. 重复的适配器文件
- ❌ `src/modules/precise-acquisition/comment-collection/adapters/DouyinAdapter.ts`
- ❌ `src/modules/precise-acquisition/comment-collection/adapters/OceanEngineAdapter.ts` 
- ❌ `src/modules/precise-acquisition/comment-collection/adapters/WhitelistAdapter.ts`
  - 理由：与 application 层的实现重复
  - 保留：application 层的更完善实现

### 3. 重复的接口定义
- ❌ `src/modules/precise-acquisition/comment-collection/adapters/CommentCollectionAdapter.ts`
  - 理由：已统一到 `UnifiedCommentAdapter.ts`
  - 保留：统一接口定义

### 4. 受影响的组件
- ⚠️ `src/modules/precise-acquisition/comment-collection/components/CommentCollectionManager.tsx`
  - 状态：已更新导入，使用 `EnhancedCommentAdapterManager`
  - 需要：验证功能正常

## 🔄 清理步骤

### 阶段1：验证依赖关系
```bash
# 检查是否还有其他文件引用这些即将删除的文件
grep -r "CommentCollectionService" src/ --exclude-dir=node_modules
grep -r "DouyinAdapter" src/ --exclude-dir=node_modules
grep -r "OceanEngineAdapter" src/ --exclude-dir=node_modules
```

### 阶段2：备份重要配置
保留任何在旧实现中但新实现中缺失的配置项

### 阶段3：删除重复文件
- 删除 `services/CommentCollectionService.ts`
- 删除 `adapters/DouyinAdapter.ts`
- 删除 `adapters/OceanEngineAdapter.ts`  
- 删除 `adapters/WhitelistAdapter.ts`
- 删除 `adapters/CommentCollectionAdapter.ts`

### 阶段4：更新导入和导出
- 更新 `index.ts` 的导出项
- 确保向后兼容性

## 📊 预期结果

### 文件减少统计
- 🗑️ 删除文件：5个
- 📦 保留文件：2个 (CommentCollectionManager.tsx, index.ts)
- 💾 代码减少：约2000+行

### 架构优化
- ✅ 消除重复代码
- ✅ 统一接口定义  
- ✅ 简化依赖关系
- ✅ 提高可维护性

## ⚠️ 风险评估

### 低风险
- 服务层替换：已完成接口整合
- 类型定义：已统一接口

### 中等风险  
- 适配器删除：需确保application层实现完整
- 组件更新：需测试UI功能正常

### 缓解措施
- 分步执行，每步后验证
- 保留备份，必要时可回滚
- 完整测试评论采集功能

## 🚀 执行计划

1. **立即可执行**：删除明确重复的文件
2. **需要验证**：适配器实现完整性
3. **最后清理**：删除空目录和更新导出