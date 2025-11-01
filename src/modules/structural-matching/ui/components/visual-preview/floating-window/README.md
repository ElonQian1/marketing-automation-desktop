// src/modules/structural-matching/ui/components/visual-preview/floating-window/README.md
// module: structural-matching | layer: ui | role: 文档
// summary: 悬浮窗口视口对齐修复说明

# 悬浮窗口视口对齐修复

## 概述

本模块解决了悬浮视口没有对准所点选元素结构树位置的问题，确保用户能看到完整的目标元素而不是只显示 1/4 的内容。

## 核心组件

### 工具模块 (utils/)

- `viewport-alignment.ts` - 智能视口对齐算法
- `coordinate-transform.ts` - 坐标变换工具
- `element-bounds-corrector.ts` - 元素边界校正器

### 组件模块 (components/)

- `floating-visual-window.tsx` - 悬浮可视化窗口
- `aligned-image-display.tsx` - 对齐图像显示
- `screenshot-display.tsx` - 增强截图显示

### 类型定义 (types/)

- `index.ts` - 相关类型定义

## 使用方式

```typescript
import {
  calculateViewportAlignment,
  correctElementBounds,
  AlignedImageDisplay,
} from "./floating-window";

// 自动集成到现有悬浮窗口系统，无需额外配置
```

## 修复效果

- ✅ 完整显示目标元素结构树
- ✅ 精确对齐到用户点击位置
- ✅ 自动检测并校正父元素使用问题
- ✅ 保持模块化架构设计

详细测试指南请查看 `test/viewport-alignment-test.md`。
