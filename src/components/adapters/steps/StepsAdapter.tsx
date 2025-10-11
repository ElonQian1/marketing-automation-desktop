// src/components/adapters/steps/StepsAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Steps } from "antd";

type StepsProps = React.ComponentProps<typeof Steps>;

export interface StepsAdapterProps extends Omit<StepsProps, 'size'> {
  /** 统一密度：默认 middle；会映射到 AntD 的 size（small/default） */
  density?: "small" | "middle" | "large";
}

export const StepsAdapter: React.FC<StepsAdapterProps> = ({ density = "middle", progressDot, ...rest }) => {
  // 将自定义 density 映射为 AntD Steps 的 size
  const antSize: StepsProps['size'] = density === 'large' ? 'default' : 'small';
  // 非 large 使用 progressDot 表现更紧凑；如显式传入则不覆盖
  const finalProgressDot = progressDot ?? (density !== "large" ? true : undefined);
  return <Steps size={antSize} progressDot={finalProgressDot} {...rest} />;
};

export default StepsAdapter;
