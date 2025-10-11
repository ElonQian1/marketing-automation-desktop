// src/components/adapters/upload/UploadAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { Upload, Button, type UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export interface UploadAdapterProps extends UploadProps {
  /**
   * 统一尺寸，默认 middle
   * 注意：AntD Upload 无 size 属性，此处仅影响触发按钮尺寸
   */
  size?: "small" | "middle" | "large";
  /** 触发按钮文案，默认：上传文件 */
  buttonText?: string;
  /** 自定义触发按钮（完全接管触发区） */
  trigger?: React.ReactNode;
}

export const UploadAdapter: React.FC<UploadAdapterProps> = ({
  size = "middle",
  buttonText = "上传文件",
  trigger,
  showUploadList = true,
  ...rest
}) => {
  const triggerNode =
    trigger ?? (
      <Button size={size} icon={<UploadOutlined />}> 
        {buttonText}
      </Button>
    );

  return (
    <Upload showUploadList={showUploadList} {...rest}>
      {triggerNode}
    </Upload>
  );
};

export default UploadAdapter;
