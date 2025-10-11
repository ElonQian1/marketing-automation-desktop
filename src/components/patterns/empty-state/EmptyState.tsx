// src/components/patterns/empty-state/EmptyState.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件


/**
 * EmptyState - 空状态展示组件
 * 
 * 职责：
 * 1. 提供统一的空数据状态展示界面
 * 2. 支持多种场景的空状态（无数据、搜索无结果、错误状态等）
 * 3. 品牌化的插图和交互引导
 * 4. 可配置的行动召唤按钮
 * 
 * 使用场景：
 * - 数据表格无数据时
 * - 搜索结果为空时
 * - 功能模块初始状态
 * - 错误状态展示
 * 
 * 使用方式：
 * <EmptyState
 *   variant="noData"
 *   title="暂无员工数据"
 *   description="还没有添加任何员工信息"
 *   action={<Button>添加员工</Button>}
 * />
 */

import React from "react";
import { motion } from "framer-motion";
import { 
  FileX, 
  Search, 
  AlertCircle, 
  WifiOff, 
  Plus,
  RefreshCw,
  Settings,
  Users,
  Database,
  Filter
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button/Button";
import { fadeVariants } from "../../ui/motion";

/**
 * 空状态变体
 */
export type EmptyStateVariant = 
  | "noData"          // 无数据
  | "searchEmpty"     // 搜索无结果  
  | "filtered"        // 筛选无结果
  | "error"           // 错误状态
  | "offline"         // 离线状态
  | "loading"         // 加载失败
  | "permission"      // 权限不足
  | "maintenance"     // 维护中
  | "custom";         // 自定义

/**
 * 空状态属性
 */
export interface EmptyStateProps {
  /** 空状态变体 */
  variant?: EmptyStateVariant;
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 主要操作按钮 */
  action?: React.ReactNode;
  /** 次要操作按钮 */
  secondaryAction?: React.ReactNode;
  /** 图标大小 */
  iconSize?: "sm" | "md" | "lg";
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否启用动画 */
  animated?: boolean;
  /** 容器类名 */
  className?: string;
  /** 自定义插图 */
  illustration?: React.ReactNode;
}

/**
 * 获取默认配置
 */
const getVariantConfig = (variant: EmptyStateVariant) => {
  const configs = {
    noData: {
      icon: <FileX className="w-full h-full" />,
      title: "暂无数据",
      description: "当前还没有任何数据，点击下方按钮开始添加",
      color: "text-text-muted",
    },
    searchEmpty: {
      icon: <Search className="w-full h-full" />,
      title: "搜索无结果",
      description: "未找到符合条件的内容，请尝试调整搜索关键词",
      color: "text-text-muted",
    },
    filtered: {
      icon: <Filter className="w-full h-full" />,
      title: "筛选无结果",
      description: "当前筛选条件下没有找到匹配的内容",
      color: "text-text-muted",
    },
    error: {
      icon: <AlertCircle className="w-full h-full" />,
      title: "加载失败",
      description: "数据加载时发生错误，请稍后重试",
      color: "text-status-error",
    },
    offline: {
      icon: <WifiOff className="w-full h-full" />,
      title: "网络连接断开",
      description: "请检查网络连接并重试",
      color: "text-status-warning",
    },
    loading: {
      icon: <RefreshCw className="w-full h-full" />,
      title: "加载超时",
      description: "数据加载时间过长，请检查网络状况后重试",
      color: "text-text-muted",
    },
    permission: {
      icon: <Settings className="w-full h-full" />,
      title: "权限不足",
      description: "您没有权限查看此内容，请联系管理员",
      color: "text-status-warning",
    },
    maintenance: {
      icon: <Database className="w-full h-full" />,
      title: "系统维护中",
      description: "系统正在维护升级，请稍后再试",
      color: "text-text-muted",
    },
    custom: {
      icon: <FileX className="w-full h-full" />,
      title: "",
      description: "",
      color: "text-text-muted",
    },
  };

  return configs[variant] || configs.noData;
};

/**
 * EmptyState 组件
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = "noData",
  title,
  description,
  icon,
  action,
  secondaryAction,
  iconSize = "lg",
  compact = false,
  animated = true,
  className,
  illustration,
}) => {
  const config = getVariantConfig(variant);
  
  // 图标尺寸配置
  const iconSizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20",
  };

  // 内容布局
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8 px-4" : "py-16 px-6",
      className
    )}>
      {/* 插图或图标 */}
      <div className={cn(
        "mb-6 flex items-center justify-center",
        iconSizeClasses[iconSize],
        config.color
      )}>
        {illustration || icon || config.icon}
      </div>

      {/* 标题 */}
      <h3 className={cn(
        "font-semibold text-text-primary mb-2",
        compact ? "text-base" : "text-lg"
      )}>
        {title || config.title}
      </h3>

      {/* 描述 */}
      {(description || config.description) && (
        <p className={cn(
          "text-text-muted max-w-sm mb-6",
          compact ? "text-sm" : "text-base"
        )}>
          {description || config.description}
        </p>
      )}

      {/* 操作按钮 */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );

  // 如果启用动画，包装 motion 组件
  if (animated) {
    return (
      <motion.div
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

/**
 * 预设的空状态组件
 */

// 无数据状态
export const NoDataState: React.FC<Omit<EmptyStateProps, 'variant'> & { onAddClick?: () => void; addText?: string }> = ({ 
  onAddClick, 
  addText = "添加数据",
  ...props 
}) => (
  <EmptyState
    variant="noData"
    action={onAddClick && (
      <Button variant="default" onClick={onAddClick}>
        <Plus className="w-4 h-4 mr-2" />
        {addText}
      </Button>
    )}
    {...props}
  />
);

// 搜索无结果状态
export const SearchEmptyState: React.FC<Omit<EmptyStateProps, 'variant'> & { onClearSearch?: () => void }> = ({ 
  onClearSearch,
  ...props 
}) => (
  <EmptyState
    variant="searchEmpty"
    action={onClearSearch && (
      <Button variant="outline" onClick={onClearSearch}>
        清除搜索
      </Button>
    )}
    {...props}
  />
);

// 错误状态
export const ErrorState: React.FC<Omit<EmptyStateProps, 'variant'> & { onRetry?: () => void; retryText?: string }> = ({ 
  onRetry,
  retryText = "重试",
  ...props 
}) => (
  <EmptyState
    variant="error"
    action={onRetry && (
      <Button variant="default" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        {retryText}
      </Button>
    )}
    {...props}
  />
);

// 筛选无结果状态
export const FilteredEmptyState: React.FC<Omit<EmptyStateProps, 'variant'> & { onClearFilters?: () => void }> = ({ 
  onClearFilters,
  ...props 
}) => (
  <EmptyState
    variant="filtered"
    action={onClearFilters && (
      <Button variant="outline" onClick={onClearFilters}>
        清除筛选
      </Button>
    )}
    {...props}
  />
);

// 离线状态
export const OfflineState: React.FC<Omit<EmptyStateProps, 'variant'> & { onRetry?: () => void }> = ({ 
  onRetry,
  ...props 
}) => (
  <EmptyState
    variant="offline"
    action={onRetry && (
      <Button variant="default" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        重新连接
      </Button>
    )}
    {...props}
  />
);

// 紧凑空状态 - 适用于卡片或小区域
export const CompactEmptyState: React.FC<EmptyStateProps> = (props) => (
  <EmptyState
    {...props}
    compact={true}
    iconSize="sm"
    animated={false}
  />
);