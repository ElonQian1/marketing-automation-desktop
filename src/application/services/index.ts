// src/application/services/index.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

export * from './ScrcpyApplicationService';

// 精准获客应用服务
export { PreciseAcquisitionApplicationService } from './PreciseAcquisitionApplicationService';

// 创建全局单例实例
import { PreciseAcquisitionApplicationService } from './PreciseAcquisitionApplicationService';
export const preciseAcquisitionService = PreciseAcquisitionApplicationService.getInstance();
