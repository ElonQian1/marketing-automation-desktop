# 🎨 Design Tokens 对照表 & 使用指南

## 📋 文档概述

**创建者**: 员工A (Design Tokens & Theme Bridge 负责人)  
**创建日期**: 2025年10月1日  
**目标读者**: 员工B/C/D 及所有参与项目的开发者  
**文档目的**: 提供完整的设计令牌使用规范，确保品牌一致性

---

## 🏗️ 项目架构概览

本项目已建立完善的Design Tokens系统：

```
src/
├── styles/
│   └── tokens.css          # 🎯 设计令牌唯一来源 (195行)
├── theme/
│   └── ThemeBridge.tsx     # 🌉 AntD主题桥接 (242行) 
├── pages/
│   └── DesignTokensDemo.tsx # 🎪 完整演示页面 (329行)
└── style.css              # 📦 全局样式入口 (141行)
```

**配置文件**:
- `tailwind.config.js`: 127行，完整映射CSS变量到Tailwind实用类
- `package.json`: 包含扫描脚本和验证命令

---

## 🎨 核心设计令牌清单

### 🎯 品牌色系 (Brand Colors)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 主品牌色 | `--brand` | `bg-brand` | `#6E8BFF` | 主按钮、链接、重点元素 |
| 品牌色阶 | `--brand-50` | `bg-brand-50` | `#F0F4FF` | 品牌浅色背景 |
| 品牌色阶 | `--brand-100` | `bg-brand-100` | `#E0EAFF` | 悬停状态背景 |
| 品牌色阶 | `--brand-200` | `bg-brand-200` | `#C7D7FF` | 选中状态背景 |
| 品牌色阶 | `--brand-300` | `bg-brand-300` | `#A3BFFF` | 禁用状态 |
| 品牌色阶 | `--brand-400` | `bg-brand-400` | `#7A9BFF` | 辅助色彩 |
| 品牌色阶 | `--brand-500` | `bg-brand-500` | `#6E8BFF` | 标准品牌色 |
| 品牌色阶 | `--brand-600` | `bg-brand-600` | `#5B73E8` | 深色变体 |
| 品牌色阶 | `--brand-700` | `bg-brand-700` | `#4A5FD1` | 更深变体 |
| 品牌色阶 | `--brand-800` | `bg-brand-800` | `#3B4DA6` | 高对比度 |
| 品牌色阶 | `--brand-900` | `bg-brand-900` | `#334085` | 最深变体 |

### 📈 语义色系 (Semantic Colors)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 成功色 | `--success` | `bg-success` | `#10B981` | 成功状态、确认操作 |
| 成功背景 | `--success-bg` | `bg-success/10` | `#D1FAE5` | 成功消息背景 |
| 警告色 | `--warning` | `bg-warning` | `#F59E0B` | 警告状态、注意事项 |
| 警告背景 | `--warning-bg` | `bg-warning/10` | `#FEF3C7` | 警告消息背景 |
| 错误色 | `--error` | `bg-error` | `#EF4444` | 错误状态、删除操作 |
| 错误背景 | `--error-bg` | `bg-error/10` | `#FEE2E2` | 错误消息背景 |
| 信息色 | `--info` | `bg-info` | `#3B82F6` | 信息提示、帮助内容 |
| 信息背景 | `--info-bg` | `bg-info/10` | `#DBEAFE` | 信息消息背景 |

### 🌈 背景色系 (Background Colors)
| Token | CSS变量 | Tailwind类 | 值 (暗色模式) | 用途 |
|-------|---------|------------|--------------|------|
| 基础背景 | `--bg-base` | `bg-background-base` | `#0F172A` | 页面主背景 |
| 浮层背景 | `--bg-elevated` | `bg-background-elevated` | `#1E293B` | 卡片、面板背景 |
| 次级背景 | `--bg-secondary` | `bg-background-secondary` | `#334155` | 区块分隔背景 |
| 第三级背景 | `--bg-tertiary` | `bg-background-tertiary` | `#475569` | 更深层级背景 |
| 静音背景 | `--bg-muted` | `bg-background-muted` | `#64748B` | 禁用元素背景 |

**浅色主题变体**:
| Token | CSS变量 | 浅色模式值 | 用途 |
|-------|---------|-----------|------|
| 基础背景 | `--bg-base` | `#FFFFFF` | 页面主背景 |
| 浮层背景 | `--bg-elevated` | `#F8FAFC` | 卡片、面板背景 |
| 次级背景 | `--bg-secondary` | `#F1F5F9` | 区块分隔背景 |

### 📝 文本色系 (Text Colors)
| Token | CSS变量 | Tailwind类 | 值 (暗色模式) | 用途 |
|-------|---------|------------|--------------|------|
| 主文本 | `--text-1` | `text-text-primary` | `#F8FAFC` | 标题、重要内容 |
| 次级文本 | `--text-2` | `text-text-secondary` | `#E2E8F0` | 正文、描述 |
| 三级文本 | `--text-3` | `text-text-tertiary` | `#CBD5E1` | 辅助信息 |
| 静音文本 | `--text-muted` | `text-text-muted` | `#94A3B8` | 占位符、禁用文本 |
| 反色文本 | `--text-inverse` | `text-text-inverse` | `#1E293B` | 浅色背景上的文本 |

### 🔲 边框色系 (Border Colors)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 主边框 | `--border-primary` | `border-border-primary` | `#334155` | 输入框、按钮边框 |
| 次级边框 | `--border-secondary` | `border-border-secondary` | `#475569` | 分割线、容器边框 |
| 静音边框 | `--border-muted` | `border-border-muted` | `#64748B` | 禁用状态边框 |

### 📐 几何属性 (Geometry)

#### 圆角系统 (Border Radius)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 小圆角 | `--radius-sm` | `rounded-sm` | `8px` | 标签、徽章 |
| 标准圆角 | `--radius` | `rounded` | `12px` | 按钮、输入框、卡片 |
| 大圆角 | `--radius-lg` | `rounded-lg` | `16px` | 对话框、面板 |
| 超大圆角 | `--radius-xl` | `rounded-xl` | `24px` | 特殊容器 |

#### 阴影系统 (Shadow System)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 小阴影 | `--shadow-sm` | `shadow-sm` | `0 2px 8px rgba(0, 0, 0, 0.10)` | 悬停效果 |
| 标准阴影 | `--shadow` | `shadow` | `0 4px 20px rgba(0, 0, 0, 0.15)` | 卡片、按钮 |
| 大阴影 | `--shadow-lg` | `shadow-lg` | `0 8px 32px rgba(0, 0, 0, 0.20)` | 模态框 |
| 超大阴影 | `--shadow-xl` | `shadow-xl` | `0 12px 48px rgba(0, 0, 0, 0.25)` | 抽屉、弹出层 |
| 内阴影 | `--shadow-inset` | `shadow-inset` | `inset 0 2px 4px rgba(0, 0, 0, 0.06)` | 输入框内部 |

### 📚 字体系统 (Typography)

#### 字体族 (Font Families)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 标准字体 | `--font-family` | `font-sans` | `-apple-system, BlinkMacSystemFont, 'Segoe UI'...` | 界面文本 |
| 代码字体 | `--font-mono` | `font-mono` | `'JetBrains Mono', 'Fira Code'...` | 代码、数据 |

#### 字号系统 (Font Sizes)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 超小字号 | `--font-xs` | `text-xs` | `12px` | 辅助信息、标签 |
| 小字号 | `--font-sm` | `text-sm` | `14px` | 次要文本 |
| 基础字号 | `--font` | `text-base` | `16px` | 正文内容 |
| 大字号 | `--font-lg` | `text-lg` | `18px` | 强调文本 |
| 超大字号 | `--font-xl` | `text-xl` | `20px` | 小标题 |
| 2倍大字号 | `--font-2xl` | `text-2xl` | `24px` | 主标题 |
| 3倍大字号 | `--font-3xl` | `text-3xl` | `30px` | 特大标题 |

#### 字重系统 (Font Weights)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 正常字重 | `--font-weight-normal` | `font-normal` | `400` | 正文 |
| 中等字重 | `--font-weight-medium` | `font-medium` | `500` | 强调 |
| 半粗字重 | `--font-weight-semibold` | `font-semibold` | `600` | 小标题 |
| 粗字重 | `--font-weight-bold` | `font-bold` | `700` | 主标题 |

### 📏 控件尺寸系统 (Control Sizes)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 标准控件高度 | `--control-h` | `h-control` | `40px` | 按钮、输入框 |
| 小控件高度 | `--control-h-sm` | `h-control-sm` | `32px` | 紧凑按钮 |
| 大控件高度 | `--control-h-lg` | `h-control-lg` | `48px` | 大型按钮 |

### 📐 间距系统 (Spacing System)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 1级间距 | `--space-1` | `p-1` | `4px` | 最小间距 |
| 2级间距 | `--space-2` | `p-2` | `8px` | 小间距 |
| 3级间距 | `--space-3` | `p-3` | `12px` | 中小间距 |
| 4级间距 | `--space-4` | `p-4` | `16px` | 标准间距 |
| 5级间距 | `--space-5` | `p-5` | `20px` | 中等间距 |
| 6级间距 | `--space-6` | `p-6` | `24px` | 大间距 |
| 8级间距 | `--space-8` | `p-8` | `32px` | 较大间距 |
| 10级间距 | `--space-10` | `p-10` | `40px` | 大间距 |
| 12级间距 | `--space-12` | `p-12` | `48px` | 超大间距 |
| 16级间距 | `--space-16` | `p-16` | `64px` | 页面级间距 |
| 20级间距 | `--space-20` | `p-20` | `80px` | 区块间距 |

### 🎭 动画系统 (Motion System)

#### 缓动函数 (Easing Functions)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 淡入 | `--ease-in` | `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | 元素进入 |
| 淡出 | `--ease-out` | `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | 元素退出 |
| 淡入淡出 | `--ease-in-out` | `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | 状态切换 |
| 品牌缓动 | `--ease-brand` | `ease-brand` | `cubic-bezier(0.22, 1, 0.36, 1)` | 品牌专用 |

#### 动画时长 (Durations)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 快速动画 | `--duration-fast` | `duration-fast` | `120ms` | 悬停效果 |
| 标准动画 | `--duration-normal` | `duration-normal` | `180ms` | 一般过渡 |
| 慢速动画 | `--duration-slow` | `duration-slow` | `220ms` | 复杂转场 |

### 🌊 层级系统 (Z-Index System)
| Token | CSS变量 | Tailwind类 | 值 | 用途 |
|-------|---------|------------|-----|------|
| 下拉菜单 | `--z-dropdown` | `z-dropdown` | `1000` | Select、Dropdown |
| 粘性定位 | `--z-sticky` | `z-sticky` | `1020` | 表头、导航 |
| 固定定位 | `--z-fixed` | `z-fixed` | `1030` | 固定元素 |
| 模态背景 | `--z-modal-backdrop` | `z-modal-backdrop` | `1040` | 模态框遮罩 |
| 模态框 | `--z-modal` | `z-modal` | `1050` | 对话框 |
| 弹出框 | `--z-popover` | `z-popover` | `1060` | Popover、Popconfirm |
| 提示框 | `--z-tooltip` | `z-tooltip` | `1070` | Tooltip |
| 消息框 | `--z-toast` | `z-toast` | `1080` | Message、Notification |

---

## 🚀 使用指南

### ✅ 推荐使用方式

#### 1. **CSS中直接使用变量**
```css
.my-button {
  background-color: var(--brand);
  border-radius: var(--radius);
  padding: var(--space-4);
  box-shadow: var(--shadow);
  color: var(--text-1);
  transition: all var(--duration-normal) var(--ease-out);
}
```

#### 2. **Tailwind实用类**
```jsx
<Button className="bg-brand text-white rounded-lg p-4 shadow-lg">
  点击按钮
</Button>
```

#### 3. **React组件中使用**
```jsx
// ✅ 推荐：使用CSS变量
<div style={{ 
  backgroundColor: 'var(--bg-elevated)',
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-lg)'
}}>
  内容区域
</div>

// ✅ 推荐：使用Tailwind类
<Card className="bg-background-elevated p-6 rounded-lg">
  <Text className="text-text-primary">主要内容</Text>
  <Text className="text-text-secondary">次要信息</Text>
</Card>
```

#### 4. **AntD组件主题定制（通过ThemeBridge）**
```jsx
import { ThemeBridge, useTheme } from '@/theme/ThemeBridge';

function App() {
  return (
    <ThemeBridge isDark={true} isCompact={false}>
      <ConfigProvider>
        {/* AntD组件会自动应用Design Tokens */}
        <Button type="primary">自动应用品牌色</Button>
      </ConfigProvider>
    </ThemeBridge>
  );
}
```

### ❌ 禁止使用方式

#### 1. **硬编码颜色值**
```css
/* ❌ 禁止 */
.my-element {
  background-color: #6E8BFF;  /* 应使用 var(--brand) */
  color: #F8FAFC;             /* 应使用 var(--text-1) */
}
```

#### 2. **覆盖AntD内部样式**
```css
/* ❌ 禁止 */
.ant-btn-primary {
  background-color: red !important;
}

.ant-card-head {
  padding: 20px !important;
}
```

#### 3. **使用!important强制覆盖**
```css
/* ❌ 禁止 */
.my-style {
  color: blue !important;
  font-size: 18px !important;
}
```

#### 4. **创建多套颜色系统**
```css
/* ❌ 禁止：不要创建额外的颜色变量 */
:root {
  --my-custom-blue: #0066cc;
  --another-text-color: #333;
}
```

---

## 🌓 主题切换机制

### 1. **使用ThemeBridge Hook**
```jsx
import { useTheme } from '@/theme/ThemeBridge';

function ThemeToggler() {
  const { isDark, isCompact, toggleTheme, toggleDensity } = useTheme();
  
  return (
    <div>
      <Button onClick={toggleTheme}>
        {isDark ? '切换到浅色' : '切换到深色'}
      </Button>
      <Button onClick={toggleDensity}>
        {isCompact ? '切换到标准' : '切换到紧凑'}
      </Button>
    </div>
  );
}
```

### 2. **响应主题变化**
```css
/* CSS会自动响应主题切换 */
.my-component {
  background: var(--bg-base);      /* 自动适配明暗主题 */
  color: var(--text-1);           /* 自动适配文本颜色 */
  border: 1px solid var(--border-primary);
}
```

### 3. **手动监听主题变化**
```jsx
import { useTheme } from '@/theme/ThemeBridge';

function MyComponent() {
  const { mode, density } = useTheme();
  
  useEffect(() => {
    console.log('主题模式变更:', mode);      // 'light' | 'dark'
    console.log('密度模式变更:', density);   // 'default' | 'compact'
  }, [mode, density]);
}
```

---

## 🛠️ 开发工具和验证

### 1. **扫描脚本**
```bash
# 扫描项目中的样式违规
npm run scan:overrides  # 或 node scripts/scan-overrides.mjs
```

### 2. **Demo演示页面**
访问 `/design-tokens-demo` 查看所有tokens的实际效果：
- 主题切换演示（明亮/暗色）
- 密度模式演示（标准/紧凑）  
- 所有颜色、圆角、阴影、字体的可视化展示

### 3. **类型检查**
```bash
npm run type-check  # 确保TypeScript类型正确
```

---

## 📋 员工分工说明

### 👤 员工B - 轻组件负责人
**使用重点**: 
- 控件尺寸系统: `--control-h`, `--control-h-sm`, `--control-h-lg`
- 间距系统: `--space-*` 系列
- 圆角系统: `--radius`, `--radius-sm`

**典型组件**: Button、Input、Tag、Badge、Switch等

### 👤 员工C - 重组件适配负责人  
**使用重点**:
- 文本色系: `--text-1`, `--text-2`, `--text-3`
- 背景色系: `--bg-base`, `--bg-elevated`, `--bg-secondary`  
- 阴影系统: `--shadow`, `--shadow-lg`

**典型组件**: Table、Form、Card、Modal、Drawer等

### 👤 员工D - 页面级图元负责人
**使用重点**:
- 圆角系统: `--radius-lg`, `--radius-xl`  
- 阴影系统: `--shadow-lg`, `--shadow-xl`
- Z-Index层级: `--z-modal`, `--z-tooltip`

**典型组件**: Layout、Navigation、PageHeader、Breadcrumb等

---

## 🔄 更新和同步机制

### 📢 变更通知流程
1. **所有Design Tokens变更**必须通过员工A审核
2. **变更会在工作报告中记录**，包含：
   - 变更的token名称和值
   - 变更原因和影响范围  
   - 更新时间戳
3. **其他员工每日检查**工作报告获取最新变更

### 📝 变更记录模板
```markdown
### Token变更记录 - 2025/10/XX

**变更内容**:
- `--brand`: `#6E8BFF` → `#7B88FF` (微调品牌色饱和度)
- 新增 `--radius-2xl`: `32px` (用于大型面板)

**影响范围**: 所有使用品牌色的按钮和链接
**兼容性**: 向后兼容，渐进式更新
**验证方式**: 运行 `npm run scan:overrides` 确认无违规
```

### 🚫 严格禁止事项
- ❌ **绕过员工A直接修改tokens.css**
- ❌ **在组件中硬编码颜色值**  
- ❌ **使用.ant-*选择器覆盖样式**
- ❌ **使用!important强制覆盖**
- ❌ **创建额外的颜色变量系统**

---

## 🎯 验收标准

### ✅ 质量检查清单
- [ ] 所有组件使用Design Tokens而非硬编码值
- [ ] 扫描脚本报告0个样式覆盖违规  
- [ ] 扫描脚本报告0个!important违规
- [ ] 主题切换功能正常（明亮/暗色）
- [ ] 密度切换功能正常（标准/紧凑）
- [ ] TypeScript类型检查通过
- [ ] Demo页面完整展示所有tokens效果

### 🎪 Demo页面验证项
1. **颜色系统**: 品牌色、语义色、背景色、文本色完整展示
2. **几何系统**: 圆角、阴影、间距的可视化对比
3. **字体系统**: 字号、字重、行高的层级展示  
4. **交互验证**: 主题切换、密度切换实时生效
5. **组件集成**: AntD组件正确应用Design Tokens

---

## 📞 技术支持

**Primary Contact**: 员工A (Design Tokens & Theme Bridge 负责人)  
**工作报告**: `docs/员工工作报告/员工A_Design_Tokens_负责人_工作报告.md`  
**技术文档**: `src/styles/tokens.css` (核心令牌定义)  
**演示地址**: `/design-tokens-demo` (完整功能演示)

**遇到问题时**:
1. 优先查看本对照表和Demo页面
2. 运行扫描脚本验证代码质量
3. 查看员工A工作报告获取最新变更
4. 通过工作报告留言进行异步协作

---

**最后更新**: 2025年10月1日 14:00  
**文档版本**: v1.0  
**系统状态**: 生产就绪 ✅