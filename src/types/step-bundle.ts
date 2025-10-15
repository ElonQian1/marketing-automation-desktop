// src/types/step-bundle.ts
// module: types | layer: types | role: 步骤包类型定义
// summary: 支持步骤卡片跨设备复现和分享的数据结构

export type StrategyChoice =
  | { kind: "smart"; mode: "auto" }
  | { kind: "smart"; mode: "single-step"; step: "step1" | "step2" | "step3" | "step4" | "step5" | "step6" }
  | { kind: "static"; id: string };

export interface ElementSignature {
  class?: string;
  resourceId?: string;
  text?: string | null;
  contentDesc?: string | null;
  bounds?: string;             // 如 "[x1,y1][x2,y2]"
  indexPath?: number[];        // 自根到该节点的索引路径
  anchors?: Array<{ type: "sibling" | "parent" | "neighborText"; value: string }>;
}

export interface StepCardData {
  stepId: string;
  index: number;
  xmlHash: string;
  xmlCreatedAt: string;
  elementGlobalXPath: string;
  elementSignature: ElementSignature;
  currentStrategy: StrategyChoice;
  locatorChosen?: { type: "XPath" | "CSS" | "AccessibilityId"; value: string };
  metrics?: { confidence?: number; candidates?: number; latencyMs?: number };
  action: "tap" | "longPress" | "input" | "swipe" | "wait" | "assert";
  actionParams?: Record<string, unknown>;
  status: "analyzing" | "defaulted" | "ready" | "executed" | "failed";
  defaultedReason?: string;
  postconditions?: Array<Record<string, unknown>>;
  screenshotId?: string;
}

export interface StepBundleManifest {
  bundleId: string;
  schemaVersion: "1.0.0";
  generator: string;
  device?: { 
    brand?: string; 
    model?: string; 
    dpi?: number; 
    size?: string; 
    sdk?: number 
  };
  steps: StepCardData[];
}

export interface StepBundleXmlMap {
  [xmlHash: string]: string; // xmlHash -> xmlContent
}