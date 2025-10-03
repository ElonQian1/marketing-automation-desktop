# Message 消息适配器使用指南

## 概述

Message 适配器提供统一的消息通知接口，支持 Ant Design 5.x 的动态主题特性。

## 📋 使用方式对比

### ✅ 推荐方式：使用 `useMessage()` Hook

**优点：**
- ✅ 支持动态主题（无警告）
- ✅ 符合 React Hooks 最佳实践
- ✅ 类型安全
- ✅ 与 Ant Design 5.x 完全兼容

**使用示例：**

```tsx
import { useMessage } from '@/components/adapters';

function MyComponent() {
  const message = useMessage();
  
  const handleClick = async () => {
    try {
      await doSomething();
      message.success('操作成功');
    } catch (error) {
      message.error(`操作失败: ${error}`);
    }
  };
  
  return <button onClick={handleClick}>执行操作</button>;
}
```

**在自定义 Hook 中使用：**

```tsx
import { useMessage } from '@/components/adapters';

export const useMyCustomHook = () => {
  const message = useMessage();
  
  const doSomething = async () => {
    message.loading('处理中...');
    // ... 业务逻辑
    message.success('完成');
  };
  
  return { doSomething };
};
```

### ⚠️ 兼容方式：静态 `message` API

**缺点：**
- ⚠️ 会触发 Ant Design 主题上下文警告
- ⚠️ 不支持动态主题切换
- ⚠️ 不推荐用于新代码

**使用示例（仅用于向后兼容）：**

```tsx
import { message } from '@/components/adapters';

// ⚠️ 会触发警告：Static function can not consume context like dynamic theme
function MyOldComponent() {
  const handleClick = () => {
    message.success('操作成功');
  };
  
  return <button onClick={handleClick}>执行操作</button>;
}
```

## 🔄 迁移指南

### 从 `antd` 迁移到 `useMessage()`

**Before (旧代码):**

```tsx
import { message } from 'antd';

function MyComponent() {
  const handleClick = () => {
    message.success('操作成功');
  };
  
  return <button onClick={handleClick}>点击</button>;
}
```

**After (新代码):**

```tsx
import { useMessage } from '@/components/adapters';

function MyComponent() {
  const message = useMessage();  // 添加这一行
  
  const handleClick = () => {
    message.success('操作成功');
  };
  
  return <button onClick={handleClick}>点击</button>;
}
```

### 从适配器静态 API 迁移

**Before:**

```tsx
import { message } from '@/components/adapters';

export const someFunction = () => {
  message.success('操作成功');
};
```

**After:**

```tsx
import { useMessage } from '@/components/adapters';

export const useSomeFunction = () => {
  const message = useMessage();
  
  return () => {
    message.success('操作成功');
  };
};
```

## 🎨 API 说明

### `useMessage()` Hook

返回上下文化的 message 实例，支持以下方法：

```typescript
interface MessageInstance {
  success(content: string): void;
  error(content: string): void;
  info(content: string): void;
  warning(content: string): void;
  loading(content: string): void;
  open(config: MessageConfig): void;
  destroy(key?: string): void;
}
```

### 使用示例

```tsx
const message = useMessage();

// 成功消息
message.success('保存成功');

// 错误消息
message.error('保存失败');

// 信息消息
message.info('这是一条提示');

// 警告消息
message.warning('请注意');

// 加载消息
message.loading('处理中...', 0); // 0 表示不自动关闭

// 自定义配置
message.open({
  type: 'success',
  content: '自定义消息',
  duration: 3,
});

// 手动关闭
const key = 'my-message';
message.loading({ content: '处理中...', key });
// 稍后...
message.destroy(key);
```

## 🚨 常见问题

### Q: 为什么会看到 "Static function can not consume context" 警告？

A: 这是因为使用了静态 `message` API。请改用 `useMessage()` Hook。

### Q: 在非 React 组件中如何使用？

A: 非 React 环境（如纯 TypeScript 工具函数）可以暂时使用静态 API，但建议将逻辑重构为 Hook 或传递 message 实例作为参数。

```tsx
// ❌ 不推荐
export const utilFunction = () => {
  message.success('操作成功');
};

// ✅ 推荐方式 1：重构为 Hook
export const useUtilFunction = () => {
  const message = useMessage();
  
  return () => {
    message.success('操作成功');
  };
};

// ✅ 推荐方式 2：依赖注入
export const utilFunction = (message: MessageInstance) => {
  message.success('操作成功');
};
```

### Q: 如何在循环或异步回调中使用？

A: 直接使用即可，message 实例在组件生命周期内保持稳定。

```tsx
function MyComponent() {
  const message = useMessage();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      message.info('延迟消息');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [message]);
  
  return <div>示例组件</div>;
}
```

## 📚 相关文档

- [Ant Design App Component](https://ant.design/components/app)
- [Ant Design Message Component](https://ant.design/components/message)
- [React Hooks 最佳实践](https://react.dev/reference/react)

## 🔧 技术细节

- **实现方式**: 基于 `App.useApp()` Hook
- **主题支持**: 完全支持 ConfigProvider 主题配置
- **类型安全**: 完全 TypeScript 类型支持
- **向后兼容**: 保留静态 API 供过渡使用

---

**Employee D 架构** - 适配器统一、品牌化一致、零覆盖
