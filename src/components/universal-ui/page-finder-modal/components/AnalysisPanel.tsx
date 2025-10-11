// src/components/universal-ui/page-finder-modal/components/AnalysisPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 分析面板组件 - 原生 Ant Design 风格
 * 从 UniversalPageFinderModal.tsx 中提取的分析显示逻辑
 */

import React from "react";
import { 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Progress, 
  Space, 
  Typography, 
  Alert,
  theme,
  Descriptions,
  Tag,
  Button,
  Tooltip
} from "antd";
import {
  BarChartOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined
} from "@ant-design/icons";
import type { UIElement } from "../types";

const { Text } = Typography;

export interface AnalysisPanelProps {
  elements: UIElement[];
  loading?: boolean;
  xmlContent?: string;
  deviceInfo?: any;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  elements,
  loading = false,
  xmlContent,
  deviceInfo,
  onRefresh,
  onExport,
  className
}) => {
  const { token } = theme.useToken();

  // 分析统计数据
  const analysisStats = React.useMemo(() => {
    const total = elements.length;
    const clickable = elements.filter(el => el.is_clickable).length;
    const hasText = elements.filter(el => el.text && el.text.trim()).length;
    const hasResourceId = elements.filter(el => el.resource_id).length;
    const hasContentDesc = elements.filter(el => el.content_desc).length;
    const interactive = elements.filter(el => 
      el.is_clickable || el.class_name?.includes("Button") || el.class_name?.includes("EditText")
    ).length;
    
    const clickablePercent = total > 0 ? Math.round((clickable / total) * 100) : 0;
    const textPercent = total > 0 ? Math.round((hasText / total) * 100) : 0;
    const idPercent = total > 0 ? Math.round((hasResourceId / total) * 100) : 0;
    
    return {
      total,
      clickable,
      hasText,
      hasResourceId,
      hasContentDesc,
      interactive,
      clickablePercent,
      textPercent,
      idPercent
    };
  }, [elements]);

  // 元素类型分析
  const elementTypes = React.useMemo(() => {
    const typeMap = new Map<string, number>();
    
    elements.forEach(el => {
      if (el.class_name) {
        const className = el.class_name.split('.').pop() || el.class_name;
        typeMap.set(className, (typeMap.get(className) || 0) + 1);
      }
    });
    
    return Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // 只显示前8种类型
  }, [elements]);

  // 设备信息描述项
  const deviceDescItems = deviceInfo ? [
    {
      key: "model",
      label: "设备型号",
      children: deviceInfo.model || "未知"
    },
    {
      key: "version",
      label: "Android版本",
      children: deviceInfo.version || "未知"
    },
    {
      key: "resolution",
      label: "屏幕分辨率",
      children: deviceInfo.resolution || "未知"
    },
    {
      key: "density",
      label: "屏幕密度",
      children: deviceInfo.density || "未知"
    }
  ] : [];

  return (
    <div className={className}>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* 基础统计 */}
        <Card 
          title={
            <Space>
              <BarChartOutlined />
              <span>页面分析统计</span>
            </Space>
          }
          size="small"
          extra={
            <Space>
              {onRefresh && (
                <Tooltip title="刷新分析">
                  <Button 
                    type="text" 
                    icon={<ReloadOutlined />} 
                    onClick={onRefresh}
                    loading={loading}
                    size="small"
                  />
                </Tooltip>
              )}
              {onExport && (
                <Tooltip title="导出数据">
                  <Button 
                    type="text" 
                    icon={<DownloadOutlined />} 
                    onClick={onExport}
                    size="small"
                  />
                </Tooltip>
              )}
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="总元素数量"
                value={analysisStats.total}
                prefix={<AppstoreOutlined style={{ color: token.colorPrimary }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="可交互元素"
                value={analysisStats.interactive}
                suffix={`/${analysisStats.total}`}
                prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="包含文本"
                value={analysisStats.hasText}
                suffix={`/${analysisStats.total}`}
                prefix={<ExclamationCircleOutlined style={{ color: token.colorInfo }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="有资源ID"
                value={analysisStats.hasResourceId}
                suffix={`/${analysisStats.total}`}
                prefix={<ExclamationCircleOutlined style={{ color: token.colorWarning }} />}
              />
            </Col>
          </Row>
        </Card>

        {/* 元素质量分析 */}
        <Card title="元素质量分析" size="small">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>可点击元素占比</Text>
              <Progress 
                percent={analysisStats.clickablePercent} 
                status={analysisStats.clickablePercent > 20 ? "success" : "normal"}
                strokeColor={token.colorSuccess}
              />
            </div>
            <div>
              <Text strong>文本信息完整度</Text>
              <Progress 
                percent={analysisStats.textPercent} 
                status={analysisStats.textPercent > 50 ? "success" : "normal"}
                strokeColor={token.colorInfo}
              />
            </div>
            <div>
              <Text strong>资源ID覆盖率</Text>
              <Progress 
                percent={analysisStats.idPercent} 
                status={analysisStats.idPercent > 30 ? "success" : "normal"}
                strokeColor={token.colorWarning}
              />
            </div>
          </Space>
        </Card>

        {/* 元素类型分布 */}
        {elementTypes.length > 0 && (
          <Card title="元素类型分布" size="small">
            <Space wrap>
              {elementTypes.map(([type, count]) => (
                <Tag 
                  key={type} 
                  color="blue" 
                  style={{ 
                    marginBottom: token.marginXS,
                    fontSize: token.fontSizeSM 
                  }}
                >
                  {type}: {count}
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {/* 设备信息 */}
        {deviceInfo && (
          <Card title="设备信息" size="small">
            <Descriptions
              size="small"
              column={2}
              items={deviceDescItems}
            />
          </Card>
        )}

        {/* XML内容信息 */}
        {xmlContent && (
          <Card title="XML文档信息" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                <Text strong>文档大小:</Text> {Math.round(xmlContent.length / 1024 * 100) / 100} KB
              </Text>
              <Text>
                <Text strong>XML行数:</Text> {xmlContent.split('\n').length}
              </Text>
              {xmlContent.length > 100000 && (
                <Alert
                  message="XML文档较大"
                  description="XML文档超过100KB，解析可能需要更多时间"
                  type="warning"
                  showIcon
                  style={{ fontSize: token.fontSizeSM }}
                />
              )}
            </Space>
          </Card>
        )}

        {/* 分析建议 */}
        {analysisStats.total > 0 && (
          <Card title="分析建议" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              {analysisStats.clickablePercent < 10 && (
                <Alert
                  message="可交互元素较少"
                  description="页面中可交互元素占比较低，可能不是主要操作页面"
                  type="info"
                  showIcon
                  style={{ fontSize: token.fontSizeSM }}
                />
              )}
              {analysisStats.idPercent < 20 && (
                <Alert
                  message="资源ID覆盖率低"
                  description="建议开发者为重要元素添加resource-id，提高自动化测试的稳定性"
                  type="warning"
                  showIcon
                  style={{ fontSize: token.fontSizeSM }}
                />
              )}
              {analysisStats.total > 100 && (
                <Alert
                  message="页面元素较多"
                  description="页面包含大量UI元素，建议使用筛选功能定位目标元素"
                  type="info"
                  showIcon
                  style={{ fontSize: token.fontSizeSM }}
                />
              )}
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
};