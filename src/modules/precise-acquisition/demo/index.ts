// src/modules/precise-acquisition/demo/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客系统 - 演示模块导出
 * 
 * 统一导出演示和测试相关功能
 */

// 演示类和函数
export { 
  default as PreciseAcquisitionDemo,
  runPreciseAcquisitionDemo,
  getDemoSystemStatus,
  DEMO_USAGE_EXAMPLE
} from './PreciseAcquisitionDemo';

// 集成测试
export {
  runIntegrationTests,
  runPerformanceBenchmark,
  runTestSuite
} from './integration-test';

/**
 * 演示模块使用说明
 */
export const DEMO_MODULE_GUIDE = `
# 精准获客系统演示模块

## 快速开始

### 1. 运行完整演示
\`\`\`typescript
import { runPreciseAcquisitionDemo } from '@/modules/precise-acquisition/demo';

await runPreciseAcquisitionDemo();
\`\`\`

### 2. 运行集成测试
\`\`\`typescript
import { runTestSuite } from '@/modules/precise-acquisition/demo';

await runTestSuite();
\`\`\`

### 3. 获取系统状态
\`\`\`typescript
import { getDemoSystemStatus } from '@/modules/precise-acquisition/demo';

const status = await getDemoSystemStatus();
console.log('系统状态:', status);
\`\`\`

## 演示内容

演示包含完整的"合规三步法"工作流程：

1. **候选池管理**: 创建监控目标，支持视频、账号等类型
2. **评论采集**: 模拟从多平台采集评论数据
3. **智能筛选**: 基于关键词、时间、互动质量等条件筛选
4. **任务生成**: 自动生成回复和关注任务
5. **任务调度**: 智能调度任务执行时间
6. **任务执行**: 模拟自动化执行任务
7. **日报生成**: 生成关注清单、回复清单和总结报告

## 测试套件

集成测试包含：

- ✅ 系统初始化测试
- ✅ 完整工作流程测试  
- ✅ 审计日志验证测试
- ✅ 性能基准测试

## 注意事项

- 演示使用模拟数据，不会调用真实API
- 所有操作都会记录审计日志
- 适合用于系统验证和功能展示
`;

// 默认导出演示模块信息
export default {
  name: 'PreciseAcquisitionDemo',
  version: '1.0.0',
  description: '精准获客系统演示和测试模块'
};