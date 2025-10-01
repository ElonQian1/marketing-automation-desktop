# 任务卡 - Radix + shadcn/ui 轻组件体系建立

**任务 ID**: A-20251001-151000  
**状态**: DONE  
**精确时间（台北）**: 2025-10-01 15:35:00 (UTC+08:00)  

---

## 📋 任务概述

**主题**: 引入 Radix + shadcn/ui 轻组件体系，建立现代化 UI 组件库  

**背景**: 
- 基于已完成的现代化 Design Tokens (212行)
- 需要建立"轻重分离"架构：轻组件负责外观，AntD 负责复杂功能
- 确保与 AntD 重组件和谐共存，不产生样式冲突

**输入/依赖**: 
- 已完成的现代化 tokens.css (品牌渐变、动效、阴影系统)
- ThemeBridge.tsx (242行) 提供主题上下文
- 需要创建 components/ui/ 目录结构

---

## 🏗️ 轻组件体系架构

### 组件分工策略

#### 轻组件（Radix + shadcn/ui）- 外观担当
```
components/ui/
├── Button.tsx          # 主要交互按钮
├── Card.tsx            # 内容卡片容器
├── Badge.tsx           # 状态标签徽章
├── Avatar.tsx          # 用户头像组件
├── Tooltip.tsx         # 悬停提示
├── Dialog.tsx          # 简单对话框
├── DropdownMenu.tsx    # 下拉菜单
├── Switch.tsx          # 开关切换
├── Slider.tsx          # 数值滑块
└── Progress.tsx        # 进度指示器
```

#### 重组件（继续使用 AntD）- 功能担当
```
- Form (表单验证、复杂布局)
- Table (数据表格、排序、筛选) 
- Upload (文件上传、拖拽)
- DatePicker (日期选择器)
- Tree (树形控件)
- Drawer (抽屉面板)
- Steps (步骤条)
- Pagination (分页器)
```

---

## 📦 实施计划

### 阶段一：基础设施建立
1. **安装依赖包**
```bash
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tooltip @radix-ui/react-switch @radix-ui/react-slider
```

2. **创建工具函数**
```typescript
// lib/utils.ts - className 合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 阶段二：核心轻组件开发
1. **Button 组件** - 展示品牌渐变效果
2. **Card 组件** - 展示现代阴影系统  
3. **Badge 组件** - 展示状态色彩系统

### 阶段三：集成验证
1. **与 AntD 共存测试** - 确保样式隔离
2. **主题切换测试** - dark/light 模式适配
3. **响应式测试** - 移动端友好性

---

## 🎨 设计原则

### 1. 品牌一致性
- 所有轻组件使用 Design Tokens 变量
- 主按钮使用 `--brand-gradient-primary`
- 阴影使用 `--shadow-brand` 系列
- 动效使用 `--motion-*` 规范

### 2. 样式隔离
- 轻组件样式完全基于 Tailwind classes
- 不修改任何 `.ant-*` 选择器
- 通过 CSS 变量实现主题同步

### 3. 可组合性
- 每个组件支持 `className` 扩展
- 使用 `cn()` 工具进行样式合并
- 支持 variant 和 size 属性

---

## 🚀 第一批组件规划

### Button 组件设计
```typescript
interface ButtonProps {
  variant?: 'default' | 'brand' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children: React.ReactNode
}

// 使用新的品牌渐变
.variant-brand {
  background: var(--brand-gradient-primary);
  box-shadow: var(--shadow-brand);
  transform: scale(var(--motion-scale-hover)) on hover;
}
```

### Card 组件设计  
```typescript
interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean  // 悬停效果
}

// 使用现代阴影系统
.card-base {
  box-shadow: var(--shadow);
  border-radius: var(--radius);
  background: var(--bg-elevated);
}

.card-hover {
  transition: all var(--duration-normal) var(--motion-smooth);
  box-shadow: var(--shadow-lg) on hover;
}
```

---

## 🧪 验证清单

- [ ] **依赖安装**: Radix UI 核心包正确安装
- [ ] **工具函数**: cn() className 合并工具可用
- [ ] **Button 组件**: 品牌渐变效果正确显示
- [ ] **Card 组件**: 现代阴影系统应用正确
- [ ] **主题同步**: 组件响应 dark/light 切换
- [ ] **AntD 兼容**: 轻重组件样式不冲突
- [ ] **动效测试**: 悬停和点击动效流畅

---

## 🚨 风险控制

**潜在风险**:
- 新依赖包可能与现有包产生冲突
- 轻组件样式可能意外影响 AntD 组件
- Radix 无障碍特性需要额外测试

**缓解措施**:
- 渐进式引入，先实现 Button 和 Card 验证架构
- 使用 CSS-in-JS 或严格的类名前缀避免样式泄露
- 每个组件完成后进行键盘导航测试

---

## 🔄 状态更新

**15:10** - 创建任务卡，制定轻组件体系架构  
**15:15** - 分析轻重组件分工策略，确定实施计划  
**15:20** - 准备安装 Radix UI 依赖和创建基础结构  
**15:25** - ✅ 完成依赖安装：@radix-ui/react-* 组件包  
**15:30** - ✅ 创建工具函数：src/lib/utils.ts (className 合并)  
**15:35** - ✅ 发现并优化现有轻组件：
  - Button 组件：更新为品牌渐变 + 现代阴影
  - Card 组件：升级阴影系统 + 微动效  

---

## ➡️ 下一步

**当前任务**: 安装依赖包，创建 components/ui/ 目录结构  
**下个任务卡**: `INPROG_20251001-153000_A_button-card-components.md`  
**主题**: 实现 Button 和 Card 核心轻组件

**@协作提醒**: 
- @B: 轻组件架构已设计，准备接手具体组件开发
- @C: 关注轻重组件分离，准备适配层兼容性测试  
- @D: 准备扫描脚本更新，检测组件样式规范性