/**
 * 文本到父级元素匹配功能的使用示例
 */

import React, { useState } from 'react';
import { Button, Input, Card, Typography, Space } from 'antd';
import { useElementDiscovery } from './useElementDiscovery';
import type { UIElement } from '../../../../api/universalUIAPI';

const { Title, Text } = Typography;

interface TextToParentExampleProps {
  allElements: UIElement[];
}

export const TextToParentExample: React.FC<TextToParentExampleProps> = ({ allElements }) => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const { findParentByText } = useElementDiscovery(allElements);

  const handleSearch = () => {
    if (!searchText.trim()) return;
    
    // 🔍 使用新功能：基于文本查找父级元素
    const foundParents = findParentByText(searchText, 'contains');
    setResults(foundParents);
    
    console.log('🎯 文本搜索结果:', {
      searchText,
      foundCount: foundParents.length,
      results: foundParents
    });
  };

  return (
    <Card title="📝 文本匹配查找父级元素" style={{ margin: '16px 0' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text>输入要搜索的文本内容（如："联系人"、"电话"、"收藏"）：</Text>
        </div>
        
        <Space>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="输入文本内容..."
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Button type="primary" onClick={handleSearch}>
            🔍 查找父级元素
          </Button>
        </Space>

        {results.length > 0 && (
          <div>
            <Title level={5}>找到 {results.length} 个可点击的父级元素：</Title>
            {results.map((item, index) => (
              <Card 
                key={index} 
                size="small" 
                style={{ marginBottom: '8px', backgroundColor: '#f8f9fa' }}
              >
                <div>
                  <Text strong>元素ID:</Text> {item.element.id}
                </div>
                <div>
                  <Text strong>关系:</Text> {item.relationship}
                </div>
                <div>
                  <Text strong>置信度:</Text> {(item.confidence * 100).toFixed(1)}%
                </div>
                <div>
                  <Text strong>原因:</Text> {item.reason}
                </div>
                <div>
                  <Text strong>Resource ID:</Text> {item.element.resource_id || '无'}
                </div>
                <div>
                  <Text strong>可点击区域:</Text> [{item.element.bounds.left},{item.element.bounds.top}] - [{item.element.bounds.right},{item.element.bounds.bottom}]
                </div>
                <div>
                  <Text strong>面积:</Text> {(item.element.bounds.right - item.element.bounds.left) * (item.element.bounds.bottom - item.element.bounds.top)} px²
                </div>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && searchText && (
          <Text type="secondary">未找到包含文本 "{searchText}" 的可点击父级元素</Text>
        )}
      </Space>
    </Card>
  );
};

export default TextToParentExample;