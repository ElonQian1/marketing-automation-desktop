/**
 * ADB XML 可视化检查器 - 网格视图版本
 * 用于在 GUI 中展示 ADB/UiAutomat  // 新增：将节点详情选择的匹配策略回传给上层（例如步骤卡片"修改参数"模式）
  onApplyCriteria?: (criteria: { 
    strategy: string; 
    fields: string[]; 
    values: Record<string,string>; 
    includes?: Record<string,string[]>; 
    excludes?: Record<string,string[]>;
    // 🆕 添加正则表达式相关参数
    matchMode?: Record<string, 'equals' | 'contains' | 'regex'>;
    regexIncludes?: Record<string, string[]>;
    regexExcludes?: Record<string, string[]>;
  }) => void; 导出的 XML（page source）树结构与节点详情。
 * 
 * 设计目标（样式 & 交互）：
 * 1) 顶部工具栏：导入 XML / 一键填充示例 / 关键词搜索。
 * 2) 左侧：可折叠的节点树（TreeView），展示 label（text/resource-id/class）与最关键属性。
 * 3) 右侧：分为「节点详情」与「屏幕预览」两个卡片；详情展示常见字段（resource-id、text、content-desc、class、package...），
 *    并提供「复制 XPath」；屏幕预览根据 bounds 在一个虚拟屏幕中画出矩形，并高亮选中元素。
 * 4) 整体采用 TailwindCSS 风格（柔和阴影、卡片、圆角、分割线），默认暗色/亮色均适配。
 * 
 * 注意：
 * - 该组件不依赖后端，前端内存解析 XML；
 * - 集成到四视图系统中作为网格检查器使用。
 */

import React, { useMemo, useRef, useState, useEffect } from "react";
import type { VisualUIElement } from "../../types";
import styles from './GridElementView.module.css';
import { UiNode, AdvancedFilter, SearchOptions } from './types';
import type { NodeLocator } from '../../../../domain/inspector/entities/NodeLocator';
import { findByXPathRoot, findByPredicateXPath, findNearestClickableAncestor, findAllByPredicateXPath, parseBounds } from './utils';
import { TreeRow } from './TreeRow';
import { NodeDetail } from './NodeDetail';
import { ScreenPreview } from './ScreenPreview';
import { MatchResultsPanel } from './MatchResultsPanel';
import { FilterBar } from './FilterBar';
import { AdvancedFilterSummary } from './AdvancedFilterSummary';
import { Breadcrumbs } from './Breadcrumbs';
import { XPathBuilder } from './XPathBuilder';
import { XPathTestResultsPanel } from './XPathTestResultsPanel';
import { MatchCountSummary } from './MatchCountSummary';
import { loadPrefs, savePrefs } from './prefs';
import { SearchFieldToggles } from './SearchFieldToggles';
import { getSearchHistory, addSearchHistory, clearSearchHistory, getFavoriteSearches, toggleFavoriteSearch, getXPathHistory, addXPathHistory, clearXPathHistory, getFavoriteXPaths, toggleFavoriteXPath } from './history';
import { useGridHotkeys } from './useGridHotkeys';
import { downloadText } from './exporters';
import { XmlSourcePanel } from './panels/XmlSourcePanel';
import { BreadcrumbPanel } from './panels/BreadcrumbPanel';
import { NodeDetailPanel } from './panels/NodeDetailPanel';
import { ScreenPreviewPanel } from './panels/ScreenPreviewPanel';
import { ResultsAndXPathPanel } from './panels/ResultsAndXPathPanel';
import { XPathHelpPanel } from './panels/XPathHelpPanel';
import { FieldDocPanel } from './panels/FieldDocPanel';
import { XPathTemplatesPanel } from './panels/XPathTemplatesPanel';
import { LocatorAdvisorPanel } from './panels/LocatorAdvisorPanel';
import { PreferencesPanel } from './panels/PreferencesPanel';
import { ScreenPreviewSetElementButton } from './panels/node-detail';
import { loadLatestMatching, saveLatestMatching } from './matchingCache';
import { useResizableSplit } from './hooks/useResizableSplit';
import { useXmlParsing } from './hooks/useXmlParsing';
import { useSearchAndMatch } from './hooks/useSearchAndMatch';
import { useXPathNavigator } from './hooks/useXPathNavigator';
import { useMatchingSelection } from './hooks/useMatchingSelection';
import { usePanelSync } from './hooks/usePanelSync';
import { ChildElementListModal } from './components/ChildElementListModal';
import type { ActionableChildElement } from './services/childElementAnalyzer';

// 兼容遗留调用：在模块级声明可变引用，供组件内赋值
// 某些历史代码片段可能直接引用这些名称
let setPanelHighlightNode: (node: UiNode | null) => void;
let setPanelActivateTab: (tab: 'results' | 'xpath') => void;
let setPanelActivateKey: (updater: (k: number) => number) => void;

// =============== 类型定义（见 ./types） ===============

// 视图组件属性接口
interface GridElementViewProps {
  xmlContent?: string;
  elements?: VisualUIElement[];
  onElementSelect?: (element: VisualUIElement) => void;
  selectedElementId?: string;
  // Inspector 集成：提供外部定位能力（不含步骤卡片回写）
  locator?: NodeLocator;
  locatorResolve?: (root: UiNode | null, locator: NodeLocator) => UiNode | null;
  // 新增：将节点详情选择的匹配策略回传给上层（例如步骤卡片“修改参数”模式）
  // 承载完整字段（含正则/匹配模式），以便后续单步测试与后端增强匹配使用
  onApplyCriteria?: (criteria: {
    strategy: string;
    fields: string[];
    values: Record<string, string>;
    includes?: Record<string, string[]>;
    excludes?: Record<string, string[]>;
    matchMode?: Record<string, 'equals' | 'contains' | 'regex'>;
    regexIncludes?: Record<string, string[]>;
    regexExcludes?: Record<string, string[]>;
    preview?: { xpath?: string; bounds?: string | { left: number; top: number; right: number; bottom: number } };
  }) => void;
  // 🆕 上抛“最新匹配配置”（仅策略与字段），便于外层在离开时自动回填
  onLatestMatchingChange?: (m: { strategy: string; fields: string[] }) => void;
  // 🆕 初始匹配预设：用于“修改参数”时优先以步骤自身为准
  initialMatching?: { strategy: string; fields: string[]; values: Record<string, string>; includes?: Record<string, string[]>; excludes?: Record<string, string[]> };
}

// =============== 工具函数（见 ./utils） ===============

// =============== UI 子组件 ===============

// TreeRow 已抽出为独立组件

// NodeDetail 已抽出为独立组件

// ScreenPreview 已抽出为独立组件

// =============== 主组件 ===============
export const GridElementView: React.FC<GridElementViewProps> = ({
  xmlContent = "",
  elements = [],
  onElementSelect,
  selectedElementId = "",
  locator,
  locatorResolve,
  onApplyCriteria,
  onLatestMatchingChange,
  initialMatching,
}) => {
  // 选中节点
  const [selected, setSelected] = useState<UiNode | null>(null);
  
  // 🆕 子元素列表弹窗状态
  const [childListVisible, setChildListVisible] = useState<boolean>(false);
  const [selectedParentNode, setSelectedParentNode] = useState<UiNode | null>(null);
  
  // 展开/折叠与层级控制
  const [expandAll, setExpandAll] = useState<boolean>(false);
  const [collapseVersion, setCollapseVersion] = useState<number>(0);
  const [expandDepth, setExpandDepth] = useState<number>(0);
  const [showMatchedOnly, setShowMatchedOnly] = useState<boolean>(false);
  // 首选项映射到本地 UI 状态（持久化）
  const [autoSelectOnParse, setAutoSelectOnParse] = useState<boolean>(false);
  // ================= Hook: XML 解析 =================
  const { xmlText, setXmlText, root, parse } = useXmlParsing({
    initialXml: xmlContent,
    onAfterParse: (tree) => {
      // 解析完成后重置展开与匹配相关状态
      setExpandAll(false);
      setCollapseVersion(v => v + 1);
      setExpandDepth(2);
      // 自动定位首匹配（延迟触发，等待 hook 内部状态就绪）
      if (autoSelectOnParse) setTimeout(() => locateFirstMatch(), 0);
      // 外部 locator 精确定位
      if (tree && locator && locatorResolve) {
        try {
          const n = locatorResolve(tree, locator);
            if (n) {
              setSelected(n);
              panelSync.setHighlightNode(n, { refresh: true, switchToResults: true });
            }
        } catch { /* ignore */ }
      }
    }
  });

  // ================= Hook: 搜索与匹配集合 =================
  const {
    filter, setFilter,
    advFilter, setAdvFilter,
    searchOptions, setSearchOptions,
    matches, matchIndex, setMatchIndex,
    matchedSet, selectedAncestors,
    locateFirstMatch, goToMatch,
  } = useSearchAndMatch({
    root,
    selected,
    onSelect: (n) => setSelected(n),
    onAutoLocate: (n) => {
      panelSync.setHighlightNode(n, { refresh: true, switchToResults: true });
    }
  });

  // ================= Hook: XPath 导航 =================
  const panelSync = usePanelSync({ autoSwitchTab: loadPrefs().autoSwitchTab !== false });
  const {
    xPathInput, setXPathInput, xpathTestNodes, locateXPath
  } = useXPathNavigator({
    root,
    onSelect: (n) => setSelected(n),
    onPanelSwitch: (tab) => panelSync.setPanelActivateTab(tab),
    onHighlight: (n) => panelSync.setHighlightNode(n, { refresh: true }),
    triggerPanelRefresh: () => panelSync.triggerPanelRefresh()
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favSearch, setFavSearch] = useState<string[]>([]);
  const [xpathHistory, setXpathHistory] = useState<string[]>([]);
  const [favXPath, setFavXPath] = useState<string[]>([]);
  // 右侧面板联动控制（已抽离 usePanelSync）
  const { panelActivateKey, panelHighlightNode, panelActivateTab } = panelSync;
  // 兼容旧调用别名（历史代码中可能直接使用 setPanelXxx）
  // 通过为模块级变量赋值，保证同文件内其他位置也可引用
  setPanelHighlightNode = (node: UiNode | null) => panelSync.setHighlightNode(node, { refresh: true });
  setPanelActivateTab = (tab: 'results' | 'xpath') => panelSync.setPanelActivateTab(tab);
  setPanelActivateKey = (_: any) => panelSync.triggerPanelRefresh();
  // 匹配策略/字段选择（含缓存）抽离
  const { currentStrategy, currentFields, updateStrategy, updateFields } = useMatchingSelection({
    onLatestMatchingChange,
    initialMatching: initialMatching ? { strategy: initialMatching.strategy, fields: initialMatching.fields } : null
  });

  // 悬停联动处理：树/结果列表/测试列表悬停时预览高亮
  const handleHoverNode = panelSync.handleHoverNode;

  // 初始化首选项
  useEffect(() => {
    const p = loadPrefs();
    setAutoSelectOnParse(p.autoSelectOnParse);
    setShowMatchedOnly(p.showMatchedOnly);
    setExpandDepth(p.expandDepth);
    // 兼容旧版本偏好，并带出字段选择
    setSearchOptions({ caseSensitive: (p as any).caseSensitive ?? false, useRegex: (p as any).useRegex ?? false, fields: p.searchFields });
    // 初始化历史与收藏
    setSearchHistory(getSearchHistory());
    setFavSearch(getFavoriteSearches());
    setXpathHistory(getXPathHistory());
    setFavXPath(getFavoriteXPaths());
  }, []);

  // 恢复最近一次匹配选择（策略/字段）的缓存，避免刷新后丢失（不写回步骤，仅用于继续编辑）
  useEffect(() => {
    try {
      const cached = loadLatestMatching();
      if (cached) (window as any).__latestMatching__ = cached; // useMatchingSelection 已自动加载
    } catch {
      // ignore
    }
  }, []);

  // 持久化首选项
  useEffect(() => {
    savePrefs({
      autoSelectOnParse,
      showMatchedOnly,
      expandDepth,
      caseSensitive: searchOptions.caseSensitive,
      useRegex: searchOptions.useRegex,
      searchFields: {
        id: searchOptions.fields?.id ?? true,
        text: searchOptions.fields?.text ?? true,
        desc: searchOptions.fields?.desc ?? true,
        className: searchOptions.fields?.className ?? true,
        tag: searchOptions.fields?.tag ?? true,
        pkg: searchOptions.fields?.pkg ?? false,
      },
    });
  }, [autoSelectOnParse, showMatchedOnly, expandDepth, searchOptions]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const xpathRef = useRef<HTMLInputElement | null>(null);

  // 全局快捷键：Ctrl+F 聚焦搜索，F3/Shift+F3 导航匹配，Ctrl+L 聚焦 XPath 输入
  useGridHotkeys({
    focusSearch: () => searchRef.current?.focus(),
    nextMatch: () => goToMatch(1),
    prevMatch: () => goToMatch(-1),
    focusXPath: () => xpathRef.current?.focus(),
  });

  // 上传文件（可选）

  // 兼容旧 onParse 调用点（按钮） -> 调用 parse
  const onParse = (xmlToUse?: string) => parse(xmlToUse);

  // 🆕 子元素选择处理函数
  const handleElementClick = (node: UiNode) => {
    // 检查是否有可操作的子元素
    const hasActionableChildren = node.children.some(child => 
      child.attrs['clickable'] === 'true' || 
      child.attrs['class']?.includes('Button') ||
      child.attrs['class']?.includes('EditText') ||
      child.attrs['class']?.includes('CheckBox') ||
      child.attrs['class']?.includes('Switch')
    );
    
    if (hasActionableChildren) {
      // 有可操作子元素，显示子元素列表弹窗
      setSelectedParentNode(node);
      setChildListVisible(true);
    } else {
      // 没有可操作子元素，直接选择
      setSelected(node);
    }
  };

  const handleChildElementSelect = (element: ActionableChildElement) => {
    // 选择子元素
    setSelected(element.node);
    
    // 如果有回调，通知上层组件
    if (onElementSelect) {
      // 解析bounds字符串 "[left,top][right,bottom]"
      const boundsStr = element.node.attrs['bounds'] || '[0,0][0,0]';
      const boundsMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      let position = { x: 0, y: 0, width: 0, height: 0 };
      
      if (boundsMatch) {
        const left = parseInt(boundsMatch[1]);
        const top = parseInt(boundsMatch[2]);
        const right = parseInt(boundsMatch[3]);
        const bottom = parseInt(boundsMatch[4]);
        position = {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top
        };
      }
      
      // 构造兼容的VisualUIElement
      const visualElement: VisualUIElement = {
        id: element.key,
        type: element.type,
        text: element.node.attrs['text'] || '',
        description: element.node.attrs['content-desc'] || element.actionText,
        category: 'interactive',
        position,
        clickable: element.node.attrs['clickable'] === 'true',
        importance: element.confidence > 0.8 ? 'high' : element.confidence > 0.5 ? 'medium' : 'low',
        userFriendlyName: element.actionText,
        enabled: element.node.attrs['enabled'] !== 'false',
        element_type: element.node.attrs['class']?.split('.').pop() || element.type,
        is_clickable: element.node.attrs['clickable'] === 'true'
      };
      onElementSelect(visualElement);
    }
  };

  const handleDirectParentSelect = () => {
    // 直接选择父元素
    if (selectedParentNode) {
      setSelected(selectedParentNode);
      
      if (onElementSelect) {
        // 解析bounds字符串
        const boundsStr = selectedParentNode.attrs['bounds'] || '[0,0][0,0]';
        const boundsMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        let position = { x: 0, y: 0, width: 0, height: 0 };
        
        if (boundsMatch) {
          const left = parseInt(boundsMatch[1]);
          const top = parseInt(boundsMatch[2]);
          const right = parseInt(boundsMatch[3]);
          const bottom = parseInt(boundsMatch[4]);
          position = {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top
          };
        }
        
        const visualElement: VisualUIElement = {
          id: selectedParentNode.attrs['resource-id'] || `${selectedParentNode.tag}@${boundsStr}`,
          type: 'container',
          text: selectedParentNode.attrs['text'] || '',
          description: selectedParentNode.attrs['content-desc'] || '容器元素',
          category: 'container',
          position,
          clickable: selectedParentNode.attrs['clickable'] === 'true',
          importance: 'medium',
          userFriendlyName: selectedParentNode.attrs['text'] || selectedParentNode.attrs['class']?.split('.').pop() || '容器',
          enabled: selectedParentNode.attrs['enabled'] !== 'false',
          element_type: selectedParentNode.attrs['class']?.split('.').pop() || selectedParentNode.tag,
          is_clickable: selectedParentNode.attrs['clickable'] === 'true'
        };
        onElementSelect(visualElement);
      }
    }
  };

  const handleChildListClose = () => {
    setChildListVisible(false);
    setSelectedParentNode(null);
  };

  const handleChildSelect = (childNode: UiNode) => {
    // 选择子元素并关闭弹窗
    setSelected(childNode);
    
    // 如果有外部选择回调，通知上层组件
    if (onElementSelect) {
      // 解析bounds字符串
      const boundsStr = childNode.attrs['bounds'] || '[0,0][0,0]';
      const boundsMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      let position = { x: 0, y: 0, width: 0, height: 0 };
      
      if (boundsMatch) {
        const left = parseInt(boundsMatch[1]);
        const top = parseInt(boundsMatch[2]);
        const right = parseInt(boundsMatch[3]);
        const bottom = parseInt(boundsMatch[4]);
        position = {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top
        };
      }
      
      const visualElement: VisualUIElement = {
        id: childNode.attrs['resource-id'] || `${childNode.tag}@${boundsStr}`,
        type: childNode.attrs['class']?.split('.').pop() || childNode.tag,
        text: childNode.attrs['text'] || '',
        description: childNode.attrs['content-desc'] || '子元素',
        category: 'child',
        position,
        clickable: childNode.attrs['clickable'] === 'true',
        importance: 'medium',
        userFriendlyName: childNode.attrs['text'] || childNode.attrs['class']?.split('.').pop() || '子元素',
        enabled: childNode.attrs['enabled'] !== 'false',
        element_type: childNode.attrs['class']?.split('.').pop() || childNode.tag,
        is_clickable: childNode.attrs['clickable'] === 'true'
      };
      onElementSelect(visualElement);
    }
    
    handleChildListClose();
  };

  const handleShowChildDetails = (childNode: UiNode) => {
    // 显示子元素详情（可以选择子元素并在右侧面板显示详情）
    setSelected(childNode);
    panelSync.setHighlightNode(childNode, { refresh: true, switchToResults: false });
  };

  const handleCopyChildXPath = (childNode: UiNode) => {
    // 复制子元素的XPath到剪贴板
    try {
      // 这里需要根据现有的XPath生成逻辑来生成XPath
      // 简化版本：基于属性生成基本的XPath
      let xpath = '';
      const resourceId = childNode.attrs['resource-id'];
      const text = childNode.attrs['text'];
      const className = childNode.attrs['class'];
      
      if (resourceId) {
        xpath = `//*[@resource-id='${resourceId}']`;
      } else if (text) {
        xpath = `//*[@text='${text}']`;
      } else if (className) {
        xpath = `//*[@class='${className}']`;
      } else {
        xpath = `//${childNode.tag}`;
      }
      
      navigator.clipboard.writeText(xpath).then(() => {
        // 可以添加提示消息
        console.log('XPath 已复制到剪贴板:', xpath);
      });
    } catch (error) {
      console.error('复制XPath失败:', error);
    }
  };

  // 真机匹配回调：根据返回的 xpath 或 bounds 在当前树中选中并高亮
  const handleMatchedFromDevice = (payload: { preview?: { xpath?: string; bounds?: string } | null }) => {
    if (!root) return;
    const xp = payload.preview?.xpath?.trim();
    const bd = payload.preview?.bounds?.trim();
    let target: UiNode | null = null;
    if (xp) {
      target = findByXPathRoot(root, xp) || findByPredicateXPath(root, xp);
    }
    if (!target && bd) {
      const pb = parseBounds(bd);
      if (pb) {
        const stack: UiNode[] = [root];
        while (stack.length && !target) {
          const n = stack.pop()!;
          const nb = parseBounds(n.attrs['bounds'] || '');
          if (nb && nb.x1 === pb.x1 && nb.y1 === pb.y1 && nb.x2 === pb.x2 && nb.y2 === pb.y2) {
            target = n;
            break;
          }
          for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
        }
      }
    }
    if (target) {
      setSelected(target);
      panelSync.setHighlightNode(target, { refresh: true, switchToResults: true });
    } else {
      alert('匹配成功，但未能在当前XML树中定位对应节点（可能界面已变化或XPath不兼容）。');
    }
  };

  const loadDemo = () => {
    const demo = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.ss.android.ugc.aweme" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" visible-to-user="true" bounds="[0,0][1080,2400]">
    <node class="android.view.ViewGroup" bounds="[0,220][1080,2400]">
      <node class="android.widget.TextView" text="推荐" bounds="[80,240][200,300]"/>
      <node class="android.widget.TextView" text="关注" bounds="[220,240][340,300]"/>
      <node class="androidx.recyclerview.widget.RecyclerView" bounds="[0,320][1080,2400]">
        <node class="android.view.ViewGroup" bounds="[0,320][1080,800]">
          <node class="android.widget.TextView" text="用户A" bounds="[24,340][180,390]"/>
          <node class="android.widget.Button" text="关注" resource-id="com.ss.android.ugc.aweme:id/btn_follow" clickable="true" enabled="true" bounds="[900,600][1040,680]"/>
        </node>
        <node class="android.view.ViewGroup" bounds="[0,820][1080,1300]">
          <node class="android.widget.TextView" text="用户B" bounds="[24,840][180,890]"/>
          <node class="android.widget.Button" text="关注" resource-id="com.ss.android.ugc.aweme:id/btn_follow" clickable="true" enabled="true" bounds="[900,1100][1040,1180]"/>
        </node>
      </node>
    </node>
  </node>
</hierarchy>`;
    setXmlText(demo);
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setXmlText(String(reader.result));
    reader.readAsText(file);
  };

  // 分栏宽度（可拖拽） - 已抽离自定义 Hook
  const { leftWidth, startDrag } = useResizableSplit('grid.leftWidth', 36);

  return (
    <div className={`${styles.root} w-full h-full p-4 md:p-6`}>
      {/* 顶部工具栏 */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xl font-bold">ADB XML 可视化检查器</div>
        <div className={`${styles.toolbar}`}>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xml,text/xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile(f);
              }}
            />
            <button className={styles.btn} onClick={() => fileRef.current?.click()}>导入 XML 文件</button>
            <button className={styles.btn} onClick={loadDemo}>填充示例</button>
            <button className={styles.btn} onClick={() => downloadText(xmlText, 'current.xml', 'application/xml')}>导出当前 XML</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                list="grid-search-history"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="搜索：resource-id/text/content-desc/class"
                className={styles.input}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    locateFirstMatch();
                    addSearchHistory(filter);
                    setSearchHistory(getSearchHistory());
                  }
                }}
                ref={searchRef}
              />
              <datalist id="grid-search-history">
                {favSearch.map((s, i) => (<option key={`fav-${i}`} value={s} />))}
                {searchHistory.filter(s => !favSearch.includes(s)).map((s, i) => (<option key={`h-${i}`} value={s} />))}
              </datalist>
            </div>
            <button className={styles.btn} title="收藏/取消收藏当前搜索" onClick={() => { const ok = toggleFavoriteSearch(filter); setFavSearch(getFavoriteSearches()); }}>{favSearch.includes(filter.trim()) ? '★' : '☆'}</button>
            <button className={styles.btn} title="清空搜索历史" onClick={() => { clearSearchHistory(); setSearchHistory([]); }}>清空历史</button>
            <button
              className={styles.btn}
              onClick={async () => {
                try {
                  const txt = await navigator.clipboard.readText();
                  if (txt && txt.trim()) {
                    setXmlText(txt);
                  } else {
                    alert('剪贴板为空');
                  }
                } catch (err) {
                  alert('无法读取剪贴板，请检查浏览器/应用权限');
                }
              }}
            >粘贴 XML</button>
            <button className={styles.btn} onClick={() => onParse()}>解析 XML</button>
            <button className={styles.btn} onClick={() => setExpandAll(true)}>展开全部</button>
            <button className={styles.btn} onClick={() => { setExpandAll(false); setCollapseVersion(v => v + 1); }}>折叠全部</button>
            <button className={styles.btn} onClick={locateFirstMatch}>定位匹配</button>
            <button className={styles.btn} onClick={() => goToMatch(-1)}>上一个</button>
            <button className={styles.btn} onClick={() => goToMatch(1)}>下一个</button>
            <MatchCountSummary total={matches.length} index={matchIndex} autoSelectOnParse={autoSelectOnParse} onToggleAutoSelect={setAutoSelectOnParse} />
          </div>
        </div>
  {/* 第二排：按层级展开与 XPath 精准定位 */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="text-xs text-neutral-500 flex items-center gap-1">
            <input type="checkbox" checked={searchOptions.caseSensitive} onChange={(e) => setSearchOptions(s => ({ ...s, caseSensitive: e.target.checked }))} /> 区分大小写
          </label>
          <label className="text-xs text-neutral-500 flex items-center gap-1">
            <input type="checkbox" checked={searchOptions.useRegex} onChange={(e) => setSearchOptions(s => ({ ...s, useRegex: e.target.checked }))} /> 使用正则
          </label>
          <SearchFieldToggles value={searchOptions} onChange={setSearchOptions} />
          <span className="mx-2 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
          <label className="text-xs text-neutral-500">展开到层级</label>
          <select
            className={styles.input}
            value={expandDepth}
            onChange={(e) => { setExpandDepth(parseInt(e.target.value, 10) || 0); setExpandAll(false); }}
            style={{ width: 96 }}
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
          <span className="mx-2 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
          <div className="relative">
            <input
              list="grid-xpath-history"
              value={xPathInput}
              onChange={(e) => setXPathInput(e.target.value)}
              placeholder="/hierarchy/node[1]/node[2]"
              className={styles.input}
              style={{ width: 260 }}
              onKeyDown={(e) => { if (e.key === 'Enter') { locateXPath(); addXPathHistory(xPathInput); setXpathHistory(getXPathHistory()); } }}
              ref={xpathRef}
            />
            <datalist id="grid-xpath-history">
              {favXPath.map((s, i) => (<option key={`favx-${i}`} value={s} />))}
              {xpathHistory.filter(s => !favXPath.includes(s)).map((s, i) => (<option key={`xh-${i}`} value={s} />))}
            </datalist>
          </div>
          <button className={styles.btn} title="收藏/取消收藏当前 XPath" onClick={() => { const ok = toggleFavoriteXPath(xPathInput); setFavXPath(getFavoriteXPaths()); }}>{favXPath.includes(xPathInput.trim()) ? '★' : '☆'}</button>
          <button className={styles.btn} title="清空 XPath 历史" onClick={() => { clearXPathHistory(); setXpathHistory([]); }}>清空历史</button>
          <button className={styles.btn} onClick={locateXPath}>定位 XPath</button>
          <span className="mx-2 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
          <button className={styles.btn} onClick={() => { const t = findNearestClickableAncestor(selected); if (t) setSelected(t); }}>选中可点击父级</button>
          <span className="mx-2 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
          <label className="text-xs text-neutral-500 flex items-center gap-1">
            <input type="checkbox" checked={showMatchedOnly} onChange={(e) => setShowMatchedOnly(e.target.checked)} /> 仅显示匹配路径
          </label>
          <span className="text-[10px] text-neutral-400">支持 //*[@resource-id='xxx']</span>
          <span className="mx-2 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
          <button className={styles.btn} onClick={() => { setFilter(''); setAdvFilter({ enabled: false, mode: 'AND', resourceId: '', text: '', className: '', packageName: '', clickable: null, nodeEnabled: null }); }}>清空筛选</button>
          <button className={styles.btn} onClick={() => { setShowMatchedOnly(true); locateFirstMatch(); }}>展开匹配路径</button>
        </div>
        {/* 第三排：高级过滤器 */}
        <div className="mt-2">
          <FilterBar value={advFilter} onChange={setAdvFilter} />
          <AdvancedFilterSummary
            value={advFilter}
            onClear={() => {
              setAdvFilter({ enabled: false, mode: 'AND', resourceId: '', text: '', className: '', packageName: '', clickable: null, nodeEnabled: null });
              setFilter('');
            }}
          />
        </div>
      </div>

      {/* 主体双栏布局（左：树；右：详情） with resizable split */}
      <div id="grid-split" className="w-full" style={{ display: 'grid', gridTemplateColumns: `${leftWidth}% 8px ${100 - leftWidth}%`, gap: '16px' }}>
        {/* 左侧 */}
        <div className="space-y-4">
          <XmlSourcePanel xmlText={xmlText} setXmlText={setXmlText} onParse={() => onParse()} />
          <BreadcrumbPanel selected={selected} onSelect={(n) => setSelected(n)} />
          <div className={styles.card}>
            <div className={styles.cardHeader}>节点树</div>
            <div className={`${styles.cardBody} ${styles.tree}`}>
              {root ? (
                <TreeRow node={root} depth={0} selected={selected} onSelect={handleElementClick} onHoverNode={handleHoverNode} filter={filter} searchOptions={searchOptions} expandAll={expandAll} collapseVersion={collapseVersion} expandDepth={expandDepth} matchedSet={matchedSet} selectedAncestors={selectedAncestors} showMatchedOnly={showMatchedOnly} hasActiveFilter={Boolean(filter.trim()) || Boolean(advFilter.enabled && (advFilter.resourceId || advFilter.text || advFilter.className || advFilter.packageName || advFilter.clickable !== null || advFilter.nodeEnabled !== null))} onSelectForStep={onApplyCriteria as any} />
              ) : (
                <div className="p-3 text-sm text-neutral-500">解析 XML 后在此展示树结构…</div>
              )}
            </div>
            {/* Footer action row: 设置为步骤元素（基于当前选中节点） */}
            {selected && (
              <div className="p-2 border-t border-[var(--g-border)] flex items-center justify-end">
                <span className="text-xs text-neutral-500 mr-2">对当前选中节点进行统一回填：</span>
                {/* 复用统一按钮（屏幕预览款式），其 onApply 即可上抛完整回填 */}
                <ScreenPreviewSetElementButton node={selected} onApply={onApplyCriteria as any} />
              </div>
            )}
          </div>
        </div>
        {/* 分隔线 */}
        <div onMouseDown={startDrag} style={{ cursor: 'col-resize', background: 'var(--g-border)', width: '8px', borderRadius: 4 }} />
        {/* 右侧 */}
        <div className="space-y-4">
          <PreferencesPanel />
          <NodeDetailPanel
            node={selected}
            onMatched={handleMatchedFromDevice}
            // 传入完整回填回调，保留 regex/matchMode 信息
            onApplyToStepComplete={(complete) => {
              console.log('🎯 [GridElementView] onApplyToStepComplete 被调用，complete:', complete);
              console.log('🎯 [GridElementView] 即将调用 onApplyCriteria');
              onApplyCriteria?.(complete as any);
              console.log('🎯 [GridElementView] onApplyCriteria 调用完成');
            }}
            // 兼容旧回调（仅基础字段），仍然保留
            onApplyToStep={onApplyCriteria as any}
            onStrategyChanged={(s) => updateStrategy(s)}
            onFieldsChanged={(fs) => updateFields(fs)}
            initialMatching={initialMatching as any}
          />
          <LocatorAdvisorPanel
            node={selected}
            onApply={(xp) => { setXPathInput(xp); setTimeout(() => locateXPath(), 0); }}
            onInsert={(xp) => setXPathInput(xp)}
          />
          <ScreenPreviewPanel
            root={root}
            selected={selected}
            onSelect={(n) => setSelected(n)}
            onElementClick={handleElementClick}
            matchedSet={matchedSet}
            highlightNode={panelHighlightNode}
            highlightKey={panelActivateKey}
            enableFlashHighlight={loadPrefs().enableFlashHighlight !== false}
            previewAutoCenter={loadPrefs().previewAutoCenter !== false}
            onSelectForStep={onApplyCriteria as any}
          />
          <ResultsAndXPathPanel
            matches={matches}
            matchIndex={matchIndex}
            keyword={filter}
            advFilter={advFilter}
            searchOptions={searchOptions}
            onJump={(idx, node) => { setMatchIndex(idx); setSelected(node); }}
            onInsertXPath={(xp) => setXPathInput(xp)}
            onHoverNode={handleHoverNode}
            selected={selected}
            onApplyXPath={(xp) => { setXPathInput(xp); setTimeout(() => locateXPath(), 0); }}
            onInsertOnly={(xp) => setXPathInput(xp)}
            xpathTestNodes={xpathTestNodes}
            onJumpToNode={(n) => setSelected(n)}
            activateTab={panelActivateTab}
            activateKey={panelActivateKey}
            highlightNode={panelHighlightNode}
            onSelectForStep={onApplyCriteria as any}
            currentStrategy={currentStrategy as any}
            currentFields={currentFields}
          />
          <XPathTemplatesPanel node={selected} onApply={(xp) => { setXPathInput(xp); setTimeout(() => locateXPath(), 0); }} onInsert={(xp) => setXPathInput(xp)} />
          <FieldDocPanel />
          <XPathHelpPanel />
        </div>
      </div>

      <div className={styles.hint}>
        提示：
        1) 搜索框会对 resource-id / text / content-desc / class 做包含匹配；
        2) 选中节点后可复制 XPath；
        3) 屏幕预览按 bounds 画出全部元素矩形，蓝色高亮为当前选中元素。
        4) 🆕 点击元素时会智能识别可操作的子元素，提供精确选择选项。
      </div>

      {/* 🆕 子元素列表弹窗 */}
      <ChildElementListModal
        visible={childListVisible}
        parentNode={selectedParentNode}
        onClose={handleChildListClose}
        onSelectChild={handleChildSelect}
        onShowChildDetails={handleShowChildDetails}
        onCopyChildXPath={handleCopyChildXPath}
      />
    </div>
  );
}