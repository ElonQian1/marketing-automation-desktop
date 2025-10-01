
/**
 * FilterBar - 高曝光筛选栏组件
 * 
 * 职责：
 * 1. 提供统一的数据筛选交互界面
 * 2. 支持搜索、分类、状态、日期范围等常见筛选项
 * 3. 集成品牌化的视觉设计和交互动画
 * 4. 响应式布局，适配不同屏幕尺寸
 * 
 * 使用场景：
 * - 数据表格的筛选工具栏
 * - 内容列表的过滤器
 * - 仪表板的数据筛选面板
 * 
 * 使用方式：
 * <FilterBar
 *   searchPlaceholder="搜索员工..."
 *   onSearch={handleSearch}
 *   filters={filterConfig}
 *   onFilterChange={handleFilterChange}
 * />
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";
import { fadeVariants, slideVariants } from "../../ui/motion";

/**
 * 筛选器配置接口
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multiSelect" | "dateRange" | "range" | "toggle";
  options?: { label: string; value: any }[];
  placeholder?: string;
  defaultValue?: any;
}

/**
 * 筛选栏属性
 */
export interface FilterBarProps {
  /** 搜索框占位符 */
  searchPlaceholder?: string;
  /** 搜索值 */
  searchValue?: string;
  /** 搜索回调 */
  onSearch?: (value: string) => void;
  /** 筛选器配置 */
  filters?: FilterConfig[];
  /** 筛选值 */
  filterValues?: Record<string, any>;
  /** 筛选变更回调 */
  onFilterChange?: (key: string, value: any) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 容器类名 */
  className?: string;
  /** 是否启用动画 */
  animated?: boolean;
  /** 自定义操作区域 */
  actions?: React.ReactNode;
}

/**
 * 筛选项组件
 */
const FilterItem: React.FC<{
  config: FilterConfig;
  value?: any;
  onChange?: (value: any) => void;
  compact?: boolean;
}> = ({ config, value, onChange, compact }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedValue: any) => {
    if (config.type === "multiSelect") {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter(v => v !== selectedValue)
        : [...currentValues, selectedValue];
      onChange?.(newValues);
    } else {
      onChange?.(selectedValue);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (!value) return config.placeholder || config.label;
    
    if (config.type === "multiSelect") {
      const count = Array.isArray(value) ? value.length : 0;
      return count > 0 ? `${config.label} (${count})` : config.placeholder || config.label;
    }
    
    const option = config.options?.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const hasValue = config.type === "multiSelect" 
    ? Array.isArray(value) && value.length > 0
    : value !== undefined && value !== null && value !== '';

  if (config.type === "toggle") {
    return (
      <Button
        variant={value ? "default" : "outline"}
        size={compact ? "sm" : "default"}
        onClick={() => onChange?.(!value)}
        className="relative"
      >
        {config.label}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "justify-between min-w-[120px] relative",
          hasValue && "border-brand text-brand",
          isOpen && "border-brand"
        )}
      >
        <span className="truncate">{getDisplayValue()}</span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform shrink-0",
            isOpen && "rotate-180"
          )}
        />
        {hasValue && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand rounded-full" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* 下拉菜单 */}
            <motion.div
              className="absolute top-full left-0 mt-2 min-w-[200px] bg-background-elevated border border-border-primary rounded-lg shadow-lg z-50 py-2 max-h-[240px] overflow-y-auto"
              variants={slideVariants.fromTop}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {config.options?.map((option) => {
                const isSelected = config.type === "multiSelect" 
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-background-secondary transition-colors text-sm",
                      isSelected && "bg-background-secondary text-brand font-medium"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {isSelected && config.type === "multiSelect" && (
                        <div className="w-4 h-4 bg-brand rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              
              {(!config.options || config.options.length === 0) && (
                <div className="px-3 py-2 text-text-muted text-sm">
                  暂无选项
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * FilterBar 组件
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = "搜索...",
  searchValue = "",
  onSearch,
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  showReset = true,
  compact = false,
  className,
  animated = true,
  actions,
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    onSearch?.(value);
  };

  const handleClearSearch = () => {
    setLocalSearchValue("");
    onSearch?.("");
  };

  const hasActiveFilters = Object.values(filterValues).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });

  const handleReset = () => {
    setLocalSearchValue("");
    onReset?.();
  };

  const content = (
    <Card 
      variant="flat" 
      className={cn(
        "border-0 shadow-sm",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {/* 搜索栏 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={localSearchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className={cn(
                "w-full pl-10 pr-10 bg-background-input border border-border-primary rounded-lg text-text-primary placeholder-text-muted transition-colors focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20",
                compact ? "py-2 text-sm" : "py-3"
              )}
            />
            {localSearchValue && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {actions}
        </div>

        {/* 筛选器 */}
        {filters.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-text-muted">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">筛选</span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {filters.map((filter) => (
                <FilterItem
                  key={filter.key}
                  config={filter}
                  value={filterValues[filter.key]}
                  onChange={(value) => onFilterChange?.(filter.key, value)}
                  compact={compact}
                />
              ))}
            </div>

            {/* 重置按钮 */}
            {showReset && hasActiveFilters && (
              <Button
                variant="ghost"
                size={compact ? "sm" : "default"}
                onClick={handleReset}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4 mr-1" />
                重置
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  if (animated) {
    return (
      <motion.div
        variants={slideVariants.fromTop}
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
 * 紧凑型筛选栏 - 适用于空间有限的场景
 */
export const CompactFilterBar: React.FC<FilterBarProps> = (props) => (
  <FilterBar
    {...props}
    compact={true}
    animated={false}
  />
);

/**
 * 简单搜索栏 - 仅包含搜索功能
 */
export const SimpleSearchBar: React.FC<Pick<FilterBarProps, 'searchPlaceholder' | 'searchValue' | 'onSearch' | 'className' | 'actions'>> = ({
  searchPlaceholder,
  searchValue,
  onSearch,
  className,
  actions,
}) => (
  <FilterBar
    searchPlaceholder={searchPlaceholder}
    searchValue={searchValue}
    onSearch={onSearch}
    filters={[]}
    className={className}
    actions={actions}
    showReset={false}
  />
);