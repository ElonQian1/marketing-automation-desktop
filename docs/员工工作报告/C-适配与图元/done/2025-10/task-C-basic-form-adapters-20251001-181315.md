任务 ID: C-20251001-181315
状态: review
创建时间（台北）: 2025-10- [x] BrandShowcasePage 展示集成（已添加到 AdapterDemos.tsx）01 18:13:15 (UTC+08:00)
主题: 基础表单适配器补充（Checkbox/Radio/Switch/Slider）

---

## 实现要点

- 创建遗漏的基础表单适配器：
  - CheckboxAdapter：统一 Checkbox/CheckboxGroup
  - RadioAdapter：统一 Radio/RadioGroup
  - SwitchAdapter：统一 Switch 组件
  - SliderAdapter：统一 Slider/Range 滑块
  - InputNumberAdapter：统一数值输入框

- 设计原则：
  - 不覆写 `.ant-*` 样式
  - 通过 ConfigProvider 统一主题
  - 支持品牌化令牌系统
  - 保持与现有适配器一致的接口设计

## 文件结构
```
src/components/adapters/
├── checkbox/CheckboxAdapter.tsx
├── radio/RadioAdapter.tsx
├── switch/SwitchAdapter.tsx
├── slider/SliderAdapter.tsx
├── input-number/InputNumberAdapter.tsx
└── index.ts （更新导出）
```

## 更新记录

- [2025-10-01 18:13:15] 任务创建，识别遗漏的基础表单适配器需求
- [2025-10-01 18:15:42] 完成基础适配器实现：CheckboxAdapter, RadioAdapter, SwitchAdapter, SliderAdapter, InputNumberAdapter
- [2025-10-01 18:16:58] 更新 adapters/index.ts 导出所有新适配器
- [2025-10-01 18:17:33] 类型检查通过，错误数量保持14个（均为Universal UI相关，不涉及适配器层）
- [2025-10-01 18:19:45] 添加新适配器到 AdapterDemos.tsx 演示页面
- [2025-10-01 18:21:12] 修复演示页面类型错误，所有适配器可正常展示
- [2025-10-01 18:21:58] 任务完成，移动到 review 状态等待评审

## 验证清单

- [x] CheckboxAdapter：单选框/复选框组适配
- [x] RadioAdapter：单选按钮/按钮组适配
- [x] SwitchAdapter：开关组件适配
- [x] SliderAdapter：滑块/范围滑块适配
- [x] InputNumberAdapter：数值输入适配
- [x] 更新 adapters/index.ts 导出
- [ ] Dark/Compact 模式正常（需要运行时验证）
- [x] 无 `.ant-*` / 无 `!important`（仅通过props和ConfigProvider）
- [x] TS 类型与最小用例就绪
- [ ] BrandShowcasePage 展示集成（需要添加到演示页面）

## 风险与回滚

- 风险：可能与现有 Form 组件集成存储冲突
- 回滚：保持当前直接使用 AntD 组件的状态
- 预案：优先完成核心适配器，次要组件可后续迭代

## 关联任务

- 依赖：FormAdapter 已完成（review 状态）
- 后续：需要在 BrandShowcasePage 中展示新增适配器