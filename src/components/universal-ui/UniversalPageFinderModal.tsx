// src/components/universal-ui/UniversalPageFinderModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Universal UI智能页面查找模态框 - 重构版本
 * 使用模块化组件，控制在 500 行以内
 */

import React, { useState, useEffect } from "react";
import { App, Modal, Button, Space, Typography, Row, Col, Alert } from "antd";
import { CheckOutlined } from "@ant-design/icons";

// 导入模块化组件
import { ElementList, usePageFinderModal } from "./page-finder-modal";
import LeftControlPanel from "./page-finder-modal/panels/LeftControlPanel";
import { FilterSettingsPanel } from "./page-finder-modal";
import type { ElementWithHierarchy } from "./views/tree-view/types";
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
import { ElementFilter, ModuleFilterFactory } from "../../services/ui-element-filter";
import { FilterAdapter, type VisualFilterConfig, defaultVisualFilterConfig } from "../../services/ui-filter-adapter";
import { useElementSelectionManager, ZIndexManager, useZIndexManager } from "./element-selection";
import { convertVisualToUIElement } from "./views/visual-view";
import type { VisualUIElement } from "./types";
import { isDevDebugEnabled } from "../../utils/debug";
import MainViewContainer from "./page-finder-modal/panels/MainViewContainer";
import SelectionPopoverContainer from "./page-finder-modal/panels/SelectionPopoverContainer";

const { Text, Title } = Typography;

export interface UniversalPageFinderModalProps {
  visible: boolean;
  onClose: () => void;
  onElementSelected?: (element: UIElement) => void;
  onQuickCreate?: (element: UIElement) => void; // 🆕 支持快速创建步骤回调
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
  onQuickCreate, // 🆕 快速创建回调
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
  // 使用实例化 message，避免静态 message 的上下文告警
  const { message } = App.useApp();
  
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
    uiElements,
    deviceInfo,
    setDeviceInfo,
    snapshots,
    refreshDevices,
    captureCurrentPage,
    loadXmlSnapshot,
    createSnapshot,
    screenshotUrl
  } = usePageFinderModal({
    visible,
    snapshotOnlyMode,
    initialViewMode,
    loadFromStepXml,
    preselectLocator,
    initialMatching,
    onSnapshotCaptured,
    onXmlContentUpdated,
    onSnapshotUpdated,
  });

  // 本地状态
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedElementId, setSelectedElementId] = useState<string>("");
  // 🆕 过滤设置 - 🔧 强制禁用所有过滤器
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterConfig, setFilterConfig] = useState<VisualFilterConfig>(() => {
    // 🔧 临时修复：强制使用无过滤配置，忽略localStorage
    console.log('🔧 [Debug] 强制重置过滤器配置为无过滤状态');
    return {
      onlyClickable: false,
      treatButtonAsClickable: true,
      requireTextOrDesc: false,
      minWidth: 1,
      minHeight: 1,
      includeClasses: [],
      excludeClasses: [],
    };
  });
  const persistFilter = (cfg: VisualFilterConfig) => {
    setFilterConfig(cfg);
    try { localStorage.setItem('visualFilterConfig', JSON.stringify(cfg)); } catch {}
  };
  
  // 元素选择管理器
  const selectionManager = useElementSelectionManager(
    uiElements,
    (element) => {
      if (isDevDebugEnabled('debug:visual')) {
        console.debug('🎯 [UniversalPageFinderModal] 元素被选择:', element?.id);
      }
      setSelectedElementId(element.id || element.resource_id || "");
      onElementSelected?.(element);
    }
  );

  // 🆕 Z轴层级管理
  const modalZIndexManager = useZIndexManager('universal-page-finder-modal', 'modal');
  
  // 🆕 模态框生命周期管理 - 关闭时清理气泡状态
  useEffect(() => {
    if (!visible) {
      if (isDevDebugEnabled('debug:visual')) {
        console.debug('🚪 [UniversalPageFinderModal] 模态框关闭，清理所有状态');
      }
      
      // 延迟清理，确保关闭动画完成
      const cleanup = setTimeout(() => {
        selectionManager.clearAllStates?.();
        modalZIndexManager.unregisterComponent();
      }, 300); // 等待模态框关闭动画
      
      return () => clearTimeout(cleanup);
    } else {
      // 模态框打开时注册Z轴层级
      modalZIndexManager.registerComponent();
    }
  }, [visible]); // 🔧 只依赖visible，避免循环

  // 🆕 组件卸载时的清理
  useEffect(() => {
    return () => {
      if (isDevDebugEnabled('debug:visual')) {
        console.debug('🗑️ [UniversalPageFinderModal] 组件卸载，执行最终清理');
      }
      selectionManager.clearAllStates?.();
      modalZIndexManager.unregisterComponent();
      
      // 清理全局状态
      const zIndexManager = ZIndexManager.getInstance();
      zIndexManager.clearAllModals();
    };
  }, []); // 🔧 空依赖数组，只在卸载时执行一次

  // 🔧 优化调试日志，减少频繁输出
  React.useEffect(() => {
    if (isDevDebugEnabled('debug:visual') && selectionManager.pendingSelection) {
      console.debug('🔍 [UniversalPageFinderModal] 选择状态变化:', {
        elementId: selectionManager.pendingSelection.element.id,
        uiElementsCount: uiElements.length
      });
    }
  }, [selectionManager.pendingSelection?.element.id, uiElements.length]); // 🔧 优化依赖

  // 使用 Hook 中的 UI 元素状态，不要创建重复的本地状态
  // const [uiElements, setUIElements] = useState<UIElement[]>([]);

  // ADB 集成
  const adbData = useAdb();
  const devices = adbData.devices || [];

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
  const handleElementSelect = (element: UIElement | ElementWithHierarchy) => {
    setSelectedElementId(element.id || element.resource_id || "");
    onElementSelected?.(element as UIElement);
  };

  // 可视化/网格视图选中（将 VisualUIElement 适配为 UIElement）
  const handleVisualElementSelect = (element: VisualUIElement) => {
    const ui = convertVisualToUIElement(element);
    handleElementSelect(ui as unknown as UIElement);
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
    switch (viewMode) {
      case "visual":
        return (
          <ErrorBoundary>
            <VisualElementView
              elements={elements as any}
              selectedElementId={selectedElementId}
              onElementSelect={handleVisualElementSelect}
              selectionManager={selectionManager}
              originalUIElements={uiElements}
              screenshotUrl={screenshotUrl}
              filterConfig={filterConfig}
            />
          </ErrorBoundary>
        );
      
      case "tree":
        // ✅ 使用新的独立过滤器模块，为元素发现提供完整元素列表
        const discoveryElements = ModuleFilterFactory.forElementDiscovery(uiElements);
        const elementsWithHierarchy = discoveryElements.map((element, index) => ({
          ...element,
          depth: 0, // 默认深度
          originalIndex: index
        }));
        
        return (
          <ErrorBoundary>
            <UIElementTree
              elements={elementsWithHierarchy}
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
            filterConfig={filterConfig}
          />
        );
      
      case "grid":
        return (
          <ErrorBoundary>
            <GridElementView
              xmlContent={xmlContent}
              elements={FilterAdapter.smartFilter(elements as any, 'discovery') as any}
              onElementSelect={handleVisualElementSelect}
              selectedElementId={selectedElementId}
              locator={preselectLocator}
              onApplyCriteria={handleApplyCriteria}
              screenshotUrl={screenshotUrl}
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
      width="90%"
      footer={null}
      destroyOnHidden
    >
      <Row gutter={16}>
        {/* 左侧控制面板 */}
        <Col xs={24} md={8} lg={7} xl={6}>
          <LeftControlPanel
            devices={devices}
            selectedDevice={selectedDevice}
            onDeviceSelect={setSelectedDevice}
            onRefreshDevices={refreshDevices}
            onCaptureCurrentPage={handleSnapshotCapture}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            elementCount={elements.length || uiElements.length}
            onOpenFilterSettings={() => setFilterOpen(true)}
            onResetFilters={() => { persistFilter(defaultVisualFilterConfig); message.success('已重置过滤规则'); }}
            elements={uiElements}
            xmlContent={xmlContent}
            deviceInfo={deviceInfo}
            onRefresh={handleRefresh}
            onExport={handleExport}
            onCachedPageSelected={handleCachedPageSelect}
          />
        </Col>

        {/* 右侧主要内容区域 */}
        <Col xs={24} md={16} lg={17} xl={18}>
          <MainViewContainer loading={loading} content={renderViewContent()} />
        </Col>
      </Row>

      {/* 元素选择弹出框 */}
      <SelectionPopoverContainer 
        selectionManager={selectionManager} 
        xmlContent={xmlContent} // 🆕 传递XML内容给元素发现功能
        enableIntelligentAnalysis={true} // 🧠 启用智能分析功能
        stepId={`page-finder-${Date.now()}`} // 生成步骤ID
        // 🆕 快速创建步骤卡片回调 - 连接到智能分析工作流
        onQuickCreate={async () => {
          if (selectionManager.pendingSelection?.element) {
            // 优先使用快速创建回调，如果没有则使用传统的元素选择回调
            if (onQuickCreate) {
              onQuickCreate(selectionManager.pendingSelection.element);
            } else {
              onElementSelected?.(selectionManager.pendingSelection.element);
            }
            // 清理选择状态
            selectionManager.confirmSelection();
          }
        }}
      />
      {/* 🆕 过滤设置抽屉（模块化） */}
      <FilterSettingsPanel
        open={filterOpen}
        config={filterConfig}
        onChange={persistFilter}
        onClose={() => setFilterOpen(false)}
  onReset={() => { persistFilter(defaultVisualFilterConfig); message.success('已重置过滤规则'); }}
      />
    </Modal>
  );
};

// 同时提供命名导出和默认导出，确保兼容性
export { UniversalPageFinderModal };
export default UniversalPageFinderModal;