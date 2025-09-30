/**
 * 元素列表显示组件 - 原生 Ant Design 风格
 * 从 UniversalPageFinderModal.tsx 中提取的元素展示逻辑
 */

import React, { useMemo } from "react";
import { 
  Card, 
  List, 
  Tag, 
  Space, 
  Typography, 
  Button,
  Tooltip,
  Empty,
  theme,
  Descriptions,
  Divider
} from "antd";
import {
  EyeOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  BugOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import type { UIElement } from "../types";

const { Text, Paragraph } = Typography;

export interface ElementListProps {
  elements: UIElement[];
  loading?: boolean;
  onElementInspect?: (element: UIElement) => void;
  onElementCopy?: (element: UIElement) => void;
  title?: string;
  showDetails?: boolean;
}

export const ElementList: React.FC<ElementListProps> = ({
  elements,
  loading = false,
  onElementInspect,
  onElementCopy,
  title = "UI元素列表",
  showDetails = true
}) => {
  const { token } = theme.useToken();

  // 统计信息
  const stats = useMemo(() => {
    const total = elements.length;
    const clickable = elements.filter(el => 
      el.clickable || el.class?.includes("Button") || el.class?.includes("TextView")
    ).length;
    const hasText = elements.filter(el => el.text && el.text.trim()).length;
    const hasId = elements.filter(el => el.resourceId).length;
    
    return { total, clickable, hasText, hasId };
  }, [elements]);

  // 获取元素类型标签颜色
  const getElementTypeColor = (element: UIElement): string => {
    if (element.clickable) return token.colorSuccess;
    if (element.class?.includes("Button")) return token.colorPrimary;
    if (element.class?.includes("Text")) return token.colorInfo;
    if (element.class?.includes("Image")) return token.colorWarning;
    return token.colorTextSecondary;
  };

  // 获取元素类型文本
  const getElementTypeText = (element: UIElement): string => {
    if (element.clickable) return "可点击";
    if (element.class?.includes("Button")) return "按钮";
    if (element.class?.includes("Text")) return "文本";
    if (element.class?.includes("Image")) return "图片";
    if (element.class?.includes("Edit")) return "输入框";
    return "其他";
  };

  // 渲染元素详情
  const renderElementDetails = (element: UIElement) => {
    if (!showDetails) return null;

    const items = [
      element.resourceId && {
        key: "resourceId",
        label: "Resource ID",
        children: (
          <Text code style={{ fontSize: token.fontSizeSM }}>
            {element.resourceId}
          </Text>
        )
      },
      element.text && {
        key: "text",
        label: "文本内容",
        children: (
          <Text style={{ fontSize: token.fontSizeSM }}>
            {element.text}
          </Text>
        )
      },
      element.contentDesc && {
        key: "contentDesc",
        label: "内容描述",
        children: (
          <Text style={{ fontSize: token.fontSizeSM }}>
            {element.contentDesc}
          </Text>
        )
      },
      element.class && {
        key: "class",
        label: "类名",
        children: (
          <Text code style={{ fontSize: token.fontSizeSM }}>
            {element.class}
          </Text>
        )
      },
      element.bounds && {
        key: "bounds",
        label: "位置信息",
        children: (
          <Text code style={{ fontSize: token.fontSizeSM }}>
            {element.bounds}
          </Text>
        )
      }
    ].filter(Boolean);

    if (items.length === 0) return null;

    return (
      <Descriptions
        size="small"
        column={1}
        items={items}
        style={{ marginTop: token.marginXS }}
      />
    );
  };

  // 渲染列表项
  const renderListItem = (element: UIElement, index: number) => {
    const typeColor = getElementTypeColor(element);
    const typeText = getElementTypeText(element);
    
    // 显示文本优先级：text > contentDesc > resourceId > class
    const displayText = element.text || element.contentDesc || element.resourceId || element.class || `元素 ${index + 1}`;
    const hasMultipleProperties = [element.text, element.contentDesc, element.resourceId, element.class].filter(Boolean).length > 1;

    return (
      <List.Item
        key={`element-${index}`}
        style={{
          padding: token.padding,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          marginBottom: token.marginXS,
          backgroundColor: token.colorBgContainer
        }}
        actions={[
          onElementInspect && (
            <Tooltip title="查看详情">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onElementInspect(element)}
                size="small"
              />
            </Tooltip>
          ),
          onElementCopy && (
            <Tooltip title="复制信息">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => onElementCopy(element)}
                size="small"
              />
            </Tooltip>
          )
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={
            <div style={{
              width: 40,
              height: 40,
              borderRadius: token.borderRadius,
              backgroundColor: `${typeColor}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${typeColor}`
            }}>
              <Text strong style={{ color: typeColor, fontSize: token.fontSizeSM }}>
                {index + 1}
              </Text>
            </div>
          }
          title={
            <Space>
              <Text strong style={{ fontSize: token.fontSize }}>
                {displayText}
              </Text>
              <Tag color={typeColor} style={{ fontSize: token.fontSizeSM }}>
                {typeText}
              </Tag>
              {element.clickable && (
                <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: token.fontSizeSM }}>
                  可交互
                </Tag>
              )}
              {hasMultipleProperties && (
                <Tooltip title="该元素包含多个属性信息">
                  <InfoCircleOutlined style={{ color: token.colorInfo }} />
                </Tooltip>
              )}
            </Space>
          }
          description={renderElementDetails(element)}
        />
      </List.Item>
    );
  };

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          <span>{title}</span>
          <Tag color="blue">{stats.total}个元素</Tag>
        </Space>
      }
      size="small"
      extra={
        stats.total > 0 && (
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              可交互: {stats.clickable}
            </Text>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              有文本: {stats.hasText}
            </Text>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              有ID: {stats.hasId}
            </Text>
          </Space>
        )
      }
    >
      {elements.length === 0 ? (
        <Empty 
          description="暂无UI元素数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: token.paddingLG }}
        />
      ) : (
        <List
          dataSource={elements}
          renderItem={renderListItem}
          loading={loading}
          style={{
            maxHeight: 400,
            overflowY: "auto",
            padding: `0 ${token.paddingXS}px`
          }}
        />
      )}
    </Card>
  );
};