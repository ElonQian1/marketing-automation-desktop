# ADB API 层

## 职责
- 与外部ADB服务通信
- 设备连接API接口
- 命令执行API包装
- 数据转换和适配

## 架构原则
- 只负责API调用，不包含业务逻辑
- 所有外部依赖在此层处理
- 提供统一的API接口给应用层使用
- 错误处理和重试机制

## 文件组织
```
api/
├── index.ts          # API层统一导出
├── deviceApi.ts      # 设备管理API
├── commandApi.ts     # 命令执行API
└── types.ts         # API相关类型定义
```