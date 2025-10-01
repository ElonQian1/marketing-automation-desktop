# Native AntD Page（原生颜值开关）

目的：在不改业务的前提下，按页面恢复接近 Ant Design v5 原生视觉（以暗黑算法为主），并逐步剔除全局散落的自定义覆盖。

## 用法

```tsx
import { NativePage } from '@/components/native-antd/NativePage';

export default function Page() {
  return (
    <NativePage outlineDensity="minimal" disablePolish>
      <YourPage />
    </NativePage>
  );
}
```

- outlineDensity: 'minimal' | 'default' | 'strong'（描边密度；minimal 更轻）
- disablePolish: 默认 true，在容器内软禁用商业化润色覆盖（回到更原生）

## 已提供示例
- `src/pages/native-wrappers/EmployeePage.native.tsx`
- `src/pages/native-wrappers/SmartScriptBuilderPage.native.tsx`

## 工作原理
- `native-reset.css` 在 `[data-antd-native]` 容器内使用 `revert !important` 撤销项目层对 antd 的覆盖；
- 不新增组件级 token 覆盖，尽量使用 AntD 注入的默认样式；
- 通过 `data-outline` 控制线条存在感，便于统一“商业化克制”的视觉密度。

## 建议迁移路径
1) 给核心页面加上 `NativePage` 包裹，观察是否满足“原生颜值”；
2) 若个别区域仍被旧样式干扰（特殊选择器/inline 样式），在 `native-reset.css` 内按模块小补丁修正；
3) 确认稳定后，逐步删除对应的旧全局样式，减少遗留债务。
