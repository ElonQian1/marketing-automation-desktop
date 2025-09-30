# 主题增强系统使用指南

## 🎯 概述

主题增强系统是一个基于 Ant Design 5 的完整主题管理解决方案，为项目提供了统一的暗黑模式支持和主题感知组件库。

## 📁 模块结构

```
src/components/feature-modules/
├── theme-system/                 # 核心主题管理系统
│   ├── providers/EnhancedThemeProvider.tsx  # 主题提供者
│   ├── hooks/useThemeManager.ts             # 主题管理Hook
│   ├── components/                          # 主题UI组件
│   └── types/                              # 类型定义
└── universal-ui/                 # 主题感知组件库
    ├── ThemeEnhanced.tsx        # 基础增强组件
    ├── ThemeLayouts.tsx         # 布局组件
    ├── ThemePageComponents.tsx  # 页面特定组件
    ├── ThemeAdvanced.tsx        # 高级主题组件
    └── index.ts                 # 统一导出
```

## 🚀 快速开始

### 1. 导入主题感知组件

```typescript
import {
  ThemeAwarePageContainer,
  ThemeAwareStatCard,
  ThemeAwareDeviceCard,
  useThemeManager,
} from '@/components/feature-modules/universal-ui';
```

### 2. 使用主题管理

```typescript
export const MyComponent: React.FC = () => {
  const themeManager = useThemeManager();
  const isDark = themeManager.mode === 'dark';

  return (
    <ThemeAwarePageContainer
      title="我的页面"
      extra={
        <Button onClick={() => themeManager.setMode(isDark ? 'light' : 'dark')}>
          {isDark ? '切换到浅色' : '切换到深色'}
        </Button>
      }
    >
      {/* 页面内容 */}
    </ThemeAwarePageContainer>
  );
};
```

## 📦 组件分类

### 基础增强组件 (ThemeEnhanced.tsx)

#### ThemeAwareStatCard - 统计卡片
```typescript
<ThemeAwareStatCard
  title="在线设备"
  value={3}
  color="success"
  trend="up"
  trendValue={12}
  prefix={<AndroidOutlined />}
/>
```

#### ThemeAwareProgressCard - 进度卡片
```typescript
<ThemeAwareProgressCard
  title="导入进度统计"
  items={[
    { label: '联系人导入', percent: 75, color: '#1677ff' },
    { label: '脚本执行', percent: 60, color: '#52c41a' },
  ]}
/>
```

#### ThemeAwareUserCard - 用户信息卡片
```typescript
<ThemeAwareUserCard
  name="管理员"
  description="系统管理员账户"
  stats={[
    { label: '设备数', value: 8 },
    { label: '任务数', value: 24 },
  ]}
  actions={<Button type="primary">查看详情</Button>}
/>
```

### 布局组件 (ThemeLayouts.tsx)

#### ThemeAwarePageContainer - 页面容器
```typescript
<ThemeAwarePageContainer
  title="页面标题"
  subtitle="页面副标题"
  breadcrumb={[
    { title: '首页', href: '/' },
    { title: '当前页面' },
  ]}
  extra={<Button type="primary">操作按钮</Button>}
>
  {/* 页面内容 */}
</ThemeAwarePageContainer>
```

#### ThemeAwareGridLayout - 网格布局
```typescript
<ThemeAwareGridLayout columns={3} responsive>
  <Card>卡片1</Card>
  <Card>卡片2</Card>
  <Card>卡片3</Card>
</ThemeAwareGridLayout>
```

#### ThemeAwareSidebarLayout - 侧边栏布局
```typescript
<ThemeAwareSidebarLayout
  sidebar={<Menu />}
  sidebarWidth={280}
  collapsible
  placement="left"
>
  {/* 主要内容 */}
</ThemeAwareSidebarLayout>
```

### 页面特定组件 (ThemePageComponents.tsx)

#### ThemeAwareDeviceCard - 设备卡片
```typescript
<ThemeAwareDeviceCard
  device={{
    id: 'device-1',
    name: 'Xiaomi 13 Pro',
    status: 'online',
    batteryLevel: 85,
    connectionType: 'usb',
  }}
  onConnect={(id) => console.log('连接设备:', id)}
  onRefresh={(id) => console.log('刷新设备:', id)}
  selected={true}
/>
```

#### ThemeAwareSessionTable - 会话表格
```typescript
<ThemeAwareSessionTable
  sessions={importSessions}
  onRetry={(id) => console.log('重试会话:', id)}
  onViewDetails={(id) => console.log('查看详情:', id)}
  pagination={true}
/>
```

### 高级主题组件 (ThemeAdvanced.tsx)

#### ThemeColorPicker - 颜色选择器
```typescript
<ThemeColorPicker
  label="主要颜色"
  value={selectedColor}
  onChange={setSelectedColor}
  showPresets={true}
  presets={['#1677ff', '#52c41a', '#faad14']}
/>
```

#### ThemePresetSelector - 主题预设选择器
```typescript
<ThemePresetSelector
  presets={themePresets}
  currentPreset={selectedPreset}
  onSelect={setSelectedPreset}
  onFavorite={(id, favorite) => console.log('切换收藏:', id)}
  onSaveCustom={(preset) => console.log('保存自定义主题:', preset)}
/>
```

#### ThemeAnimationSettings - 动画设置
```typescript
<ThemeAnimationSettings
  settings={{
    enableTransitions: true,
    transitionDuration: 300,
    enableHoverEffects: true,
    enableLoadingAnimations: true,
    reducedMotion: false,
  }}
  onChange={(newSettings) => updateAnimationSettings(newSettings)}
/>
```

## 🎨 主题特性

### 自动主题适配
- 所有组件都会根据当前主题模式（浅色/深色）自动调整颜色
- 使用 CSS 变量系统确保一致性
- 支持平滑的主题切换过渡效果

### 响应式设计
- 所有布局组件都支持响应式断点
- 移动端友好的交互体验
- 自适应的间距和字体大小

### 自定义样式
```typescript
// 使用主题管理器获取当前状态
const themeManager = useThemeManager();
const isDark = themeManager.mode === 'dark';

// 根据主题调整样式
const customStyle: React.CSSProperties = {
  backgroundColor: isDark ? '#001529' : '#ffffff',
  color: isDark ? '#ffffff' : '#000000',
  borderColor: isDark ? '#424242' : '#d9d9d9',
};
```

## 📝 最佳实践

### 1. 组件选择指南
- 使用 `ThemeAwarePageContainer` 作为页面级容器
- 对于数据展示，优先选择 `ThemeAwareStatCard` 和 `ThemeAwareProgressCard`
- 设备管理页面使用 `ThemeAwareDeviceCard`
- 表格数据使用 `ThemeAwareSessionTable`

### 2. 性能优化
- 使用 `useThemeManager` Hook 获取主题状态，避免不必要的重渲染
- 大量组件时考虑使用 `ThemeAwareGridLayout` 的虚拟化功能
- 动画设置支持 `reducedMotion` 选项以提高可访问性

### 3. 样式一致性
- 统一使用 CSS 变量（`var(--colorText)`, `var(--colorBgContainer)` 等）
- 避免硬编码颜色值
- 使用组件库提供的标准间距和圆角

### 4. 类型安全
- 所有组件都提供完整的 TypeScript 类型定义
- 使用导出的接口类型确保数据结构一致性
- 利用类型检查避免运行时错误

## 🛠️ 扩展开发

### 创建新的主题感知组件
```typescript
import React from 'react';
import { useThemeManager } from '../theme-system';

export interface MyThemeComponentProps {
  title: string;
  children: React.ReactNode;
}

export const MyThemeComponent: React.FC<MyThemeComponentProps> = ({
  title,
  children,
}) => {
  const themeManager = useThemeManager();
  const isDark = themeManager.mode === 'dark';

  const style: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    color: 'var(--colorText)',
    border: '1px solid var(--colorBorderSecondary)',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  return (
    <div style={style}>
      <h3 style={{ color: 'var(--colorText)' }}>{title}</h3>
      {children}
    </div>
  );
};
```

## 📖 演示页面

查看完整的组件演示：
```typescript
import { ThemeEnhancementDemo } from '@/pages/ThemeEnhancementDemo';
```

演示页面包含了所有组件的使用示例，是学习和测试的最佳起点。

## 🔧 故障排除

### 常见问题

1. **组件样式不正确**
   - 确保 `EnhancedThemeProvider` 正确包装了应用根组件
   - 检查 CSS 变量是否正确定义

2. **主题切换不生效**
   - 验证 `useThemeManager` Hook 的调用位置
   - 确保组件在主题提供者的作用域内

3. **TypeScript 类型错误**
   - 检查导入路径是否正确
   - 确保使用了正确的接口类型

---

**更新时间**: 2025年1月15日  
**版本**: v1.0.0  
**维护者**: GitHub Copilot