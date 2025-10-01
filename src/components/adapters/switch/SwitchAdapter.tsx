import React from "react";
import { Switch } from "antd";

type SwitchProps = React.ComponentProps<typeof Switch>;

export interface SwitchAdapterProps extends SwitchProps {
  /** 统一尺寸，默认 default */
  size?: "small" | "default";
}

/**
 * Switch 开关适配器
 */
export const SwitchAdapter: React.FC<SwitchAdapterProps> = ({ 
  size = "default", 
  ...rest 
}) => {
  return <Switch size={size} {...rest} />;
};

export default SwitchAdapter;