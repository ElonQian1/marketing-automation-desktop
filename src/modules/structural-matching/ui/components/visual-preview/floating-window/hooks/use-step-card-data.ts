// src/modules/structural-matching/ui/components/visual-preview/floating-window/hooks/use-step-card-data.ts
// module: structural-matching | layer: ui | role: hooks
// summary: 从步骤卡片数据加载XML和截图的Hook

import { useState, useEffect, useCallback } from "react";
import { StepCardData, ElementTreeData, LoadingState } from "../types";
import XmlCacheManager from "../../../../../../../services/xml-cache-manager";
import { parseXML } from "../../../../../../../components/universal-ui/xml-parser";
import imageCache from "../../../../../../../components/xml-cache/utils/imageCache";
import { invoke } from "@tauri-apps/api/core";
import { calculateSmartCrop } from "../utils/precise-crop-calculator";
import { generateCropDebugInfo, logCropDebugInfo } from "../utils/crop-debug-helper";
import type { VisualUIElement } from "../../../../../../../components/universal-ui/views/visual-view/types/visual-types";

/**
 * 从步骤卡片数据加载相关信息的Hook
 */
export function useStepCardData(stepCardData?: StepCardData) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingText: "",
  });
  
  const [elementTreeData, setElementTreeData] = useState<ElementTreeData | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [xmlContent, setXmlContent] = useState<string>("");

  /**
   * 从XML缓存ID推断截图文件名
   */
  const inferScreenshotPath = useCallback((xmlCacheId: string): string => {
    // ui_dump_e0d909c3_20251030_122312.xml -> ui_dump_e0d909c3_20251030_122312.png
    return xmlCacheId.replace('.xml', '.png');
  }, []);

  /**
   * 获取截图的绝对路径
   */
  const getScreenshotAbsolutePath = useCallback(async (filename: string): Promise<string> => {
    try {
      const absolutePath = await invoke<string>("get_xml_file_absolute_path", {
        filename,
      });
      console.log("✅ 获取截图绝对路径:", absolutePath);
      return absolutePath;
    } catch (error) {
      console.error("❌ 获取截图绝对路径失败:", error);
      throw error;
    }
  }, []);

  /**
   * 解析元素结构树数据
   */
  const parseElementTreeData = useCallback(async (
    xmlContent: string,
    rootElement: VisualUIElement
  ): Promise<ElementTreeData> => {
    console.log("🔍 开始解析元素结构树数据");
    
    // 解析XML获取所有元素
    const parseResult = await parseXML(xmlContent);
    const allElements = parseResult.elements;
    console.log("✅ XML解析完成，元素数量:", allElements.length);

    // 提取根元素的bounds
    const bounds = rootElement.bounds;
    if (!bounds) {
      throw new Error("根元素缺少bounds信息");
    }
    
    // 处理不同格式的bounds数据
    let left: number, top: number, right: number, bottom: number;
    
    if (typeof bounds === 'string') {
      // 字符串格式: "[546,225][1067,1083]"
      const matches = bounds.match(/\d+/g)?.map(Number) || [];
      [left, top, right, bottom] = matches;
    } else if (typeof bounds === 'object' && bounds !== null) {
      // 对象格式: {left: 546, top: 225, right: 1067, bottom: 1083}
      const boundsObj = bounds as { left: number; top: number; right: number; bottom: number };
      left = boundsObj.left;
      top = boundsObj.top;
      right = boundsObj.right;
      bottom = boundsObj.bottom;
    } else {
      throw new Error("bounds格式不正确");
    }
    
    if (left === undefined || top === undefined || right === undefined || bottom === undefined) {
      throw new Error("无法解析根元素bounds信息");
    }
    
    const rootBounds = {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };

    console.log("📐 [解析] 根元素边界:", rootBounds);

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

    console.log("✅ 筛选出相关子元素数量:", childElements.length);

    const elementTreeData = {
      rootElement,
      childElements,
      bounds: rootBounds,
    };

    // 🎯 添加调试信息
    try {
      const debugInfo = generateCropDebugInfo(elementTreeData);
      logCropDebugInfo(debugInfo);
    } catch (error) {
      console.warn("调试信息生成失败:", error);
    }

    return elementTreeData;
  }, []);

  /**
   * 加载数据的主要函数
   */
  const loadData = useCallback(async (data: StepCardData) => {
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
      // 1. 从缓存获取XML
      console.log("🔍 从缓存获取XML:", data.xmlCacheId);
      const xmlCacheManager = XmlCacheManager.getInstance();
      const cacheEntry = await xmlCacheManager.getCachedXml(data.xmlCacheId);
      
      if (!cacheEntry?.xmlContent) {
        throw new Error("XML缓存数据不存在");
      }

      setXmlContent(cacheEntry.xmlContent);
      console.log("✅ XML加载成功，长度:", cacheEntry.xmlContent.length);

      // 2. 解析元素结构树
      setLoadingState({
        isLoading: true,
        loadingText: "正在解析元素结构...",
      });

      const treeData = await parseElementTreeData(
        cacheEntry.xmlContent,
        data.original_element
      );
      setElementTreeData(treeData);

      // 3. 加载截图
      setLoadingState({
        isLoading: true,
        loadingText: "正在加载截图...",
      });

      const screenshotFilename = inferScreenshotPath(data.xmlCacheId);
      const absolutePath = await getScreenshotAbsolutePath(screenshotFilename);
      const dataUrl = await imageCache.loadDataUrlWithCache(absolutePath);
      
      setScreenshotUrl(dataUrl);
      console.log("✅ 截图加载成功");

      setLoadingState({
        isLoading: false,
        loadingText: "",
      });

    } catch (error) {
      console.error("❌ 数据加载失败:", error);
      setLoadingState({
        isLoading: false,
        loadingText: "",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }, [inferScreenshotPath, getScreenshotAbsolutePath, parseElementTreeData]);

  // 监听stepCardData变化，自动加载数据
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
  }, [stepCardData, loadData]);

  return {
    loadingState,
    elementTreeData,
    screenshotUrl,
    xmlContent,
    reload: () => stepCardData && loadData(stepCardData),
  };
}