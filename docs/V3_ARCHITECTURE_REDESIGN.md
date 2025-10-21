# V3模块架构重新设计

## 🎯 目标
重新设计V3执行引擎，解决现有的类型不匹配、接口不一致等问题，创建一个清洁、可扩展的架构。

## 🏗️ 核心架构原则

### 1. 统一类型系统
```rust
// 统一的执行结果类型
pub struct ExecutionResult {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
    pub scores: Option<Vec<StepScore>>,
    pub execution_time_ms: u64,
}

// 统一的事件协议
pub struct ProgressEvent {
    pub phase: ProgressPhase,
    pub progress: f64,
    pub message: String,
    pub device_id: String,
    pub step_id: Option<String>,
    pub data: Option<serde_json::Value>,
}
```

### 2. 模块化设计
```
src/exec/v3/
├── core/              # 核心执行引擎
│   ├── executor.rs    # 统一执行器接口
│   ├── context.rs     # 执行上下文
│   └── result.rs      # 结果处理
├── engines/           # 具体执行引擎
│   ├── single_step.rs # 单步执行
│   ├── chain.rs       # 链式执行
│   └── static_exec.rs # 静态执行
├── types/             # 类型定义
│   ├── specs.rs       # 规格定义
│   ├── events.rs      # 事件类型
│   └── results.rs     # 结果类型
├── commands/          # Tauri命令
│   └── mod.rs         # 统一命令接口
└── mod.rs
```

### 3. 统一接口设计
```rust
#[async_trait]
pub trait V3Executor {
    type Spec;
    type Context;
    
    async fn execute(
        &self,
        app: &AppHandle,
        context: &Self::Context,
        spec: &Self::Spec,
    ) -> anyhow::Result<ExecutionResult>;
    
    async fn validate_spec(&self, spec: &Self::Spec) -> anyhow::Result<()>;
}
```

## 🔧 实现计划

### Phase 1: 核心类型重构
1. **统一事件系统** - 解决7参数vs4参数问题
2. **规范错误处理** - 统一使用anyhow::Result
3. **完善规格定义** - 确保所有Spec包含必要字段

### Phase 2: 执行引擎重构
1. **抽象执行器接口** - 定义统一的Executor trait
2. **重构单步执行** - 基于新接口实现
3. **重构链式执行** - 智能评分和短路逻辑
4. **重构静态执行** - 定位器统一管理

### Phase 3: 集成测试
1. **端到端测试** - 确保各执行器正常工作
2. **性能测试** - 验证执行效率
3. **错误处理测试** - 验证异常情况处理

## 📋 具体任务

### 1. 事件系统统一
```rust
// 新的事件发射接口
pub async fn emit_progress(
    app: &AppHandle,
    device_id: &str,
    phase: ProgressPhase,
    progress: f64,
    message: &str,
    step_id: Option<&str>,
    data: Option<serde_json::Value>,
) -> anyhow::Result<()>
```

### 2. 规格定义完善
```rust
pub struct StaticSpecV3 {
    pub strategy_id: String,
    pub step_id: String,
    pub locators: StaticLocators,
    pub timeout_ms: Option<u64>,
    pub retry_count: Option<u32>,
}

pub struct StaticLocators {
    pub xpath: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<String>,
    pub bounds: Option<(i32, i32, i32, i32)>,
}
```

### 3. 上下文管理
```rust
pub struct ExecutionContext {
    pub device_id: String,
    pub session_id: String,
    pub constraints: ExecutionConstraints,
    pub metadata: HashMap<String, serde_json::Value>,
}

pub struct ExecutionConstraints {
    pub timeout_ms: u64,
    pub max_retries: u32,
    pub require_screen_change: bool,
}
```

## 🚀 迁移策略

1. **创建新模块** - 在v3_new目录下实现新架构
2. **渐进式替换** - 逐个替换现有组件
3. **保持兼容** - 确保API向后兼容
4. **清理旧代码** - 删除过时的实现

## ✅ 验收标准

1. ✅ 编译无错误、无警告
2. ✅ 所有测试通过
3. ✅ 事件系统参数一致
4. ✅ 错误处理统一
5. ✅ 接口设计清晰
6. ✅ 性能不劣化

## 🎉 预期收益

1. **代码质量**：消除类型错误和接口不一致
2. **可维护性**：清晰的模块划分和统一接口
3. **可扩展性**：易于添加新的执行引擎
4. **稳定性**：统一的错误处理和验证机制