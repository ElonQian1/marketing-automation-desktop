# App Shell

轻量通用应用外壳（modern.css 驱动），提供“侧边栏 + 顶部栏 + 内容区”的标准布局骨架。

## 文件
- AppShell.tsx：外壳容器（接收 sidebar/headerTitle/headerActions/children）
- Sidebar.tsx：品牌 + 导航项按钮
- HeaderBar.tsx：标题 + 操作区插槽
- StatusBar.tsx：可选底部状态栏
- index.ts：聚合导出

## 使用
```tsx
import { AppShell } from '@/components/app-shell';
import { Sidebar } from '@/components/app-shell/Sidebar';

<AppShell
  sidebar={<Sidebar items={items} activeKey={key} onChange={setKey} />}
  headerTitle={<h2>标题</h2>}
  headerActions={<Actions />}
>
  <Page />
</AppShell>
```

## 约束
- 仅承载布局，不放业务逻辑；视觉由 modern.css 提供。
- 每文件 < 300 行，拆分职责清晰。
