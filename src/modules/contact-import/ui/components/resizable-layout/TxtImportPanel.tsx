import React, { useState } from 'react';
import { Space, Typography, Button, Divider, Card } from 'antd';
import { FileTextOutlined, FolderOpenOutlined, HistoryOutlined, DatabaseOutlined } from '@ant-design/icons';
import { SourceFolderAddButton } from '../SourceFolderAddButton';
import { SourceFoldersList } from '../SourceFoldersList';
import { TxtImportRecordsManager } from '../TxtImportRecordsManager';

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
  onDataRefresh?: () => void;
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
  onDataRefresh,
}) => {
  const [recordsManagerVisible, setRecordsManagerVisible] = useState(false);

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 功能说明卡片 */}
        <Card 
          size="small" 
          style={{ 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #b3e5fc'
          }}
        >
          <Space>
            <DatabaseOutlined style={{ color: '#0ea5e9', fontSize: '16px' }} />
            <div>
              <Text strong style={{ color: '#0c4a6e' }}>TXT 号码池导入</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                支持单个TXT文件或文件夹批量导入，自动提取手机号码并去重入库
              </Text>
            </div>
          </Space>
        </Card>

        {/* 导入操作按钮 */}
        <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
          <Button 
            type="primary"
            icon={<FileTextOutlined />} 
            onClick={onImportTxt}
            style={{ minWidth: '120px' }}
          >
            导入TXT文件
          </Button>
          <Button 
            icon={<FolderOpenOutlined />} 
            onClick={onImportFolder}
            style={{ minWidth: '120px' }}
          >
            导入文件夹
          </Button>
        </Space>

        {/* 高级操作 */}
        <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
          <SourceFolderAddButton onAdded={onAddFolder} />
          <Button 
            onClick={onImportFromSavedFolders} 
            disabled={!hasItems}
            style={{ minWidth: '140px' }}
          >
            从已保存目录导入
          </Button>
          <Button 
            icon={<HistoryOutlined />}
            onClick={() => setRecordsManagerVisible(true)}
            style={{ minWidth: '120px' }}
          >
            导入记录
          </Button>
        </Space>

        <Divider style={{ margin: '8px 0' }} />
        
        {/* 文件夹列表 */}
        <SourceFoldersList 
          folders={folders} 
          onRemove={onRemoveFolder} 
          onClearAll={onClearAll} 
        />
      </Space>

      {/* 导入记录管理器 */}
      <TxtImportRecordsManager
        visible={recordsManagerVisible}
        onClose={() => setRecordsManagerVisible(false)}
        onDataRefresh={onDataRefresh}
      />
    </div>
  );
};