import React from 'react';
import { Card, Space, Button, Divider } from 'antd';
import { 
  DatabaseOutlined, 
  FileTextOutlined, 
  FolderOpenOutlined, 
  MobileOutlined,
  LayoutOutlined 
} from '@ant-design/icons';

interface ContactNumberDto {
  id: number;
  number: string;
}

interface ContactNumberStatsDto {
  total: number;
  used: number;
  available: number;
}

interface DeviceAssignment {
  deviceId: string;
  ranges: Array<{
    start: number;
    end: number;
    industry?: string;
  }>;
}

interface WorkbenchPanelsProps {
  assignment: DeviceAssignment[];
  onAssignmentChange: (newAssignment: DeviceAssignment[]) => void;
  onGenerateVcf: (deviceId: string, params: any) => Promise<any>;
  onImportToDevice: (deviceId: string, params: any) => Promise<any>;
  numbers: ContactNumberDto[];
  numbersSearchQuery: string;
  onNumbersSearchChange: (query: string) => void;
  stats: ContactNumberStatsDto | null;
  sourceFolders: string[];
  onSourceFoldersChange: () => void;
  onImportFromFolders: (paths: string[]) => Promise<any>;
  onOpenBatchDrawer: () => void;
  onJumpToDevice: (deviceId: string) => void;
  onOpenColumnSettings: () => void;
}

export const WorkbenchPanels: React.FC<WorkbenchPanelsProps> = ({
  assignment,
  onAssignmentChange,
  onGenerateVcf,
  onImportToDevice,
  numbers,
  numbersSearchQuery,
  onNumbersSearchChange,
  stats,
  sourceFolders,
  onSourceFoldersChange,
  onImportFromFolders,
  onOpenBatchDrawer,
  onJumpToDevice,
  onOpenColumnSettings,
}) => {
  return (
    <div className="workbench-panels">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card
          title={
            <Space>
              <MobileOutlined />
              设备分配
            </Space>
          }
          size="small"
        >
          <div>
            <p>设备分配功能正在开发中...</p>
            <Button type="primary" onClick={() => onOpenColumnSettings()}>
              打开设置
            </Button>
          </div>
        </Card>

        <Card
          title={
            <Space>
              <DatabaseOutlined />
              号码管理
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <p>总数: {stats?.total || 0}</p>
              <p>已用: {stats?.used || 0}</p>
              <p>可用: {stats?.available || 0}</p>
            </div>
            <Button type="primary" onClick={onOpenBatchDrawer}>
              批量管理
            </Button>
          </Space>
        </Card>

        <Card
          title={
            <Space>
              <FolderOpenOutlined />
              文件夹管理
            </Space>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <p>已配置文件夹: {sourceFolders.length}</p>
            </div>
            <Space>
              <Button onClick={onSourceFoldersChange}>刷新文件夹</Button>
              <Button type="primary" onClick={() => onImportFromFolders(sourceFolders)}>
                从文件夹导入
              </Button>
            </Space>
          </Space>
        </Card>

        <Card
          title={
            <Space>
              <LayoutOutlined />
              快速操作
            </Space>
          }
          size="small"
        >
          <Space wrap>
            <Button icon={<FileTextOutlined />} onClick={() => console.log('导出功能')}>
              导出数据
            </Button>
            <Button icon={<DatabaseOutlined />} onClick={() => console.log('同步功能')}>
              同步状态
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default WorkbenchPanels;
export type { WorkbenchPanelsProps };
