# 轻组件使用指南

**版本**: v2.0  
**最后更新**: 2025-10-02  
**维护者**: 员工A (Design Tokens & Theme Bridge 负责人)

---

## 🎯 轻组件系统概述

### 设计理念
轻组件系统为 employeeGUI 提供一套**轻量、灵活、品牌一致**的基础UI组件。每个组件都：

- ✅ **完全基于 Design Tokens** - 无硬编码样式值
- ✅ **支持所有主题模式** - 浅色/暗黑/紧凑模式自动适配  
- ✅ **统一动效标准** - 180-220ms进入，120-160ms退出
- ✅ **TypeScript 类型安全** - 完整的类型定义和IDE支持
- ✅ **无 AntD 依赖冲突** - 独立实现，避免样式覆盖

### 组件清单
```
src/components/ui/
├── Button/           # 多变体按钮组件
├── CardShell/        # 通用卡片容器
├── TagPill/          # 标签徽章组件  
└── SmartDialog/      # 智能对话框组件
```

---

## 🔘 Button 组件

### 基础用法
```tsx
import { Button } from '@/components/ui/Button';

function MyComponent() {
  return (
    <div>
      {/* 基础按钮 */}
      <Button>默认按钮</Button>
      
      {/* 主要按钮 */}
      <Button variant="primary">主要操作</Button>
      
      {/* 危险按钮 */}
      <Button variant="danger">删除</Button>
      
      {/* 禁用状态 */}
      <Button disabled>禁用按钮</Button>
    </div>
  );
}
```

### 变体类型
```tsx
// 所有可用变体
type ButtonVariant = 
  | 'primary'    // 主要操作，品牌蓝色
  | 'secondary'  // 次要操作，灰色边框
  | 'danger'     // 危险操作，红色
  | 'ghost';     // 幽灵按钮，透明背景

// 尺寸选项
type ButtonSize = 'small' | 'medium' | 'large';

// 完整示例
<Button 
  variant="primary" 
  size="large"
  disabled={loading}
  onClick={handleSubmit}
>
  {loading ? '提交中...' : '提交'}
</Button>
```

### 高级功能
```tsx
// 带图标的按钮
<Button variant="primary" icon={<PlusIcon />}>
  新增
</Button>

// 加载状态
<Button loading={isSubmitting}>
  {isSubmitting ? '保存中...' : '保存'}
</Button>

// 自定义类名扩展
<Button 
  variant="primary"
  className="w-full"  // Tailwind 扩展
>
  全宽按钮
</Button>
```

### 样式定制
```css
/* 通过 Design Tokens 定制 */
.custom-button {
  --button-primary-bg: var(--color-success);     /* 使用成功色作为主色 */
  --button-border-radius: var(--border-radius-lg); /* 更大圆角 */
}
```

---

## 🃏 CardShell 组件

### 基础用法
```tsx
import { CardShell } from '@/components/ui/CardShell';

function MyComponent() {
  return (
    <CardShell>
      <h3>卡片标题</h3>
      <p>卡片内容区域</p>
    </CardShell>
  );
}
```

### 配置选项
```tsx
// 所有可用属性
interface CardShellProps {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hoverable?: boolean;
  loading?: boolean;
  className?: string;
}

// 使用示例
<CardShell 
  variant="elevated"     // 悬浮效果
  padding="large"        // 大间距
  hoverable={true}       // 悬停效果
  loading={isLoading}    // 加载状态
>
  <CardContent />
</CardShell>
```

### 变体展示
```tsx
// 默认卡片 - 简单边框
<CardShell variant="default">
  基础卡片样式
</CardShell>

// 边框卡片 - 明显边框
<CardShell variant="bordered">
  强调边框的卡片
</CardShell>

// 悬浮卡片 - 阴影效果
<CardShell variant="elevated">
  带阴影的悬浮卡片
</CardShell>

// 扁平卡片 - 无边框阴影
<CardShell variant="flat">
  极简扁平设计
</CardShell>
```

### 响应式布局
```tsx
// 配合 CSS Grid 使用
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <CardShell key={item.id} hoverable>
      <ItemContent item={item} />
    </CardShell>
  ))}
</div>
```

---

## 🏷️ TagPill 组件

### 基础用法
```tsx
import { TagPill } from '@/components/ui/TagPill';

function MyComponent() {
  return (
    <div>
      <TagPill>默认标签</TagPill>
      <TagPill color="success">成功</TagPill>
      <TagPill color="warning">警告</TagPill>
      <TagPill color="error">错误</TagPill>
    </div>
  );
}
```

### 颜色变体
```tsx
// 可用颜色选项
type TagColor = 
  | 'default'   // 默认灰色
  | 'primary'   // 品牌蓝色
  | 'success'   // 成功绿色
  | 'warning'   // 警告橙色
  | 'error'     // 错误红色
  | 'info';     // 信息蓝色

// 状态标签示例
const StatusTag = ({ status }: { status: string }) => {
  const colorMap = {
    'active': 'success',
    'pending': 'warning', 
    'failed': 'error',
    'draft': 'default',
  } as const;
  
  return (
    <TagPill color={colorMap[status] || 'default'}>
      {status}
    </TagPill>
  );
};
```

### 交互功能
```tsx
// 可关闭标签
<TagPill 
  color="primary"
  closable
  onClose={() => console.log('标签已关闭')}
>
  可关闭标签
</TagPill>

// 点击事件
<TagPill 
  color="default"
  onClick={() => console.log('标签被点击')}
  style={{ cursor: 'pointer' }}
>
  可点击标签
</TagPill>

// 标签组
const TagGroup = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {tags.map(tag => (
      <TagPill key={tag} color="default">
        {tag}
      </TagPill>
    ))}
  </div>
);
```

### 尺寸规格
```tsx
// 尺寸选项
type TagSize = 'small' | 'medium' | 'large';

// 不同尺寸示例
<div className="space-y-2">
  <TagPill size="small">小标签</TagPill>
  <TagPill size="medium">中标签</TagPill>  
  <TagPill size="large">大标签</TagPill>
</div>
```

---

## 💬 SmartDialog 组件

### 基础用法
```tsx
import { SmartDialog } from '@/components/ui/SmartDialog';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        打开对话框
      </Button>
      
      <SmartDialog
        open={open}
        onClose={() => setOpen(false)}
        title="确认操作"
      >
        <p>是否确定执行此操作？</p>
      </SmartDialog>
    </>
  );
}
```

### 对话框类型
```tsx
// 类型定义
type DialogType = 
  | 'default'    // 默认对话框
  | 'confirm'    // 确认对话框  
  | 'alert'      // 警告对话框
  | 'prompt';    // 输入对话框

// 确认对话框
<SmartDialog
  type="confirm"
  open={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="删除确认"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
>
  确定要删除这个项目吗？此操作不可撤销。
</SmartDialog>

// 警告对话框
<SmartDialog
  type="alert"
  open={showAlert}
  onClose={() => setShowAlert(false)}
  title="操作失败"
  severity="error"
>
  操作失败，请检查网络连接后重试。
</SmartDialog>
```

### 高级配置
```tsx
// 完整配置示例
<SmartDialog
  open={showDialog}
  onClose={handleClose}
  title="高级设置"
  size="large"                    // 对话框尺寸
  closable={true}                 // 显示关闭按钮
  maskClosable={false}            // 点击遮罩不关闭
  keyboard={true}                 // ESC键关闭
  centered={true}                 // 垂直居中
  destroyOnClose={true}           // 关闭时销毁
  zIndex={1050}                   // 层级控制
  className="custom-dialog"       // 自定义样式
  maskClassName="custom-mask"     // 遮罩样式
>
  <DialogContent />
</SmartDialog>
```

### 复杂表单对话框
```tsx
const FormDialog = () => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  
  const handleSubmit = async (values: any) => {
    try {
      await submitForm(values);
      setOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };
  
  return (
    <SmartDialog
      open={open}
      onClose={() => setOpen(false)}
      title="新增用户"
      width={600}
      footer={[
        <Button key="cancel" onClick={() => setOpen(false)}>
          取消
        </Button>,
        <Button 
          key="submit" 
          variant="primary"
          onClick={() => form.submit()}
        >
          提交
        </Button>
      ]}
    >
      <Form form={form} onFinish={handleSubmit}>
        <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
      </Form>
    </SmartDialog>
  );
};
```

---

## 🎨 主题定制

### Design Tokens 集成
所有轻组件都通过 CSS 变量继承主题：

```css
/* 组件会自动使用这些令牌 */
.light-components {
  --color-primary: #1890ff;
  --color-bg-container: #ffffff;
  --color-text-primary: #000000d9;
  --border-radius-md: 6px;
  --spacing-md: 16px;
}

[data-theme="dark"] .light-components {
  --color-bg-container: #141414;
  --color-text-primary: #ffffffd9;
}
```

### 个性化定制
```tsx
// 方式1: 通过 className 定制
<Button className="bg-gradient-to-r from-purple-500 to-pink-500">
  渐变按钮
</Button>

// 方式2: 通过 CSS 变量定制
const CustomCard = styled(CardShell)`
  --card-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-text-color: white;
`;

// 方式3: 通过主题提供者定制
<ThemeProvider 
  theme={{
    button: {
      primaryColor: '#ff6b35',
      borderRadius: '12px',
    }
  }}
>
  <Button variant="primary">自定义主题按钮</Button>
</ThemeProvider>
```

---

## 🚀 性能优化

### 懒加载
```tsx
// 动态导入大型组件
const SmartDialog = lazy(() => import('@/components/ui/SmartDialog'));

// 使用时配合 Suspense
<Suspense fallback={<div>加载中...</div>}>
  <SmartDialog {...props} />
</Suspense>
```

### 记忆化优化
```tsx
// 避免不必要的重渲染
const MemoizedCard = memo(CardShell);
const MemoizedTag = memo(TagPill);

// 稳定的回调函数
const handleClick = useCallback(() => {
  console.log('点击事件');
}, []);

<MemoizedButton onClick={handleClick}>
  优化后的按钮
</MemoizedButton>
```

### 批量操作优化
```tsx
// 批量渲染标签
const TagList = ({ tags }: { tags: string[] }) => {
  // 使用 React.Fragment 避免额外DOM节点
  return (
    <>
      {tags.map(tag => (
        <TagPill key={tag}>{tag}</TagPill>
      ))}
    </>
  );
};

// 虚拟滚动（大量数据时）
import { FixedSizeList as List } from 'react-window';

const VirtualTagList = ({ tags }: { tags: string[] }) => (
  <List
    height={200}
    itemCount={tags.length}
    itemSize={32}
    itemData={tags}
  >
    {({ index, data }) => (
      <TagPill key={data[index]}>{data[index]}</TagPill>
    )}
  </List>
);
```

---

## 🧪 测试指南

### 单元测试
```tsx
// Button 组件测试示例
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('应该正确渲染默认按钮', () => {
    render(<Button>测试按钮</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('测试按钮');
  });
  
  it('应该处理点击事件', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击我</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('应该在禁用状态下不响应点击', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>禁用按钮</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### 快照测试
```tsx
// 组件快照测试
import { render } from '@testing-library/react';
import { CardShell } from '@/components/ui/CardShell';

it('应该匹配快照', () => {
  const { container } = render(
    <CardShell variant="elevated">
      <div>测试内容</div>
    </CardShell>
  );
  expect(container.firstChild).toMatchSnapshot();
});
```

### 可访问性测试
```tsx
// 无障碍性测试
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('应该没有可访问性问题', async () => {
  const { container } = render(<Button>无障碍按钮</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 📊 最佳实践

### DO ✅
```tsx
// 1. 使用 Design Tokens
<Button variant="primary">使用预定义变体</Button>

// 2. 正确的 TypeScript 类型
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};

// 3. 合理的组件组合
<CardShell hoverable>
  <div className="space-y-4">
    <h3>标题</h3>
    <TagPill color="success">状态</TagPill>
    <Button variant="primary">操作</Button>
  </div>
</CardShell>

// 4. 性能优化
const OptimizedComponent = memo(() => {
  const memoizedValue = useMemo(() => expensiveCalculation(), []);
  return <Button>{memoizedValue}</Button>;
});
```

### DON'T ❌
```tsx
// 1. 避免硬编码样式
<Button style={{ backgroundColor: '#1890ff' }}>❌ 硬编码</Button>

// 2. 避免直接修改组件内部样式
<Button className="!bg-red-500">❌ 强制覆盖</Button>

// 3. 避免过度嵌套
<CardShell>
  <CardShell>
    <CardShell>❌ 过度嵌套</CardShell>
  </CardShell>
</CardShell>

// 4. 避免在循环中创建新函数
{items.map(item => (
  <Button 
    key={item.id}
    onClick={() => handleClick(item.id)} // ❌ 每次都创建新函数
  >
    {item.name}
  </Button>
))}
```

---

## 📚 相关资源

### 内部文档
- [Design Tokens 对照表](./DESIGN_TOKENS_REFERENCE.md)
- [动效规范文档](./MOTION_STANDARDS.md)
- [AntD 适配约定](./ANTD_ADAPTER_CONVENTIONS.md)

### 外部参考
- [React 组件最佳实践](https://react.dev/learn)
- [无障碍性指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [TypeScript React 备忘单](https://github.com/typescript-cheatsheets/react)

### 工具支持
- **VS Code**: 安装 ES7+ React/Redux/React-Native snippets
- **Chrome DevTools**: React Developer Tools
- **测试**: @testing-library/react + Jest

---

**🔄 版本历史**:
- v2.0 (2025-10-02): 完善测试指南和最佳实践，增加性能优化章节
- v1.0 (2025-10-01): 初始版本，四个基础轻组件的完整使用指南

**👥 贡献者**: 员工A (Design Tokens & Theme Bridge)