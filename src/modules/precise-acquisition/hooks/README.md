# 精准获客 Hooks 层

## 职责
- 封装获客相关React Hooks
- 任务管理和监控Hook
- 客户分析和筛选Hook
- 获客结果展示Hook

## 架构原则
- 遵循React Hooks最佳实践
- 单一职责原则
- 业务逻辑复用和抽象
- 易于测试和维护

## 文件组织
```
hooks/
├── index.ts                    # Hooks统一导出
├── usePreciseAcquisition.ts    # 精准获客Hook
├── useTaskManagement.ts        # 任务管理Hook
├── useCustomerAnalysis.ts      # 客户分析Hook
└── useAcquisitionResults.ts    # 获客结果Hook
```