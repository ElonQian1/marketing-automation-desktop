// src/modules/structural-matching/ui/components/xml-snapshot-viewer-simple.tsx
// module: structural-matching | layer: ui | role: 简化XML快照查看器
// summary: 简单的XML内容显示组件，用于参数推理功能

import React, { useState } from 'react';
import { Card, Alert, Input, Typography, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Text } = Typography;

interface XmlSnapshotViewerSimpleProps {
  /** XML快照内容 */
  xmlContent: string;
  
  /** 高亮的XPath */
  highlightXPath?: string;
  
  /** 高度限制 */
  height?: number;
  
  /** 样式类名 */
  className?: string;
}

/**
 * 简化XML快照查看器组件
 * 用于显示XML内容，支持基本搜索和高亮
 */
export const XmlSnapshotViewerSimple: React.FC<XmlSnapshotViewerSimpleProps> = ({
  xmlContent,
  highlightXPath,
  height = 400,
  className
}) => {
  const [searchValue, setSearchValue] = useState('');

  if (!xmlContent) {
    return (
      <div className={`xml-snapshot-viewer-simple light-theme-force ${className || ''}`}>
        <Empty description="无XML快照内容" />
      </div>
    );
  }

  // 搜索过滤
  const filteredContent = searchValue 
    ? xmlContent
        .split('\n')
        .filter(line => line.toLowerCase().includes(searchValue.toLowerCase()))
        .join('\n')
    : xmlContent;

  // 简单的高亮处理
  const getHighlightedContent = (content: string) => {
    if (!highlightXPath) return content;
    
    try {
      // 转义特殊字符
      const escapedXPath = highlightXPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return content.replace(
        new RegExp(escapedXPath, 'gi'),
        `<mark style="background-color: #fff3cd; padding: 2px 4px; border-radius: 2px;">$&</mark>`
      );
    } catch {
      return content;
    }
  };

  return (
    <div className={`xml-snapshot-viewer-simple light-theme-force ${className || ''}`}>
      <Card 
        title="XML快照内容" 
        size="small"
        style={{ backgroundColor: 'var(--bg-light-base, #ffffff)' }}
      >
        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <Search
            placeholder="搜索XML内容..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            size="small"
          />
        </div>

        {/* XML内容显示 */}
        <div style={{ height, overflowY: 'auto', backgroundColor: 'var(--bg-light-base, #fafafa)' }}>
          {filteredContent ? (
            <pre 
              style={{ 
                fontSize: '12px',
                backgroundColor: 'var(--bg-light-base, #fafafa)',
                color: 'var(--text-inverse, #262626)',
                padding: '12px',
                margin: 0,
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.4
              }}
              dangerouslySetInnerHTML={{ __html: getHighlightedContent(filteredContent) }}
            />
          ) : (
            <Empty 
              description={searchValue ? "无匹配结果" : "无XML内容"} 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>

        {/* 状态信息 */}
        {highlightXPath && (
          <Alert
            message={`高亮XPath: ${highlightXPath}`}
            type="info"
            style={{ marginTop: 8 }}
            showIcon
          />
        )}
        
        {searchValue && (
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '12px', 
              display: 'block', 
              textAlign: 'right', 
              marginTop: 8,
              color: 'var(--text-inverse, #666666)'
            }}
          >
            搜索: "{searchValue}"
          </Text>
        )}
      </Card>
    </div>
  );
};