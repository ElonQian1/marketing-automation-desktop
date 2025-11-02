// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-raw-attributes-panel.tsx
// module: structural-matching | layer: ui | role: 只读原始属性面板
// summary: 展示选中元素的原始 XML 属性（原样，不做映射/拼接/省略）

import React from "react";
import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";
import { normalizeAttributes } from "../utils/structural-matching-attribute-normalizer";

interface StructuralMatchingRawAttributesPanelProps {
  element?: VisualUIElement | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 只读原始属性面板：严格显示 XML 原始字段值
 */
export const StructuralMatchingRawAttributesPanel: React.FC<
  StructuralMatchingRawAttributesPanelProps
> = ({ element, className = "", style = {} }) => {
  if (!element) {
    return (
      <div
        className={`structural-matching-raw-attrs ${className}`}
        style={{
          padding: 8,
          fontSize: 12,
          color: "var(--text-2)",
          background: "var(--bg-1)",
          borderTop: "1px solid var(--border-color)",
          ...style,
        }}
      >
        无选中元素
      </div>
    );
  }

  // 原样展示的字段：严格来自 XML 对应属性
  const rawItems: Array<[string, string | number | boolean | undefined]> = [
    ["text", element.text],
    ["content-desc", element.contentDesc],
    ["resource-id", element.resourceId],
    ["class", element.className],
    [
      "bounds",
      element.bounds ||
        (element.position
          ? `[${element.position.x},${element.position.y}][${
              element.position.x + element.position.width
            },${element.position.y + element.position.height}]`
          : undefined),
    ],
    ["clickable", element.clickable],
    ["xml-index", element.xmlIndex],
  ];

  // 解析后的回退值（用于展示，解决用户看到全部为空的问题）
  const normalized = normalizeAttributes(element);
  const normalizedItems: Array<[string, string | undefined]> = [
    ["text(解析)", normalized.text],
    ["content-desc(解析)", normalized.contentDesc],
    ["resource-id(解析)", normalized.resourceId],
    ["class(解析)", normalized.className],
  ];

  return (
    <div
      className={`structural-matching-raw-attrs ${className}`}
      style={{
        padding: 8,
        fontSize: 12,
        background: "var(--bg-1)",
        color: "var(--text-1)",
        borderTop: "1px solid var(--border-color)",
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        rowGap: 4,
        columnGap: 8,
        ...style,
      }}
    >
      {/* 原始值 */}
      {rawItems.map(([k, v]) => (
        <React.Fragment key={`raw-${k}`}>
          <div style={{ color: "var(--text-3)" }}>{k}</div>
          <div
            className="light-theme-force"
            style={{
              background: "var(--bg-light-base, #ffffff)",
              color: "var(--text-inverse, #1e293b)",
              padding: "2px 6px",
              borderRadius: 4,
              minHeight: 20,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              border: "1px solid var(--border-color)",
            }}
            title={v === undefined || v === "" ? "(空)" : String(v)}
          >
            {v === undefined || v === "" ? "(空)" : String(v)}
          </div>
        </React.Fragment>
      ))}

      {/* 解析值（回退后） */}
      {normalizedItems.map(([k, v]) => (
        <React.Fragment key={`norm-${k}`}>
          <div style={{ color: "var(--text-3)" }}>{k}</div>
          <div
            className="light-theme-force"
            style={{
              background: "var(--bg-light-base, #ffffff)",
              color: "var(--text-inverse, #1e293b)",
              padding: "2px 6px",
              borderRadius: 4,
              minHeight: 20,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              border: "1px solid var(--border-color)",
            }}
            title={v === undefined || v === "" ? "(空)" : String(v)}
          >
            {v === undefined || v === "" ? "(空)" : String(v)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
