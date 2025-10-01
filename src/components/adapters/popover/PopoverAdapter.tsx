import React from "react";
import { Popover } from "antd";

type BasePopoverProps = React.ComponentProps<typeof Popover>;

export interface PopoverAdapterProps extends Omit<BasePopoverProps, 'trigger'> {
  /** 弹出位置，默认 top */
  placement?: BasePopoverProps['placement'];
  /** 触发行为，默认 hover */
  trigger?: BasePopoverProps['trigger'];
  /** 显示箭头，默认 true */
  arrow?: boolean | { pointAtCenter: boolean };
}

/**
 * Popover 弹出框适配器
 */
export const PopoverAdapter: React.FC<PopoverAdapterProps> = ({ 
  placement = "top",
  trigger = 'hover',
  arrow = true,
  ...rest 
}) => {
  return (
    <Popover
      placement={placement}
      trigger={trigger}
      arrow={arrow}
      {...rest}
    />
  );
};

export default PopoverAdapter;