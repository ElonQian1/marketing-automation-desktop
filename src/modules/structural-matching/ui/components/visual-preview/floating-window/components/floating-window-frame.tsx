// src/modules/structural-matching/ui/components/visual-preview/floating-window/components/floating-window-frame.tsx
// module: structural-matching | layer: ui | role: component
// summary: 浮窗框架组件

import React, { useState, useRef, useEffect } from "react";
import { WindowState } from "../types";

interface FloatingWindowFrameProps {
  children: React.ReactNode;
  title: string;
  windowState: WindowState;
  onWindowStateChange: (state: WindowState) => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 浮窗框架组件 - 提供拖拽、调整大小、最小化功能
 */
export function FloatingWindowFrame({
  children,
  title,
  windowState,
  onWindowStateChange,
  onClose,
  className = "",
  style = {},
}: FloatingWindowFrameProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (windowState.isMinimized) return;
    
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // 处理拖拽中
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    onWindowStateChange({
      ...windowState,
      position: { x: newX, y: newY },
    });
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 处理调整大小
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !windowRef.current) return;

    const rect = windowRef.current.getBoundingClientRect();
    const newWidth = Math.max(300, e.clientX - rect.left);
    const newHeight = Math.max(200, e.clientY - rect.top);

    onWindowStateChange({
      ...windowState,
      size: { width: newWidth, height: newHeight },
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // 绑定全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      return () => {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing]);

  // 最小化切换
  const toggleMinimize = () => {
    onWindowStateChange({
      ...windowState,
      isMinimized: !windowState.isMinimized,
    });
  };

  return (
    <div
      ref={windowRef}
      className={`floating-window-frame ${className}`}
      style={{
        position: "fixed",
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.isMinimized ? "auto" : windowState.size.width,
        height: windowState.isMinimized ? "auto" : windowState.size.height,
        backgroundColor: "var(--bg-base)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        zIndex: 1000,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* 窗口标题栏 */}
      <div
        ref={headerRef}
        className="floating-window-header"
        style={{
          height: "40px",
          background: "var(--bg-2)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
        onMouseDown={handleDragStart}
      >
        <div
          className="window-title"
          style={{
            color: "var(--text-1)",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {title}
        </div>
        
        <div className="window-controls" style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={toggleMinimize}
            style={{
              width: "20px",
              height: "20px",
              background: "var(--bg-3)",
              border: "none",
              borderRadius: "4px",
              color: "var(--text-2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={windowState.isMinimized ? "展开" : "最小化"}
          >
            {windowState.isMinimized ? "□" : "─"}
          </button>
          
          <button
            onClick={onClose}
            style={{
              width: "20px",
              height: "20px",
              background: "#ff4757",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>

      {/* 窗口内容区域 */}
      {!windowState.isMinimized && (
        <div
          className="floating-window-content"
          style={{
            height: "calc(100% - 40px)",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      )}

      {/* 调整大小手柄 */}
      {!windowState.isMinimized && (
        <div
          className="resize-handle"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "20px",
            height: "20px",
            cursor: "se-resize",
            background: "linear-gradient(135deg, transparent 0%, transparent 40%, var(--border-color) 45%, var(--border-color) 55%, transparent 60%)",
          }}
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}