# 联系人导入 Hooks 层

## 职责
- 封装导入相关React Hooks
- 导入进度和状态Hook封装
- 文件上传和处理Hook
- 导入结果展示Hook

## 架构原则
- 遵循React Hooks最佳实践
- 单一职责原则
- 组件逻辑复用和抽象
- 易于测试和维护

## 文件组织
```
hooks/
├── index.ts              # Hooks统一导出
├── useContactImport.ts   # 联系人导入Hook
├── useImportProgress.ts  # 导入进度Hook
├── useFileUpload.ts      # 文件上传Hook
└── useImportHistory.ts   # 导入历史Hook
```