// src/components/adapters/input-number/InputNumberAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { InputNumber } from "antd";

type InputNumberProps = React.ComponentProps<typeof InputNumber>;

export interface InputNumberAdapterProps extends InputNumberProps {
  /** 统一尺寸，默认 middle */
  size?: "small" | "middle" | "large";
}

/**
 * InputNumber 数值输入框适配器
 */
export const InputNumberAdapter: React.FC<InputNumberAdapterProps> = ({ 
  size = "middle",
  controls = true,
  ...rest 
}) => {
  return <InputNumber size={size} controls={controls} {...rest} />;
};

export default InputNumberAdapter;