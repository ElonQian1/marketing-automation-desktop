
/**
 * Table 适配器 - AntD 表格组件的品牌化包装器
 * 
 * 职责：
 * 1. 通过容器样式和配置统一 AntD Table 的外观
 * 2. 不覆写 .ant-table-* 内部样式，仅通过 ConfigProvider 和外层容器
 * 3. 提供统一的分页、排序、筛选等交互模式
 * 4. 集成设计令牌系统，确保品牌一致性
 * 
 * 使用方式：
 * <TableAdapter
 *   columns={columns}
 *   dataSource={data}
 *   brandTheme="modern"
 * />
 */

import React from "react";
import { Table, ConfigProvider, theme, type TableProps } from "antd";
import { motion } from "framer-motion";
import { cn } from "../../ui/utils";
import { fadeVariants, slideVariants } from "../../ui/motion";

/**
 * 表格适配器的扩展属性
 */
export interface TableAdapterProps extends Omit<TableProps<any>, 'title'> {
  /** 品牌主题变体 */
  brandTheme?: "default" | "modern" | "minimal";
  /** 是否启用入场动画 */
  animated?: boolean;
  /** 动画方向 */
  animationDirection?: "fade" | "slideUp" | "slideDown";
  /** 是否显示品牌化的空状态 */
  showBrandedEmpty?: boolean;
  /** 容器类名 */
  containerClassName?: string;
  /** 表格标题（适配器级别，区别于AntD原生title） */
  title?: React.ReactNode;
  /** 表格描述 */
  description?: React.ReactNode;
}

/**
 * 品牌化表格主题配置
 */
const getBrandedTableTheme = (brandTheme: string) => {
  const baseTheme = {
    algorithm: [theme.darkAlgorithm],
    token: {
      // 从 CSS 变量读取品牌色彩
      colorPrimary: 'var(--brand)',
      colorBgContainer: 'var(--bg-elevated)',
      colorText: 'var(--text-1)',
      colorTextSecondary: 'var(--text-2)',
      colorBorder: 'var(--border-primary)',
      borderRadius: parseInt('var(--radius)') || 12,
      
      // 现代化字体
      fontFamily: 'var(--font-family)',
      fontSize: parseInt('var(--font)') || 16,
    },
    components: {
      Table: {
        // 统一的表格样式，不覆盖内部实现
        borderRadiusLG: parseInt('var(--radius-lg)') || 16,
        headerBg: 'var(--bg-secondary)',
        headerColor: 'var(--text-1)',
        rowHoverBg: 'var(--bg-tertiary)', 
        padding: parseInt('var(--space-4)') || 16,
        paddingSM: parseInt('var(--space-3)') || 12,
        
        // 品牌化的分页样式
        paginationPadding: parseInt('var(--space-6)') || 24,
      },
    },
  };

  // 根据主题变体调整样式
  switch (brandTheme) {
    case "modern":
      return {
        ...baseTheme,
        token: {
          ...baseTheme.token,
          // 更强的阴影效果
          boxShadow: 'var(--shadow-lg)',
          // 更大的圆角
          borderRadius: parseInt('var(--radius-lg)') || 16,
        },
      };
      
    case "minimal":
      return {
        ...baseTheme,
        token: {
          ...baseTheme.token,
          // 移除阴影
          boxShadow: 'none',
          // 更细的边框
          lineWidth: 1,
        },
      };
      
    default:
      return baseTheme;
  }
};

/**
 * 品牌化空状态组件
 */
const BrandedEmpty: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-16 h-16 mb-4 bg-background-secondary rounded-full flex items-center justify-center">
      <svg
        className="w-8 h-8 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <h3 className="text-text-primary font-medium mb-1">暂无数据</h3>
    <p className="text-text-muted text-sm">当前没有可显示的记录</p>
  </div>
);

/**
 * Table 适配器组件
 */
export const TableAdapter: React.FC<TableAdapterProps> = ({
  brandTheme = "default",
  animated = true,
  animationDirection = "slideUp",
  showBrandedEmpty = true,
  containerClassName,
  title,
  description,
  className,
  ...tableProps
}) => {
  // 获取品牌化主题配置
  const brandedTheme = getBrandedTableTheme(brandTheme);
  
  // 选择动画变体
  const getAnimationVariant = () => {
    switch (animationDirection) {
      case "slideUp":
        return slideVariants.fromBottom;
      case "slideDown":
        return slideVariants.fromTop;
      case "fade":
      default:
        return fadeVariants;
    }
  };

  // 表格内容
  const tableContent = (
    <ConfigProvider theme={brandedTheme}>
      <Table
        {...tableProps}
        className={cn(
          // 品牌化容器样式 - 不覆盖 antd 内部
          "brand-table-container",
          className
        )}
        locale={{
          emptyText: showBrandedEmpty ? <BrandedEmpty /> : undefined,
        }}
        pagination={
          tableProps.pagination === false ? false : {
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
            ...tableProps.pagination,
          }
        }
      />
    </ConfigProvider>
  );

  // 容器组件
  const TableContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      className={cn(
        // 统一的容器样式
        "bg-background-elevated rounded-lg border border-border-primary shadow-sm overflow-hidden",
        // 品牌化间距
        brandTheme === "minimal" ? "p-0" : "p-1",
        containerClassName
      )}
    >
      {/* 表格头部信息 */}
      {(title || description) && (
        <div className="px-6 py-4 border-b border-border-primary">
          {title && (
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-text-muted">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* 表格内容 */}
      {children}
    </div>
  );

  // 如果启用动画，包装 motion 组件
  if (animated) {
    return (
      <motion.div
        variants={getAnimationVariant()}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <TableContainer>
          {tableContent}
        </TableContainer>
      </motion.div>
    );
  }

  return (
    <TableContainer>
      {tableContent}
    </TableContainer>
  );
};

/**
 * 专用的数据表格适配器 - 预配置的常用设置
 */
export const DataTableAdapter: React.FC<TableAdapterProps> = (props) => (
  <TableAdapter
    brandTheme="modern"
    animated={true}
    animationDirection="slideUp" 
    showBrandedEmpty={true}
    scroll={{ x: 800 }} // 默认横向滚动
    {...props}
  />
);

/**
 * 紧凑型表格适配器 - 适用于仪表板等密集场景
 */
export const CompactTableAdapter: React.FC<TableAdapterProps> = (props) => (
  <TableAdapter
    brandTheme="minimal"
    animated={false}
    size="small"
    showBrandedEmpty={false}
    {...props}
  />
);