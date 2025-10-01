
/**
 * HeaderBar - 高曝光页面头部栏组件
 * 
 * 职责：
 * 1. 提供统一的页面头部布局和导航
 * 2. 集成面包屑、标题、描述、操作按钮等元素
 * 3. 响应式设计，支持不同屏幕尺寸
 * 4. 品牌化的视觉设计和交互动画
 * 
 * 使用场景：
 * - 页面主标题栏
 * - 功能模块的导航头
 * - 数据管理界面的操作工具栏
 * 
 * 使用方式：
 * <HeaderBar
 *   title="员工管理"
 *   description="管理和维护员工信息"
 *   breadcrumb={[
 *     { label: "首页", href: "/" },
 *     { label: "员工管理" }
 *   ]}
 *   actions={<Button>添加员工</Button>}
 * />
 */

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button/Button";
import { fadeVariants, slideVariants } from "../../ui/motion";

/**
 * 面包屑项配置
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

/**
 * 头部栏属性
 */
export interface HeaderBarProps {
  /** 页面标题 */
  title: string;
  /** 页面描述 */
  description?: string;
  /** 副标题 */
  subtitle?: string;
  /** 面包屑导航 */
  breadcrumb?: BreadcrumbItem[];
  /** 右侧操作区域 */
  actions?: React.ReactNode;
  /** 左侧额外内容 */
  leftContent?: React.ReactNode;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 返回按钮点击事件 */
  onBack?: () => void;
  /** 返回按钮文本 */
  backText?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否启用动画 */
  animated?: boolean;
  /** 背景变体 */
  variant?: "default" | "gradient" | "minimal";
  /** 容器类名 */
  className?: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 是否粘性定位 */
  sticky?: boolean;
}

/**
 * 面包屑组件
 */
const Breadcrumb: React.FC<{ items: BreadcrumbItem[]; compact?: boolean }> = ({ 
  items, 
  compact 
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
          )}
          
          {item.href || item.onClick ? (
            <button
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors truncate",
                index === items.length - 1 && "text-text-primary font-medium"
              )}
            >
              {item.icon}
              <span className={compact ? "hidden sm:inline" : ""}>
                {item.label}
              </span>
            </button>
          ) : (
            <span className={cn(
              "flex items-center gap-1 text-text-primary font-medium truncate"
            )}>
              {item.icon}
              <span className={compact ? "hidden sm:inline" : ""}>
                {item.label}
              </span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * HeaderBar 组件
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  description,
  subtitle,
  breadcrumb,
  actions,
  leftContent,
  showBack,
  onBack,
  backText = "返回",
  compact = false,
  animated = true,
  variant = "default",
  className,
  icon,
  sticky = false,
}) => {
  // 获取背景样式
  const getVariantStyles = () => {
    switch (variant) {
      case "gradient":
        return "bg-gradient-to-r from-brand/5 via-brand/10 to-transparent border-b border-border-primary/50";
      case "minimal":
        return "bg-transparent";
      default:
        return "bg-background-elevated border-b border-border-primary";
    }
  };

  // 头部内容
  const headerContent = (
    <div className={cn(
      "w-full",
      getVariantStyles(),
      sticky && "sticky top-0 z-30 backdrop-blur-sm",
      compact ? "px-4 py-3" : "px-6 py-4",
      className
    )}>
      {/* 面包屑导航 */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-3">
          <Breadcrumb items={breadcrumb} compact={compact} />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* 左侧内容区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* 返回按钮 */}
            {showBack && (
              <Button
                variant="ghost"
                size={compact ? "sm" : "default"}
                onClick={onBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{backText}</span>
              </Button>
            )}
            
            {/* 自定义左侧内容 */}
            {leftContent}
            
            {/* 页面图标 */}
            {icon && (
              <div className="flex items-center justify-center w-10 h-10 bg-brand/10 rounded-lg shrink-0">
                {icon}
              </div>
            )}
          </div>

          {/* 标题和描述 */}
          <div>
            <div className="flex items-baseline gap-3 mb-1">
              <h1 className={cn(
                "font-bold text-text-primary truncate",
                compact ? "text-lg" : "text-2xl"
              )}>
                {title}
              </h1>
              
              {subtitle && (
                <span className={cn(
                  "text-text-muted font-medium",
                  compact ? "text-sm" : "text-base"
                )}>
                  {subtitle}
                </span>
              )}
            </div>
            
            {description && !compact && (
              <p className="text-text-muted max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* 右侧操作区 */}
        {actions && (
          <div className="shrink-0">
            <div className={cn(
              "flex items-center gap-2",
              compact ? "flex-col sm:flex-row" : ""
            )}>
              {actions}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 如果启用动画，包装 motion 组件
  if (animated) {
    return (
      <motion.header
        variants={slideVariants.fromTop}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {headerContent}
      </motion.header>
    );
  }

  return <header>{headerContent}</header>;
};

/**
 * 紧凑型头部栏 - 适用于空间有限的场景
 */
export const CompactHeaderBar: React.FC<HeaderBarProps> = (props) => (
  <HeaderBar
    {...props}
    compact={true}
    animated={false}
  />
);

/**
 * 渐变头部栏 - 适用于着陆页和展示性页面
 */
export const GradientHeaderBar: React.FC<HeaderBarProps> = (props) => (
  <HeaderBar
    {...props}
    variant="gradient"
    animated={true}
  />
);

/**
 * 粘性头部栏 - 滚动时保持在顶部
 */
export const StickyHeaderBar: React.FC<HeaderBarProps> = (props) => (
  <HeaderBar
    {...props}
    sticky={true}
    compact={true}
  />
);

/**
 * 简单页面头部 - 仅包含标题和操作
 */
export const SimplePageHeader: React.FC<Pick<HeaderBarProps, 'title' | 'actions' | 'className'>> = ({
  title,
  actions,
  className,
}) => (
  <HeaderBar
    title={title}
    actions={actions}
    className={className}
    variant="minimal"
    compact={true}
  />
);