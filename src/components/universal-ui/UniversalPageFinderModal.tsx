/**
 * Universal UI智能页面查找模态框
 * 提供设备连接、页面分析、元素选择功能
 */

import React, { useState, useEffect } from "react";
import "./UniversalPageFinder.css";
import {
  Modal,
  Button,
  Select,
  Card,
  List,
  Input,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Tabs,
  Alert,
  Spin,
  message,
  Divider,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  MobileOutlined,
  EyeOutlined,
  FilterOutlined,
  BugOutlined,
  BranchesOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  EyeInvisibleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useAdb } from "../../application/hooks/useAdb";
import UniversalUIAPI, {
  UIElement,
  ElementBounds,
} from "../../api/universalUIAPI";
import VisualPageAnalyzer from "../VisualPageAnalyzer";
import {
  UniversalElementAnalyzer,
  SmartStepDescriptionGenerator,
  ElementAnalysisResult,
} from "./UniversalElementAnalyzer";
import {
  RealXMLAnalysisService,
  RealElementAnalysis,
} from "../../services/RealXMLAnalysisService";
import { XmlCachePageSelector } from "../xml-cache/XmlCachePageSelector";
import {
  XmlPageCacheService,
  CachedXmlPage,
  XmlPageContent,
} from "../../services/XmlPageCacheService";
import { ErrorBoundary } from "../ErrorBoundary";
// 🆕 使用新的模块化XML解析功能
import {
  parseXML,
  analyzeAppAndPageInfo,
  VisualUIElement,
  VisualElementCategory,
} from "./xml-parser";
import {
  convertVisualToUIElement,
  createElementContext,
} from "./data-transform";
// 🆕 导入增强类型
import type { EnhancedUIElement } from "./xml-parser/types";
// 使用新的独立视图组件
import { VisualElementView, ElementListView, UIElementTree } from "./views";
// 使用新的元素选择模块
import {
  useElementSelectionManager,
  ElementSelectionPopover,
} from "./element-selection";

const { Text, Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

// 从 VisualPageAnalyzer 提取的核心内容组件
interface VisualPageAnalyzerContentProps {
  xmlContent: string;
  onElementSelected?: (element: UIElement) => void;
}

const VisualPageAnalyzerContent: React.FC<VisualPageAnalyzerContentProps> = ({
  xmlContent,
  onElementSelected,
}) => {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 创建完整的ElementContext的辅助函数
  const createElementContext = (element: VisualUIElement): any => {
    return {
      text: element.text,
      contentDesc: element.description,
      resourceId: "",
      className: element.type,
      bounds: `[${element.position.x},${element.position.y}][${
        element.position.x + element.position.width
      },${element.position.y + element.position.height}]`,
      clickable: element.clickable,
      selected: false,
      enabled: true,
      focusable: false,
      scrollable: false,
      checkable: false,
      checked: false,
      position: element.position,
      screenWidth: 1080, // 默认屏幕宽度
      screenHeight: 1920, // 默认屏幕高度
      parentElements: [],
      siblingElements: [],
      childElements: [],
    };
  };

  // 智能分析元素的函数（在VisualPageAnalyzerContent内部）
  const analyzeVisualElement = (
    element: VisualUIElement
  ): ElementAnalysisResult | null => {
    try {
      const elementContext = createElementContext(element);
      return UniversalElementAnalyzer.analyzeElement(
        elementContext,
        "com.xingin.xhs"
      );
    } catch (error) {
      console.error("可视化元素分析失败:", error);
      return null;
    }
  };

  // 智能元素选择处理函数
  const handleSmartElementSelect = (element: VisualUIElement) => {
    if (!element.clickable || !onElementSelected) return;

    // 安全地获取position数据，提供默认值
    const position = element.position || { x: 0, y: 0, width: 100, height: 50 };

    // 转换为 UIElement 格式
    const uiElement: UIElement = {
      id: element.id,
      text: element.text,
      element_type: element.type,
      xpath: "",
      bounds: {
        left: position.x,
        top: position.y,
        right: position.x + position.width,
        bottom: position.y + position.height,
      },
      is_clickable: element.clickable,
      is_scrollable: false,
      is_enabled: true,
      is_focused: false,
      checkable: false,
      checked: false,
      selected: false,
      password: false,
      content_desc: element.description,
    };

    // 执行智能分析
    const analysis = analyzeVisualElement(element);

    // 生成增强的步骤描述
    let smartDescription: string;
    try {
      // 使用真实XML分析服务进行增强分析
      const realAnalysis = RealXMLAnalysisService.analyzeElement(
        element.text || "",
        element.description || "",
        {
          x: element.position?.x || 0,
          y: element.position?.y || 0,
          width: element.position?.width || 0,
          height: element.position?.height || 0,
        },
        element.type || "",
        "com.xingin.xhs",
        element.clickable || false
      );

      smartDescription =
        RealXMLAnalysisService.generateEnhancedStepDescription(realAnalysis);
    } catch (error) {
      console.error("可视化元素真实XML分析失败，使用备用方案:", error);
      smartDescription = analysis
        ? SmartStepDescriptionGenerator.generateStepDescription(
            analysis,
            createElementContext(element)
          )
        : `点击 ${element.text || element.type} 元素`;
    }

    // 🆕 使用简化的增强信息传递方案
    // 直接在UIElement上添加增强信息，保持向后兼容
    const enhancedUIElement = {
      ...uiElement,
      // 增强标识
      isEnhanced: true,
      // XML上下文信息（临时简化方案）
      xmlCacheId: "current_analysis",
      xmlContent: "", // 这里需要从外部传入
      xmlTimestamp: Date.now(),
      // 智能分析结果
      smartAnalysis: analysis,
      smartDescription: smartDescription,
    };

    console.log("🚀 传递增强元素信息给外部:", {
      isEnhanced: enhancedUIElement.isEnhanced,
      xmlCacheId: enhancedUIElement.xmlCacheId,
      hasXmlContent: !!enhancedUIElement.xmlContent,
      enhancedUIElement,
    });

    onElementSelected(enhancedUIElement as any);

    // 显示智能分析结果
    if (analysis) {
      console.log("🎯 可视化元素智能分析结果:", {
        userDescription: analysis.userDescription,
        confidence: analysis.confidence,
        actionSuggestion: analysis.actionSuggestion,
        elementType: analysis.elementType,
      });
    }
  };
  const [showOnlyClickable, setShowOnlyClickable] = useState(false);
  const [elements, setElements] = useState<VisualUIElement[]>([]);
  const [categories, setCategories] = useState<VisualElementCategory[]>([]);

  // UIElement数组用于API调用（提升到组件顶部，确保唯一）
  const convertVisualToUIElement = (
    visualElement: VisualUIElement
  ): UIElement => {
    // 安全地获取position数据，提供默认值
    const position = visualElement.position || {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    };

    return {
      id: visualElement.id,
      text: visualElement.text,
      element_type: visualElement.type,
      xpath: "",
      bounds: {
        left: position.x,
        top: position.y,
        right: position.x + position.width,
        bottom: position.y + position.height,
      },
      is_clickable: visualElement.clickable,
      is_scrollable: false,
      is_enabled: true,
      is_focused: false,
      checkable: false,
      checked: false,
      selected: false,
      password: false,
      content_desc: visualElement.description,
    };
  };

  const uiElements = elements.map(convertVisualToUIElement);

  // 使用新的元素选择管理器
  const selectionManager = useElementSelectionManager(
    uiElements,
    (selectedElement) => {
      // 元素被确认选择后的处理逻辑
      console.log("✅ 用户确认选择元素:", selectedElement);

      // 找到对应的VisualUIElement
      const visualElement = elements.find((el) => el.id === selectedElement.id);
      if (visualElement) {
        handleSmartElementSelect(visualElement);
      }
    }
  );

  // 🆕 使用新模块化的XML解析功能





  // 🆕 使用新模块化的XML解析功能
  const handleXmlParsing = (xmlString: string) => {
    if (!xmlString) return;
    
    try {
      // 使用新的模块化解析器
      const parseResult = parseXML(xmlString);
      
      setElements(parseResult.elements);
      setCategories(parseResult.categories);
      
      console.log('🚀 新模块化XML解析完成:', {
        elementsCount: parseResult.elements.length,
        categoriesCount: parseResult.categories.length,
        appInfo: parseResult.appInfo
      });
      
    } catch (error) {
      console.error('🚨 XML解析失败:', error);
      setElements([]);
      setCategories([]);
    }
  };

  // 解析XML内容
  React.useEffect(() => {
    if (xmlContent) {
      handleXmlParsing(xmlContent);
    }
  }, [xmlContent]);

  // 过滤元素
  const filteredElements = elements.filter((element) => {
    const matchesSearch =
      searchText === "" ||
      element.userFriendlyName
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      element.description.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || element.category === selectedCategory;
    const matchesClickable = !showOnlyClickable || element.clickable;

    return matchesSearch && matchesCategory && matchesClickable;
  });

  // 渲染可视化页面预览
  const renderPagePreview = () => {
    if (elements.length === 0) {
      return (
        <div
          style={{
            width: "100%",
            height: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            backgroundColor: "#f9fafb",
          }}
        >
          <Text type="secondary">等待页面分析数据...</Text>
        </div>
      );
    }

    // 分析设备实际分辨率
    const maxX = Math.max(
      ...elements.map((e) => e.position.x + e.position.width)
    );
    const maxY = Math.max(
      ...elements.map((e) => e.position.y + e.position.height)
    );

    // 智能缩放计算
    // 预览容器的可用空间（减去标题和边距）
    const containerWidth = 380; // 容器宽度
    const containerHeight = 550; // 容器高度（减去标题空间）

    // 计算合适的缩放比例，确保内容可见但不过小
    const scaleX = containerWidth / maxX;
    const scaleY = containerHeight / maxY;
    let scale = Math.min(scaleX, scaleY);

    // 设置最小和最大缩放比例，确保可用性
    const minScale = 0.2; // 最小20%，确保大分辨率设备内容不会太小
    const maxScale = 2.0; // 最大200%，确保小分辨率设备不会过大
    scale = Math.max(minScale, Math.min(maxScale, scale));

    // 计算缩放后的实际尺寸
    const scaledWidth = maxX * scale;
    const scaledHeight = maxY * scale;

    // 智能分析APP和页面信息
    const { appName, pageName } = analyzeAppAndPageInfo(xmlContent);

    return (
      <div
        style={{
          width: "100%",
          height: 600,
          border: "1px solid #4b5563",
          borderRadius: 8,
          backgroundColor: "#1f2937",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: "12px",
            borderBottom: "1px solid #374151",
            backgroundColor: "#111827",
          }}
        >
          <Title
            level={5}
            style={{
              textAlign: "center",
              margin: 0,
              color: "#e5e7eb",
              fontWeight: "bold",
            }}
          >
            📱 {appName}的{pageName}
          </Title>
          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#9ca3af",
              marginTop: "4px",
            }}
          >
            设备分辨率: {maxX} × {maxY} | 缩放比例: {(scale * 100).toFixed(0)}%
          </div>
        </div>

        {/* 可滚动的预览区域 */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            position: "relative",
            backgroundColor: "#1f2937",
          }}
        >
          {/* 设备边框模拟 */}
          <div
            style={{
              width: scaledWidth + 20,
              height: scaledHeight + 20,
              margin: "0 auto",
              position: "relative",
              backgroundColor: "#000",
              borderRadius: "20px",
              padding: "10px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* 实际页面内容区域 */}
            <div
              style={{
                width: scaledWidth,
                height: scaledHeight,
                position: "relative",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {filteredElements.map((element) => {
                const category = categories.find(
                  (cat) => cat.name === element.category
                );

                // 计算元素在缩放后的位置和大小
                const elementLeft = element.position.x * scale;
                const elementTop = element.position.y * scale;
                const elementWidth = Math.max(
                  element.position.width * scale,
                  1
                );
                const elementHeight = Math.max(
                  element.position.height * scale,
                  1
                );

                // 获取元素的显示状态
                const displayState = selectionManager.getElementDisplayState(
                  element.id
                );

                return (
                  <div
                    key={element.id}
                    title={`${element.userFriendlyName}: ${element.description}\n位置: (${element.position.x}, ${element.position.y})\n大小: ${element.position.width} × ${element.position.height}`}
                    style={{
                      position: "absolute",
                      left: elementLeft,
                      top: elementTop,
                      width: elementWidth,
                      height: elementHeight,
                      backgroundColor: category?.color || "#8b5cf6",
                      opacity: displayState.isHidden
                        ? 0.1
                        : displayState.isPending
                        ? 1
                        : element.clickable
                        ? 0.7
                        : 0.4,
                      border: displayState.isPending
                        ? "2px solid #52c41a"
                        : displayState.isHovered
                        ? "2px solid #faad14"
                        : element.clickable
                        ? "1px solid #fff"
                        : "1px solid rgba(255,255,255,0.3)",
                      borderRadius:
                        Math.min(elementWidth, elementHeight) > 10
                          ? "2px"
                          : "1px",
                      cursor: displayState.isHidden
                        ? "default"
                        : element.clickable
                        ? "pointer"
                        : "default",
                      transition: "all 0.2s ease",
                      zIndex: displayState.isPending
                        ? 50
                        : displayState.isHovered
                        ? 30
                        : element.clickable
                        ? 10
                        : 5,
                      transform: displayState.isPending
                        ? "scale(1.1)"
                        : displayState.isHovered
                        ? "scale(1.05)"
                        : "scale(1)",
                      boxShadow: displayState.isPending
                        ? "0 4px 16px rgba(82, 196, 26, 0.4)"
                        : displayState.isHovered
                        ? "0 2px 8px rgba(0,0,0,0.2)"
                        : "none",
                      filter: displayState.isHidden
                        ? "grayscale(100%) blur(1px)"
                        : "none",
                    }}
                    onClick={(e) => {
                      if (!element.clickable || displayState.isHidden) return;

                      // 阻止事件冒泡
                      e.stopPropagation();

                      // 获取预览容器的位置信息
                      const previewContainer = e.currentTarget.parentElement;
                      if (!previewContainer) return;

                      const containerRect =
                        previewContainer.getBoundingClientRect();

                      // 计算相对于预览容器的点击位置
                      const relativeX = e.clientX - containerRect.left;
                      const relativeY = e.clientY - containerRect.top;

                      // 获取点击位置（相对于页面的绝对位置，用于定位气泡）
                      const clickPosition = {
                        x: e.clientX, // 使用页面绝对坐标来定位气泡
                        y: e.clientY,
                      };

                      console.log(
                        "🎯 点击坐标 - 页面绝对:",
                        e.clientX,
                        e.clientY,
                        "相对容器:",
                        relativeX,
                        relativeY
                      );

                      // 使用选择管理器处理点击
                      const uiElement = convertVisualToUIElement(element);
                      selectionManager.handleElementClick(
                        uiElement,
                        clickPosition
                      );
                    }}
                    onMouseEnter={(e) => {
                      if (displayState.isHidden) return;

                      // 通知选择管理器悬停状态
                      selectionManager.handleElementHover(element.id);
                    }}
                    onMouseLeave={(e) => {
                      // 清除悬停状态
                      selectionManager.handleElementHover(null);
                    }}
                  >
                    {/* 元素标签（仅在足够大时显示）*/}
                    {elementWidth > 40 &&
                      elementHeight > 20 &&
                      element.text && (
                        <div
                          style={{
                            fontSize: Math.max(
                              8,
                              Math.min(12, elementHeight / 3)
                            ),
                            color: "#fff",
                            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                            padding: "1px 2px",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            lineHeight: 1.2,
                          }}
                        >
                          {element.text.substring(0, 10)}
                        </div>
                      )}
                  </div>
                );
              })}

              {/* 网格辅助线（可选） */}
              {scaledWidth > 200 && (
                <>
                  {/* 垂直辅助线 */}
                  {[0.25, 0.5, 0.75].map((ratio, index) => (
                    <div
                      key={`v-${index}`}
                      style={{
                        position: "absolute",
                        left: scaledWidth * ratio,
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        backgroundColor: "rgba(156, 163, 175, 0.1)",
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                  {/* 水平辅助线 */}
                  {[0.25, 0.5, 0.75].map((ratio, index) => (
                    <div
                      key={`h-${index}`}
                      style={{
                        position: "absolute",
                        top: scaledHeight * ratio,
                        left: 0,
                        right: 0,
                        height: "1px",
                        backgroundColor: "rgba(156, 163, 175, 0.1)",
                        pointerEvents: "none",
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 缩放控制提示 */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              background: "rgba(0, 0, 0, 0.7)",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
            }}
          >
            💡 滚动查看完整页面
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 16, height: 600 }}>
      {/* 左侧控制面板 */}
      <div
        style={{
          width: 300,
          borderRight: "1px solid #f0f0f0",
          paddingRight: 16,
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          {/* 搜索框 */}
          <Input
            placeholder="搜索元素..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {/* 过滤选项 */}
          <div>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <input
                  type="checkbox"
                  checked={showOnlyClickable}
                  onChange={(e) => setShowOnlyClickable(e.target.checked)}
                />
                <Text>只显示可点击元素</Text>
              </Space>

              {/* 隐藏元素管理 */}
              {selectionManager.hiddenElements.length > 0 && (
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text style={{ fontSize: "12px", color: "#52c41a" }}>
                      已隐藏 {selectionManager.hiddenElements.length} 个元素
                    </Text>
                    <Button
                      size="small"
                      type="link"
                      onClick={selectionManager.restoreAllElements}
                      style={{ padding: 0, height: "auto", fontSize: "11px" }}
                    >
                      恢复所有隐藏元素
                    </Button>
                  </Space>
                </div>
              )}
            </Space>
          </div>

          {/* 分类选择 */}
          <div>
            <Title level={5}>按功能分类</Title>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Button
                type={selectedCategory === "all" ? "primary" : "default"}
                size="small"
                onClick={() => setSelectedCategory("all")}
                style={{ textAlign: "left" }}
              >
                <AppstoreOutlined /> 全部 ({elements.length})
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.name}
                  type={
                    selectedCategory === category.name ? "primary" : "default"
                  }
                  size="small"
                  onClick={() => setSelectedCategory(category.name)}
                  style={{
                    textAlign: "left",
                    borderColor: category.color,
                    backgroundColor:
                      selectedCategory === category.name
                        ? category.color
                        : undefined,
                  }}
                >
                  {category.icon} {category.name} ({category.elements.length})
                </Button>
              ))}
            </div>
          </div>

          {/* 统计信息 */}
          <Alert
            message="页面统计"
            description={
              <div>
                <p>总元素: {elements.length} 个</p>
                <p>可点击: {elements.filter((e) => e.clickable).length} 个</p>
                <p>
                  高重要性:{" "}
                  {elements.filter((e) => e.importance === "high").length} 个
                </p>
              </div>
            }
            type="info"
          />
        </Space>
      </div>

      {/* 中间页面预览 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {renderPagePreview()}
      </div>

      {/* 右侧元素列表 */}
      <div style={{ width: 400, maxHeight: 600, overflowY: "auto" }}>
        <Title level={5}>元素列表 ({filteredElements.length})</Title>
        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          {filteredElements.map((element) => {
            const category = categories.find(
              (cat) => cat.name === element.category
            );
            return (
              <Card
                key={element.id}
                size="small"
                title={
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {category?.icon}
                    <span style={{ color: category?.color }}>
                      {element.userFriendlyName}
                    </span>
                    {element.clickable && <Tag color="green">可点击</Tag>}
                  </div>
                }
                extra={
                  <Tag
                    color={
                      element.importance === "high"
                        ? "red"
                        : element.importance === "medium"
                        ? "orange"
                        : "default"
                    }
                  >
                    {element.importance === "high"
                      ? "重要"
                      : element.importance === "medium"
                      ? "中等"
                      : "一般"}
                  </Tag>
                }
              >
                <div style={{ fontSize: 12 }}>
                  <p style={{ margin: 0 }}>
                    <strong>功能:</strong> {element.description}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>位置:</strong> ({element.position.x},{" "}
                    {element.position.y})
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>大小:</strong> {element.position.width} ×{" "}
                    {element.position.height}
                  </p>
                  {element.text && (
                    <p style={{ margin: 0 }}>
                      <strong>文本:</strong> {element.text}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
      </div>

      {/* 使用新的元素选择弹出框组件 */}
      <ElementSelectionPopover
        visible={!!selectionManager.pendingSelection}
        selection={selectionManager.pendingSelection}
        onConfirm={selectionManager.confirmSelection}
        onCancel={selectionManager.hideElement}
      />
    </div>
  );
};

interface UniversalPageFinderModalProps {
  visible: boolean;
  onClose: () => void;
  onElementSelected?: (element: UIElement) => void;
}

/**
 * Universal UI智能页面查找模态框
 */
export const UniversalPageFinderModal: React.FC<
  UniversalPageFinderModalProps
> = ({ visible, onClose, onElementSelected }) => {
  // ADB设备管理
  const { devices, refreshDevices } = useAdb();

  // 状态管理
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [elements, setElements] = useState<VisualUIElement[]>([]);
  const [filteredElements, setFilteredElements] = useState<VisualUIElement[]>(
    []
  );
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "tree" | "visual">(
    "visual"
  ); // 默认显示可视化视图
  const [selectedElementId, setSelectedElementId] = useState<string>(""); // 选中的元素
  const [showOnlyClickable, setShowOnlyClickable] = useState(true); // 默认只显示可点击元素

  // 缓存相关状态
  const [showCache, setShowCache] = useState(true); // 默认展开历史缓存页面
  const [loadingCachePage, setLoadingCachePage] = useState(false);
  const [currentCachePage, setCurrentCachePage] =
    useState<CachedXmlPage | null>(null);
  const [reloadingCache, setReloadingCache] = useState(false);

  // 重置状态
  const resetState = () => {
    setElements([]);
    setFilteredElements([]);
    setSearchText("");
    setAnalysisResult("");
    setAnalyzing(false);
    setSelectedElementId("");
  };

  // 将VisualUIElement转换为UIElement的函数（用于主组件API调用）
  const convertVisualToUIElement = (
    visualElement: VisualUIElement
  ): UIElement => {
    // 安全地获取position数据，提供默认值
    const position = visualElement.position || {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    };

    return {
      id: visualElement.id,
      text: visualElement.text,
      element_type: visualElement.type,
      xpath: "",
      bounds: {
        left: position.x,
        top: position.y,
        right: position.x + position.width,
        bottom: position.y + position.height,
      },
      is_clickable: visualElement.clickable,
      is_scrollable: false,
      is_enabled: true,
      is_focused: false,
      checkable: false,
      checked: false,
      selected: false,
      password: false,
      content_desc: visualElement.description,
    };
  };

  // 转换后的UIElement数组，用于API调用
  const uiElements = elements.map(convertVisualToUIElement);

  // 处理VisualUIElement的选择
  const handleVisualElementSelect = (element: VisualUIElement) => {
    setSelectedElementId(element.id);

    if (!element.clickable || !onElementSelected) return;

    // 转换为 UIElement 格式并回调
    const uiElement = convertVisualToUIElement(element);
    onElementSelected(uiElement);
  };

  // 页面分析
  const handleAnalyzePage = async () => {
    console.log("🔍 handleAnalyzePage 被调用", { selectedDeviceId });

    if (!selectedDeviceId) {
      message.warning("请先选择设备");
      return;
    }

    setAnalyzing(true);
    try {
      message.info("开始分析当前页面...");
      console.log(
        "📡 调用 UniversalUIAPI.analyzeUniversalUIPage",
        selectedDeviceId
      );

      // 1. 执行页面分析
      const analysis = await UniversalUIAPI.analyzeUniversalUIPage(
        selectedDeviceId
      );
      console.log("✅ 获取到分析结果", {
        analysisLength: analysis?.length,
        containsXML:
          analysis?.includes("<?xml") || analysis?.includes("<hierarchy"),
      });
      setAnalysisResult(analysis);

      // 2. 如果分析包含XML内容，提取元素
      if (analysis.includes("<?xml") || analysis.includes("<hierarchy")) {
        message.info("正在提取页面元素...");
        const extractedElements = await UniversalUIAPI.extractPageElements(
          analysis
        );

        // 3. 去重处理 - 如果失败则使用原始元素
        if (extractedElements.length > 0) {
          message.info("正在优化元素列表...");
          try {
            const deduplicatedElements =
              await UniversalUIAPI.deduplicateElements(extractedElements);
            setElementsWithConvert(deduplicatedElements);
            message.success(
              `分析完成！找到 ${deduplicatedElements.length} 个唯一元素`
            );
          } catch (dedupeError) {
            console.warn("元素去重失败，使用原始元素列表:", dedupeError);
            setElementsWithConvert(extractedElements);
            message.success(
              `分析完成！找到 ${extractedElements.length} 个元素（跳过去重）`
            );
          }
        } else {
          setElements([]);
          setFilteredElements([]);
          message.warning("未找到可用元素");
        }
      } else {
        message.success("页面分析完成");
      }
    } catch (error) {
      console.error("Page analysis failed:", error);
      message.error(`页面分析失败: ${error}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // 搜索过滤
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredElements(elements);
      return;
    }
    // 用UIElement数组进行API调用
    const filteredUI = UniversalUIAPI.searchElementsByText(uiElements, value);
    // 转换回VisualUIElement
    const filtered = filteredUI
      .map((ui) => elements.find((el) => el.id === ui.id))
      .filter(Boolean) as VisualUIElement[];
    setFilteredElements(filtered);
  };

  // 按类型过滤
  const handleTabChange = (key: string) => {
    setSelectedTab(key);
    let filtered: VisualUIElement[] = [];
    if (key === "all") {
      filtered = elements;
    } else if (key === "interactive") {
      const filteredUI = UniversalUIAPI.filterInteractiveElements(uiElements);
      filtered = filteredUI
        .map((ui) => elements.find((el) => el.id === ui.id))
        .filter(Boolean) as VisualUIElement[];
    } else {
      const grouped = UniversalUIAPI.groupElementsByType(uiElements);
      filtered = (grouped[key] || [])
        .map((ui) => elements.find((el) => el.id === ui.id))
        .filter(Boolean) as VisualUIElement[];
    }
    // 如果有搜索条件，继续应用搜索
    if (searchText.trim()) {
      const filteredUI = UniversalUIAPI.searchElementsByText(
        filtered.map(convertVisualToUIElement),
        searchText
      );
      filtered = filteredUI
        .map((ui) => elements.find((el) => el.id === ui.id))
        .filter(Boolean) as VisualUIElement[];
    }
    setFilteredElements(filtered);
  };

  // 重新加载缓存页面
  const handleReloadCache = async () => {
    setReloadingCache(true);
    try {
      message.loading({
        content: "正在重新加载页面...",
        key: "reload",
        duration: 0,
      });

      // 如果当前有选中的缓存页面，重新加载它
      if (currentCachePage) {
        await handleCachePageSelected(currentCachePage);
        message.success({
          content: "页面重新加载成功",
          key: "reload",
          duration: 2,
        });
      } else {
        message.info({
          content: "请先选择一个缓存页面",
          key: "reload",
          duration: 2,
        });
      }
    } catch (error) {
      console.error("重新加载页面失败:", error);
      message.error({
        content: "重新加载页面失败",
        key: "reload",
        duration: 2,
      });
    } finally {
      setReloadingCache(false);
    }
  };

  // 从UIElement创建ElementContext的辅助函数
  const createElementContextFromUIElement = (element: UIElement): any => {
    return {
      text: element.text || "",
      contentDesc: element.content_desc || "",
      resourceId: "",
      className: element.element_type,
      bounds: `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`,
      clickable: element.is_clickable,
      selected: element.selected,
      enabled: element.is_enabled,
      focusable: false,
      scrollable: element.is_scrollable,
      checkable: element.checkable,
      checked: element.checked,
      position: {
        x: element.bounds.left,
        y: element.bounds.top,
        width: element.bounds.right - element.bounds.left,
        height: element.bounds.bottom - element.bounds.top,
      },
      screenWidth: 1080, // 默认屏幕宽度
      screenHeight: 1920, // 默认屏幕高度
      parentElements: [],
      siblingElements: [],
      childElements: [],
    };
  };

  // 智能分析并选择元素
  const analyzeAndSelectElement = (
    element: UIElement
  ): ElementAnalysisResult | null => {
    if (!analysisResult) return null;

    try {
      // 将UIElement转换为ElementContext格式
      const elementContext = createElementContextFromUIElement(element);

      // 执行智能分析
      const analysis = UniversalElementAnalyzer.analyzeElement(
        elementContext,
        "com.xingin.xhs"
      );
      return analysis;
    } catch (error) {
      console.error("元素智能分析失败:", error);
      return null;
    }
  };

  // 生成智能步骤描述（使用真实XML分析）
  const generateSmartStepDescription = (
    element: UIElement,
    analysis: ElementAnalysisResult | null
  ): string => {
    try {
      // 使用真实XML分析服务进行增强分析
      const realAnalysis = RealXMLAnalysisService.analyzeElement(
        element.text || "",
        element.content_desc || "",
        {
          x: element.bounds?.left || 0,
          y: element.bounds?.top || 0,
          width: (element.bounds?.right || 0) - (element.bounds?.left || 0),
          height: (element.bounds?.bottom || 0) - (element.bounds?.top || 0),
        },
        element.element_type || "",
        "com.xingin.xhs", // 假设是小红书，可以从设备信息中获取
        element.is_clickable || false
      );

      // 生成增强的步骤描述
      return RealXMLAnalysisService.generateEnhancedStepDescription(
        realAnalysis
      );
    } catch (error) {
      console.error("真实XML分析失败，使用备用方案:", error);

      // 备用方案：使用原有的分析
      if (!analysis) {
        return `点击 ${element.text || element.element_type} 元素`;
      }

      const elementContext = createElementContextFromUIElement(element);
      return SmartStepDescriptionGenerator.generateStepDescription(
        analysis,
        elementContext
      );
    }
  };

  // 分析应用和页面信息的辅助函数
  const analyzeAppAndPageInfo = (
    xmlContent: string
  ): { appName: string; pageName: string } => {
    // 简单的XML解析来获取应用信息
    try {
      if (xmlContent.includes("com.xingin.xhs")) {
        return { appName: "小红书", pageName: "Unknown" };
      } else {
        return { appName: "Unknown", pageName: "Unknown" };
      }
    } catch (error) {
      return { appName: "Unknown", pageName: "Unknown" };
    }
  };

  // 🆕 创建完整的增强元素信息
  const createEnhancedElement = (
    element: UIElement,
    analysis: ElementAnalysisResult | null,
    smartDescription: string
  ): EnhancedUIElement => {
    try {
      // 获取当前的XML内容和相关信息
      const xmlContent = analysisResult || "";
      const xmlCacheId = currentCachePage?.fileName || `analysis_${Date.now()}`;
      const packageName = "com.xingin.xhs"; // 默认小红书，可以从设备信息中获取

      // 分析应用和页面信息
      const { appName, pageName } = analyzeAppAndPageInfo(xmlContent);
      const pageInfo = { appName, pageName };

      // 获取设备信息
      const deviceInfo = selectedDeviceId
        ? {
            deviceId: selectedDeviceId,
            deviceName:
              devices.find((d) => d.id === selectedDeviceId)?.name ||
              selectedDeviceId,
            resolution: { width: 1080, height: 1920 }, // 默认分辨率，可以从设备获取
          }
        : undefined;

      // 创建增强元素
      const enhancedElement: EnhancedUIElement = {
        id: element.id,
        text: element.text || "",
        description: element.content_desc || "",
        type: element.element_type || "unknown",
        category: "unknown",
        position: { 
          x: element.bounds?.left || 0, 
          y: element.bounds?.top || 0, 
          width: (element.bounds?.right || 0) - (element.bounds?.left || 0),
          height: (element.bounds?.bottom || 0) - (element.bounds?.top || 0)
        },
        clickable: element.is_clickable || false,
        importance: 'medium' as const,
        userFriendlyName: element.text || element.content_desc || "元素",
        // 增强属性
        resourceId: (element as any).resource_id,
        className: element.element_type,
        contentDesc: element.content_desc,
        enabled: element.is_enabled !== false,
        scrollable: element.is_scrollable || false,
        focused: element.is_focused || false,
        selected: element.selected || false,
        checkable: element.checkable || false,
        checked: element.checked || false,
        bounds: element.bounds ? `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]` : undefined,
        context: {
          surroundingElements: [],
          hierarchyPath: [],
          actionHints: []
        }
      };

      // 添加智能分析信息到context
      if (analysis) {
        enhancedElement.context!.actionHints.push(
          `${analysis.userDescription} (${(analysis.confidence * 100).toFixed(0)}% 置信度)`,
          analysis.actionSuggestion
        );
      }

      if (smartDescription) {
        enhancedElement.context!.actionHints.push(smartDescription);
      }

      console.log("🎯 创建增强元素信息成功:", {
        elementId: enhancedElement.id,
        hasContext: !!enhancedElement.context,
      });

      return enhancedElement;
    } catch (error) {
      console.error("❌ 创建增强元素信息失败:", error);

      // 降级处理：返回基础增强信息
      return {
        id: element.id,
        text: element.text || "",
        description: element.content_desc || "",
        type: element.element_type || "unknown",
        category: "unknown",
        position: { 
          x: element.bounds?.left || 0, 
          y: element.bounds?.top || 0, 
          width: (element.bounds?.right || 0) - (element.bounds?.left || 0),
          height: (element.bounds?.bottom || 0) - (element.bounds?.top || 0)
        },
        clickable: element.is_clickable || false,
        importance: 'medium' as const,
        userFriendlyName: element.text || element.content_desc || "元素",
        // 增强属性
        resourceId: (element as any).resource_id,
        className: element.element_type,
        contentDesc: element.content_desc,
        enabled: element.is_enabled || true,
        scrollable: element.is_scrollable || false,
        focused: element.is_focused || false,
        selected: element.selected || false,
        checkable: element.checkable || false,
        checked: element.checked || false,
        bounds: element.bounds ? `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]` : undefined,
        context: {
          surroundingElements: [],
          hierarchyPath: [],
          actionHints: [smartDescription || "可交互元素"]
        }
      } as EnhancedUIElement;
    }
  };

  // 元素选择
  const handleElementSelect = (element: UIElement) => {
    setSelectedElementId(element.id);

    // 执行智能分析
    const analysis = analyzeAndSelectElement(element);

    // 生成智能描述
    const smartDescription = generateSmartStepDescription(element, analysis);

    // 🆕 创建完整的增强元素信息
    const enhancedElement = createEnhancedElement(
      element,
      analysis,
      smartDescription
    );

    if (onElementSelected) {
      onElementSelected(enhancedElement as any);

      // 显示智能分析结果
      if (analysis) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                🎯 已选择: {analysis.userDescription}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                置信度: {(analysis.confidence * 100).toFixed(0)}% | 操作建议:{" "}
                {analysis.actionSuggestion}
              </div>
              <div
                style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}
              >
                📄 增强分析: {"已完成"}
              </div>
            </div>
          ),
          duration: 5,
        });
      } else {
        message.success(`已选择元素: ${element.text || element.element_type}`);
      }

      onClose();
    }
  };

  // 处理层级树中的元素选择
  const handleTreeElementSelect = (element: UIElement) => {
    setSelectedElementId(element.id);

    // 执行智能分析
    const analysis = analyzeAndSelectElement(element);

    // 生成智能描述
    const smartDescription = generateSmartStepDescription(element, analysis);

    // 🆕 创建完整的增强元素信息
    const enhancedElement = createEnhancedElement(
      element,
      analysis,
      smartDescription
    );

    // 构造符合外部接口的增强UIElement对象
    const enhancedUIElement = {
      ...element, // 保持原有UIElement接口兼容
      // 🆕 添加增强信息标识
      isEnhanced: true,
      enhancedElement: enhancedElement,
      smartAnalysis: analysis,
      smartDescription: smartDescription,
    };

    console.log("🚀 传递增强元素信息给外部:", {
      hasContext: !!enhancedElement.context,
      enhancedUIElement,
    });

    // 也可以调用 onElementSelected 来通知外部组件
    if (onElementSelected) {
      onElementSelected(enhancedUIElement as any);

      // 显示智能分析结果
      if (analysis) {
        message.info({
          content: (
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                🌳 层级树选择: {analysis.userDescription}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                置信度: {(analysis.confidence * 100).toFixed(0)}% | 操作建议:{" "}
                {analysis.actionSuggestion}
              </div>
              <div
                style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}
              >
                📄 增强分析: {"已完成"}
              </div>
            </div>
          ),
          duration: 4,
        });
      } else {
        message.info(`层级树选择: ${element.text || element.element_type}`);
      }

      onClose();
    }
  };

  // 格式化位置信息
  const formatBounds = (bounds: ElementBounds): string => {
    const center = UniversalUIAPI.getElementCenter(bounds);
    return `(${center.x}, ${center.y})`;
  };

  // 获取元素图标
  const getElementIcon = (element: UIElement) => {
    if (element.text && element.text.trim()) {
      // 有文本的元素
      if (element.is_clickable) return "📱"; // 可点击按钮
      return "📝"; // 文本
    }

    if (element.is_clickable) return "🎯"; // 可点击元素
    if (element.is_scrollable) return "📜"; // 可滚动区域
    if (element.class_name?.includes("Image")) return "🖼️"; // 图片
    if (element.class_name?.includes("Layout")) return "📦"; // 容器

    return "⚪"; // 默认
  };

  // 获取元素品质颜色（仿游戏装备）
  const getElementQuality = (element: UIElement) => {
    const hasText = element.text && element.text.trim();
    const isClickable = element.is_clickable;
    const isScrollable = element.is_scrollable;

    if (hasText && isClickable) return "legendary"; // 传奇 - 有文本且可点击
    if (isClickable) return "epic"; // 史诗 - 可点击
    if (hasText) return "rare"; // 稀有 - 有文本
    if (isScrollable) return "uncommon"; // 非凡 - 可滚动
    return "common"; // 普通
  };

  // 渲染现代化元素卡片
  const renderModernElementCard = (element: UIElement, index: number) => {
    const description = UniversalUIAPI.getElementDescription(element);
    const position = formatBounds(element.bounds);
    const quality = getElementQuality(element);
    const icon = getElementIcon(element);

    const qualityColors = {
      legendary: {
        bg: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
        border: "#ff4757",
        glow: "#ff6b6b",
      },
      epic: {
        bg: "linear-gradient(135deg, #a55eea, #26de81)",
        border: "#8854d0",
        glow: "#a55eea",
      },
      rare: {
        bg: "linear-gradient(135deg, #3742fa, #2f3542)",
        border: "#2f3093",
        glow: "#3742fa",
      },
      uncommon: {
        bg: "linear-gradient(135deg, #2ed573, #1e90ff)",
        border: "#20bf6b",
        glow: "#2ed573",
      },
      common: {
        bg: "linear-gradient(135deg, #747d8c, #57606f)",
        border: "#5f6368",
        glow: "#747d8c",
      },
    };

    const qualityStyle = qualityColors[quality];

    return (
      <div
        key={element.id}
        className="element-card"
        style={{
          background: qualityStyle.bg,
          border: `2px solid ${qualityStyle.border}`,
          borderRadius: "12px",
          padding: "12px",
          margin: "8px 0",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: `0 4px 15px ${qualityStyle.glow}30, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
          overflow: "hidden",
        }}
        onClick={() => handleElementSelect(element)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          e.currentTarget.style.boxShadow = `0 8px 25px ${qualityStyle.glow}50, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = `0 4px 15px ${qualityStyle.glow}30, inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
        }}
      >
        {/* 品质光效 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${qualityStyle.glow}, transparent)`,
            animation: quality === "legendary" ? "shimmer 2s infinite" : "none",
          }}
        />

        {/* 主要内容 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "white",
          }}
        >
          {/* 图标和索引 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "40px",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "2px" }}>{icon}</div>
            <div
              style={{
                fontSize: "10px",
                background: "rgba(0,0,0,0.3)",
                padding: "2px 6px",
                borderRadius: "10px",
                color: "#fff",
              }}
            >
              #{index + 1}
            </div>
          </div>

          {/* 文本信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                marginBottom: "4px",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {element.text || element.element_type || "未命名元素"}
            </div>

            <div
              style={{
                fontSize: "11px",
                opacity: 0.9,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {description}
            </div>

            <div
              style={{
                fontSize: "10px",
                opacity: 0.7,
                marginTop: "2px",
              }}
            >
              坐标: {position}
            </div>
          </div>

          {/* 状态标签 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-end",
            }}
          >
            {element.is_clickable && (
              <div
                style={{
                  background: "rgba(46, 213, 115, 0.9)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                可点击
              </div>
            )}

            {element.is_scrollable && (
              <div
                style={{
                  background: "rgba(52, 152, 219, 0.9)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                可滚动
              </div>
            )}

            {element.text && element.text.trim() && (
              <div
                style={{
                  background: "rgba(155, 89, 182, 0.9)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                有文本
              </div>
            )}
          </div>
        </div>

        {/* 选择按钮 */}
        <div
          style={{
            position: "absolute",
            right: "8px",
            top: "8px",
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
            backdropFilter: "blur(4px)",
          }}
        >
          →
        </div>
      </div>
    );
  };

  // 统计信息（useMemo，替代getElementTypeStats）
  const stats = React.useMemo(() => {
    const interactive = elements.filter((el) => el.clickable);
    const types = Array.from(new Set(elements.map((el) => el.type)));
    return {
      total: elements.length,
      interactive: interactive.length,
      types: types.length,
    };
  }, [elements]);

  // 处理缓存页面选择
  const handleCachePageSelected = async (cachedPage: CachedXmlPage) => {
    setLoadingCachePage(true);
    try {
      console.log("🔄 加载缓存页面:", cachedPage.pageTitle);

      // 加载缓存页面内容
      const pageContent: XmlPageContent =
        await XmlPageCacheService.loadPageContent(cachedPage);

      // 设置当前缓存页面
      setCurrentCachePage(cachedPage);

      // 设置分析结果为XML内容（用于可视化视图）
      setAnalysisResult(pageContent.xmlContent);

      console.log("🔍 缓存页面原始元素数量:", pageContent.elements.length);

      // 🚀 使用与"分析当前页面"相同的元素处理逻辑
      if (
        pageContent.xmlContent.includes("<?xml") ||
        pageContent.xmlContent.includes("<hierarchy")
      ) {
        console.log("📋 重新提取缓存页面元素...");
        try {
          // 使用相同的API提取元素
          const extractedElements = await UniversalUIAPI.extractPageElements(
            pageContent.xmlContent
          );
          console.log("📋 提取到的元素数量:", extractedElements.length);

          if (extractedElements.length > 0) {
            try {
              // 使用相同的去重逻辑
              const deduplicatedElements =
                await UniversalUIAPI.deduplicateElements(extractedElements);
              console.log("📋 去重后的元素数量:", deduplicatedElements.length);

              // 更新元素列表
              setElementsWithConvert(deduplicatedElements);

              message.success({
                content: (
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      📄 缓存页面加载成功
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {cachedPage.pageTitle} • {deduplicatedElements.length}
                      个元素
                    </div>
                  </div>
                ),
                duration: 3,
              });
            } catch (dedupeError) {
              console.warn(
                "缓存页面元素去重失败，使用原始元素列表:",
                dedupeError
              );
              setElementsWithConvert(extractedElements);

              message.success({
                content: (
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      📄 缓存页面加载成功
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {cachedPage.pageTitle} • {extractedElements.length}
                      个元素（跳过去重）
                    </div>
                  </div>
                ),
                duration: 3,
              });
            }
          } else {
            // 如果提取失败，回退到原始数据
            console.warn("提取元素失败，使用缓存的原始元素");
            setElements(pageContent.elements);
            setFilteredElements(pageContent.elements);

            message.warning({
              content: `缓存页面加载成功，但元素提取有问题 • ${pageContent.elements.length}个原始元素`,
              duration: 3,
            });
          }
        } catch (extractError) {
          console.error("提取缓存页面元素失败，使用原始数据:", extractError);
          setElements(pageContent.elements);
          setFilteredElements(pageContent.elements);

          message.warning({
            content: `缓存页面加载成功 • ${pageContent.elements.length}个元素（使用原始数据）`,
            duration: 3,
          });
        }
      } else {
        // 非XML内容，直接使用原始元素
        setElements(pageContent.elements);
        setFilteredElements(pageContent.elements);

        message.success({
          content: `缓存页面加载成功 • ${pageContent.elements.length}个元素`,
          duration: 3,
        });
      }

      // 默认切换到可视化视图（保持与原有行为一致）
      setViewMode("visual");

      // 保持缓存选择器打开状态（根据用户要求，选择缓存页面后不自动关闭）
      // setShowCache(false); // 已移除：用户希望选择缓存页面后保持历史缓存区域打开
    } catch (error) {
      console.error("❌ 加载缓存页面失败:", error);
      message.error("加载缓存页面失败，请重试");
    } finally {
      setLoadingCachePage(false);
    }
  };

  // UIElement => VisualUIElement 转换工具
  function convertToVisualUIElement(element: UIElement): VisualUIElement {
    return {
      id: element.id,
      text: element.text,
      description: element.content_desc ?? "",
      type: element.element_type,
      category: getCategory(element), // 你可以自定义分类逻辑
      position: {
        x: element.bounds.left,
        y: element.bounds.top,
        width: element.bounds.right - element.bounds.left,
        height: element.bounds.bottom - element.bounds.top,
      },
      clickable: element.is_clickable,
      importance: "medium", // 可根据业务调整
      userFriendlyName: element.text || element.element_type,
    };
  }

  function getCategory(element: UIElement): string {
    if (element.element_type === "TextView") return "text";
    if (element.element_type === "ImageView") return "image";
    if (element.element_type === "ViewGroup") return "container";
    if (element.is_clickable) return "interactive";
    return "all";
  }

  // 在 setElements 时自动转换类型
  const setElementsWithConvert = (rawElements: UIElement[]) => {
    const visualElements = rawElements.map(convertToVisualUIElement);
    setElements(visualElements);
    setFilteredElements(visualElements);
  };

  return (
    <Modal
      title={
        <Space>
          <MobileOutlined />
          Universal UI智能页面查找
        </Space>
      }
      className="universal-page-finder"
      visible={visible}
      onCancel={onClose}
      width={1200}
      style={{ top: 20 }}
      bodyStyle={{
        padding: "24px",
        background: "linear-gradient(135deg, #111827, #1f2937)",
      }}
      footer={null}
      afterClose={resetState}
      zIndex={1050} // 设置更高的z-index，确保在添加智能步骤模态框之上
    >
      <Row gutter={16}>
        {/* 左侧：设备选择和分析 */}
        <Col span={8}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  margin: "-16px -24px 16px -24px",
                  padding: "20px 24px",
                  borderRadius: "8px 8px 0 0",
                  color: "white",
                }}
              >
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  📱
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    设备控制中心
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    选择设备并开始页面分析
                  </div>
                </div>
              </div>
            }
            size="small"
            style={{
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "none",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* 设备选择区域 */}
              <div
                style={{
                  background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid #dee2e6",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    color: "#495057",
                  }}
                >
                  <div style={{ fontSize: "16px" }}>🔗</div>
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                    连接设备
                  </span>
                </div>

                <Select
                  style={{ width: "100%" }}
                  placeholder="选择ADB设备"
                  value={selectedDeviceId}
                  onChange={setSelectedDeviceId}
                  size="large"
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <div style={{ padding: 8 }}>
                        <Button
                          type="text"
                          icon={<ReloadOutlined />}
                          onClick={refreshDevices}
                          style={{ width: "100%" }}
                        >
                          刷新设备列表
                        </Button>
                      </div>
                    </div>
                  )}
                >
                  {devices.map((device) => (
                    <Option key={device.id} value={device.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background:
                              device.status === "online"
                                ? "linear-gradient(135deg, #2ed573, #26de81)"
                                : "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                          }}
                        />
                        <span>{device.name}</span>
                        <span
                          style={{
                            fontSize: "11px",
                            color:
                              device.status === "online"
                                ? "#2ed573"
                                : "#ff6b6b",
                            fontWeight: "bold",
                          }}
                        >
                          ({device.status})
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>

              {/* 分析按钮 */}
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleAnalyzePage}
                loading={analyzing}
                disabled={!selectedDeviceId}
                size="large"
                block
                style={{
                  height: "50px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  background: analyzing
                    ? "linear-gradient(135deg, #ffa726, #ff7043)"
                    : "linear-gradient(135deg, #26de81, #20bf6b)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(38, 222, 129, 0.4)",
                  transition: "all 0.3s ease",
                }}
              >
                {analyzing ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>🔄</span>
                    <span>分析中...</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>🎯</span>
                    <span>分析当前页面</span>
                  </div>
                )}
              </Button>

              {/* 重新加载页面按钮 */}
              <Button
                type="default"
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleReloadCache}
                loading={reloadingCache}
                disabled={!currentCachePage}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  background: currentCachePage
                    ? "linear-gradient(135deg, #52c41a, #73d13d)"
                    : "linear-gradient(135deg, #d9d9d9, #f0f0f0)",
                  color: "white",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  transition: "all 0.3s ease",
                }}
              >
                {reloadingCache ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>🔄</span>
                    <span>重新加载中...</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>📄</span>
                    <span>重新加载页面</span>
                  </div>
                )}
              </Button>

              {/* 缓存页面选择器 */}
              <div style={{ marginTop: "16px" }}>
                <Divider style={{ margin: "16px 0", borderColor: "#ddd" }}>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    历史页面缓存
                  </Text>
                </Divider>

                {!showCache ? (
                  <Button
                    type="dashed"
                    block
                    style={{
                      borderColor: "#1890ff",
                      color: "#1890ff",
                      borderRadius: "8px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    onClick={() => setShowCache(true)}
                  >
                    <span>📚</span>
                    <span>使用历史缓存页面</span>
                  </Button>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <Text strong style={{ color: "#1890ff" }}>
                        📚 选择历史页面
                      </Text>
                      <Button
                        size="small"
                        type="text"
                        onClick={() => setShowCache(false)}
                        style={{ color: "#999" }}
                      >
                        收起
                      </Button>
                    </div>

                    <Spin spinning={loadingCachePage}>
                      <div
                        style={{
                          maxHeight: "300px",
                          overflowY: "auto",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          padding: "8px",
                          backgroundColor: "#1f2937",
                        }}
                      >
                        <XmlCachePageSelector
                          onPageSelected={handleCachePageSelected}
                          showStats={false}
                          maxPages={10}
                        />
                      </div>
                    </Spin>
                  </div>
                )}
              </div>

              {/* 当前页面信息 */}
              {currentCachePage && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #52c41a, #73d13d)",
                    borderRadius: "12px",
                    padding: "16px",
                    color: "white",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>📄</span>
                    <Text strong style={{ color: "white", fontSize: "14px" }}>
                      当前页面（缓存）
                    </Text>
                  </div>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: "12px",
                    }}
                  >
                    {currentCachePage.pageTitle}
                  </Text>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginTop: "4px",
                    }}
                  >
                    {currentCachePage.deviceId} •{" "}
                    {currentCachePage.clickableCount}个可点击元素
                  </div>
                </div>
              )}

              {/* 统计信息卡片 */}
              {stats.total > 0 && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* 背景装饰 */}
                  <div
                    style={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: "100px",
                      height: "100px",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "50%",
                      filter: "blur(20px)",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ fontSize: "24px" }}>📊</div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                        分析结果
                      </div>
                      <div style={{ fontSize: "12px", opacity: 0.9 }}>
                        页面元素统计信息
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        padding: "12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {stats.total}
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.9 }}>
                        总元素
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(38, 222, 129, 0.3)",
                        borderRadius: "8px",
                        padding: "12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {stats.interactive}
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.9 }}>
                        可交互
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(165, 94, 234, 0.3)",
                        borderRadius: "8px",
                        padding: "12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {stats.types}
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.9 }}>
                        元素类型
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(255, 107, 107, 0.3)",
                        borderRadius: "8px",
                        padding: "12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {Math.round((stats.interactive / stats.total) * 100)}%
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.9 }}>
                        交互率
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* 右侧：元素展示 */}
        <Col span={16}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>页面元素</span>
                {elements.length > 0 && (
                  <Space>
                    <Button.Group size="small">
                      <Button
                        type={viewMode === "visual" ? "primary" : "default"}
                        icon={<EyeOutlined />}
                        onClick={() => setViewMode("visual")}
                      >
                        可视化视图
                      </Button>
                      <Button
                        type={viewMode === "tree" ? "primary" : "default"}
                        icon={<BranchesOutlined />}
                        onClick={() => setViewMode("tree")}
                      >
                        层级树
                      </Button>
                      <Button
                        type={viewMode === "list" ? "primary" : "default"}
                        icon={<UnorderedListOutlined />}
                        onClick={() => setViewMode("list")}
                      >
                        列表视图
                      </Button>
                    </Button.Group>
                  </Space>
                )}
              </div>
            }
            size="small"
          >
            {analyzing ? (
              <div style={{ textAlign: "center", padding: 50 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>正在分析页面...</div>
              </div>
            ) : elements.length > 0 ? (
              <div>
                {viewMode === "tree" ? (
                  // 层级树视图 - 添加错误边界保护
                  <ErrorBoundary
                    fallback={
                      <Card className="h-full">
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500 space-y-2">
                          <span>⚠️ 层级树渲染出错</span>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => window.location.reload()}
                          >
                            刷新页面
                          </Button>
                        </div>
                      </Card>
                    }
                  >
                    <UIElementTree
                      elements={uiElements}
                      selectedElements={
                        selectedElementId
                          ? uiElements.filter(
                              (el) => el.id === selectedElementId
                            )
                          : []
                      }
                      onElementSelect={(selectedElems) => {
                        if (selectedElems.length > 0) {
                          handleTreeElementSelect(selectedElems[0]);
                        }
                      }}
                      showOnlyClickable={showOnlyClickable}
                    />
                  </ErrorBoundary>
                ) : viewMode === "visual" ? (
                  // 可视化视图 - 使用新的独立组件
                  <VisualElementView
                    elements={elements}
                    onElementSelect={handleVisualElementSelect}
                    selectedElementId={selectedElementId}
                  />
                ) : (
                  // 列表视图 - 使用新的独立组件
                  <ElementListView
                    elements={filteredElements}
                    onElementSelect={(element) => {
                      // 转换回VisualUIElement
                      const visualElement = elements.find(
                        (el) => el.id === element.id
                      );
                      if (visualElement) {
                        handleVisualElementSelect(visualElement);
                      }
                    }}
                  />
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 50, color: "#999" }}>
                <EyeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>选择设备并点击"分析当前页面"开始</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default UniversalPageFinderModal;
