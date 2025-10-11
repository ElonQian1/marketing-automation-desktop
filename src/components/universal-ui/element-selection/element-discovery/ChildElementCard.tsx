// src/components/universal-ui/element-selection/element-discovery/ChildElementCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card } from 'antd';
import type { ElementCardProps } from './types';

export const ChildElementCard: React.FC<ElementCardProps> = ({
  element: discoveredElement,
  onSelect
}) => {
  const element = discoveredElement.element;

  const handleSelect = () => {
    onSelect?.(discoveredElement);
  };

  return (
    <Card size="small" style={{ marginBottom: '12px' }}>
      <div>
        <p>ID: {element.id}</p>
        <p>文本: {element.text}</p>
        <button onClick={handleSelect}>选择此子元素</button>
      </div>
    </Card>
  );
};
