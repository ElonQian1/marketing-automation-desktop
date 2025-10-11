// src/pages/contact-automation-sindre/components/AutomationResults.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { ThunderboltOutlined, FileAddOutlined, HeartOutlined } from '@ant-design/icons';

export interface CompleteFlowResult {
  importResult: { importedContacts: number };
  followResult: { totalFollowed: number };
}

export interface VcfImportResult {
  importedContacts: number;
}

export interface XiaohongshuFollowResult {
  totalFollowed: number;
}

export interface AutomationResultsProps {
  completeFlow?: CompleteFlowResult;
  vcfImport?: VcfImportResult;
  autoFollow?: XiaohongshuFollowResult;
}

export const AutomationResults: React.FC<AutomationResultsProps> = ({ completeFlow, vcfImport, autoFollow }) => {
  if (!completeFlow && !vcfImport && !autoFollow) return null;

  return (
    <Card title={<Typography.Text strong>自动化结果</Typography.Text>}>
      <Row gutter={[16, 16]}>
        {completeFlow && (
          <Col xs={24} md={12} lg={8}>
            <Card size="small" title={<><ThunderboltOutlined /> 完整流程</>}>
              <Statistic title="导入联系人" value={completeFlow.importResult.importedContacts} />
              <Statistic title="自动关注" value={completeFlow.followResult.totalFollowed} />
            </Card>
          </Col>
        )}

        {vcfImport && (
          <Col xs={24} md={12} lg={8}>
            <Card size="small" title={<><FileAddOutlined /> VCF 导入</>}>
              <Statistic title="导入联系人" value={vcfImport.importedContacts} />
            </Card>
          </Col>
        )}

        {autoFollow && (
          <Col xs={24} md={12} lg={8}>
            <Card size="small" title={<><HeartOutlined /> 自动关注</>}>
              <Statistic title="已关注用户" value={autoFollow.totalFollowed} />
            </Card>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default AutomationResults;
