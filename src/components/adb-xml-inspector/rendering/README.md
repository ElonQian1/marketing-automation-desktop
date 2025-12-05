# ADB XML Inspector 渲染模块

## 模块概述

`rendering` 模块负责将 Android UI XML 节点树转换为正确渲染顺序的可视化元素。

### 核心问题

Android UI 层级结构复杂，特别是包含以下特殊容器时：

- **DrawerLayout**: 侧边抽屉会覆盖主内容
- **Dialog/BottomSheet**: 对话框覆盖所有内容
- **PopupWindow**: 弹出窗口
- **FloatingActionButton**: 浮动按钮

简单的深度优先遍历无法正确处理这些覆盖层关系。

### 解决方案

```
rendering/
├── types.ts              # 类型定义
├── semantic-detector.ts  # 语义检测器 - 识别特殊布局容器
├── layer-analyzer.ts     # 层级分析器 - 计算正确的渲染顺序
└── index.ts              # 模块导出
```

## 核心组件

### 1. SemanticDetector (语义检测器)

识别 Android 节点的语义类型：

```typescript
import { SemanticDetector, SemanticNodeType } from './rendering';

const type = SemanticDetector.detectType(node, context);
// 返回: DRAWER_LAYOUT, DRAWER_CONTENT, BOTTOM_NAVIGATION, DIALOG 等
```

**支持的语义类型：**

| 类型 | 说明 | z-index 加成 |
|------|------|-------------|
| SYSTEM_UI | 状态栏/导航栏 | +100000 |
| DIALOG | 对话框 | +50000 |
| POPUP | 弹出窗口 | +40000 |
| DRAWER_CONTENT | 抽屉内容 | +30000 |
| FAB | 浮动按钮 | +20000 |
| BOTTOM_NAVIGATION | 底部导航 | +10000 |
| TOP_BAR | 顶部栏 | +5000 |
| NORMAL | 普通节点 | 0 |

### 2. LayerAnalyzer (层级分析器)

将节点树转换为正确渲染顺序的扁平列表：

```typescript
import { LayerAnalyzer } from './rendering';

const result = LayerAnalyzer.analyze(rootNode);

// result.renderOrder: 按 z-index 排序的节点列表
// result.screenSize: 屏幕尺寸
// result.metadata: 统计信息
```

**点击测试 (Hit Testing)：**

```typescript
const hitResult = LayerAnalyzer.hitTest(renderOrder, {
  point: { x: 100, y: 200 },
  topMostOnly: true, // 只返回最顶层节点
});

if (hitResult.topMost) {
  console.log('点击到:', hitResult.topMost.node);
}
```

## z-index 计算规则

```
zIndex = baseZIndex + semanticBoost

baseZIndex = depth * 1000 + siblingIndex * 10 + globalOrder
```

- `depth`: 节点深度，保证子节点在父节点之上
- `siblingIndex`: 同级索引，后出现的在前出现的之上
- `globalOrder`: 全局顺序，作为 tie-breaker
- `semanticBoost`: 语义类型加成，特殊容器获得额外提升

## 使用示例

```tsx
import { LayerAnalyzer, RenderableNode } from './rendering';

function ScreenPreview({ root }) {
  const { renderOrder, screenSize, metadata } = LayerAnalyzer.analyze(root);
  
  return (
    <div style={{ width: screenSize.width, height: screenSize.height }}>
      {renderOrder.map(({ node, bounds, zIndex, isOverlay }) => (
        <div
          key={zIndex}
          style={{
            position: 'absolute',
            left: bounds.x1,
            top: bounds.y1,
            width: bounds.w,
            height: bounds.h,
            zIndex: zIndex,
            border: isOverlay ? '2px dashed orange' : '1px solid gray',
          }}
        />
      ))}
    </div>
  );
}
```

## 扩展指南

### 添加新的语义类型

1. 在 `types.ts` 中添加枚举值：
```typescript
export enum SemanticNodeType {
  // ...
  NEW_TYPE = 'new_type',
}
```

2. 在 `semantic-detector.ts` 中添加检测逻辑：
```typescript
const NEW_TYPE_PATTERNS = ['SomeClassName', 'AnotherClass'];

// 在 detectType 方法中添加检测
if (this.matchesPattern(className, NEW_TYPE_PATTERNS)) {
  return SemanticNodeType.NEW_TYPE;
}
```

3. 设置 z-index 加成：
```typescript
static getZIndexBoost(type: SemanticNodeType): number {
  switch (type) {
    case SemanticNodeType.NEW_TYPE:
      return 25000; // 根据需要调整
    // ...
  }
}
```

## 设计原则

1. **单一职责**: 每个类只负责一个功能
2. **开闭原则**: 通过添加新的语义类型扩展，无需修改核心逻辑
3. **可测试性**: 纯函数设计，易于单元测试
4. **向后兼容**: `flattenNodesWithBounds` 保持旧接口
