// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-floating-window.tsx
// module: structural-matching | layer: ui | role: 组件
// summary: 结构匹配浮窗主组件 - 整合截图、元素树、视口对齐等功能

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { StructuralMatchingRawAttributesPanel } from "./structural-matching-raw-attributes-panel";
import { extractElementByIdFromXml } from "../utils/structural-matching-subtree-extractor";
import {
  loadUIPreferences,
  saveUIPreferences,
} from "../core/preferences/structural-matching-preferences";
import { structuralMatchingCoordinationBus } from "../core";
import { StructuralMatchingFloatingToolbar } from "./structural-matching-floating-toolbar.tsx";

const MemoOverlay = React.memo(StructuralMatchingScreenshotOverlay);
const MemoTree = React.memo(StructuralMatchingElementTree);

export function StructuralMatchingFloatingWindow({
  visible,
  stepCardData,
  highlightedElementId,
  initialPosition = { x: 100, y: 100 },
  onClose,
}: FloatingVisualWindowProps) {
  const { loadingState, elementTreeData, screenshotUrl, xmlContent, reload } =
    useStructuralMatchingStepData(stepCardData);

  const [cropConfig, setCropConfig] = useState<CropConfig | undefined>(() =>
    elementTreeData ? calculateSmartCrop(elementTreeData) : undefined
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [busHighlightId, setBusHighlightId] = useState<string | null>(null);

  // 统一规范 elementId，防止存在 element_123 / element-123 混用导致联动失效
  const normalizeElementId = useCallback((id: string | null) => {
    if (!id) return null;
    return id.replace(/element[_-](\d+)/, (_m, g1) => `element-${g1}`);
  }, []);

  const viewportAlignment = useMemo(() => {
    if (!elementTreeData || !cropConfig) return null;

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

    const temp = { ...elementTreeData, bounds: anchorBounds } as typeof elementTreeData;
    return calculateViewportAlignment(temp, cropConfig, undefined, undefined, {
      mode: "right-edge",
      margin: 24,
    });
  }, [elementTreeData, cropConfig, selectedElementId, xmlContent]);

  const [windowState, setWindowState] = useState<WindowState>(() => ({
    position: viewportAlignment?.windowPosition || initialPosition,
    size: viewportAlignment?.windowSize || { width: 800, height: 600 },
    isMinimized: false,
  }));

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
    viewportAlignment?.windowPosition.x,
    viewportAlignment?.windowPosition.y,
    viewportAlignment?.windowSize.width,
    viewportAlignment?.windowSize.height,
  ]);

  useEffect(() => {
    if (elementTreeData) {
      setCropConfig(calculateSmartCrop(elementTreeData));
    } else {
      setCropConfig(undefined);
    }
  }, [elementTreeData]);

  const [viewMode, setViewMode] = useState<"screenshot" | "tree" | "split">(
    "screenshot"
  );
  const [showRawAttrs, setShowRawAttrs] = useState<boolean>(
    () => loadUIPreferences().showRawAttributes
  );

  useEffect(() => {
    saveUIPreferences({ showRawAttributes: showRawAttrs });
  }, [showRawAttrs]);

  useEffect(() => {
    if (highlightedElementId) {
      const normalized = highlightedElementId.replace(
        /element[_-](\d+)/,
        (_m, g1) => `element-${g1}`
      );
      setSelectedElementId(normalized);
    }
  }, [highlightedElementId]);

  // 订阅协调总线的高亮事件，用于在工具栏展示“正在查看/高亮”的元素信息
  useEffect(() => {
    const unsubscribe = structuralMatchingCoordinationBus.subscribe((evt) => {
      if (evt.type === "highlight") {
        setBusHighlightId(evt.elementId ?? null);
      } else if (evt.type === "clear") {
        setBusHighlightId(null);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTreeElementSelect = useCallback((elementId: string) => {
    const normalized = normalizeElementId(elementId) as string;
    setSelectedElementId(normalized);
    structuralMatchingCoordinationBus.emit({
      type: "highlight",
      elementId: normalized,
      source: "tree",
    });
  }, [normalizeElementId]);

  const handleTreeElementHover = useCallback((elementId: string | null) => {
    const normalized = normalizeElementId(elementId);
    if (normalized) {
      structuralMatchingCoordinationBus.emit({
        type: "highlight",
        elementId: normalized,
        source: "tree",
      });
    } else {
      structuralMatchingCoordinationBus.emit({ type: "clear", source: "tree" });
    }
  }, [normalizeElementId]);

  const handleOverlayElementHover = useCallback((elementId: string | null) => {
    const normalized = normalizeElementId(elementId);
    if (normalized) {
      structuralMatchingCoordinationBus.emit({
        type: "highlight",
        elementId: normalized,
        source: "overlay",
      });
    } else {
      structuralMatchingCoordinationBus.emit({ type: "clear", source: "overlay" });
    }
  }, [normalizeElementId]);

  const handleOverlayElementClick = useCallback((elementId: string) => {
    const normalized = normalizeElementId(elementId) as string;
    setSelectedElementId(normalized); // Update local state
    structuralMatchingCoordinationBus.emit({
      type: "select", // Changed from "highlight" to "select" to trigger tree scroll
      elementId: normalized,
      source: "overlay",
    });
  }, [normalizeElementId]);

  useEffect(() => {
    if (!elementTreeData) return;

    const focusId = selectedElementId ?? null;
    if (!focusId) {
      setCropConfig(calculateSmartCrop(elementTreeData));
      return;
    }

    const targetElement =
      elementTreeData.rootElement.id === focusId
        ? elementTreeData.rootElement
        : elementTreeData.childElements.find((e) => e.id === focusId);

    if (targetElement) {
      const crop = calculateSmartCropForElement(
        elementTreeData,
        targetElement.id
      );
      setCropConfig(crop);
    } else if (xmlContent) {
      const xmlElement = extractElementByIdFromXml(xmlContent, focusId);
      if (xmlElement) {
        const crop = calculateSmartCropForElement(
          elementTreeData,
          xmlElement.id
        );
        setCropConfig(crop);
      } else {
        setCropConfig(calculateSmartCrop(elementTreeData));
      }
    } else {
      setCropConfig(calculateSmartCrop(elementTreeData));
    }
  }, [selectedElementId, elementTreeData, xmlContent]);

  const renderLoadingContent = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: "12px",
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

  const renderErrorContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
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

  const editingInfo = useMemo(() => {
    if (!elementTreeData) return null;
    const focusId = selectedElementId;
    if (!focusId) return null;
    const fromTree =
      elementTreeData.rootElement.id === focusId
        ? elementTreeData.rootElement
        : elementTreeData.childElements.find((e) => e.id === focusId);
    const resolved = fromTree || (xmlContent ? extractElementByIdFromXml(xmlContent, focusId) : null);
    if (!resolved) return null;
    const label = (() => {
      if (resolved.text?.trim()) return `"${resolved.text.trim()}"`;
      if (resolved.description?.trim()) return `[${resolved.description.trim()}]`;
      if (resolved.resourceId) return `#${resolved.resourceId}`;
      return resolved.type || "Element";
    })();
    return {
      type: resolved.type || "Element",
      label,
      id: resolved.id,
    };
  }, [elementTreeData, selectedElementId, xmlContent]);

  const highlightInfo = useMemo(() => {
    if (!elementTreeData) return null;
    const focusId = busHighlightId;
    if (!focusId) return null;
    const fromTree =
      elementTreeData.rootElement.id === focusId
        ? elementTreeData.rootElement
        : elementTreeData.childElements.find((e) => e.id === focusId);
    const resolved = fromTree || (xmlContent ? extractElementByIdFromXml(xmlContent, focusId) : null);
    if (!resolved) return null;
    const label = (() => {
      if (resolved.text?.trim()) return `"${resolved.text.trim()}"`;
      if (resolved.description?.trim()) return `[${resolved.description.trim()}]`;
      if (resolved.resourceId) return `#${resolved.resourceId}`;
      return resolved.type || "Element";
    })();
    return {
      type: resolved.type || "Element",
      label,
      id: resolved.id,
    };
  }, [elementTreeData, busHighlightId, xmlContent]);

  const handleViewModeChange = useCallback((mode: "screenshot" | "tree" | "split") => {
    setViewMode(mode);
  }, []);

  const handleToggleRawAttrs = useCallback(() => {
    setShowRawAttrs((v) => !v);
  }, []);

  const renderMainContent = () => {
    if (loadingState.isLoading) return renderLoadingContent();
    if (loadingState.error) return renderErrorContent();

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

    const baseContentHeight = showRawAttrs
      ? "calc(100% - 40px - 164px)"
      : "calc(100% - 40px)";
    const contentStyle = {
      height: baseContentHeight,
      overflow: "hidden" as const,
    };

    switch (viewMode) {
      case "screenshot":
        return (
          <div style={contentStyle}>
            <MemoOverlay
              screenshotUrl={screenshotUrl}
              elementTreeData={elementTreeData}
              cropConfig={cropConfig}
              viewportAlignment={viewportAlignment}
              selectedElementId={selectedElementId}
              onElementHover={handleOverlayElementHover}
              onElementClick={handleOverlayElementClick}
              style={{ height: "100%" }}
            />
          </div>
        );
      case "tree":
        return (
          <div style={contentStyle}>
            <MemoTree
              elementTreeData={elementTreeData}
              selectedElementId={selectedElementId}
              onElementSelect={handleTreeElementSelect}
              onElementHover={handleTreeElementHover}
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
              <MemoOverlay
                screenshotUrl={screenshotUrl}
                elementTreeData={elementTreeData}
                cropConfig={cropConfig}
                viewportAlignment={viewportAlignment}
                selectedElementId={selectedElementId}
                onElementHover={handleOverlayElementHover}
                onElementClick={handleOverlayElementClick}
                style={{ height: "100%" }}
              />
            </div>
            <div style={{ width: "300px" }}>
              <MemoTree
                elementTreeData={elementTreeData}
                selectedElementId={selectedElementId}
                onElementSelect={handleTreeElementSelect}
                onElementHover={handleTreeElementHover}
                style={{ height: "100%" }}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <>
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
        <StructuralMatchingFloatingToolbar
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showRawAttrs={showRawAttrs}
          onToggleRawAttrs={handleToggleRawAttrs}
          editingInfo={editingInfo}
          highlightInfo={highlightInfo && editingInfo && highlightInfo.id === editingInfo.id ? null : highlightInfo}
        />
        {renderMainContent()}
        {showRawAttrs && elementTreeData && (
          <StructuralMatchingRawAttributesPanel
            element={(() => {
              const focusId =
                selectedElementId ?? elementTreeData.rootElement.id;
              if (elementTreeData.rootElement.id === focusId)
                return elementTreeData.rootElement;
              const inTree = elementTreeData.childElements.find(
                (e) => e.id === focusId
              );
              if (inTree) return inTree;
              if (xmlContent) {
                const fromXml = extractElementByIdFromXml(
                  xmlContent,
                  focusId
                );
                if (fromXml) return fromXml;
              }
              return elementTreeData.rootElement;
            })()}
            style={{ height: 164 }}
          />
        )}
      </StructuralMatchingWindowFrame>
    </>
  );
}
