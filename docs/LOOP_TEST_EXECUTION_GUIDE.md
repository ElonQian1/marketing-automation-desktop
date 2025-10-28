# 循环测试执行系统 - 使用指南

## 🎯 功能概述

**循环测试执行系统**允许你单独测试循环内的步骤，而不需要执行整个脚本。

### 与"执行脚本"的对比

| 功能 | 执行脚本 | 循环测试 |
|------|---------|---------|
| **范围** | 所有步骤 | 仅循环内步骤 |
| **目的** | 正式执行 | 测试调试 |
| **循环** | 按配置次数执行 | 可指定测试次数 |
| **副作用** | 真实操作 | 独立测试 |
| **状态** | 影响主脚本 | 不影响主脚本 |

---

## 📦 模块结构

```
src/modules/loop-control/
├── domain/
│   └── loop-execution-service.ts        # ✅ 循环执行服务
├── application/
│   └── use-loop-test-execution.ts       # ✅ 循环测试执行 Hook
└── ui/
    └── loop-test-button.tsx             # ✅ 循环测试按钮组件
```

---

## 🚀 快速开始

### 1️⃣ 基础使用

```tsx
import { useLoopTestExecution, LoopTestButton } from '@loop-control';

function LoopStartCard({ loopId, steps, deviceId }) {
  // ✅ 使用循环测试执行 Hook
  const {
    state,
    canStart,
    canStop,
    startTest,
    stopTest,
  } = useLoopTestExecution({
    steps,
    deviceId,
    onComplete: (success) => {
      if (success) {
        message.success('循环测试完成 ✅');
      } else {
        message.error('循环测试失败 ❌');
      }
    },
    onProgress: (progress, iteration) => {
      console.log(`进度: ${progress}%, 循环: ${iteration}`);
    },
  });

  return (
    <Card>
      <div className="loop-header">
        <Text>循环开始</Text>
        
        {/* ✅ 循环测试按钮 */}
        <LoopTestButton
          loopId={loopId}
          state={state}
          canStart={canStart}
          canStop={canStop}
          onStart={startTest}
          onStop={stopTest}
          showProgress  // 显示进度条
        />
      </div>
      
      <div className="loop-body">
        <Text>执行次数: {loopIterations}</Text>
      </div>
    </Card>
  );
}
```

### 2️⃣ 紧凑版按钮（只有图标）

```tsx
import { CompactLoopTestButton } from '@loop-control';

<CompactLoopTestButton
  loopId={loopId}
  state={state}
  canStart={canStart}
  canStop={canStop}
  onStart={startTest}
  onStop={stopTest}
/>
```

### 3️⃣ 带进度条的按钮

```tsx
import { LoopTestButtonWithProgress } from '@loop-control';

<LoopTestButtonWithProgress
  loopId={loopId}
  state={state}
  canStart={canStart}
  canStop={canStop}
  onStart={startTest}
  onStop={stopTest}
/>
```

---

## 📊 Hook API

### useLoopTestExecution

```typescript
const {
  state,           // 执行状态
  isRunning,       // 是否正在运行
  isIdle,          // 是否空闲
  canStart,        // 是否可以开始
  canStop,         // 是否可以停止
  startTest,       // 开始测试
  stopTest,        // 停止测试
  reset,           // 重置状态
  getDuration,     // 获取执行时长（毫秒）
  getCurrentStepInfo,  // 获取当前步骤信息
} = useLoopTestExecution({
  steps,           // 所有步骤
  deviceId,        // 当前设备ID
  onComplete,      // 完成回调
  onError,         // 错误回调
  onProgress,      // 进度回调
});
```

### LoopTestState

```typescript
interface LoopTestState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  loopId: string | null;
  loopName: string | null;
  currentIteration: number;     // 当前循环次数
  totalIterations: number;      // 总循环次数
  currentStepIndex: number;     // 当前步骤索引
  totalSteps: number;           // 总步骤数
  progress: number;             // 进度 (0-100)
  error: string | null;         // 错误信息
  startTime: number | null;     // 开始时间
  endTime: number | null;       // 结束时间
}
```

---

## 🎨 UI 组件

### LoopTestButton Props

```typescript
interface LoopTestButtonProps {
  loopId: string;              // 循环ID
  state: LoopTestState;        // 执行状态
  canStart: boolean;           // 是否可以开始
  canStop: boolean;            // 是否可以停止
  onStart: (loopId: string) => void;  // 开始回调
  onStop: () => void;          // 停止回调
  size?: 'small' | 'middle' | 'large';  // 按钮大小
  showProgress?: boolean;      // 是否显示进度条
  showText?: boolean;          // 是否显示文字
}
```

---

## 💡 使用场景

### 场景1：调试循环逻辑

```tsx
// 测试循环是否正常执行
<LoopTestButton
  loopId="loop_abc"
  state={state}
  canStart={canStart}
  canStop={canStop}
  onStart={startTest}
  onStop={stopTest}
  showProgress
/>

// 输出：
// ✅ 循环测试完成 (执行了3次)
// - 第1次循环：步骤1、步骤2、步骤3
// - 第2次循环：步骤1、步骤2、步骤3
// - 第3次循环：步骤1、步骤2、步骤3
```

### 场景2：验证循环次数

```tsx
// 测试循环5次是否正常
const { startTest } = useLoopTestExecution({
  steps,
  deviceId,
  onComplete: (success) => {
    if (success) {
      message.success('5次循环全部成功 ✅');
    }
  },
});

// 手动指定循环次数
<Button onClick={() => startTest('loop_abc', 5)}>
  测试5次循环
</Button>
```

### 场景3：监听执行进度

```tsx
const { startTest } = useLoopTestExecution({
  steps,
  deviceId,
  onProgress: (progress, iteration) => {
    console.log(`进度: ${progress}%`);
    console.log(`当前循环: ${iteration}`);
  },
  onComplete: (success) => {
    if (success) {
      message.success('测试完成');
    }
  },
});
```

### 场景4：错误处理

```tsx
const { startTest } = useLoopTestExecution({
  steps,
  deviceId,
  onError: (error) => {
    console.error('循环测试失败:', error);
    // 可以在这里记录日志或显示详细错误
  },
});
```

---

## 🔧 高级用法

### 1. 获取执行时长

```tsx
const { getDuration, state } = useLoopTestExecution({ ... });

// 执行完成后获取时长
useEffect(() => {
  if (state.status === 'completed') {
    const duration = getDuration();
    console.log(`执行耗时: ${duration}ms`);
  }
}, [state.status]);
```

### 2. 获取当前步骤信息

```tsx
const { getCurrentStepInfo, state } = useLoopTestExecution({ ... });

useEffect(() => {
  if (state.status === 'running') {
    const stepInfo = getCurrentStepInfo();
    if (stepInfo) {
      console.log(`当前: 第${stepInfo.iteration}次循环, 步骤: ${stepInfo.stepName}`);
    }
  }
}, [state.currentStepIndex]);
```

### 3. 手动控制执行

```tsx
const { startTest, stopTest, reset, state } = useLoopTestExecution({ ... });

// 开始测试
<Button onClick={() => startTest('loop_123')}>开始</Button>

// 停止测试
<Button onClick={stopTest} disabled={!canStop}>停止</Button>

// 重置状态
<Button onClick={reset}>重置</Button>
```

---

## ⚠️ 注意事项

### 1. 设备连接

```tsx
// ❌ 错误：没有连接设备
const { canStart } = useLoopTestExecution({
  steps,
  deviceId: undefined,  // 没有设备ID
});
// canStart = false

// ✅ 正确：已连接设备
const { canStart } = useLoopTestExecution({
  steps,
  deviceId: 'device_123',  // 有效的设备ID
});
// canStart = true
```

### 2. 无限循环

```tsx
// ❌ 不支持测试无限循环
<LoopCard loopConfig={{ iterations: -1 }} />

// 提示：不支持测试无限循环
// 解决：在测试时临时设置循环次数
startTest('loop_123', 3);  // 测试3次
```

### 3. 空循环

```tsx
// ❌ 循环内没有步骤
┌──────────────┐
│ 循环开始     │
│ 循环结束     │  ← 中间没有步骤
└──────────────┘

// 提示：循环内没有步骤
// 解决：添加至少一个步骤到循环内
```

### 4. 嵌套循环

```tsx
// ⚠️ 当前不支持嵌套循环测试
┌──────────────┐
│ 循环A 开始   │
│   循环B 开始 │  ← 嵌套循环
│   循环B 结束 │
│ 循环A 结束   │
└──────────────┘

// 提示：循环内包含其他循环标记
// 解决：分别测试每个循环
```

---

## 🎯 集成示例

### 完整的循环卡片组件

```tsx
import React from 'react';
import { Card, Space, Typography, Button, Tooltip, message } from 'antd';
import { RedoOutlined, SettingOutlined } from '@ant-design/icons';
import { useLoopTestExecution, LoopTestButton } from '@loop-control';

const { Text } = Typography;

interface LoopCardProps {
  loopId: string;
  loopName: string;
  loopIterations: number;
  steps: SmartScriptStep[];
  deviceId?: string;
}

export function LoopCard({
  loopId,
  loopName,
  loopIterations,
  steps,
  deviceId,
}: LoopCardProps) {
  // ✅ 循环测试执行 Hook
  const {
    state,
    canStart,
    canStop,
    startTest,
    stopTest,
    getDuration,
  } = useLoopTestExecution({
    steps,
    deviceId,
    onComplete: (success) => {
      if (success) {
        const duration = getDuration();
        message.success(`循环测试完成 (耗时: ${(duration / 1000).toFixed(2)}秒)`);
      }
    },
    onProgress: (progress, iteration) => {
      console.log(`进度: ${progress}%, 循环: ${iteration}/${state.totalIterations}`);
    },
  });

  return (
    <Card className="loop-card" size="small">
      {/* 顶部标题栏 */}
      <div className="loop-header">
        <Space size="small">
          <RedoOutlined />
          <Text strong>{loopName}</Text>
          <Text type="secondary">循环开始</Text>
        </Space>

        <Space size={4}>
          {/* ✅ 循环测试按钮 */}
          <LoopTestButton
            loopId={loopId}
            state={state}
            canStart={canStart}
            canStop={canStop}
            onStart={startTest}
            onStop={stopTest}
            showProgress
          />

          <Tooltip title="循环配置">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 循环配置区域 */}
      <div className="loop-body">
        <Space>
          <Text type="secondary">执行次数:</Text>
          <Text strong>{loopIterations}</Text>
        </Space>

        {/* 显示测试状态 */}
        {state.status === 'running' && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            正在测试... 第{state.currentIteration}/{state.totalIterations}次循环
          </Text>
        )}

        {state.status === 'completed' && (
          <Text type="success" style={{ fontSize: 12 }}>
            ✅ 测试完成 (耗时: {(getDuration() / 1000).toFixed(2)}秒)
          </Text>
        )}

        {state.status === 'error' && (
          <Text type="danger" style={{ fontSize: 12 }}>
            ❌ 测试失败: {state.error}
          </Text>
        )}
      </div>
    </Card>
  );
}
```

---

## 🔍 调试技巧

### 1. 查看执行序列

```typescript
import { LoopExecutionService } from '@loop-control';

// 构建执行序列
const sequence = LoopExecutionService.buildExecutionSequence(steps, loopId);

console.log('循环名称:', sequence?.loopName);
console.log('循环次数:', sequence?.totalIterations);
console.log('每次循环步骤数:', sequence?.stepsPerIteration);
console.log('总步骤数:', sequence?.steps.length);

// 查看每个步骤
sequence?.steps.forEach((s, i) => {
  console.log(`步骤${i + 1}: 第${s.iteration}次循环, ${s.step.name}`);
});
```

### 2. 验证执行序列

```typescript
const sequence = LoopExecutionService.buildExecutionSequence(steps, loopId);
if (sequence) {
  const validation = LoopExecutionService.validateExecutionSequence(sequence);
  
  if (!validation.valid) {
    console.error('验证失败:', validation.errors);
  }
}
```

### 3. 监听执行进度

```typescript
// 在 Hook 中已经自动监听了 'loop_test_progress' 事件
// 你也可以手动监听
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('loop_test_progress', (event) => {
  const { step_index, iteration } = event.payload;
  console.log(`当前: 第${iteration}次循环, 步骤 #${step_index + 1}`);
});
```

---

## 📚 相关文档

- 循环配对和角色切换：`docs/LOOP_AUTO_SWITCH_SYSTEM.md`
- 快速参考：`docs/LOOP_AUTO_SWITCH_QUICK_REFERENCE.md`
- 源码目录：`src/modules/loop-control/`
