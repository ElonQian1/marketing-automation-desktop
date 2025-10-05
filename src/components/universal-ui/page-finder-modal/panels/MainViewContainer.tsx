import React from 'react';
import { Card, Spin } from 'antd';

export interface MainViewContainerProps {
  loading: boolean;
  content: React.ReactNode;
}

export const MainViewContainer: React.FC<MainViewContainerProps> = ({ loading, content }) => {
  return (
    <Card size="small">
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
