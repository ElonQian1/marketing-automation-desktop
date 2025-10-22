// src/modules/contact-import/ui/components/import-result-modal.tsx
// module: contact-import | layer: ui | role: 导入结果模态框
// summary: 显示导入成功/失败数量，提供操作反馈

import React from 'react';
import { Modal, Result, Space, Typography, Statistic, Row, Col, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MobileOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface ImportResult {
  deviceId: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  selectedFiles?: string[];
  errorMessage?: string;
}

export interface ImportResultModalProps {
  /** 是否显示模态框 */
  open: boolean;
  /** 导入结果 */
  result: ImportResult | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 查看详情回调（可选） */
  onViewDetails?: () => void;
}

/**
 * 导入结果模态框
 * 
 * 显示导入操作的结果统计：
 * - 成功数量
 * - 失败数量
 * - 总数量
 * - 目标设备
 */
export const ImportResultModal: React.FC<ImportResultModalProps> = ({
  open,
  result,
  onClose,
  onViewDetails,
}) => {
  if (!result) return null;

  const { deviceId, totalCount, successCount, failCount, selectedFiles, errorMessage } = result;
  const isSuccess = failCount === 0 && successCount > 0;
  const isPartialSuccess = successCount > 0 && failCount > 0;
  const isFailed = successCount === 0 && failCount > 0;

  // 成功率
  const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '0';

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={[
        onViewDetails && (
          <Button key="details" onClick={onViewDetails}>
            查看详情
          </Button>
        ),
        <Button key="close" type="primary" onClick={onClose}>
          确定
        </Button>,
      ]}
      width={600}
      centered
    >
      <Result
        status={
          isSuccess ? 'success' : isFailed ? 'error' : isPartialSuccess ? 'warning' : 'info'
        }
        title={
          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>
              {isSuccess && '导入成功'}
              {isFailed && '导入失败'}
              {isPartialSuccess && '部分导入成功'}
            </Title>
            <Space size={8}>
              <MobileOutlined />
              <Text type="secondary">设备: {deviceId}</Text>
            </Space>
          </Space>
        }
        subTitle={
          errorMessage && (
            <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
              {errorMessage}
            </Text>
          )
        }
        extra={
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* 统计卡片 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: '#f0f5ff',
                    borderRadius: '8px',
                  }}
                >
                  <Statistic
                    title="总数"
                    value={totalCount}
                    valueStyle={{ color: '#1890ff', fontSize: 28 }}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: '#f6ffed',
                    borderRadius: '8px',
                  }}
                >
                  <Statistic
                    title="成功"
                    value={successCount}
                    valueStyle={{ color: '#52c41a', fontSize: 28 }}
                    prefix={<CheckCircleOutlined />}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: failCount > 0 ? '#fff2e8' : '#fafafa',
                    borderRadius: '8px',
                  }}
                >
                  <Statistic
                    title="失败"
                    value={failCount}
                    valueStyle={{ color: failCount > 0 ? '#ff4d4f' : '#999', fontSize: 28 }}
                    prefix={failCount > 0 ? <CloseCircleOutlined /> : undefined}
                  />
                </div>
              </Col>
            </Row>

            {/* 成功率 */}
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                background: '#fafafa',
                borderRadius: '8px',
              }}
            >
              <Text type="secondary">成功率</Text>
              <Title level={4} style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
                {successRate}%
              </Title>
            </div>

            {/* 文件信息 */}
            {selectedFiles && selectedFiles.length > 0 && (
              <div
                style={{
                  padding: '12px',
                  background: '#fafafa',
                  borderRadius: '8px',
                }}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space size={8}>
                    <FileTextOutlined />
                    <Text strong>导入文件 ({selectedFiles.length})</Text>
                  </Space>
                  {selectedFiles.slice(0, 3).map((file, index) => (
                    <Text
                      key={index}
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      • {file.split(/[/\\]/).pop()}
                    </Text>
                  ))}
                  {selectedFiles.length > 3 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ... 还有 {selectedFiles.length - 3} 个文件
                    </Text>
                  )}
                </Space>
              </div>
            )}
          </Space>
        }
      />
    </Modal>
  );
};

export default ImportResultModal;
