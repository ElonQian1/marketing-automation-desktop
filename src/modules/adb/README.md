# ADB 模块

## 模块概述
ADB (Android Debug Bridge) 模块负责管理安卓设备连接、设备控制、命令执行等核心功能。

## 模块架构
采用DDD (领域驱动设计) 分层架构：

```
adb/
├── api/            # API接口层 - 外部服务通信
├── application/    # 应用服务层 - 业务流程编排
├── domain/         # 领域核心层 - 业务规则和模型
├── services/       # 服务实现层 - 具体业务服务
├── stores/         # 状态管理层 - 模块状态存储
├── hooks/          # React Hooks - 组件级逻辑封装
├── ui/            # UI组件层 - 界面组件
└── index.ts       # 模块统一导出
```

## 核心功能
- 设备发现和连接管理
- ADB命令执行和监控
- 设备状态诊断和监控
- 连接质量管理
- 设备信息获取

## 使用方式
```typescript
// 所有导入必须从模块根目录进行
import { useAdb, DeviceList, AdbApplicationService } from '@adb';
```

## 架构约束
- 禁止跨模块直接访问内部目录
- 所有对外接口通过 index.ts 导出
- 遵循DDD分层原则，下层不能依赖上层
- UI层不能直接访问领域层