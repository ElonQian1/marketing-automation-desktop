# 精准获客 状态管理层

## 职责
- 获客任务状态管理
- 客户数据缓存和筛选
- 获客进度和结果跟踪
- 策略配置状态管理

## 架构原则
- 基于Zustand实现状态管理
- 单一数据源原则
- 状态变更可追踪
- 支持任务状态持久化

## 文件组织
```
stores/
├── index.ts                # 状态管理统一导出
├── acquisitionStore.ts     # 获客状态管理
├── taskStore.ts           # 任务状态管理
├── customerStore.ts       # 客户数据状态
└── strategyStore.ts       # 策略配置状态
```