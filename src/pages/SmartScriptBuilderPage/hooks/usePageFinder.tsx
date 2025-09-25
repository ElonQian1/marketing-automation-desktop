import React, { useState, useCallback, useMemo } from "react";
import { message, FormInstance } from "antd";
import SmartStepGenerator from "../../../modules/SmartStepGenerator";
import {
  ElementLocator,
  XmlSnapshot,
  createXmlSnapshot,
} from "../../../types/selfContainedScript";
import {
  SmartActionType,
} from "../../../types/smartComponents";
import { ExtendedSmartScriptStep } from "../../../types/loopScript";
import {
  parseBoundsString,
  rectToBoundsString,
} from "../../../components/universal-ui/utils/bounds";
import XmlCacheManager from "../../../services/XmlCacheManager";
import { Device } from "../../../domain/adb/entities/Device";
import {
  buildShortTitleFromCriteria,
  buildShortDescriptionFromCriteria,
} from "../helpers/titleBuilder";
import { buildAndCacheDefaultMatchingFromElement } from "../helpers/matchingHelpers";
import buildXmlSnapshotFromContext from "../helpers/xmlSnapshotHelper";
import sanitizeContentDesc from "../helpers/contentDescSanitizer";
import type { NodeLocator } from "../../../domain/inspector/entities/NodeLocator";
import type {
  MatchCriteria as UIMatchCriteria,
  MatchStrategy as UIMatchStrategy,
} from "../../../components/universal-ui/views/grid-view/panels/node-detail/types";
import { createBindingFromSnapshotAndXPath } from "../../../components/step-card/element-binding/helpers";

// 🆕 导入增强匹配系统
import { EnhancedMatchingHelper } from "../../../modules/enhanced-matching/integration/EnhancedMatchingHelper";

// 轻量正则转义，避免用户输入影响 ^...$ 模式
const escapeRegex = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface SnapshotFixMode {
  enabled: boolean;
  forStepId?: string;
}

export interface UsePageFinderDeps {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  form: FormInstance;
  currentDeviceId: string;
  devices: Device[];
  showAddModal: (options?: { resetFields?: boolean }) => void;
  // 新增依赖
  setEditingStep: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep | null>>;
  handleSaveStep: () => Promise<void>;
}

export function usePageFinder(deps: UsePageFinderDeps) {
  const {
    steps,
    setSteps,
    form,
    currentDeviceId,
    devices,
    showAddModal,
    setEditingStep,
    handleSaveStep,
  } = deps;

  const [showPageAnalyzer, setShowPageAnalyzer] = useState(false);
  const [snapshotFixMode, setSnapshotFixMode] = useState<SnapshotFixMode>({
    enabled: false,
  });
  const [pendingAutoResave, setPendingAutoResave] = useState<boolean>(false);
  const [isQuickAnalyzer, setIsQuickAnalyzer] = useState(false);
  const [editingStepForParams, setEditingStepForParams] = useState<ExtendedSmartScriptStep | null>(null);
  const [allowSaveWithoutXmlOnce, setAllowSaveWithoutXmlOnce] = useState<boolean>(false);
  const [currentXmlContent, setCurrentXmlContent] = useState<string>("");
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<Partial<XmlSnapshot["deviceInfo"]>>({});
  const [currentPageInfo, setCurrentPageInfo] = useState<Partial<XmlSnapshot["pageInfo"]>>({});

  const openPageAnalyzer = (options: {
    quick?: boolean;
    forStep?: ExtendedSmartScriptStep | null;
    fixSnapshot?: boolean;
    stepIdToFix?: string;
  }) => {
    setIsQuickAnalyzer(options.quick || false);
    setEditingStepForParams(options.forStep || null);
    if (options.fixSnapshot && options.stepIdToFix) {
      setSnapshotFixMode({ enabled: true, forStepId: options.stepIdToFix });
      setPendingAutoResave(true);
    }
    setShowPageAnalyzer(true);
  };

  const updateCurrentXmlContext = useCallback(
    (
      xmlContent: string,
      deviceInfo?: Partial<XmlSnapshot["deviceInfo"]>,
      pageInfo?: Partial<XmlSnapshot["pageInfo"]>
    ) => {
      if (currentXmlContent === xmlContent) return;
      setCurrentXmlContent(xmlContent);
      if (deviceInfo) setCurrentDeviceInfo((prev) => ({ ...prev, ...deviceInfo }));
      if (pageInfo) setCurrentPageInfo((prev) => ({ ...prev, ...pageInfo }));
    },
    [currentXmlContent]
  );

  const openPageFinderForStep = (step: ExtendedSmartScriptStep) => {
    setEditingStepForParams(step);
    setIsQuickAnalyzer(false);
    setShowPageAnalyzer(true);
  };

  const openQuickPageFinder = () => {
    setIsQuickAnalyzer(true);
    setEditingStepForParams(null);
    setShowPageAnalyzer(true);
  };

  const openSnapshotFixer = (stepId: string) => {
    setSnapshotFixMode({ enabled: true, forStepId: stepId });
    setPendingAutoResave(true);
    setIsQuickAnalyzer(false);
    setEditingStepForParams(null);
    setShowPageAnalyzer(true);
    message.info("正在采集页面快照以修复当前步骤，请稍候…");
  };

  const onSnapshotCaptured = (snapshot: XmlSnapshot) => {
    form.setFieldValue("xmlSnapshot", snapshot);
    updateCurrentXmlContext(
      snapshot.xmlContent,
      snapshot.deviceInfo,
      snapshot.pageInfo
    );
    message.success("已回填最新页面快照");
    setSnapshotFixMode({ enabled: false, forStepId: undefined });
    if (pendingAutoResave) {
      setPendingAutoResave(false);
      setTimeout(() => {
        handleSaveStep();
      }, 0);
    }
  };

  const onSnapshotUpdated = (snapshot: XmlSnapshot) => {
    try {
      form.setFieldValue("xmlSnapshot", snapshot);
      updateCurrentXmlContext(
        snapshot.xmlContent,
        snapshot.deviceInfo,
        snapshot.pageInfo
      );
    } catch (e) {
      console.warn("onSnapshotUpdated 处理失败（可忽略）:", e);
    }
  };

  const onElementSelected = (element: any) => {
    console.log("🎯 接收到增强智能分析元素:", element);
    console.log("🎯 当前模式检查:", {
      isQuickAnalyzer,
      editingStepForParams: editingStepForParams?.id,
    });

    try {
      const stepInfo = SmartStepGenerator.generateStepInfo(element);

      form.setFieldValue("step_type", SmartActionType.SMART_FIND_ELEMENT);
      form.setFieldValue("search_criteria", stepInfo.searchCriteria);
      form.setFieldValue("name", stepInfo.name);
      form.setFieldValue("description", stepInfo.description);
      form.setFieldValue("click_if_found", true);

      const builtLocator: ElementLocator | undefined = element.bounds
        ? {
            selectedBounds:
              typeof (element as any).bounds === "string"
                ? parseBoundsString((element as any).bounds) || {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                  }
                : (element as any).bounds,
            elementPath:
              (element as any).xpath || (element as any).element_path || "",
            confidence: (element as any).smartAnalysis?.confidence || 0.8,
            additionalInfo: {
              xpath: (element as any).xpath,
              resourceId: (element as any).resource_id,
              text: (element as any).text,
              contentDesc: (element as any).content_desc,
              className: (element as any).class_name,
              bounds: ((): string | undefined => {
                const b = (element as any).bounds;
                if (!b) return undefined;
                if (typeof b === "string") return b;
                return rectToBoundsString(b);
              })(),
            },
          }
        : undefined;

      if (builtLocator) {
        form.setFieldValue("elementLocator", builtLocator);
        const sb = builtLocator.selectedBounds;
        form.setFieldValue("boundsRect", sb);
        form.setFieldValue("bounds", rectToBoundsString(sb));
      }

      const snap = buildXmlSnapshotFromContext({
        currentXmlContent,
        currentDeviceInfo,
        currentPageInfo,
        element: element as any,
        fallbackDeviceId: currentDeviceId,
        fallbackDeviceName: devices.find((d) => d.id === currentDeviceId)
            ?.name,
      });
      if (snap) {
        form.setFieldValue("xmlSnapshot", snap);
        // 🆕 表单态：根据 element.xpath + xmlSnapshot 生成绑定
        try {
          const xpathFromElement: string | undefined = (element as any).xpath || (element as any).element_path;
          if (xpathFromElement && typeof xpathFromElement === 'string') {
            const bindingSnapshot = {
              source: 'memory' as const,
              text: snap.xmlContent,
              sha1: snap.xmlHash,
              capturedAt: snap.timestamp || Date.now(),
              deviceId: snap.deviceInfo?.deviceId,
            };
            const binding = createBindingFromSnapshotAndXPath(bindingSnapshot, xpathFromElement);
            if (binding) {
              form.setFieldValue('elementBinding', binding);
            }
          }
        } catch (e) {
          console.warn('elementBinding（表单态）生成失败（允许跳过）：', e);
        }
      }

      const basicParams = {
        text: element.text,
        element_text: element.text,
        element_type: element.element_type,
        resource_id: element.resource_id,
        content_desc: sanitizeContentDesc(element.content_desc),
        bounds: element.bounds
          ? `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`
          : undefined,
        smartDescription: element.smartDescription,
        smartAnalysis: element.smartAnalysis,
      };
      Object.entries(basicParams).forEach(([key, value]) => {
        form.setFieldValue(key, value);
      });

      // 🆕 使用增强匹配系统生成匹配条件
      const enhancedElement = {
        resource_id: element.resource_id,
        text: element.text,
        content_desc: element.content_desc,
        class_name: element.class_name,
        bounds: element.bounds,
        xpath: element.xpath || element.element_path,
        element_path: element.element_path,
        // 添加可能存在的扩展属性
        clickable: element.clickable,
        enabled: element.enabled,
        selected: element.selected,
        checkable: element.checkable,
        checked: element.checked,
        scrollable: element.scrollable,
        package: element.package,
        index: element.index,
      };

      const built = EnhancedMatchingHelper.buildEnhancedMatching(enhancedElement, {
        useEnhancedMatching: true,
        xmlContext: currentXmlContent,
        optimizationOptions: {
          enableParentContext: true,
          enableChildContext: true,
          enableDescendantSearch: false, // 保守设置，避免性能问题
          maxDepth: 2,
          prioritizeSemanticFields: true,
          excludePositionalFields: false // 允许位置字段作为备选
        },
        fallbackToLegacy: true, // 增强匹配失败时降级到原有逻辑
        debug: process.env.NODE_ENV === 'development' // 开发模式下启用调试
      });
      if (built && built.fields.length > 0) {
        // 为文本相关字段默认注入精确正则 ^词$，便于后端 enhanced_unified 直接采用
        const textLike = ["text", "content-desc"] as const;
        const matchMode: Record<string, "equals" | "contains" | "regex"> = {};
        const regexIncludes: Record<string, string[]> = {};
        for (const f of built.fields) {
          if ((textLike as readonly string[]).includes(f) && typeof built.values[f] === 'string') {
            const v = String(built.values[f]).trim();
            if (v) {
              matchMode[f] = 'regex';
              regexIncludes[f] = [`^${escapeRegex(v)}$`];
            }
          }
        }
        form.setFieldValue("matching", {
          strategy: built.strategy,
          fields: built.fields,
          values: built.values,
          ...(Object.keys(matchMode).length ? { matchMode } : {}),
          ...(Object.keys(regexIncludes).length ? { regexIncludes } : {}),
          updatedAt: Date.now(),
        });
      }

      setShowPageAnalyzer(false);
      setIsQuickAnalyzer(false);
      setEditingStepForParams(null);

      if (editingStepForParams) {
        const updatedSteps = steps.map((existingStep) => {
          if (existingStep.id === editingStepForParams.id) {
            const updatedParameters: any = {
              ...existingStep.parameters,
              text: element.text,
              element_text: element.text,
              element_type: element.element_type,
              resource_id: element.resource_id,
              content_desc: sanitizeContentDesc(element.content_desc),
              bounds: element.bounds
                ? `[${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`
                : existingStep.parameters?.bounds,
              smartDescription: element.smartDescription,
              smartAnalysis: element.smartAnalysis,
              ...(builtLocator ? { elementLocator: builtLocator } : {}),
            };
            if (built && built.fields.length > 0) {
              const textLike = ["text", "content-desc"] as const;
              const matchMode: Record<string, "equals" | "contains" | "regex"> = {};
              const regexIncludes: Record<string, string[]> = {};
              for (const f of built.fields) {
                if ((textLike as readonly string[]).includes(f) && typeof built.values[f] === 'string') {
                  const v = String(built.values[f]).trim();
                  if (v) {
                    matchMode[f] = 'regex';
                    regexIncludes[f] = [`^${escapeRegex(v)}$`];
                  }
                }
              }
              updatedParameters.matching = {
                strategy: built.strategy,
                fields: built.fields,
                values: built.values,
                ...(Object.keys(matchMode).length ? { matchMode } : {}),
                ...(Object.keys(regexIncludes).length ? { regexIncludes } : {}),
                updatedAt: Date.now(),
              };
            }
            if (currentXmlContent) {
              updatedParameters.xmlSnapshot = createXmlSnapshot(
                currentXmlContent,
                {
                  deviceId: currentDeviceInfo.deviceId || currentDeviceId || "unknown",
                  deviceName:
                    currentDeviceInfo.deviceName ||
                    devices.find((d) => d.id === currentDeviceId)?.name ||
                    "unknown",
                  appPackage: currentDeviceInfo.appPackage || "com.xingin.xhs",
                  activityName: currentDeviceInfo.activityName || "unknown",
                },
                {
                  pageTitle: currentPageInfo.pageTitle || "小红书页面",
                  pageType: currentPageInfo.pageType || "unknown",
                  elementCount: currentPageInfo.elementCount || 0,
                  appVersion: currentPageInfo.appVersion,
                }
              );
              // 🆕 编辑现有步骤：若有 xpath 则生成 elementBinding
              try {
                const xpathFromElement: string | undefined = (element as any).xpath || (element as any).element_path;
                if (xpathFromElement) {
                  const bindingSnapshot = {
                    source: 'memory' as const,
                    text: updatedParameters.xmlSnapshot.xmlContent,
                    sha1: updatedParameters.xmlSnapshot.xmlHash,
                    capturedAt: updatedParameters.xmlSnapshot.timestamp || Date.now(),
                    deviceId: updatedParameters.xmlSnapshot.deviceInfo?.deviceId,
                  };
                  const binding = createBindingFromSnapshotAndXPath(bindingSnapshot, xpathFromElement);
                  if (binding) {
                    updatedParameters.elementBinding = binding;
                  }
                }
              } catch (e) {
                console.warn('elementBinding（编辑步骤）生成失败（允许跳过）：', e);
              }
            }
            return {
              ...existingStep,
              name: stepInfo.name,
              description: stepInfo.description,
              parameters: updatedParameters,
            };
          }
          return existingStep;
        });
        setSteps(updatedSteps);
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                ✏️ 步骤参数修改成功！
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {editingStepForParams.name} → {stepInfo.name}
              </div>
            </div>
          ),
          duration: 3,
        });
      } else if (isQuickAnalyzer) {
        setEditingStep(null);
        showAddModal({ resetFields: false });
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                🚀 快捷步骤生成成功！
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {stepInfo.name} - 请点击确定完成创建
              </div>
            </div>
          ),
          duration: 4,
        });
      } else {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                🎯 智能步骤生成成功！
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {stepInfo.name}
              </div>
            </div>
          ),
          duration: 3,
        });
      }
      SmartStepGenerator.previewStepInfo(element);
    } catch (error) {
      console.error("❌ 智能步骤生成失败:", error);
      message.error("智能步骤生成失败");
    }
  };

  const onApplyCriteria = (criteria: any) => {
    console.log('🎯 [usePageFinder] onApplyCriteria 被调用，criteria:', criteria);
    try {
      const matchCriteria: UIMatchCriteria = {
        strategy: criteria.strategy as UIMatchStrategy,
        fields: criteria.fields,
        values: criteria.values,
        includes: criteria.includes,
        excludes: criteria.excludes,
      };
      const nextTitle: string = buildShortTitleFromCriteria(matchCriteria);
      const nextDesc: string = buildShortDescriptionFromCriteria(matchCriteria);

      if (editingStepForParams) {
        const stepId = editingStepForParams.id;
        setSteps((prev) =>
          prev.map((s) => {
            if (s.id !== stepId) return s;
            const p: any = { ...(s.parameters || {}) };
            p.matching = {
              strategy: criteria.strategy,
              fields: criteria.fields,
              values: criteria.values,
              includes: criteria.includes,
              excludes: criteria.excludes,
              // 🆕 添加正则表达式相关参数
              ...(criteria.matchMode && { matchMode: criteria.matchMode }),
              ...(criteria.regexIncludes && { regexIncludes: criteria.regexIncludes }),
              ...(criteria.regexExcludes && { regexExcludes: criteria.regexExcludes }),
              updatedAt: Date.now(),
            };
            p.elementLocator = p.elementLocator || {};
            p.elementLocator.additionalInfo = {
              ...(p.elementLocator.additionalInfo || {}),
              xpath: criteria.preview?.xpath || p.elementLocator.additionalInfo?.xpath,
              resourceId: p.elementLocator.additionalInfo?.resourceId || criteria.values["resource-id"],
              text: p.elementLocator.additionalInfo?.text || criteria.values["text"],
              contentDesc: p.elementLocator.additionalInfo?.contentDesc || criteria.values["content-desc"],
              className: p.elementLocator.additionalInfo?.className || criteria.values["class"],
              bounds: criteria.preview?.bounds || p.elementLocator.additionalInfo?.bounds || p.bounds,
            };
            if (criteria.preview?.bounds) {
              p.bounds = criteria.preview.bounds;
            } else if (criteria.values["bounds"]) {
              p.bounds = criteria.values["bounds"];
            }
            if (criteria.values["resource-id"]) p.resource_id = criteria.values["resource-id"];
            if (criteria.values["text"]) p.text = criteria.values["text"];
            if (criteria.values["content-desc"]) p.content_desc = criteria.values["content-desc"];
            if (criteria.values["class"]) p.class_name = criteria.values["class"];

            // 🆕 保存元素绑定（elementBinding）：需要 xmlSnapshot 与 preview.xpath
            try {
              const snap = (p.xmlSnapshot || form.getFieldValue("xmlSnapshot")) as XmlSnapshot | undefined;
              const xpath: string | undefined = criteria.preview?.xpath;
              if (snap && typeof snap.xmlContent === 'string' && xpath && xpath.trim()) {
                const bindingSnapshot = {
                  source: 'memory' as const,
                  text: snap.xmlContent,
                  sha1: snap.xmlHash,
                  capturedAt: snap.timestamp || Date.now(),
                  deviceId: snap.deviceInfo?.deviceId,
                };
                // 延迟加载以避免顶部循环依赖
                const binding = createBindingFromSnapshotAndXPath(bindingSnapshot, xpath);
                if (binding) {
                  p.elementBinding = binding;
                }
              }
            } catch (e) {
              console.warn('elementBinding 生成失败（允许跳过）：', e);
            }
            
            const patched = { ...s, parameters: p } as any;
            patched.name = nextTitle || s.name;
            patched.description = nextDesc || s.description;
            return patched;
          })
        );
        setShowPageAnalyzer(false);
        setIsQuickAnalyzer(false);
        setEditingStepForParams(null);
      } else {
        form.setFieldValue("step_type", SmartActionType.SMART_FIND_ELEMENT);
        form.setFieldValue("name", nextTitle || "查找元素");
        form.setFieldValue("description", nextDesc || "根据匹配条件查找元素");
        form.setFieldValue("matching", {
          strategy: criteria.strategy,
          fields: criteria.fields,
          values: criteria.values,
          includes: criteria.includes,
          excludes: criteria.excludes,
          // 🆕 同步正则/匹配模式到表单
          ...(criteria.matchMode ? { matchMode: criteria.matchMode } : {}),
          ...(criteria.regexIncludes ? { regexIncludes: criteria.regexIncludes } : {}),
          ...(criteria.regexExcludes ? { regexExcludes: criteria.regexExcludes } : {}),
          updatedAt: Date.now(),
        });

        const additionalInfo = {
          xpath: criteria.preview?.xpath,
          resourceId: criteria.values["resource-id"],
          text: criteria.values["text"],
          contentDesc: criteria.values["content-desc"],
          className: criteria.values["class"],
          bounds: criteria.preview?.bounds,
        };
        const builtLocator: ElementLocator | undefined =
          additionalInfo.xpath || criteria.preview?.bounds
            ? {
                selectedBounds: (() => {
                  const b = criteria.preview?.bounds;
                  if (!b) return { left: 0, top: 0, right: 0, bottom: 0 };
                  if (typeof b === "string") {
                    return parseBoundsString(b) || { left: 0, top: 0, right: 0, bottom: 0 };
                  }
                  return b;
                })(),
                elementPath: criteria.preview?.xpath || "",
                confidence: 0.8,
                additionalInfo: {
                  ...additionalInfo,
                  bounds:
                    typeof criteria.preview?.bounds === "string"
                      ? criteria.preview?.bounds
                      : criteria.preview?.bounds
                      ? rectToBoundsString(criteria.preview?.bounds)
                      : undefined,
                },
              }
            : undefined;
        if (builtLocator) {
          form.setFieldValue("elementLocator", builtLocator);
        }

        const snap = buildXmlSnapshotFromContext({
          currentXmlContent,
          currentDeviceInfo,
          currentPageInfo,
          fallbackDeviceId: currentDeviceId,
          fallbackDeviceName: devices.find((d) => d.id === currentDeviceId)?.name,
        });
        if (snap) form.setFieldValue("xmlSnapshot", snap);

        // 🆕 新建步骤表单态：生成并写入 elementBinding（随表单保存）
        try {
          const xpath: string | undefined = criteria.preview?.xpath;
          const effectiveSnap: XmlSnapshot | undefined = snap || form.getFieldValue("xmlSnapshot");
          if (effectiveSnap && typeof effectiveSnap.xmlContent === 'string' && xpath && xpath.trim()) {
            const bindingSnapshot = {
              source: 'memory' as const,
              text: effectiveSnap.xmlContent,
              sha1: effectiveSnap.xmlHash,
              capturedAt: effectiveSnap.timestamp || Date.now(),
              deviceId: effectiveSnap.deviceInfo?.deviceId,
            };
            const binding = createBindingFromSnapshotAndXPath(bindingSnapshot, xpath);
            if (binding) {
              form.setFieldValue('elementBinding', binding);
            }
          }
        } catch (e) {
          console.warn('elementBinding（新建表单）生成失败（允许跳过）：', e);
        }

        setShowPageAnalyzer(false);
        setIsQuickAnalyzer(false);
        setEditingStepForParams(null);
  setEditingStep(null);
  setAllowSaveWithoutXmlOnce(true);
  showAddModal({ resetFields: false });

        message.success({
          content: (
            <div>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                🚀 已根据匹配条件预填新步骤
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>{nextTitle}</div>
            </div>
          ),
          duration: 3,
        });
      }
    } catch (e) {
      console.warn("应用匹配策略到步骤失败:", e);
    }
  };

  const onClose = () => {
    setShowPageAnalyzer(false);
    setIsQuickAnalyzer(false);
    setEditingStepForParams(null);
    if (snapshotFixMode.enabled) {
      setSnapshotFixMode({ enabled: false, forStepId: undefined });
      setPendingAutoResave(false);
    }
  };

  const loadFromStepXml = useMemo(
    () =>
      editingStepForParams
        ? {
            stepId: editingStepForParams.id,
            xmlCacheId: editingStepForParams.parameters?.xmlCacheId,
            xmlContent:
              editingStepForParams.parameters?.xmlSnapshot?.xmlContent ||
              editingStepForParams.parameters?.xmlContent,
            deviceId:
              editingStepForParams.parameters?.xmlSnapshot?.deviceInfo?.deviceId ||
              editingStepForParams.parameters?.deviceId,
            deviceName:
              editingStepForParams.parameters?.xmlSnapshot?.deviceInfo?.deviceName ||
              editingStepForParams.parameters?.deviceName,
          }
        : undefined,
    [
      editingStepForParams?.id,
      editingStepForParams?.parameters?.xmlSnapshot?.xmlContent,
      editingStepForParams?.parameters?.xmlContent,
      editingStepForParams?.parameters?.xmlCacheId,
    ]
  );

  const preselectLocator = useMemo(() => {
    if (!editingStepForParams) return undefined;
    const p: any = editingStepForParams.parameters || {};
    const locator: NodeLocator = {} as any;
    const preferXPath: string | undefined =
      p.elementLocator?.additionalInfo?.xpath || p.xpath;
    if (preferXPath && typeof preferXPath === "string" && preferXPath.trim()) {
      if (/^\s*\//.test(preferXPath))
        locator.absoluteXPath = String(preferXPath).trim();
      else locator.predicateXPath = String(preferXPath).trim();
    }
    locator.attributes = {
      resourceId: p.resource_id || p.element_resource_id || undefined,
      text: p.element_text || p.text || undefined,
      className: p.class_name || undefined,
      contentDesc: p.content_desc || undefined,
      packageName: p.package_name || undefined,
    };
    if (p.bounds && typeof p.bounds === "string") {
      locator.bounds = p.bounds;
    } else {
      const sb = p.elementLocator?.selectedBounds;
      if (sb && typeof sb.left === "number") {
        locator.bounds = `[${sb.left},${sb.top}][${sb.right},${sb.bottom}]`;
      } else if (p.elementLocator?.additionalInfo?.bounds) {
        locator.bounds = p.elementLocator.additionalInfo.bounds;
      }
    }
    const hasAny =
      locator.absoluteXPath ||
      locator.predicateXPath ||
      locator.bounds ||
      (locator.attributes && Object.values(locator.attributes).some(Boolean));
    
    console.log('🔧 [usePageFinder] 构建 preselectLocator:', {
      hasAny,
      locator,
      stepId: editingStepForParams?.id,
      stepParameters: p
    });
    
    return hasAny ? locator : undefined;
  }, [editingStepForParams]);

  const initialMatching = useMemo(() => {
    if (!editingStepForParams) return undefined;
    const m: any = editingStepForParams.parameters?.matching;
    if (m && Array.isArray(m.fields) && m.fields.length > 0) {
      return {
        strategy: (m.strategy || "standard") as UIMatchStrategy,
        fields: m.fields as string[],
        values: (m.values || {}) as Record<string, string>,
        includes: m.includes as Record<string, string[]>,
        excludes: m.excludes as Record<string, string[]>,
      };
    }
    return undefined;
  }, [editingStepForParams?.id]);

  const pageFinderProps = {
    visible: showPageAnalyzer,
    initialViewMode: (editingStepForParams ? "grid" : "visual") as "grid" | "visual",
    snapshotOnlyMode: snapshotFixMode.enabled,
    onSnapshotCaptured,
    onSnapshotUpdated,
    loadFromStepXml,
    preselectLocator,
    initialMatching,
    onXmlContentUpdated: updateCurrentXmlContext,
    onApplyCriteria,
    onClose,
    onElementSelected,
  };

  console.log('📋 [usePageFinder] pageFinderProps 配置:', {
    visible: pageFinderProps.visible,
    initialViewMode: pageFinderProps.initialViewMode,
    preselectLocator: pageFinderProps.preselectLocator,
    initialMatching: pageFinderProps.initialMatching,
    editingStepId: editingStepForParams?.id
  });  return {
    pageFinderProps,
    openPageFinderForStep,
    openQuickPageFinder,
    openSnapshotFixer,
    editingStepForParams,
    currentXmlContent,
    currentDeviceInfo,
    currentPageInfo,
    updateCurrentXmlContext,
    setEditingStepForParams,
    showPageAnalyzer,
    setShowPageAnalyzer,
    snapshotFixMode,
    setSnapshotFixMode,
    pendingAutoResave,
    setPendingAutoResave,
    isQuickAnalyzer,
    setIsQuickAnalyzer,
    allowSaveWithoutXmlOnce,
    setAllowSaveWithoutXmlOnce,
  };
}
