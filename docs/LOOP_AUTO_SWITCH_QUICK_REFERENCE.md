# 循环卡片智能切换 - 快速参考

## 🎯 核心功能

### 1. 自动角色切换

```typescript
import { useLoopAutoSwitch } from '@loop-control';

const { triggerAutoSwitch } = useLoopAutoSwitch({
  steps: allSteps,
  onStepsUpdated: setSteps,
});

// 拖拽结束后调用
handleDragEnd = () => {
  // ... 更新步骤顺序
  triggerAutoSwitch(); // ✅ 自动检测并切换角色
};
```

### 2. 验证循环配对

```typescript
import { LoopPairingService } from '@loop-control';

// 检查所有配对是否有效
const errors = LoopPairingService.validatePairs(steps);
console.log(errors); // ["循环 'xxx' 位置错误..."]
```

### 3. 性能优化

```typescript
import { LoopCardPerformanceWrapper } from '@loop-control';

// ✅ 只在关键 props 变化时重新渲染
<LoopCardPerformanceWrapper
  step={step}
  index={index}
  onLoopConfigUpdate={handleUpdate}
  onDeleteLoop={handleDelete}
>
  {(props) => <LoopStartCard {...props} />}
</LoopCardPerformanceWrapper>
```

## 📋 API 速查

### LoopPairingService

| 方法 | 功能 | 返回值 |
|------|------|--------|
| `findAllPairs(steps)` | 查找所有循环配对 | `LoopPair[]` |
| `findPairByLoopId(steps, loopId)` | 查找指定循环 | `LoopPair \| null` |
| `validatePairs(steps)` | 验证配对有效性 | `string[]` (错误列表) |
| `hasNestedLoops(steps)` | 检测循环嵌套 | `boolean` |

### LoopRoleSwitchService

| 方法 | 功能 | 返回值 |
|------|------|--------|
| `autoSwitchRoles(steps)` | 自动切换所有错误配对 | `RoleSwitchResult` |
| `switchPairRoles(steps, loopId)` | 切换指定循环 | `SmartScriptStep[]` |

### useLoopAutoSwitch Hook

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `pairs` | `LoopPair[]` | 所有循环配对 |
| `hasInvalidPairs` | `boolean` | 是否有错误配对 |
| `hasNestedLoops` | `boolean` | 是否有嵌套循环 |
| `validationErrors` | `string[]` | 验证错误列表 |
| `triggerAutoSwitch` | `() => void` | 触发自动切换 |
| `switchLoopRoles` | `(loopId: string) => void` | 手动切换 |

## 🚀 典型使用场景

### 场景1：拖拽后自动修正

```typescript
const handleDragEnd = (result) => {
  // 1. 更新步骤顺序
  const newSteps = reorderSteps(steps, result);
  setSteps(newSteps);
  
  // 2. 自动检测并切换角色
  setTimeout(() => triggerAutoSwitch(), 100);
};
```

### 场景2：实时验证

```typescript
const { hasInvalidPairs, validationErrors } = useLoopAutoSwitch({
  steps,
  onStepsUpdated: setSteps,
  showWarnings: true,
});

// 显示警告
{hasInvalidPairs && (
  <Alert type="warning" message="循环位置错误" />
)}
```

### 场景3：手动修复

```typescript
const { switchLoopRoles } = useLoopAutoSwitch({ ... });

// 点击按钮手动切换
<Button onClick={() => switchLoopRoles('loop_123')}>
  修复循环
</Button>
```

## ⚡ 性能优化清单

- [ ] 使用 `React.memo` 包装循环卡片
- [ ] 使用 `useCallback` 稳定回调函数
- [ ] 使用 `useMemo` 缓存配对计算
- [ ] 拖拽结束后才触发切换（避免频繁更新）
- [ ] 使用 `LoopCardPerformanceWrapper` 组件

## 🔍 调试技巧

```typescript
// 1. 查看所有配对
const pairs = LoopPairingService.findAllPairs(steps);
console.table(pairs);

// 2. 检查验证错误
const errors = LoopPairingService.validatePairs(steps);
console.log('验证错误:', errors);

// 3. 模拟自动切换
const result = LoopRoleSwitchService.autoSwitchRoles(steps);
console.log('需要切换:', result.needsSwitch);
console.log('切换详情:', result.switchedSteps);
```

## 📝 注意事项

1. **loop_id 必须唯一**：确保每个循环配对有唯一的 `loop_id`
2. **拖拽后延迟切换**：给拖拽动画留时间（建议 100ms）
3. **性能监控**：大量步骤时注意配对计算性能
4. **嵌套循环**：确保内层循环完全包含在外层循环内

## 🎓 进阶使用

### 自定义验证逻辑

```typescript
const customValidate = (steps: SmartScriptStep[]) => {
  const pairs = LoopPairingService.findAllPairs(steps);
  
  return pairs.every(pair => {
    // 自定义规则：循环内必须有至少1个步骤
    const stepsInside = pair.endIndex - pair.startIndex - 1;
    return stepsInside > 0;
  });
};
```

### 批量修复

```typescript
const fixAllLoops = () => {
  const result = LoopRoleSwitchService.autoSwitchRoles(steps);
  
  if (result.needsSwitch) {
    setSteps(result.updatedSteps);
    message.success(`已修复 ${result.switchedSteps.length / 2} 个循环`);
  } else {
    message.info('所有循环位置正确');
  }
};
```

## 📚 相关文档

- 完整文档：`docs/LOOP_AUTO_SWITCH_SYSTEM.md`
- 源码目录：`src/modules/loop-control/`
- 类型定义：`src/types/loopScript.ts`
