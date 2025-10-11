// src/components/adapters/tooltip/TooltipAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Tooltip } from "antd";

type BaseTooltipProps = React.ComponentProps<typeof Tooltip>;

export interface TooltipAdapterProps extends Omit<BaseTooltipProps, 'trigger'> {
  /** 提示位置，默认 top */
  placement?: BaseTooltipProps['placement'];
  /** 鼠标移入后延时多少才显示，默认 0.1s */
  mouseEnterDelay?: number;
  /** 鼠标移出后延时多少才隐藏，默认 0.1s */
  mouseLeaveDelay?: number;
  /** 触发行为，默认 hover */
  trigger?: BaseTooltipProps['trigger'];
}

/**
 * Tooltip 工具提示适配器
 */
export const TooltipAdapter: React.FC<TooltipAdapterProps> = ({ 
  placement = "top",
  mouseEnterDelay = 0.1,
  mouseLeaveDelay = 0.1,
  trigger = 'hover',
  ...rest 
}) => {
  return (
    <Tooltip
      placement={placement}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      trigger={trigger}
      {...rest}
    />
  );
};

export default TooltipAdapter;