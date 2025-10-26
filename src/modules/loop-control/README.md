# Loop Control Module (循环控制模块)

> **模块前缀**: `loop-` / `Loop`  
> **别名路径**: `@loop-control`  
> **核心职责**: 提供高级循环控制能力，支持复杂的循环逻辑和条件判断

---

## 📁 目录结构

```
src/modules/loop-control/
├── domain/              # 领域层
│   ├── entities/        # 循环实体
│   ├── strategies/      # 循环策略
│   └── public/          # 对外契约
├── application/         # 应用层
├── services/            # 服务层
├── ui/                  # UI 组件
└── index.ts             # 模块门牌导出
```

---

## 🎯 核心功能

### 1. 循环类型
- **固定次数循环**: 指定循环次数
- **条件循环**: 基于条件判断
- **遍历循环**: 遍历列表元素
- **无限循环**: 手动终止

### 2. 循环控制
- **Break**: 跳出循环
- **Continue**: 跳过当前迭代
- **嵌套循环**: 支持多层嵌套
- **异常处理**: 循环中的错误处理

### 3. 性能优化
- 循环并发控制
- 批量处理优化
- 进度监控

---

## 📦 对外导出

```typescript
import {
  LoopController,
  LoopStrategy,
  ExecuteLoopUseCase
} from '@loop-control';
```

---

## 🚀 使用示例

### 固定次数循环
```typescript
const controller = new LoopController({
  type: 'fixed',
  iterations: 10,
  steps: [...]
});

await controller.execute();
```

### 条件循环
```typescript
const controller = new LoopController({
  type: 'conditional',
  condition: (context) => context.hasMore,
  maxIterations: 100,
  steps: [...]
});

await controller.execute();
```

### 遍历循环
```typescript
const controller = new LoopController({
  type: 'foreach',
  items: contactList,
  steps: [...]
});

await controller.execute();
```

---

## 🔧 循环配置

```typescript
interface LoopConfig {
  type: 'fixed' | 'conditional' | 'foreach' | 'infinite';
  maxIterations?: number;
  breakOnError?: boolean;
  delay?: number;
  parallel?: boolean;
  concurrency?: number;
}
```

---

## 📚 相关文档

- [循环控制最佳实践](../../../docs/loop-control-best-practices.md)
- [性能优化指南](../../../docs/loop-performance.md)

---

**最后更新**: 2025-10-26  
**维护者**: @团队
