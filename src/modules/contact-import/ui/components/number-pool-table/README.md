# 号码池表格增强模块

## 📁 目录结构

```
src/modules/contact-import/ui/components/number-pool-table/
├── index.ts                      # 统一导出入口
├── NumberPoolTableColumns.ts     # 列配置管理
├── NumberPoolFieldRenderers.tsx  # 字段渲染组件
├── useNumberPoolTable.ts         # 表格配置Hook  
├── ColumnConfigPanel.tsx         # 列显示配置面板
└── README.md                     # 本文档
```

## 🎯 功能特性

### ✅ 已完成的增强

1. **完整字段显示**
   - 序号、ID、号码、姓名
   - **行业分类** - 显示为彩色标签，未分类显示灰色
   - **状态** - 已导入/VCF已生成/未导入状态标签
   - **是否已用** - 已使用/未使用状态标签  
   - **导入设备** - 显示设备ID与图标
   - 来源文件、创建时间

2. **智能数据渲染**
   - 状态使用彩色标签（绿色-已导入，蓝色-VCF已生成，灰色-未导入）
   - 时间字段自动本地化格式显示
   - 设备字段显示为带图标的蓝色标签
   - 行业分类使用彩色标签，未分类显示友好提示

3. **模块化架构**
   - 遵循DDD架构原则
   - 支持未来扩展列配置管理
   - 预留设备信息集成接口

## 🚀 设计亮点

### 模块化设计
- **NumberPoolTableColumns.ts**: 集中管理列配置，支持显示/隐藏、排序、筛选
- **NumberPoolFieldRenderers.tsx**: 专门的字段渲染组件，保证一致性和可复用性
- **useNumberPoolTable.ts**: Hook封装表格状态管理逻辑
- **ColumnConfigPanel.tsx**: 用户可配置的列显示面板

### 数据增强
相比之前只显示基础字段（ID、号码、姓名、来源、时间），现在增加了：
- 行业分类字段
- 导入状态字段  
- 使用状态字段
- 导入设备字段
- 序号字段

### 视觉优化
- 使用Ant Design标签系统
- 语义化颜色（成功-绿色，处理中-蓝色，默认-灰色）
- 图标增强（设备字段显示手机图标）
- 友好的空值显示（"-" 或 "未分类"）

## 📈 影响范围

### ✅ 当前集成状态
- `ContactImportWorkbench.tsx` 已集成增强的列定义
- 保持原有文件结构，仅替换 `columns` 配置
- 向后兼容，不影响现有功能

### 🔄 未来扩展计划
- 列显示配置面板集成到工作台
- 设备信息通过 `useAdb()` Hook 获取详细信息
- 支持列排序和高级筛选
- 导出功能增强

## 🛠️ 技术实现

### 核心技术栈
- React 18 + TypeScript
- Ant Design 组件库
- 模块化Hook设计
- 遵循项目DDD架构

### 性能考虑
- 渲染组件采用纯函数设计
- Hook使用useMemo优化重渲染
- 列配置支持懒加载

### 错误处理
- 时间解析异常自动回退到原始字符串
- 空值/null值友好显示
- 设备信息缺失时显示占位符

## 📋 使用示例

### 基础使用
```tsx
import { useNumberPoolTable, ColumnConfigPanel } from './components/number-pool-table';

const MyComponent = () => {
  const { devices } = useAdb();
  
  const tableConfig = useNumberPoolTable({
    page: 1,
    pageSize: 20,
    devices,
  });

  return (
    <Table
      columns={tableConfig.columns}
      dataSource={items}
      // ... 其他配置
    />
  );
};
```

### 列配置面板
```tsx
<ColumnConfigPanel
  availableColumns={tableConfig.availableColumns}
  visibleColumns={tableConfig.visibleColumns}
  onToggleColumn={tableConfig.toggleColumn}
  onResetColumns={tableConfig.resetColumns}
/>
```

## 🎯 开发指导

### 添加新字段渲染器
1. 在 `NumberPoolFieldRenderers.tsx` 中添加新的渲染组件
2. 在 `createNumberPoolRenderers` 函数中注册
3. 在 `NumberPoolTableColumns.ts` 中添加列配置

### 扩展列配置
1. 在 `COLUMN_CONFIGS` 数组中添加新配置
2. 设置合适的 `defaultVisible`、`width`、`sortable` 等属性
3. 确保数据类型与 `ContactNumberDto` 接口匹配

### 注意事项
- 保持单个文件不超过500行的架构约束
- 优先使用模块化组件而非内联渲染
- 遵循项目的DDD架构原则
- 使用统一的 `useAdb()` Hook 获取设备信息

---

**更新日期**: 2025年9月30日  
**版本**: v1.0  
**状态**: 已完成基础增强，可投入使用