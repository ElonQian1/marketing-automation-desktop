// src/modules/structural-matching/ui/components/visual-preview/hooks/use-structural-matching-step-data.ts
// module: structural-matching | layer: ui | role: hooks
// summary: 结构匹配步骤卡片数据加载Hook（重构版：使用模块化架构）

import { useState, useEffect, useCallback } from "react";
import type { StepCardData, ElementTreeData, LoadingState } from "../types";
import { generateCropDebugInfo, logCropDebugInfo } from "../utils";
import { 
  correctElementBounds,
  parseXmlWithStrictHierarchy, 
  recalculateHierarchyAfterCorrection,
  StructuralMatchingXmlLoader,
  StructuralMatchingScreenshotLoader,
} from "../core";
import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";

/**
 * 从步骤卡片数据加载XML和截图的Hook
 */
export function useStructuralMatchingStepData(stepCardData?: StepCardData) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingText: "",
  });

  const [elementTreeData, setElementTreeData] =
    useState<ElementTreeData | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [xmlContent, setXmlContent] = useState<string>("");



  /**
   * 解析元素结构树数据（使用模块化架构）
   */
  const parseElementTreeData = useCallback(
    async (
      xmlContent: string,
      rootElement: VisualUIElement,
      stepCardData?: StepCardData
    ): Promise<ElementTreeData> => {
      console.log("🔍 [StructuralMatching] 开始解析元素结构树数据（模块化版本）");

      // 使用新的XML层级解析器
      const hierarchyResult = await parseXmlWithStrictHierarchy({
        xmlContent,
        rootElement,
        enforceStrictHierarchy: true,
      });

      console.log("� [StructuralMatching] 准备执行边界修正...", {
        rootElementId: hierarchyResult.rootElement.id,
        rootElementClickable: hierarchyResult.rootElement.clickable,
        stepCardDataExists: !!stepCardData,
        originalElementExists: !!stepCardData?.original_element,
      });

      // 🎯 执行边界修正，确保视口对齐使用正确的元素
      const correctionResult = correctElementBounds(
        {
          rootElement: hierarchyResult.rootElement,
          childElements: hierarchyResult.childElements,
          bounds: hierarchyResult.bounds,
        },
        stepCardData
      );

      console.log("🚨 [StructuralMatching] 边界修正结果:", correctionResult);

      // 如果进行了修正，重新筛选子元素
      let finalChildElements = hierarchyResult.childElements;
      let finalBounds = hierarchyResult.bounds;
      let finalRootElement = hierarchyResult.rootElement;

      if (correctionResult.wasCorrected) {
        console.log(
          "🔧 [StructuralMatching] 应用边界修正:",
          correctionResult.correctionReason
        );

        finalRootElement = correctionResult.correctedRootElement;
        finalBounds = correctionResult.correctedBounds;

        // 使用新的层级重计算函数
        finalChildElements = recalculateHierarchyAfterCorrection(
          xmlContent,
          hierarchyResult.allElements,
          finalBounds,
          finalRootElement.id
        );
      }

      const elementTreeData = {
        rootElement: finalRootElement,
        childElements: finalChildElements,
        bounds: finalBounds,
      };

      // 🎯 添加调试信息
      try {
        const debugInfo = generateCropDebugInfo(elementTreeData);
        logCropDebugInfo(debugInfo);
      } catch (error) {
        console.warn("[StructuralMatching] 调试信息生成失败:", error);
      }

      return elementTreeData;
    },
    []
  );

  /**
   * 加载数据的主要函数（使用模块化架构）
   */
  const loadData = useCallback(
    async (data: StepCardData) => {
      // 📊 生产模式逻辑
      if (!data.xmlCacheId || !data.original_element) {
        setLoadingState({
          isLoading: false,
          loadingText: "",
          error: "缺少必要的步骤卡片数据",
        });
        return;
      }

      setLoadingState({
        isLoading: true,
        loadingText: "正在加载XML和截图数据...",
      });

      try {
        // 1) XML内容加载 - 使用新的XML加载器
        setLoadingState({
          isLoading: true,
          loadingText: "正在加载XML内容...",
        });

        const effectiveXmlContent = await StructuralMatchingXmlLoader.loadXmlFromStepCard(data);
        setXmlContent(effectiveXmlContent);

        // 2) 解析元素结构树
        setLoadingState({
          isLoading: true,
          loadingText: "正在解析元素结构...",
        });

        const treeData = await parseElementTreeData(
          effectiveXmlContent,
          data.original_element!,
          data
        );
        setElementTreeData(treeData);

        // 3) 截图加载 - 使用新的截图加载器
        setLoadingState({
          isLoading: true,
          loadingText: "正在加载截图...",
        });

        const dataUrl = await StructuralMatchingScreenshotLoader.loadScreenshotFromStepCard(data);
        setScreenshotUrl(dataUrl);

        setLoadingState({
          isLoading: false,
          loadingText: "",
        });
      } catch (error) {
        console.error("❌ [StructuralMatching] 数据加载失败:", error);
        setLoadingState({
          isLoading: false,
          loadingText: "",
          error: error instanceof Error ? error.message : "未知错误",
        });
      }
    },
    [parseElementTreeData]
  );

  // 🎯 监听stepCardData变化，自动加载数据
  useEffect(() => {
    if (stepCardData) {
      loadData(stepCardData);
    } else {
      // 清理状态
      setElementTreeData(null);
      setScreenshotUrl("");
      setXmlContent("");
      setLoadingState({
        isLoading: false,
        loadingText: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepCardData]); // 🎯 只依赖 stepCardData,避免函数引用变化导致循环

  return {
    loadingState,
    elementTreeData,
    screenshotUrl,
    xmlContent,
    reload: () => stepCardData && loadData(stepCardData),
  };
}
