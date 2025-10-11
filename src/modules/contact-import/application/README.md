# 联系人导入 应用服务层

## 职责
- 编排联系人导入业务流程
- 协调数据解析和设备同步
- 处理批量导入逻辑
- 导入进度和状态管理

## 架构原则
- 协调多个领域服务完成导入任务
- 处理复杂的业务编排逻辑
- 管理导入事务和回滚
- 状态跟踪和错误恢复

## 文件组织
```
application/
├── index.ts                      # 应用层统一导出
├── ContactImportApplicationService.ts # 核心导入应用服务
├── BatchImportService.ts         # 批量导入服务
└── ImportProgressService.ts      # 导入进度服务
```