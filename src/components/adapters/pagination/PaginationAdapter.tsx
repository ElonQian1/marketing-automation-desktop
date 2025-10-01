import React from "react";
import { Pagination } from "antd";

type PaginationProps = React.ComponentProps<typeof Pagination>;

export interface PaginationAdapterProps extends Omit<PaginationProps, 'showTotal'> {
  /** 统一尺寸，默认 default */
  size?: "small" | "default";
  /** 是否显示页码跳转器，默认 true */
  showQuickJumper?: boolean;
  /** 是否显示页面大小选择器，默认 true */
  showSizeChanger?: boolean;
  /** 是否显示总数，默认 true */
  showTotal?: boolean | ((total: number, range: [number, number]) => React.ReactNode);
  /** 页面大小选择配置 */
  pageSizeOptions?: string[];
}

/**
 * Pagination 分页适配器
 */
export const PaginationAdapter: React.FC<PaginationAdapterProps> = ({ 
  size = "default",
  showQuickJumper = true,
  showSizeChanger = true,
  showTotal = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  ...rest 
}) => {
  const totalRenderer = showTotal === true 
    ? (total: number, range: [number, number]) => 
        `第 ${range[0]}-${range[1]} 项，共 ${total} 项`
    : showTotal === false 
    ? undefined 
    : showTotal;

  return (
    <Pagination
      size={size}
      showQuickJumper={showQuickJumper}
      showSizeChanger={showSizeChanger}
      showTotal={totalRenderer}
      pageSizeOptions={pageSizeOptions}
      {...rest}
    />
  );
};

export default PaginationAdapter;