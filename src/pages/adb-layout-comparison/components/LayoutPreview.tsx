// src/pages/adb-layout-comparison/components/LayoutPreview.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

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
