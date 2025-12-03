// src/pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration.ts
// module: pages | layer: hooks | role: integration
// summary: 智能步骤卡集成Hook，连接元素选择和步骤卡创建
// 📝 重构说明：此文件从 1247 行精简到 ~300 行，工具函数已提取到 ./step-card-integration/
// 🗄️ 原始文件备份：useIntelligentStepCardIntegration.legacy.ts

import { useCallback } from "react";
import { App } from "antd";
import type { UseIntelligentAnalysisWorkflowReturn } from "../../../modules/universal-ui/hooks/use-intelligent-analysis-workflow";
import type { UIElement } from "../../../api/universalUIAPI";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import XmlCacheManager from "../../../services/xml-cache-manager";
import { generateXmlHash } from "../../../types/self-contained/xmlSnapshot";
import { convertVisualToUIElement } from "../../../components/universal-ui/views/visual-view/utils/elementTransform";
import { VisualUIElement } from "../../../components/universal-ui/xml-parser/types";
import { SmartActionType } from "../../../types/smartComponents";

// 从拆分模块导入类型和工具
import type { ElementSelectionContext, ElementEnrichmentData } from "./step-card-integration";
import {
  smartMergeChildTexts,
  extractEnrichmentFromXmlDoc,
  computeBoundsString,
  normalizeStepType,
  generateValidXPath,
  buildSmartMatchingConfig,
  isMenuElementCheck,
  generateSmartStepName,
  buildSimpleChildren,
} from "./step-card-integration";

interface UseIntelligentStepCardIntegrationOptions {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  onClosePageFinder?: () => void;
  analysisWorkflow: UseIntelligentAnalysisWorkflowReturn;
}

/**
 * 智能步骤卡集成Hook（重构版）
 *
 * 将元素选择和步骤卡创建连接起来
 * 原始版本超过1300行，此重构版本通过提取工具函数实现精简
 */
export function useIntelligentStepCardIntegrationRefactored(
  options: UseIntelligentStepCardIntegrationOptions
) {
  const { steps, setSteps, onClosePageFinder, analysisWorkflow } = options;
  const { message } = App.useApp();

  // 从 analysisWorkflow 中解构需要的函数
  // createStepCardQuick 保留用于未来的高级分析功能
  const { stepCards, isAnalyzing } = analysisWorkflow;

  /**
   * 🔄 UIElement → ElementSelectionContext 转换
   * 提取元素的各种上下文信息，包括 XPath、XML 快照、父子元素文本等
   */
  const convertElementToContext = useCallback(
    async (element: UIElement): Promise<ElementSelectionContext> => {
      console.log("[convertElementToContext] 开始转换元素:", element.id);

      // 1. 获取 XML 缓存
      let xmlContent = "";
      let xmlHash = "";
      const xmlCacheId = (element as unknown as { xmlCacheId?: string }).xmlCacheId || "";
      // 🔥 备份：从元素对象获取附带的 XML 内容
      const backupXmlContent = (element as unknown as { _xmlContent?: string })._xmlContent || "";

      console.log("[convertElementToContext] 🔍 XML缓存检查:", {
        elementId: element.id,
        xmlCacheId,
        hasXmlCacheId: !!xmlCacheId,
        hasBackupXmlContent: !!backupXmlContent,
        backupXmlContentLength: backupXmlContent?.length || 0,
      });

      if (xmlCacheId) {
        try {
          const cacheEntry = await XmlCacheManager.getInstance().getCachedXml(xmlCacheId);
          console.log("[convertElementToContext] 🔍 缓存查询结果:", {
            xmlCacheId,
            found: !!cacheEntry,
            xmlContentLength: cacheEntry?.xmlContent?.length || 0,
          });
          if (cacheEntry) {
            xmlContent = cacheEntry.xmlContent;
            xmlHash = cacheEntry.xmlHash || generateXmlHash(xmlContent);
          } else {
            console.error("[convertElementToContext] ❌ 缓存未命中! xmlCacheId:", xmlCacheId);
            // 🔥🔥 使用备份的 XML 内容
            if (backupXmlContent) {
              console.log("[convertElementToContext] 🔄 使用备份的 XML 内容");
              xmlContent = backupXmlContent;
              xmlHash = generateXmlHash(xmlContent);
              // 🔥 将 XML 内容存入缓存，避免后续再次缓存未命中
              XmlCacheManager.getInstance().putXml(xmlCacheId, xmlContent, `sha256:${xmlHash}`);
              console.log("[convertElementToContext] ✅ 已将备份 XML 存入缓存:", xmlCacheId);
            }
          }
        } catch (error) {
          console.warn("[convertElementToContext] 获取XML缓存失败:", error);
          // 🔥🔥 异常时也使用备份
          if (backupXmlContent) {
            console.log("[convertElementToContext] 🔄 异常后使用备份的 XML 内容");
            xmlContent = backupXmlContent;
            xmlHash = generateXmlHash(xmlContent);
          }
        }
      } else {
        console.warn("[convertElementToContext] ⚠️ 元素没有xmlCacheId，尝试使用备份 XML");
        if (backupXmlContent) {
          xmlContent = backupXmlContent;
          xmlHash = generateXmlHash(xmlContent);
        }
      }

      // 2. 计算 bounds 字符串 (使用统一的菜单检测函数)
      const isMenuElement = isMenuElementCheck(element);
      const boundsString = computeBoundsString(element.bounds, isMenuElement);

      // 3. 生成有效的 XPath
      const absoluteXPath = generateValidXPath(element);

      // 4. 从 child_elements 提取子元素文本
      let childrenTexts: string[] = [];
      let childrenContentDescs: string[] = [];

      if (element.child_elements && element.child_elements.length > 0) {
        childrenTexts = element.child_elements
          .map((child) => child.text)
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0 && t.trim().length < 50);

        childrenContentDescs = element.child_elements
          .map((child) => (child as unknown as { content_desc?: string }).content_desc || "")
          .filter((d) => d && d.trim().length > 0);
      }

      // 5. 从 XML 提取增强数据
      let enrichmentData: ElementEnrichmentData | undefined;

      if (xmlContent && boundsString) {
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
          enrichmentData = extractEnrichmentFromXmlDoc(
            xmlDoc,
            boundsString,
            childrenTexts,
            childrenContentDescs
          ) || undefined;

          if (enrichmentData) {
            childrenTexts = enrichmentData.allChildTexts;
            childrenContentDescs = enrichmentData.allChildContentDescs || [];
          }
        } catch (error) {
          console.warn("[convertElementToContext] XML解析失败:", error);
        }
      }

      // 6. 智能合并：去除重复
      if (enrichmentData?.parentContentDesc) {
        childrenTexts = smartMergeChildTexts(childrenTexts, enrichmentData.parentContentDesc);
      }

      // 7. 提取 elementText
      const elementText =
        element.text ||
        element.content_desc ||
        enrichmentData?.childText ||
        (childrenTexts.length > 0 ? childrenTexts[0] : undefined);

      // 8. 构建上下文
      const context: ElementSelectionContext = {
        snapshotId: xmlCacheId,
        elementPath: absoluteXPath,
        elementText,
        elementBounds: boundsString,
        elementType: element.element_type || element.class_name,
        xmlContent,
        xmlHash,
        indexPath: element.indexPath || (element as unknown as { index_path?: number[] }).index_path,
        // 🔥 关键属性 - 用于智能命名和后端匹配
        keyAttributes: {
          "resource-id": element.resource_id || "",
          "content-desc": element.content_desc || enrichmentData?.parentContentDesc || "",
          text: element.text || "",
          class: element.class_name || "",
        },
        siblingTexts: enrichmentData?.siblingTexts,
        parentElement: enrichmentData?.parentElement,
        childrenTexts,
        childrenContentDescs,
        // 🔥 原始UIElement - 用于策略配置（如结构匹配需要children字段）
        originalUIElement: buildSimpleChildren(element),
        _enrichment: enrichmentData,
      };

      console.log("[convertElementToContext] 最终上下文:", {
        elementPath: context.elementPath,
        elementText: context.elementText,
        hasXml: !!context.xmlContent,
        childrenTexts: context.childrenTexts?.slice(0, 3),
        parentContentDesc: context.parentElement?.content_desc?.substring(0, 30),
      });

      return context;
    },
    []
  );

  /**
   * 🚀 快速创建步骤卡
   * 核心功能：将选中的 UIElement 转换为 ExtendedSmartScriptStep
   */
  const handleQuickCreateStep = useCallback(
    async (element: UIElement) => {
      console.log("[handleQuickCreateStep] 🚀 开始创建步骤:", element.id);

      try {
        // 🔄 智能转换：如果传入的是 VisualUIElement（有className但无class_name），则转换为 UIElement
        // 这解决了 UniversalPageFinderModal 传递 VisualUIElement 导致 class_name 丢失的问题
        let uiElement = element;
        if ("className" in element && !("class_name" in element)) {
          console.log("🔄 [智能集成] 检测到 VisualUIElement，转换为 UIElement 以保留 class_name");
          uiElement = convertVisualToUIElement(element as unknown as VisualUIElement) as unknown as UIElement;
        }

        // 转换为上下文
        const context = await convertElementToContext(uiElement);

        // 生成步骤编号和ID
        const stepNumber = steps.length + 1;
        const stepId = `step_${Date.now()}_${stepNumber}`;

        // 🎯 智能命名：基于元素内容生成更有意义的名称（如"点击"xxx""）
        const stepName = generateSmartStepName(
          uiElement,
          {
            elementText: context.elementText,
            keyAttributes: context.keyAttributes,
            _enrichment: context._enrichment,
          },
          stepNumber
        );

        // 判断匹配策略
        const isMiddleLayerContainer = !uiElement.text && context.elementText;
        const matchingStrategy = isMiddleLayerContainer
          ? "anchor_by_child_or_parent_text"
          : "direct_match";

        // 构建智能匹配配置（用于日志和调试）
        const elementText = context.elementText || uiElement.text || "";
        const smartMatchingConfig = buildSmartMatchingConfig(elementText);
        console.log("[handleQuickCreateStep] 智能匹配配置:", smartMatchingConfig);

        // 创建新步骤
        const newStep: ExtendedSmartScriptStep = {
          id: stepId,
          name: stepName,
          step_type: normalizeStepType(uiElement.element_type || "tap"),
          description: `智能分析 - ${stepName}`,
          enableStrategySelector: true,
          strategySelector: {
            selectedStrategy: "smart-auto",
            selectedStep: "step1",
            analysis: {
              status: "analyzing" as const,
              progress: 0,
              result: null,
              error: null,
            },
          },
          parameters: {
            element_selector: context.elementPath || uiElement.xpath || uiElement.id || "",
            text: isMiddleLayerContainer ? (uiElement.text || "") : elementText,
            smartSelection: {
              mode: "first",
              targetText: elementText,
              textMatchingMode: "exact",
              antonymCheckEnabled: false,
              semanticAnalysisEnabled: false,
              minConfidence: 0.8,
              batchConfig: {
                intervalMs: 1000,
                maxCount: 1,
                continueOnError: false,
                showProgress: true,
              },
            },
            bounds: computeBoundsString(
              uiElement.bounds,
              isMenuElementCheck(uiElement)
            ),
            resource_id: uiElement.resource_id || "",
            content_desc: uiElement.content_desc || "",
            class_name: uiElement.class_name || "",
            xmlSnapshot: {
              xmlCacheId: context.snapshotId,
              xmlContent: context.xmlContent || "",
              xmlHash: context.xmlHash || "",
              timestamp: Date.now(),
              elementGlobalXPath: context.elementPath || uiElement.xpath || "",
              elementSignature: {
                class: uiElement.class_name || "",
                resourceId: uiElement.resource_id || "",
                text: context.elementText || uiElement.text || null,
                contentDesc: uiElement.content_desc || null,
                bounds: uiElement.bounds ? JSON.stringify(uiElement.bounds) : "",
                indexPath: uiElement.indexPath || [],
                childrenTexts: context._enrichment?.allChildTexts || [],
                matchingStrategy,
                siblingTexts: context._enrichment?.siblingTexts || [],
                parentInfo: context._enrichment?.parentElement
                  ? {
                      contentDesc: context._enrichment.parentElement.content_desc,
                      text: context._enrichment.parentElement.text,
                      resourceId: context._enrichment.parentElement.resource_id,
                    }
                  : null,
              },
            },
            matching: {
              strategy: "intelligent" as const,
              fields: isMiddleLayerContainer
                ? ["children_texts", "sibling_texts", "resource-id", "parent_content_desc"]
                : ["resource-id", "text", "content-desc"],
              values: {
                "resource-id": uiElement.resource_id || "",
                text: uiElement.text || "",
                "content-desc": uiElement.content_desc || "",
                children_texts: context._enrichment?.allChildTexts || [],
                sibling_texts: context._enrichment?.siblingTexts || [],
                parent_content_desc: context._enrichment?.parentElement?.content_desc || "",
              },
              preferredStrategy: matchingStrategy,
            },
          },
          enabled: true,
          order: stepNumber,
          find_condition: null,
          verification: null,
          retry_config: null,
          fallback_actions: [],
          pre_conditions: [],
          post_conditions: [],
        };

        // 🆕 自动检测并添加启动应用步骤
        const packageName = (uiElement as any).package || (uiElement as any).packageName || (uiElement as any).package_name;
        let launchStepToAdd: ExtendedSmartScriptStep | null = null;

        if (packageName) {
          // 检查是否已存在启动该应用的步骤
          const hasLaunchStep = steps.some(s => 
            (s.step_type === SmartActionType.LAUNCH_APP || s.step_type === 'launch_app') && 
            (s.parameters?.package_name === packageName || s.parameters?.selected_app?.package_name === packageName)
          );

          if (!hasLaunchStep) {
            console.log(`[handleQuickCreateStep] 💡 未检测到启动步骤，自动添加启动应用: ${packageName}`);
            const launchStepId = `step_${Date.now()}_launch`;
            
            launchStepToAdd = {
              id: launchStepId,
              name: `启动应用`,
              step_type: SmartActionType.LAUNCH_APP,
              description: `自动添加: 启动应用 ${packageName}`,
              enabled: true,
              order: stepNumber, // 占位，稍后调整
              enableStrategySelector: false,
              parameters: {
                package_name: packageName,
                app_selection_method: 'manual',
                wait_after_launch: 5000,
                verify_launch: true,
                selected_app: {
                  package_name: packageName,
                  app_name: packageName, // 暂时使用包名作为应用名
                  is_system_app: false,
                  is_enabled: true
                }
              },
              find_condition: null,
              verification: null,
              retry_config: null,
              fallback_actions: [],
              pre_conditions: [],
              post_conditions: [],
            };
          }
        }

        // 添加到步骤列表
        setSteps((prevSteps) => {
          const nextSteps = [...prevSteps];
          if (launchStepToAdd) {
            launchStepToAdd.order = nextSteps.length;
            newStep.order = nextSteps.length + 1;
            nextSteps.push(launchStepToAdd);
            message.info(`已自动添加启动应用步骤: ${packageName}`);
          } else {
            newStep.order = nextSteps.length;
          }
          nextSteps.push(newStep);
          return nextSteps;
        });
        
        if (!launchStepToAdd) {
           message.success(`已创建智能步骤卡: ${stepName}`);
        } else {
           message.success(`已创建智能步骤卡: ${stepName} (并自动添加了启动步骤)`);
        }

        console.log("[handleQuickCreateStep] ✅ 步骤创建成功:", {
          stepId,
          name: stepName,
          type: newStep.step_type,
          autoAddedLaunchStep: !!launchStepToAdd
        });

        // 关闭页面查找器
        if (onClosePageFinder) {
          onClosePageFinder();
        }
      } catch (error) {
        console.error("[handleQuickCreateStep] ❌ 创建失败:", error);
        message.error(`创建步骤卡失败: ${error}`);
      }
    },
    [convertElementToContext, steps, setSteps, message, onClosePageFinder]
  );

  /**
   * 传统的元素选择处理（兼容旧版本）
   */
  const handleElementSelected = useCallback(
    async (element: UIElement) => {
      console.log("[handleElementSelected] 委托到 handleQuickCreateStep");
      return handleQuickCreateStep(element);
    },
    [handleQuickCreateStep]
  );

  return {
    handleElementSelected,
    handleQuickCreateStep,
    isAnalyzing,
    stepCards,
  };
}

// 导出重构版本作为默认
export { useIntelligentStepCardIntegrationRefactored as useIntelligentStepCardIntegration };
