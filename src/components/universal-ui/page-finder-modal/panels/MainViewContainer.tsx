// src/components/universal-ui/page-finder-modal/panels/MainViewContainer.tsx
// module: ui | layer: ui | role: component
// summary: 主视图容器，包含浮动的视图模式切换器

import React from 'react';
import { Card, Spin } from 'antd';
import type { ViewMode } from '../types';
import { CompactViewSwitcher } from '../components';

export interface MainViewContainerProps {
  loading: boolean;
  content: React.ReactNode;
  // 视图模式控制
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  elementCount?: number;
}

export const MainViewContainer: React.FC<MainViewContainerProps> = ({ 
  loading, 
  content,
  viewMode,
  onViewModeChange,
  elementCount = 0
}) => {
  return (
    <Card 
      size="small"
      style={{ position: 'relative', minHeight: '600px' }}
    >
      {/* 右上角浮动视图切换器 */}
      {viewMode && onViewModeChange && (
        <CompactViewSwitcher
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          elementCount={elementCount}
          loading={loading}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>正在分析页面...</div>
        </div>
      ) : (
        content
      )}
    </Card>
  );
};

export default MainViewContainer;
