// src/modules/structural-matching/services/step-card-parameter-inference/index.ts
// module: structural-matching | layer: services | role: 步骤卡片参数推导模块导出
// summary: 导出参数推导相关的所有服务和类型

export { StepCardParameterInferenceService } from './step-card-inference-service';
export { XmlSnapshotAnalyzer } from './xml-snapshot-analyzer';

export type {
  StructuralMatchPlan,
  ElementStructuralFeatures,
  ParsedUIElement,
  XmlAnalysisOptions,
  ParameterInferenceOptions,
  InferenceResult,
  FieldStrategyInference
} from './types';