# Pattern组件使用指南

Pattern组件是项目中的高曝光业务模式组件，直接影响用户体验和品牌感知。

## 🎯 设计理念

1. **业务驱动**: 针对小红书营销工具的核心业务场景设计
2. **品牌优先**: 严格遵循设计令牌系统和品牌规范
3. **响应式设计**: 适配各种屏幕尺寸和使用场景
4. **交互一致**: 统一的动画效果和用户体验
5. **可扩展性**: 支持多种变体和自定义配置

## 📦 可用Pattern组件

### 页面结构组件
- **HeaderBar**: 页面头部导航栏
- **FilterBar**: 数据筛选工具栏

### 内容展示组件
- **MarketplaceCard**: 营销业务卡片组件
- **EmptyState**: 空状态展示组件
- **SkeletonPatterns**: 骨架屏占位组件

## 🚀 快速开始

### 安装和导入

```typescript
// 导入单个组件
import { HeaderBar, FilterBar } from '@/components/patterns';

// 导入多个组件
import { 
  HeaderBar,
  FilterBar,
  MarketplaceCard,
  EmptyState 
} from '@/components/patterns';
```

### 基础使用

```typescript
// 页面头部
<HeaderBar
  title="员工管理"
  description="管理和维护小红书营销团队"
  breadcrumb={[
    { label: "首页", href: "/" },
    { label: "员工管理" }
  ]}
  actions={<Button variant="default">添加员工</Button>}
/>

// 数据筛选
<FilterBar
  searchPlaceholder="搜索员工姓名或部门..."
  onSearch={handleSearch}
  filters={filterConfig}
  onFilterChange={handleFilterChange}
/>

// 业务数据展示
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <MarketplaceCard
    variant="metric"
    title="今日关注"
    value={156}
    trend="+12.5%"
    trendType="up"
    icon={<Heart />}
  />
  
  <DeviceCard
    title="设备001"
    status="online"
    deviceModel="Xiaomi 13 Pro"
    lastActive="2分钟前"
  />
</div>

// 空状态处理
<EmptyState
  variant="noData"
  title="暂无员工数据"
  description="开始添加团队成员来管理小红书营销活动"
  action={
    <Button variant="default" onClick={handleAddEmployee}>
      添加第一个员工
    </Button>
  }
/>
```

## 🎨 组件变体

### HeaderBar 变体
```typescript
<HeaderBar />                    // 默认样式
<CompactHeaderBar />             // 紧凑样式
<GradientHeaderBar />            // 渐变背景
<StickyHeaderBar />              // 粘性定位
```

### FilterBar 变体
```typescript
<FilterBar />                    // 完整功能
<CompactFilterBar />             // 紧凑模式
<SimpleSearchBar />              // 仅搜索
```

### MarketplaceCard 变体
```typescript
<MarketplaceCard variant="metric" />      // 数据指标
<MarketplaceCard variant="feature" />     // 功能模块
<MarketplaceCard variant="device" />      // 设备状态
<MarketplaceCard variant="campaign" />    // 营销活动
```

### EmptyState 变体
```typescript
<EmptyState variant="noData" />           // 无数据
<EmptyState variant="searchEmpty" />      // 搜索无结果
<EmptyState variant="filtered" />         // 筛选无结果
<EmptyState variant="error" />            // 错误状态
<EmptyState variant="offline" />          // 离线状态
<EmptyState variant="maintenance" />      // 维护中
```

## 📋 使用模式

### 典型页面结构
```typescript
function EmployeePage() {
  return (
    <div>
      {/* 页面头部 */}
      <HeaderBar
        title="员工管理"
        description="管理营销团队成员"
        breadcrumb={breadcrumbItems}
        actions={<AddEmployeeButton />}
      />
      
      {/* 筛选工具栏 */}
      <FilterBar
        searchPlaceholder="搜索员工..."
        onSearch={handleSearch}
        filters={employeeFilters}
        onFilterChange={handleFilterChange}
      />
      
      {/* 数据展示区域 */}
      {employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(employee => (
            <MarketplaceCard
              key={employee.id}
              variant="contact"
              title={employee.name}
              subtitle={employee.department}
              description={`负责人数: ${employee.managedCount}`}
            />
          ))}
        </div>
      ) : (
        <NoDataState
          title="暂无员工数据"
          description="还没有添加任何员工信息"
          action={<Button onClick={handleAddEmployee}>添加员工</Button>}
        />
      )}
    </div>
  );
}
```

### 筛选器配置
```typescript
const filterConfig = [
  {
    key: "department",
    label: "部门",
    type: "select",
    options: departments
  },
  {
    key: "status",
    label: "状态",
    type: "multiSelect", 
    options: statusOptions
  },
  {
    key: "dateRange",
    label: "日期范围",
    type: "dateRange"
  }
];
```

### 骨架屏使用
```typescript
function DataSection() {
  const { data, loading } = useQuery();
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  
  return <ActualContent data={data} />;
}
```

## 🎯 最佳实践

### 1. 优先使用Pattern组件
```typescript
// ✅ 推荐：使用高级Pattern组件
import { HeaderBar, FilterBar } from '@/components/patterns';

// ❌ 避免：重复造轮子
function CustomHeader() { /* ... */ }
```

### 2. 保持视觉一致性
```typescript
// ✅ 推荐：使用标准变体
<MarketplaceCard variant="metric" />

// ❌ 避免：过度自定义
<MarketplaceCard style={{ /* 大量自定义样式 */ }} />
```

### 3. 响应式设计
```typescript
// ✅ 推荐：使用响应式网格
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {cards.map(card => <MarketplaceCard key={card.id} {...card} />)}
</div>
```

### 4. 状态管理
```typescript
// ✅ 推荐：合理处理loading和空状态
{loading ? (
  <SkeletonList items={5} />
) : data.length > 0 ? (
  <DataList data={data} />
) : (
  <EmptyState variant="noData" />
)}
```

## 🔧 高级配置

### 主题定制
```typescript
// 支持主题切换
<ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
  <HeaderBar title="暗黑模式页面" />
  <FilterBar compact />
</ConfigProvider>
```

### 动画控制
```typescript
// 控制动画效果
<MarketplaceCard
  animated={true}          // 启用悬停动画
  clickable={true}         // 启用点击效果
  onClick={handleClick}
/>
```

### 自定义内容
```typescript
// 自定义操作区域
<HeaderBar
  title="页面标题"
  actions={
    <Space>
      <Button variant="outline">次要操作</Button>
      <Button variant="default">主要操作</Button>
    </Space>
  }
/>
```

## 📚 API 参考

每个Pattern组件都有完整的TypeScript类型定义，包含：

- **Props接口**: 组件属性定义
- **变体类型**: 支持的变体选项
- **事件回调**: 交互事件处理
- **样式配置**: 主题和样式选项

查看各组件文件的TypeScript定义获取详细API信息。

## 🔄 主题适配

所有Pattern组件都支持暗黑模式和紧凑模式：

```typescript
// 通过ConfigProvider全局配置
<ConfigProvider 
  theme={{ 
    algorithm: [theme.darkAlgorithm, theme.compactAlgorithm] 
  }}
>
  <App />
</ConfigProvider>
```

## 📖 相关文档

- [适配器系统指南](../adapters/README.md)
- [设计令牌系统](../../design-tokens.md)
- [品牌化指南](../../../docs/brand-guidelines.md)