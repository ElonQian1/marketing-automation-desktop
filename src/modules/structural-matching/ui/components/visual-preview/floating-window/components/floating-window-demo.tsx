// src/modules/structural-matching/ui/components/visual-preview/floating-window/components/floating-window-demo.tsx
// module: structural-matching | layer: ui | role: component
// summary: 浮窗可视化演示组件

import React, { useState } from "react";
import { FloatingVisualWindow } from "./floating-visual-window";
import type { StepCardData } from "../types";

/**
 * 浮窗可视化演示组件
 * 用于测试和演示浮窗功能
 */
export function FloatingWindowDemo() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedStepCard, setSelectedStepCard] = useState<StepCardData | undefined>();

  // 模拟步骤卡片数据
  const mockStepCardData: StepCardData = {
    xmlCacheId: "ui_dump_demo_20241030_122312.xml",
    original_element: {
      id: "demo-element-001",
      text: "示例按钮",
      description: "这是一个示例UI元素",
      type: "Button",
      category: "interactive",
      position: { x: 100, y: 200, width: 200, height: 50 },
      clickable: true,
      importance: "high" as const,
      userFriendlyName: "示例按钮",
      resourceId: "com.example:id/demo_button",
      contentDesc: "示例按钮描述",
      className: "android.widget.Button",
      bounds: "[100,200][300,250]",
    },
    elementContext: {
      xpath: "//android.widget.Button[@resource-id='com.example:id/demo_button']",
      bounds: "[100,200][300,250]",
      text: "示例按钮",
      resourceId: "com.example:id/demo_button",
      className: "android.widget.Button",
    },
  };

  return (
    <div
      className="light-theme-force floating-window-demo"
      style={{
        padding: "20px",
        backgroundColor: "var(--bg-light-base)",
        color: "var(--text-inverse)",
        minHeight: "200px",
      }}
    >
      <h3 style={{ marginBottom: "16px", color: "var(--text-inverse)" }}>
        浮窗可视化演示
      </h3>
      
      <div style={{ marginBottom: "16px" }}>
        <p style={{ color: "var(--text-inverse)", marginBottom: "12px" }}>
          点击下方按钮打开浮窗可视化窗口：
        </p>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setSelectedStepCard(mockStepCardData);
              setIsVisible(true);
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#722ed1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            🚀 打开浮窗 (模拟数据)
          </button>
          
          <button
            onClick={() => {
              setSelectedStepCard(undefined);
              setIsVisible(true);
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--bg-3)",
              color: "var(--text-inverse)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            📝 打开空浮窗
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ff4757",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ❌ 关闭浮窗
          </button>
        </div>
      </div>

      {/* 当前状态显示 */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "var(--bg-light-2, #f8f9fa)",
          border: "1px solid var(--border-light, #e1e5e9)",
          borderRadius: "6px",
          fontSize: "12px",
          color: "var(--text-inverse)",
        }}
      >
        <div><strong>当前状态：</strong></div>
        <div>浮窗可见: {isVisible ? "✅ 是" : "❌ 否"}</div>
        <div>步骤卡片: {selectedStepCard ? "✅ 已选择" : "❌ 未选择"}</div>
        {selectedStepCard && (
          <div style={{ marginTop: "8px" }}>
            <div><strong>卡片信息：</strong></div>
            <div>XML Cache ID: {selectedStepCard.xmlCacheId}</div>
            <div>元素类型: {selectedStepCard.original_element?.type}</div>
            <div>元素文本: {selectedStepCard.original_element?.text}</div>
          </div>
        )}
      </div>

      {/* 模块化架构说明 */}
      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          backgroundColor: "var(--bg-light-1, #ffffff)",
          border: "1px solid var(--border-light, #e1e5e9)",
          borderRadius: "8px",
          color: "var(--text-inverse)",
        }}
      >
        <h4 style={{ marginBottom: "12px", color: "var(--text-inverse)" }}>
          📁 模块化架构
        </h4>
        <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
          <div><strong>floating-window/</strong></div>
          <div style={{ marginLeft: "16px" }}>
            <div>├── <strong>components/</strong> - UI组件模块</div>
            <div style={{ marginLeft: "16px" }}>
              <div>├── floating-visual-window.tsx - 主组件</div>
              <div>├── floating-window-frame.tsx - 窗口框架</div>
              <div>├── screenshot-display.tsx - 截图显示</div>
              <div>└── element-tree-view.tsx - 元素树</div>
            </div>
            <div>├── <strong>hooks/</strong> - 数据逻辑钩子</div>
            <div style={{ marginLeft: "16px" }}>
              <div>└── use-step-card-data.ts - 数据加载Hook</div>
            </div>
            <div>├── <strong>utils/</strong> - 工具函数</div>
            <div style={{ marginLeft: "16px" }}>
              <div>└── coordinate-transform.ts - 坐标变换</div>
            </div>
            <div>├── <strong>types/</strong> - 类型定义</div>
            <div style={{ marginLeft: "16px" }}>
              <div>└── index.ts - 接口类型</div>
            </div>
            <div>└── <strong>index.ts</strong> - 统一导出</div>
          </div>
        </div>
      </div>

      {/* 浮窗组件 */}
      <FloatingVisualWindow
        visible={isVisible}
        stepCardData={selectedStepCard}
        initialPosition={{ x: 150, y: 150 }}
        onClose={() => setIsVisible(false)}
      />
    </div>
  );
}