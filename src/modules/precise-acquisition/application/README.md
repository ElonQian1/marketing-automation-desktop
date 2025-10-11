# 精准获客 应用服务层

## 职责
- 编排精准获客业务流程
- 任务调度和执行管理
- 多平台数据协调
- 获客策略执行

## 架构原则
- 协调多个获客服务完成复杂任务
- 处理跨平台业务逻辑
- 任务状态和进度管理
- 异常处理和恢复机制

## 文件组织
```
application/
├── index.ts                        # 应用层统一导出
├── PreciseAcquisitionApplicationService.ts # 核心获客应用服务
├── TaskManagementService.ts        # 任务管理服务
└── CustomerAnalysisService.ts      # 客户分析服务
```