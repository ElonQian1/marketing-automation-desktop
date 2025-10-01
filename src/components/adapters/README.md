# 适配器系统使用指南

适配器系统为项目提供了统一的AntD组件包装层，确保设计一致性和架构合规性。

## 🎯 设计原则

1. **统一接口**: 所有适配器提供一致的API设计模式
2. **零覆盖**: 不使用`.ant-*`选择器，仅通过props和ConfigProvider配置
3. **类型安全**: 完整的TypeScript类型定义和推导
4. **品牌化**: 集成设计令牌系统，支持主题切换
5. **可扩展**: 支持自定义配置和扩展功能

## 📦 可用适配器

### 核心适配器
- **TableAdapter**: 表格组件适配器，支持sticky、分页、排序
- **FormAdapter**: 表单组件适配器，支持品牌化样式和验证
- **UploadAdapter**: 上传组件适配器，统一触发器和文件列表
- **TreeAdapter**: 树形组件适配器，支持虚拟滚动
- **DatePickerAdapter**: 日期选择器适配器，包含范围选择
- **DrawerAdapter**: 抽屉组件适配器，统一宽度和位置
- **StepsAdapter**: 步骤条适配器，支持密度配置

### 表单控件适配器
- **CheckboxAdapter**: 复选框适配器
- **RadioAdapter**: 单选框适配器  
- **SwitchAdapter**: 开关适配器
- **SliderAdapter**: 滑块适配器，包含范围滑块
- **InputNumberAdapter**: 数字输入框适配器
- **SelectAdapter**: 选择器适配器

### 反馈组件适配器
- **ModalAdapter**: 对话框适配器
- **TooltipAdapter**: 工具提示适配器
- **PopoverAdapter**: 弹出框适配器
- **PaginationAdapter**: 分页适配器
- **NotificationAdapter**: 通知适配器

## 🚀 快速开始

### 安装和导入

```typescript
// 导入单个适配器
import { TableAdapter, FormAdapter } from '@/components/adapters';

// 导入多个适配器
import { 
  TableAdapter,
  FormAdapter,
  SelectAdapter,
  NotificationAdapter 
} from '@/components/adapters';
```

### 基础使用

```typescript
// 表格适配器
<TableAdapter
  columns={columns}
  dataSource={data}
  brandTheme="modern"
  sticky
/>

// 表单适配器
<FormAdapter
  form={form}
  onFinish={handleSubmit}
  brandTheme="compact"
  showBrandedSubmit
>
  <FormItemAdapter name="username" label="用户名">
    <Input />
  </FormItemAdapter>
</FormAdapter>

// 通知适配器
NotificationAdapter.success({
  message: '操作成功',
  description: '数据已成功保存'
});
```

## 🎨 主题配置

所有适配器都支持主题配置：

```typescript
// 品牌主题
<FormAdapter brandTheme="modern" />
<FormAdapter brandTheme="compact" />
<FormAdapter brandTheme="elegant" />

// 响应式设计
<TableAdapter responsive={true} />

// 暗黑模式（通过ConfigProvider）
<ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
  <TableAdapter columns={columns} dataSource={data} />
</ConfigProvider>
```

## 📋 最佳实践

### 1. 统一使用适配器
```typescript
// ✅ 推荐：使用适配器
import { TableAdapter } from '@/components/adapters';
<TableAdapter columns={columns} dataSource={data} />

// ❌ 避免：直接使用AntD组件
import { Table } from 'antd';
<Table columns={columns} dataSource={data} />
```

### 2. 保持类型安全
```typescript
// ✅ 推荐：使用类型定义
import { FormAdapter, type FormAdapterProps } from '@/components/adapters';

interface MyFormProps extends FormAdapterProps {
  onCustomAction: () => void;
}
```

### 3. 合理使用变体
```typescript
// 不同场景使用不同变体
<FormAdapter />                    // 默认表单
<DialogFormAdapter />              // 对话框表单
<StepFormAdapter />                // 步骤表单
```

### 4. 错误处理
```typescript
// 通知适配器错误处理
try {
  await saveData();
  NotificationAdapter.operationSuccess('保存成功');
} catch (error) {
  NotificationAdapter.operationError('保存失败', error.message);
}
```

## 🔧 高级用法

### 自定义配置
```typescript
// 全局通知配置
NotificationAdapter.config({
  placement: 'topRight',
  duration: 3,
});

// 批量通知
NotificationAdapter.batch([
  { type: 'info', message: '开始处理' },
  { type: 'success', message: '处理完成' },
]);
```

### 主题令牌集成
```typescript
// 使用设计令牌
<FormAdapter 
  style={{
    '--form-padding': 'var(--padding-lg)',
    '--form-radius': 'var(--border-radius)',
  }}
/>
```

## 📚 API 参考

详细的API参考文档请查看各适配器的TypeScript定义文件，所有属性都有完整的注释说明。

## 🐛 故障排除

### 常见问题

1. **类型错误**: 确保导入了正确的类型定义
2. **样式问题**: 检查是否正确配置了ConfigProvider
3. **主题不生效**: 验证品牌主题配置是否正确

### 调试技巧

```typescript
// 检查适配器默认配置
console.log(NotificationAdapter.getDefaults());

// 验证表单配置
<FormAdapter 
  onValuesChange={(changedValues) => console.log(changedValues)}
/>
```

## 🔄 迁移指南

从直接使用AntD组件迁移到适配器：

1. 替换导入语句
2. 更新组件名称
3. 调整属性配置
4. 验证功能正常

## 📖 相关文档

- [Pattern组件指南](../patterns/README.md)
- [设计令牌系统](../../design-tokens.md)
- [主题配置指南](../../theme-system.md)