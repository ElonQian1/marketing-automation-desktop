// src/components/step-cards/README.md
// module: step-cards | layer: ui | role: 步骤卡片组件使用文档
// summary: 现代化步骤卡片组件的使用指南和设计规范

# 🎨 现代化步骤卡片设计系统

## 📋 问题与解决方案

### 🔴 原版问题
```tsx
// ❌ 原版设计问题
<div style={{
  background: '#FFFFFF',        // 白色背景
  color: 'rgba(255,255,255,0.85)', // 白色文字 - 看不见！
  border: '1px solid #D9D9D9'   // 浅色边框在深色主题下突兀
}}>
  <span>步骤内容</span> {/* 用户无法阅读 */}
</div>
```

### ✅ 现代化解决方案
```tsx
// ✅ 现代化设计，完美适配深色主题
<div className="light-theme-force" style={{
  background: 'var(--bg-elevated, #1E293B)',     // 深色背景
  color: 'var(--text-1, #F8FAFC)',              // 浅色文字
  border: '1px solid var(--border-primary, #334155)' // 适配主题的边框
}}>
  <span>步骤内容</span> {/* 清晰可读 */}
</div>
```

## 🚀 使用指南

### 基础用法

```tsx
import { ModernDraggableStepCard } from './ModernDraggableStepCard';
import { SmartActionType } from '../types/smartComponents';

const step = {
  id: 'step-1',
  type: SmartActionType.TAP,
  description: '点击确认按钮',
  enabled: true,
  selector: '//android.widget.Button[@text="确认"]',
  analysisStatus: 'ready',
  analysisData: {
    confidence: 0.85,
    suggestions: ['添加等待时间提高稳定性'],
    warnings: ['元素可能加载缓慢']
  }
};

<ModernDraggableStepCard
  step={step}
  index={0}
  onEdit={(step) => console.log('编辑', step)}
  onToggle={(id) => console.log('切换', id)}
  onDelete={(id) => console.log('删除', id)}
/>
```

### 拖拽集成

```tsx
import { useSortable } from '@dnd-kit/sortable';

const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging
} = useSortable({ id: step.id });

<ModernDraggableStepCard
  ref={setNodeRef}
  step={step}
  index={index}
  isDragging={isDragging}
  transform={transform}
  transition={transition}
  style={style}
  {...attributes}
  {...listeners}
  onEdit={handleEdit}
  onToggle={handleToggle}
  onDelete={handleDelete}
/>
```

## 🎨 设计特性

### 主题系统
- ✅ **统一CSS变量**: 自动适配深/浅色主题
- ✅ **对比度保证**: 满足WCAG AA标准(4.5:1)
- ✅ **品牌化配色**: 渐变效果和品牌色彩
- ✅ **响应式设计**: 自适应不同屏幕尺寸

### 交互体验
- ✅ **微动效反馈**: hover状态和过渡动画
- ✅ **拖拽指示**: 清晰的拖拽把手和视觉反馈
- ✅ **状态指示**: 智能分析状态和进度显示
- ✅ **操作反馈**: 按钮hover和点击状态

### 信息架构
- ✅ **清晰层次**: 步骤编号、标题、状态分层显示
- ✅ **智能状态**: 分析就绪、执行中、完成等状态
- ✅ **详细信息**: 置信度、建议、警告信息
- ✅ **操作便捷**: 编辑、切换、删除一键操作

## 🔧 技术实现

### CSS变量系统
```css
/* 深色主题变量 */
:root {
  --bg-elevated: #1E293B;      /* 卡片背景 */
  --text-1: #F8FAFC;           /* 主要文字 */
  --text-2: #E2E8F0;           /* 次要文字 */
  --text-3: #CBD5E1;           /* 辅助文字 */
  --border-primary: #334155;    /* 主边框 */
  --brand-400: #7A9BFF;        /* 品牌色 */
  --success: #10B981;          /* 成功色 */
  --warning: #F59E0B;          /* 警告色 */
  --error: #EF4444;            /* 错误色 */
}
```

### 样式工具函数
```typescript
import { stepCardUtils } from './modern-step-card-styles';

// 获取状态配置
const statusConfig = stepCardUtils.getStatusConfig('ready');

// 获取卡片样式
const cardStyle = stepCardUtils.getCardStyle(isDragging, isDisabled);

// 组合样式
const combinedStyle = stepCardUtils.combineStyles(baseStyle, hoverStyle);
```

## 📊 性能优化

### 渲染优化
- ✅ **React.memo**: 避免不必要的重渲染
- ✅ **CSS变量**: 减少样式计算开销
- ✅ **事件委托**: 优化事件处理性能
- ✅ **懒加载**: 大列表虚拟化支持

### 内存管理
- ✅ **清理副作用**: 正确清理事件监听器
- ✅ **避免内存泄漏**: 合理使用useCallback和useMemo
- ✅ **样式缓存**: 复用样式对象减少GC压力

## 🎯 最佳实践

### 1. 主题适配
```tsx
// ✅ 推荐：使用CSS变量
background: 'var(--bg-elevated, #1E293B)'

// ❌ 避免：硬编码颜色
background: '#1E293B'
```

### 2. 文字对比度
```tsx
// ✅ 确保足够对比度
color: 'var(--text-1, #F8FAFC)'  // 白色文字配深色背景

// ❌ 避免低对比度组合
color: '#888888'  // 灰色文字配深色背景
```

### 3. 交互反馈
```tsx
// ✅ 提供清晰的交互反馈
onMouseEnter={(e) => {
  e.currentTarget.style.boxShadow = 'var(--shadow-interactive-hover)';
}}

// ❌ 缺乏交互反馈
onClick={handleClick} // 没有视觉反馈
```

### 4. 状态管理
```tsx
// ✅ 明确的状态定义
type AnalysisStatus = 'idle' | 'ready' | 'analyzing' | 'completed' | 'error';

// ❌ 模糊的状态值
status: string  // 不明确
```

## 🔍 故障排除

### 白底白字问题
```tsx
// 🔧 解决方案：添加 light-theme-force 类
<div className="modern-step-card light-theme-force">
  {/* 内容自动使用正确的深色文字 */}
</div>
```

### 拖拽不生效
```tsx
// 🔧 确保正确设置触摸操作
style={{ touchAction: 'none' }}
```

### 状态更新延迟
```tsx
// 🔧 使用正确的状态更新模式
const [step, setStep] = useState(initialStep);

// 避免直接修改对象
setStep(prev => ({ ...prev, enabled: !prev.enabled }));
```

## 📚 相关文档

- [设计规范](./design-specs.md)
- [主题系统](./theme-system.md)  
- [无障碍指南](./accessibility.md)
- [测试指南](./testing.md)