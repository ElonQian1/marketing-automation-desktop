# V2 步骤执行系统 (Step Execution Gateway V2)

## 📋 概述

V2 步骤执行系统是当前生产环境使用的**主要执行引擎**，提供统一的步骤执行网关，支持智能策略匹配、元素选择和动作执行。

## 🏗️ 架构设计

### 核心组件

```
src/infrastructure/gateways/
├── StepExecutionGateway.ts      # ✅ 统一执行网关（主入口）
└── adapters/
    └── v2Adapter.ts              # V2 请求适配器
```

### 执行流程

```
前端步骤请求
    ↓
StepExecutionGateway (统一网关)
    ↓
v2Adapter (格式转换)
    ↓
Tauri Command: run_step_v2
    ↓
Rust 后端执行引擎
    ↓
返回执行结果
```

## 🎯 核心特性

### 1. 统一执行接口

```typescript
interface StepExecutionRequest {
  deviceId: string;               // 设备ID
  mode: ExecutionMode;            // 'match-only' | 'execute-step'
  actionParams: StepActionParams; // 步骤动作参数
  selectorId?: string;            // 元素选择器ID
  stepId?: string;                // 步骤ID（用于查询智能配置）
  bounds?: Bounds;                // 兜底坐标
  engineOverride?: ExecutionEngine; // 引擎覆盖设置
}
```

### 2. 执行模式

| 模式 | 说明 | 使用场景 |
|------|------|---------|
| `match-only` | 仅匹配元素，不执行动作 | 元素定位验证、预览 |
| `execute-step` | 匹配并执行动作 | 正式执行脚本步骤 |

### 3. 智能策略匹配

- **文本匹配**：基于元素文本内容匹配
- **位置匹配**：基于坐标和区域匹配
- **属性匹配**：基于元素属性（resource-id、class 等）
- **混合策略**：多种策略组合评分

### 4. 执行引擎切换

支持在运行时动态切换执行引擎（主要用于测试和对比）：

```typescript
// 全局配置
const gateway = new StepExecutionGateway({
  defaultEngine: 'v2',  // 默认使用 V2
  enableShadow: false   // 关闭影子执行
});

// 单步覆盖
const response = await gateway.executeStep({
  ...request,
  engineOverride: 'v2'  // 强制使用 V2
});
```

## 📦 后端实现

### Rust 命令

**文件**：`src-tauri/src/commands/run_step_v2.rs`

```rust
#[tauri::command]
pub async fn run_step_v2(
    device_id: String,
    request: RunStepRequestV2,
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<StepResponseV2, String>
```

### 核心功能

1. **智能元素匹配**
   - 使用策略引擎评分
   - 支持多候选元素排序
   - 置信度计算

2. **动作执行**
   - 点击（click）
   - 输入文本（input）
   - 滑动（swipe）
   - 等待（wait）

3. **结果验证**
   - 执行后验证
   - 状态检查
   - 错误处理

## 🔧 使用方法

### 1. 基础使用

```typescript
import { getStepExecutionGateway } from '@/infrastructure/gateways/StepExecutionGateway';

const gateway = getStepExecutionGateway();

const response = await gateway.executeStep({
  deviceId: 'emulator-5554',
  mode: 'execute-step',
  actionParams: {
    action: 'click',
    targetText: '登录按钮',
    actionId: 'step-001'
  }
});

if (response.success) {
  console.log('执行成功:', response.matched);
} else {
  console.error('执行失败:', response.message);
}
```

### 2. 在 Hook 中使用

```typescript
import { useV2StepTest } from '@/hooks/useV2StepTest';

function MyComponent() {
  const { executeStep, isExecuting, result } = useV2StepTest();

  const handleExecute = async () => {
    await executeStep(stepData, deviceId, 'execute-step');
  };

  return (
    <button onClick={handleExecute} disabled={isExecuting}>
      执行步骤
    </button>
  );
}
```

### 3. 在仓储中使用

```typescript
import { StepExecutionRepositoryV2 } from '@/infrastructure/repositories/StepExecutionRepositoryV2';

const repository = new StepExecutionRepositoryV2();

const result = await repository.executeStep({
  deviceId: 'emulator-5554',
  stepCard: stepData,
  mode: 'execute-step'
});
```

## 🎨 响应结构

```typescript
interface StepExecutionResponse {
  success: boolean;
  message: string;
  engine: ExecutionEngine;  // 'v2'
  
  // 匹配到的元素
  matched?: {
    id: string;
    score: number;           // 匹配评分 (0-100)
    confidence: number;      // 置信度 (0-1)
    bounds: Bounds;          // 元素边界
    text?: string;           // 元素文本
  };
  
  // 执行信息
  executedAction?: string;   // 已执行的动作
  verifyPassed?: boolean;    // 验证是否通过
  errorCode?: string;        // 错误代码
  logs?: string[];           // 执行日志
}
```

## 🔍 与 V1 的主要区别

| 特性 | V1 (已废弃) | V2 (当前) |
|------|------------|----------|
| 架构 | 单一执行路径 | 统一网关 + 适配器 |
| 策略匹配 | 简单匹配 | 智能多策略评分 |
| 元素选择 | 基础选择器 | 智能选择 + 置信度 |
| 错误处理 | 基础错误信息 | 详细错误码 + 日志 |
| 扩展性 | 低 | 高（支持适配器模式） |
| 类型安全 | 部分 | 完整 TypeScript 支持 |

## 📊 性能优化

### 1. 缓存策略

- 元素选择器缓存
- 策略评分结果缓存
- 设备状态缓存

### 2. 并发控制

- 单设备串行执行
- 多设备并行支持
- 执行队列管理

### 3. 资源管理

- 连接池复用
- 超时控制
- 自动重试机制

## 🐛 调试和诊断

### 启用详细日志

```typescript
// 在执行前启用调试模式
const gateway = getStepExecutionGateway();
gateway.enableDebugMode(true);

const response = await gateway.executeStep(request);

// 查看详细执行日志
console.log('执行日志:', response.logs);
```

### 常见问题

#### 1. 元素匹配失败

**原因**：
- 目标文本不准确
- 页面未加载完成
- 元素不在可见区域

**解决**：
```typescript
// 添加等待时间
actionParams: {
  action: 'click',
  targetText: '按钮',
  waitBefore: 1000,  // 执行前等待 1 秒
  retryCount: 3      // 失败重试 3 次
}
```

#### 2. 执行超时

**原因**：
- 网络延迟
- 设备响应慢
- 复杂页面渲染

**解决**：
```typescript
// 增加超时时间
const response = await gateway.executeStep(request, {
  timeout: 30000  // 30 秒超时
});
```

## 🚀 迁移到 V3

V3 执行系统正在开发中，提供更智能的策略分析。迁移指南：

1. **保持 V2 作为稳定版本**：继续使用 V2 进行生产环境执行
2. **逐步测试 V3**：在测试环境尝试 V3 的 `execute_chain_test_v3`
3. **对比验证**：使用特性开关进行 V2/V3 对比测试
4. **平滑迁移**：V3 稳定后通过配置切换，无需修改业务代码

```typescript
// 未来的迁移方式（配置切换）
import { getExecutionVersion } from '@/config/feature-flags';

const version = getExecutionVersion();  // 'v2' | 'v3'
// 网关会自动路由到正确的版本
```

## 📚 相关文档

- [V3 执行系统](../../../src-tauri/src/exec/v3/README.md) - 下一代智能执行引擎
- [智能策略系统](../../modules/intelligent-strategy-system/README.md) - 策略匹配详解
- [步骤卡片系统](../../modules/universal-ui/README.md) - 步骤卡片 UI 组件

## 📝 更新日志

### 2025-10-26
- ✅ 删除废弃的 V1 代码（TauriStepExecutionRepository, v1Adapter）
- ✅ V2 成为唯一稳定执行引擎
- 🚀 V3 开发中

### 2025-09-15
- ✅ 完成 V2 统一网关重构
- ✅ 添加 StepExecutionGateway
- ✅ 支持智能策略匹配

### 2025-08-20
- ✅ V2 首次发布
- ✅ 替代 V1 成为主要执行引擎
