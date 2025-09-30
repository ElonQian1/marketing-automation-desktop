import { useState, useCallback, useMemo } from 'react';
import type { 
  UIElement, 
  ElementFilter, 
  PageAnalyzerState 
} from '../types';

/**
 * 页面分析器状态管理Hook
 * 负责管理页面分析器的核心状态和操作
 * 文件大小: ~180行
 */
export const usePageAnalyzerState = () => {
  // 基础状态
  const [state, setState] = useState<PageAnalyzerState>({
    xmlContent: null,
    elements: [],
    selectedElement: null,
    searchKeyword: '',
    filteredElements: [],
    matchCriteria: null,
    showGrid: true,
    showBounds: true,
    isLoading: false,
    error: null,
  });

  // 设置XML内容并解析元素
  const setXmlContent = useCallback((xmlContent: string) => {
    setState(prev => ({
      ...prev,
      xmlContent,
      isLoading: true,
      error: null,
    }));

    try {
      // 这里应该调用XML解析服务
      // const elements = parseXmlToElements(xmlContent);
      // 暂时使用空数组，实际实现时会调用解析服务
      const elements: UIElement[] = [];
      
      setState(prev => ({
        ...prev,
        elements,
        filteredElements: elements,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '解析XML失败',
        isLoading: false,
      }));
    }
  }, []);

  // 设置选中元素
  const setSelectedElement = useCallback((element: UIElement | null) => {
    setState(prev => ({
      ...prev,
      selectedElement: element,
    }));
  }, []);

  // 搜索元素
  const searchElements = useCallback((keyword: string) => {
    setState(prev => {
      const filteredElements = keyword.trim() === '' 
        ? prev.elements
        : prev.elements.filter(element => 
            element.text.toLowerCase().includes(keyword.toLowerCase()) ||
            element.resourceId.toLowerCase().includes(keyword.toLowerCase()) ||
            element.contentDesc.toLowerCase().includes(keyword.toLowerCase()) ||
            element.className.toLowerCase().includes(keyword.toLowerCase())
          );

      return {
        ...prev,
        searchKeyword: keyword,
        filteredElements,
      };
    });
  }, []);

  // 应用过滤器
  const applyFilter = useCallback((filter: ElementFilter) => {
    setState(prev => {
      let filteredElements = prev.elements;

      // 文本过滤
      if (filter.text) {
        const keyword = filter.text.toLowerCase();
        filteredElements = filteredElements.filter(element =>
          element.text.toLowerCase().includes(keyword) ||
          element.resourceId.toLowerCase().includes(keyword) ||
          element.contentDesc.toLowerCase().includes(keyword)
        );
      }

      // 类型过滤
      if (filter.type) {
        filteredElements = filteredElements.filter(element =>
          element.type === filter.type
        );
      }

      // 可点击过滤
      if (filter.clickable !== undefined) {
        filteredElements = filteredElements.filter(element =>
          element.clickable === filter.clickable
        );
      }

      // 有文本过滤
      if (filter.hasText !== undefined) {
        filteredElements = filteredElements.filter(element =>
          filter.hasText ? element.text.trim() !== '' : element.text.trim() === ''
        );
      }

      // 有资源ID过滤
      if (filter.hasResourceId !== undefined) {
        filteredElements = filteredElements.filter(element =>
          filter.hasResourceId ? element.resourceId.trim() !== '' : element.resourceId.trim() === ''
        );
      }

      // 包名过滤
      if (filter.package) {
        filteredElements = filteredElements.filter(element =>
          element.package === filter.package
        );
      }

      return {
        ...prev,
        filteredElements,
      };
    });
  }, []);

  // 切换网格显示
  const toggleGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      showGrid: !prev.showGrid,
    }));
  }, []);

  // 切换边界显示
  const toggleBounds = useCallback(() => {
    setState(prev => ({
      ...prev,
      showBounds: !prev.showBounds,
    }));
  }, []);

  // 设置匹配条件
  const setMatchCriteria = useCallback((criteria: PageAnalyzerState['matchCriteria']) => {
    setState(prev => ({
      ...prev,
      matchCriteria: criteria,
    }));
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // 重置状态
  const resetState = useCallback(() => {
    setState({
      xmlContent: null,
      elements: [],
      selectedElement: null,
      searchKeyword: '',
      filteredElements: [],
      matchCriteria: null,
      showGrid: true,
      showBounds: true,
      isLoading: false,
      error: null,
    });
  }, []);

  // 计算统计信息
  const statistics = useMemo(() => {
    const { elements, filteredElements } = state;
    
    return {
      totalElements: elements.length,
      filteredElements: filteredElements.length,
      clickableElements: elements.filter(e => e.clickable).length,
      editableElements: elements.filter(e => e.editable).length,
      elementsWithText: elements.filter(e => e.text.trim() !== '').length,
      elementsWithResourceId: elements.filter(e => e.resourceId.trim() !== '').length,
      uniqueTypes: [...new Set(elements.map(e => e.type))].length,
      uniquePackages: [...new Set(elements.map(e => e.package))].length,
    };
  }, [state.elements, state.filteredElements]);

  return {
    // 状态
    ...state,
    statistics,
    
    // 操作方法
    setXmlContent,
    setSelectedElement,
    searchElements,
    applyFilter,
    toggleGrid,
    toggleBounds,
    setMatchCriteria,
    clearError,
    resetState,
  };
};