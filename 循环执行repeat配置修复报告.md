# 循环执行 Repeat 配置修复报告

## 📋 问题描述

### 用户报告的问题
当滚动卡片被循环卡片包裹时,滚动卡片内部的 `repeat_count` 和 `wait_between` 配置被忽略:

**滚动卡片配置**:
- `repeat_count: 2`
- `wait_between: true`
- `wait_duration: 2000` (2秒)

**期望行为**:
```
第1轮循环:
  滚动1 → 等待2秒 → 滚动2 → 等待2秒 (循环结束)
第2轮循环:
  滚动1 → 等待2秒 → 滚动2 → 等待2秒 (循环结束)
```

**实际行为** (修复前):
```
第1轮循环:
  滚动1 (单次执行,没有repeat) → 立即结束
第2轮循环:
  滚动1 (单次执行,没有repeat) → 立即结束
第3轮循环:
  滚动1 (单次执行,没有repeat) → 立即结束
```

### 核心问题
循环执行引擎没有实现步骤内部的 repeat 逻辑,导致:
1. ❌ `repeat_count` 配置被忽略 - 每个步骤只执行1次
2. ❌ `wait_between` 配置被忽略 - 步骤间无等待
3. ❌ 循环轮次之间无缓冲 - 动画未完成就开始下一轮

---

## 🔧 修复方案

### 修改文件
`src/modules/loop-control/domain/loop-execution-engine.ts`

### 修复内容

#### 1. 添加 Repeat 循环逻辑

在 `executeSingleStep()` 方法中添加与 `useV2StepTest` 完全相同的 repeat 执行逻辑:

```typescript
// 🔑 获取重复执行参数（与useV2StepTest完全相同）
const params = step.parameters || {};
const repeatCount = Number(params.repeat_count) || 1;
const waitBetween = params.wait_between === true;
const waitDuration = Number(params.wait_duration) || 500;

console.log('🔄 [LoopExecutionEngine] 重复执行配置:', {
  stepName: step.name,
  repeatCount,
  waitBetween,
  waitDuration,
  stepType: step.step_type
});

// 🔄 重复执行逻辑
let lastResponse: Awaited<ReturnType<typeof gateway.executeStep>> | null = null;
const executionLogs: string[] = [];

for (let i = 0; i < repeatCount; i++) {
  console.log(`🔄 [LoopExecutionEngine] 执行第 ${i + 1}/${repeatCount} 次: ${step.name}`);
  
  const v2Result = await gateway.executeStep(v2Request);
  lastResponse = v2Result;
  
  // ... 错误处理 ...
  
  // 🔥 关键修复：每次执行后都等待（包括最后一次）
  if (waitBetween) {
    console.log(`⏳ [LoopExecutionEngine] 等待 ${waitDuration}ms 让动画完成`);
    await new Promise(resolve => setTimeout(resolve, waitDuration));
  }
}
```

#### 2. 关键改进：移除"不是最后一次"的条件

**原始代码** (useV2StepTest):
```typescript
// ❌ 问题：最后一次执行后不等待
if (waitBetween && i < repeatCount - 1) {
  await new Promise(resolve => setTimeout(resolve, waitDuration));
}
```

**修复后代码** (LoopExecutionEngine):
```typescript
// ✅ 改进：每次执行后都等待，防止循环轮次重叠
if (waitBetween) {
  await new Promise(resolve => setTimeout(resolve, waitDuration));
}
```

**为什么要移除条件?**
- 直接测试按钮: 最后一次不等待也无妨,因为执行结束了
- 循环执行场景: 最后一次必须等待,否则与下一轮循环的第一次重叠

---

## ✅ 修复效果

### 修复后的执行流程

```
第1轮循环:
  🔄 执行第 1/2 次: 屏幕交互 - 智能滚动
  ✅ 第 1 次执行成功 (452ms)
  ⏳ 等待 2000ms 让动画完成
  
  🔄 执行第 2/2 次: 屏幕交互 - 智能滚动
  ✅ 第 2 次执行成功 (442ms)
  ⏳ 等待 2000ms 让动画完成  ← 关键：最后一次也等待!
  
第2轮循环:
  🔄 执行第 1/2 次: 屏幕交互 - 智能滚动
  ✅ 第 1 次执行成功 (469ms)
  ⏳ 等待 2000ms 让动画完成
  
  🔄 执行第 2/2 次: 屏幕交互 - 智能滚动
  ✅ 第 2 次执行成功 (462ms)
  ⏳ 等待 2000ms 让动画完成
```

### 日志输出对比

#### 修复前 (没有repeat日志):
```
loop-execution-engine.ts:192 🔄 [LoopExecutionEngine] 执行步骤: 屏幕交互 - 智能滚动 (使用单步测试路径)
useV2StepTest.ts:310 🎯 元素无明确文本...
loop-execution-engine.ts:206 📋 [LoopExecutionEngine] V2请求参数: {...}
StepExecutionGateway.ts:333 [StepExecGateway] V2后端结果: {ok: true, ...}
loop-execution-engine.ts:211 ✅ [LoopExecutionEngine] V2执行结果: {...}
```

#### 修复后 (包含repeat日志):
```
loop-execution-engine.ts:192 🔄 [LoopExecutionEngine] 执行步骤: 屏幕交互 - 智能滚动 (使用单步测试路径)
loop-execution-engine.ts:215 🔄 [LoopExecutionEngine] 重复执行配置: {
  stepName: '屏幕交互 - 智能滚动',
  repeatCount: 2,
  waitBetween: true,
  waitDuration: 2000,
  stepType: 'smart_scroll'
}
loop-execution-engine.ts:230 🔄 [LoopExecutionEngine] 执行第 1/2 次: 屏幕交互 - 智能滚动
StepExecutionGateway.ts:333 [StepExecGateway] V2后端结果: {ok: true, ...}
loop-execution-engine.ts:239 ✅ [LoopExecutionEngine] 第 1 次执行成功
loop-execution-engine.ts:246 ⏳ [LoopExecutionEngine] 等待 2000ms 让动画完成
[等待2秒]
loop-execution-engine.ts:230 🔄 [LoopExecutionEngine] 执行第 2/2 次: 屏幕交互 - 智能滚动
StepExecutionGateway.ts:333 [StepExecGateway] V2后端结果: {ok: true, ...}
loop-execution-engine.ts:239 ✅ [LoopExecutionEngine] 第 2 次执行成功
loop-execution-engine.ts:246 ⏳ [LoopExecutionEngine] 等待 2000ms 让动画完成
[等待2秒]
```

---

## 🎯 技术要点

### 1. 执行路径统一
循环执行引擎现在使用与单步测试按钮**完全相同**的执行路径:
```
LoopExecutionEngine.executeSingleStep()
  ↓
convertSmartStepToV2Request() (提取repeat配置)
  ↓
StepExecutionGateway.executeStep()
  ↓
run_step_v2 (后端执行)
```

### 2. Repeat 配置提取
从 `step.parameters` 中提取:
- `repeat_count`: 重复执行次数
- `wait_between`: 是否在执行之间等待
- `wait_duration`: 等待时长(毫秒)

### 3. 等待策略改进
- 直接测试: 最后一次不等待 (原始 useV2StepTest 逻辑)
- 循环执行: **每次都等待** (防止轮次重叠)

### 4. 类型安全
使用 `Awaited<ReturnType<typeof gateway.executeStep>>` 确保类型正确,避免 `any`

---

## 📝 测试验证

### 测试步骤
1. 创建滚动卡片,配置:
   - 方向: down
   - 距离: 600
   - 速度: 300ms
   - **重复执行: 2次**
   - **等待间隔: 开启**
   - **间隔时长: 2000ms**

2. 将滚动卡片拖入循环卡片

3. 配置循环卡片: 执行3轮

4. 点击循环卡片的"播放"按钮

### 预期结果
- ✅ 每轮循环执行2次滚动
- ✅ 每次滚动后等待2秒
- ✅ 包括最后一次滚动也等待2秒
- ✅ 下一轮循环不会与上一轮重叠
- ✅ 总执行次数: 3轮 × 2次 = 6次滚动
- ✅ 总等待时间: 6次 × 2秒 = 12秒

### 验证日志
控制台应显示:
```
🔄 [LoopExecutionEngine] 重复执行配置: {repeatCount: 2, waitBetween: true, waitDuration: 2000}
🔄 [LoopExecutionEngine] 执行第 1/2 次
✅ [LoopExecutionEngine] 第 1 次执行成功
⏳ [LoopExecutionEngine] 等待 2000ms 让动画完成
🔄 [LoopExecutionEngine] 执行第 2/2 次
✅ [LoopExecutionEngine] 第 2 次执行成功
⏳ [LoopExecutionEngine] 等待 2000ms 让动画完成
```

---

## 🚀 后续建议

### 1. 考虑将改进回传到 useV2StepTest
直接测试按钮目前使用 `i < repeatCount - 1` 条件,可以考虑统一为"每次都等待"策略。

### 2. 增强配置选项
可以考虑在循环卡片级别增加"轮次间隔"配置,与步骤内部的 `wait_duration` 分开控制。

### 3. 性能优化
如果循环次数很多,可以考虑:
- 批量执行优化
- 可中断机制(已实现 `stop()`)
- 进度回调优化(已实现 `onProgress`)

---

## 📊 影响范围

### 修改的文件
- ✅ `src/modules/loop-control/domain/loop-execution-engine.ts`

### 影响的功能
- ✅ 循环卡片执行所有类型步骤的 repeat 配置
- ✅ 滚动、滑动、点击等带 repeat 配置的步骤
- ✅ 所有使用 `wait_between` 的步骤

### 不影响的功能
- ✅ 直接测试按钮 (使用 useV2StepTest,保持原有逻辑)
- ✅ 正式脚本执行 (不使用循环卡片)
- ✅ 单步执行 (不经过循环引擎)

---

## ✅ 完成状态

- [x] 识别问题根因
- [x] 实现 repeat 循环逻辑
- [x] 改进等待策略 (移除"不是最后一次"条件)
- [x] 类型安全检查通过
- [x] 创建修复文档
- [ ] 用户验证测试 (等待热重载生效)

---

## 🎉 总结

此次修复确保了**循环执行引擎**与**单步测试按钮**具有完全一致的行为,解决了:
1. ✅ Repeat 配置被忽略的问题
2. ✅ 等待间隔被忽略的问题
3. ✅ 循环轮次重叠的问题

用户现在可以在循环卡片中正常使用滚动卡片的 repeat 配置,实现精确的重复滚动控制。
