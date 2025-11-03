// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-element-tree.tsx
// module: structural-matching | layer: ui | role: 组件
// summary: 结构匹配元素树视图组件

import React, { useEffect, useRef, useState } from "react";
import "./structural-matching-visual-preview.css";
import { ElementTreeData } from "../types";
import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";
import { structuralMatchingCoordinationBus } from "../core";

interface StructuralMatchingElementTreeProps {
  elementTreeData?: ElementTreeData;
  selectedElementId?: string;
  onElementSelect?: (elementId: string) => void;
  onElementHover?: (elementId: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 结构匹配元素树视图组件
 * 显示元素层次结构并支持交互选择
 */
export function StructuralMatchingElementTree({
  elementTreeData,
  selectedElementId,
  onElementSelect,
  onElementHover,
  className = "",
  style = {},
}: StructuralMatchingElementTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["root"])
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // rAF 节流：将总线高亮事件合并到动画帧，降低频繁状态更新
  const rafRef = useRef<number | null>(null);
  const pendingHighlightRef = useRef<string | null>(null);

  // 订阅协调总线的高亮事件，实现与覆盖层联动（不触发窗口重绘）
  useEffect(() => {
    const unsubscribe = structuralMatchingCoordinationBus.subscribe((evt) => {
      if (evt.type === "highlight") {
        pendingHighlightRef.current = evt.elementId ?? null;
      } else if (evt.type === "clear") {
        pendingHighlightRef.current = null;
      } else {
        return;
      }

      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setHighlightedId(pendingHighlightRef.current);
        });
      }
    });
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      unsubscribe();
    };
  }, []);

  // 当高亮变化时，自动展开并滚动到高亮节点
  useEffect(() => {
    if (!highlightedId) return;
    // 确保根展开（当前数据结构为平铺的 childElements）
    if (!expandedNodes.has("root")) {
      const next = new Set(expandedNodes);
      next.add("root");
      setExpandedNodes(next);
    }
    // 滚动到可视区域
    if (containerRef.current) {
      const el = containerRef.current.querySelector<HTMLElement>(
        `[data-node-id="${highlightedId}"]`
      );
      if (el) {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  }, [highlightedId, expandedNodes]);

  if (!elementTreeData) {
    return (
      <div
  className={`structural-matching-element-tree-placeholder ${className}`}
        style={{
          padding: "16px",
          color: "var(--text-2)",
          textAlign: "center",
          ...style,
        }}
      >
        📋 暂无元素数据
      </div>
    );
  }

  const { rootElement, childElements } = elementTreeData;

  // 切换节点展开状态
  const toggleNodeExpansion = (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // 获取元素显示文本
  const getElementDisplayText = (element: VisualUIElement): string => {
    if (element.text?.trim()) {
      return `"${element.text.trim()}"`;
    }
    if (element.description?.trim()) {
      return `[${element.description.trim()}]`;
    }
    if (element.resourceId) {
      return `#${element.resourceId}`;
    }
    return element.type || "Unknown";
  };

  // 获取元素类型显示
  const getElementTypeDisplay = (element: VisualUIElement): string => {
    return element.type || "Element";
  };

  // 渲染元素节点
  const renderElementNode = (
    element: VisualUIElement,
    depth: number = 0,
    isRoot: boolean = false
  ) => {
    const nodeId = isRoot ? "root" : element.id;
    const isExpanded = expandedNodes.has(nodeId);
    const isSelected = selectedElementId === element.id;
    const isHighlighted = highlightedId === element.id;

    return (
      <div key={nodeId} className="element-tree-node">
        {/* 节点内容 */}
        <div
          className={`element-node-content ${isSelected ? "is-selected" : ""} ${
            isHighlighted ? "is-highlighted" : ""
          }`}
          style={{
            paddingLeft: depth * 20 + 8,
          }}
          onClick={() => onElementSelect?.(element.id)}
          onMouseEnter={() => onElementHover?.(element.id)}
          onMouseLeave={() => onElementHover?.(null)}
          data-node-id={isRoot ? "root" : element.id}
        >
          {/* 展开/折叠按钮 */}
          {isRoot && (
            <button
              className="expand-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(nodeId);
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}

          {/* 元素信息 */}
          <div className="element-info">
            <div
              className={`element-type ${isRoot ? "root" : ""}`}
            >
              {isRoot ? "Root Element" : getElementTypeDisplay(element)}
              {element.position && (
                <span className="size">
                  {element.position.width}×{element.position.height}
                </span>
              )}
            </div>

            <div className="element-text" title={getElementDisplayText(element)}>
              {getElementDisplayText(element)}
            </div>
          </div>

          {/* 元素属性指示器 */}
          <div className="element-indicators">
            {element.clickable && (
              <span className="badge clickable" title="可点击">
                C
              </span>
            )}
            {element.importance === "high" && (
              <span className="badge important" title="高重要性">
                !
              </span>
            )}
          </div>
        </div>

        {/* 子节点 */}
        {isRoot && isExpanded && childElements.length > 0 && (
          <div className="child-elements">
            {childElements.map((childElement) =>
              renderElementNode(childElement, depth + 1, false)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`structural-matching-element-tree sm-tree ${className}`}
      style={{
        ...style,
      }}
      ref={containerRef}
    >
      <div className="tree-header" style={{ marginBottom: "8px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "var(--text-1)",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "4px",
          }}
        >
          📋 元素结构树 ({childElements.length} 个子元素)
        </div>
      </div>

      <div className="tree-content">
        {renderElementNode(rootElement, 0, true)}
      </div>
    </div>
  );
}
