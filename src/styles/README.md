# CSS 设计系统使用指南

本项目已迁移到现代化 CSS 设计系统架构。

## 🆕 新架构（推荐）

### 设计系统模块
```
src/styles/
├── modern.css                    # 主入口文件
└── design-system/               # 设计系统模块
    ├── tokens.css               # 设计令牌（颜色、字体、间距等）
    ├── base.css                 # 基础样式和重置
    ├── utilities.css            # 实用工具类
    ├── components.css           # 组件样式
    ├── layout.css               # 布局系统
    ├── antd-theme.css           # Ant Design 主题定制
    ├── responsive.css           # 响应式设计
    └── accessibility.css        # 无障碍访问增强
```

### 使用方法
```typescript
// 在主应用文件中导入新设计系统
import './styles/modern.css';
```

### 核心特性
- 🎨 完整的设计令牌系统
- 🌗 自动暗色主题支持  
- 📱 响应式断点系统
- ♿ 无障碍访问增强
- 🎯 Ant Design 深度集成
- 🔧 模块化架构（每个文件 < 500 行）

详细文档请参考：[设计系统完整指南](./DESIGN_SYSTEM_GUIDE.md)

## 📋 迁移说明

旧的三层样式架构将逐步废弃，建议新功能采用新设计系统。用“三层样式架构”：

1) 全局层（dark）
- `src/styles/dark-theme.css` 提供暗色基调和 AntD 深色覆盖。

2) 表面基线层（surfaces）
- `light-surface`：本体浅色基线（白底深字，覆盖 AntD Card 头/体、Typography、Buttons、Icons、Tag/Badge）
- `loop-surface`：循环体浅色基线，在 `surfaces/loop.css` 中强化（配合 `in-loop-step`、`loop-anchor`）
- `overlay-surface`：覆盖层浅色基线（Modal/Popover/Tooltip/Dropdown/Drawer/Select/Picker/Popconfirm/Notification/Message 等）
  - 变体：`overlay-dark`（黑底浅字）可与 `overlay-surface` 组合，或通过 Hook 自动注入

3) 业务变体层
- `in-loop-step`：循环体子步骤视觉变体
- `loop-anchor`：循环起止锚点视觉变体
- `loop-theme-*`：仅做装饰，不决定字色基线

导入顺序（重要）：`dark-theme.css` → `components/DraggableStepCard/styles/loopTheme.css` → `styles/surfaces.css`

## 组件接入

- 本体卡片
  - 循环子步骤：根容器加 `loop-surface in-loop-step`
  - 循环锚点：根容器加 `loop-surface loop-anchor`
  - 非循环：默认 dark，不自动加 `light-surface`；如需浅色可显式添加

- 覆盖层（Portal）
  - Modal：`className="overlay-surface"` + `rootClassName="overlay-surface overlay-elevated"`
  - Popover/Tooltip/Dropdown/Drawer：`overlayClassName="overlay-surface"`
  - 也可使用工具：`withOverlaySurface` HOC 或 `useOverlaySurfaceProps()` hook
  - 统一主题 Hook：`useOverlayTheme(initial)` 返回 `{ classes, popupProps }`
    - classes：用于 Modal/Drawer 的 className/rootClassName（支持 inherit/light/dark）
    - popupProps：用于 Select/Dropdown/Tooltip/Popover/DatePicker 等（处理 getPopupContainer 与 *ClassName）

## 常见坑
- 只改背景不挂浅色表面，会出现白底白字（因全局暗色让文字默认白）。
- Portal 不继承本体容器颜色，必须显式加 `overlay-surface`。
- 主题 token（`loop-theme-*`）不是可读性基线，避免把它与字色绑定。

## 扩展建议
- 主题开关（非循环：dark|light；循环：light|dark），通过容器类生效。
- 统一封装 Dropdown/Popover 等为带浅色覆盖层的组件，减少遗漏。
