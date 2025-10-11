# 联系人导入 服务实现层

## 职责
- 具体导入服务实现
- 文件解析和数据处理服务
- 设备通信和同步服务
- 导入策略执行服务

## 架构原则
- 实现具体的导入服务逻辑
- 可以依赖外部技术组件
- 处理技术细节和具体实现
- 为其他层提供服务支持

## 文件组织
```
services/
├── index.ts                 # 服务层统一导出
├── VcfParserService.ts      # VCF解析服务
├── ContactValidationService.ts # 联系人验证服务
├── DeviceSyncService.ts     # 设备同步服务
└── ImportStrategyService.ts # 导入策略服务
```