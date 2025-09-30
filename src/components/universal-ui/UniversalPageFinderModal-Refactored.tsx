/**
 * Universal UI智能页面查找模态框 - 重构版本
 * 使用模块化组件，控制在 500 行以内
 */

import React, { useState, useEffect } from "react";
import "./UniversalPageFinder.css";
import "./styles/universal-ui-integration.css";
import {
  Modal,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Spin,
  message,
  theme,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  MobileOutlined,
  EyeOutlined,
  FilterOutlined,
  BugOutlined,
  CheckOutlined,
} from "@ant-design/icons";

// 导入模块化组件
import {
  DeviceSelector,
  ViewModeSelector,
  ElementList,
  AnalysisPanel,
  usePageFinderModal
} from "./page-finder-modal";
import type {
  ViewMode,
  XmlSnapshot,
  UIElement,
  NodeLocator
} from "./page-finder-modal";

// 保留必要的依赖（用于高级功能）
import { useAdb } from "../../application/hooks/useAdb";
import UniversalUIAPI from "../../api/universalUIAPI";
import VisualPageAnalyzer from "../VisualPageAnalyzer";
import { ErrorBoundary } from "../ErrorBoundary";
import { CacheHistoryPanel } from "./views/cache-view";

// 导入视图组件
import {
  VisualElementView,
  ElementListView,
  UIElementTree,
  GridElementView,
  ScrcpyControlView,
} from "./views";

const { Text, Title } = Typography;

export interface UniversalPageFinderModalProps {
  visible: boolean;
  onClose: () => void;
  onElementSelected?: (element: UIElement) => void;
  snapshotOnlyMode?: boolean;
  onSnapshotCaptured?: (snapshot: XmlSnapshot) => void;
  onXmlContentUpdated?: (
    xmlContent: string,
    deviceInfo?: any,
    pageInfo?: any
  ) => void;
  onSnapshotUpdated?: (snapshot: XmlSnapshot) => void;
  initialViewMode?: ViewMode;
  loadFromStepXml?: {
    stepId: string;
    xmlCacheId?: string;
    xmlContent?: string;
    deviceId?: string;
    deviceName?: string;
  };
  preselectLocator?: NodeLocator;
  onApplyCriteria?: (criteria: {
    strategy: string;
    fields: string[];
    values: Record<string, string>;
    includes?: Record<string, string[]>;
    excludes?: Record<string, string[]>;
    matchMode?: Record<string, "equals" | "contains" | "regex">;
    regexIncludes?: Record<string, string[]>;
    regexExcludes?: Record<string, string[]>;
  }) => void;
  initialMatching?: any;
}

const UniversalPageFinderModal: React.FC<UniversalPageFinderModalProps> = ({
  visible,
  onClose,
  onElementSelected,
  snapshotOnlyMode,
  onSnapshotCaptured,
  onXmlContentUpdated,
  onSnapshotUpdated,
  initialViewMode = "visual",
  loadFromStepXml,
  preselectLocator,
  onApplyCriteria,
  initialMatching,
}) => {
  const { token } = theme.useToken();
  
  // 使用模块化的 Hook
  const {
    selectedDevice,
    setSelectedDevice,
    loading,
    setLoading,
    xmlContent,
    setXmlContent,
    elements,
    setElements,
    deviceInfo,
    setDeviceInfo,
    snapshots,
    refreshDevices,
    captureCurrentPage,
    loadXmlSnapshot,
    createSnapshot
  } = usePageFinderModal();

  // 本地状态
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedElementId, setSelectedElementId] = useState<string>("");
  const [uiElements, setUIElements] = useState<UIElement[]>([]);

  // ADB 集成
  const { devices, isConnecting } = useAdb();

  // 初始化逻辑
  useEffect(() => {
    if (visible && snapshotOnlyMode && selectedDevice) {
      handleSnapshotCapture();
    }
  }, [visible, snapshotOnlyMode, selectedDevice]);

  // 快照捕获
  const handleSnapshotCapture = async () => {
    if (!selectedDevice) {
      message.error("请先选择设备");
      return;
    }

    try {
      setLoading(true);
      const xmlData = await captureCurrentPage(selectedDevice);
      
      if (xmlData) {
        const snapshot = createSnapshot(xmlData, deviceInfo);
        onSnapshotCaptured?.(snapshot);
        onSnapshotUpdated?.(snapshot);
        
        if (snapshotOnlyMode) {
          onClose();
        }
      }
    } catch (error) {
      console.error("快照捕获失败:", error);
      message.error("快照捕获失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 元素选择处理
  const handleElementSelect = (element: UIElement) => {
    setSelectedElementId(element.resourceId || "");
    onElementSelected?.(element);
  };

  // 从缓存加载页面
  const handleCachedPageSelect = async (page: any) => {
    try {
      setLoading(true);
      const success = await loadXmlSnapshot(page);
      if (success) {
        message.success("已加载缓存页面");
      }
    } catch (error) {
      console.error("加载缓存页面失败:", error);
      message.error("加载缓存页面失败");
    } finally {
      setLoading(false);
    }
  };

  // 应用匹配条件
  const handleApplyCriteria = async (criteria: any) => {
    try {
      onApplyCriteria?.(criteria);
      message.success("匹配条件已应用");
      onClose();
    } catch (error) {
      console.error("应用匹配条件失败:", error);
      message.error("应用匹配条件失败");
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    if (selectedDevice) {
      await handleSnapshotCapture();
    } else {
      await refreshDevices();
    }
  };

  // 导出数据
  const handleExport = () => {
    if (xmlContent) {
      const blob = new Blob([xmlContent], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ui_dump_${selectedDevice}_${Date.now()}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      message.success("XML文件已导出");
    }
  };

  // 渲染视图内容
  const renderViewContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>正在分析页面...</div>
        </div>
      );
    }

    switch (viewMode) {
      case "visual":
        return (
          <ErrorBoundary>
            <VisualElementView
              elements={elements}
              selectedElementId={selectedElementId}
              onElementSelect={handleElementSelect}
            />
          </ErrorBoundary>
        );
      
      case "tree":
        return (
          <ErrorBoundary>
            <UIElementTree
              elements={uiElements}
              onElementSelect={(selectedElements) => {
                if (selectedElements.length > 0) {
                  handleElementSelect(selectedElements[0]);
                }
              }}
            />
          </ErrorBoundary>
        );
      
      case "list":
        return (
          <ElementList
            elements={uiElements}
            onElementInspect={handleElementSelect}
            onElementCopy={(element) => {
              navigator.clipboard.writeText(JSON.stringify(element, null, 2));
              message.success("元素信息已复制");
            }}
            loading={loading}
          />
        );
      
      case "grid":
        return (
          <ErrorBoundary>
            <GridElementView
              xmlContent={xmlContent}
              elements={elements}
              onElementSelect={handleElementSelect}
              selectedElementId={selectedElementId}
              locator={preselectLocator}
              onApplyCriteria={handleApplyCriteria}
            />
          </ErrorBoundary>
        );
      
      case "mirror":
        return <ScrcpyControlView />;
      
      default:
        return (
          <Alert
            message="暂无页面数据"
            description="请先获取页面信息或选择其他视图"
            type="info"
            showIcon
          />
        );
    }
  };

  return (
    <Modal
      title="Universal UI 智能页面查找器"
      open={visible}
      onCancel={onClose}
      width="98vw"
      style={{ top: 10 }}
      footer={null}
      className="universal-page-finder"
      styles={{
        body: {
          padding: token.padding,
        },
      }}
    >
      <Row gutter={[16, 16]} style={{ flexWrap: "nowrap", height: "80vh" }}>
        {/* 左侧控制面板 */}
        <Col flex="0 0 300px" style={{ minWidth: 300 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {/* 设备选择器 */}
            <DeviceSelector
              devices={devices}
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
              onRefreshDevices={refreshDevices}
              onCaptureClick={handleSnapshotCapture}
              loading={loading || isConnecting}
            />

            {/* 视图模式选择器 */}
            <ViewModeSelector
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              elementCount={elements.length || uiElements.length}
              loading={loading}
            />

            {/* 分析面板 */}
            <AnalysisPanel
              elements={uiElements}
              loading={loading}
              xmlContent={xmlContent}
              deviceInfo={deviceInfo}
              onRefresh={handleRefresh}
              onExport={handleExport}
            />

            {/* 缓存历史面板 */}
            <CacheHistoryPanel 
              onPageSelected={handleCachedPageSelect} 
            />
          </Space>
        </Col>

        {/* 右侧主要内容区域 */}
        <Col flex="1 1 auto" style={{ minWidth: 0, overflow: "hidden" }}>
          <div style={{ 
            height: "100%", 
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadius,
            backgroundColor: token.colorBgContainer,
            overflow: "hidden"
          }}>
            {renderViewContent()}
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

// 同时提供命名导出和默认导出，确保兼容性
export { UniversalPageFinderModal };
export default UniversalPageFinderModal;