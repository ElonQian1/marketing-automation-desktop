// src/api/index.ts
// module: api | layer: api | role: api-export-barrel
// summary: API层导出桶文件，集中导出所有API接口和工具

// 旧的员工API（保留）
export * from './employeeAPI';
export { default as EmployeeAPI } from './employeeAPI';

// 新的业务API
export * from './ContactAPI';
export { ContactAPI } from './ContactAPI';  // 移除未使用的AdbAPI
export * from './deviceAPI';
export { default as DeviceAPI } from './deviceAPI';
export * from './taskAPI';
export { default as TaskAPI } from './taskAPI';  // 移除未使用的BalanceAPI, StatisticsAPI

// 页面分析API
// 删除已不存在的 pageAnalysisAPI 模块导出

