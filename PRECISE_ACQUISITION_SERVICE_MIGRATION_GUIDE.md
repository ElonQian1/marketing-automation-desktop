# 精准获客服务整合迁移指南

## 📋 背景说明

项目中存在多个重复的精准获客服务实现，导致代码冗余和维护困难：

- `PreciseAcquisitionApplicationService` - 原始核心服务
- `SimplifiedPreciseAcquisitionService` - 简化门面服务
- `UnifiedPreciseAcquisitionService` - 统一门面服务
- `PreciseAcquisitionServiceFacade` - 委托门面服务

为了遵循 **DDD 架构原则** 和 **单一职责原则**，现统一整合为单一的服务门面。

## 🎯 整合策略

### 新的统一门面：`PreciseAcquisitionServiceFacade.v2.ts`

采用 **门面模式（Facade Pattern）** + **委托模式（Delegation Pattern）**：

```typescript
import { preciseAcquisitionService } from '@/application/services/PreciseAcquisitionServiceFacade.v2';

// 统一的服务入口
const service = preciseAcquisitionService;
```

## 🔄 迁移映射表

### 候选池管理

```typescript
// ❌ 旧方式 - 多种服务调用
const oldService1 = PreciseAcquisitionApplicationService.getInstance();
const oldService2 = new SimplifiedPreciseAcquisitionService();
const oldService3 = UnifiedPreciseAcquisitionService.getInstance();

await oldService1.addWatchTarget(params);
await oldService2.addWatchTarget(params);
await oldService3.addWatchTarget(params);

// ✅ 新方式 - 统一门面
import { preciseAcquisitionService } from '@/application/services/PreciseAcquisitionServiceFacade.v2';

await preciseAcquisitionService.addWatchTarget(payload);
await preciseAcquisitionService.bulkImportWatchTargets(payloads);
await preciseAcquisitionService.getWatchTargets(params);
```

### 任务管理

```typescript
// ❌ 旧方式 - 直接调用内部引擎
import { TaskEngineService } from '@/modules/precise-acquisition/task-engine/services/TaskEngineService';
const taskEngine = new TaskEngineService();

// ✅ 新方式 - 通过门面调用
await preciseAcquisitionService.generateTasks(config);
await preciseAcquisitionService.getTasks(params);
await preciseAcquisitionService.updateTaskStatus(taskId, status);
```

### 模板管理

```typescript
// ❌ 旧方式 - 直接调用模板服务
import { TemplateManagementService } from '@/modules/precise-acquisition/template-management/services/TemplateManagementService';
const templateService = new TemplateManagementService();

// ✅ 新方式 - 通过门面调用
await preciseAcquisitionService.getReplyTemplates(options);
await preciseAcquisitionService.createReplyTemplate(template);
```

### 限流与合规检查

```typescript
// ❌ 旧方式 - 直接调用限流服务
import { RateLimitService } from '@/modules/precise-acquisition/rate-limit/services/RateLimitService';
const rateLimiter = new RateLimitService();

// ✅ 新方式 - 通过门面调用
await preciseAcquisitionService.checkRateLimit(params);
await preciseAcquisitionService.performComprehensiveCheck(params);
```

## 📝 Hook 层迁移

### 更新自定义 Hook

```typescript
// 文件：src/hooks/usePreciseAcquisition.ts

// ❌ 旧实现
import { PreciseAcquisitionApplicationService } from '@/application/services/PreciseAcquisitionApplicationService';

export function usePreciseAcquisition() {
  const [service] = useState(() => PreciseAcquisitionApplicationService.getInstance());
  // ...
}

// ✅ 新实现
import { preciseAcquisitionService } from '@/application/services/PreciseAcquisitionServiceFacade.v2';

export function usePreciseAcquisition() {
  const service = preciseAcquisitionService; // 使用单例
  // ...
}
```

### 更新候选池 Hook

```typescript
// 文件：src/modules/precise-acquisition/candidate-pool/hooks/useCandidatePool.ts

import { preciseAcquisitionService } from '@/application/services/PreciseAcquisitionServiceFacade.v2';

export function useCandidatePool() {
  // 直接使用统一门面，无需创建多个服务实例
  const addTarget = useCallback(async (payload: WatchTargetPayload) => {
    await preciseAcquisitionService.addWatchTarget(payload);
  }, []);

  const getTargets = useCallback(async (params = {}) => {
    return preciseAcquisitionService.getWatchTargets(params);
  }, []);

  // ...
}
```

## 🗂️ 文件级别迁移清单

### 需要更新的文件

1. **Hook 文件**
   - `src/hooks/usePreciseAcquisition.ts` ✏️
   - `src/modules/precise-acquisition/candidate-pool/hooks/useCandidatePool.ts` ✏️
   - `src/modules/precise-acquisition/task-engine/hooks/useTaskEngine.ts` ✏️

2. **组件文件**
   - `src/components/WatchTargetList.tsx` ✏️
   - `src/modules/precise-acquisition/candidate-pool/components/CandidatePoolManager.tsx` ✏️
   - `src/modules/precise-acquisition/task-engine/components/TaskEngineManager.tsx` ✏️

3. **页面文件**
   - `src/pages/precise-acquisition/modules/DailyReportModule.tsx` ✏️
   - `src/pages/precise-acquisition/modules/industry-monitoring/components/ReplyTaskManager.tsx` ✏️

### 需要标记废弃的文件

1. **服务文件** (添加 @deprecated 注释)
   - `src/application/services/SimplifiedPreciseAcquisitionService.ts` ⚠️
   - `src/application/services/UnifiedPreciseAcquisitionService.ts` ⚠️
   - `src/application/services/PreciseAcquisitionServiceFacade.ts` (旧版) ⚠️

## 🚀 迁移步骤

### 第一阶段：服务门面切换 (当前)

1. ✅ 创建新的统一门面 `PreciseAcquisitionServiceFacade.v2.ts`
2. ⏳ 更新主要 Hook 文件使用新门面
3. ⏳ 更新核心组件使用新门面
4. ⏳ 添加旧服务的 @deprecated 标记

### 第二阶段：全面迁移

1. 更新所有导入语句
2. 测试所有功能点确保无破坏性变更
3. 更新类型定义确保类型安全
4. 运行完整的测试套件

### 第三阶段：清理阶段

1. 移除所有 @deprecated 服务文件
2. 清理未使用的导入
3. 更新文档和示例代码
4. 运行最终的集成测试

## ⏱️ 时间估算

- **第一阶段**: 2-3 小时 (核心迁移)
- **第二阶段**: 4-6 小时 (全面测试)
- **第三阶段**: 1-2 小时 (清理工作)
- **总计**: 7-11 小时

## 🧪 测试清单

- [ ] 候选池 CRUD 操作正常
- [ ] 任务生成和状态更新正常
- [ ] 模板管理功能正常
- [ ] 限流检查功能正常
- [ ] 统计数据获取正常
- [ ] 健康检查功能正常
- [ ] 所有 Hook 正常工作
- [ ] 所有 UI 组件正常渲染
- [ ] 无 TypeScript 类型错误
- [ ] 无 console 错误或警告

## 🔍 验证方法

```typescript
// 验证服务可用性
const health = await preciseAcquisitionService.healthCheck();
console.log('服务健康状态:', health);

// 验证服务信息
const info = preciseAcquisitionService.getServiceInfo();
console.log('服务信息:', info);

// 验证核心功能
const targets = await preciseAcquisitionService.getWatchTargets({ limit: 5 });
console.log('候选池数据:', targets);
```

## 📞 支持与反馈

如遇到迁移问题，请：

1. 检查控制台错误日志
2. 确认导入路径正确
3. 验证类型定义匹配
4. 参考健康检查结果定位问题

---

**注意**: 此迁移是**向后兼容**的，旧代码暂时仍可工作，但建议尽快迁移以获得更好的性能和维护性。