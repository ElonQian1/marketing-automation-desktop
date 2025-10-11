# 智能脚本管理模块 - API层

## 职责说明

API层负责：
- 外部服务接口调用
- 数据格式转换和适配
- 网络请求错误处理
- 第三方API集成

## 架构约束

- ✅ 实现 domain 层定义的仓储接口
- ✅ 处理具体的技术实现细节
- ❌ 禁止包含业务逻辑
- ❌ 禁止直接被UI层调用

## 导入规范

```typescript
// ✅ 正确的导入方式
import { IScriptRepository } from '@script/domain';
import { invoke } from '@tauri-apps/api/tauri';

// ❌ 错误的导入方式  
import { ScriptComponent } from '@script/ui';
```

## 接口组织

```
api/
├── repositories/   # 仓储接口实现
├── adapters/      # 数据适配器
├── clients/       # API客户端
└── index.ts       # 统一导出
```