# ADB 状态管理层

## 职责
- ADB模块状态存储
- 状态变更管理
- 跨组件状态共享
- 状态持久化

## 架构原则
- 基于Zustand实现状态管理
- 遵循DDD状态管理模式
- 单一数据源原则
- 状态变更可追踪

## 文件组织
```
stores/
├── index.ts         # 状态管理统一导出
├── adbStore.ts      # ADB核心状态
├── deviceStore.ts   # 设备状态管理
└── connectionStore.ts # 连接状态管理
```