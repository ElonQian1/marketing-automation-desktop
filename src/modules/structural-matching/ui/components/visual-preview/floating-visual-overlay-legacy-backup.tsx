// src/modules/structural-matching/ui/components/visual-preview/floating-visual-overlay-legacy-backup.tsx
// module: structural-matching | layer: ui | role: 悬浮可视化覆盖层备份
// summary: 悬浮可视化组件的遗留备份版本

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Button, Typography, Space, Spin, Alert } from "antd";
import {
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { parseXML } from "../../../../../components/universal-ui/xml-parser";
import type { VisualUIElement } from "../../../../../components/universal-ui/types";
import XmlCacheManager from "../../../../../services/xml-cache-manager";

const { Text } = Typography;

/**
 * 悬浮可视化覆盖层属性
 */
export interface FloatingVisualOverlayProps {
  /** 是否显示悬浮层 */
  visible: boolean;
  /** 选中的元素数据 */
  selectedElement: Record<string, unknown> | null;
  /** 高亮元素ID */
  highlightedElementId?: string | null;
  /** 鼠标位置 */
  mousePosition?: { x: number; y: number };
  /** 显示延迟 */
  delay?: number;
}

// 窗口状态接口
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isCollapsed: boolean;
  isDragging: boolean;
  isResizing: boolean;
}

// 元素边界接口
interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 解析bounds字符串或对象为数值对象
const parseBounds = (boundsData: unknown): ElementBounds | null => {
  console.log(
    "🔧 [parseBounds] 输入数据:",
    boundsData,
    "类型:",
    typeof boundsData
  );

  if (!boundsData) return null;

  // 处理对象格式的bounds
  if (typeof boundsData === "object" && boundsData !== null) {
    const obj = boundsData as Record<string, unknown>;
    if (
      typeof obj.left === "number" &&
      typeof obj.top === "number" &&
      typeof obj.right === "number" &&
      typeof obj.bottom === "number"
    ) {
      const result = {
        x: obj.left,
        y: obj.top,
        width: obj.right - obj.left,
        height: obj.bottom - obj.top,
      };
      console.log("✅ [parseBounds] 解析对象格式成功:", result);
      return result;
    }
  }

  // 处理字符串格式的bounds
  if (typeof boundsData === "string") {
    // 格式: "[left,top][right,bottom]"
    const match = boundsData.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (match) {
      const [, left, top, right, bottom] = match.map(Number);
      const result = {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      };
      console.log("✅ [parseBounds] 解析字符串格式成功:", result);
      return result;
    }
  }

  console.log("❌ [parseBounds] 无法解析bounds数据");
  return null;
};

// 检查两个ID是否匹配（支持下划线和连字符互换）
const isElementIdMatch = (id1: string, id2: string): boolean => {
  if (!id1 || !id2) return false;

  // 直接匹配
  if (id1 === id2) return true;

  // 转换下划线为连字符后匹配
  const id1Normalized = id1.replace(/_/g, "-");
  const id2Normalized = id2.replace(/_/g, "-");

  const match = id1Normalized === id2Normalized;

  if (match) {
    console.log(`✅ [ID匹配] ${id1} ↔ ${id2} (标准化后: ${id1Normalized})`);
  }

  return match;
};

// 检查元素是否在指定边界内
const isElementInBounds = (
  element: VisualUIElement,
  bounds: ElementBounds
): boolean => {
  const elementBounds = element.position;
  if (!elementBounds) return false;

  // 检查元素是否完全在bounds内或有重叠
  return !(
    elementBounds.x + elementBounds.width < bounds.x ||
    elementBounds.x > bounds.x + bounds.width ||
    elementBounds.y + elementBounds.height < bounds.y ||
    elementBounds.y > bounds.y + bounds.height
  );
};

// 提取选中元素及其子元素的局部结构
const extractLocalElementStructure = (
  allElements: VisualUIElement[],
  selectedElementId: string
): VisualUIElement[] => {
  console.log(`🔍 [元素查找] 搜索ID: "${selectedElementId}"`);
  console.log(`📊 [元素总数] ${allElements.length} 个元素`);

  // 找到选中的元素 - 支持ID格式转换
  const selectedElement = allElements.find((el) =>
    isElementIdMatch(el.id, selectedElementId)
  );

  if (!selectedElement) {
    console.log(`❌ [元素查找] 未找到匹配的元素 "${selectedElementId}"`);
    console.log(
      "🔍 [可用元素ID]:",
      allElements.slice(0, 10).map((el) => el.id)
    );
    return [];
  }

  console.log(
    `✅ [元素查找] 找到匹配元素: ${selectedElement.id}`,
    selectedElement
  );

  const selectedBounds = selectedElement.position;
  if (!selectedBounds) {
    console.log("⚠️ [边界数据] 选中元素无边界信息，返回单元素");
    return [selectedElement];
  }

  console.log(`📐 [边界数据] 选中元素边界:`, selectedBounds);

  // 过滤出在选中元素bounds内的所有元素
  const localElements = allElements.filter((element) => {
    // 包含选中元素本身
    if (isElementIdMatch(element.id, selectedElementId)) return true;

    // 检查是否在选中元素的bounds内
    return isElementInBounds(element, selectedBounds);
  });

  console.log(`✅ [局部元素] 提取完成: ${localElements.length} 个元素`);
  return localElements;
};

/**
 * 悬浮可视化覆盖层组件
 * 专注显示选中元素的局部结构，背景图片裁剪到该区域
 */
export const FloatingVisualOverlay: React.FC<FloatingVisualOverlayProps> = ({
  visible,
  selectedElement,
  highlightedElementId,
  mousePosition,
}) => {
  console.log("🚀 [FloatingVisualOverlay] 组件渲染:", {
    visible,
    hasSelectedElement: !!selectedElement,
    selectedElement,
    highlightedElementId,
    mousePosition,
  });
  // 窗口状态
  const [windowState, setWindowState] = useState<WindowState>({
    x: 50,
    y: 50,
    width: 600,
    height: 500,
    isCollapsed: false,
    isDragging: false,
    isResizing: false,
  });

  // 数据状态
  const [xmlElements, setXmlElements] = useState<VisualUIElement[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 引用
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startWindowX: 0,
    startWindowY: 0,
  });

  // 基础调试 - 检查组件是否收到数据
  console.log("🎈 [FloatingVisualOverlay] 组件渲染 - Props:", {
    visible,
    hasSelectedElement: !!selectedElement,
    selectedElement,
    highlightedElementId,
    mousePosition,
  });

  // 初始化鼠标位置
  useEffect(() => {
    if (mousePosition && visible) {
      setWindowState((prev) => ({
        ...prev,
        x: Math.max(50, mousePosition.x - prev.width / 2),
        y: Math.max(50, mousePosition.y + 20),
      }));
    }
  }, [mousePosition, visible]);

  // 加载XML和截图数据
  const loadElementData = useCallback(async () => {
    if (!selectedElement) return;

    setLoading(true);
    setError("");

    console.log("🔍 开始加载元素数据:", selectedElement);

    try {
      // 提取实际的元素数据 - 处理可能的嵌套结构
      type NestedElement = {
        selectedElement?: Record<string, unknown>;
      };
      const actualElement =
        (selectedElement as NestedElement)?.selectedElement || selectedElement;
      console.log("📋 提取的实际元素数据:", actualElement);

      // 多源数据加载策略
      let xmlContent = "";
      let screenshotPath = "";

      // 定义类型以避免any警告
      type ElementWithData = {
        xmlSnapshot?: { xmlContent?: string; screenshotAbsolutePath?: string };
        parameters?: {
          xmlSnapshot?: {
            xmlContent?: string;
            screenshotAbsolutePath?: string;
          };
        };
        xmlCacheId?: string;
      };

      const elementWithData = actualElement as ElementWithData;
      console.log("📋 解析后的元素数据:", elementWithData);

      // 1. 尝试从 xmlSnapshot 获取数据
      const xmlSnapshot = elementWithData.xmlSnapshot;
      if (xmlSnapshot?.xmlContent) {
        xmlContent = xmlSnapshot.xmlContent;
        screenshotPath = xmlSnapshot.screenshotAbsolutePath || "";
        console.log("✅ 从 xmlSnapshot 获取数据:", {
          xmlLength: xmlContent.length,
          screenshotPath,
        });
      }

      // 2. 尝试从 parameters 获取数据
      if (!xmlContent) {
        const parameters = elementWithData.parameters;
        if (parameters?.xmlSnapshot?.xmlContent) {
          xmlContent = parameters.xmlSnapshot.xmlContent;
          screenshotPath = parameters.xmlSnapshot.screenshotAbsolutePath || "";
          console.log("✅ 从 parameters.xmlSnapshot 获取数据:", {
            xmlLength: xmlContent.length,
            screenshotPath,
          });
        }
      }

      // 3. 尝试从 xmlCacheId 获取数据
      if (!xmlContent) {
        const xmlCacheId = elementWithData.xmlCacheId;
        if (xmlCacheId) {
          console.log("🔍 尝试从缓存获取数据，xmlCacheId:", xmlCacheId);
          const cacheData = await XmlCacheManager.getInstance().getCachedXml(
            xmlCacheId
          );
          if (cacheData && cacheData.xmlContent) {
            xmlContent = cacheData.xmlContent;
            console.log("✅ 从缓存获取XML:", { xmlLength: xmlContent.length });

            // 尝试构造截图路径：从xmlCacheId推断截图文件路径
            if (xmlCacheId && !screenshotPath) {
              // 首先检查缓存条目是否有截图路径
              if (cacheData.screenshotAbsolutePath) {
                screenshotPath = cacheData.screenshotAbsolutePath;
                console.log("✅ 从缓存条目获取截图路径:", screenshotPath);
              } else {
                // xmlCacheId格式: ui_dump_e0d909c3_20251030_122312.xml
                // 对应截图: ui_dump_e0d909c3_20251030_122312.png
                const screenshotFileName = xmlCacheId.replace(".xml", ".png");
                screenshotPath = screenshotFileName; // 直接使用文件名，让后端处理路径
                console.log("🎯 从xmlCacheId推断截图文件名:", screenshotPath);
                console.log("📁 后端将在debug_xml目录中查找此文件");
              }
            }
          } else {
            console.log("❌ 缓存中未找到数据");
          }
        }
      }

      // 4. 如果仍没有截图路径，尝试再次从原始数据中查找
      if (
        !screenshotPath &&
        (xmlSnapshot || elementWithData.parameters?.xmlSnapshot)
      ) {
        const source = xmlSnapshot || elementWithData.parameters?.xmlSnapshot;
        screenshotPath = source?.screenshotAbsolutePath || "";
        if (screenshotPath) {
          console.log("🔄 从原始数据重新获取截图路径:", screenshotPath);
        }
      }

      if (!xmlContent) {
        console.log("❌ 所有数据源都未找到XML内容");
        throw new Error("无法获取XML数据");
      }

      console.log("📄 开始解析XML，长度:", xmlContent.length);
      // 解析XML元素
      const parsedResult = parseXML(xmlContent);
      const parsedElements = Array.isArray(parsedResult)
        ? parsedResult
        : parsedResult.elements || [];
      console.log("✅ XML解析完成，元素数量:", parsedElements.length);
      setXmlElements(parsedElements);

      // 加载截图
      if (screenshotPath) {
        try {
          console.log("🖼️ 开始加载截图:", screenshotPath);

          let fullScreenshotPath = screenshotPath;
          
          // 如果是文件名（无路径），则通过后端获取绝对路径
          if (!screenshotPath.includes('/') && !screenshotPath.includes('\\')) {
            try {
              const { invoke } = await import("@tauri-apps/api/core");
              fullScreenshotPath = await invoke("get_xml_file_absolute_path", { 
                fileName: screenshotPath 
              });
              console.log("✅ 获取截图绝对路径:", fullScreenshotPath);
            } catch (pathError) {
              console.warn("⚠️ 获取绝对路径失败，使用原路径:", pathError);
            }
          }

          // 动态导入imageCache以避免循环依赖
          const imageCache = await import(
            "../../../../../components/xml-cache/utils/imageCache"
          );
          const imageUrl = await imageCache.loadDataUrlWithCache(
            fullScreenshotPath
          );

          if (imageUrl) {
            console.log("✅ 截图加载成功，设置图片URL");
            setScreenshotUrl(imageUrl);
          } else {
            console.warn("⚠️ 截图加载返回空结果");
            setScreenshotUrl("");
          }
        } catch (imgError) {
          console.warn("❌ 截图加载失败:", imgError);
          // 检查是否是文件不存在错误
          const errorMsg = imgError instanceof Error ? imgError.message : String(imgError);
          if (errorMsg.includes("系统找不到指定的路径") || errorMsg.includes("not found")) {
            console.warn("📁 截图文件不存在，可能需要重新采集页面");
          }
          setScreenshotUrl("");
        }
      } else {
        console.log("⚠️ 未找到截图路径");
        setScreenshotUrl("");
      }
    } catch (err) {
      console.error("加载元素数据失败:", err);
      setError(err instanceof Error ? err.message : "数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [selectedElement]);

  // 在数据变化时重新加载
  useEffect(() => {
    console.log("🔄 [FloatingVisualOverlay] useEffect 触发:", {
      visible,
      selectedElement,
    });
    if (visible && selectedElement) {
      console.log("✅ [FloatingVisualOverlay] 满足加载条件，开始加载数据");
      loadElementData();
    } else {
      console.log("❌ [FloatingVisualOverlay] 不满足加载条件:", {
        visible,
        hasSelectedElement: !!selectedElement,
      });
    }
  }, [visible, selectedElement, loadElementData]);

  // 计算选中元素的bounds
  const selectedElementBounds = useMemo(() => {
    if (!selectedElement) return null;

    // 提取实际的元素数据 - 处理可能的嵌套结构
    type NestedElement = {
      selectedElement?: Record<string, unknown>;
    };
    const actualElement =
      (selectedElement as NestedElement)?.selectedElement || selectedElement;

    type ElementWithBounds = {
      bounds?: unknown;
      position?: {
        bounds?: unknown;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      };
      parameters?: { bounds?: unknown };
    };

    const elementWithBounds = actualElement as ElementWithBounds;
    console.log("🎯 计算选中元素bounds:", elementWithBounds);

    // 尝试从多个字段获取bounds
    const boundsStr =
      elementWithBounds.bounds ||
      elementWithBounds.position?.bounds ||
      elementWithBounds.parameters?.bounds;

    console.log("📐 bounds字符串:", boundsStr);

    // 只有当 boundsStr 是字符串时才解析
    if (typeof boundsStr === "string" && boundsStr) {
      const parsed = parseBounds(boundsStr);
      console.log("✅ 解析bounds结果:", parsed);
      return parsed;
    }

    // 如果有position对象的直接坐标，使用它们
    if (
      elementWithBounds.position &&
      typeof elementWithBounds.position.x === "number" &&
      typeof elementWithBounds.position.y === "number" &&
      typeof elementWithBounds.position.width === "number" &&
      typeof elementWithBounds.position.height === "number"
    ) {
      const directBounds = {
        x: elementWithBounds.position.x,
        y: elementWithBounds.position.y,
        width: elementWithBounds.position.width,
        height: elementWithBounds.position.height,
      };
      console.log("✅ 使用直接坐标:", directBounds);
      return directBounds;
    }

    console.log("❌ 未找到有效的bounds数据");
    return null;
  }, [selectedElement]);

  // 提取局部元素结构
  const localElements = useMemo(() => {
    if (!xmlElements.length || !selectedElement) {
      console.log("⚠️ 无法提取局部元素:", {
        xmlElementsLength: xmlElements.length,
        hasSelectedElement: !!selectedElement,
      });
      return [];
    }

    // 提取实际的元素数据 - 处理可能的嵌套结构
    type NestedElement = {
      selectedElement?: Record<string, unknown>;
    };
    const actualElement =
      (selectedElement as NestedElement)?.selectedElement || selectedElement;

    type ElementWithId = {
      id?: string;
    };

    const elementWithId = actualElement as ElementWithId;
    const selectedId = elementWithId.id || highlightedElementId;
    console.log(
      "🎯 选中元素ID:",
      selectedId,
      "高亮元素ID:",
      highlightedElementId
    );

    if (!selectedId) {
      console.log("⚠️ 未找到选中元素ID，返回所有元素");
      return xmlElements;
    }

    const result = extractLocalElementStructure(xmlElements, selectedId);
    console.log("✅ 提取局部元素完成:", {
      输入元素数量: xmlElements.length,
      输出元素数量: result.length,
    });
    return result;
  }, [xmlElements, selectedElement, highlightedElementId]);

  // 拖拽处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (windowState.isCollapsed) return;

      setWindowState((prev) => ({ ...prev, isDragging: true }));
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWindowX: windowState.x,
        startWindowY: windowState.y,
      };

      e.preventDefault();
    },
    [windowState.x, windowState.y, windowState.isCollapsed]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!windowState.isDragging) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setWindowState((prev) => ({
        ...prev,
        x: Math.max(0, dragRef.current.startWindowX + deltaX),
        y: Math.max(0, dragRef.current.startWindowY + deltaY),
      }));
    },
    [windowState.isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setWindowState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // 全局鼠标事件监听
  useEffect(() => {
    if (windowState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [windowState.isDragging, handleMouseMove, handleMouseUp]);

  // 图片加载状态（模仿PagePreview）
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // 重置图片加载状态当URL变化时
  useEffect(() => {
    setImgLoaded(false);
    setImgError(null);
  }, [screenshotUrl]);

  if (!visible) return null;

  return (
    <div
      ref={windowRef}
      className="floating-visual-overlay"
      style={{
        position: "fixed",
        left: windowState.x,
        top: windowState.y,
        width: windowState.isCollapsed ? 200 : windowState.width,
        height: windowState.isCollapsed ? 40 : windowState.height,
        backgroundColor: "white",
        border: "2px solid #1890ff",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: windowState.isDragging ? "grabbing" : "grab",
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#1890ff",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "grab",
          flexShrink: 0,
        }}
        onMouseDown={handleMouseDown}
      >
        <Space size="small">
          <DragOutlined />
          <Text style={{ color: "white", fontSize: 12, fontWeight: 500 }}>
            🎯 局部结构预览
          </Text>
        </Space>

        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={
              windowState.isCollapsed ? (
                <ExpandOutlined />
              ) : (
                <CompressOutlined />
              )
            }
            style={{ color: "white" }}
            onClick={() =>
              setWindowState((prev) => ({
                ...prev,
                isCollapsed: !prev.isCollapsed,
              }))
            }
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            style={{ color: "white" }}
            onClick={() =>
              setWindowState((prev) => ({ ...prev, isCollapsed: true }))
            }
          />
        </Space>
      </div>

      {/* 内容区域 */}
      {!windowState.isCollapsed && (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Spin size="small" />
              <Text style={{ fontSize: 12, color: "#666" }}>
                加载结构数据...
              </Text>
            </div>
          ) : error ? (
            <div style={{ padding: 16 }}>
              <Alert
                message="加载失败"
                description={error}
                type="error"
                showIcon
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor: "#f5f5f5", // 默认背景色
                overflow: "hidden",
              }}
            >
              {/* 背景图片层（模仿PagePreview） */}
              {screenshotUrl && (
                <img
                  src={screenshotUrl}
                  alt="局部截图"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // 保持比例，完整显示
                    userSelect: "none",
                    pointerEvents: "none",
                    zIndex: 0,
                    opacity: imgLoaded ? 1 : 0,
                    transition: "opacity 0.25s ease",
                  }}
                  draggable={false}
                  onLoad={() => {
                    console.log("✅ [FloatingVisualOverlay] 图片加载成功");
                    setImgLoaded(true);
                    setImgError(null);
                  }}
                  onError={(e) => {
                    console.error("❌ [FloatingVisualOverlay] 图片加载失败:", e);
                    setImgError("无法加载截图");
                    setImgLoaded(false);
                  }}
                />
              )}

              {/* 元素叠加层 */}
              {localElements.map((element) => {
                const elementBounds = element.position;
                if (!elementBounds || !selectedElementBounds) return null;

                // 由于图片使用 objectFit: contain，需要计算实际的缩放和偏移
                // 为了简化，先使用基础的相对定位，后续可以优化精确计算
                
                // 计算相对于选中元素的局部坐标（百分比）
                const localXPercent = ((elementBounds.x - selectedElementBounds.x) / selectedElementBounds.width) * 100;
                const localYPercent = ((elementBounds.y - selectedElementBounds.y) / selectedElementBounds.height) * 100;
                const widthPercent = (elementBounds.width / selectedElementBounds.width) * 100;
                const heightPercent = (elementBounds.height / selectedElementBounds.height) * 100;

                // 检查元素是否被高亮
                const isHighlighted = element.id === highlightedElementId;

                return (
                  <div
                    key={element.id}
                    style={{
                      position: "absolute",
                      left: `${localXPercent}%`,
                      top: `${localYPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                      border: isHighlighted
                        ? "2px solid #ff4d4f"
                        : "1px solid #722ed1", // 使用紫色边框！
                      backgroundColor: isHighlighted
                        ? "rgba(255, 77, 79, 0.1)"
                        : "rgba(114, 46, 209, 0.1)", // 使用紫色背景！
                      borderRadius: 2,
                      pointerEvents: "none",
                      transition: "all 0.2s ease",
                      zIndex: 10, // 确保在图片上方
                    }}
                    title={`${element.userFriendlyName || element.className}: ${
                      element.description || element.text || "无描述"
                    }`}
                  />
                );
              })}

              {/* 错误提示 */}
              {screenshotUrl && imgError && (
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    right: 4,
                    background: "rgba(255, 77, 79, 0.9)",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    textAlign: "center",
                    zIndex: 15,
                  }}
                >
                  图片加载失败
                </div>
              )}

              {/* 状态信息 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  right: 4,
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  textAlign: "center",
                  zIndex: 15,
                }}
              >
                元素: {localElements.length} | 高亮:{" "}
                {highlightedElementId ? "是" : "否"} | 区域:{" "}
                {selectedElementBounds?.width || 0}×
                {selectedElementBounds?.height || 0}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
