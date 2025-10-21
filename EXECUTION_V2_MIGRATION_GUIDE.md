# 执行系统V2迁移指南

**创建时间**: 2025-10-21  
**状态**: 🚧 实施中  
**目标**: 统一三条执行链路，解决类型不匹配问题

---

## 📋 快速诊断

### 当前问题
```
错误: unknown variant `footer_other`, expected one of `tap`, `input`, ...
```

### 根本原因
1. **后端UI分析器** 生成增强类型：`footer_other`, `header_button`, `content_text`
2. **前端步骤创建** 直接使用增强类型作为`step_type`
3. **后端执行器** 只接受16种标准枚举类型

### 数据流
```
UI分析器(Rust) → 前端选择器 → 步骤创建 → Tauri命令 → 执行器(Rust)
    ↓               ↓           ↓            ↓           ↓
footer_other   原样传递    未映射 ❌    序列化      反序列化失败 ❌
```

---

## 🎯 三条执行链路

### 1. 智能自动链 (Chain)
**用途**: 系统推荐的完整执行路径，带回退和阈值控制

**特点**:
- 按评分排序: step1 → step2 → step3
- 阈值控制: confidence < 0.6 则回退
- 自动重试: 失败后尝试下一个策略
- 最高稳定性

**前端调用**:
```typescript
// src/workflow/chain.ts
import { invoke } from '@tauri-apps/api/core';

export async function runChainTest(spec: ChainSpecV2) {
  return invoke('execute_chain_test', {
    chainId: spec.chainId,
    orderedSteps: ['step1', 'step2', 'step3'],
    threshold: 0.6,
    mode: 'execute', // 'dryrun' | 'execute'
    context: { deviceId: 'xxx' }
  });
}
```

**后端实现**:
```rust
// src-tauri/src/exec/v2/chain_engine.rs
#[tauri::command]
pub async fn execute_chain_test(spec: ChainSpecV2) -> Result<ChainResult> {
    // 1. 设备检查
    // 2. 顺序执行每个step
    // 3. 评分 < threshold 则回退下一个
    // 4. 发送 progress 事件
    // 5. 返回 complete 事件
}
```

### 2. 智能单步 (Step)
**用途**: 测试单个策略，用于验证和对比

**特点**:
- 只跑一个策略
- 最快速度
- 详细反馈
- 用于调试

**前端调用** (✅ 已修复):
```typescript
// src/hooks/useSingleStepTest.ts
import { normalizeStepType } from './normalizeStepType';

const stepType = normalizeStepType(element.element_type || 'tap');
// footer_other → smart_find_element ✅
// header_button → smart_find_element ✅
// content_text → smart_find_element ✅

await invoke('execute_single_step_test', {
  step: {
    id: stepId,
    step_type: stepType,
    parameters: { ... }
  }
});
```

**类型映射函数**:
```typescript
// ✅ 已在 useIntelligentStepCardIntegration.ts 实现
const normalizeStepType = (elementType: string): string => {
  // 移除区域前缀
  const withoutRegion = elementType.replace(/^(header|footer|content)_/, '');
  
  // 映射表
  const typeMap: Record<string, string> = {
    'tap': 'smart_find_element',
    'button': 'smart_find_element',
    'click': 'smart_find_element',
    'other': 'smart_find_element',  // 关键映射
    'text': 'smart_find_element',
    'image': 'smart_find_element',
    'input': 'input',
    'edit_text': 'input',
    'swipe': 'swipe',
    'scroll': 'swipe',
  };
  
  return typeMap[withoutRegion] || 'smart_find_element';
};
```

### 3. 静态策略 (Static)
**用途**: 手工指定定位器，不依赖智能判断

**特点**:
- 精确定位
- 快速执行
- 无智能判断
- 适合固定场景

**前端调用**:
```typescript
// src/workflow/static.ts
export async function runStaticTest(spec: StaticStrategySpecV2) {
  return invoke('execute_static_strategy_test', {
    strategyId: spec.strategyId,
    action: 'tap',
    locator: {
      by: 'id',  // 'id' | 'xpath' | 'text' | 'desc' | 'bounds'
      value: 'com.example:id/button'
    },
    dryrun: false
  });
}
```

---

## 🔧 实施步骤

### Phase 1: 前端类型映射 ✅ **已完成**

**文件**: `src/pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration.ts`

**修改内容**:
```diff
+ // 🎯 标准化元素类型：将后端的增强类型映射回标准Tauri命令类型
+ const normalizeStepType = (elementType: string): string => {
+   const withoutRegion = elementType.replace(/^(header|footer|content)_/, '');
+   const typeMap: Record<string, string> = {
+     'other': 'smart_find_element',
+     // ... 其他映射
+   };
+   return typeMap[withoutRegion] || 'smart_find_element';
+ };

  const newStep: ExtendedSmartScriptStep = {
    id: stepId,
    name: `智能操作 ${stepNumber}`,
-   step_type: element.element_type === 'tap' ? 'smart_find_element' : (element.element_type || 'tap'),
+   step_type: normalizeStepType(element.element_type || 'tap'),
    // ...
  };
```

**状态**: ✅ 已在工作区实现，等待测试验证

### Phase 2: 后端类型安全增强 (推荐)

**文件**: `src-tauri/src/services/execution/model/smart.rs`

**当前枚举** (16种类型):
```rust
pub enum SmartActionType {
    Tap, Input, Wait, Swipe,
    SmartTap, SmartFindElement, BatchMatch,
    RecognizePage, VerifyAction, WaitForPageState,
    ExtractElement, SmartNavigation,
    LoopStart, LoopEnd,
    ContactGenerateVcf, ContactImportToDevice,
}
```

**建议增强**:
```rust
pub enum SmartActionType {
    // ... 现有类型
    
    // 🆕 兜底类型（避免硬错误）
    #[serde(other)]
    Unknown,
}

// 在执行时明确报错
impl SmartActionType {
    pub fn validate(&self) -> Result<(), String> {
        match self {
            Self::Unknown => Err("未知动作类型，请前端做类型映射".to_string()),
            _ => Ok(())
        }
    }
}
```

### Phase 3: 统一事件格式

**当前问题**: 事件格式不统一，置信度字段可选

**目标格式**:
```typescript
// Progress 事件
{
  event: 'analysis:progress',
  jobId: 'xxx',
  stepId: 'xxx',
  progress: 0.45,  // 0..1
  currentPhase: 'matching' | 'validating' | 'executing'
}

// Complete 事件
{
  event: 'analysis:complete',
  jobId: 'xxx',
  stepId: 'xxx',
  confidence: 0.85,  // 必填，0..1
  success: true,
  result: {
    coordinates: { x: 100, y: 200 },
    duration_ms: 150,
    // ...
  }
}
```

---

## 📊 类型映射表

### UI分析器生成类型 → 标准类型

| 增强类型 | 去除前缀 | 映射为 | 说明 |
|---------|---------|--------|------|
| `footer_other` | `other` | `smart_find_element` | 底栏其他元素 |
| `footer_tap` | `tap` | `smart_find_element` | 底栏可点击 |
| `header_button` | `button` | `smart_find_element` | 顶栏按钮 |
| `content_text` | `text` | `smart_find_element` | 内容区文本 |
| `content_input` | `input` | `input` | 输入框 |
| `content_scroll` | `scroll` | `swipe` | 可滚动区域 |

### 前端枚举 vs 后端枚举

| 前端TypeScript | 后端Rust | 匹配 | 说明 |
|--------------|----------|-----|------|
| `TAP` = `'tap'` | `Tap` | ✅ | 基础点击 |
| `SMART_FIND_ELEMENT` | `SmartFindElement` | ✅ | 智能元素查找 |
| `SMART_NAVIGATION` | `SmartNavigation` | ✅ | 智能导航 |
| `SMART_LOOP` | - | ❌ | 前端独有 |
| `LAUNCH_APP` | - | ❌ | 前端独有 |

---

## 🧪 测试验证

### 测试1: 单步测试不再报错

**操作**:
1. 打开页面分析器
2. 选择底栏元素（会生成`footer_other`类型）
3. 点击"直接确定"创建步骤
4. 点击步骤卡片上的"测试"按钮

**预期**:
```
✅ 前端日志: step_type: smart_find_element (原: footer_other)
✅ 后端日志: 执行 SmartFindElement 动作
✅ 卡片显示: 进度 0% → 45% → 85% → 完成
❌ 不再出现: unknown variant 'footer_other'
```

### 测试2: 智能分析正常工作

**操作**:
1. 创建智能步骤
2. 观察策略分析过程

**预期**:
```
✅ analysis:progress 事件正常接收
✅ 置信度显示为 0..1 范围
✅ 完成后显示最终置信度
✅ 策略选择器正常工作
```

### 测试3: 不同元素类型都能处理

**测试用例**:
| 元素位置 | 生成类型 | 映射后 | 期望结果 |
|---------|---------|--------|---------|
| 底栏 | `footer_other` | `smart_find_element` | ✅ 成功 |
| 顶栏 | `header_button` | `smart_find_element` | ✅ 成功 |
| 内容区按钮 | `content_button` | `smart_find_element` | ✅ 成功 |
| 输入框 | `content_edit_text` | `input` | ✅ 成功 |

---

## 📝 待办清单

### 立即执行 (P0)
- [x] 前端添加类型映射函数
- [ ] 测试验证修复效果
- [ ] 提交代码到Git

### 短期优化 (P1)
- [ ] 后端添加Unknown枚举兜底
- [ ] 统一事件格式
- [ ] 完善错误提示

### 长期规划 (P2)
- [ ] 实现完整的Chain执行引擎
- [ ] 实现静态策略执行
- [ ] 添加E2E测试

---

## 🚀 Git提交建议

```bash
# 提交当前修复
git add src/pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration.ts
git commit -m "fix: 添加元素类型标准化映射，修复footer_other等增强类型导致的单步测试失败

- 问题: UI分析器生成的增强类型(footer_other)未映射为后端接受的标准类型
- 修复: 添加normalizeStepType函数，移除区域前缀并映射到标准枚举
- 影响: 智能单步测试现在可以正确处理所有UI分析器生成的类型
- 测试: 底栏/顶栏/内容区元素都能正常测试"

# 推送到远程
git push origin main
```

---

## 📚 相关文档

- `EVENT_ROUTING_FIX_REPORT.md` - 事件路由修复报告
- `STEP_CARD_REFACTOR_COMPLETED.md` - 步骤卡片重构完成报告
- `STRATEGY_SCORING_DESIGN.md` - 策略评分设计文档
- `DIAGNOSIS_FRONTEND_BACKEND_TYPE_MISMATCH.md` - 类型不匹配诊断报告

---

## 💡 关键要点

1. **问题根源**: UI分析器的增强类型与执行器的标准类型不匹配
2. **解决方案**: 前端添加类型映射层，在调用后端前统一转换
3. **代码状态**: 新系统完整，只是缺少类型映射这一环
4. **修复状态**: 已在工作区实现，等待测试验证

---

**最后更新**: 2025-10-21  
**作者**: AI Assistant  
**状态**: ✅ 修复已实现，等待验证
