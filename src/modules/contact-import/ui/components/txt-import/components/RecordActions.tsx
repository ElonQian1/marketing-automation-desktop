// src/modules/contact-import/ui/components/txt-import/components/RecordActions.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

﻿import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { EyeOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover';
import { TxtImportRecordDto } from '../../../services/txtImportRecordService';

interface RecordActionsProps {
  record: TxtImportRecordDto;
  onDelete: (record: TxtImportRecordDto) => void;
  onArchive: (record: TxtImportRecordDto) => void;
  onViewError?: (record: TxtImportRecordDto) => void;
}

export const RecordActions: React.FC<RecordActionsProps> = ({ record, onDelete, onArchive, onViewError }) => {
  return (
    <Space size="small">
      {record.errorMessage && (
        <Tooltip title={record.errorMessage}>
          <Button size="small" icon={<EyeOutlined />} onClick={(e) => {
            e.stopPropagation();
            onViewError?.(record);
          }} />
        </Tooltip>
      )}
      <ConfirmPopover
        mode="default"
        title="删除确认"
        description={
          <div style={{ maxWidth: 250 }}>
            <p>请选择删除方式：</p>
            <ul style={{ paddingLeft: 16, marginBottom: 0, fontSize: '12px' }}>
              <li><strong>直接删除</strong>：仅移除记录</li>
              <li><strong>归档删除</strong>：重置相关号码为未导入</li>
            </ul>
          </div>
        }
        okText="直接删除"
        cancelText="取消"
        onConfirm={() => onDelete(record)}
        okButtonProps={{ danger: true }}
      >
        <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
      </ConfirmPopover>

      <ConfirmPopover
        mode="default"
        title="归档确认"
        description={`将删除记录并重置 "${record.fileName}" 相关的号码为未导入状态？`}
        okText="确认归档"
        cancelText="取消"
        onConfirm={() => onArchive(record)}
      >
        <Button size="small" icon={<InboxOutlined />} onClick={(e) => e.stopPropagation()} />
      </ConfirmPopover>
    </Space>
  );
};
