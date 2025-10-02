import React from 'react';
import { Space, Tag, Typography } from 'antd';
import type { VisualElementCategory, VisualUIElement } from '../../../types';
import { convertVisualToUIElement } from '../utils/elementTransform';
import type { UIElement } from '../../../../../api/universalUIAPI';

const { Title } = Typography;

export interface ElementListProps {
  filteredElements: VisualUIElement[];
  categories: VisualElementCategory[];
  selectionManager: any;
  externalSelectionManager?: any;
  convertedElements: UIElement[];
}

export const ElementList: React.FC<ElementListProps> = ({
  filteredElements,
  categories,
  selectionManager,
  externalSelectionManager,
  convertedElements
}) => {
  return (
    <div style={{width:'clamp(240px,18vw,320px)',minWidth:240,flex:'0 0 clamp(240px,18vw,320px)',flexShrink:0}}>
      <Title level={5}>元素列表 ({filteredElements.length})</Title>
      <Space direction="vertical" style={{width:'100%'}} size={8}>
        {filteredElements.map(element => {
          const category = categories.find(cat=>cat.name===element.category);
          return (
            <div 
              key={element.id} 
              className="light-theme-force"
              style={{
                border: '1px solid var(--border-muted, #d9d9d9)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: 'var(--space-3, 12px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'var(--bg-light-base, #ffffff)',
                wordBreak: 'break-word'
              }}
              onClick={e=>{ const clickPosition={x:e.clientX,y:e.clientY}; if(externalSelectionManager){ const uiElement = convertVisualToUIElement(element) as unknown as UIElement; selectionManager.handleElementClick(uiElement, clickPosition);} else { const uiElement = convertedElements.find(el=>el.id===element.id); if (uiElement) selectionManager.handleElementClick(uiElement, clickPosition); } }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor = category?.color || 'var(--brand, #1890ff)'; e.currentTarget.style.boxShadow = `0 2px 8px ${(category?.color||'var(--brand, #1890ff)')}20`; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor = 'var(--border-muted, #d9d9d9)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-2, 8px)', 
                marginBottom: 'var(--space-2, 8px)'
              }}>
                {category?.icon}
                <span style={{
                  color: category?.color || 'var(--text-inverse, #1e293b)',
                  fontWeight: 'bold'
                }}>{element.userFriendlyName}</span>
                {element.clickable && <Tag color="green">可点击</Tag>}
                <Tag color={element.importance==='high'?'red':element.importance==='medium'?'orange':'default'}>
                  {element.importance==='high'?'重要':element.importance==='medium'?'中等':'一般'}
                </Tag>
              </div>
              <div style={{
                fontSize: 'var(--font-xs, 12px)'
              }}>
                <p style={{margin:0}}><strong>功能:</strong> <span style={{wordBreak:'break-word'}}>{element.description}</span></p>
                <p style={{margin:0}}><strong>位置:</strong> ({element.position.x}, {element.position.y})</p>
                <p style={{margin:0}}><strong>大小:</strong> {element.position.width} × {element.position.height}</p>
                {element.text && (<p style={{margin:0}}><strong>文本:</strong> <span style={{wordBreak:'break-word'}}>{element.text}</span></p>)}
              </div>
            </div>
          );
        })}
      </Space>
    </div>
  );
};
