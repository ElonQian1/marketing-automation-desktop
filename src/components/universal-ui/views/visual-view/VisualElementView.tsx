/**
 * 可视化视图组件 - 完整还原旧版VisualPageAnalyzerContent
 * 从原 UniversalPageFinderModal 的 VisualPageAnalyzerContent 迁移
 */

import React, { useState, useEffect, useMemo } from "react";
import { useRef, useLayoutEffect } from "react";
import { Space, Typography } from "antd";
import { LeftControlPanel } from "./components/LeftControlPanel";
import { PagePreview } from "./components/PagePreview";
import { ElementList } from "./components/ElementList";
import type { VisualElementCategory } from "../../types/";
import type { VisualUIElement } from "../../types";
import type { VisualFilterConfig } from "../../types";
import { convertVisualToUIElement } from "./utils/elementTransform";
import { useParsedVisualElements } from ".";
import { useFilteredVisualElements } from "./hooks/useFilteredVisualElements";
import {
  useElementSelectionManager,
  // ElementSelectionPopover, // 🚫 已移除 - 由上层统一管理
} from "../../element-selection";
import type { UIElement } from "../../../../api/universalUIAPI";
import { parseXmlViewport } from "./utils/screenGeometry";
import { useVisualViewPreferences } from "./hooks/useVisualViewPreferences";
import { isDevDebugEnabled, shallowEqual } from "../../../../utils/debug";

const { Title, Text } = Typography;

// 可视化视图属性接口
interface VisualElementViewProps {
  xmlContent?: string;
  elements?: VisualUIElement[];
  onElementSelect?: (element: VisualUIElement) => void;
  selectedElementId?: string;
  selectionManager?: ReturnType<typeof useElementSelectionManager>;
  // 🎯 新增：原始完整UIElement数据，用于保留语义信息
  originalUIElements?: UIElement[];
  // 🆕 可选：截图背景 URL，用于在可视化预览中叠加真实截图
  screenshotUrl?: string;
  // 🆕 方案 C：设备 ID（用于持久化设备特定校准）
  deviceId?: string;
  // 🆕 方案 C：应用包名（用于持久化应用特定校准）
  packageName?: string;
  // 🆕 过滤配置（从上层传入）
  filterConfig?: VisualFilterConfig;
}

export const VisualElementView: React.FC<VisualElementViewProps> = ({
  xmlContent = "",
  elements = [],
  onElementSelect,
  selectedElementId = "",
  selectionManager: externalSelectionManager,
  originalUIElements = [],
  screenshotUrl,
  deviceId,
  packageName,
  filterConfig,
}) => {
  // 设备外框（bezel）内边距，让设备看起来比页面更大，但不改变页面坐标/缩放
  const DEVICE_FRAME_PADDING = 24; // px，可调
  // 页面统计与控制面板的固定宽度（两者一致，避免被压缩）
  const STATS_FIXED_WIDTH = 360; // px，可按需调整
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyClickable, setShowOnlyClickable] = useState(false); // 🔧 强制修复：禁用可点击过滤，显示所有元素
  const [hideCompletely, setHideCompletely] = useState(false); // 🎯 默认不勾选：使用半透明显示模式
  // 🆕 显示截图背景（默认开启）
  const [showScreenshot, setShowScreenshot] = useState(true);
  // 🆕 预览辅助与可视化参数
  const [showGrid, setShowGrid] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [screenshotDim, setScreenshotDim] = useState(0);
  const [rotate90, setRotate90] = useState(false);
  // 🆕 统一预览缩放（同时作用于截图与叠加）
  const [previewZoom, setPreviewZoom] = useState(1.0); // 0.5 - 3.0
  // 🆕 覆盖层独立缩放（仅叠加层），不影响截图
  const [overlayScale, setOverlayScale] = useState(1.0); // 0.2 - 3.0
  // 🆕 轴向缩放
  const [overlayScaleX, setOverlayScaleX] = useState<number|undefined>(undefined);
  const [overlayScaleY, setOverlayScaleY] = useState<number|undefined>(undefined);
  // 🆕 对齐微调（像素，作用于叠加层，单位为画布像素，缩放前坐标系）
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  // 🆕 垂直对齐（宽受限时 top/center/bottom）
  const [verticalAlign, setVerticalAlign] = useState<'top'|'center'|'bottom'>('center');
  // 🆕 校准方案选择
  const [calibrationMode, setCalibrationMode] = useState<'A' | 'B' | 'C' | 'none'>('none');
  
  // 🆕 提取 XML 视口尺寸用于自动校准
  const xmlViewport = useMemo(() => {
    if (!xmlContent) return { width: 0, height: 0 };
    const vp = parseXmlViewport(xmlContent);
    return vp || { width: 0, height: 0 };
  }, [xmlContent]);
  
  // 🆕 提取截图尺寸（通过 Image 对象异步加载）
  const [screenshotSize, setScreenshotSize] = useState<{w:number;h:number}>({w:0,h:0});
  useEffect(() => {
    if (!screenshotUrl) {
      setScreenshotSize({w:0,h:0});
      return;
    }
    const img = new Image();
    img.onload = () => setScreenshotSize({w:img.naturalWidth, h:img.naturalHeight});
    img.onerror = () => setScreenshotSize({w:0,h:0});
    img.src = screenshotUrl;
  }, [screenshotUrl]);
  
  // 🆕 使用统一的偏好管理 Hook（方案 B+C）
  const preferences = useVisualViewPreferences(
    deviceId || null,
    packageName || null,
    xmlViewport.width,
    xmlViewport.height,
    screenshotSize.w,
    screenshotSize.h
  );
  // 🆕 自动校准 overlayScale（根据 XML 视口 vs 截图尺寸）由偏好作为单一数据源
  const autoCalibration = preferences.global.autoCalibration;
  const setAutoCalibration = (v: boolean) => {
    preferences.updateGlobal('autoCalibration', v);
  };

  // 🆕 持久化校准方案选择，增强用户体验
  useEffect(() => {
    try {
      const saved = localStorage.getItem('visualView.calibrationMode');
      if (saved === 'A' || saved === 'B' || saved === 'C' || saved === 'none') {
        setCalibrationMode(saved);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('visualView.calibrationMode', calibrationMode);
    } catch {}
  }, [calibrationMode]);
  
  // 🆕 根据校准方案应用不同的校准策略
  useEffect(() => {
    if (!autoCalibration || calibrationMode === 'none') return;
    const { detectionResult } = preferences;
    
    if (calibrationMode === 'A') {
      // 方案A：自动检测 + 应用 overlayScale
      if (detectionResult?.needsCalibration && detectionResult.suggestedOverlayScale) {
        const suggested = detectionResult.suggestedOverlayScale;
        if (Math.abs(suggested - overlayScale) > 0.01) {
          console.log(`📐 方案A：自动应用 overlayScale = ${suggested}`);
          setOverlayScale(suggested);
        }
      }
    }
    // 方案B 和 C 由 calibration 对象处理，不需要修改 overlayScale
  }, [autoCalibration, calibrationMode, preferences.detectionResult, overlayScale]);

  // 偏好持久化：showScreenshot
  useEffect(() => {
    try {
      const saved = localStorage.getItem('visualView.showScreenshot');
      if (saved !== null) setShowScreenshot(saved === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('visualView.showScreenshot', showScreenshot ? '1' : '0');
    } catch {}
  }, [showScreenshot]);

  // 偏好持久化：网格、十字线、透明度、暗化、旋转
  useEffect(() => {
    try {
      const g = localStorage.getItem('visualView.showGrid');
      if (g !== null) setShowGrid(g === '1');
      const c = localStorage.getItem('visualView.showCrosshair');
      if (c !== null) setShowCrosshair(c === '1');
      const op = localStorage.getItem('visualView.overlayOpacity');
      if (op !== null) setOverlayOpacity(Math.min(1, Math.max(0, parseFloat(op))));
      const dim = localStorage.getItem('visualView.screenshotDim');
      if (dim !== null) setScreenshotDim(Math.min(0.7, Math.max(0, parseFloat(dim))));
      const r = localStorage.getItem('visualView.rotate90');
      if (r !== null) setRotate90(r === '1');
      const z = localStorage.getItem('visualView.previewZoom');
      if (z !== null) setPreviewZoom(() => {
        const v = parseFloat(z);
        return isNaN(v) ? 1 : Math.min(3, Math.max(0.5, v));
      });
      const oz = localStorage.getItem('visualView.overlayScale');
      if (oz !== null) setOverlayScale(() => {
        const v = parseFloat(oz);
        return isNaN(v) ? 1 : Math.min(3, Math.max(0.2, v));
      });
      const ox = localStorage.getItem('visualView.offsetX');
      if (ox !== null) setOffsetX(() => {
        const v = parseInt(ox, 10);
        return Number.isFinite(v) ? Math.max(-2000, Math.min(2000, v)) : 0;
      });
      const oy = localStorage.getItem('visualView.offsetY');
      if (oy !== null) setOffsetY(() => {
        const v = parseInt(oy, 10);
        return Number.isFinite(v) ? Math.max(-2000, Math.min(2000, v)) : 0;
      });
      const va = localStorage.getItem('visualView.verticalAlign');
      if (va === 'top' || va === 'center' || va === 'bottom') setVerticalAlign(va);
      const ac = localStorage.getItem('visualView.autoCalibration');
      if (ac !== null) setAutoCalibration(ac === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('visualView.showGrid', showGrid ? '1' : '0'); } catch {}
  }, [showGrid]);
  useEffect(() => {
    try { localStorage.setItem('visualView.showCrosshair', showCrosshair ? '1' : '0'); } catch {}
  }, [showCrosshair]);
  useEffect(() => {
    try { localStorage.setItem('visualView.overlayOpacity', String(overlayOpacity)); } catch {}
  }, [overlayOpacity]);
  useEffect(() => {
    try { localStorage.setItem('visualView.screenshotDim', String(screenshotDim)); } catch {}
  }, [screenshotDim]);
  useEffect(() => {
    try { localStorage.setItem('visualView.rotate90', rotate90 ? '1' : '0'); } catch {}
  }, [rotate90]);
  useEffect(() => {
    try { localStorage.setItem('visualView.previewZoom', String(previewZoom)); } catch {}
  }, [previewZoom]);
  useEffect(() => {
    try { localStorage.setItem('visualView.overlayScale', String(overlayScale)); } catch {}
  }, [overlayScale]);
  useEffect(() => {
    try { localStorage.setItem('visualView.offsetX', String(offsetX)); } catch {}
  }, [offsetX]);
  useEffect(() => {
    try { localStorage.setItem('visualView.offsetY', String(offsetY)); } catch {}
  }, [offsetY]);
  useEffect(() => {
    try { localStorage.setItem('visualView.verticalAlign', verticalAlign); } catch {}
  }, [verticalAlign]);
  useEffect(() => {
    try { localStorage.setItem('visualView.autoCalibration', autoCalibration ? '1' : '0'); } catch {}
  }, [autoCalibration]);

  // 快捷键支持：g 网格，c 十字线，r 旋转，s 显示截图，9/0 叠加透明度，[ / ] 暗化强度，=/+ 放大，- 缩小，方向键微调对齐（Shift 加大步）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 忽略输入型元素
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      // 优先处理 Ctrl +/-：叠加层缩放（整体）
      if (e.ctrlKey && !e.shiftKey && (e.key === '-' )) {
        setOverlayScale(v => Math.max(0.2, +(v - 0.1).toFixed(2)));
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && !e.shiftKey && (e.key === '=' || e.key === '+')) {
        setOverlayScale(v => Math.min(3.0, +(v + 0.1).toFixed(2)));
        e.preventDefault();
        return;
      }
      // Ctrl+Shift +/-：更细的 1% 步进
      if (e.ctrlKey && e.shiftKey && (e.key === '-' )) {
        setOverlayScale(v => Math.max(0.2, +(v - 0.01).toFixed(2)));
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === '=' || e.key === '+')) {
        setOverlayScale(v => Math.min(3.0, +(v + 0.01).toFixed(2)));
        e.preventDefault();
        return;
      }
      // Alt + +/-：X 轴缩放
      if (e.altKey && !e.shiftKey && (e.key === '-' )) {
        setOverlayScaleX(v => Math.max(0.2, +(((v ?? overlayScale) - 0.1)).toFixed(2)));
        e.preventDefault();
        return;
      }
      if (e.altKey && !e.shiftKey && (e.key === '=' || e.key === '+')) {
        setOverlayScaleX(v => Math.min(3.0, +(((v ?? overlayScale) + 0.1)).toFixed(2)));
        e.preventDefault();
        return;
      }
      // Alt + Shift + +/-：X 轴细步进 1%
      if (e.altKey && e.shiftKey && (e.key === '-' )) {
        setOverlayScaleX(v => Math.max(0.2, +(((v ?? overlayScale) - 0.01)).toFixed(2)));
        e.preventDefault();
        return;
      }
      if (e.altKey && e.shiftKey && (e.key === '=' || e.key === '+')) {
        setOverlayScaleX(v => Math.min(3.0, +(((v ?? overlayScale) + 0.01)).toFixed(2)));
        e.preventDefault();
        return;
      }
      // Ctrl + Alt +/-：Y 轴缩放
      if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === '-' )) {
        setOverlayScaleY(v => Math.max(0.2, +(((v ?? overlayScale) - 0.1)).toFixed(2)));
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === '=' || e.key === '+')) {
        setOverlayScaleY(v => Math.min(3.0, +(((v ?? overlayScale) + 0.1)).toFixed(2)));
        e.preventDefault();
        return;
      }
      // Ctrl + Alt + Shift +/-：Y 轴细步进 1%
      if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === '-' )) {
        setOverlayScaleY(v => Math.max(0.2, +(((v ?? overlayScale) - 0.01)).toFixed(2)));
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === '=' || e.key === '+')) {
        setOverlayScaleY(v => Math.min(3.0, +(((v ?? overlayScale) + 0.01)).toFixed(2)));
        e.preventDefault();
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        setShowGrid(v => !v);
        e.preventDefault();
      } else if (e.key === 'c' || e.key === 'C') {
        setShowCrosshair(v => !v);
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        setRotate90(v => !v);
        e.preventDefault();
      } else if (e.key === 's' || e.key === 'S') {
        setShowScreenshot(v => !v);
        e.preventDefault();
      } else if (e.key === '9') {
        setOverlayOpacity(v => Math.max(0, +(v - 0.1).toFixed(2)));
        e.preventDefault();
      } else if (e.key === '0') {
        setOverlayOpacity(v => Math.min(1, +(v + 0.1).toFixed(2)));
        e.preventDefault();
      } else if (e.key === '[') {
        setScreenshotDim(v => Math.max(0, +(v - 0.05).toFixed(2)));
        e.preventDefault();
      } else if (e.key === ']') {
        setScreenshotDim(v => Math.min(0.7, +(v + 0.05).toFixed(2)));
        e.preventDefault();
      } else if (e.key === '-' ) {
        setPreviewZoom(v => Math.max(0.5, +(v - 0.1).toFixed(2)));
        e.preventDefault();
      } else if (e.key === '=' || e.key === '+') {
        setPreviewZoom(v => Math.min(3.0, +(v + 0.1).toFixed(2)));
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        const step = e.shiftKey ? 10 : 1;
        setOffsetX(v => Math.max(-2000, v - step));
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        const step = e.shiftKey ? 10 : 1;
        setOffsetX(v => Math.min(2000, v + step));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        const step = e.shiftKey ? 10 : 1;
        setOffsetY(v => Math.max(-2000, v - step));
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        const step = e.shiftKey ? 10 : 1;
        setOffsetY(v => Math.min(2000, v + step));
        e.preventDefault();
      } else if (e.key === '0' && e.ctrlKey) {
        // Ctrl+0 重置对齐与缩放
        setPreviewZoom(1.0);
        setOverlayScale(1.0);
        setOverlayScaleX(undefined);
        setOverlayScaleY(undefined);
        setOffsetX(0);
        setOffsetY(0);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  // 已迁移：hover 逻辑在 PagePreview 内部直接驱动 selectionManager，不再需要本地 hoveredElement

  // 转换函数已抽离 utils/elementTransform.ts

  // 将所有VisualUIElement转换为UIElement用于选择管理器
  const convertedElements = useMemo(
    () =>
      elements.map(
        (el) =>
          convertVisualToUIElement(
            el,
            selectedElementId
          ) as unknown as UIElement
      ),
    [elements, selectedElementId]
  );

  // 初始化元素选择管理器 - 恢复气泡弹窗功能
  // 🎯 关键修复：只在需要时创建内部管理器，避免不必要的资源消耗和状态冲突
  const internalSelectionManager = useElementSelectionManager(
    externalSelectionManager ? [] : convertedElements, // 如果有外部管理器，传入空数组
    (element: UIElement) => {
      // 当选择管理器确认选择时，转换回VisualUIElement并调用原回调
      const originalElement = elements.find((e) => e.id === element.id);
      if (originalElement && onElementSelect) {
        onElementSelect(originalElement);
      }
    },
    {
      enableHover: !externalSelectionManager, // 只在没有外部管理器时启用悬停
      hoverDelay: 300,
      autoRestoreTime: 60000,
    }
  );

  // 🎯 关键修复：确保只使用一个管理器，避免状态冲突
  const selectionManager = externalSelectionManager || internalSelectionManager;
  
  // 🔍 开发期可控日志：仅 DEV + 本地开关 且 状态变化时打印
  const __DEBUG_VISUAL__ = isDevDebugEnabled('debug:visual');
  const lastMgrSnapshotRef = useRef<any>(null);
  const lastPendingIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!__DEBUG_VISUAL__) return;
    const snapshot = {
      hasExternalManager: !!externalSelectionManager,
      hasInternalManager: !!internalSelectionManager,
      usingExternal: !!externalSelectionManager,
      hasHandleElementClick: typeof selectionManager.handleElementClick === 'function',
      hasPendingSelection: !!selectionManager.pendingSelection,
    };
    if (!shallowEqual(lastMgrSnapshotRef.current || {}, snapshot)) {
      console.debug('🔍 [VisualElementView] selectionManager 状态变化:', snapshot);
      lastMgrSnapshotRef.current = snapshot;
    }
  }, [__DEBUG_VISUAL__, externalSelectionManager, internalSelectionManager, selectionManager.handleElementClick, selectionManager.pendingSelection]);

  useEffect(() => {
    if (!__DEBUG_VISUAL__) return;
    const id = selectionManager.pendingSelection?.element?.id;
    if (id !== lastPendingIdRef.current) {
      const isVisible = !!selectionManager.pendingSelection;
      console.debug('🎯 [VisualElementView] pendingSelection 变化:', {
        visible: isVisible,
        hasSelection: !!selectionManager.pendingSelection,
        elementId: id,
      });
      lastPendingIdRef.current = id;
    }
  }, [__DEBUG_VISUAL__, selectionManager.pendingSelection?.element?.id]);

  // parseBounds 已抽离 utils/elementTransform.ts

  // getUserFriendlyName 已抽离 utils/categorization.ts

  // categorizeElement 已抽离 utils/categorization.ts

  // getElementImportance 已抽离 utils/appAnalysis.ts

  // analyzeAppAndPageInfo 已抽离 utils/appAnalysis.ts

  const { parsedElements, categories } = useParsedVisualElements(
    xmlContent,
    elements
  );

  // 使用解析出的元素或传入的元素
  const finalElements = parsedElements.length > 0 ? parsedElements : elements;

  // 🔥 修复隐藏逻辑：不要完全过滤掉隐藏元素，而是显示它们但用视觉效果区分
  const filteredElements = useFilteredVisualElements({
    elements: finalElements,
    searchText,
    selectedCategory,
    showOnlyClickable,
    hideCompletely,
    selectionManager,
    filterConfig,
  });

  // 控制面板与页面统计宽度固定：不随窗口变化而压缩

  // 页面预览已拆分为 PagePreview 组件

  // 保持中间预览在可视核心位置：容器与中列引用
  const rowRef = useRef<HTMLDivElement | null>(null);
  const middleRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const centerMiddle = () => {
      const row = rowRef.current;
      const mid = middleRef.current;
      if (!row || !mid) return;
      const rowRect = row.getBoundingClientRect();
      const midRect = mid.getBoundingClientRect();
      // 将中列中心滚动到容器中心
      const desiredScrollLeft =
        mid.offsetLeft + midRect.width / 2 - row.clientWidth / 2;
      row.scrollTo({ left: desiredScrollLeft, behavior: "smooth" });
    };
    centerMiddle();
    window.addEventListener("resize", centerMiddle);
    return () => window.removeEventListener("resize", centerMiddle);
  }, []);

  return (
    <div
      ref={rowRef}
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "nowrap",
        width: "100%",
        alignItems: "flex-start",
        minWidth: "900px", // 减少最小宽度要求
      }}
    >
      <LeftControlPanel
        searchText={searchText}
        setSearchText={setSearchText}
        showOnlyClickable={showOnlyClickable}
        setShowOnlyClickable={setShowOnlyClickable}
        hideCompletely={hideCompletely}
        setHideCompletely={setHideCompletely}
        showScreenshot={showScreenshot}
        setShowScreenshot={setShowScreenshot}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        showCrosshair={showCrosshair}
        setShowCrosshair={setShowCrosshair}
        overlayOpacity={overlayOpacity}
        setOverlayOpacity={setOverlayOpacity}
        screenshotDim={screenshotDim}
        setScreenshotDim={setScreenshotDim}
        rotate90={rotate90}
        setRotate90={setRotate90}
        previewZoom={previewZoom}
        setPreviewZoom={setPreviewZoom}
        overlayScale={overlayScale}
        setOverlayScale={setOverlayScale}
  overlayScaleX={overlayScaleX}
  setOverlayScaleX={setOverlayScaleX}
  overlayScaleY={overlayScaleY}
  setOverlayScaleY={setOverlayScaleY}
        offsetX={offsetX}
        setOffsetX={setOffsetX}
        offsetY={offsetY}
        setOffsetY={setOffsetY}
        verticalAlign={verticalAlign}
        setVerticalAlign={setVerticalAlign}
        autoCalibration={autoCalibration}
        setAutoCalibration={setAutoCalibration}
        calibrationMode={calibrationMode}
        setCalibrationMode={setCalibrationMode}
        calibrationInfo={preferences.detectionResult ? {
          detected: preferences.detectionResult.needsCalibration,
          suggested: preferences.detectionResult.suggestedOverlayScale,
          confidence: preferences.detectionResult.confidence,
          reason: preferences.detectionResult.reason,
          hasDeviceProfile: !!preferences.calibrationProfile,
          hasDims: (xmlViewport.width > 0 && xmlViewport.height > 0 && screenshotSize.w > 0 && screenshotSize.h > 0)
        } : {
          detected: false,
          suggested: 1,
          confidence: 0,
          reason: undefined,
          hasDeviceProfile: !!preferences.calibrationProfile,
          hasDims: (xmlViewport.width > 0 && xmlViewport.height > 0 && screenshotSize.w > 0 && screenshotSize.h > 0)
        }}
        canApplyAutoCalibration={!!preferences.detectionResult?.calibration}
        canSaveCalibrationProfile={!!(deviceId && packageName && (preferences.currentCalibration || preferences.detectionResult?.calibration))}
        onApplyAutoCalibration={() => {
          // 优先使用检测到的校准
          if (preferences.detectionResult?.calibration) {
            preferences.applyAutoCalibration();
            // 切换到方案 B：统一坐标系
            setCalibrationMode('B');
          }
        }}
        onSaveCalibrationProfile={() => {
          // 若当前没有校准但检测有结果，先应用再保存
          if (!preferences.currentCalibration && preferences.detectionResult?.calibration) {
            preferences.applyAutoCalibration();
          }
          preferences.saveCurrentAsProfile();
        }}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectionManager={selectionManager}
        finalElements={finalElements}
        categories={categories}
      />

      {/* 中间页面预览（主要区域，增加宽度） */}
      <div
        ref={middleRef}
        style={{
          flex: "1 1 auto", // 使用剩余空间作为主要区域
          minWidth: 400,
          maxWidth: "50vw", // 限制最大宽度不超过视口一半
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          flexShrink: 0,
        }}
      >
        <PagePreview
          finalElements={finalElements}
          filteredElements={filteredElements}
          categories={categories}
          hideCompletely={hideCompletely}
          xmlContent={xmlContent}
          deviceFramePadding={DEVICE_FRAME_PADDING}
          selectionManager={selectionManager}
          selectedElementId={selectedElementId}
          originalUIElements={originalUIElements}
          screenshotUrl={screenshotUrl}
          showScreenshot={showScreenshot}
          showGrid={showGrid}
          showCrosshair={showCrosshair}
          overlayOpacity={overlayOpacity}
          screenshotDim={screenshotDim}
          rotate90={rotate90}
          previewZoom={previewZoom}
          overlayScale={overlayScale}
          overlayScaleX={overlayScaleX}
          overlayScaleY={overlayScaleY}
          offsetX={offsetX}
          offsetY={offsetY}
          verticalAlign={verticalAlign}
          calibration={
            calibrationMode === 'B' ? preferences.detectionResult?.calibration || undefined :
            calibrationMode === 'C' ? preferences.currentCalibration || undefined :
            undefined  // 方案A 或 none 不使用 calibration
          }
          onCalibrationSuggested={(suggested) => {
            if (autoCalibration && calibrationMode === 'A' && Math.abs(suggested - overlayScale) > 0.01) {
              setOverlayScale(suggested);
            }
          }}
        />
      </div>

      <ElementList
        filteredElements={filteredElements}
        categories={categories}
        selectionManager={selectionManager}
        externalSelectionManager={externalSelectionManager}
        convertedElements={convertedElements}
      />

      {/* 🚫 移除重复的气泡弹窗 - 由上层 UniversalPageFinderModal 统一管理 */}
      {/* ElementSelectionPopover 已在 UniversalPageFinderModal 中渲染，避免重复 */}
    </div>
  );
};
