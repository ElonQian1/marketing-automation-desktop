// src/components/adapters/radio/RadioAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Radio } from "antd";

type RadioProps = React.ComponentProps<typeof Radio>;
type RadioGroupProps = React.ComponentProps<typeof Radio.Group>;
type RadioButtonProps = React.ComponentProps<typeof Radio.Button>;

export interface RadioAdapterProps extends RadioProps {
  /** 统一尺寸，默认 middle */
  size?: "small" | "middle" | "large";
}

export interface RadioGroupAdapterProps extends RadioGroupProps {
  /** 统一尺寸，默认 middle */
  size?: "small" | "middle" | "large";
}

export interface RadioButtonAdapterProps extends RadioButtonProps {
  /** 统一尺寸，默认 middle */
  size?: "small" | "middle" | "large";
}

/**
 * Radio 单选框适配器
 */
export const RadioAdapter: React.FC<RadioAdapterProps> = ({ 
  size = "middle", 
  ...rest 
}) => {
  return <Radio {...rest} />;
};

/**
 * RadioGroup 单选框组适配器
 */
export const RadioGroupAdapter: React.FC<RadioGroupAdapterProps> = ({ 
  size = "middle", 
  ...rest 
}) => {
  return <Radio.Group size={size} {...rest} />;
};

/**
 * RadioButton 单选按钮适配器
 */
export const RadioButtonAdapter: React.FC<RadioButtonAdapterProps> = ({ 
  size = "middle", 
  ...rest 
}) => {
  return <Radio.Button {...rest} />;
};

export default RadioAdapter;