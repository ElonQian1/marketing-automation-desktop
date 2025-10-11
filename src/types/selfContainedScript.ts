// src/types/selfContainedScript.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

// Barrel re-exports for self-contained script types & helpers
export type { XmlSnapshot } from './self-contained/xmlSnapshot';
export {
  createXmlSnapshot,
  validateXmlSnapshot,
  generateXmlHash,
} from './self-contained/xmlSnapshot';

export type { ElementLocator } from './self-contained/elementLocator';

export type { SelfContainedStepParameters } from './self-contained/parameters';
export { migrateToSelfContainedParameters } from './self-contained/parameters';