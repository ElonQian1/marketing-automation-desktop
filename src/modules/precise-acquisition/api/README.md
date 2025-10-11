# 精准获客 API 层

## 职责
- 外部社交平台API对接
- 客户数据获取API
- 评论和互动数据API
- 第三方数据源集成

## 架构原则
- 统一的外部API访问接口
- 数据格式标准化处理
- API调用限流和重试
- 错误处理和监控

## 文件组织
```
api/
├── index.ts              # API层统一导出
├── socialPlatformApi.ts  # 社交平台API
├── customerDataApi.ts    # 客户数据API
├── commentApi.ts         # 评论数据API
└── types.ts             # API相关类型定义
```