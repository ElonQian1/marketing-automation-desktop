// src/components/adapters/select/SelectAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Select } from "antd";

type SelectProps = React.ComponentProps<typeof Select>;
type OptionProps = React.ComponentProps<typeof Select.Option>;

export interface SelectAdapterProps extends SelectProps {
  /** 统一尺寸，默认 middle */
  size?: "small" | "middle" | "large";
  /** 是否允许清除，默认 true */
  allowClear?: boolean;
  /** 占位符文本 */
  placeholder?: string;
}

export interface OptionAdapterProps extends OptionProps {
  /** 选项值 */
  value?: string | number;
  /** 选项标签 */
  label?: React.ReactNode;
}

/**
 * Select 选择器适配器
 */
export const SelectAdapter: React.FC<SelectAdapterProps> = ({ 
  size = "middle",
  allowClear = true,
  placeholder = "请选择",
  ...rest 
}) => {
  return (
    <Select 
      size={size} 
      allowClear={allowClear} 
      placeholder={placeholder}
      {...rest} 
    />
  );
};

/**
 * Option 选项适配器
 */
export const OptionAdapter: React.FC<OptionAdapterProps> = (props) => {
  return <Select.Option {...props} />;
};

/**
 * OptGroup 选项组适配器
 */
export const OptGroupAdapter: React.FC<React.ComponentProps<typeof Select.OptGroup>> = (props) => {
  return <Select.OptGroup {...props} />;
};

export default SelectAdapter;