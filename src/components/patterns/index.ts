
/**
 * 高曝光模式组件导出 - 关键业务组件库
 * 
 * 设计原则：
 * 1. 品牌优先：所有组件严格遵循设计令牌系统
 * 2. 业务驱动：针对小红书营销工具的核心业务场景设计
 * 3. 响应式设计：适配各种屏幕尺寸和使用场景
 * 4. 交互一致：统一的动画效果和用户体验
 * 5. 可扩展性：支持多种变体和自定义配置
 */

// FilterBar - 数据筛选工具栏
export {
  FilterBar,
  CompactFilterBar,
  SimpleSearchBar,
  type FilterBarProps,
  type FilterConfig,
} from "./filter-bar/FilterBar";

// HeaderBar - 页面头部导航栏
export {
  HeaderBar,
  CompactHeaderBar,
  GradientHeaderBar,
  StickyHeaderBar,
  SimplePageHeader,
  type HeaderBarProps,
  type BreadcrumbItem,
} from "./header-bar/HeaderBar";

// EmptyState - 空状态展示组件
export {
  EmptyState,
  NoDataState,
  SearchEmptyState,
  ErrorState,
  FilteredEmptyState,
  OfflineState,
  CompactEmptyState,
  type EmptyStateProps,
  type EmptyStateVariant,
} from "./empty-state/EmptyState";

// MarketplaceCard - 营销业务卡片组件
export {
  MarketplaceCard,
  MetricCard,
  DeviceCard,
  FeatureCard,
  CampaignCard,
  type MarketplaceCardProps,
  type MarketplaceCardVariant,
  type TrendType,
  type DeviceStatus,
} from "./marketplace-card/MarketplaceCard";

/**
 * 高曝光组件使用指南
 * 
 * 这些组件是项目中最重要的UI模式，直接影响用户体验和品牌感知。
 * 
 * 使用原则：
 * - 优先使用这些高级组件而非基础UI组件
 * - 保持组件间的视觉和交互一致性
 * - 根据业务场景选择合适的变体
 * - 充分利用品牌化的动画和交互效果
 * 
 * 典型使用场景：
 * 
 * ```tsx
 * import { 
 *   HeaderBar, 
 *   FilterBar, 
 *   MarketplaceCard,
 *   EmptyState 
 * } from '@/components/patterns';
 * 
 * // 页面头部
 * <HeaderBar
 *   title="员工管理"
 *   description="管理和维护小红书营销团队"
 *   breadcrumb={[
 *     { label: "首页", href: "/" },
 *     { label: "员工管理" }
 *   ]}
 *   actions={
 *     <Button variant="default">添加员工</Button>
 *   }
 * />
 * 
 * // 数据筛选
 * <FilterBar
 *   searchPlaceholder="搜索员工姓名或部门..."
 *   onSearch={handleSearch}
 *   filters={[
 *     {
 *       key: "department",
 *       label: "部门",
 *       type: "select",
 *       options: departments
 *     },
 *     {
 *       key: "status",
 *       label: "状态",
 *       type: "multiSelect", 
 *       options: statusOptions
 *     }
 *   ]}
 *   onFilterChange={handleFilterChange}
 * />
 * 
 * // 业务数据展示
 * <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 *   <MarketplaceCard
 *     variant="metric"
 *     title="今日关注"
 *     value={156}
 *     trend="+12.5%"
 *     trendType="up"
 *     icon={<Heart />}
 *   />
 *   
 *   <DeviceCard
 *     title="设备001"
 *     status="online"
 *     deviceModel="Xiaomi 13 Pro"
 *     lastActive="2分钟前"
 *   />
 * </div>
 * 
 * // 空状态处理
 * <EmptyState
 *   variant="noData"
 *   title="暂无员工数据"
 *   description="开始添加团队成员来管理小红书营销活动"
 *   action={
 *     <Button variant="default" onClick={handleAddEmployee}>
 *       添加第一个员工
 *     </Button>
 *   }
 * />
 * ```
 * 
 * 主题变体说明：
 * 
 * FilterBar:
 * - default: 标准筛选栏，适用于大多数列表页面
 * - compact: 紧凑型，适用于空间有限的场景
 * - simple: 仅搜索功能，适用于简单筛选需求
 * 
 * HeaderBar:
 * - default: 标准页面头部
 * - gradient: 渐变背景，适用于着陆页
 * - minimal: 简化样式，适用于内容密集页面
 * - sticky: 粘性定位，滚动时保持可见
 * 
 * MarketplaceCard:
 * - metric: 数据指标展示
 * - feature: 功能模块入口
 * - device: 设备状态监控
 * - campaign: 营销活动数据
 * - analytics: 分析报表卡片
 * 
 * EmptyState:
 * - noData: 无数据场景
 * - searchEmpty: 搜索无结果
 * - filtered: 筛选无结果
 * - error: 错误状态
 * - offline: 离线状态
 * 
 * 性能优化建议：
 * - 合理使用动画，避免在长列表中启用复杂动效
 * - 使用 compact 变体减少大量数据场景的渲染负担
 * - 充分利用预设组件减少重复代码
 */