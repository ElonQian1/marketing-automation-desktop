// src/modules/structural-matching/ui/components/visual-preview/floating-window/components/floating-visual-window.tsx
// module: structural-matching | layer: ui | role: component
// summary: 浮窗可视化窗口主组件

import React, { useState, useEffect } from "react";
import { FloatingVisualWindowProps, WindowState } from "../types";
import { useStepCardData } from "../hooks/use-step-card-data";
import { calculateSmartCrop, calculateSmartCropForElement } from "../utils/precise-crop-calculator";
import type { CropConfig } from "../types";
import { calculateViewportAlignment } from "../utils/viewport-alignment";
import {
  correctElementBounds,
  recalculateChildElements,
} from "../utils/element-bounds-corrector";
import { FloatingWindowFrame } from "./floating-window-frame";
import { ScreenshotDisplay } from "./screenshot-display";
import { ElementTreeView } from "./element-tree-view";

/**
 * 浮窗可视化窗口主组件
 */
export function FloatingVisualWindow({
  visible,
  stepCardData,
  highlightedElementId,
  initialPosition = { x: 100, y: 100 },
  onClose,
}: FloatingVisualWindowProps) {
  // 使用数据加载Hook
  const { loadingState, elementTreeData, screenshotUrl, reload } =
    useStepCardData(stepCardData);

  // 裁剪配置（可基于当前选中/高亮元素动态重算）
  const [cropConfig, setCropConfig] = useState<CropConfig | undefined>(() =>
    elementTreeData ? calculateSmartCrop(elementTreeData) : undefined
  );

  // 计算最佳视口对齐
  const viewportAlignment =
    elementTreeData && cropConfig
      ? calculateViewportAlignment(elementTreeData, cropConfig, initialPosition)
      : null;

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

  // 当元素树数据变化时，初始化裁剪为“根元素”
  useEffect(() => {
    if (elementTreeData) {
      setCropConfig(calculateSmartCrop(elementTreeData));
    } else {
      setCropConfig(undefined);
    }
  }, [elementTreeData]);

  // 选中的元素
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // 视图模式：'screenshot' | 'tree' | 'split'
  const [viewMode, setViewMode] = useState<"screenshot" | "tree" | "split">(
    "screenshot"
  );

  // 监听高亮元素变化
  useEffect(() => {
    if (highlightedElementId) {
      setSelectedElementId(highlightedElementId);
    }
  }, [highlightedElementId]);

  // 处理元素选择
  const handleElementSelect = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  // 处理元素悬停
  const handleElementHover = (elementId: string | null) => {
    setHoveredElementId(elementId);
  };

  // 焦点元素变化时，按目标元素重算裁剪区域（优先选中，其次悬停）
  useEffect(() => {
    if (!elementTreeData) return;
    const focusId = selectedElementId || hoveredElementId;
    if (focusId) {
      setCropConfig(calculateSmartCropForElement(elementTreeData, focusId));
    } else {
      setCropConfig(calculateSmartCrop(elementTreeData));
    }
  }, [selectedElementId, hoveredElementId, elementTreeData]);

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
      <div>{loadingState.loadingText || "加载中..."}</div>
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
        重试
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
          请选择步骤卡片查看可视化
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
            <ScreenshotDisplay
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
            <ElementTreeView
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
              <ScreenshotDisplay
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
              <ElementTreeView
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

      <FloatingWindowFrame
        title={`可视化窗口 ${
          stepCardData?.xmlCacheId ? `- ${stepCardData.xmlCacheId}` : ""
        }`}
        windowState={windowState}
        onWindowStateChange={setWindowState}
        onClose={() => onClose?.()}
      >
        {renderToolbar()}
        {renderMainContent()}
      </FloatingWindowFrame>
    </>
  );
}
