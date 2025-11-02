// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree.tsx
// module: structural-matching | layer: ui | role: 元素结构树展示
// summary: 可视化展示元素的层级结构，支持展开/收起和字段配置，从XML缓存动态解析子元素

import React, { useState, useEffect } from "react";
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
import "./element-structure-tree.css";
import XmlCacheManager from "../../../../../services/xml-cache-manager";

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
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [fullElementData, setFullElementData] = useState<Record<string, unknown> | null>(null);

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
      const pickString = (obj: Record<string, unknown>, key: string) => {
        const v = obj[key];
        return typeof v === "string" && v.length > 0 ? v : undefined;
      };
      const isRoot = depth === 0;
      const className = String(
        element.class_name || element.className || pickString(element, "class") || "Unknown"
      );
      const clickable = element.clickable === true;
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
          className="tree-node-content"
          data-element-info={(() => {
            try {
              return JSON.stringify(element);
            } catch {
              return undefined;
            }
          })()}
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

          {/* 节点属性 */}
          <div className="node-properties">
            {/* Resource-ID */}
            {buildFieldRow(
              elementPath,
              "resource_id",
              "Resource-ID",
              resourceId || "(空)",
              FieldType.RESOURCE_ID
            )}

            {/* Content-Desc */}
            {buildFieldRow(
              elementPath,
              "content_desc",
              "Content-Desc",
              contentDesc || "(空)",
              FieldType.CONTENT_DESC
            )}

            {/* Text */}
            {buildFieldRow(
              elementPath,
              "text",
              "Text",
              text || "(空)",
              FieldType.TEXT
            )}

            {/* Bounds */}
            {buildFieldRow(
              elementPath,
              "bounds",
              "Bounds",
              bounds,
              FieldType.BOUNDS,
              true // disabled
            )}

            {/* Class Name */}
            {buildFieldRow(
              elementPath,
              "class_name",
              "Class Name",
              className,
              FieldType.CLASS_NAME
            )}
          </div>
        </div>
      );
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
      const config = getFieldConfig(elementPath, fieldType);
      const isEnabled = config.enabled && !disabled;

      return (
        <div key={key} className="field-row">
          <Space size="small" style={{ width: "100%" }}>
            {/* 启用开关 */}
            <Switch
              size="small"
              checked={config.enabled}
              disabled={disabled}
              onChange={() => onToggleField(elementPath, fieldType)}
            />

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
                value={config.strategy || MatchStrategy.CONSISTENT_EMPTINESS}
                disabled={!isEnabled}
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

            {/* 配置状态 */}
            {isEnabled && (
              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                权重: {config.weight.toFixed(1)}x
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

      <Tree
        className="structural-tree"
        showLine
        showIcon={false}
        switcherIcon={<DownOutlined />}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys as string[])}
        treeData={treeData}
      />

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
                    权重: {childrenConfig.weight.toFixed(1)}x
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
