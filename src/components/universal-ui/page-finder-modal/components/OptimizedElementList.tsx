// src/components/universal-ui/page-finder-modal/components/OptimizedElementList.tsx
// module: ui | layer: ui | role: optimized-element-list
// summary: 优化的元素列表组件，集成性能监控和智能渲染

/**
 * 优化的元素列表组件 - 简化版性能优化
 * 不依赖react-window，使用原生优化技术提升性能
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
// 暂时移除react-window，使用简化的虚拟滚动
// import { List } from 'react-window';
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
  Progress,
  Row,
  Col,
  List,
} from "antd";
import {
  EyeOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import type { UIElement } from "../types";
import type { VisualFilterConfig } from "../../types";
import { FilterAdapter } from "../../../../services/ui-filter-adapter";
import { getDisplayText, sortElements } from "../utils/sortElements";
import { useXmlCachePerformanceMonitor } from "../../../../services/xml-cache-performance-monitor";

const { Text } = Typography;

export interface OptimizedElementListProps {
  elements: UIElement[];
  loading?: boolean;
  onElementInspect?: (element: UIElement) => void;
  onElementCopy?: (element: UIElement) => void;
  title?: string;
  showDetails?: boolean;
  filterConfig?: VisualFilterConfig;
  // 🚀 性能优化配置
  enablePerformanceMonitoring?: boolean; // 启用性能监控
  maxRenderedItems?: number; // 最大渲染数量，超过则分页
  itemHeight?: number; // 预估项目高度，用于性能计算
}

export const OptimizedElementList: React.FC<OptimizedElementListProps> = ({
  elements,
  loading = false,
  onElementInspect,
  onElementCopy,
  title = "优化的UI元素列表",
  showDetails = true,
  filterConfig,
  enablePerformanceMonitoring = true,
  maxRenderedItems = 100, // 一次最多渲染100个项目
  itemHeight = 120,
}) => {
  const [prioritizeSemantic, setPrioritizeSemantic] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 性能监控
  const performanceMonitor = useXmlCachePerformanceMonitor({
    enableMetrics: enablePerformanceMonitoring,
    onPerformanceUpdate: useCallback((metrics) => {
      if (enablePerformanceMonitoring) {
        console.log('📊 [OptimizedElementList] 性能指标:', metrics);
      }
    }, [enablePerformanceMonitoring])
  });

  // 测量渲染性能
  const startTime = useRef<number>(Date.now());
  useEffect(() => {
    if (performanceMonitor) {
      const renderTime = Date.now() - startTime.current;
      performanceMonitor.recordRenderTime(renderTime);
      startTime.current = Date.now();
    }
  }, [elements.length, performanceMonitor]);

  // 应用前端过滤规则
  const filteredByConfig = useMemo(() => {
    const start = Date.now();
    const result = FilterAdapter.filterUIElementsByLegacyConfig(elements, filterConfig);
    const filterTime = Date.now() - start;
    
    if (performanceMonitor) {
      performanceMonitor.recordFilterTime(filterTime);
    }
    
    return result;
  }, [elements, filterConfig, performanceMonitor]);

  // 排序优化
  const sortedElements = useMemo(() => {
    const start = Date.now();
    const result = sortElements(filteredByConfig, { prioritizeSemantic });
    const sortTime = Date.now() - start;
    
    if (performanceMonitor) {
      performanceMonitor.recordSortTime(sortTime);
    }
    
    return result;
  }, [filteredByConfig, prioritizeSemantic, performanceMonitor]);

  // 分页处理 - 只渲染当前页面的项目
  const paginatedElements = useMemo(() => {
    const startIndex = (currentPage - 1) * maxRenderedItems;
    const endIndex = startIndex + maxRenderedItems;
    return sortedElements.slice(startIndex, endIndex);
  }, [sortedElements, currentPage, maxRenderedItems]);

  // 统计信息
  const stats = useMemo(() => {
    const total = elements.length;
    const filtered = sortedElements.length;
    const rendered = paginatedElements.length;
    const clickable = elements.filter(
      (el) =>
        el.is_clickable ||
        el.class_name?.includes("Button") ||
        el.class_name?.includes("TextView")
    ).length;
    const hasText = elements.filter((el) => el.text && el.text.trim()).length;
    const hasId = elements.filter((el) => el.resource_id).length;

    return { total, filtered, rendered, clickable, hasText, hasId };
  }, [elements, sortedElements, paginatedElements]);

  // 是否使用分页优化
  const shouldUsePagination = sortedElements.length > maxRenderedItems;

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
        children: <Text code style={{ fontSize: '11px' }}>{element.resource_id}</Text>,
      },
      element.text && {
        key: "text",
        label: "文本内容",
        children: <Text style={{ fontSize: '11px' }}>{element.text}</Text>,
      },
      element.content_desc && {
        key: "contentDesc",
        label: "内容描述",
        children: <Text style={{ fontSize: '11px' }}>{element.content_desc}</Text>,
      },
      element.class_name && {
        key: "class",
        label: "类名",
        children: <Text code style={{ fontSize: '11px' }}>{element.class_name}</Text>,
      },
      element.bounds && {
        key: "bounds",
        label: "位置信息",
        children: (
          <Text code style={{ fontSize: '11px' }}>
            {`[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`}
          </Text>
        ),
      },
    ].filter(Boolean);

    if (items.length === 0) return null;

    return (
      <Descriptions 
        size="small" 
        column={1} 
        items={items}
        style={{ marginTop: 6, fontSize: '10px' }}
      />
    );
  };

  // 性能状态显示
  const renderPerformanceStatus = () => {
    if (!enablePerformanceMonitoring || !performanceMonitor?.metrics) return null;

    const metrics = performanceMonitor.metrics;
    const avgRenderTime = metrics.renderTimes.length > 0 
      ? metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length 
      : 0;

    // 计算性能评分 (目标: 渲染时间 < 50ms)
    const performanceScore = Math.max(0, Math.min(100, (50 - avgRenderTime) * 2));
    const scoreColor: "success" | "exception" | "normal" = 
      performanceScore > 80 ? 'success' : performanceScore > 50 ? 'normal' : 'exception';

    return (
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col span={12}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            <ThunderboltOutlined /> 渲染: {avgRenderTime.toFixed(1)}ms
          </Text>
        </Col>
        <Col span={12}>
          <Progress 
            percent={performanceScore} 
            status={scoreColor}
            size="small" 
            showInfo={false}
            strokeWidth={4}
          />
        </Col>
      </Row>
    );
  };

  // 渲染列表项
  const renderListItem = (element: UIElement, index: number) => {
    const typeText = getElementTypeText(element);
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
        style={{ 
          fontSize: '12px',
          padding: '8px 12px',
          minHeight: itemHeight,
          transition: 'background-color 0.2s'
        }}
        className="light-theme-force"
      >
        <List.Item.Meta
          avatar={<Tag>{((currentPage - 1) * maxRenderedItems) + index + 1}</Tag>}
          title={
            <Space size={4}>
              <Text strong style={{ fontSize: '12px' }}>{displayText}</Text>
              <Tag>{typeText}</Tag>
              {element.is_clickable && (
                <Tag icon={<CheckCircleOutlined />}>可交互</Tag>
              )}
              {hasMultipleProperties && (
                <Tooltip title="该元素包含多个属性信息">
                  <InfoCircleOutlined style={{ fontSize: '10px' }} />
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
          <Tag>{stats.rendered}/{stats.filtered}/{stats.total}个元素</Tag>
          {shouldUsePagination && (
            <Tag color="blue" icon={<ThunderboltOutlined />}>
              分页优化
            </Tag>
          )}
        </Space>
      }
      size="small"
      extra={
        stats.total > 0 && (
          <Space split={<Divider type="vertical" />} size={4}>
            <Text type="secondary" style={{ fontSize: '11px' }}>可交互: {stats.clickable}</Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>有文本: {stats.hasText}</Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>有ID: {stats.hasId}</Text>
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: '11px' }}>语义优先</Text>
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
      {enablePerformanceMonitoring && renderPerformanceStatus()}
      
      {sortedElements.length === 0 ? (
        <Empty description="暂无UI元素数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <List 
            dataSource={paginatedElements} 
            renderItem={renderListItem} 
            loading={loading}
            style={{ maxHeight: '400px', overflow: 'auto' }}
          />
          
          {shouldUsePagination && (
            <div style={{ textAlign: 'center', marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
              <Space>
                <Button 
                  size="small" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  上一页
                </Button>
                <Text style={{ fontSize: '12px' }}>
                  第 {currentPage} 页，共 {Math.ceil(sortedElements.length / maxRenderedItems)} 页
                </Text>
                <Button 
                  size="small"
                  disabled={currentPage >= Math.ceil(sortedElements.length / maxRenderedItems)}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页
                </Button>
              </Space>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  <ThunderboltOutlined /> 分页渲染优化：一次仅显示 {maxRenderedItems} 个元素，提升性能
                </Text>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default OptimizedElementList;