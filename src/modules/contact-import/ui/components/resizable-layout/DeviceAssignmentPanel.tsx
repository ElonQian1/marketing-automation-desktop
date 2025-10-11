// src/modules/contact-import/ui/components/resizable-layout/DeviceAssignmentPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Space, Button, Divider, Typography, Alert } from 'antd';
import { DatabaseOutlined, FileTextOutlined, FolderOpenOutlined, FileDoneOutlined } from '@ant-design/icons';
import { DeviceAssignmentGrid } from '../DeviceAssignmentGrid/DeviceAssignmentGrid';
import StatsBar from '../StatsBar';
import ConflictNavigator from '../ConflictNavigator';
import { ContactNumberStatsDto } from '../../services/stats/contactStatsService';

const { Text } = Typography;

interface DeviceAssignmentPanelProps {
  stats: ContactNumberStatsDto | null;
  assignment: Record<string, { industry?: string; idStart?: number; idEnd?: number }>;
  rangeConflicts: any[];
  conflictDeviceIds: string[];
  conflictPeersByDevice: Record<string, { peerId: string; start: number; end: number; }[]>;
  currentJumpId: string | null;
  hasInvalidRanges: boolean;
  allRangesEmpty: boolean;
  onlyUnconsumed: boolean;
  onRefreshStats: () => void;
  onAssignmentChange: (assignment: Record<string, { industry?: string; idStart?: number; idEnd?: number }>) => void;
  onGenerateVcfForDevice: (deviceId: string) => void;
  onImportToDevice: (params: any) => void;
  onOpenSessions: (params: { deviceId: string; status?: string }) => void;
  onGenerateBatches: () => void;
  onTopLevelImportHint: () => void;
  onJumpToDevice: (deviceId: string) => void;
  onUnconsumedChange: (value: boolean) => void;
}

export const DeviceAssignmentPanel: React.FC<DeviceAssignmentPanelProps> = ({
  stats,
  assignment,
  rangeConflicts,
  conflictDeviceIds,
  conflictPeersByDevice,
  currentJumpId,
  hasInvalidRanges,
  allRangesEmpty,
  onlyUnconsumed,
  onRefreshStats,
  onAssignmentChange,
  onGenerateVcfForDevice,
  onImportToDevice,
  onOpenSessions,
  onGenerateBatches,
  onTopLevelImportHint,
  onJumpToDevice,
  onUnconsumedChange,
}) => {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <StatsBar stats={stats} onRefresh={onRefreshStats} />
      
      {rangeConflicts.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ margin: '8px 0' }}
          message={`发现 ${rangeConflicts.length} 处区间冲突`}
          description={
            <div>
              {rangeConflicts.slice(0, 5).map((c, i) => (
                <div key={i}>设备 {c.deviceA} [{c.rangeA.start}-{c.rangeA.end}] 与 设备 {c.deviceB} [{c.rangeB.start}-{c.rangeB.end}] 重叠</div>
              ))}
              {rangeConflicts.length > 5 && <div style={{ opacity: 0.7 }}>仅显示前5条</div>}
            </div>
          }
        />
      )}

      <Space wrap style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<FileDoneOutlined />} onClick={onTopLevelImportHint}>
          将所选号码生成VCF并导入设备（请在下方设备卡片执行）
        </Button>
      </Space>

      <Divider style={{ margin: '12px 0' }} />

      <ConflictNavigator 
        conflictIds={conflictDeviceIds} 
        currentTargetId={currentJumpId} 
        onJump={onJumpToDevice} 
      />

      <DeviceAssignmentGrid
        value={assignment}
        onChange={onAssignmentChange}
        conflictingDeviceIds={conflictDeviceIds}
        conflictPeersByDevice={conflictPeersByDevice}
        onGenerateVcf={onGenerateVcfForDevice}
        onImportToDevice={onImportToDevice}
        onOpenSessions={onOpenSessions}
      />

      <div style={{ 
        marginTop: 16, 
        padding: '12px 0',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <Button type="primary" onClick={onGenerateBatches} disabled={hasInvalidRanges || allRangesEmpty}>
          根据分配生成VCF批次
        </Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input 
            type="checkbox" 
            checked={onlyUnconsumed} 
            onChange={e => onUnconsumedChange(e.target.checked)} 
          />
          仅使用未消费号码
        </label>
        {hasInvalidRanges && <Text type="danger">存在非法区间（起始大于结束）</Text>}
        {allRangesEmpty && <Text type="secondary">请为至少一台设备设置有效区间</Text>}
      </div>
    </div>
  );
};