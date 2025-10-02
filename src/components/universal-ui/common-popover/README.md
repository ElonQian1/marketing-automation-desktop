# ConfirmPopover 使用说明

统一的确认弹层组件，替代所有直接使用的 Ant Design `Popconfirm`，确保行为一致、样式可读、易于维护与扩展。

## 何时使用哪种模式

- mode="default"
  - 用于标准“确认/取消”的弹层（保留 antd 的 OK/Cancel 语义和交互）。
  - 适合删除确认、危险操作确认等常见场景。
- mode="custom"
  - 隐藏 antd 默认按钮，`title` 位置渲染自定义操作区（按钮组/说明等）。
  - 适合像元素选择这类需要自定义操作的交互气泡。

## 关键 Props（与 antd Popconfirm 对齐）

通用：
- `open?`, `placement?`, `children?`, `overlayStyle?`, `overlayClassName?`, `onCancel?`

default 模式专属：
- `title?`, `description?`, `onConfirm?`, `okText?`, `cancelText?`, `okButtonProps?`, `cancelButtonProps?`, `disabled?`

custom 模式专属：
- `title: ReactNode`（通常放自定义的操作区，如按钮组）

## 可读性与颜色对比

- 组件默认设置 `overlayClassName = 'light-theme-force'`，满足浅色覆盖层“浅底深字”的对比度要求，避免“白底白字”。
- 如需覆盖样式，可通过 `overlayClassName` 传入自定义类名（请仍遵循项目的颜色变量和对比度规范）。

## 示例

标准确认（default）：

```tsx
import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover';

<ConfirmPopover
  mode="default"
  title="删除确认"
  description="该操作不可撤销，确定要删除吗？"
  okText="删除"
  cancelText="取消"
  okButtonProps={{ danger: true }}
  onConfirm={handleDelete}
>
  <Button danger icon={<DeleteOutlined />}>删除</Button>
</ConfirmPopover>
```

自定义操作（custom）：

```tsx
<ConfirmPopover
  mode="custom"
  title={
    <Space size={4}>
      <Button type="primary" size="small" onClick={onConfirm}>确定</Button>
      <Button size="small" onClick={onCancel}>取消</Button>
    </Space>
  }
>
  <Button>选择元素</Button>
</ConfirmPopover>
```

## 迁移清单（从 antd Popconfirm → ConfirmPopover）

- 移除 `import { Popconfirm } from 'antd'`，改为 `import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover'`
- JSX 将 `<Popconfirm ...>` 改为 `<ConfirmPopover mode="default" ...>`（props 名称基本一致）
- 危险操作使用 `okButtonProps={{ danger: true }}`，确保视觉一致
- 如弹层内容为浅底容器，无需额外处理，默认 `light-theme-force` 已确保深色文字可读

## 最佳实践

- 在同一页面统一使用 ConfirmPopover，避免混用原生 Popconfirm
- 危险操作按钮统一使用“危险色 + 明确动词”（如“删除”“回滚”）
- 交互按钮尽量短文案、明确不可逆动作须在描述中提示

---

维护：如需扩展预设（如“危险删除预设”），建议在本目录新增工厂方法或包装组件，保持调用方简洁一致。
