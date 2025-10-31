// src/modules/structural-matching/ui/components/hover-preview/floating-element-preview.tsx
// module: structural-matching | layer: ui | role: 固定悬浮元素预览
// summary: 固定显示的元素信息预览面板，不依赖鼠标位置

import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag, Divider } from 'antd';
import { EyeOutlined, BorderOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface FloatingElementPreviewProps {
  /** 选中的元素 */
  selectedElement: any;
  
  /** XML内容（用于解析viewport） */
  xmlContent?: string;
}

/**
 * 解析边界字符串 "[x1,y1][x2,y2]" 为坐标对象
 */
function parseBounds(bounds: unknown): { x: number; y: number; width: number; height: number } | null {
  // 类型安全检查：确保bounds是字符串
  if (!bounds || typeof bounds !== 'string') {
    console.warn('🔍 [FloatingElementPreview] bounds不是字符串类型:', typeof bounds, bounds);
    return null;
  }
  
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

interface ElementData {
  text: string;
  content_desc: string;
  class_name: string;
  bounds: string;
  clickable: boolean;
  resource_id: string;
  package: string;
  enabled: unknown;
  focusable: unknown;
  scrollable: unknown;
}

/**
 * 从selectedElement中提取元素信息
 */
function extractElementData(selectedElement: unknown): ElementData | null {
  if (!selectedElement || typeof selectedElement !== 'object') return null;
  
  // 处理包装的元素结构
  const actualElement = (selectedElement as Record<string, unknown>).selectedElement || selectedElement;
  const element = actualElement as Record<string, unknown>;
  
  return {
    text: String(element.text || element.textContent || ''),
    content_desc: String(element.content_desc || element.contentDescription || ''),
    class_name: String(element.class_name || element.className || ''),
    bounds: String(element.bounds || ''),
    clickable: element.clickable === true || element.clickable === 'true',
    resource_id: String(element.resource_id || element.resourceId || ''),
    package: String(element.package || ''),
    enabled: element.enabled,
    focusable: element.focusable,
    scrollable: element.scrollable
  };
}

/**
 * 固定悬浮元素预览组件
 */
export const FloatingElementPreview: React.FC<FloatingElementPreviewProps> = ({
  selectedElement,
  xmlContent = ''
}) => {
  const elementData = extractElementData(selectedElement);
  const viewport = xmlContent ? parseViewportFromXml(xmlContent) : { width: 1080, height: 1920 };

  if (!elementData) {
    return (
      <Card 
        className="light-theme-force"
        size="small"
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: 14, color: '#333' }}>
              元素预览
            </Text>
          </Space>
        }
        style={{ height: '100%' }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
          <Text type="secondary">请在左侧选择一个元素</Text>
        </div>
      </Card>
    );
  }

  const bounds = elementData.bounds ? parseBounds(elementData.bounds) : null;

  return (
    <Card 
      className="light-theme-force"
      size="small"
      title={
        <Space>
          <EyeOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: 14, color: '#333' }}>
            元素预览
          </Text>
        </Space>
      }
      style={{ height: '100%' }}
    >
      {/* 元素基本信息 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: '0 0 8px 0', color: '#333' }}>基本信息</Title>
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
              <Text type="secondary" style={{ fontSize: 12 }}>资源ID:</Text>
              <Text style={{ marginLeft: 4, fontSize: 12, fontFamily: 'monospace' }}>
                {elementData.resource_id}
              </Text>
            </div>
          )}

          {elementData.class_name && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>类型:</Text>
              <Text style={{ marginLeft: 4, fontSize: 12 }}>
                {elementData.class_name.split('.').pop()}
              </Text>
            </div>
          )}

          <div>
            <Space size={4} wrap>
              {elementData.clickable && (
                <Tag color="green" style={{ fontSize: 10 }}>可点击</Tag>
              )}
              {elementData.enabled && (
                <Tag color="blue" style={{ fontSize: 10 }}>已启用</Tag>
              )}
              {elementData.focusable && (
                <Tag color="purple" style={{ fontSize: 10 }}>可聚焦</Tag>
              )}
              {elementData.scrollable && (
                <Tag color="orange" style={{ fontSize: 10 }}>可滚动</Tag>
              )}
            </Space>
          </div>
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* 位置信息和可视化预览 */}
      {bounds && (
        <div>
          <Title level={5} style={{ margin: '0 0 8px 0', color: '#333' }}>位置预览</Title>
          
          <div 
            style={{
              width: '100%',
              height: 150,
              border: '1px solid #f0f0f0',
              borderRadius: 4,
              position: 'relative',
              backgroundColor: '#fafafa',
              overflow: 'hidden',
              marginBottom: 8
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
          
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            位置: ({bounds.x}, {bounds.y}) 尺寸: {bounds.width}×{bounds.height}
          </Text>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            屏幕: {viewport.width}×{viewport.height}
          </Text>
        </div>
      )}

      {/* 技术信息 */}
      {elementData.package && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div>
            <Title level={5} style={{ margin: '0 0 8px 0', color: '#333' }}>技术信息</Title>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>包名:</Text>
              <Text style={{ marginLeft: 4, fontSize: 12, fontFamily: 'monospace' }}>
                {elementData.package}
              </Text>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};