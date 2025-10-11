# 联系人导入 API 层

## 职责
- 外部联系人数据源API对接
- VCF文件解析API
- 设备联系人同步API
- 数据格式转换和适配

## 架构原则
- 只负责API调用，不包含业务逻辑
- 统一的数据格式转换
- 错误处理和重试机制
- 支持多种数据源格式

## 文件组织
```
api/
├── index.ts          # API层统一导出
├── vcfApi.ts         # VCF文件API
├── deviceSyncApi.ts  # 设备同步API
└── types.ts         # API相关类型定义
```