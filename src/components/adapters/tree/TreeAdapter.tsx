// src/components/adapters/tree/TreeAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Tree, type TreeProps } from "antd";

export interface TreeAdapterProps extends TreeProps {
  /** 统一尺寸（影响节点字体/间距，依赖全局 tokens），默认 middle */
  size?: "small" | "middle" | "large";
  /** 固定高度时开启虚拟滚动 */
  height?: number;
}

export const TreeAdapter: React.FC<TreeAdapterProps> = ({
  size = "middle",
  height,
  virtual,
  ...rest
}) => {
  // 提示：尺寸通过全局 tokens 与容器 class 控制，不在此处注入 className
  return <Tree height={height} virtual={virtual ?? Boolean(height)} {...rest} />;
};

export default TreeAdapter;
