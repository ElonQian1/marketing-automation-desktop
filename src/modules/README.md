# 模块总览 (Modules Overview)

本文档提供项目中所有核心模块的概览和导航。

---

## 📦 核心业务模块

### 1. [Prospecting (精准获客)](./prospecting/README.md)
**职责**: 线索评分和筛选系统  
**前缀**: `prospecting-` / `Prospecting`  
**别名**: `@prospecting`

**核心功能**:
- 线索评分系统
- 候选筛选
- 获客策略管理

---

### 2. [Precise Acquisition (精准获客系统)](./precise-acquisition/README.md)
**职责**: 完整的精准获客自动化系统  
**前缀**: `precise-` / `Precise`  
**别名**: `@precise-acquisition`

**核心功能**:
- 候选池管理
- 任务引擎和执行
- 评论采集
- 审计系统
- 速率控制

---

### 3. [Script Builder (智能脚本构建器)](./script-builder/README.md)
**职责**: 可视化脚本构建系统  
**前缀**: `script-` / `Script`  
**别名**: `@script`

**核心功能**:
- 拖拽式脚本编辑
- 智能步骤卡片
- 脚本执行和监控

---

### 4. [Intelligent Strategy System (智能策略系统)](./intelligent-strategy-system/README.md)
**职责**: 智能元素识别和策略决策  
**前缀**: `strategy-` / `Strategy`  
**别名**: `@strategy`

**核心功能**:
- 多策略支持
- 自动降级机制
- 置信度计算
- 元素分析

---

### 5. [Contact Import (联系人导入)](./contact-import/README.md)
**职责**: 联系人批量导入和管理  
**前缀**: `contact-` / `Contact`  
**别名**: `@contact`

**核心功能**:
- VCF 文件解析
- 批量导入
- 联系人去重
- 数据验证

---

### 6. [ADB (Android Debug Bridge)](./adb/README.md)
**职责**: ADB 设备管理和操作  
**前缀**: `adb-` / `Adb`  
**别名**: `@adb`

**核心功能**:
- 设备连接管理
- 命令执行
- UI Dump 获取
- 设备诊断

---

### 7. [Universal UI (通用 UI 系统)](./universal-ui/README.md)
**职责**: 通用 UI 组件和智能策略系统  
**前缀**: `universal-` / `Universal`  
**别名**: `@universal-ui`

**核心功能**:
- 智能分析工作流
- 策略选择器
- 步骤卡片系统
- 元素选择器

---

## 🔧 辅助模块

### 8. [Marketing (营销模块)](./marketing/README.md)
**职责**: 营销自动化核心功能  
**前缀**: `marketing-` / `Marketing`  
**别名**: `@marketing`

---

### 9. [Loop Control (循环控制)](./loop-control/README.md)
**职责**: 高级循环控制能力  
**前缀**: `loop-` / `Loop`  
**别名**: `@loop-control`

---

### 10. [Action System (动作系统)](./action-system/README.md)
**职责**: 自动化动作执行系统  
**前缀**: `action-` / `Action`  
**别名**: `@action`

---

### 11. [AI Module (AI 集成)](./ai/README.md)
**职责**: AI 能力集成  
**前缀**: `ai-` / `AI`  
**别名**: `@ai`

---

### 12. Enhanced Matching (增强匹配)
**职责**: 高级元素匹配算法  
**前缀**: `enhanced-` / `Enhanced`

---

### 13. Deduplication Control (去重控制)
**职责**: 数据去重系统  
**前缀**: `dedup-` / `Dedup`

---

## 🏗️ 架构原则

### DDD 分层架构
所有模块遵循统一的 DDD 分层结构：

```
src/modules/<module>/
├── domain/              # 领域层（纯业务逻辑）
│   ├── entities/        # 实体
│   ├── value-objects/   # 值对象
│   ├── strategies/      # 策略（内部）
│   └── public/          # 对外契约
├── application/         # 应用层（用例编排）
│   └── usecases/        # 用例
├── services/            # 服务层（基础设施）
├── api/                 # API 适配器
├── stores/              # 状态管理
├── hooks/               # React Hooks
├── ui/                  # UI 组件
├── pages/               # 页面
└── index.ts             # 门牌导出
```

### 依赖规则

```
Domain ← Application ← Services
   ↑         ↑           ↑
   |         |           |
   └─────────┴───────────┴─── UI/Hooks/Pages
```

**核心原则**:
- Domain 层纯净，无外部依赖
- Application 编排 Domain
- Services 处理 I/O
- UI 只依赖 Application 和 Hooks

---

## 📝 命名规范

### 文件命名
```typescript
// 格式：<module-prefix>-<layer>-<name>.ts
prospecting-strategy-weighted.ts
contact-service-importer.ts
adb-adapter-device.ts
```

### 组件命名
```typescript
// 格式：<ModulePrefix><ComponentName>.tsx
ProspectingLeadCard.tsx
ContactImportWizard.tsx
AdbDeviceMonitor.tsx
```

### 类型命名
```typescript
// 格式：<ModulePrefix><TypeName>
type ProspectingLeadScore = ...
type ContactImportConfig = ...
type AdbDeviceInfo = ...
```

---

## 🚀 快速开始

### 1. 导入模块
```typescript
// 使用路径别名（推荐）
import { BuildLeadScoreUseCase } from '@prospecting';
import { TaskEngine } from '@precise-acquisition';
import { StrategyDecisionEngine } from '@strategy';

// 或使用完整路径
import { BuildLeadScoreUseCase } from 'src/modules/prospecting';
```

### 2. 使用用例
```typescript
// 业务用例通过 Application 层提供
const useCase = new BuildLeadScoreUseCase();
const result = await useCase.execute(params);
```

### 3. 使用 Hooks
```typescript
// UI 层通过 Hooks 访问功能
import { useProspecting } from '@prospecting';

function MyComponent() {
  const { score, calculate } = useProspecting();
  // ...
}
```

---

## 📚 相关文档

- [项目架构规范](../../docs/architecture/overview.md)
- [DDD 开发指南](../../docs/architecture/ddd-guidelines.md)
- [模块开发规范](../../.github/copilot-instructions.md)
- [命名规范](../../docs/conventions/naming.md)

---

## 🤝 贡献指南

### 创建新模块
1. 在 `src/modules/` 创建模块目录
2. 遵循 DDD 分层结构
3. 创建 `index.ts` 门牌导出
4. 配置路径别名（tsconfig.json）
5. 编写 README 文档
6. 添加单元测试

### 模块间通信
- 只通过 `index.ts` 导出的公开 API
- 不直接访问其他模块的内部实现
- 使用依赖注入处理模块间依赖

---

## 📊 模块依赖图

```
┌─────────────────────┐
│  UI/Pages/Hooks     │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Application       │◄──────────────┐
└──────────┬──────────┘               │
           │                           │
┌──────────▼──────────┐     ┌─────────┴────────┐
│      Domain         │     │    Services      │
└─────────────────────┘     └──────────────────┘
```

---

**最后更新**: 2025-10-26  
**维护者**: @团队
