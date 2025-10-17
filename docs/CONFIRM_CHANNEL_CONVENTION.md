# 单一确认通道约定文档

## 📋 概述

本项目采用 **XOR 确认通道约束**，确保 UI 组件只接受单一确认回调，避免双通道并发和逻辑混乱。

---

## 🎯 核心约定

### 1. 唯一确认通道

**UI 组件只接受以下之一**：
- `onQuickCreate`: 快速创建步骤（智能分析路径）
- `onConfirm`: 传统确认（向后兼容，仅适配层使用）

**编译期约束**：
```ts
// ✅ 正确：只传 onQuickCreate
<ElementSelectionPopover onQuickCreate={handleQuick} />

// ✅ 正确：只传 onConfirm（遗留代码）
<LegacyComponent onConfirm={handleConfirm} />

// ❌ 错误：同时传入两个 → TypeScript 编译错误
<Component onQuickCreate={handleQuick} onConfirm={handleConfirm} />
```

### 2. 返回值语义（用户约定）

确认回调函数返回值决定后续行为：

| 返回值 | 含义 | 行为 |
|--------|------|------|
| `true` / `void` / `undefined` | 成功并关闭 | 关闭弹层/模态框 |
| `false` | 成功但保持开启 | 保持弹层开启，等待补充信息 |
| `throw Error` | 失败 | 不关闭弹层，显示错误提示 |

**代码示例**：

```ts
import type { ConfirmFn } from '@/types/confirm-channel';

// ✅ 成功并关闭
const handleConfirm: ConfirmFn = async () => {
  await saveData();
  return true; // 或不返回（void）
};

// ✅ 成功但保持开启（需要补充信息）
const handlePartial: ConfirmFn = async () => {
  const result = await partialSave();
  if (result.needsMoreInfo) {
    return false; // 保持弹层，提示用户补充
  }
  return true; // 完成后关闭
};

// ✅ 失败不关闭
const handleValidate: ConfirmFn = async () => {
  const validation = await validate();
  if (!validation.ok) {
    throw new Error(validation.message); // 不关闭，显示错误
  }
  return true; // 验证通过，关闭
};
```

### 3. 并发防抖规则

**点击后立即进入 `submitting` 状态**：
- ✅ 按钮显示 Loading 状态
- ✅ 按钮禁用，防止重复点击
- ✅ 其他操作按钮同时禁用
- ✅ 请求完成后自动解除禁用（无论成功失败）

**实现保障**：
```tsx
const [submitting, setSubmitting] = useState(false);

<Button 
  loading={submitting}
  disabled={submitting || !effectiveConfirm}
  onClick={handleConfirm}
>
  确定
</Button>
```

### 4. 缓存策略（XML 快照）

**两层匹配策略**：

1. **严格匹配（优先）**：
   - 所有元数据字段必须一致
   - 页面签名、应用包名、Activity、URL 等

2. **宽松匹配（时间窗口内）**：
   - 在 **30 秒**内的缓存允许更宽松匹配
   - 只要核心标识（pageSignature 或 appPackage）一致即可
   - 适用于页面刷新、小改动等场景

**配置常量**：
```ts
import { XML_CACHE_MATCH_CONFIG } from '@/types/xml-cache';

// 可调整时间窗口
XML_CACHE_MATCH_CONFIG.RELAXED_TIME_WINDOW // 默认 30 秒
```

---

## 🔧 开发指南

### 新建组件时

1. **选择确认通道类型**：
   ```ts
   import { ConfirmChannel } from '@/types/confirm-channel';
   
   interface MyComponentProps extends ConfirmChannel {
     // 其他 props
   }
   ```

2. **提取有效回调**：
   ```ts
   import { useEffectiveConfirm } from '@/types/confirm-channel';
   
   const effectiveConfirm = useEffectiveConfirm(props);
   ```

3. **实现并发防抖**：
   ```ts
   const [submitting, setSubmitting] = useState(false);
   
   const handleConfirm = async () => {
     if (submitting || !effectiveConfirm) return;
     setSubmitting(true);
     try {
       const result = await effectiveConfirm();
       if (result !== false) closeModal();
     } catch (error) {
       message.error(error.message);
     } finally {
       setSubmitting(false);
     }
   };
   ```

### 迁移遗留代码

**适配层模式**（推荐）：
```tsx
// 适配层：消化遗留 onConfirm
const MyAdapter = ({ onConfirm, ...props }) => {
  const handleQuick = onConfirm; // 转换为 onQuickCreate
  return <ModernComponent onQuickCreate={handleQuick} {...props} />;
};
```

**不要**在 UI 层同时支持两个通道！

---

## 🧪 测试要求

每个使用确认通道的组件必须包含以下测试：

1. **双通道警告测试**：同时传入两个回调时发出警告
2. **返回 false 保持开启**：验证弹层不关闭
3. **抛错不关闭**：验证错误提示 + 按钮解除禁用
4. **并发防抖**：连续点击只触发一次
5. **无回调禁用**：未提供回调时按钮禁用

**测试模板**：参考 `__tests__/ElementSelectionPopover.test.tsx`

---

## 📊 遥测埋点

建议添加以下埋点（调试期超有用）：

```ts
// 事件名称
- quick_confirm_click    // 点击确定
- quick_confirm_success  // 成功（关闭）
- quick_confirm_kept_open // 成功但保持开启
- quick_confirm_failure  // 失败

// 携带属性
{
  channel: 'quick' | 'legacy',        // 渠道类型
  duration_ms: number,                // 耗时
  reason: 'false' | 'throw' | 'success', // 原因
  cache_hit: 'strict' | 'relaxed' | 'none', // 缓存命中
}
```

---

## ⚠️ 常见问题

### Q: 为什么同时传入两个回调会警告？
**A**: XOR 约束确保单一确认通道，避免逻辑混乱。编译期会报错，运行期只是兜底警告。

### Q: 返回 false 的使用场景？
**A**: 适用于"部分成功需要补充信息"的场景，如：
- 保存草稿成功，但需要用户确认最终提交
- 验证部分通过，提示用户补充缺失字段

### Q: 如何调整时间窗口大小？
**A**: 修改 `src/types/xml-cache.ts` 中的 `XML_CACHE_MATCH_CONFIG.RELAXED_TIME_WINDOW`

### Q: 遗留代码如何迁移？
**A**: 使用适配层模式，不要直接修改 UI 组件支持双通道。

---

## 📚 相关文件

- **类型定义**: `src/types/confirm-channel.ts`
- **XML 缓存**: `src/types/xml-cache.ts`
- **组件实现**: `src/components/universal-ui/element-selection/ElementSelectionPopover.tsx`
- **按钮组件**: `src/components/universal-ui/element-selection/components/PopoverActionButtons.tsx`
- **单元测试**: `src/components/universal-ui/element-selection/__tests__/ElementSelectionPopover.test.tsx`

---

## 🎯 检查清单

开发完成后，请确认：

- [ ] 组件使用 `ConfirmChannel` XOR 约束
- [ ] 使用 `useEffectiveConfirm` 提取回调
- [ ] 实现并发防抖（submitting 状态）
- [ ] 处理返回值语义（false/throw）
- [ ] 添加单元测试（至少 3 个场景）
- [ ] 错误提示统一使用 `message.error`
- [ ] 按钮禁用规则一致 (`disabled={submitting || !effectiveConfirm}`)

---

**维护者**: 前端团队  
**最后更新**: 2025-10-17  
**版本**: 1.0.0
