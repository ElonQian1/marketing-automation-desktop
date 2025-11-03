// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-floating-toolbar.tsx
// module: structural-matching | layer: ui | role: 子组件（工具栏）
// summary: 浮窗顶部工具栏，包含视图切换、正在编辑提示与原始属性开关

import React from "react";

export type StructuralMatchingViewMode = "screenshot" | "tree" | "split";

export interface StructuralMatchingFloatingToolbarProps {
  viewMode: StructuralMatchingViewMode;
  onViewModeChange: (mode: StructuralMatchingViewMode) => void;
  showRawAttrs: boolean;
  onToggleRawAttrs: () => void;
  editingInfo?: { type: string; label: string; id: string } | null;
  highlightInfo?: { type: string; label: string; id: string } | null;
}

function ToolbarImpl({
  viewMode,
  onViewModeChange,
  showRawAttrs,
  onToggleRawAttrs,
  editingInfo,
  highlightInfo,
}: StructuralMatchingFloatingToolbarProps) {
  return (
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
      {/* 左侧：视图模式切换 */}
      <div style={{ display: "flex", gap: "4px" }}>
        {(["screenshot", "tree", "split"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
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

      {/* 中部：当前编辑 / 高亮指示 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {editingInfo ? (
          <div
            title={`正在编辑：${editingInfo.type} · ${editingInfo.label} · ${editingInfo.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--text-2)",
              background: "var(--bg-2)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: "2px 8px",
              maxWidth: 360,
            }}
          >
            <span style={{ color: "#faad14" }}>正在编辑</span>
            <span
              style={{
                color: "var(--text-1)",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {editingInfo.type} · {editingInfo.label}
            </span>
            <span style={{ color: "var(--text-3)" }}>{editingInfo.id}</span>
          </div>
        ) : null}

        {highlightInfo ? (
          <div
            title={`正在查看：${highlightInfo.type} · ${highlightInfo.label} · ${highlightInfo.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--text-2)",
              background: "var(--bg-2)",
              border: "1px dashed #722ed1",
              borderRadius: 12,
              padding: "2px 8px",
              maxWidth: 360,
            }}
          >
            <span style={{ color: "#722ed1" }}>正在查看</span>
            <span
              style={{
                color: "var(--text-1)",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {highlightInfo.type} · {highlightInfo.label}
            </span>
            <span style={{ color: "var(--text-3)" }}>{highlightInfo.id}</span>
          </div>
        ) : null}
      </div>

      {/* 右侧：原始属性开关 */}
      <div>
        <button
          onClick={onToggleRawAttrs}
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            backgroundColor: showRawAttrs ? "var(--bg-3)" : "transparent",
            color: showRawAttrs ? "var(--text-1)" : "var(--text-2)",
            cursor: "pointer",
          }}
        >
          {showRawAttrs ? "🧾 原始属性：开" : "🧾 原始属性：关"}
        </button>
      </div>
    </div>
  );
}

export const StructuralMatchingFloatingToolbar = React.memo(ToolbarImpl);
