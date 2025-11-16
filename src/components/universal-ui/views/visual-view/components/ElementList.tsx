// src/components/universal-ui/views/visual-view/components/ElementList.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Space, Tag, Typography } from 'antd';
import type { VisualElementCategory, VisualUIElement } from '../../../types';
import { convertVisualToUIElement } from '../utils/elementTransform';
import type { UIElement } from '../../../../../api/universalUIAPI';
import { sortUnknownLastStable } from '../../../shared/utils/sorting';

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
  // 统一生成用于展示与排序的名称
  const getDisplayName = React.useCallback((el: VisualUIElement, idx?: number) => {
    // Visual 视图优先使用 userFriendlyName，其次 text/description，最后占位 “元素 N”
    const name = el.userFriendlyName || el.text || el.description || (typeof idx === 'number' ? `元素 ${idx + 1}` : '未命名元素');
    return String(name).trim();
  }, []);

  // 将“未知/未命名/占位(元素 N)”排到列表底部，其余保持原顺序
  const sortedElements = React.useMemo(() => (
    sortUnknownLastStable(filteredElements, (el, i) => getDisplayName(el, i))
  ), [filteredElements, getDisplayName]);

  return (
    <div style={{width:'clamp(240px,18vw,320px)',minWidth:240,flex:'0 0 clamp(240px,18vw,320px)',flexShrink:0}}>
      <Title level={5}>元素列表 ({filteredElements.length})</Title>
      <Space direction="vertical" style={{width:'100%'}} size={8}>
        {sortedElements.map(element => {
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
              onClick={e=>{ 
                const clickPosition={x:e.clientX,y:e.clientY}; 
                
                // 🔍 调试：检查点击的元素是否有indexPath
                console.log('🖱️ [ElementList] 元素被点击:', {
                  id: element.id,
                  hasIndexPath: !!element.indexPath,
                  indexPath: element.indexPath,
                  indexPathLength: element.indexPath?.length
                });
                
                if(externalSelectionManager){ 
                  const uiElement = convertVisualToUIElement(element) as unknown as UIElement;
                  
                  // 🔍 调试：检查转换后的元素是否保留indexPath
                  console.log('🔄 [ElementList] 转换后的UIElement:', {
                    id: uiElement.id,
                    hasIndexPath: !!(uiElement as any).indexPath,
                    indexPath: (uiElement as any).indexPath,
                    indexPathLength: (uiElement as any).indexPath?.length
                  });
                  
                  selectionManager.handleElementClick(uiElement, clickPosition);
                } else { 
                  const uiElement = convertedElements.find(el=>el.id===element.id); 
                  if (uiElement) selectionManager.handleElementClick(uiElement, clickPosition); 
                } 
              }}
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
