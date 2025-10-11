# 智能脚本管理模块 - UI层

## 职责说明

UI层负责：
- React组件的定义和实现
- 用户界面逻辑处理
- 表单验证和用户交互
- 页面路由和导航组件

## 架构约束

- ✅ 只能调用同模块的 hooks 和 stores 
- ✅ 可以使用共享UI组件库(@shared/ui)
- ❌ 禁止直接调用 domain 或 services 层
- ❌ 禁止直接进行数据持久化操作

## 导入规范

```typescript
// ✅ 正确的导入方式
import { useScriptManager } from '@script/hooks';
import { Button, Card } from '@shared/ui';

// ❌ 错误的导入方式  
import { ScriptService } from '@script/services/ScriptService';
```

## 组件组织

```
ui/
├── components/     # 可复用UI组件
├── pages/         # 页面级组件
├── forms/         # 表单组件
└── index.ts       # 统一导出
```