/**
 * Page Finder Modal 主要状态管理 Hook
 * 从 UniversalPageFinderModal.tsx 中提取的状态逻辑
 */

import { useState, useEffect } from "react";
import { App } from "antd";
import { useAdb } from "../../../../application/hooks/useAdb";
import { UniversalUIAPI } from "../../../../api/universal-ui/UniversalUIAPI";
import type { UIElement } from "../../../../api/universal-ui/types";
import { transformUIElement } from "../../types/index";
import type {
  XmlSnapshot,
  VisualUIElement,
  ViewMode,
  UIMatchCriteria,
  NodeLocator
} from "../types";

export interface UsePageFinderModalProps {
  visible: boolean;
  snapshotOnlyMode?: boolean;
  initialViewMode?: ViewMode;
  loadFromStepXml?: {
    stepId: string;
    xmlCacheId?: string;
    xmlContent?: string;
    deviceId?: string;
    deviceName?: string;
  };
  preselectLocator?: NodeLocator;
  initialMatching?: UIMatchCriteria;
  onSnapshotCaptured?: (snapshot: XmlSnapshot) => void;
  onXmlContentUpdated?: (xmlContent: string, deviceInfo?: any, pageInfo?: any) => void;
  onSnapshotUpdated?: (snapshot: XmlSnapshot) => void;
}

export interface UsePageFinderModalReturn {
  // 状态
  selectedDevice: string;
  loading: boolean;
  xmlContent: string;
  setXmlContent: (content: string) => void;
  currentXmlCacheId: string;
  viewMode: ViewMode;
  uiElements: UIElement[];
  elements: VisualUIElement[];
  deviceInfo: any;
  setDeviceInfo: (info: any) => void;
  snapshots: XmlSnapshot[];
  
  // 设备相关
  devices: any[];
  
  // 操作方法
  setSelectedDevice: (deviceId: string) => void;
  setLoading: (loading: boolean) => void;
  setElements: (elements: VisualUIElement[]) => void;
  refreshDevices: () => Promise<void>;
  captureCurrentPage: (deviceId: string) => Promise<string | null>;
  loadXmlSnapshot: (cachedPage: any) => Promise<boolean>;
  createSnapshot: (xmlContent: string, deviceInfo?: any) => XmlSnapshot;
  setCurrentXmlCacheId: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setUIElements: (elements: UIElement[]) => void;
  
  // 业务方法
  handleCaptureCurrentPage: () => Promise<void>;
  handleRefreshDevices: () => Promise<void>;
  handleLoadFromCache: (xmlCacheId: string) => Promise<void>;
}

export const usePageFinderModal = (props: UsePageFinderModalProps): UsePageFinderModalReturn => {
  const {
    visible,
    snapshotOnlyMode,
    initialViewMode = "visual",
    loadFromStepXml,
    preselectLocator,
    initialMatching,
    onSnapshotCaptured,
    onXmlContentUpdated,
    onSnapshotUpdated
  } = props;

  // 获取 App 上下文中的 message API
  const { message } = App.useApp();

  // 核心状态
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentXmlContent, setCurrentXmlContent] = useState<string>("");
  const [currentXmlCacheId, setCurrentXmlCacheId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [uiElements, setUIElements] = useState<UIElement[]>([]);
  const [elements, setElements] = useState<VisualUIElement[]>([]);

  // 使用 ADB Hook
  const { devices, refreshDevices } = useAdb();

  // 设备自动选择逻辑
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      // 如果有来自步骤XML的设备信息，优先选择
      if (loadFromStepXml?.deviceId) {
        const foundDevice = devices.find(d => d.id === loadFromStepXml.deviceId);
        if (foundDevice) {
          setSelectedDevice(foundDevice.id);
          return;
        }
      }
      
      // 否则选择第一个在线设备
      const onlineDevice = devices.find(d => d.isOnline());
      if (onlineDevice) {
        setSelectedDevice(onlineDevice.id);
      }
    }
  }, [devices, selectedDevice, loadFromStepXml?.deviceId]);

  // 模态框打开时的初始化逻辑
  useEffect(() => {
    if (visible) {
      handleInitialize();
    }
  }, [visible, loadFromStepXml]);

  // 初始化处理
  const handleInitialize = async () => {
    if (loadFromStepXml?.xmlContent) {
      // 如果有预加载的XML内容，直接使用
      await handleLoadXmlContent(loadFromStepXml.xmlContent);
    } else if (snapshotOnlyMode && selectedDevice) {
      // 仅快照模式，立即采集
      await handleCaptureCurrentPage();
    }
  };

  // 处理加载XML内容
  const handleLoadXmlContent = async (xmlContent: string) => {
    try {
      setLoading(true);
      setCurrentXmlContent(xmlContent);
      
      // 解析UI元素
      const parsedElements = await UniversalUIAPI.extractPageElements(xmlContent);
      setUIElements(parsedElements);
      
      // 转换为可视化元素并设置给 VisualElementView
      const visualElements = parsedElements.map(transformUIElement);
      setElements(visualElements);
      
      // 创建快照
      const snapshot: XmlSnapshot = {
        id: `snapshot_${Date.now()}`,
        xmlContent,
        deviceInfo: loadFromStepXml?.deviceId ? { 
          id: loadFromStepXml.deviceId,
          name: loadFromStepXml.deviceName || "未知设备"
        } : undefined,
        pageInfo: { source: "step_xml" },
        timestamp: Date.now()
      };
      
      // 通知父组件
      onXmlContentUpdated?.(xmlContent, snapshot.deviceInfo, snapshot.pageInfo);
      onSnapshotUpdated?.(snapshot);
      
      message.success("XML内容加载成功");
    } catch (error) {
      console.error("加载XML内容失败:", error);
      message.error("加载XML内容失败");
    } finally {
      setLoading(false);
    }
  };

  // 采集当前页面
  const handleCaptureCurrentPage = async () => {
    if (!selectedDevice) {
      message.warning("请先选择设备");
      return;
    }

    try {
      setLoading(true);
      
      const result = await UniversalUIAPI.analyzeUniversalUIPage(selectedDevice);
      const xmlContent = result.xmlContent;
      setCurrentXmlContent(xmlContent);
      
      const parsedElements = await UniversalUIAPI.extractPageElements(xmlContent);
      setUIElements(parsedElements);
      
      // 创建快照
      const snapshot: XmlSnapshot = {
        id: `snapshot_${Date.now()}`,
        xmlContent,
        deviceInfo: { id: selectedDevice },
        pageInfo: { source: "live_capture" },
        timestamp: Date.now()
      };
      
      // 仅快照模式直接返回快照
      if (snapshotOnlyMode) {
        onSnapshotCaptured?.(snapshot);
        return;
      }
      
      // 通知父组件
      onXmlContentUpdated?.(xmlContent, snapshot.deviceInfo, snapshot.pageInfo);
      onSnapshotUpdated?.(snapshot);
      
      message.success("页面采集成功");
    } catch (error) {
      console.error("采集页面失败:", error);
      message.error("采集页面失败");
    } finally {
      setLoading(false);
    }
  };

  // 刷新设备列表
  const handleRefreshDevices = async () => {
    try {
      await refreshDevices();
      message.success("设备列表已刷新");
    } catch (error) {
      console.error("刷新设备失败:", error);
      message.error("刷新设备失败");
    }
  };

  // 从缓存加载
  const handleLoadFromCache = async (cachedPageOrId: any) => {
    try {
      setLoading(true);
      
      // 如果传入的是 CachedXmlPage 对象，直接使用
      let cachedPage = cachedPageOrId;
      
      // 如果传入的是字符串 ID，需要先查找对应的页面（这里暂时跳过，直接处理对象）
      if (typeof cachedPageOrId === 'string') {
        console.warn("传入的是 ID，但当前实现需要完整的 CachedXmlPage 对象");
        throw new Error("需要完整的 CachedXmlPage 对象来加载内容");
      }
      
      console.log("🔄 从缓存加载页面:", cachedPage);
      
      // 使用 XmlPageCacheService 加载真实的 XML 内容
      const { XmlPageCacheService } = await import("../../../../services/XmlPageCacheService");
      const pageContent = await XmlPageCacheService.loadPageContent(cachedPage);
      
      console.log("📄 加载的 XML 内容长度:", pageContent.xmlContent.length);
      console.log("🎯 提取的 UI 元素数量:", pageContent.elements.length);
      
      setCurrentXmlCacheId(cachedPage.fileName || cachedPage.id);
      await handleLoadXmlContent(pageContent.xmlContent);
      
    } catch (error) {
      console.error("❌ 从缓存加载失败:", error);
      message.error(`从缓存加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    // 状态
    selectedDevice,
    loading,
    xmlContent: currentXmlContent,
    setXmlContent: setCurrentXmlContent,
    currentXmlCacheId,
    viewMode,
    uiElements,
    elements,
    deviceInfo: {},
    setDeviceInfo: () => {},
    snapshots: [],
    devices,
    
    // 状态设置方法
    setSelectedDevice,
    setLoading,
    setElements,
    refreshDevices: handleRefreshDevices,
    captureCurrentPage: async (deviceId: string) => {
      await handleCaptureCurrentPage();
      return currentXmlContent || null;
    },
    loadXmlSnapshot: async (cachedPage: any) => {
      await handleLoadFromCache(cachedPage);
      return true;
    },
    createSnapshot: (xmlContent: string, deviceInfo?: any) => ({
      id: Date.now().toString(),
      xmlContent,
      deviceInfo,
      pageInfo: {},
      timestamp: Date.now()
    }),
    setCurrentXmlCacheId,
    setViewMode,
    setUIElements,
    
    // 业务方法
    handleCaptureCurrentPage,
    handleRefreshDevices,
    handleLoadFromCache
  };
};