// src/types/index.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

export * from './Auth';
export * from './contact-types';
// 从Employee.ts导出，避免与Auth.ts中的Employee冲突
export type { 
  Employee as EmployeeData,
  EmployeeFormData,
  Device,
  ContactTask as EmployeeContactTask,
  TaskProgress, 
  TaskStatus, 
  TaskType,
  Platform,
  FollowStatistics,
  UserBalance,
  PreciseAcquisitionTask
} from './employee-types';

// 页面分析相关类型
// 删除已不存在的 pageAnalysis 模块导出

