// src/pages/SmartScriptBuilderPage/hooks/page-finder/usePageFinderModular.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { theme } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { SnapshotHandler } from './handlers/SnapshotHandler';
import { ElementSelectionHandler } from './handlers/ElementSelectionHandler';
import { 
  UsePageFinderDeps, 
  UsePageFinderReturn, 
  PageAnalyzerOptions, 
  SnapshotFixMode,
  DeviceInfo 
} from './types/index';

/**
 * 模块化的页面查找器Hook
 * 将原有的840行代码分解为多个处理器类
 */
export const usePageFinderModular = (deps: UsePageFinderDeps): UsePageFinderReturn => {
  const { token } = theme.useToken();
  const [form] = useForm();

  // 状态管理
  const [isVisible, setIsVisible] = useState(false);
  const [currentXmlContent, setCurrentXmlContent] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fixMode, setFixMode] = useState<SnapshotFixMode>('none');
  const [analyzerOptions, setAnalyzerOptions] = useState<PageAnalyzerOptions>({
    enableChildNodeExtraction: true,
    enableParentNodeExtraction: true,
    enableAdvancedMatching: true,
    maxDepth: 3,
  });

  // 模拟设备信息（简化版本）
  const deviceInfo: DeviceInfo | null = useMemo(() => ({
    id: 'mock-device',
    name: 'Mock Device',
    isOnline: true,
  }), []);

  // 处理器实例
  const snapshotHandlerRef = useRef<SnapshotHandler | null>(null);
  const elementSelectionHandlerRef = useRef<ElementSelectionHandler | null>(null);

  // 初始化处理器
  const initializeHandlers = useCallback(() => {
    if (!snapshotHandlerRef.current) {
      snapshotHandlerRef.current = new SnapshotHandler(
        form,
        currentXmlContent,
        setCurrentXmlContent
      );
    }

    if (!elementSelectionHandlerRef.current) {
      elementSelectionHandlerRef.current = new ElementSelectionHandler(
        currentXmlContent,
        deviceInfo?.id || '',
        setSelectedElement
      );
    }
  }, [form, currentXmlContent, deviceInfo]);

  // 确保处理器已初始化
  React.useEffect(() => {
    initializeHandlers();
  }, [initializeHandlers]);

  // 打开模态框
  const openModal = useCallback(async () => {
    setIsVisible(true);
    setIsLoading(true);
    
    try {
      initializeHandlers();
      // 模拟快照捕获
      setCurrentXmlContent('<mockxml>Mock XML Content</mockxml>');
      deps.onSnapshotUpdate?.('<mockxml>Mock XML Content</mockxml>');
    } catch (error) {
      console.error('打开页面分析器失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [initializeHandlers, deps]);

  // 关闭模态框
  const closeModal = useCallback(() => {
    setIsVisible(false);
    setSelectedElement(null);
    setCurrentXmlContent('');
    setFixMode('none');
  }, []);

  // 刷新快照
  const refreshSnapshot = useCallback(async () => {
    setIsLoading(true);
    try {
      // 模拟快照刷新
      const newXml = '<mockxml>Refreshed Mock XML Content</mockxml>';
      setCurrentXmlContent(newXml);
      deps.onSnapshotUpdate?.(newXml);
    } catch (error) {
      console.error('刷新快照失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deps]);

  // 处理元素选择
  const handleElementSelect = useCallback(async (element: any) => {
    setSelectedElement(element);
    deps.onElementSelected?.(element);
    
    // 模拟步骤生成
    const mockStep = {
      id: Date.now().toString(),
      action: 'click',
      target: element,
      parameters: {},
    };
    deps.onStepGenerated?.(mockStep);
  }, [deps]);

  // 应用快照修复
  const applySnapshotFix = useCallback(async (mode: SnapshotFixMode) => {
    setFixMode(mode);
    setIsLoading(true);
    
    try {
      if (mode === 'reload') {
        await refreshSnapshot();
      } else if (mode === 'clear') {
        setCurrentXmlContent('');
        setSelectedElement(null);
      }
    } catch (error) {
      console.error('应用快照修复失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshSnapshot]);

  // 更新分析器选项
  const updateAnalyzerOptions = useCallback((options: Partial<PageAnalyzerOptions>) => {
    setAnalyzerOptions(prev => ({ ...prev, ...options }));
  }, []);

  // 返回Hook接口
  return {
    // 状态
    isVisible,
    isLoading,
    currentXmlContent,
    selectedElement,
    fixMode,
    analyzerOptions,
    deviceInfo,
    
    // 操作方法
    openModal,
    closeModal,
    refreshSnapshot,
    handleElementSelect,
    applySnapshotFix,
    updateAnalyzerOptions,
    
    // 处理器访问（调试用）
    snapshotHandler: snapshotHandlerRef.current,
    elementSelectionHandler: elementSelectionHandlerRef.current,
  };
};

export default usePageFinderModular;