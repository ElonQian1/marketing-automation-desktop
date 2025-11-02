// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-floating-window.tsx
// module: structural-matching | layer: ui | role: 组件
// summary: 结构匹配浮窗主组件 - 整合截图、元素树、视口对齐等功能

import React, { useState, useEffect } from "react";
import { FloatingVisualWindowProps, WindowState } from "../types";
import { useStructuralMatchingStepData } from "../hooks/use-structural-matching-step-data";
import {
  calculateSmartCrop,
  calculateSmartCropForElement,
} from "../core/structural-matching-crop-calculator";
import type { CropConfig } from "../types";
import { calculateViewportAlignment } from "../core/structural-matching-viewport-alignment";
import { StructuralMatchingWindowFrame } from "./structural-matching-window-frame";
import { StructuralMatchingScreenshotOverlay } from "./structural-matching-screenshot-overlay";
import { StructuralMatchingElementTree } from "./structural-matching-element-tree";
import { extractElementByIdFromXml } from "../utils/structural-matching-subtree-extractor";

/**
 * 结构匹配浮窗主组件
 * 整合截图显示、元素树视图、视口对齐等功能
 */
export function StructuralMatchingFloatingWindow({
  visible,
  stepCardData,
  highlightedElementId,
  initialPosition = { x: 100, y: 100 },
  onClose,
}: FloatingVisualWindowProps) {
  // 使用数据加载Hook
  const { loadingState, elementTreeData, screenshotUrl, xmlContent, reload } =
    useStructuralMatchingStepData(stepCardData);

  // 裁剪配置（可基于当前选中/高亮元素动态重算）
  const [cropConfig, setCropConfig] = useState<CropConfig | undefined>(() =>
    elementTreeData ? calculateSmartCrop(elementTreeData) : undefined
  );

  // 选中的元素（需在 viewportAlignment 计算前定义，避免引用次序问题）
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );

  // 计算最佳视口对齐（窗口位置锚定到选中元素的bounds，兜底XML）
  const viewportAlignment = (() => {
    if (!elementTreeData || !cropConfig) return null;

    // 窗口定位锚点：优先选中元素在树中的position；否则XML兜底；再否则用root
    let anchorBounds = elementTreeData.bounds;
    const focusId = selectedElementId ?? null;
    if (focusId) {
      const inTree =
        elementTreeData.rootElement.id === focusId ||
        elementTreeData.childElements.some((e) => e.id === focusId);
      if (inTree) {
        const target =
          elementTreeData.rootElement.id === focusId
            ? elementTreeData.rootElement
            : elementTreeData.childElements.find((e) => e.id === focusId)!;
        if (target?.position) {
          anchorBounds = {
            x: target.position.x,
            y: target.position.y,
            width: target.position.width,
            height: target.position.height,
          };
        }
      } else if (xmlContent) {
        const target = extractElementByIdFromXml(xmlContent, focusId);
        if (target?.position) {
          anchorBounds = {
            x: target.position.x,
            y: target.position.y,
            width: target.position.width,
            height: target.position.height,
          };
        }
      }
    }

    const temp = {
      ...elementTreeData,
      bounds: anchorBounds,
    } as typeof elementTreeData;
    return calculateViewportAlignment(temp, cropConfig, initialPosition);
  })();

  // 窗口状态管理 - 使用计算出的最佳尺寸和位置
  const [windowState, setWindowState] = useState<WindowState>(() => ({
    position: viewportAlignment?.windowPosition || initialPosition,
    size: viewportAlignment?.windowSize || { width: 800, height: 600 },
    isMinimized: false,
  }));

  // 当计算完成或依赖变化时，更新窗口状态
  // 只依赖具体的值,而非整个对象引用,避免无限循环
  useEffect(() => {
    if (viewportAlignment) {
      setWindowState((prev) => ({
        ...prev,
        position: viewportAlignment.windowPosition,
        size: viewportAlignment.windowSize,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // 只监听具体的值变化
    viewportAlignment?.windowPosition.x,
    viewportAlignment?.windowPosition.y,
    viewportAlignment?.windowSize.width,
    viewportAlignment?.windowSize.height,
  ]);

  // 当元素树数据变化时，初始化裁剪为"根元素"
  useEffect(() => {
    if (elementTreeData) {
      setCropConfig(calculateSmartCrop(elementTreeData));
    } else {
      setCropConfig(undefined);
    }
  }, [elementTreeData]);

  // 视图模式：'screenshot' | 'tree' | 'split'
  const [viewMode, setViewMode] = useState<"screenshot" | "tree" | "split">(
    "screenshot"
  );

  // 监听高亮元素变化
  useEffect(() => {
    if (highlightedElementId) {
      // 规范化ID：支持 element_43 / element-43
      const normalized = highlightedElementId.replace(
        /element[_-](\d+)/,
        (_m, g1) => `element-${g1}`
      );
      setSelectedElementId(normalized);
    }
  }, [highlightedElementId]);

  // 处理元素选择
  const handleElementSelect = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  // 处理元素悬停（保持接口兼容，但不影响视口）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleElementHover = (_elementId: string | null) => {
    // 悬停状态仅用于视觉反馈，不触发裁剪重算
  };

  // 焦点元素变化时，按目标元素重算裁剪区域（优先选中）
  useEffect(() => {
    if (!elementTreeData) return;
    
    const focusId = selectedElementId ?? null;
    if (!focusId) {
      // 没有选中元素时，使用默认裁剪
      setCropConfig(calculateSmartCrop(elementTreeData));
      return;
    }

    // 尝试在元素树中查找目标元素
    const targetElement =
      elementTreeData.rootElement.id === focusId
        ? elementTreeData.rootElement
        : elementTreeData.childElements.find((e) => e.id === focusId);

    if (targetElement) {
      // 在树中找到，使用 calculateSmartCropForElement
      const crop = calculateSmartCropForElement(elementTreeData, targetElement.id);
      setCropConfig(crop);
    } else if (xmlContent) {
      // 不在树中，尝试从 XML 提取
      const xmlElement = extractElementByIdFromXml(xmlContent, focusId);
      if (xmlElement) {
        const crop = calculateSmartCropForElement(elementTreeData, xmlElement.id);
        setCropConfig(crop);
      } else {
        // 找不到元素，使用默认裁剪
        setCropConfig(calculateSmartCrop(elementTreeData));
      }
    } else {
      // 没有 XML，使用默认裁剪
      setCropConfig(calculateSmartCrop(elementTreeData));
    }
  }, [selectedElementId, elementTreeData, xmlContent]);

  // 渲染加载状态
  const renderLoadingContent = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: "12px",
        color: "var(--text-2)",
      }}
    >
      <div
        className="loading-spinner"
        style={{
          width: "24px",
          height: "24px",
          border: "2px solid var(--border-color)",
          borderTop: "2px solid #722ed1",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <div>{loadingState.loadingText || "⏳ 加载中..."}</div>
    </div>
  );

  // 渲染错误状态
  const renderErrorContent = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: "12px",
        color: "var(--text-error, #ff4d4f)",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: "500" }}>❌ 加载失败</div>
      <div style={{ fontSize: "14px", color: "var(--text-2)" }}>
        {loadingState.error}
      </div>
      <button
        onClick={reload}
        style={{
          padding: "8px 16px",
          backgroundColor: "var(--bg-3)",
          border: "1px solid var(--border-color)",
          borderRadius: "4px",
          color: "var(--text-1)",
          cursor: "pointer",
        }}
      >
        🔄 重试
      </button>
    </div>
  );

  // 渲染工具栏
  const renderToolbar = () => (
    <div
      style={{
        height: "40px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        backgroundColor: "var(--bg-1)",
      }}
    >
      {/* 视图模式切换 */}
      <div style={{ display: "flex", gap: "4px" }}>
        {(["screenshot", "tree", "split"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              backgroundColor:
                viewMode === mode ? "var(--bg-3)" : "transparent",
              color: viewMode === mode ? "var(--text-1)" : "var(--text-2)",
              cursor: "pointer",
            }}
          >
            {mode === "screenshot" && "📷 截图"}
            {mode === "tree" && "🌳 结构"}
            {mode === "split" && "📋 分屏"}
          </button>
        ))}
      </div>

      {/* 统计信息 */}
      {elementTreeData && (
        <div style={{ fontSize: "11px", color: "var(--text-3)" }}>
          {elementTreeData.childElements.length} 个元素
        </div>
      )}
    </div>
  );

  // 渲染主内容
  const renderMainContent = () => {
    if (loadingState.isLoading) {
      return renderLoadingContent();
    }

    if (loadingState.error) {
      return renderErrorContent();
    }

    if (!stepCardData || !elementTreeData || !screenshotUrl) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--text-2)",
          }}
        >
          📋 请选择步骤卡片查看可视化
        </div>
      );
    }

    // 根据视图模式渲染内容
    const contentStyle = {
      height: "calc(100% - 40px)", // 减去工具栏高度
      overflow: "hidden",
    };

    switch (viewMode) {
      case "screenshot":
        return (
          <div style={contentStyle}>
            <StructuralMatchingScreenshotOverlay
              screenshotUrl={screenshotUrl}
              elementTreeData={elementTreeData}
              cropConfig={cropConfig}
              viewportAlignment={viewportAlignment}
              onElementHover={handleElementHover}
              onElementClick={handleElementSelect}
              style={{ height: "100%" }}
            />
          </div>
        );

      case "tree":
        return (
          <div style={contentStyle}>
            <StructuralMatchingElementTree
              elementTreeData={elementTreeData}
              selectedElementId={selectedElementId}
              onElementSelect={handleElementSelect}
              onElementHover={handleElementHover}
              style={{ height: "100%" }}
            />
          </div>
        );

      case "split":
        return (
          <div style={{ ...contentStyle, display: "flex" }}>
            <div
              style={{ flex: 1, borderRight: "1px solid var(--border-color)" }}
            >
              <StructuralMatchingScreenshotOverlay
                screenshotUrl={screenshotUrl}
                elementTreeData={elementTreeData}
                cropConfig={cropConfig}
                viewportAlignment={viewportAlignment}
                onElementHover={handleElementHover}
                onElementClick={handleElementSelect}
                style={{ height: "100%" }}
              />
            </div>
            <div style={{ width: "300px" }}>
              <StructuralMatchingElementTree
                elementTreeData={elementTreeData}
                selectedElementId={selectedElementId}
                onElementSelect={handleElementSelect}
                onElementHover={handleElementHover}
                style={{ height: "100%" }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* 添加旋转动画CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <StructuralMatchingWindowFrame
        title={`🎯 结构匹配可视化 ${
          stepCardData?.xmlCacheId ? `- ${stepCardData.xmlCacheId}` : ""
        }`}
        windowState={windowState}
        onWindowStateChange={setWindowState}
        onClose={() => onClose?.()}
      >
        {renderToolbar()}
        {renderMainContent()}
      </StructuralMatchingWindowFrame>
    </>
  );
}
