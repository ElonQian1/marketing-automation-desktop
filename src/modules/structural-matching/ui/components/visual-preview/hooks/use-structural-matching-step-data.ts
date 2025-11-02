// src/modules/structural-matching/ui/components/visual-preview/hooks/use-structural-matching-step-data.ts
// module: structural-matching | layer: ui | role: hooks
// summary: 结构匹配步骤卡片数据加载Hook

import { useState, useEffect, useCallback } from "react";
import type { StepCardData, ElementTreeData, LoadingState } from "../types";
import XmlCacheManager from "../../../../../../services/xml-cache-manager";
import { parseXML } from "../../../../../../components/universal-ui/xml-parser";
import imageCache from "../../../../../../components/xml-cache/utils/imageCache";
import { invoke } from "@tauri-apps/api/core";
import {
  generateCropDebugInfo,
  logCropDebugInfo,
} from "../utils/structural-matching-debug-helper";
import {
  correctElementBounds,
  recalculateChildElements,
} from "../core/structural-matching-bounds-corrector";
import type { VisualUIElement } from "../../../../../../components/universal-ui/views/visual-view/types/visual-types";

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
   * 从XML缓存ID推断截图文件名
   */
  const inferScreenshotPath = useCallback((xmlCacheId: string): string => {
    // ui_dump_e0d909c3_20251030_122312.xml -> ui_dump_e0d909c3_20251030_122312.png
    return xmlCacheId.replace(".xml", ".png");
  }, []);

  /**
   * 获取截图的绝对路径
   */
  const getScreenshotAbsolutePath = useCallback(
    async (filename: string): Promise<string> => {
      try {
        const absolutePath = await invoke<string>(
          "get_xml_file_absolute_path",
          {
            fileName: filename,
          }
        );
        console.log("✅ [StructuralMatching] 获取截图绝对路径:", absolutePath);
        return absolutePath;
      } catch (error) {
        console.error("❌ [StructuralMatching] 获取截图绝对路径失败:", error);
        throw error;
      }
    },
    []
  );

  /**
   * 解析元素结构树数据
   */
  const parseElementTreeData = useCallback(
    async (
      xmlContent: string,
      rootElement: VisualUIElement,
      stepCardData?: StepCardData
    ): Promise<ElementTreeData> => {
      console.log("🔍 [StructuralMatching] 开始解析元素结构树数据");

      // 解析XML获取所有元素
      const parseResult = await parseXML(xmlContent);
      const allElements = parseResult.elements;
      console.log("✅ [StructuralMatching] XML解析完成，元素数量:", allElements.length);

      // 提取根元素的bounds
      const bounds = rootElement.bounds;
      if (!bounds) {
        throw new Error("根元素缺少bounds信息");
      }

      // 处理不同格式的bounds数据
      let left: number, top: number, right: number, bottom: number;

      if (typeof bounds === "string") {
        // 字符串格式: "[546,225][1067,1083]"
        const matches = bounds.match(/\d+/g)?.map(Number) || [];
        [left, top, right, bottom] = matches;
      } else if (typeof bounds === "object" && bounds !== null) {
        // 对象格式: {left: 546, top: 225, right: 1067, bottom: 1083}
        const boundsObj = bounds as {
          left: number;
          top: number;
          right: number;
          bottom: number;
        };
        left = boundsObj.left;
        top = boundsObj.top;
        right = boundsObj.right;
        bottom = boundsObj.bottom;
      } else {
        throw new Error("bounds格式不正确");
      }

      if (
        left === undefined ||
        top === undefined ||
        right === undefined ||
        bottom === undefined
      ) {
        throw new Error("无法解析根元素bounds信息");
      }

      const rootBounds = {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      };

      console.log("📐 [StructuralMatching] 根元素边界:", rootBounds);

      // 筛选在根元素范围内的子元素（使用更宽松的条件，包含相交的元素）
      const childElements = allElements.filter((element: VisualUIElement) => {
        if (!element.position) return false;

        const elementBounds = element.position;

        // 检查元素是否与根元素有重叠（而不是完全包含）
        const hasOverlap = !(
          elementBounds.x + elementBounds.width <= rootBounds.x ||
          elementBounds.x >= rootBounds.x + rootBounds.width ||
          elementBounds.y + elementBounds.height <= rootBounds.y ||
          elementBounds.y >= rootBounds.y + rootBounds.height
        );

        // 额外检查：排除根元素本身
        const isNotRoot = element.id !== rootElement.id;

        return hasOverlap && isNotRoot;
      });

      console.log("✅ [StructuralMatching] 筛选出相关子元素数量:", childElements.length);

      console.log("🚨 [StructuralMatching] 准备执行边界修正...", {
        rootElementId: rootElement.id,
        rootElementClickable: rootElement.clickable,
        stepCardDataExists: !!stepCardData,
        originalElementExists: !!stepCardData?.original_element,
      });

      // 🎯 执行边界修正，确保视口对齐使用正确的元素
      const correctionResult = correctElementBounds(
        {
          rootElement,
          childElements,
          bounds: rootBounds,
        },
        stepCardData
      );

      console.log("🚨 [StructuralMatching] 边界修正结果:", correctionResult);

      // 如果进行了修正，重新筛选子元素
      let finalChildElements = childElements;
      let finalBounds = rootBounds;
      let finalRootElement = rootElement;

      if (correctionResult.wasCorrected) {
        console.log(
          "🔧 [StructuralMatching] 应用边界修正:",
          correctionResult.correctionReason
        );

        finalRootElement = correctionResult.correctedRootElement;
        finalBounds = correctionResult.correctedBounds;

        // 基于修正后的边界重新筛选子元素
        finalChildElements = recalculateChildElements(
          allElements,
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
   * 加载数据的主要函数
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
        // 1) XML 优先来源：步骤卡片内联快照
        let effectiveXmlContent: string | null = null;
        if (data.xmlSnapshot?.xmlContent && data.xmlSnapshot.xmlContent.trim().length > 0) {
          effectiveXmlContent = data.xmlSnapshot.xmlContent;
          console.log("✅ [StructuralMatching] 使用步骤卡片内联 XML 内容");
        } else {
          // 回退：从缓存ID获取
          console.log("🔍 [StructuralMatching] 从缓存获取XML:", data.xmlCacheId);
          const xmlCacheManager = XmlCacheManager.getInstance();
          const cacheEntry = await xmlCacheManager.getCachedXml(data.xmlCacheId!);
          if (!cacheEntry?.xmlContent) {
            throw new Error("XML缓存数据不存在");
          }
          effectiveXmlContent = cacheEntry.xmlContent;
          console.log("✅ [StructuralMatching] XML加载成功，长度:", cacheEntry.xmlContent.length);
        }

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

        // 3) 截图 优先来源：步骤卡片中提供的绝对路径
        setLoadingState({
          isLoading: true,
          loadingText: "正在加载截图...",
        });

        let screenshotAbsolute: string;
        if (data.xmlSnapshot?.screenshotAbsolutePath) {
          screenshotAbsolute = data.xmlSnapshot.screenshotAbsolutePath;
          console.log("✅ [StructuralMatching] 使用步骤卡片提供的截图绝对路径:", screenshotAbsolute);
        } else {
          const screenshotFilename = inferScreenshotPath(data.xmlCacheId!);
          screenshotAbsolute = await getScreenshotAbsolutePath(screenshotFilename);
        }

        const dataUrl = await imageCache.loadDataUrlWithCache(screenshotAbsolute);
        setScreenshotUrl(dataUrl);
        console.log("✅ [StructuralMatching] 截图加载成功");

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
    [inferScreenshotPath, getScreenshotAbsolutePath, parseElementTreeData]
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
