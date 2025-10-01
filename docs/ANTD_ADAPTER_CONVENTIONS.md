# AntD 适配约定

**版本**: v2.0  
**最后更新**: 2025-10-02  
**维护者**: 员工A (Design Tokens & Theme Bridge 负责人)

---

## 🎯 适配原则

### 核心理念
employeeGUI 项目通过**适配器模式**实现 AntD 组件与品牌设计系统的统一，确保：

- ✅ **品牌一致性**: 所有 AntD 组件遵循统一视觉规范
- ✅ **无样式覆盖**: 禁止使用 `.ant-*` 类名覆盖，通过适配器实现
- ✅ **主题响应**: 自动适配浅色/暗黑/紧凑模式切换
- ✅ **向前兼容**: AntD 版本升级不影响品牌样式
- ✅ **类型安全**: 完整保留 AntD 原有 TypeScript 类型

### 架构设计
```
AntD 原组件 → 品牌适配器 → Design Tokens → 最终渲染
    ↓              ↓              ↓           ↓
 Table         TableAdapter    tokens.css   品牌化表格
 Form          FormAdapter     ThemeBridge  品牌化表单
```

---

## 📊 TableAdapter - 表格适配器

### 基础用法
```tsx
import { TableAdapter } from '@/components/adapters/TableAdapter';
import type { ColumnType } from 'antd/es/table';

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
}

const columns: ColumnType<DataType>[] = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '年龄', 
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: '地址',
    dataIndex: 'address', 
    key: 'address',
  },
];

function MyTableComponent() {
  return (
    <TableAdapter<DataType>
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 10 }}
    />
  );
}
```

### 品牌化特性
```tsx
// 1. 自动主题适配
<TableAdapter 
  columns={columns}
  dataSource={data}
  // 自动应用：
  // - 品牌色彩方案
  // - 统一边框样式  
  // - 暗黑模式适配
  // - 紧凑模式支持
/>

// 2. 增强的选择功能
<TableAdapter
  columns={columns}
  dataSource={data}
  rowSelection={{
    type: 'checkbox',
    onChange: (selectedRowKeys) => {
      console.log('选中行:', selectedRowKeys);
    },
    // 自动应用品牌化选择框样式
  }}
/>

// 3. 品牌化排序和筛选
<TableAdapter
  columns={[
    {
      title: '状态',
      dataIndex: 'status',
      filters: [
        { text: '启用', value: 'active' },
        { text: '禁用', value: 'inactive' },
      ],
      // 筛选器使用品牌颜色和图标
    }
  ]}
  dataSource={data}
/>
```

### 高级配置
```tsx
// 完整配置示例
<TableAdapter
  columns={enhancedColumns}
  dataSource={tableData}
  
  // 分页配置
  pagination={{
    current: currentPage,
    pageSize: pageSize,
    total: totalCount,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => 
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  }}
  
  // 加载状态
  loading={isLoading}
  
  // 品牌化空状态
  locale={{
    emptyText: <EmptyState description="暂无数据" />
  }}
  
  // 滚动配置
  scroll={{ x: 1200, y: 400 }}
  
  // 行配置
  rowKey="id"
  size="middle"
  bordered={false}
  
  // 事件处理
  onChange={(pagination, filters, sorter) => {
    console.log('表格状态变化:', { pagination, filters, sorter });
  }}
/>
```

### 自定义列渲染
```tsx
const customColumns: ColumnType<DataType>[] = [
  {
    title: '操作',
    key: 'action',
    render: (_, record) => (
      <div className="space-x-2">
        <Button size="small" variant="primary">
          编辑
        </Button>
        <Button size="small" variant="danger">
          删除
        </Button>
      </div>
    ),
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: string) => (
      <TagPill 
        color={status === 'active' ? 'success' : 'default'}
      >
        {status === 'active' ? '启用' : '禁用'}
      </TagPill>
    ),
  },
];
```

---

## 📝 FormAdapter - 表单适配器

### 基础用法
```tsx
import { FormAdapter } from '@/components/adapters/FormAdapter';

function MyFormComponent() {
  const [form] = Form.useForm();
  
  const handleSubmit = (values: any) => {
    console.log('表单提交:', values);
  };
  
  return (
    <FormAdapter
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        label="用户名"
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item
        label="邮箱"
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' }
        ]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item>
        <Button variant="primary" htmlType="submit">
          提交
        </Button>
      </Form.Item>
    </FormAdapter>
  );
}
```

### 布局模式
```tsx
// 垂直布局（推荐）
<FormAdapter layout="vertical">
  <Form.Item label="标签" name="field">
    <Input />
  </Form.Item>
</FormAdapter>

// 水平布局
<FormAdapter 
  layout="horizontal"
  labelCol={{ span: 4 }}
  wrapperCol={{ span: 20 }}
>
  <Form.Item label="标签" name="field">
    <Input />
  </Form.Item>
</FormAdapter>

// 内联布局
<FormAdapter layout="inline">
  <Form.Item label="搜索" name="search">
    <Input />
  </Form.Item>
  <Form.Item>
    <Button variant="primary">搜索</Button>
  </Form.Item>
</FormAdapter>
```

### 复杂表单示例
```tsx
const ComplexFormExample = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await submitFormData(values);
      message.success('提交成功');
      form.resetFields();
    } catch (error) {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CardShell>
      <FormAdapter
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        {/* 基础信息 */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
            ]}
          >
            <Input />
          </Form.Item>
        </div>
        
        {/* 选择器 */}
        <Form.Item
          label="部门"
          name="department"
          rules={[{ required: true }]}
        >
          <Select placeholder="请选择部门">
            <Select.Option value="tech">技术部</Select.Option>
            <Select.Option value="product">产品部</Select.Option>
            <Select.Option value="design">设计部</Select.Option>
          </Select>
        </Form.Item>
        
        {/* 日期选择 */}
        <Form.Item
          label="入职日期"
          name="joinDate"
          rules={[{ required: true }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
        
        {/* 文本域 */}
        <Form.Item
          label="个人简介"
          name="bio"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        
        {/* 提交按钮 */}
        <Form.Item className="mb-0">
          <div className="flex justify-end space-x-2">
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
            <Button 
              variant="primary" 
              htmlType="submit"
              loading={loading}
            >
              {loading ? '提交中...' : '提交'}
            </Button>
          </div>
        </Form.Item>
      </FormAdapter>
    </CardShell>
  );
};
```

### 表单验证增强
```tsx
// 自定义验证规则
const customRules = {
  // 密码强度验证
  password: [
    { required: true, message: '请输入密码' },
    { min: 8, message: '密码至少8位' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
      message: '密码必须包含大小写字母和数字'
    }
  ],
  
  // 确认密码
  confirmPassword: [
    { required: true, message: '请确认密码' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || getFieldValue('password') === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('两次输入的密码不一致'));
      },
    }),
  ],
};

// 在表单中使用
<Form.Item label="密码" name="password" rules={customRules.password}>
  <Input.Password />
</Form.Item>

<Form.Item label="确认密码" name="confirmPassword" rules={customRules.confirmPassword}>
  <Input.Password />
</Form.Item>
```

---

## 🎨 样式定制系统

### Design Tokens 映射
```css
/* TableAdapter 的样式令牌 */
.table-adapter {
  --table-header-bg: var(--color-bg-elevated);
  --table-header-color: var(--color-text-primary);
  --table-row-hover-bg: var(--color-bg-container);
  --table-border-color: var(--color-border);
  --table-selected-bg: rgba(24, 144, 255, 0.08);
}

/* FormAdapter 的样式令牌 */
.form-adapter {
  --form-label-color: var(--color-text-primary);
  --form-border-color: var(--color-border);
  --form-border-radius: var(--border-radius-md);
  --form-spacing: var(--spacing-md);
  --form-error-color: var(--color-error);
}
```

### 主题模式适配
```css
/* 暗黑模式自动适配 */
[data-theme="dark"] .table-adapter {
  --table-header-bg: #1f1f1f;
  --table-row-hover-bg: #262626;
  --table-border-color: #434343;
}

[data-theme="dark"] .form-adapter {
  --form-label-color: #ffffffd9;
  --form-border-color: #434343;
}

/* 紧凑模式适配 */
[data-size="compact"] .table-adapter {
  --table-row-height: 32px;
  --table-padding: var(--spacing-sm);
}

[data-size="compact"] .form-adapter {
  --form-spacing: var(--spacing-sm);
  --form-item-margin: var(--spacing-xs);
}
```

---

## 🔧 适配器开发指南

### 创建新适配器的步骤

#### 1. 确定适配需求
```typescript
// 分析原始 AntD 组件
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

// 定义品牌化需求
interface BrandButtonProps extends AntButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  // 其他品牌化属性
}
```

#### 2. 创建适配器文件
```typescript
// src/components/adapters/ButtonAdapter.tsx
import React from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import { cn } from '@/utils/cn';

interface ButtonAdapterProps extends Omit<AntButtonProps, 'type'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const ButtonAdapter: React.FC<ButtonAdapterProps> = ({
  variant = 'primary',
  className,
  children,
  ...props
}) => {
  // 变体到 AntD type 的映射
  const typeMap = {
    primary: 'primary',
    secondary: 'default', 
    danger: 'primary',
    ghost: 'ghost',
  } as const;
  
  // 品牌化样式类名
  const variantClasses = {
    primary: 'btn-brand-primary',
    secondary: 'btn-brand-secondary',
    danger: 'btn-brand-danger',
    ghost: 'btn-brand-ghost',
  };
  
  return (
    <AntButton
      type={typeMap[variant]}
      className={cn(
        'brand-button-adapter',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </AntButton>
  );
};
```

#### 3. 创建配套样式
```css
/* src/components/adapters/ButtonAdapter.module.css */
.brand-button-adapter {
  /* 基础样式重置 */
  border-radius: var(--border-radius-md);
  font-weight: 500;
  transition: all var(--motion-duration-micro) var(--motion-ease-linear);
}

.btn-brand-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-brand-primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-brand-danger {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}
```

#### 4. 添加 TypeScript 导出
```typescript
// src/components/adapters/index.ts
export { TableAdapter } from './TableAdapter';
export { FormAdapter } from './FormAdapter';
export { ButtonAdapter } from './ButtonAdapter';
export type { 
  TableAdapterProps,
  FormAdapterProps,
  ButtonAdapterProps 
} from './types';
```

### 适配器测试
```tsx
// src/components/adapters/__tests__/ButtonAdapter.test.tsx
import { render, screen } from '@testing-library/react';
import { ButtonAdapter } from '../ButtonAdapter';
import { ThemeBridge } from '@/components/theme/ThemeBridge';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeBridge>
      {component}
    </ThemeBridge>
  );
};

describe('ButtonAdapter', () => {
  it('应该正确渲染主要按钮', () => {
    renderWithTheme(
      <ButtonAdapter variant="primary">
        测试按钮
      </ButtonAdapter>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('测试按钮');
    expect(button).toHaveClass('btn-brand-primary');
  });
  
  it('应该传递原始 AntD 属性', () => {
    renderWithTheme(
      <ButtonAdapter 
        variant="primary"
        size="large"
        disabled
      >
        禁用按钮
      </ButtonAdapter>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('ant-btn-lg');
  });
});
```

---

## 📋 最佳实践

### DO ✅

#### 1. 使用适配器代替直接使用 AntD
```tsx
// ✅ 正确：使用适配器
import { TableAdapter, FormAdapter } from '@/components/adapters';

<TableAdapter columns={columns} dataSource={data} />
<FormAdapter layout="vertical">
  <Form.Item>
    <Input />
  </Form.Item>
</FormAdapter>
```

#### 2. 保持 AntD API 兼容性
```tsx
// ✅ 正确：完整保留原始 API
<TableAdapter
  columns={columns}
  dataSource={data}
  pagination={{ pageSize: 10 }}    // AntD 原生属性
  rowSelection={{ type: 'radio' }} // AntD 原生属性
  onChange={handleTableChange}     // AntD 原生事件
/>
```

#### 3. 适当扩展品牌化功能
```tsx
// ✅ 正确：在保持兼容的基础上增加品牌功能
<FormAdapter
  layout="vertical"           // AntD 原生
  brandValidation={true}      // 品牌扩展
  compactMode={isCompact}     // 品牌扩展
>
```

### DON'T ❌

#### 1. 避免使用 .ant-* 覆盖
```css
/* ❌ 错误：直接覆盖 AntD 样式 */
.ant-table-thead > tr > th {
  background: red !important;
}

/* ✅ 正确：通过适配器和 Design Tokens */
.table-adapter {
  --table-header-bg: var(--color-bg-elevated);
}
```

#### 2. 避免破坏原始 API
```tsx
// ❌ 错误：改变原始 API 结构
<TableAdapter 
  data={data}           // 应该是 dataSource
  cols={columns}        // 应该是 columns
/>

// ✅ 正确：保持原始 API
<TableAdapter
  dataSource={data}
  columns={columns}
/>
```

#### 3. 避免硬编码样式值
```tsx
// ❌ 错误：硬编码样式
<TableAdapter 
  style={{ backgroundColor: '#f5f5f5' }}
/>

// ✅ 正确：使用 Design Tokens
<TableAdapter 
  className="bg-token-layout"
/>
```

---

## 📊 适配器维护

### 版本兼容性策略
```json
{
  "antd": "^5.0.0",
  "adapterVersion": "2.0.0",
  "compatibility": {
    "antd@4.x": "adapter@1.x",
    "antd@5.x": "adapter@2.x"
  }
}
```

### 升级检查清单
- [ ] **API 兼容性**: 新版本 AntD 是否有 breaking changes
- [ ] **样式适配**: 新版本样式是否需要调整适配器
- [ ] **类型定义**: TypeScript 类型是否需要更新
- [ ] **测试覆盖**: 所有适配器功能是否正常
- [ ] **文档更新**: 使用指南是否需要更新

### 性能监控
```typescript
// 适配器性能监控
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const renderStart = performance.now();
    
    React.useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      if (renderTime > 16) { // 超过一帧时间
        console.warn(`Adapter ${Component.name} render time: ${renderTime}ms`);
      }
    });
    
    return <Component {...props} ref={ref} />;
  });
};
```

---

## 🔗 相关资源

### 内部文档
- [Design Tokens 对照表](./DESIGN_TOKENS_REFERENCE.md)
- [轻组件使用指南](./LIGHTWEIGHT_COMPONENTS_GUIDE.md)
- [动效规范文档](./MOTION_STANDARDS.md)

### AntD 官方资源
- [Ant Design 5.x 文档](https://ant.design/docs/react/introduce-cn)
- [Ant Design 定制主题](https://ant.design/docs/react/customize-theme-cn)
- [Ant Design TypeScript](https://ant.design/docs/react/use-with-typescript-cn)

### 工具和插件
- **VS Code**: Ant Design Snippets
- **DevTools**: React Developer Tools
- **测试**: @testing-library/react

---

**🔄 版本历史**:
- v2.0 (2025-10-02): 完善适配器开发指南，增加最佳实践和维护策略
- v1.0 (2025-10-01): 初始版本，TableAdapter 和 FormAdapter 的完整使用规范

**👥 贡献者**: 员工A (Design Tokens & Theme Bridge)