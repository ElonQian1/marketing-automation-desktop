import React from "react";
import { Steps, type StepsProps } from "antd";

export interface StepsAdapterProps extends StepsProps {
  /** 统一尺寸，默认 middle（映射为小号点/紧凑间距） */
  size?: "small" | "middle" | "large";
}

export const StepsAdapter: React.FC<StepsAdapterProps> = ({ size = "middle", progressDot, ...rest }) => {
  // 中间尺寸使用进度点表现更紧凑；如显式传入则不覆盖
  const finalProgressDot = progressDot ?? (size !== "large" ? true : undefined);
  return <Steps progressDot={finalProgressDot} {...rest} />;
};

export default StepsAdapter;
