// src/components/adapters/checkbox/CheckboxAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Checkbox } from "antd";

type CheckboxProps = React.ComponentProps<typeof Checkbox>;
type CheckboxGroupProps = React.ComponentProps<typeof Checkbox.Group>;

export interface CheckboxAdapterProps extends CheckboxProps {
  /** 统一尺寸，默认 middle */
  size?: "small" | "middle" | "large";
}

export interface CheckboxGroupAdapterProps extends CheckboxGroupProps {
  /** 统一尺寸，默认 middle */
  size?: "small" | "middle" | "large";
}

/**
 * Checkbox 复选框适配器
 */
export const CheckboxAdapter: React.FC<CheckboxAdapterProps> = ({ 
  size = "middle", 
  ...rest 
}) => {
  return <Checkbox {...rest} />;
};

/**
 * CheckboxGroup 复选框组适配器
 */
export const CheckboxGroupAdapter: React.FC<CheckboxGroupAdapterProps> = ({ 
  size = "middle", 
  ...rest 
}) => {
  return <Checkbox.Group {...rest} />;
};

export default CheckboxAdapter;