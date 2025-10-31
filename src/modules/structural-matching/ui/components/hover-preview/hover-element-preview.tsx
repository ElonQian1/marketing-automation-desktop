// src/modules/structural-matching/ui/components/hover-preview/hover-element-preview.tsx
// module: structural-matching | layer: ui | role: 悬停元素预览
// summary: 当鼠标悬停在树节点上时显示的元素可视化预览组件

import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { EyeOutlined, BorderOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface HoverElementPreviewProps {
  /** 是否显示 */
  visible: boolean;
  
  /** 鼠标位置 */
  mousePosition: { x: number; y: number };
  
  /** 元素数据 */
  elementData: {
    text?: string;
    content_desc?: string;
    class_name?: string;
    bounds?: string;
    clickable?: boolean;
    resource_id?: string;
  } | null;

  /** XML内容（用于解析viewport） */
  xmlContent?: string;
}

/**
 * 解析边界字符串 "[x1,y1][x2,y2]" 为坐标对象
 */
function parseBounds(bounds: string): { x: number; y: number; width: number; height: number } | null {
  const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;
  
  const [, x1, y1, x2, y2] = match.map(Number);
  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1
  };
}

/**
 * 从XML中解析viewport尺寸
 */
function parseViewportFromXml(xmlContent: string): { width: number; height: number } | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const hierarchyNode = xmlDoc.querySelector('hierarchy');
    
    if (hierarchyNode) {
      const rotation = hierarchyNode.getAttribute('rotation') || '0';
      // 根据旋转角度调整解析方式，这里简化处理
      // 实际项目中可能需要更复杂的解析逻辑
    }
    
    // 尝试从第一个node元素获取屏幕尺寸
    const firstNode = xmlDoc.querySelector('node');
    if (firstNode) {
      const bounds = firstNode.getAttribute('bounds');
      if (bounds) {
        const match = bounds.match(/\[0,0\]\[(\d+),(\d+)\]/);
        if (match) {
          return { width: parseInt(match[1]), height: parseInt(match[2]) };
        }
      }
    }
    
    // 默认返回常见的Android屏幕尺寸
    return { width: 1080, height: 1920 };
  } catch (error) {
    console.warn('解析XML viewport失败:', error);
    return { width: 1080, height: 1920 };
  }
}

/**
 * 悬停元素预览组件
 */
export const HoverElementPreview: React.FC<HoverElementPreviewProps> = ({
  visible,
  mousePosition,
  elementData,
  xmlContent = ''
}) => {
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});

  console.log('🖼️ HoverElementPreview render:', { visible, mousePosition, elementData: !!elementData });

  // 计算预览窗口位置
  useEffect(() => {
    if (!visible || !elementData) {
      console.log('⚠️ Preview not shown - visible:', visible, 'elementData:', !!elementData);
      return;
    }

    console.log('📐 Calculating preview position...');

    const previewWidth = 400;
    const previewHeight = 300;
    const offset = 20;

    let left = mousePosition.x + offset;
    let top = mousePosition.y + offset;

    // 防止预览窗口超出屏幕边界
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (left + previewWidth > screenWidth) {
      left = mousePosition.x - previewWidth - offset;
    }

    if (top + previewHeight > screenHeight) {
      top = mousePosition.y - previewHeight - offset;
    }

    setPreviewStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${previewWidth}px`,
      maxHeight: `${previewHeight}px`,
      zIndex: 9999,
      pointerEvents: 'none', // 防止阻挡鼠标事件
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #d9d9d9',
    });

    console.log('✅ Preview style calculated:', previewStyle);
  }, [visible, mousePosition, elementData]);

  if (!visible || !elementData) {
    console.log('🚫 Preview not rendering - visible:', visible, 'elementData:', !!elementData);
    return null;
  }

  console.log('🎨 Rendering preview with elementData:', elementData);

  const bounds = elementData.bounds ? parseBounds(elementData.bounds) : null;
  const viewport = xmlContent ? parseViewportFromXml(xmlContent) : { width: 1080, height: 1920 };

  return (
    <Card 
      className="light-theme-force"
      style={previewStyle}
      size="small"
      title={
        <Space>
          <EyeOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: 14, color: '#333' }}>
            元素预览
          </Text>
        </Space>
      }
    >
      {/* 元素信息 */}
      <div style={{ marginBottom: 12 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {elementData.text && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>文本:</Text>
              <Text style={{ marginLeft: 4, fontSize: 12 }}>{elementData.text}</Text>
            </div>
          )}
          
          {elementData.content_desc && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>描述:</Text>
              <Text style={{ marginLeft: 4, fontSize: 12 }}>{elementData.content_desc}</Text>
            </div>
          )}
          
          {elementData.resource_id && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>ID:</Text>
              <Text style={{ marginLeft: 4, fontSize: 12, fontFamily: 'monospace' }}>
                {elementData.resource_id}
              </Text>
            </div>
          )}

          <div>
            <Space size={4}>
              {elementData.clickable && (
                <Tag color="green" style={{ fontSize: 10 }}>可点击</Tag>
              )}
              <Tag color="blue" style={{ fontSize: 10 }}>
                {elementData.class_name?.split('.').pop() || '未知类型'}
              </Tag>
            </Space>
          </div>
        </Space>
      </div>

      {/* 可视化预览 */}
      {bounds && (
        <div style={{ marginTop: 12 }}>
          <Space align="center" style={{ marginBottom: 8 }}>
            <BorderOutlined style={{ color: '#52c41a', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              位置预览
            </Text>
          </Space>
          
          <div 
            style={{
              width: '100%',
              height: 120,
              border: '1px solid #f0f0f0',
              borderRadius: 4,
              position: 'relative',
              backgroundColor: '#fafafa',
              overflow: 'hidden'
            }}
          >
            {/* 屏幕边框 */}
            <div 
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                border: '2px solid #d9d9d9',
                borderRadius: 8,
                backgroundColor: '#fff'
              }}
            >
              {/* 元素位置 */}
              <div
                style={{
                  position: 'absolute',
                  left: `${(bounds.x / viewport.width) * 100}%`,
                  top: `${(bounds.y / viewport.height) * 100}%`,
                  width: `${(bounds.width / viewport.width) * 100}%`,
                  height: `${(bounds.height / viewport.height) * 100}%`,
                  backgroundColor: 'rgba(24, 144, 255, 0.3)',
                  border: '1px solid #1890ff',
                  borderRadius: 2,
                  minWidth: 2,
                  minHeight: 2
                }}
              />
            </div>
          </div>
          
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
            位置: ({bounds.x}, {bounds.y}) 尺寸: {bounds.width}×{bounds.height}
          </Text>
        </div>
      )}
    </Card>
  );
};