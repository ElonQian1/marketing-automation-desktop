import React from 'react';
import { Space, Typography, Button, Divider } from 'antd';
import { FileTextOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { SourceFolderAddButton } from '../SourceFolderAddButton';
import { SourceFoldersList } from '../SourceFoldersList';

const { Text } = Typography;

interface TxtImportPanelProps {
  folders: string[];
  hasItems: boolean;
  onImportTxt: () => void;
  onImportFolder: () => void;
  onAddFolder: (folder: string) => void;
  onRemoveFolder: (folder: string) => void;
  onClearAll: () => void;
  onImportFromSavedFolders: () => void;
}

export const TxtImportPanel: React.FC<TxtImportPanelProps> = ({
  folders,
  hasItems,
  onImportTxt,
  onImportFolder,
  onAddFolder,
  onRemoveFolder,
  onClearAll,
  onImportFromSavedFolders,
}) => {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">支持单个 TXT 或TXT文件夹，自动提取手机号码并去重入库</Text>
        
        <Space wrap>
          <Button icon={<FileTextOutlined />} onClick={onImportTxt}>
            导入TXT文件
          </Button>
          <Button icon={<FolderOpenOutlined />} onClick={onImportFolder}>
            导入文件夹
          </Button>
          <SourceFolderAddButton onAdded={onAddFolder} />
          <Button onClick={onImportFromSavedFolders} disabled={!hasItems}>
            从已保存目录导入
          </Button>
        </Space>

        <Divider style={{ margin: '12px 0' }} />
        
        <SourceFoldersList 
          folders={folders} 
          onRemove={onRemoveFolder} 
          onClearAll={onClearAll} 
        />
      </Space>
    </div>
  );
};