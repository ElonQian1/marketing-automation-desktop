/**
 * 元素列表显示组件 - 原生 Ant Design 风格
 * 从 UniversalPageFinderModal.tsx 中提取的元素展示逻辑
 */

import React, { useMemo, useState } from "react";
import {
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Tooltip,
  Empty,
  Descriptions,
  Divider,
  Switch,
  List,
} from "antd";
import {
  EyeOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  BugOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { UIElement } from "../types";
import type { VisualFilterConfig } from "../../types";
import { filterUIElementsByConfig } from "../../shared/filters/visualFilter";
import { getDisplayText, sortElements } from "../utils/sortElements";

const { Text } = Typography;

export interface ElementListProps {
  elements: UIElement[];
  loading?: boolean;
  onElementInspect?: (element: UIElement) => void;
  onElementCopy?: (element: UIElement) => void;
  title?: string;
  showDetails?: boolean;
  // 🆕 可选：前端可视化过滤规则（与可视化视图保持一致）
  filterConfig?: VisualFilterConfig;
}

export const ElementList: React.FC<ElementListProps> = ({
  elements,
  loading = false,
  onElementInspect,
  onElementCopy,
  title = "UI元素列表",
  showDetails = true,
  filterConfig,
}) => {
  // 开关：优先展示语义元素（可点击/有文本/有ID）
  const [prioritizeSemantic, setPrioritizeSemantic] = useState(true);

  // 🆕 应用前端过滤规则（若提供）
  const filteredByConfig = useMemo(() => {
    return filterUIElementsByConfig(elements, filterConfig);
  }, [elements, filterConfig]);

  // 排序：支持“语义优先”，并将“未知/未命名/占位(元素 N)”排到最后，组内保持稳定
  const sortedElements = useMemo(
    () => sortElements(filteredByConfig, { prioritizeSemantic }),
    [filteredByConfig, prioritizeSemantic]
  );

  // 统计信息
  const stats = useMemo(() => {
    const total = elements.length;
    const clickable = elements.filter(
      (el) =>
        el.is_clickable ||
        el.class_name?.includes("Button") ||
        el.class_name?.includes("TextView")
    ).length;
    const hasText = elements.filter((el) => el.text && el.text.trim()).length;
    const hasId = elements.filter((el) => el.resource_id).length;

    return { total, clickable, hasText, hasId };
  }, [elements]);

  // 获取元素类型文本
  const getElementTypeText = (element: UIElement): string => {
    if (element.is_clickable) return "可点击";
    if (element.class_name?.includes("Button")) return "按钮";
    if (element.class_name?.includes("Text")) return "文本";
    if (element.class_name?.includes("Image")) return "图片";
    if (element.class_name?.includes("Edit")) return "输入框";
    return "其他";
  };

  // 渲染元素详情
  const renderElementDetails = (element: UIElement) => {
    if (!showDetails) return null;

    const items = [
      element.resource_id && {
        key: "resourceId",
        label: "Resource ID",
        children: <Text code>{element.resource_id}</Text>,
      },
      element.text && {
        key: "text",
        label: "文本内容",
        children: <Text>{element.text}</Text>,
      },
      element.content_desc && {
        key: "contentDesc",
        label: "内容描述",
        children: <Text>{element.content_desc}</Text>,
      },
      element.class_name && {
        key: "class",
        label: "类名",
        children: <Text code>{element.class_name}</Text>,
      },
      element.bounds && {
        key: "bounds",
        label: "位置信息",
        children: (
          <Text code>{`[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`}</Text>
        ),
      },
    ].filter(Boolean as unknown as <T>(x: T) => x is T);

    if ((items as unknown as any[]).length === 0) return null;

    return <Descriptions size="small" column={1} items={items as any} />;
  };

  // 渲染列表项
  const renderListItem = (element: UIElement, index: number) => {
    const typeText = getElementTypeText(element);
    // 显示文本优先级：text > contentDesc > resourceId > class
    const displayText = getDisplayText(element, index);
    const hasMultipleProperties = [
      element.text,
      element.content_desc,
      element.resource_id,
      element.class_name,
    ].filter(Boolean).length > 1;

    return (
      <List.Item
        key={`element-${index}`}
        actions={[
          onElementInspect && (
            <Tooltip title="查看详情" key="inspect">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onElementInspect(element)}
                size="small"
              />
            </Tooltip>
          ),
          onElementCopy && (
            <Tooltip title="复制信息" key="copy">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => onElementCopy(element)}
                size="small"
              />
            </Tooltip>
          ),
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={<Tag>{index + 1}</Tag>}
          title={
            <Space>
              <Text strong>{displayText}</Text>
              <Tag>{typeText}</Tag>
              {element.is_clickable && (
                <Tag icon={<CheckCircleOutlined />}>可交互</Tag>
              )}
              {hasMultipleProperties && (
                <Tooltip title="该元素包含多个属性信息">
                  <InfoCircleOutlined />
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
          <Tag>{stats.total}个元素</Tag>
        </Space>
      }
      size="small"
      extra={
        stats.total > 0 && (
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">可交互: {stats.clickable}</Text>
            <Text type="secondary">有文本: {stats.hasText}</Text>
            <Text type="secondary">有ID: {stats.hasId}</Text>
            <Space size={4}>
              <Text type="secondary">优先展示语义元素</Text>
              <Switch
                size="small"
                checked={prioritizeSemantic}
                onChange={setPrioritizeSemantic}
              />
            </Space>
          </Space>
        )
      }
    >
      {sortedElements.length === 0 ? (
        <Empty description="暂无UI元素数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List dataSource={sortedElements} renderItem={renderListItem} loading={loading} />
      )}
    </Card>
  );
};
