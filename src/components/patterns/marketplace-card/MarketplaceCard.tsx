
/**
 * MarketplaceCard - 营销卡片组件
 * 
 * 职责：
 * 1. 展示小红书营销工具的功能模块和数据统计
 * 2. 提供统一的卡片布局和交互设计
 * 3. 支持多种展示模式（统计、功能、设备、联系人等）
 * 4. 品牌化的视觉效果和悬停动画
 * 
 * 使用场景：
 * - 仪表板数据展示
 * - 功能模块入口卡片
 * - 设备管理卡片
 * - 营销数据统计展示
 * 
 * 使用方式：
 * <MarketplaceCard
 *   variant="metric"
 *   title="今日关注"
 *   value={156}
 *   trend="+12.5%"
 *   icon={<Heart />}
 * />
 */

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal,
  ExternalLink,
  Play,
  Pause,
  Settings,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";
import { hoverVariants } from "../../ui/motion";

/**
 * 卡片变体
 */
export type MarketplaceCardVariant = 
  | "metric"        // 数据指标
  | "feature"       // 功能模块
  | "device"        // 设备状态
  | "contact"       // 联系人信息
  | "campaign"      // 营销活动
  | "analytics"     // 数据分析
  | "task";         // 任务状态

/**
 * 趋势类型
 */
export type TrendType = "up" | "down" | "neutral";

/**
 * 设备状态
 */
export type DeviceStatus = "online" | "offline" | "busy" | "error";

/**
 * 营销卡片属性
 */
export interface MarketplaceCardProps {
  /** 卡片变体 */
  variant?: MarketplaceCardVariant;
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 主要数值 */
  value?: string | number;
  /** 数值单位 */
  unit?: string;
  /** 趋势文字和类型 */
  trend?: string;
  trendType?: TrendType;
  /** 描述文字 */
  description?: string;
  /** 图标 */
  icon?: React.ReactNode;
  /** 状态（设备卡片专用） */
  status?: DeviceStatus;
  /** 进度百分比 */
  progress?: number;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 右上角操作按钮 */
  actions?: React.ReactNode;
  /** 底部操作区域 */
  footer?: React.ReactNode;
  /** 是否启用悬停动画 */
  animated?: boolean;
  /** 是否正在加载 */
  loading?: boolean;
  /** 容器类名 */
  className?: string;
  /** 额外的数据标签 */
  badges?: { label: string; variant?: "default" | "success" | "warning" | "error" }[];
}

/**
 * 获取状态颜色
 */
const getStatusColor = (status: DeviceStatus) => {
  const colors = {
    online: "text-status-success bg-status-success/10",
    offline: "text-text-muted bg-background-secondary",
    busy: "text-status-warning bg-status-warning/10",
    error: "text-status-error bg-status-error/10",
  };
  return colors[status] || colors.offline;
};

/**
 * 获取趋势图标和颜色
 */
const getTrendDisplay = (trend: string, trendType?: TrendType) => {
  const isPositive = trendType === "up" || (!trendType && trend.includes("+"));
  const isNegative = trendType === "down" || (!trendType && trend.includes("-"));
  
  return {
    icon: isPositive ? TrendingUp : isNegative ? TrendingDown : null,
    color: isPositive ? "text-status-success" : isNegative ? "text-status-error" : "text-text-muted",
  };
};

/**
 * MarketplaceCard 组件
 */
export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  variant = "metric",
  title,
  subtitle,
  value,
  unit,
  trend,
  trendType,
  description,
  icon,
  status,
  progress,
  clickable = false,
  onClick,
  actions,
  footer,
  animated = true,
  loading = false,
  className,
  badges,
}) => {
  const trendDisplay = trend ? getTrendDisplay(trend, trendType) : null;

  // 卡片内容
  const cardContent = (
    <Card 
      variant={clickable ? "elevated" : "default"}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        clickable && "cursor-pointer hover:shadow-lg",
        loading && "opacity-60",
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {/* 加载状态遮罩 */}
      {loading && (
        <div className="absolute inset-0 bg-background-elevated/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="p-6">
        {/* 头部区域 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* 图标 */}
            {icon && (
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg shrink-0",
                variant === "device" && status 
                  ? getStatusColor(status)
                  : "bg-brand/10 text-brand"
              )}>
                {variant === "device" && status ? (
                  status === "online" ? <Wifi className="w-6 h-6" /> :
                  status === "offline" ? <WifiOff className="w-6 h-6" /> :
                  status === "busy" ? <Play className="w-6 h-6" /> :
                  <Settings className="w-6 h-6" />
                ) : (
                  icon
                )}
              </div>
            )}

            {/* 标题和副标题 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-text-muted truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          {actions && (
            <div className="flex items-center gap-1 shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* 主要内容区域 */}
        <div className="space-y-3">
          {/* 数值展示 */}
          {value !== undefined && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
              {unit && (
                <span className="text-sm text-text-muted">
                  {unit}
                </span>
              )}
              
              {/* 趋势指示器 */}
              {trendDisplay && (
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  trendDisplay.color
                )}>
                  {trendDisplay.icon && (
                    <trendDisplay.icon className="w-4 h-4" />
                  )}
                  <span>{trend}</span>
                </div>
              )}
            </div>
          )}

          {/* 进度条 */}
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">进度</span>
                <span className="text-text-primary font-medium">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-2">
                <div 
                  className="bg-brand rounded-full h-2 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          {/* 描述文字 */}
          {description && (
            <p className="text-sm text-text-muted">
              {description}
            </p>
          )}

          {/* 标签徽章 */}
          {badges && badges.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    badge.variant === "success" && "bg-status-success/10 text-status-success",
                    badge.variant === "warning" && "bg-status-warning/10 text-status-warning", 
                    badge.variant === "error" && "bg-status-error/10 text-status-error",
                    (!badge.variant || badge.variant === "default") && "bg-background-secondary text-text-muted"
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作区域 */}
        {footer && (
          <div className="mt-4 pt-4 border-t border-border-primary">
            {footer}
          </div>
        )}
      </div>
    </Card>
  );

  // 如果启用动画，包装 motion 组件
  if (animated && clickable) {
    return (
      <motion.div
        variants={hoverVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

/**
 * 预设的营销卡片组件
 */

// 数据指标卡片
export const MetricCard: React.FC<Omit<MarketplaceCardProps, 'variant'>> = (props) => (
  <MarketplaceCard variant="metric" {...props} />
);

// 设备状态卡片
export const DeviceCard: React.FC<Omit<MarketplaceCardProps, 'variant'> & { 
  deviceName?: string;
  deviceModel?: string;
  lastActive?: string;
}> = ({ 
  deviceName, 
  deviceModel, 
  lastActive,
  ...props 
}) => (
  <MarketplaceCard
    variant="device"
    title={deviceName || props.title}
    subtitle={deviceModel}
    description={lastActive ? `最后活跃: ${lastActive}` : props.description}
    icon={<Smartphone />}
    {...props}
  />
);

// 功能模块卡片
export const FeatureCard: React.FC<Omit<MarketplaceCardProps, 'variant'> & {
  isActive?: boolean;
  onToggle?: () => void;
}> = ({ 
  isActive, 
  onToggle,
  ...props 
}) => (
  <MarketplaceCard
    variant="feature"
    clickable={true}
    actions={onToggle && (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
    )}
    badges={isActive ? [{ label: "运行中", variant: "success" }] : [{ label: "已停止", variant: "default" }]}
    {...props}
  />
);

// 营销数据卡片
export const CampaignCard: React.FC<Omit<MarketplaceCardProps, 'variant'> & {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}> = ({ 
  views, 
  likes, 
  comments, 
  shares,
  ...props 
}) => (
  <MarketplaceCard
    variant="campaign"
    footer={
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center mb-1">
            <Eye className="w-4 h-4 text-text-muted" />
          </div>
          <div className="text-sm font-medium">{views?.toLocaleString() || 0}</div>
          <div className="text-xs text-text-muted">浏览</div>
        </div>
        <div>
          <div className="flex items-center justify-center mb-1">
            <Heart className="w-4 h-4 text-text-muted" />
          </div>
          <div className="text-sm font-medium">{likes?.toLocaleString() || 0}</div>
          <div className="text-xs text-text-muted">点赞</div>
        </div>
        <div>
          <div className="flex items-center justify-center mb-1">
            <MessageCircle className="w-4 h-4 text-text-muted" />
          </div>
          <div className="text-sm font-medium">{comments?.toLocaleString() || 0}</div>
          <div className="text-xs text-text-muted">评论</div>
        </div>
        <div>
          <div className="flex items-center justify-center mb-1">
            <Share2 className="w-4 h-4 text-text-muted" />
          </div>
          <div className="text-sm font-medium">{shares?.toLocaleString() || 0}</div>
          <div className="text-xs text-text-muted">分享</div>
        </div>
      </div>
    }
    {...props}
  />
);