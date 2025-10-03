import React from 'react';
import { Modal, Space, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { TxtImportRecordDto } from '../../../services/txtImportRecordService';

export function confirmBulkDelete(
  selectedRecords: TxtImportRecordDto[],
  onConfirmDelete: () => void,
  onConfirmArchive: () => void,
) {
  return Modal.confirm({
    title: `批量删除确认`,
    icon: <ExclamationCircleOutlined />,
    content: (
      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
        <p>将删除以下 {selectedRecords.length} 个导入记录：</p>
        <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
          {selectedRecords.slice(0, 5).map((record) => (
            <li key={record.id}>
              {record.fileName} ({record.importedNumbers} 个号码)
            </li>
          ))}
          {selectedRecords.length > 5 && (
            <li>... 另外 {selectedRecords.length - 5} 个记录</li>
          )}
        </ul>
        <p style={{ marginBottom: 0 }}>请选择删除方式：</p>
        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li><strong>直接删除</strong>：仅移除记录，保留号码当前状态。</li>
          <li><strong>号码归档</strong>：将相关号码恢复为未导入并释放批次占用。</li>
        </ul>
      </div>
    ),
    okButtonProps: { style: { display: 'none' } },
    cancelButtonProps: { style: { display: 'none' } },
    footer: () => (
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={() => Modal.destroyAll()}>取消</Button>
        <Button
          danger
          onClick={() => {
            Modal.destroyAll();
            onConfirmDelete();
          }}
        >
          直接删除
        </Button>
        <Button
          type="primary"
          onClick={() => {
            Modal.destroyAll();
            onConfirmArchive();
          }}
        >
          号码归档后删除
        </Button>
      </Space>
    ),
  });
}
