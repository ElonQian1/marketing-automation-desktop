import React from 'react';
import { Card } from 'antd';
import { ModernAdbDiagnosticPage } from '../../ModernAdbDiagnosticPage';
import { ComprehensiveAdbPage } from '../../ComprehensiveAdbPage';

export interface LayoutPreviewProps {
  layout: 'old' | 'new';
}

export const LayoutPreview: React.FC<LayoutPreviewProps> = ({ layout }) => {
  return (
    <Card>
      {layout === 'new' ? (
        <ModernAdbDiagnosticPage />
      ) : (
        <ComprehensiveAdbPage />
      )}
    </Card>
  );
};

export default LayoutPreview;
