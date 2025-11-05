// src/modules/structural-matching/ui/components/structural-xml-viewer.tsx
// module: structural-matching | layer: ui | role: XML快照查看器组件
// summary: 结构化匹配专用的XML快照查看器

import React from 'react';
import { Card, Alert, Space, Badge, Button } from 'antd';
import { CopyOutlined, FileTextOutlined } from '@ant-design/icons';
import type { StepCard } from '../../../../store/stepcards';

interface StructuralXmlViewerProps {
  stepCard: StepCard;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 结构化XML查看器 - 简化版本
 */
export const StructuralXmlViewer: React.FC<StructuralXmlViewerProps> = ({
  stepCard,
  className,
  style
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      console.log('XML已复制到剪贴板');
    });
  };

  if (!stepCard.xmlSnapshot) {
    return (
      <Alert 
        message="无XML快照数据" 
        type="warning" 
        showIcon 
      />
    );
  }

  return (
    <Card 
      title={
        <Space>
          <FileTextOutlined />
          <span>XML快照</span>
          <Badge count={stepCard.id} showZero color="blue" />
        </Space>
      }
      size="small"
      className={`structural-xml-viewer light-theme-force ${className || ''}`}
      style={style}
      extra={
        <Button 
          size="small" 
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(stepCard.xmlSnapshot?.xmlContent || '')}
        >
          复制
        </Button>
      }
    >
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        <pre style={{
          fontSize: '12px',
          lineHeight: '1.4',
          margin: 0,
          whiteSpace: 'pre-wrap',
          color: 'rgba(0,0,0,0.85)',
          backgroundColor: '#fafafa',
          padding: '12px',
          borderRadius: '4px'
        }}>
          {stepCard.xmlSnapshot?.xmlContent || '暂无XML内容'}
        </pre>
      </div>
      
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        大小: {stepCard.xmlSnapshot?.xmlContent?.length || 0} 字节
      </div>
    </Card>
  );
};

export default StructuralXmlViewer;