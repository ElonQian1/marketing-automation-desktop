// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-element-tree.tsx
// module: structural-matching | layer: ui | role: 组件
// summary: 结构匹配元素树视图组件

import React, { useState } from "react";
import { ElementTreeData } from "../types";
import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";

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
    const hasChildren = !isRoot && childElements.length > 0;

    return (
      <div key={nodeId} className="element-tree-node">
        {/* 节点内容 */}
        <div
          className={`element-node-content ${isSelected ? "selected" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: depth * 20 + 8,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            cursor: "pointer",
            backgroundColor: isSelected ? "var(--bg-3)" : "transparent",
            borderRadius: "4px",
            margin: "1px 0",
            transition: "background-color 0.2s ease",
          }}
          onClick={() => onElementSelect?.(element.id)}
          onMouseEnter={() => onElementHover?.(element.id)}
          onMouseLeave={() => onElementHover?.(null)}
        >
          {/* 展开/折叠按钮 */}
          {(isRoot || hasChildren) && (
            <button
              className="expand-toggle"
              style={{
                width: "16px",
                height: "16px",
                border: "none",
                background: "transparent",
                color: "var(--text-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "4px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(nodeId);
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}

          {/* 元素信息 */}
          <div className="element-info" style={{ flex: 1, minWidth: 0 }}>
            <div
              className="element-type"
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: isRoot ? "#722ed1" : "var(--text-1)",
                marginBottom: "2px",
              }}
            >
              {isRoot ? "Root Element" : getElementTypeDisplay(element)}
              {element.position && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-3)",
                    marginLeft: "8px",
                  }}
                >
                  {element.position.width}×{element.position.height}
                </span>
              )}
            </div>

            <div
              className="element-text"
              style={{
                fontSize: "11px",
                color: "var(--text-2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={getElementDisplayText(element)}
            >
              {getElementDisplayText(element)}
            </div>
          </div>

          {/* 元素属性指示器 */}
          <div className="element-indicators" style={{ marginLeft: "8px" }}>
            {element.clickable && (
              <span
                style={{
                  fontSize: "10px",
                  backgroundColor: "#52c41a",
                  color: "white",
                  padding: "1px 4px",
                  borderRadius: "2px",
                  marginLeft: "2px",
                }}
                title="可点击"
              >
                C
              </span>
            )}
            {element.importance === "high" && (
              <span
                style={{
                  fontSize: "10px",
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  padding: "1px 4px",
                  borderRadius: "2px",
                  marginLeft: "2px",
                }}
                title="高重要性"
              >
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
      className={`structural-matching-element-tree ${className}`}
      style={{
        height: "100%",
        overflow: "auto",
        padding: "8px",
        fontSize: "12px",
        backgroundColor: "var(--bg-1)",
        ...style,
      }}
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
