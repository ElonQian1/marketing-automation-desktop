// src/lib/step-bundle.ts
// module: lib | layer: lib | role: 步骤包工具函数
// summary: 步骤包的打包、解压、导入导出功能

// import JSZip from 'jszip';
// import { invoke } from '@tauri-apps/api/tauri';
import type { StepBundleManifest, StepCardData, StepBundleXmlMap } from '../types/step-bundle';
import type { ExtendedSmartScriptStep } from '../types/loopScript';
import { generateXmlHash } from '../types/self-contained/xmlSnapshot';

/**
 * 从步骤列表构建步骤包
 */
export async function buildStepBundle(
  steps: ExtendedSmartScriptStep[], 
  bundleId?: string,
  device?: StepBundleManifest['device']
): Promise<{ manifest: StepBundleManifest; xmlMap: StepBundleXmlMap }> {
  const xmlMap: StepBundleXmlMap = {};
  const stepCards: StepCardData[] = [];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.enableStrategySelector || !step.parameters?.xmlSnapshot) continue;
    
    const xmlSnapshot = step.parameters.xmlSnapshot as any;
    const xmlContent = xmlSnapshot.xmlContent;
    if (!xmlContent) continue;
    
    const xmlHash = generateXmlHash(xmlContent);
    xmlMap[xmlHash] = xmlContent;
    
    const stepCard: StepCardData = {
      stepId: step.id,
      index: i,
      xmlHash,
      xmlCreatedAt: new Date(xmlSnapshot.timestamp || Date.now()).toISOString(),
      elementGlobalXPath: xmlSnapshot.elementGlobalXPath || step.parameters.element_selector || '',
      elementSignature: xmlSnapshot.elementSignature || {
        class: step.parameters.class_name as string,
        resourceId: step.parameters.resource_id as string,
        text: step.parameters.text as string,
        contentDesc: step.parameters.content_desc as string,
        bounds: step.parameters.bounds as string,
      },
      currentStrategy: convertStrategyToChoice(step.strategySelector),
      locatorChosen: {
        type: "XPath",
        value: step.parameters.element_selector as string || ''
      },
      metrics: {
        confidence: 0.8, // 默认值，实际应从分析结果获取
        candidates: 1,
        latencyMs: 0
      },
      action: convertStepTypeToAction(step.step_type),
      actionParams: {},
      status: "ready"
    };
    
    stepCards.push(stepCard);
  }
  
  const manifest: StepBundleManifest = {
    bundleId: bundleId || `bundle_${Date.now()}`,
    schemaVersion: "1.0.0",
    generator: "employeeGUI@1.0.0",
    device,
    steps: stepCards
  };
  
  return { manifest, xmlMap };
}

/**
 * 打包成ZIP文件 (简化版本，实际使用时需要安装JSZip依赖)
 */
export async function packStepBundle(
  manifest: StepBundleManifest, 
  xmlMap: StepBundleXmlMap
): Promise<Uint8Array> {
  // TODO: 实际使用时需要安装 jszip 依赖
  console.log('打包步骤包:', { manifest, xmlMap });
  
  // 简化实现：返回JSON字符串的字节数组
  const bundleData = JSON.stringify({ manifest, xmlMap }, null, 2);
  return new TextEncoder().encode(bundleData);
}

/**
 * 解压步骤包 (简化版本)
 */
export async function unpackStepBundle(bundleData: Uint8Array): Promise<{
  manifest: StepBundleManifest;
  xmlMap: StepBundleXmlMap;
}> {
  // TODO: 实际使用时需要安装 jszip 依赖进行完整的ZIP解压
  
  // 简化实现：假设bundleData是JSON格式
  const bundleText = new TextDecoder().decode(bundleData);
  const bundleObj = JSON.parse(bundleText);
  
  return {
    manifest: bundleObj.manifest,
    xmlMap: bundleObj.xmlMap
  };
}

/**
 * 将步骤包转换为可用的步骤列表
 */
export function convertBundleToSteps(
  manifest: StepBundleManifest,
  xmlMap: StepBundleXmlMap
): ExtendedSmartScriptStep[] {
  return manifest.steps.map((stepCard, index) => {
    const xmlContent = xmlMap[stepCard.xmlHash] || '';
    
    const step: ExtendedSmartScriptStep = {
      id: stepCard.stepId,
      name: `导入步骤 ${index + 1}`,
      step_type: convertActionToStepType(stepCard.action),
      description: `从步骤包导入 - ${stepCard.elementSignature.text || stepCard.elementSignature.resourceId || '未知元素'}`,
      parameters: {
        element_selector: stepCard.elementGlobalXPath,
        text: stepCard.elementSignature.text || '',
        bounds: stepCard.elementSignature.bounds || '',
        resource_id: stepCard.elementSignature.resourceId || '',
        content_desc: stepCard.elementSignature.contentDesc || '',
        class_name: stepCard.elementSignature.class || '',
        xmlSnapshot: {
          xmlCacheId: stepCard.xmlHash,
          xmlContent,
          xmlHash: stepCard.xmlHash,
          timestamp: Date.parse(stepCard.xmlCreatedAt),
          elementGlobalXPath: stepCard.elementGlobalXPath,
          elementSignature: stepCard.elementSignature
        }
      },
      enabled: true,
      order: stepCard.index,
      enableStrategySelector: true,
      strategySelector: convertChoiceToStrategy(stepCard.currentStrategy)
    };
    
    return step;
  });
}

// 辅助函数：策略转换
function convertStrategyToChoice(strategySelector?: unknown): import('../types/step-bundle').StrategyChoice {
  const selector = strategySelector as { activeStrategy?: { type?: string; stepName?: string } };
  if (!selector?.activeStrategy) {
    return { kind: "smart", mode: "auto" };
  }
  
  const { type, stepName } = selector.activeStrategy;
  if (type === 'smart-single' && stepName) {
    return { kind: "smart", mode: "single-step", step: stepName as "step1" };
  } else if (type === 'static') {
    return { kind: "static", id: "static-1" };
  }
  
  return { kind: "smart", mode: "auto" };
}

function convertChoiceToStrategy(choice: import('../types/step-bundle').StrategyChoice): unknown {
  return {
    activeStrategy: {
      type: choice.kind === 'static' ? 'static' : 
            (choice.kind === 'smart' && choice.mode === 'single-step') ? 'smart-single' : 'smart-auto',
      stepName: choice.kind === 'smart' && choice.mode === 'single-step' ? choice.step : undefined
    },
    analysis: { status: 'completed', progress: 100 },
    candidates: { smart: [], static: [] },
    config: { autoFollowSmart: true, confidenceThreshold: 0.82, enableFallback: true }
  };
}

function convertStepTypeToAction(stepType: string): "tap" | "longPress" | "input" | "swipe" | "wait" | "assert" {
  switch (stepType) {
    case 'smart_find_element':
    case 'tap':
      return 'tap';
    case 'long_press':
      return 'longPress';
    case 'input':
      return 'input';
    case 'swipe':
      return 'swipe';
    case 'wait':
      return 'wait';
    case 'assert':
      return 'assert';
    default:
      return 'tap';
  }
}

function convertActionToStepType(action: string): string {
  switch (action) {
    case 'tap':
      return 'smart_find_element';
    case 'longPress':
      return 'long_press';
    case 'input':
      return 'input';
    case 'swipe':
      return 'swipe';
    case 'wait':
      return 'wait';
    case 'assert':
      return 'assert';
    default:
      return 'smart_find_element';
  }
}