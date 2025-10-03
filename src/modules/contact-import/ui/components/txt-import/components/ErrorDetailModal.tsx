import React from 'react';
import { Modal, Typography, Space, Button, message } from 'antd';
import { TxtImportRecordDto } from '../../../services/txtImportRecordService';

const { Paragraph, Text } = Typography;

interface ErrorDetailModalProps {
  open: boolean;
  record?: TxtImportRecordDto | null;
  onClose: () => void;
}

export const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ open, record, onClose }) => {
  const textToCopy = record ? JSON.stringify({
    id: record.id,
    file_name: record.file_name,
    file_path: record.file_path,
    status: record.status,
    totals: {
      total: record.total_numbers,
      imported: record.imported_numbers,
      duplicate: record.duplicate_numbers,
    },
    created_at: record.created_at,
    error_message: record.error_message,
  }, null, 2) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      message.success('已复制错误详情到剪贴板');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };
  return (
    <Modal
      className="light-theme-force"
      title={record ? `错误详情 - ${record.file_name}` : '错误详情'}
      open={open}
      onCancel={onClose}
      footer={[
        record ? (
          <Button key="copy" size="small" onClick={handleCopy}>复制</Button>
        ) : null,
        <Button key="ok" type="primary" onClick={onClose}>关闭</Button>,
      ]}
    >
      {!record ? (
        <Text>暂无错误详情</Text>
      ) : (
        <div>
          <Paragraph>
            <Text type="secondary">基本信息：</Text>
          </Paragraph>
          <div className="light-theme-force" style={{ background: 'var(--bg-light-secondary, #f1f5f9)', padding: 8, borderRadius: 6 }}>
            <pre style={{ margin: 0, fontSize: 12 }}>
              {textToCopy}
            </pre>
          </div>

          <Paragraph style={{ marginTop: 12 }}>
            <Text type="secondary">错误信息：</Text>
          </Paragraph>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {record.error_message || '（空）'}
          </Paragraph>
        </div>
      )}
    </Modal>
  );
};

export default ErrorDetailModal;
