# 页面分析器模块 (Page Analyzer)

## 📦 模块概述

页面分析器模块是一个完全模块化的UI元素分析工具，用于解析、展示和分析移动应用页面的UI元素结构。

### 🏗️ 架构特点

- ✅ **完全模块化**: 所有组件独立，文件大小 < 300行
- ✅ **TypeScript严格模式**: 完整类型定义和类型安全
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **高度可复用**: 组件可独立使用或组合使用
- ✅ **性能优化**: 使用React Hooks和useMemo优化

### 📁 目录结构

```
page-analyzer/
├── components/           # 核心组件 (4个文件)
│   ├── ElementTree.tsx          # 元素树组件 (~200行)
│   ├── PropertyPanel.tsx        # 属性面板组件 (~250行)
│   ├── MatchStrategySelector.tsx # 匹配策略选择器 (~280行)
│   └── PageAnalyzerContainer.tsx # 容器组件 (~180行)
├── hooks/               # 状态管理Hooks (2个文件)
│   ├── usePageAnalyzerState.ts  # 主状态管理 (~180行)
│   └── useElementTree.ts        # 树状结构管理 (~150行)
├── types/               # 类型定义 (1个文件)
│   └── index.ts                 # 完整类型定义 (~270行)
└── index.ts             # 模块导出 (~40行)
```

### 📊 文件大小统计

| 文件 | 行数 | 状态 |
|------|------|------|
| ElementTree.tsx | ~200 | ✅ |
| PropertyPanel.tsx | ~250 | ✅ |
| MatchStrategySelector.tsx | ~280 | ✅ |
| PageAnalyzerContainer.tsx | ~180 | ✅ |
| usePageAnalyzerState.ts | ~180 | ✅ |
| useElementTree.ts | ~150 | ✅ |
| types/index.ts | ~270 | ✅ |

**总计**: 7个核心文件，所有文件均 < 300行，远低于500行限制。

## 🎯 核心组件

### 1. ElementTree 组件

**功能**: 元素树状结构展示
- 🌳 树状结构显示UI元素层级
- 🔍 实时搜索和过滤
- 📂 展开/折叠节点控制
- 🎯 元素选择和高亮
- 📊 统计信息显示

```typescript
import { ElementTree } from '@/components/feature-modules/page-analyzer';

<ElementTree
  elements={elements}
  selectedElement={selectedElement}
  onElementSelect={handleElementSelect}
  searchKeyword={searchKeyword}
  onSearch={handleSearch}
  size="small"
/>
```

### 2. PropertyPanel 组件

**功能**: 元素属性详情显示
- 📋 分组显示元素属性
- 🏷️ 格式化属性值显示
- 📋 一键复制属性值
- 🎨 交互状态可视化
- 📐 位置信息详细展示

```typescript
import { PropertyPanel } from '@/components/feature-modules/page-analyzer';

<PropertyPanel
  selectedElement={selectedElement}
  showCopyButtons={true}
  compact={false}
  onCopyProperty={handleCopyProperty}
/>
```

### 3. MatchStrategySelector 组件

**功能**: 匹配策略配置器
- 🎯 5种预设匹配策略
- ⚙️ 自定义字段配置
- 🔧 包含/排除条件设置
- ⚡ 一键自动填充
- 🧪 匹配测试功能

```typescript
import { MatchStrategySelector } from '@/components/feature-modules/page-analyzer';

<MatchStrategySelector
  matchCriteria={matchCriteria}
  referenceElement={selectedElement}
  onChange={handleMatchCriteriaChange}
  onTestMatch={handleMatchTest}
/>
```

### 4. PageAnalyzerContainer 组件

**功能**: 完整的页面分析器容器
- 🎛️ 集成所有子组件
- 📱 响应式布局
- 📊 状态管理协调
- 🔄 数据流控制
- 📈 实时统计显示

```typescript
import { PageAnalyzerContainer } from '@/components/feature-modules/page-analyzer';

<PageAnalyzerContainer
  initialXmlContent={xmlContent}
  deviceInfo={{ deviceId: 'device1', deviceName: 'Test Device' }}
  onMatchTest={handleMatchTest}
  onElementSelect={handleElementSelect}
/>
```

## 🎨 Hooks API

### usePageAnalyzerState

**核心状态管理Hook**，提供页面分析器的完整状态管理：

```typescript
import { usePageAnalyzerState } from '@/components/feature-modules/page-analyzer';

const {
  // 状态
  xmlContent,
  elements,
  selectedElement,
  searchKeyword,
  filteredElements,
  statistics,
  isLoading,
  error,
  
  // 操作方法
  setXmlContent,
  setSelectedElement,
  searchElements,
  applyFilter,
  setMatchCriteria,
  resetState,
} = usePageAnalyzerState();
```

### useElementTree

**元素树状态管理Hook**，处理树状结构的展开/折叠：

```typescript
import { useElementTree } from '@/components/feature-modules/page-analyzer';

const {
  treeNodes,
  flattenedNodes,
  selectedNodeId,
  toggleNodeExpansion,
  expandAll,
  collapseAll,
  expandToNode,
  searchInTree,
} = useElementTree(elements);
```

## 🔧 类型系统

### 核心类型

```typescript
// UI元素基础信息
interface UIElement {
  id: string;
  type: string;
  text: string;
  resourceId: string;
  contentDesc: string;
  clickable: boolean;
  bounds: ElementBounds;
  // ... 更多属性
}

// 匹配策略
type MatchStrategy = 
  | 'standard'    // 标准匹配（推荐）
  | 'strict'      // 严格匹配
  | 'relaxed'     // 宽松匹配
  | 'positionless'// 无位置匹配
  | 'absolute'    // 绝对匹配
  | 'custom';     // 自定义策略

// 匹配条件
interface MatchCriteria {
  strategy: MatchStrategy;
  fields: string[];
  values: Record<string, string>;
  includes?: Record<string, string[]>;
  excludes?: Record<string, string[]>;
}
```

## 🚀 使用示例

### 基础使用

```typescript
import React from 'react';
import { PageAnalyzerContainer } from '@/components/feature-modules/page-analyzer';

const MyPageAnalyzer = () => {
  const handleMatchTest = async (criteria) => {
    // 实现匹配测试逻辑
    console.log('测试匹配条件:', criteria);
  };

  const handleElementSelect = (element) => {
    console.log('选中元素:', element);
  };

  return (
    <PageAnalyzerContainer
      initialXmlContent={xmlData}
      deviceInfo={{
        deviceId: 'device001',
        deviceName: 'Samsung Galaxy S21'
      }}
      onMatchTest={handleMatchTest}
      onElementSelect={handleElementSelect}
    />
  );
};
```

### 高级组合使用

```typescript
import React from 'react';
import { Row, Col } from 'antd';
import { 
  ElementTree, 
  PropertyPanel, 
  MatchStrategySelector,
  usePageAnalyzerState 
} from '@/components/feature-modules/page-analyzer';

const CustomPageAnalyzer = () => {
  const {
    elements,
    selectedElement,
    searchKeyword,
    matchCriteria,
    setSelectedElement,
    searchElements,
    setMatchCriteria,
  } = usePageAnalyzerState();

  return (
    <Row gutter={16}>
      <Col span={8}>
        <ElementTree
          elements={elements}
          selectedElement={selectedElement}
          onElementSelect={setSelectedElement}
          searchKeyword={searchKeyword}
          onSearch={searchElements}
        />
      </Col>
      <Col span={8}>
        <PropertyPanel
          selectedElement={selectedElement}
          showCopyButtons={true}
        />
      </Col>
      <Col span={8}>
        <MatchStrategySelector
          matchCriteria={matchCriteria}
          referenceElement={selectedElement}
          onChange={setMatchCriteria}
        />
      </Col>
    </Row>
  );
};
```

## 🎯 最佳实践

### 1. 性能优化

```typescript
// 使用useMemo缓存计算结果
const filteredElements = useMemo(() => {
  return elements.filter(element => 
    element.text.toLowerCase().includes(searchKeyword.toLowerCase())
  );
}, [elements, searchKeyword]);

// 使用useCallback缓存事件处理器
const handleElementSelect = useCallback((element: UIElement | null) => {
  setSelectedElement(element);
  onElementSelect?.(element);
}, [setSelectedElement, onElementSelect]);
```

### 2. 错误处理

```typescript
try {
  const elements = parseXmlToElements(xmlContent);
  setElements(elements);
} catch (error) {
  setError(error instanceof Error ? error.message : '解析失败');
}
```

### 3. 响应式设计

```typescript
// 在小屏幕上使用紧凑模式
const isMobile = useMediaQuery('(max-width: 768px)');

<PropertyPanel
  selectedElement={selectedElement}
  compact={isMobile}
  showCopyButtons={!isMobile}
/>
```

### 4. 状态管理

```typescript
// 集中管理状态，避免prop drilling
const pageAnalyzerContext = createContext(null);

const PageAnalyzerProvider = ({ children }) => {
  const state = usePageAnalyzerState();
  return (
    <pageAnalyzerContext.Provider value={state}>
      {children}
    </pageAnalyzerContext.Provider>
  );
};
```

## 📈 扩展指南

### 添加新组件

1. 在 `components/` 目录下创建新组件文件
2. 保持文件大小 < 300行
3. 提供完整的TypeScript类型定义
4. 在 `index.ts` 中添加导出

### 添加新功能

1. 在 `types/index.ts` 中添加新类型
2. 在相应的Hook中添加新状态
3. 创建或更新组件以支持新功能
4. 编写使用示例和文档

### 集成到现有页面

```typescript
// 在现有页面中集成页面分析器
import { PageAnalyzerContainer } from '@/components/feature-modules/page-analyzer';

const ExistingPage = () => {
  return (
    <div>
      {/* 现有内容 */}
      <div style={{ height: '600px' }}>
        <PageAnalyzerContainer
          initialXmlContent={xmlContent}
          onElementSelect={handleElementSelect}
        />
      </div>
    </div>
  );
};
```

---

这个页面分析器模块为项目提供了**强大的UI元素分析能力**，采用**完全模块化设计**，支持**灵活组合使用**，是项目重构的重要里程碑。