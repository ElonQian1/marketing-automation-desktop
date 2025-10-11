# ADB Hooks 层

## 职责
- 封装ADB相关React Hooks
- 组件级业务逻辑抽象
- 状态和副作用管理
- 组件间逻辑复用

## 架构原则
- 遵循React Hooks最佳实践
- 单一职责原则
- 高内聚低耦合
- 易于测试和维护

## 文件组织
```
hooks/
├── index.ts          # Hooks统一导出
├── useAdb.ts         # ADB核心Hook
├── useDevices.ts     # 设备管理Hook
├── useConnection.ts  # 连接管理Hook
└── useDiagnostic.ts  # 诊断功能Hook
```