# 精准获客服务统一门面

## 概述

`PreciseAcquisitionServiceFacade` 是一个统一门面服务，用于整合现有的精准获客应用服务与新的模块化服务，避免代码重复，提供清晰的服务入口。

## 架构设计

### 服务分层

```
PreciseAcquisitionServiceFacade (统一门面)
├── legacyService (PreciseAcquisitionApplicationService) - 原有完整业务逻辑
├── newTaskEngine (TaskEngineService) - 新模块化任务引擎
└── newRateLimiter (RateLimitService) - 新模块化限流服务
```

### 设计原则

1. **无重复代码**：所有功能都是对现有服务的委托调用，不重复实现业务逻辑
2. **渐进迁移**：支持现有服务和新模块化服务并存，逐步迁移
3. **单一入口**：为上层组件提供统一的服务访问接口
4. **类型安全**：直接使用各服务的原始类型，避免类型转换问题

## 服务接口

### 现有服务代理

#### 候选池管理
```typescript
const service = PreciseAcquisitionServiceFacade.getInstance();

// 添加监控目标
await service.candidatePool.add({
  targetType: TargetType.ACCOUNT,
  platform: Platform.XIAOHONGSHU,
  idOrUrl: 'user123',
  title: '目标用户'
});

// 批量导入
await service.candidatePool.bulkImport(targets);

// 查询目标
const targets = await service.candidatePool.get({ 
  platform: Platform.XIAOHONGSHU,
  limit: 10 
});
```

#### 评论管理
```typescript
// 添加评论
await service.comments.add({
  platform: Platform.XIAOHONGSHU,
  videoId: 'video123',
  authorId: 'user456',
  content: '评论内容',
  sourceTargetId: 'target789'
});

// 查询评论
const comments = await service.comments.get({
  platform: Platform.XIAOHONGSHU,
  limit: 20
});
```

#### 任务管理
```typescript
// 生成任务
const result = await service.tasks.generate({
  targetType: TargetType.ACCOUNT,
  maxTasksPerTarget: 5,
  taskTypes: [TaskType.REPLY, TaskType.FOLLOW]
});

// 查询任务
const tasks = await service.tasks.get({
  status: TaskStatus.PENDING,
  limit: 50
});

// 更新任务状态
await service.tasks.updateStatus('task123', TaskStatus.COMPLETED);
```

### 新模块化服务代理

#### 现代化任务引擎
```typescript
// 使用新的任务引擎
const result = await service.modernTaskEngine.generate({
  target: 'user123',
  max_tasks: 10,
  task_types: ['reply', 'follow']
});

// 批量生成任务
const results = await service.modernTaskEngine.batchGenerate({
  configs: [config1, config2, config3]
});

// 查询任务（使用新的查询接口）
const { tasks, total } = await service.modernTaskEngine.getTasks({
  status: 'pending',
  platform: 'xiaohongshu',
  limit: 20
});

// 任务分配
await service.modernTaskEngine.assign('device123', ['task1', 'task2']);

// 获取执行统计
const stats = await service.modernTaskEngine.getStats();
```

#### 现代化限流服务
```typescript
// 评论去重检查
const dedupResult = await service.modernRateLimit.checkCommentDedup(
  comment, 
  'reply', 
  'device123'
);

// 用户级去重检查
const userDedupResult = await service.modernRateLimit.checkUserDedup(
  watchTarget, 
  'follow', 
  'device123'
);

// 限流检查
const rateLimitResult = await service.modernRateLimit.checkRateLimit(
  'device123', 
  'reply', 
  config
);

// 记录操作执行
await service.modernRateLimit.saveRecord({
  dedup_key: 'unique_key',
  action_type: 'reply',
  target_id: 'target123',
  device_id: 'device123',
  success: true
});

// 获取统计数据
const stats = await service.modernRateLimit.getStats();
```

## 使用示例

### 基本使用
```typescript
import { preciseAcquisitionService } from '@/application/services/PreciseAcquisitionServiceFacade';

// 获取单例实例
const service = preciseAcquisitionService;

// 或者显式获取实例
const service = PreciseAcquisitionServiceFacade.getInstance();
```

### 健康检查
```typescript
const health = await service.healthCheck();
console.log('Service Health:', health);
/*
{
  overall: 'healthy',
  services: {
    legacyService: 'healthy',
    taskEngine: 'healthy',
    rateLimitService: 'healthy'
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
*/
```

### 服务信息
```typescript
const info = service.getServiceInfo();
console.log('Service Info:', info);
```

## 迁移策略

### 阶段1：门面整合（当前）
- ✅ 创建统一门面服务
- ✅ 委托调用现有服务
- ✅ 提供新模块化服务访问接口
- ✅ 避免重复代码

### 阶段2：类型统一（下一步）
- 🔄 统一类型定义系统
- 🔄 创建类型适配器
- 🔄 接口兼容性增强

### 阶段3：逐步迁移（未来）
- 🔄 将现有功能迁移到新模块化架构
- 🔄 数据迁移工具
- 🔄 向后兼容性维护

### 阶段4：完全模块化（最终）
- ⏳ 废弃旧服务
- ⏳ 完全基于模块化架构
- ⏳ 清理遗留代码

## 最佳实践

### 1. 服务选择指南

**使用现有服务（legacyService系列）的场景：**
- 需要完整的业务流程和验证逻辑
- 依赖现有的数据格式和接口
- 在生产环境中已验证的功能

**使用新模块化服务（modern系列）的场景：**
- 新功能开发
- 需要更好的性能和可扩展性
- 希望使用更清晰的接口设计

### 2. 错误处理
```typescript
try {
  const result = await service.candidatePool.add(params);
  // 处理成功结果
} catch (error) {
  // 统一错误处理
  console.error('操作失败:', error.message);
}
```

### 3. 批量操作
```typescript
// 优先使用批量接口
const results = await service.candidatePool.bulkImport(targets);

// 新模块化服务的批量操作
const taskResults = await service.modernTaskEngine.batchGenerate(configs);
```

## 注意事项

1. **类型兼容性**：现有服务和新服务使用不同的类型系统，注意参数和返回值的差异
2. **性能考虑**：门面服务只是委托调用，不会增加显著的性能开销
3. **并发安全**：所有底层服务都是线程安全的，门面服务也是安全的
4. **错误传播**：门面服务不会捕获底层服务的错误，错误会直接传播给调用方

## 文件结构

```
src/application/services/
├── PreciseAcquisitionApplicationService.ts  # 原有完整服务
├── PreciseAcquisitionServiceFacade.ts       # 统一门面服务 (本文件)
├── SimplifiedPreciseAcquisitionService.ts   # 简化服务（废弃）
└── TypeAdapter.ts                           # 类型适配器（开发中）
```

## 相关文档

- [精准获客应用服务文档](./PreciseAcquisitionApplicationService.md)
- [任务引擎服务文档](../modules/precise-acquisition/task-engine/README.md)
- [限流服务文档](../modules/precise-acquisition/rate-limit/README.md)
- [架构重构报告](../../ADB_ARCHITECTURE_UNIFICATION_REPORT.md)