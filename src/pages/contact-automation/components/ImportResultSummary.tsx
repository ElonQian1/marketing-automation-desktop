import React from 'react';
import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';

export interface VcfImportResult {
  importedContacts: number;
  failedContacts?: number;
  fileName?: string;
}

export interface ImportResultSummaryProps {
  result: VcfImportResult;
}

export const ImportResultSummary: React.FC<ImportResultSummaryProps> = ({ result }) => {
  const imported = result.importedContacts ?? 0;
  const failed = result.failedContacts ?? 0;

  return (
    <Card
      title={
        <Space size={8} align="center">
          <FileAddOutlined />
          <Typography.Text strong>导入结果</Typography.Text>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card size="small">
            <Statistic title="成功导入" value={imported} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card size="small">
            <Statistic title="失败" value={failed} />
          </Card>
        </Col>
        {result.fileName && (
          <Col xs={24} md={24} lg={8}>
            <Card size="small">
              <Statistic title="文件" value={result.fileName} />
            </Card>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default ImportResultSummary;
