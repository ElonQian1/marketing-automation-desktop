import React from "react";
import { Drawer, type DrawerProps } from "antd";

export interface DrawerAdapterProps extends DrawerProps {
  /** 统一尺寸（宽度），优先 width，默认 480 */
  width?: number | string;
  /** 统一放置位置，默认 right */
  placement?: DrawerProps["placement"];
}

export const DrawerAdapter: React.FC<DrawerAdapterProps> = ({
  width = 480,
  placement = "right",
  maskClosable = true,
  destroyOnClose = true,
  ...rest
}) => {
  return (
    <Drawer
      width={width}
      placement={placement}
      maskClosable={maskClosable}
      destroyOnClose={destroyOnClose}
      {...rest}
    />
  );
};

export default DrawerAdapter;
