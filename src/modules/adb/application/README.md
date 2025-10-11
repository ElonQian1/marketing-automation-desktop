# ADB 应用服务层

## 职责
- 编排ADB业务流程
- 协调多个领域服务
- 处理应用级业务逻辑
- 事务管理和状态协调

## 架构原则
- 不包含领域核心逻辑
- 协调领域服务完成复杂业务场景
- 处理外部接口到领域模型的转换
- 管理应用级事务和状态

## 文件组织
```
application/
├── index.ts                 # 应用层统一导出
├── AdbApplicationService.ts # 核心应用服务
├── DeviceManagementService.ts # 设备管理应用服务
└── CommandExecutionService.ts # 命令执行应用服务
```