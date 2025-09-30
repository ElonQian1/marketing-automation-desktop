# UI组件库使用指南

本文档介绍如何使用项目中的模块化UI组件库。所有组件都基于Ant Design设计，并集成了统一的设计系统。

## 🏗️ 架构概览

```
src/components/ui/
├── buttons/          # 按钮组件
├── forms/           # 表单组件
├── layouts/         # 布局组件
├── feedback/        # 反馈组件
└── index.ts         # 统一导出
```

## 📦 安装和导入

### 统一导入方式
```typescript
import { 
  PrimaryButton, 
  SecondaryButton, 
  IconButton,
  Input,
  Select,
  FormField,
  PageContainer,
  Panel,
  Grid,
  GridItem,
  Loading 
} from '@/components/ui';
```

### 分类导入方式
```typescript
// 按钮组件
import { PrimaryButton, SecondaryButton, IconButton } from '@/components/ui/buttons';

// 表单组件
import { Input, Select, FormField } from '@/components/ui/forms';

// 布局组件
import { PageContainer, Panel, Grid } from '@/components/ui/layouts';

// 反馈组件
import { Loading, PageLoading } from '@/components/ui/feedback';
```

## 🎨 设计系统集成

所有组件都集成了统一的设计令牌：

- **颜色系统**: 语义化颜色变量
- **间距系统**: 8px基础网格
- **字体系统**: 层次化字体大小
- **动画系统**: 统一的过渡效果

## 🔧 组件使用示例

### 按钮组件

```typescript
// 主要操作按钮
<PrimaryButton 
  size="large" 
  loading={isSubmitting}
  onClick={handleSubmit}
>
  提交表单
</PrimaryButton>

// 次要操作按钮
<SecondaryButton 
  size="medium"
  onClick={handleCancel}
>
  取消
</SecondaryButton>

// 图标按钮
<IconButton 
  variant="primary"
  circular
  tooltip="刷新数据"
  onClick={handleRefresh}
>
  <RefreshIcon />
</IconButton>
```

### 表单组件

```typescript
// 表单字段包装
<FormField
  label="用户名"
  required
  error={errors.username}
  help="请输入有效的用户名"
>
  <Input
    placeholder="请输入用户名"
    value={username}
    onChange={setUsername}
    size="large"
  />
</FormField>

// 选择框
<Select
  placeholder="请选择选项"
  options={options}
  value={selected}
  onChange={setSelected}
  fullWidth
/>

// 多选框
<MultiSelect
  placeholder="请选择多个选项"
  options={options}
  value={selectedItems}
  onChange={setSelectedItems}
  maxCount={3}
/>
```

### 布局组件

```typescript
// 页面容器
<PageContainer
  title="设备管理"
  subtitle="管理所有连接的ADB设备"
  breadcrumb={breadcrumbItems}
  extra={<PrimaryButton>添加设备</PrimaryButton>}
>
  <Panel title="设备列表">
    {/* 页面内容 */}
  </Panel>
</PageContainer>

// 网格布局
<Grid spacing="large" horizontalAlign="space-between">
  <GridItem span={8}>
    <Panel>内容1</Panel>
  </GridItem>
  <GridItem span={8}>
    <Panel>内容2</Panel>
  </GridItem>
  <GridItem span={8}>
    <Panel>内容3</Panel>
  </GridItem>
</Grid>

// 响应式网格
<ResponsiveGridItem mobile={24} tablet={12} desktop={8}>
  <Panel>响应式内容</Panel>
</ResponsiveGridItem>
```

### 反馈组件

```typescript
// 页面加载
<PageLoading text="页面初始化中..." />

// 内容加载
<ContentLoading loading={isLoading} text="数据加载中...">
  <div>需要加载状态的内容</div>
</ContentLoading>

// 按钮加载
<PrimaryButton loading={isSubmitting}>
  {isSubmitting ? <ButtonLoading /> : '提交'}
</PrimaryButton>
```

## 🎯 最佳实践

### 1. 组件组合
```typescript
// 推荐：组合使用组件
const DeviceManagementPage = () => {
  return (
    <PageContainer title="设备管理">
      <Panel>
        <Grid spacing="medium">
          <GridItem span={16}>
            <FormField label="设备筛选">
              <Select options={deviceOptions} />
            </FormField>
          </GridItem>
          <GridItem span={8}>
            <PrimaryButton fullWidth>
              刷新设备
            </PrimaryButton>
          </GridItem>
        </Grid>
      </Panel>
    </PageContainer>
  );
};
```

### 2. 响应式设计
```typescript
// 在不同屏幕尺寸下调整布局
<Grid>
  <ResponsiveGridItem mobile={24} tablet={12} desktop={6}>
    <Panel>内容</Panel>
  </ResponsiveGridItem>
</Grid>
```

### 3. 无障碍支持
```typescript
// 确保组件支持键盘导航和屏幕阅读器
<IconButton
  tooltip="删除设备"
  aria-label="删除设备"
  onClick={handleDelete}
>
  <DeleteIcon />
</IconButton>
```

### 4. 错误处理
```typescript
// 处理表单验证错误
<FormField
  label="设备ID"
  error={errors.deviceId}
  required
>
  <Input
    error={!!errors.deviceId}
    placeholder="请输入设备ID"
  />
</FormField>
```

## 🔍 类型安全

所有组件都提供完整的TypeScript类型定义：

```typescript
import type { 
  PrimaryButtonProps,
  InputProps,
  GridProps,
  LoadingProps 
} from '@/components/ui';

// 自定义组件类型
interface CustomFormProps {
  onSubmit: (data: FormData) => void;
  loading?: boolean;
}

const CustomForm: React.FC<CustomFormProps> = ({ onSubmit, loading }) => {
  // 组件实现
};
```

## 📏 文件大小控制

- 每个组件文件保持在**500行以内**
- 复杂组件拆分为多个子组件
- 使用索引文件统一导出

## 🚀 扩展指南

### 添加新组件

1. 在相应目录下创建组件文件
2. 遵循现有命名和结构约定
3. 添加完整的TypeScript类型
4. 更新索引文件导出
5. 编写使用示例

### 组件增强

1. 保持向后兼容性
2. 使用Omit排除冲突属性
3. 提供合理的默认值
4. 支持自定义类名和样式

---

这个UI组件库为项目提供了统一、可维护、可扩展的组件基础，支持快速开发和一致的用户体验。