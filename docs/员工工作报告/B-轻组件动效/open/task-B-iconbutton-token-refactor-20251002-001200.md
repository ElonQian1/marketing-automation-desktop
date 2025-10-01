任务 ID: B-20251002-001200
状态: open
创建时间（台北）: 2025-10-02 00:12:00 (UTC+08:00)
主题: IconButton 组件令牌化重构 - CVA 变体系统与 Motion 预设集成

---

## 背景

发现 `src/components/ui/buttons/IconButton.tsx` 组件仍在使用旧式实现：
- 使用 CSS 类名而非设计令牌
- 缺少 CVA 变体系统
- 未集成 motionPresets 动效
- 类型定义与新标准不统一（使用 small/medium/large 而非 sm/md/lg）

这与已完成的 Button、Input、Select 等轻组件标准不一致，需要统一重构。

## 实现要点

### 1. CVA 变体系统
- **尺寸变体**: sm/md/lg（统一标准）
- **样式变体**: solid/soft/outline/ghost（与Button组件一致）
- **色调变体**: brand/neutral/success/warning/danger/info
- **形状变体**: square/circular

### 2. 设计令牌集成
- 颜色：`var(--brand)`、`var(--text-primary)` 等
- 圆角：`var(--radius)`、`var(--radius-full)`
- 阴影：`var(--shadow-sm)`、`var(--shadow-brand-glow)`
- 间距：`var(--control-h-sm/md/lg)`

### 3. Motion 预设
- 悬停效果：`motionPresets.hover`
- 按下效果：`motionPresets.press`
- 禁用态：`motionPresets.disabled`
- 焦点环：`focusRing` 工具

### 4. 无障碍支持
- 焦点环系统
- 键盘导航支持
- 屏幕阅读器友好

## 变更范围

- `src/components/ui/buttons/IconButton.tsx`（完整重构）
- 可能需要更新导出（`src/components/ui/index.ts`）

## 更新记录

- [2025-10-02 00:12:00] 创建任务，识别IconButton组件令牌化需求
- [2025-10-02 00:15:00] 开始重构IconButton组件，实现CVA变体系统
- [2025-10-02 00:25:00] 遇到文件格式问题，暂时恢复备份文件
- [2025-10-02 00:26:00] 任务需要进一步细化，标记为需要重新评估

## 验证清单

- [ ] 实现 CVA 变体系统（尺寸、样式、色调、形状）
- [ ] 集成设计令牌（颜色、圆角、阴影、间距）
- [ ] 添加 motionPresets 动效支持
- [ ] 确保类型定义一致性（sm/md/lg）
- [ ] 测试 Dark/Light 模式
- [ ] 验证焦点环和键盘导航
- [ ] 确保与其他轻组件样式一致

## 风险与回滚

风险：中等 - 现有引用可能需要调整
回滚：保留备份文件，必要时恢复旧实现