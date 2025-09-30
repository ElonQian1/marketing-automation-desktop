# 通用拖拽网格布局系统

## 🎯 概述

这是一个**完全模块化的拖拽网格布局系统**，从联系人导入页面的拖拽功能中提取和优化而来。任何页面都可以轻松复用此系统。

### ✅ 核心特性

- **🎯 标题栏拖拽** - 只有面板标题栏空白区域可拖拽
- **🛡️ 事件隔离** - 按钮和内容区域完全不受拖拽影响  
- **⚡ 性能优化** - 智能事件处理和渲染优化
- **📱 响应式设计** - 支持多断点自适应布局
- **💾 状态持久化** - 布局状态的保存和恢复
- **📋 预设模板** - 常用布局模板快速应用

### 🏗️ 模块结构

```
src/components/universal-ui/grid-layout/
├── components/                 # 核心组件
│   ├── DraggableGridLayout.tsx      # 主布局组件
│   ├── DraggableHeaderPanel.tsx    # 可拖拽面板
│   └── GridLayoutToolbar.tsx       # 布局工具栏
├── hooks/                      # React Hooks
│   └── useDraggableGrid.ts         # 主要Hook
├── utils/                      # 工具函数
│   ├── DragBehaviorOptimizer.ts    # 拖拽行为优化器
│   ├── dragConfigFactory.ts        # 拖拽配置工厂
│   └── index.ts                     # 工具函数集合
├── types.ts                    # TypeScript类型定义
├── templates.ts                # 布局模板
└── index.ts                    # 统一导出
```

## 🚀 快速开始

### 1. 基础使用

```tsx
import React from 'react';
import { 
  DraggableGridLayout, 
  createPanel,
  createDragConfig 
} from '@/components/universal-ui/grid-layout';

function MyPage() {
  // 创建面板配置
  const panels = [
    createPanel('panel1', '面板1', 0, 0, 6, 4, <div>内容1</div>),
    createPanel('panel2', '面板2', 6, 0, 6, 4, <div>内容2</div>),
    createPanel('panel3', '面板3', 0, 4, 12, 4, <div>内容3</div>),
  ];

  return (
    <DraggableGridLayout
      panels={panels}
      dragConfig={createDragConfig('header')}
      showToolbar={true}
      onLayoutChange={(layout) => console.log('布局变化:', layout)}
    />
  );
}
```

### 2. 使用Hook进行状态管理

```tsx
import React from 'react';
import { 
  useDraggableGrid, 
  DraggableGridLayout,
  createPanel 
} from '@/components/universal-ui/grid-layout';

function AdvancedPage() {
  const initialPanels = [
    createPanel('devices', '设备管理', 0, 0, 4, 12),
    createPanel('tools', '工具面板', 4, 0, 8, 6),
    createPanel('data', '数据面板', 4, 6, 8, 6),
  ];

  const {
    panels,
    updatePanel,
    togglePanel,
    saveLayout,
    loadLayout,
    resetLayout,
    performance
  } = useDraggableGrid(initialPanels);

  return (
    <div>
      {/* 自定义工具栏 */}
      <div className="custom-toolbar">
        <button onClick={() => saveLayout('my-layout')}>保存布局</button>
        <button onClick={() => loadLayout('my-layout')}>加载布局</button>
        <button onClick={resetLayout}>重置布局</button>
        <span>渲染次数: {performance.renderCount}</span>
      </div>

      {/* 网格布局 */}
      <DraggableGridLayout
        panels={panels}
        onPanelVisibilityChange={(id, visible) => {
          console.log(`面板 ${id} 可见性: ${visible}`);
        }}
      />
    </div>
  );
}
```

### 3. 使用预设模板

```tsx
import React from 'react';
import { 
  DraggableGridLayout,
  workbenchTemplate,
  contactImportTemplate,
  getTemplate
} from '@/components/universal-ui/grid-layout';

function TemplateBasedPage() {
  // 使用工作台模板
  const workbenchPanels = workbenchTemplate.panels.map(panel => ({
    ...panel,
    content: getContentByPanelId(panel.id) // 替换为实际内容
  }));

  return (
    <DraggableGridLayout
      panels={workbenchPanels}
      showToolbar={true}
      enableVersionManagement={true}
    />
  );
}

function getContentByPanelId(id: string) {
  switch (id) {
    case 'devices': return <DeviceManager />;
    case 'tools': return <ToolPanel />;
    case 'data': return <DataPanel />;
    default: return <div>默认内容</div>;
  }
}
```

## 📋 API 文档

### DraggableGridLayout 组件

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `panels` | `GridPanel[]` | - | 面板配置数组 |
| `dragConfig` | `DragConfig` | header模式 | 拖拽行为配置 |
| `onLayoutChange` | `(layout) => void` | - | 布局变化回调 |
| `onPanelVisibilityChange` | `(id, visible) => void` | - | 面板可见性变化回调 |
| `showToolbar` | `boolean` | `false` | 是否显示工具栏 |
| `className` | `string` | - | 自定义样式类名 |

### useDraggableGrid Hook

```tsx
const {
  panels,           // 当前面板列表
  updatePanel,      // 更新面板: (id, updates) => void
  addPanel,         // 添加面板: (panel) => void
  removePanel,      // 删除面板: (id) => void
  togglePanel,      // 切换可见性: (id) => void
  resetLayout,      // 重置布局: () => void
  saveLayout,       // 保存布局: (name) => void
  loadLayout,       // 加载布局: (name) => void
  performance       // 性能指标
} = useDraggableGrid(initialPanels, config);
```

### 拖拽配置选项

```tsx
import { createDragConfig } from '@/components/universal-ui/grid-layout';

// 预设配置
const headerConfig = createDragConfig('header');     // 标题栏拖拽（推荐）
const fullConfig = createDragConfig('full');         // 全面板拖拽
const minimalConfig = createDragConfig('minimal');   // 极简配置
const mobileConfig = createDragConfig('mobile');     // 移动端配置

// 自定义配置
const customConfig = createDragConfig('header', {
  dragThreshold: 5,
  enableVisualFeedback: true,
  noDragSelectors: ['.my-custom-button', '.special-area']
});
```

## 🎨 样式定制

### CSS变量

```css
.draggable-grid-layout {
  --grid-margin: 10px;
  --grid-padding: 10px;
  --panel-border-radius: 4px;
  --drag-hover-bg: rgba(24, 144, 255, 0.02);
  --drag-active-bg: rgba(24, 144, 255, 0.06);
  --drag-active-shadow: 0 0 0 1px rgba(24, 144, 255, 0.2);
}
```

### 自定义拖拽样式

```css
/* 标题栏拖拽区域 */
.draggable-header {
  cursor: move;
  user-select: none;
  transition: background-color 0.2s ease;
}

/* 拖拽激活状态 */
.drag-optimized-area.drag-active {
  background-color: var(--drag-active-bg);
  box-shadow: var(--drag-active-shadow);
}

/* 受保护区域 */
.drag-protected-area {
  cursor: default;
  pointer-events: auto;
}
```

## 📱 响应式配置

```tsx
const responsiveConfig = {
  breakpoints: {
    xxl: 1600,
    xl: 1200, 
    lg: 992,
    md: 768,
    sm: 576,
    xs: 0
  },
  gridSettings: {
    cols: {
      xxl: 12, xl: 12, lg: 12,
      md: 10, sm: 6, xs: 4
    },
    rowHeight: 60,
    margin: [10, 10],
    containerPadding: [10, 10]
  }
};
```

## 🔧 高级用法

### 1. 自定义面板组件

```tsx
import { DraggableHeaderPanel } from '@/components/universal-ui/grid-layout';

function CustomPanel({ title, onRefresh }) {
  return (
    <DraggableHeaderPanel
      title={title}
      headerActions={
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          刷新
        </Button>
      }
      showCloseButton={true}
      enableAutoScroll={true}
    >
      <YourContent />
    </DraggableHeaderPanel>
  );
}
```

### 2. 事件监听

```tsx
<DraggableGridLayout
  panels={panels}
  onLayoutChange={(layout) => {
    console.log('布局变化', layout);
    // 保存到本地存储
    localStorage.setItem('layout', JSON.stringify(layout));
  }}
  onPanelVisibilityChange={(panelId, visible) => {
    console.log(`面板 ${panelId} ${visible ? '显示' : '隐藏'}`);
  }}
/>
```

### 3. 性能优化

```tsx
// 使用轻量级Hook（适用于简单场景）
import { useLightDraggableGrid } from '@/components/universal-ui/grid-layout';

const { panels, updatePanel, togglePanel } = useLightDraggableGrid(initialPanels);
```

## 🎯 迁移指南

### 从现有页面迁移

1. **提取面板配置**
```tsx
// 老代码
<div className="panel">
  <h3>设备管理</h3>
  <DeviceList />
</div>

// 新代码  
const panels = [
  createPanel('devices', '设备管理', 0, 0, 6, 8, <DeviceList />)
];
```

2. **替换布局组件**
```tsx
// 老代码
<div className="grid-container">
  {panels.map(panel => <div key={panel.id}>{panel.content}</div>)}
</div>

// 新代码
<DraggableGridLayout panels={panels} />
```

3. **迁移拖拽功能**
```tsx
// 老代码需要大量拖拽处理逻辑

// 新代码只需配置
<DraggableGridLayout
  panels={panels}
  dragConfig={createDragConfig('header')}
/>
```

## 📋 最佳实践

### ✅ 推荐做法

1. **使用标题栏拖拽配置**
```tsx
const config = createDragConfig('header'); // 推荐
```

2. **面板ID使用语义化命名**
```tsx
createPanel('device-manager', '设备管理', ...);  // ✅ 好
createPanel('panel1', '面板1', ...);              // ❌ 不好
```

3. **合理设置面板尺寸**
```tsx
// 考虑不同屏幕尺寸的适配
createPanel('sidebar', '侧边栏', 0, 0, 3, 12);  // 占1/4宽度
createPanel('main', '主内容', 3, 0, 9, 12);      // 占3/4宽度
```

### ❌ 避免的问题

1. **不要在拖拽区域放置复杂交互**
2. **避免面板内容过度复杂导致性能问题**
3. **不要忘记处理面板可见性状态**

## 🧪 测试建议

```tsx
// 测试拖拽功能
test('应该能够拖拽面板', () => {
  render(<DraggableGridLayout panels={testPanels} />);
  
  const header = screen.getByText('面板标题');
  fireEvent.mouseDown(header);
  fireEvent.mouseMove(header, { clientX: 100, clientY: 100 });
  fireEvent.mouseUp(header);
  
  // 验证位置变化
  expect(onLayoutChange).toHaveBeenCalled();
});

// 测试按钮不被劫持
test('按钮应该正常点击', () => {
  render(<DraggableGridLayout panels={testPanels} />);
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  expect(onButtonClick).toHaveBeenCalled();
});
```

## 📞 支持

如有问题或建议，请参考：
- 源码：`src/components/universal-ui/grid-layout/`
- 示例：联系人导入工作台的实际使用
- 文档：本README和代码注释

---

**🎉 现在您可以在任何页面中轻松使用这个强大的拖拽布局系统了！**