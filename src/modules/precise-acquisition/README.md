# Precise Acquisition Module (精准获客系统)

> **模块前缀**: `precise-` / `Precise`  
> **别名路径**: `@precise-acquisition`  
> **核心职责**: 完整的精准获客自动化系统，包含候选池管理、任务执行、评论采集和审计追踪

---

## 📁 目录结构

```
src/modules/precise-acquisition/
├── domain/                    # 领域层
│   ├── entities/              # 领域实体
│   ├── value-objects/         # 值对象
│   └── public/                # 对外契约
├── application/               # 应用层
│   ├── usecases/              # 业务用例
│   └── orchestrators/         # 流程编排
├── services/                  # 服务层
├── api/                       # API 适配器
├── stores/                    # 状态管理
├── hooks/                     # React Hooks
├── components/                # UI 组件
├── candidate-pool/            # 候选池管理
├── task-engine/               # 任务引擎
├── task-execution/            # 任务执行
├── task-generation/           # 任务生成
├── comment-collection/        # 评论采集
├── audit-system/              # 审计系统
├── rate-control/              # 速率控制
├── rate-limit/                # 限流控制
├── reporting/                 # 报表系统
├── template-management/       # 模板管理
└── index.ts                   # 模块门牌导出
```

---

## 🎯 核心功能

### 1. 候选池管理 (Candidate Pool)
- **候选人筛选**: 智能筛选高质量候选目标
- **优先级排序**: 基于多维度评分的优先级管理
- **状态追踪**: 完整的候选人生命周期管理
- **批量操作**: 支持批量导入、导出、更新

### 2. 任务引擎 (Task Engine)
- **任务生成**: 自动生成获客任务
- **任务调度**: 智能任务调度和分配
- **任务执行**: 自动化任务执行引擎
- **进度监控**: 实时任务进度追踪

### 3. 评论采集 (Comment Collection)
- **智能采集**: 自动采集目标评论
- **内容分析**: 评论内容智能分析
- **数据清洗**: 自动去重和数据标准化
- **存储管理**: 高效的评论数据存储

### 4. 审计系统 (Audit System)
- **操作记录**: 完整的操作日志追踪
- **合规审计**: 符合数据安全规范
- **追溯查询**: 支持历史操作回溯
- **报表生成**: 自动生成审计报表

### 5. 速率控制 (Rate Control)
- **智能限流**: 防止请求过载
- **动态调整**: 根据系统负载动态调整速率
- **配额管理**: 支持多维度配额限制
- **告警机制**: 超限自动告警

---

## 📦 对外导出

```typescript
// 候选池管理
import { 
  CandidatePoolService,
  CandidateEntity,
  AddCandidateUseCase
} from '@precise-acquisition';

// 任务系统
import {
  TaskEngine,
  TaskExecutor,
  CreateTaskUseCase
} from '@precise-acquisition';

// 评论采集
import {
  CommentCollector,
  CommentAnalyzer,
  CollectCommentsUseCase
} from '@precise-acquisition';
```

---

## 🏗️ 架构特点

### 模块化设计
- 每个子系统独立封装
- 清晰的依赖边界
- 易于扩展和维护

### DDD 分层
```
UI/Components → Hooks → Application → Domain
                    ↓
                Services/API
```

### 命名规范
- 文件：`precise-candidate-pool-service.ts`
- 组件：`PreciseCandidateCard.tsx`
- 类型：`PreciseTaskStatus`

---

## 🚀 使用示例

### 1. 候选池管理

```typescript
import { CandidatePoolService, AddCandidateUseCase } from '@precise-acquisition';

// 添加候选人
const useCase = new AddCandidateUseCase();
const result = await useCase.execute({
  name: '张三',
  company: 'ABC科技',
  position: '技术总监',
  priority: 'high',
  source: 'linkedin'
});
```

### 2. 任务执行

```typescript
import { TaskEngine, TaskExecutor } from '@precise-acquisition';

// 创建并执行任务
const engine = new TaskEngine();
const task = await engine.createTask({
  type: 'outreach',
  targetId: 'candidate_123',
  template: 'template_001'
});

const executor = new TaskExecutor();
await executor.execute(task);
```

### 3. 评论采集

```typescript
import { CommentCollector } from '@precise-acquisition';

// 采集评论
const collector = new CommentCollector();
const comments = await collector.collect({
  targetUrl: 'https://...',
  maxCount: 100,
  filters: {
    minLength: 10,
    language: 'zh'
  }
});
```

---

## 🔒 依赖规则

### ✅ 允许
- Domain → 纯 TypeScript，无外部依赖
- Application → Domain
- Services → Domain, Application
- UI/Components → Application, Hooks, Stores

### ❌ 禁止
- Domain → UI/Services/API/Hooks
- Domain → React/Axios/Tauri
- 跨子系统直接调用内部实现

---

## 📊 数据流

```
用户操作 → UI组件 → Hooks → Application(UseCase)
                                    ↓
                            Domain(业务逻辑)
                                    ↓
                          Services(数据持久化)
                                    ↓
                          API(后端/数据库)
```

---

## 🧪 测试

```bash
# 运行所有测试
npm test src/modules/precise-acquisition

# 测试特定子系统
npm test precise-acquisition/candidate-pool
npm test precise-acquisition/task-engine
npm test precise-acquisition/comment-collection
```

---

## 📈 性能优化

### 批量处理
- 候选人批量导入优化
- 任务批量执行
- 评论批量采集

### 缓存策略
- 候选池数据缓存
- 模板缓存
- 评论数据缓存

### 异步处理
- 任务异步执行
- 评论异步采集
- 审计日志异步写入

---

## 🔧 配置

```typescript
// 速率控制配置
const rateConfig = {
  maxRequestsPerMinute: 60,
  burstSize: 10,
  retryStrategy: 'exponential'
};

// 任务引擎配置
const taskConfig = {
  maxConcurrentTasks: 5,
  taskTimeout: 30000,
  retryAttempts: 3
};
```

---

## 📚 子系统文档

- [候选池管理](./candidate-pool/README.md)
- [任务引擎](./task-engine/README.md)
- [评论采集](./comment-collection/README.md)
- [审计系统](./audit-system/README.md)
- [速率控制](./rate-control/README.md)

---

## 🤝 贡献指南

### 添加新功能
1. 在对应子系统目录下创建
2. 遵循 DDD 分层架构
3. 使用模块前缀命名
4. 通过 `index.ts` 导出
5. 编写单元测试
6. 更新文档

### 代码规范
- 必须包含三行文件头
- 使用 TypeScript 严格模式
- 遵循命名规范
- 保持 Domain 层纯净

---

## 🐛 故障排查

### 常见问题
1. **任务执行失败**: 检查速率限制和网络连接
2. **候选池同步问题**: 验证数据库连接
3. **评论采集中断**: 检查目标站点可访问性

---

**最后更新**: 2025-10-26  
**维护者**: @团队  
**版本**: 2.0.0
