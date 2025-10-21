// src/pages/prospecting-page.tsx
// module: pages | layer: ui | role: 精准获客页面
// summary: 精准获客功能展示页面

import React from 'react';
import { ProspectingDashboard } from '@prospecting';

/**
 * 精准获客页面组件
 */
const ProspectingPage: React.FC = () => {
  return (
    <div className="prospecting-page">
      <ProspectingDashboard />
    </div>
  );
};

export default ProspectingPage;