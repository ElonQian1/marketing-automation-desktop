// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree.tsx
// module: structural-matching | layer: ui | role: 元素结构树展示
// summary: 可视化展示元素的层级结构，支持展开/收起和字段配置，从XML缓存动态解析子元素

import React, { useState, useEffect, useRef } from "react";
import {
  Tree,
  Switch,
  Space,
  Typography,
  Tag,
  Tooltip,
  Badge,
  Spin,
  Select,
} from "antd";
import {
  DownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { FieldType } from "../../../domain/constants/field-types";
import { FieldConfig } from "../../../domain/models/hierarchical-field-config";
import {
  MatchStrategy,
  MATCH_STRATEGY_DISPLAY_NAMES,
  MATCH_STRATEGY_DESCRIPTIONS,
} from "../../../domain/constants/match-strategies";
import { 
  SkeletonMatchMode, 
  FieldMatchStrategy, 
  BoundsMatchStrategy,
  getDefaultSkeletonConfig,
  getDefaultFieldStrategy 
} from "../../../domain/skeleton-match-strategy";
import "./element-structure-tree.css";
import XmlCacheManager from "../../../../../services/xml-cache-manager";
import { structuralMatchingCoordinationBus } from "../visual-preview/core";

const { Text } = Typography;

export interface ElementStructureTreeProps {
  selectedElement: Record<string, unknown>;
  getFieldConfig: (elementPath: string, fieldType: FieldType) => FieldConfig;
  onToggleField: (elementPath: string, fieldType: FieldType) => void;
  onUpdateField?: (
    elementPath: string,
    fieldType: FieldType,
    updates: Partial<FieldConfig>
  ) => void;
}

export const ElementStructureTree: React.FC<ElementStructureTreeProps> = ({
  selectedElement,
  getFieldConfig,
  onToggleField,
  onUpdateField,
}) => {
  // 轻去抖窗口（可通过 localStorage 配置 24~40ms）
  const HOVER_DEBOUNCE_DEFAULT_MS = 32;
  const getHoverDebounceMs = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem("sm_tree_hover_debounce_ms");
        if (raw) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) {
            return Math.min(40, Math.max(24, n));
          }
        }
      }
    } catch {}
    return HOVER_DEBOUNCE_DEFAULT_MS;
  };
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [fullElementData, setFullElementData] = useState<Record<string, unknown> | null>(null);
  // 全局字段显示模式：骨架模式只显示对子树结构有意义的字段
  const [showAllFields, setShowAllFields] = useState<boolean>(false);
  // 骨架匹配模式：Family（同类）vs Clone（精确）
  const [skeletonMode, setSkeletonMode] = useState<SkeletonMatchMode>(SkeletonMatchMode.FAMILY);
  // 是否忽略易变字段（数字、时间戳等）
  const [ignoreVolatileFields, setIgnoreVolatileFields] = useState<boolean>(false);
  // 是否启用智能配置模式（自动配置字段和策略）
  const [smartModeEnabled, setSmartModeEnabled] = useState<boolean>(false);
  // 叠加层 → 树 的联动状态（命令式处理高亮与选中）
  const listHolderRef = useRef<HTMLDivElement | null>(null);
  const highlightedDomRef = useRef<HTMLElement | null>(null);
  const lastHighlightIdRef = useRef<string | null>(null);
  const selectedDomRef = useRef<HTMLElement | null>(null);
  const lastSelectedIdRef = useRef<string | null>(null);
  // 轻去抖（hover -> highlight）与 rAF 发射
  const hoverDebounceTimerRef = useRef<number | null>(null);
  const hoverPendingIdRef = useRef<string | null>(null);
  const hoverRafRef = useRef<number | null>(null);
  // Tree 视窗自适应：内容较少时不固定高度，内容较多时启用虚拟滚动并固定高度
  const [treeViewport, setTreeViewport] = useState<{ virtual: boolean; height?: number }>(
    { virtual: true, height: 480 }
  );

  // ID 归一化：element_123 -> element-123 （与叠加层事件对齐）
  const normalizeElementId = (id?: string | null) =>
    (id || "").replace(/_/g, "-");

  // 判断字段是否有意义（非空、非默认值）
  const isFieldMeaningful = (fieldType: FieldType, value: string): boolean => {
    // 🎯 骨架匹配逻辑：聚焦于所点选子树的字段特征，不考虑全局常态
    
    // 空值过滤：空值对骨架没有贡献
    if (!value || value === "(空)" || value === "") return false;
    
    switch (fieldType) {
      // 文本类字段：非空即参与骨架匹配（内容是骨架的一部分）
      case FieldType.TEXT:
      case FieldType.RESOURCE_ID:
      case FieldType.CONTENT_DESC:
        return true;
      
      // 结构字段：总是参与骨架匹配
      case FieldType.CLASS_NAME:
      case FieldType.BOUNDS:
        return true;
      
      // 布尔字段：只有非默认状态才是有意义的骨架特征
      case FieldType.ENABLED:
        return value === "false"; // 大部分元素enabled=true，禁用状态才有意义
      
      case FieldType.CLICKABLE:
      case FieldType.FOCUSABLE:
      case FieldType.SCROLLABLE:
      case FieldType.LONG_CLICKABLE:
      case FieldType.CHECKABLE:
      case FieldType.SELECTED:
      case FieldType.CHECKED:
      case FieldType.PASSWORD:
        return value === "true"; // 大部分元素这些属性=false，true状态才有意义
      
      case FieldType.FOCUSED:
        return value === "true"; // focused=false是默认状态，true才有意义
      
      // 其他字段：暂不参与骨架匹配
      default:
        return false;
    }
  };

  // Virtual 视窗高度配置（可通过 localStorage 调整 360~600）
  const getTreeVirtualHeight = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem("sm_tree_virtual_height");
        if (raw) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) {
            return Math.min(600, Math.max(360, n));
          }
        }
      }
    } catch {}
    return 480;
  };

  // 根据内容高度动态启用/关闭虚拟滚动，以便模态框在内容不多时自适应高度
  const recalcTreeViewport = () => {
    if (!listHolderRef.current) return;
    const run = () => {
      const inner = listHolderRef.current!.querySelector<HTMLElement>(
        ".ant-tree-list-holder-inner"
      );
      const treeEl = listHolderRef.current!.querySelector<HTMLElement>(
        ".ant-tree"
      );
      const measured = (inner?.scrollHeight ?? 0) || (treeEl?.scrollHeight ?? 0);
      if (!measured) return;
      const vh = getTreeVirtualHeight();
      if (measured <= vh) {
        // 内容较少：关闭虚拟滚动，不设置固定高度，让外层模态自适应
        setTreeViewport({ virtual: false });
      } else {
        // 内容较多：开启虚拟滚动并限制视窗高度
        setTreeViewport({ virtual: true, height: vh });
      }
    };
    requestAnimationFrame(run);
  };

  useEffect(() => {
    const parseElementFromXML = async () => {
      try {
        const contextWrapper = selectedElement as Record<string, unknown>;
        const actualElement =
          (contextWrapper?.selectedElement as Record<string, unknown>) ||
          selectedElement;

        // 规范化输入元素字段（仅用于渲染，不修改原始值语义）
        const ae = actualElement as Record<string, unknown>;
        const pickStr = (obj: Record<string, unknown>, ...keys: string[]) => {
          for (const k of keys) {
            const v = obj[k];
            if (typeof v === "string" && v.length > 0) return v;
          }
          return "";
        };
        const getBool = (obj: Record<string, unknown>, key: string): boolean => {
          const v = obj[key];
          if (typeof v === "boolean") return v;
          if (typeof v === "string") return v === "true";
          return false;
        };
        const getChildren = (obj: Record<string, unknown>) => {
          const v = obj["children"] as unknown;
          return Array.isArray(v) ? (v as unknown[]) : [];
        };
        // 🔧 调试：检查传入的元素数据结构
        console.log('🔍 [ElementStructureTree] 传入的原始元素数据:', {
          actualElementKeys: Object.keys(ae),
          actualElementSample: {
            id: ae.id,
            text: ae.text,
            contentDesc: ae.contentDesc,
            content_desc: ae.content_desc,
            resourceId: ae.resourceId,
            resource_id: ae.resource_id,
            className: ae.className,
            class_name: ae.class_name,
          }
        });

        // 🎯 提取 bounds 并转换为字符串格式
        const extractBoundsString = (obj: Record<string, unknown>): string => {
          const b = obj["bounds"];
          if (typeof b === "string") return b;
          if (typeof b === "object" && b !== null) {
            const bounds = b as Record<string, unknown>;
            const left = bounds.left ?? 0;
            const top = bounds.top ?? 0;
            const right = bounds.right ?? 0;
            const bottom = bounds.bottom ?? 0;
            return `[${left},${top}][${right},${bottom}]`;
          }
          return "";
        };

        const normalizedElement: Record<string, unknown> = {
          ...actualElement,
          id: pickStr(ae, "id", "elementId"),
          class_name: pickStr(ae, "class_name", "className", "class") || "Unknown",
          resource_id: pickStr(ae, "resource_id", "resourceId", "resource-id"),
          content_desc: pickStr(ae, "content_desc", "contentDesc", "content-desc"),
          text: pickStr(ae, "text"),
          bounds: extractBoundsString(ae),
          clickable: getBool(ae, "clickable"),
          enabled: getBool(ae, "enabled"),
          focusable: getBool(ae, "focusable"),
          focused: getBool(ae, "focused"),
          scrollable: getBool(ae, "scrollable"),
          long_clickable: getBool(ae, "long_clickable") || getBool(ae, "longClickable"),
          checkable: getBool(ae, "checkable"),
          checked: getBool(ae, "checked"),
          selected: getBool(ae, "selected"),
          password: getBool(ae, "password"),
          xmlCacheId: pickStr(ae, "xmlCacheId", "xml_cache_id"),
          children: getChildren(ae),
        };

        // 🔧 调试：检查映射后的数据
        console.log('🔍 [ElementStructureTree] 映射后的标准化元素数据:', {
          id: normalizedElement.id,
          text: normalizedElement.text,
          content_desc: normalizedElement.content_desc,
          resource_id: normalizedElement.resource_id,
          class_name: normalizedElement.class_name,
        });

        // 如果已有真实子元素，直接使用（不再生成模拟children）
        const hasRealChildren =
          normalizedElement.children &&
          Array.isArray(normalizedElement.children) &&
          normalizedElement.children.length > 0;
        if (hasRealChildren) {
          console.log("✅ [ElementStructureTree] 使用真实子元素数据", {
            id: normalizedElement.id,
            children: Array.isArray(normalizedElement.children)
              ? (normalizedElement.children as unknown[]).length
              : 0,
          });
          setFullElementData(normalizedElement);
          return;
        }

        // 尝试从XML缓存中解析对应节点与其子节点（递归）
        if (normalizedElement.xmlCacheId) {
          try {
            const cacheEntry = await XmlCacheManager.getInstance().getCachedXml(
              normalizedElement.xmlCacheId as string
            );
            if (cacheEntry?.xmlContent) {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(
                cacheEntry.xmlContent,
                "application/xml"
              );
              const allNodes = xmlDoc.querySelectorAll("node");
              const elementIndexMatch = String(normalizedElement.id).match(/element[-_](\d+)/);
              const targetIndex = elementIndexMatch ? parseInt(elementIndexMatch[1], 10) : -1;
              
              // 🎯 优先通过 bounds 精确匹配，避免索引定位错误
              let targetElement: Element | null = null;
              const boundsStr = String(normalizedElement["bounds"] || "");
              
              if (boundsStr) {
                console.log("🎯 [ElementStructureTree] 优先使用bounds匹配:", boundsStr);
                const byBounds = xmlDoc.querySelector(`node[bounds="${boundsStr}"]`);
                if (byBounds) {
                  targetElement = byBounds;
                  console.log("✅ [ElementStructureTree] 通过bounds成功匹配到目标元素");
                }
              }
              
              // 🔁 回退：通过索引匹配
              if (!targetElement && targetIndex >= 0 && targetIndex < allNodes.length) {
                targetElement = allNodes[targetIndex];
                console.log("🔁 [ElementStructureTree] 回退使用索引匹配:", targetIndex);
              }

              console.log("🔍 [ElementStructureTree] 目标元素定位结果:", {
                targetIndex,
                targetElementFound: !!targetElement,
                targetElementBounds: targetElement?.getAttribute("bounds"),
                targetElementText: targetElement?.getAttribute("text"),
                targetElementChildCount: targetElement?.children.length,
                normalizedElementBounds: normalizedElement["bounds"],
                normalizedElementText: normalizedElement["text"]
              });

              const toPojo = (el: Element, idx: number): Record<string, unknown> => ({
                id: `element_${idx}`,
                text: el.getAttribute("text") || "",
                content_desc: el.getAttribute("content-desc") || "",
                class_name: el.getAttribute("class") || el.tagName,
                bounds: el.getAttribute("bounds") || "",
                clickable: el.getAttribute("clickable") === "true",
                enabled: el.getAttribute("enabled") === "true",
                focusable: el.getAttribute("focusable") === "true",
                focused: el.getAttribute("focused") === "true",
                scrollable: el.getAttribute("scrollable") === "true",
                long_clickable: el.getAttribute("long-clickable") === "true",
                checkable: el.getAttribute("checkable") === "true",
                checked: el.getAttribute("checked") === "true",
                selected: el.getAttribute("selected") === "true",
                password: el.getAttribute("password") === "true",
                resource_id: el.getAttribute("resource-id") || "",
                element_type: (el.getAttribute("class") || "").split(".").pop() || el.tagName,
              });

              // 解析bounds字符串 -> 矩形
              const parseBounds = (boundsStr?: string) => {
                if (!boundsStr) return null as null | { x: number; y: number; w: number; h: number };
                const nums = boundsStr.match(/\d+/g)?.map(Number) || [];
                if (nums.length !== 4) return null;
                const [left, top, right, bottom] = nums;
                return { x: left, y: top, w: right - left, h: bottom - top };
              };

              // 使用“用户点选元素”的bounds作为严格可视区域过滤（优先），兜底为目标XML节点的bounds
              const selectedBoundsStr = String(
                (normalizedElement["bounds"] as string) || targetElement.getAttribute("bounds") || ""
              );
              const rootRect = parseBounds(selectedBoundsStr);

              const isWithin = (
                child: { x: number; y: number; w: number; h: number },
                root: { x: number; y: number; w: number; h: number }
              ) => {
                // 要求子完全落入选中区域，避免把整页其他区域一起带入
                const withinX = child.x >= root.x && child.x + child.w <= root.x + root.w;
                const withinY = child.y >= root.y && child.y + child.h <= root.y + root.h;
                return withinX && withinY;
              };

              // 🎯 递归解析所有子孙元素（完整树结构展示）
              const parseRecursively = (el: Element, depth: number = 0): Record<string, unknown> => {
                const idx = Array.from(allNodes).indexOf(el);
                const base = toPojo(el, Math.max(0, idx));
                const elementChildren = Array.from(el.children) as Element[];
                
                if (elementChildren.length > 0) {
                  // 基于选中区域进行严格过滤（只在第一层过滤，避免渲染"整页"）
                  const filtered = (depth === 0 && rootRect)
                    ? elementChildren.filter((c) => {
                        const b = c.getAttribute("bounds") || "";
                        const rect = parseBounds(b);
                        return rect ? isWithin(rect, rootRect) : true; // 无bounds的节点保留
                      })
                    : elementChildren;
                  
                  if (depth === 0) {
                    console.log(`🎯 [ElementStructureTree] 第一层过滤 - 深度${depth}:`, {
                      当前元素: el.getAttribute('bounds'),
                      原始子节点数: elementChildren.length,
                      过滤后子节点数: filtered.length,
                      说明: '只过滤第一层子节点，后续层级完全递归'
                    });
                  }
                  
                  // � 完全递归解析所有子孙节点
                  (base as Record<string, unknown>)["children"] = filtered.map(c => parseRecursively(c, depth + 1));
                } else {
                  (base as Record<string, unknown>)["children"] = [];
                }
                return base;
              };

              if (targetElement) {
                const enhanced = {
                  ...normalizedElement,
                  // 原始值为空就空，不强行覆盖；只在显示字段为空时，用XML补充显示值，不改变“原始值”语义
                  text:
                    (normalizedElement["text"] as string) ||
                    targetElement.getAttribute("text") ||
                    "",
                  content_desc:
                    (normalizedElement["content_desc"] as string) ||
                    targetElement.getAttribute("content-desc") ||
                    "",
                  resource_id:
                    (normalizedElement["resource_id"] as string) ||
                    targetElement.getAttribute("resource-id") ||
                    "",
                  class_name:
                    (normalizedElement["class_name"] as string) ||
                    targetElement.getAttribute("class") ||
                    "",
                  bounds:
                    (normalizedElement["bounds"] as string) ||
                    targetElement.getAttribute("bounds") ||
                    "",
                  clickable:
                    Boolean(normalizedElement["clickable"]) ||
                    targetElement.getAttribute("clickable") === "true",
                  parent: targetElement.parentElement
                    ? toPojo(
                        targetElement.parentElement,
                        Array.from(allNodes).indexOf(targetElement.parentElement)
                      )
                    : undefined,
                  children: (() => {
                    const children = Array.from(targetElement.children) as Element[];
                    console.log("🌳 [ElementStructureTree] 构建children数组:", {
                      targetElement_bounds: targetElement.getAttribute("bounds"),
                      targetElement_text: targetElement.getAttribute("text"),
                      children_count: children.length,
                      children_bounds: children.map(c => c.getAttribute("bounds")).slice(0, 5),
                      children_text: children.map(c => c.getAttribute("text")).slice(0, 5)
                    });
                    
                    if (children.length === 0) return [] as unknown[];
                    // 同样对第一层子节点做一次严格可视区域过滤
                    const filtered = rootRect
                      ? children.filter((c) => {
                          const b = c.getAttribute("bounds") || "";
                          const rect = parseBounds(b);
                          return rect ? isWithin(rect, rootRect) : true;
                        })
                      : children;
                    
                    console.log("🎯 [ElementStructureTree] 过滤后children:", {
                      original_count: children.length,
                      filtered_count: filtered.length,
                      rootRect
                    });
                    
                    // 🔁 完全递归解析所有子孙节点（depth=1表示第一层子节点，会继续往下递归）
                    return filtered.map(c => parseRecursively(c, 1));
                  })(),
                } as Record<string, unknown>;

                console.log("✅ [ElementStructureTree] 从XML解析完成", {
                  id: enhanced.id,
                  childCount: Array.isArray((enhanced as Record<string, unknown>)["children"] as unknown[])
                    ? ((enhanced as Record<string, unknown>)["children"] as unknown[]).length
                    : 0,
                });
                setFullElementData(enhanced);
                return;
              } else {
                console.warn("⚠️ [ElementStructureTree] 未在XML中找到目标元素", {
                  id: normalizedElement.id,
                  targetIndex,
                  totalNodes: allNodes.length,
                });
              }
            }
          } catch (e) {
            console.warn("⚠️ [ElementStructureTree] XML解析失败，回退到基础数据", e);
          }
        }

        // 默认：不生成模拟children，按真实数据展示（可能没有children）
        console.log("ℹ️ [ElementStructureTree] 使用基础元素数据（不生成模拟children）");
        setFullElementData({ ...normalizedElement, children: normalizedElement.children || [] });
      } catch (error) {
        console.error("❌ [ElementStructureTree] 处理失败:", error);
        setFullElementData({} as Record<string, unknown>);
      }
    };

    parseElementFromXML();
  }, [selectedElement]);

  // 当树数据或展开状态变化时，重新计算视窗策略（自适应高度 / 虚拟滚动）
  useEffect(() => {
    recalcTreeViewport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedKeys, fullElementData]);

  // 监听窗口尺寸变化，保持视窗策略合理
  useEffect(() => {
    const onResize = () => recalcTreeViewport();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 订阅协调总线的高亮/选中事件（rAF 合并高亮）；高亮只做命令式 DOM 类名切换，避免整树重渲染
  useEffect(() => {
    let raf: number | null = null;
    let pendingHighlightId: string | null = null;
    const unsubscribe = structuralMatchingCoordinationBus.subscribe((evt) => {
      if (evt.type === "highlight") {
        pendingHighlightId = normalizeElementId(evt.elementId ?? null);
        if (raf == null) {
          raf = requestAnimationFrame(() => {
            raf = null;
            // 如果高亮ID无变化，跳过
            if (pendingHighlightId === lastHighlightIdRef.current) return;

            // 移除上一个高亮类
            if (highlightedDomRef.current) {
              highlightedDomRef.current.classList.remove("tree-node-content--highlight");
              highlightedDomRef.current = null;
            }

            lastHighlightIdRef.current = pendingHighlightId;
            if (!pendingHighlightId || !listHolderRef.current) return;
            const el = listHolderRef.current.querySelector<HTMLElement>(
              `[data-node-id="${pendingHighlightId}"]`
            );
            if (el) {
              // 目标是 .tree-node-content 自己
              el.classList.add("tree-node-content--highlight");
              highlightedDomRef.current = el;
            }
          });
        }
      } else if (evt.type === "select") {
        const id = normalizeElementId(evt.elementId ?? null);
        if (id === lastSelectedIdRef.current) return; // 无变化

        // 清除上一次选中
        if (selectedDomRef.current) {
          selectedDomRef.current.classList.remove("tree-node-content--selected");
          selectedDomRef.current = null;
        }

        lastSelectedIdRef.current = id;
        if (id && listHolderRef.current) {
          const el = listHolderRef.current.querySelector<HTMLElement>(
            `[data-node-id="${id}"]`
          );
          if (el) {
            el.classList.add("tree-node-content--selected");
            selectedDomRef.current = el;
            // 仅在选中时滚动定位
            el.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        }
      } else if (evt.type === "clear") {
        pendingHighlightId = null;
        lastHighlightIdRef.current = null;
        if (highlightedDomRef.current) {
          highlightedDomRef.current.classList.remove("tree-node-content--highlight");
          highlightedDomRef.current = null;
        }
        // 同时清理选中态（可选：如不希望clear影响选中，可移除此段）
        lastSelectedIdRef.current = null;
        if (selectedDomRef.current) {
          selectedDomRef.current.classList.remove("tree-node-content--selected");
          selectedDomRef.current = null;
        }
      }
    });
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      unsubscribe();
    };
  }, []);

  // 构建树形数据
  const buildTreeData = (): { treeData: DataNode[]; allKeys: string[] } => {
    if (!fullElementData) {
      return { treeData: [], allKeys: [] };
    }

    console.log("🌳 [ElementStructureTree] 使用完整数据构建树:", {
      elementId: fullElementData.id,
      hasChildren: !!fullElementData.children,
      childrenCount: Array.isArray(fullElementData.children)
        ? fullElementData.children.length
        : 0,
    });

    const allKeys: string[] = [];

    const buildNodeTitle = (
      element: Record<string, unknown>,
      depth: number,
      elementPath: string
    ) => {
  const nodeRawId = String(element.id || "");
  const nodeId = normalizeElementId(nodeRawId);
      const pickString = (obj: Record<string, unknown>, key: string) => {
        const v = obj[key];
        return typeof v === "string" && v.length > 0 ? v : undefined;
      };
      const isRoot = depth === 0;
      const className = String(
        element.class_name || element.className || pickString(element, "class") || "Unknown"
      );
      const clickable = element.clickable === true;
      const enabled = element.enabled === true;
      const focusable = element.focusable === true;
      const focused = element.focused === true;
      const scrollable = element.scrollable === true;
      const longClickable = element.long_clickable === true || element.longClickable === true;
      const checkable = element.checkable === true;
      const checked = element.checked === true;
      const selected = element.selected === true;
      const password = element.password === true;
      const bounds = String(element.bounds || "");
      const text = String(element.text || "");
      const contentDesc =
        (element.content_desc as string) ||
        (element.contentDesc as string) ||
        pickString(element, "content-desc") ||
        "";
      const resourceId =
        (element.resource_id as string) ||
        (element.resourceId as string) ||
        pickString(element, "resource-id") ||
        "";

      return (
        <div
          className={`tree-node-content`}
          data-node-id={nodeId || undefined}
          data-element-info={(() => {
            try {
              return JSON.stringify(element);
            } catch {
              return undefined;
            }
          })()}
          onMouseEnter={() => {
            // 轻去抖（~32ms），只点亮稳定停留的节点
            if (hoverDebounceTimerRef.current != null) {
              clearTimeout(hoverDebounceTimerRef.current);
              hoverDebounceTimerRef.current = null;
            }
            hoverPendingIdRef.current = nodeId;
            hoverDebounceTimerRef.current = window.setTimeout(() => {
              if (hoverRafRef.current == null) {
                hoverRafRef.current = requestAnimationFrame(() => {
                  hoverRafRef.current = null;
                  // 若在等待期间鼠标已离开，放弃发射
                  if (hoverPendingIdRef.current !== nodeId) return;
                  structuralMatchingCoordinationBus.emit({
                    type: "highlight",
                    elementId: nodeId,
                    source: "tree",
                  });
                });
              }
            }, getHoverDebounceMs());
          }}
          onMouseLeave={() => {
            // 轻去抖清理高亮，避免频闪
            if (hoverDebounceTimerRef.current != null) {
              clearTimeout(hoverDebounceTimerRef.current);
              hoverDebounceTimerRef.current = null;
            }
            hoverPendingIdRef.current = null;
            hoverDebounceTimerRef.current = window.setTimeout(() => {
              if (hoverRafRef.current == null) {
                hoverRafRef.current = requestAnimationFrame(() => {
                  hoverRafRef.current = null;
                  // 确认没有新的 hover 目标
                  if (hoverPendingIdRef.current != null) return;
                  structuralMatchingCoordinationBus.emit({ type: "clear", source: "tree" });
                });
              }
            }, getHoverDebounceMs());
          }}
          onClick={() => {
            if (!nodeId) return;
            // 选中：发射 select，并让树侧命令式添加选中态与滚动
            structuralMatchingCoordinationBus.emit({
              type: "select",
              elementId: nodeId,
              source: "tree",
            });
          }}
        >
          {/* 节点头部 */}
          <div className="node-header">
            <Space size="small">
              {/* 深度标识 */}
              <Badge
                count={
                  depth === -1
                    ? "父层"
                    : depth === 0
                    ? "外层"
                    : depth === 1
                    ? "第1层"
                    : depth === 2
                    ? "第2层"
                    : `第${depth}层`
                }
                style={{
                  backgroundColor:
                    depth === -1
                      ? "#722ed1"
                      : depth === 0
                      ? "#f5222d"
                      : depth === 1
                      ? "#52c41a"
                      : "#1890ff",
                  fontSize: 10,
                }}
              />

              {/* 类名 */}
              <Text strong style={{ fontSize: 13 }}>
                {className.split(".").pop()}
              </Text>

              {/* 可点击标识 */}
              {clickable ? (
                <Tag color="success" style={{ margin: 0 }}>
                  <CheckCircleOutlined /> 可点击
                </Tag>
              ) : (
                <Tag color="default" style={{ margin: 0 }}>
                  <CloseCircleOutlined /> 不可点击
                </Tag>
              )}

              {/* 根节点标识 */}
              {isRoot && (
                <Tag color="orange" style={{ margin: 0 }}>
                  👆 你点击的
                </Tag>
              )}

              {/* 父元素标识 */}
              {depth === -1 && (
                <Tag color="purple" style={{ margin: 0 }}>
                  🔼 父元素
                </Tag>
              )}
            </Space>
          </div>

          {/* 字段显示模式切换 */}
          <div style={{ 
            margin: "8px 0", 
            padding: "6px 8px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "4px",
            border: "1px solid #e8e8e8"
          }}>
            <Space size="small" style={{ width: "100%", justifyContent: "space-between" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                字段显示模式:
              </Text>
              <Space size="middle" style={{ flexWrap: "wrap" }}>
                {/* 全局字段显示模式 */}
                <Space size="small">
                  <Switch
                    size="small"
                    checked={Object.values(elementShowAllFields).every(Boolean) && Object.keys(elementShowAllFields).length > 0}
                    onChange={(checked) => {
                      // 全局设置所有元素的显示模式
                      if (element) {
                        const allPaths = [getElementPath(element)];
                        // TODO: 收集所有子元素路径
                        const newState: Record<string, boolean> = {};
                        allPaths.forEach(path => {
                          newState[path] = checked;
                        });
                        setElementShowAllFields(newState);
                      }
                    }}
                    checkedChildren="全部"
                    unCheckedChildren="骨架"
                  />
                  <Tooltip title="全局切换：显示所有元素的全部字段 或 仅显示骨架字段">
                    <InfoCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                  </Tooltip>
                </Space>

                {/* 骨架匹配模式 */}
                <Space size="small">
                  <Select
                    size="small"
                    value={skeletonMode}
                    onChange={setSkeletonMode}
                    style={{ width: 100 }}
                    options={[
                      { 
                        value: SkeletonMatchMode.FAMILY, 
                        label: "同类",
                      },
                      { 
                        value: SkeletonMatchMode.CLONE, 
                        label: "精确",
                      }
                    ]}
                  />
                  <Tooltip title={skeletonMode === SkeletonMatchMode.FAMILY ? "Family模式：找同类骨架，非空↔非空，布尔等值" : "Clone模式：精确克隆，所有字段值完全一模一样"}>
                    <InfoCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                  </Tooltip>
                </Space>

                {/* 智能配置模式 */}
                <Space size="small">
                  <Switch
                    size="small"
                    checked={smartModeEnabled}
                    onChange={setSmartModeEnabled}
                    checkedChildren="智能"
                    unCheckedChildren="手动"
                  />
                  <Tooltip title={smartModeEnabled ? "智能模式：自动配置有意义字段和策略，限制手动修改" : "手动模式：允许完全自定义字段配置和策略"}>
                    <InfoCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                  </Tooltip>
                </Space>

                {/* 易变字段开关（仅在智能模式下显示） */}
                {smartModeEnabled && (
                  <Space size="small">
                    <Switch
                      size="small"
                      checked={ignoreVolatileFields}
                      onChange={setIgnoreVolatileFields}
                      checkedChildren="忽略数字"
                      unCheckedChildren="包含数字"
                    />
                    <Tooltip title="忽略易变字段（数字、时间戳、计数）避免因动态内容导致0命中">
                      <InfoCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                    </Tooltip>
                  </Space>
                )}
              </Space>
            </Space>
          </div>

          {/* 节点属性 */}
          <div className="node-properties">
            {/* Resource-ID */}
            {buildConditionalFieldRow(
              elementPath,
              "resource_id",
              "Resource-ID",
              resourceId || "(空)",
              FieldType.RESOURCE_ID
            )}

            {/* Content-Desc */}
            {buildConditionalFieldRow(
              elementPath,
              "content_desc",
              "Content-Desc",
              contentDesc || "(空)",
              FieldType.CONTENT_DESC
            )}

            {/* Text */}
            {buildConditionalFieldRow(
              elementPath,
              "text",
              "Text",
              text || "(空)",
              FieldType.TEXT
            )}

            {/* Bounds */}
            {buildConditionalFieldRow(
              elementPath,
              "bounds",
              "Bounds",
              bounds,
              FieldType.BOUNDS,
              true // disabled
            )}

            {/* Class Name */}
            {buildConditionalFieldRow(
              elementPath,
              "class_name",
              "Class Name",
              className,
              FieldType.CLASS_NAME
            )}

            {/* Clickable */}
            {buildConditionalFieldRow(
              elementPath,
              "clickable",
              "Clickable",
              clickable ? "true" : "false",
              FieldType.CLICKABLE
            )}

            {/* Enabled */}
            {buildConditionalFieldRow(
              elementPath,
              "enabled",
              "Enabled",
              enabled ? "true" : "false",
              FieldType.ENABLED
            )}

            {/* Focusable */}
            {buildConditionalFieldRow(
              elementPath,
              "focusable",
              "Focusable",
              focusable ? "true" : "false",
              FieldType.FOCUSABLE
            )}

            {/* Focused */}
            {buildConditionalFieldRow(
              elementPath,
              "focused",
              "Focused",
              focused ? "true" : "false",
              FieldType.FOCUSED
            )}

            {/* Scrollable */}
            {buildConditionalFieldRow(
              elementPath,
              "scrollable",
              "Scrollable",
              scrollable ? "true" : "false",
              FieldType.SCROLLABLE
            )}

            {/* Long-Clickable */}
            {buildConditionalFieldRow(
              elementPath,
              "long_clickable",
              "Long-Clickable",
              longClickable ? "true" : "false",
              FieldType.LONG_CLICKABLE
            )}

            {/* Checkable */}
            {buildConditionalFieldRow(
              elementPath,
              "checkable",
              "Checkable",
              checkable ? "true" : "false",
              FieldType.CHECKABLE
            )}

            {/* Checked */}
            {buildConditionalFieldRow(
              elementPath,
              "checked",
              "Checked",
              checked ? "true" : "false",
              FieldType.CHECKED
            )}

            {/* Selected */}
            {buildConditionalFieldRow(
              elementPath,
              "selected",
              "Selected",
              selected ? "true" : "false",
              FieldType.SELECTED
            )}

            {/* Password */}
            {buildConditionalFieldRow(
              elementPath,
              "password",
              "Password",
              password ? "true" : "false",
              FieldType.PASSWORD
            )}
          </div>
        </div>
      );
    };

    // 🎯 骨架匹配配置：根据模式和字段类型自动配置策略
    const getSmartFieldConfig = (elementPath: string, fieldType: FieldType, value: string) => {
      const baseConfig = getFieldConfig(elementPath, fieldType);
      const isMeaningful = isFieldMeaningful(fieldType, value);
      
      // 获取字段类型对应的策略配置
      const fieldTypeStr = Object.keys(FieldType).find(key => FieldType[key as keyof typeof FieldType] === fieldType) || 'OTHER';
      const strategyConfig = getDefaultFieldStrategy(fieldTypeStr, skeletonMode, ignoreVolatileFields);
      
      // 🎯 核心策略：有意义的字段自动启用
      const smartEnabled = isMeaningful && strategyConfig.enabled;
      
      // 🔧 根据骨架匹配模式和字段策略确定匹配策略
      let smartStrategy = baseConfig.strategy;
      
      if (isMeaningful) {
        // 根据字段策略映射到MatchStrategy
        switch (strategyConfig.strategy) {
          case FieldMatchStrategy.EQUALS:
            smartStrategy = MatchStrategy.EXACT_MATCH;
            break;
          case FieldMatchStrategy.EXISTS:
            if ([FieldType.TEXT, FieldType.CONTENT_DESC].includes(fieldType)) {
              smartStrategy = MatchStrategy.BOTH_NON_EMPTY;
            } else {
              smartStrategy = MatchStrategy.CONSISTENT_EMPTINESS;
            }
            break;
          case FieldMatchStrategy.CONTAINS:
            // TODO: 需要扩展MatchStrategy支持包含匹配
            smartStrategy = MatchStrategy.BOTH_NON_EMPTY;
            break;
          case FieldMatchStrategy.PATTERN:
            // TODO: 需要扩展MatchStrategy支持模式匹配
            smartStrategy = MatchStrategy.BOTH_NON_EMPTY;
            break;
          case FieldMatchStrategy.IGNORE:
            smartStrategy = MatchStrategy.CONSISTENT_EMPTINESS;
            break;
          default:
            smartStrategy = MatchStrategy.CONSISTENT_EMPTINESS;
        }
      }
      
      return {
        ...baseConfig,
        enabled: smartEnabled,
        strategy: smartStrategy,
      };
    };

    // 条件渲染字段行：根据显示模式和字段意义决定是否显示
    const buildConditionalFieldRow = (
      elementPath: string,
      key: string,
      label: string,
      value: string,
      fieldType: FieldType,
      disabled = false
    ) => {
      // 如果显示所有字段，或者字段有意义，则渲染
      const shouldShow = showAllFields || isFieldMeaningful(fieldType, value);
      if (!shouldShow) return null;

      return buildFieldRow(elementPath, key, label, value, fieldType, disabled);
    };

    const buildFieldRow = (
      elementPath: string,
      key: string,
      label: string,
      value: string,
      fieldType: FieldType,
      disabled = false
    ) => {
      const isEmpty = !value || value === "(空)";
      
      // 🎯 配置选择：智能模式 vs 手动模式
      const baseConfig = getFieldConfig(elementPath, fieldType);
      const smartConfig = smartModeEnabled 
        ? getSmartFieldConfig(elementPath, fieldType, value)
        : baseConfig;
      
      // 判断是否是智能配置的字段
      const isSkeletonEnabled = smartModeEnabled && smartConfig.enabled && !baseConfig.enabled;
      const isForceExactMatch = smartModeEnabled && smartConfig.strategy !== baseConfig.strategy;
      const isMeaningful = isFieldMeaningful(fieldType, value);
      
      const isEnabled = smartConfig.enabled && !disabled;

      return (
        <div key={key} className="field-row">
          <Space size="small" style={{ width: "100%" }}>
            {/* 启用开关 */}
            <Switch
              size="small"
              checked={smartConfig.enabled}
              disabled={disabled || (smartModeEnabled && isMeaningful)} // 智能模式下，有意义字段自动启用不可关闭
              onChange={() => onToggleField(elementPath, fieldType)}
            />
            
            {/* 骨架字段标识（仅智能模式） */}
            {smartModeEnabled && isSkeletonEnabled && (
              <Tooltip title="此字段是骨架特征，已自动启用匹配">
                <Tag color="green" style={{ margin: 0, fontSize: 9 }}>
                  骨架字段
                </Tag>
              </Tooltip>
            )}

            {/* 字段名 */}
            <Text
              type={isEnabled ? undefined : "secondary"}
              style={{ minWidth: 100, fontSize: 12 }}
            >
              {label}:
            </Text>

            {/* 字段值 */}
            <Tooltip title={value.length > 40 ? value : undefined}>
              <Text
                code
                type={isEmpty ? "secondary" : undefined}
                style={{
                  fontSize: 11,
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {value.length > 40 ? `${value.substring(0, 40)}...` : value}
              </Text>
            </Tooltip>

            {/* 匹配策略选择下拉框 */}
            {!disabled && (
              <Select
                size="small"
                value={smartConfig.strategy || MatchStrategy.CONSISTENT_EMPTINESS}
                disabled={!isEnabled || (smartModeEnabled && isMeaningful && isForceExactMatch)} // 智能模式下，骨架强制策略不可修改
                style={{ minWidth: 120 }}
                onChange={(strategy: MatchStrategy) => {
                  if (onUpdateField) {
                    onUpdateField(elementPath, fieldType, { strategy });
                  }
                }}
              >
                {Object.values(MatchStrategy).map((strategy) => (
                  <Select.Option key={strategy} value={strategy}>
                    <Tooltip
                      title={MATCH_STRATEGY_DESCRIPTIONS[strategy]}
                      placement="right"
                    >
                      <span style={{ fontSize: 11 }}>
                        {MATCH_STRATEGY_DISPLAY_NAMES[strategy]}
                      </span>
                    </Tooltip>
                  </Select.Option>
                ))}
              </Select>
            )}
            
            {/* 强制精确匹配标识（仅智能模式） */}
            {smartModeEnabled && isForceExactMatch && isMeaningful && (
              <Tooltip title="骨架字段强制使用精确匹配策略，确保子树结构一致性">
                <Tag color="orange" style={{ margin: 0, fontSize: 9 }}>
                  强制精确
                </Tag>
              </Tooltip>
            )}

            {/* 配置状态 */}
            {isEnabled && (
              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                权重: {(smartConfig.weight ?? 1.0).toFixed(1)}x
              </Tag>
            )}

            {disabled && (
              <Tag color="default" style={{ margin: 0, fontSize: 10 }}>
                不参与
              </Tag>
            )}
          </Space>
        </div>
      );
    };

    const buildTreeNode = (
      element: Record<string, unknown>,
      depth: number,
      parentKey: string,
      index: number
    ): DataNode => {
      const nodeKey = `${parentKey}-${index}`;
      allKeys.push(nodeKey); // 收集所有节点的key

      const children = (element.children as Record<string, unknown>[]) || [];
      const elementPath = `${parentKey}-${index}`;

      return {
        key: nodeKey,
        title: buildNodeTitle(element, depth, elementPath),
        children:
          children.length > 0
            ? children.map((child: Record<string, unknown>, idx: number) =>
                buildTreeNode(child, depth + 1, nodeKey, idx)
              )
            : undefined,
        selectable: false,
      };
    };

    // 🎯 始终从点选的元素作为根节点开始构建树
    console.log("🎯 [ElementStructureTree] 从点选元素开始构建树结构", {
      hasParent: !!fullElementData.parent,
      hasChildren: Array.isArray(fullElementData.children) && fullElementData.children.length > 0
    });

    return {
      treeData: [buildTreeNode(fullElementData, 0, "root", 0)], // depth=0 表示这是根节点（用户点选的）
      allKeys,
    };
  };

  const { treeData, allKeys } = buildTreeData();

  // 默认展开所有节点
  useEffect(() => {
    if (allKeys.length > 0 && expandedKeys.length === 0) {
      setExpandedKeys(allKeys);
    }
  }, [allKeys, expandedKeys.length]);

  // 如果还在加载完整数据，显示加载状态
  if (!fullElementData) {
    return (
      <div className="element-structure-tree light-theme-force">
        <div className="tree-header">
          <Space>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <Text strong>元素结构</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              正在从XML缓存解析完整结构...
            </Text>
          </Space>
        </div>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">解析元素层级结构中...</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="element-structure-tree light-theme-force">
      <div className="tree-header">
        <Space>
          <InfoCircleOutlined style={{ color: "#1890ff" }} />
          <Text strong>🌳 元素结构树 (新版组件)</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            展开查看层级结构，启用/禁用字段来配置匹配规则
          </Text>
        </Space>
      </div>

      <div ref={listHolderRef}>
        <Tree
          className="structural-tree"
          showLine
          showIcon={false}
          switcherIcon={<DownOutlined />}
          virtual={treeViewport.virtual}
          {...(treeViewport.height ? { height: treeViewport.height } : {})}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          treeData={treeData}
        />
      </div>

      {/* 如果没有子元素，显示提示 */}
      {(!fullElementData.children ||
        (Array.isArray(fullElementData.children) &&
          fullElementData.children.length === 0)) && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            📄 此元素暂无子元素层级结构数据
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            显示的是元素的基础属性信息。要查看完整的子元素层级，需要从XML缓存中提取完整结构。
          </Text>
          <br />
          <Text
            type="secondary"
            style={{ fontSize: 10, marginTop: 4, display: "block" }}
          >
            💡 当前数据来源:{" "}
            {fullElementData.xmlCacheId
              ? `XML缓存 (${fullElementData.xmlCacheId})`
              : "步骤卡片数据"}
          </Text>
        </div>
      )}

      {/* 子元素结构匹配 */}
      {(() => {
        const rootPath = "root-0"; // 假设根节点路径
        const childrenConfig = getFieldConfig(
          rootPath,
          FieldType.CHILDREN_STRUCTURE
        );

        return (
          <div className="children-structure-config">
            <div className="field-row">
              <Space size="small" style={{ width: "100%" }}>
                <Switch
                  size="small"
                  checked={childrenConfig.enabled}
                  onChange={() =>
                    onToggleField(rootPath, FieldType.CHILDREN_STRUCTURE)
                  }
                />
                <Text strong={childrenConfig.enabled}>子元素结构匹配</Text>
                <Tooltip title="检查候选元素是否包含相同的子元素结构（类名序列）">
                  <InfoCircleOutlined
                    style={{ color: "#8c8c8c", fontSize: 12 }}
                  />
                </Tooltip>
                {childrenConfig.enabled && (
                  <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                    权重: {(childrenConfig.weight ?? 1.0).toFixed(1)}x
                  </Tag>
                )}
              </Space>
            </div>
            {childrenConfig.enabled && (
              <Text
                type="secondary"
                style={{ fontSize: 11, marginLeft: 30, display: "block" }}
              >
                将匹配: 图片容器 + 作者栏 (头像 + 作者名 + 点赞按钮 + 点赞数)
              </Text>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default ElementStructureTree;
