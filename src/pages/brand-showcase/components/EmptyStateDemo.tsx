// src/pages/brand-showcase/components/EmptyStateDemo.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 空状态组件演示区
 */
import React from 'react';
import { Card } from '../../../components/ui/card/Card';
import { NoDataState } from '../../../components/patterns';

export const EmptyStateDemo: React.FC = () => {
  return (
    <Card variant="default" className="p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-4">空状态组件演示</h3>
      <div className="grid gap-6">
        <NoDataState
          title="暂无员工数据"
          description="还没有添加任何员工信息，点击下方按钮开始添加"
          addText="添加员工"
          onAddClick={() => console.log('添加员工')}
        />
      </div>
    </Card>
  );
};