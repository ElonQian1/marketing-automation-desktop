# Prospecting Module (精准获客模块)

> **模块前缀**: `prospecting-` / `Prospecting`  
> **别名路径**: `@prospecting`  
> **核心职责**: 精准获客系统，基于 DDD 架构实现的线索评分和筛选系统

---

## 📁 目录结构

```
src/modules/prospecting/
├── domain/              # 领域层（纯业务逻辑）
│   ├── entities/        # 领域实体
│   ├── value-objects/   # 值对象
│   ├── strategies/      # 策略实现（内部）
│   └── public/          # 对外契约
├── application/         # 应用层（用例编排）
│   └── usecases/        # 业务用例
├── services/            # 服务层（基础设施）
├── hooks/               # React Hooks
├── ui/                  # UI 组件
└── index.ts             # 模块门牌导出
```

---

## 🎯 核心功能

### 1. 线索评分系统
- 基于多维度权重的线索评分算法
- 支持自定义评分策略
- 实时计算线索质量得分

### 2. 候选筛选
- 智能筛选高质量线索
- 多条件组合过滤
- 优先级排序

### 3. 获客策略
- 加权策略（Weighted Strategy）
- 规则引擎支持
- 灵活的策略配置

---

## 📦 对外导出

```typescript
// 从模块根导入（推荐）
import { 
  BuildLeadScoreUseCase,      // 构建线索评分用例
  ProspectingEntity,           // 获客实体
  ProspectingValueObject       // 值对象
} from '@prospecting';

// 或使用完整路径
import { BuildLeadScoreUseCase } from 'src/modules/prospecting';
```

---

## 🏗️ 架构原则

### DDD 分层
- **Domain**: 纯业务逻辑，无外部依赖
- **Application**: 用例编排，协调领域对象
- **Services**: 基础设施，数据持久化、外部 API
- **UI**: 展示层，只依赖 application 和 hooks

### 命名规范
- 文件：`prospecting-strategy-weighted.ts`
- 组件：`ProspectingLeadCard.tsx`
- 类型：`ProspectingLeadScore`

---

## 🚀 使用示例

```typescript
// 1. 导入用例
import { BuildLeadScoreUseCase } from '@prospecting';

// 2. 执行线索评分
const useCase = new BuildLeadScoreUseCase();
const score = await useCase.execute({
  leadId: 'lead_123',
  criteria: {
    industry: '科技',
    companySize: 500,
    engagement: 'high'
  }
});

console.log('线索得分:', score.value);
console.log('评分详情:', score.breakdown);
```

---

## 🔒 依赖规则

### ✅ 允许
- Domain → 无外部依赖（纯 TypeScript）
- Application → Domain
- Services → Domain, Application
- UI → Application, Hooks

### ❌ 禁止
- Domain → UI/Services/API
- Domain → React/Axios/Tauri

---

## 📝 开发指南

### 添加新策略
1. 在 `domain/strategies/` 创建策略文件
2. 实现策略接口
3. 在 `domain/public/` 导出契约
4. 更新 `index.ts` 门牌导出

### 添加新用例
1. 在 `application/usecases/` 创建用例类
2. 编排领域对象完成业务流程
3. 在 `index.ts` 中导出

---

## 🧪 测试

```bash
# 运行模块测试
npm test src/modules/prospecting

# 运行特定测试文件
npm test prospecting-strategy-weighted.test.ts
```

---

## 📚 相关文档

- [DDD 架构规范](../../../docs/architecture/ddd-guidelines.md)
- [模块开发规范](../../../.github/copilot-instructions.md)
- [精准获客系统设计](../../../docs/design/prospecting-system.md)

---

## 🤝 贡献

遵循项目内规：
1. 文件必须包含三行文件头
2. 使用模块前缀命名
3. 通过 `index.ts` 门牌导出
4. Domain 层保持纯净

---

**最后更新**: 2025-10-26  
**维护者**: @团队
