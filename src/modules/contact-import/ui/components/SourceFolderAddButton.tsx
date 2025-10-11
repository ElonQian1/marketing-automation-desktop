// src/modules/contact-import/ui/components/SourceFolderAddButton.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Button } from 'antd';
import { FolderAddOutlined } from '@ant-design/icons';
import { selectFolder } from '../utils/dialog';

interface Props {
  onAdded?: (dir: string) => void;
}

export const SourceFolderAddButton: React.FC<Props> = ({ onAdded }) => {
  const handleAdd = async () => {
    const dir = await selectFolder();
    if (dir) onAdded?.(dir);
  };
  return (
    <Button icon={<FolderAddOutlined />} onClick={handleAdd}>
      添加文件夹路径
    </Button>
  );
};

export default SourceFolderAddButton;
