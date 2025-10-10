import React, { useMemo, useState, useEffect, useRef } from 'react';
import styles from "../GridElementView.module.css";
import { UiNode } from "../types";
import { NodeDetail } from "../NodeDetail";
import { MatchPresetsRow } from './node-detail/MatchPresetsRow';
import { ElementPresetsRow } from './node-detail';
import { SelectedFieldsChips, SelectedFieldsTable, NodeDetailSetElementButton, type CompleteStepCriteria } from './node-detail';
import type { MatchCriteria, MatchResultSummary } from './node-detail/types';
import { inferStrategyFromFields, toBackendStrategy, buildDefaultValues, normalizeFieldsAndValues, normalizeExcludes, normalizeIncludes, PRESET_FIELDS } from './node-detail';
import { loadLatestMatching } from '../../grid-view/matchingCache';
import { useAdb } from '../../../../../application/hooks/useAdb';
import { buildDefaultMatchingFromElement } from '../../../../../modules/grid-inspector/DefaultMatchingBuilder';
import { resolveSnapshot, type SnapshotResolveInput } from '../../grid-view';
// 🆕 导入增强匹配系统组件
import { 
  HierarchyFieldDisplay, 
  generateEnhancedMatching, 
  analyzeNodeHierarchy,
  SmartMatchingConditions
} from '../../../../../modules/enhanced-matching';

// 🆕 导入策略评分系统组件
import { 
  StrategyRecommendationPanel,
  type StrategyScoreInfo,
  type DetailedStrategyRecommendation,
  strategySystemAdapter
} from './node-detail';

// 🆕 导入统一策略配置器
import { UnifiedStrategyConfigurator } from '../../../strategy-selector';

interface NodeDetailPanelProps {
  node: UiNode | null;
  onMatched?: (result: MatchResultSummary) => void;
  onApplyToStep?: (criteria: MatchCriteria) => void;
  onApplyToStepComplete?: (criteria: CompleteStepCriteria) => void;
  onStrategyChanged?: (s: MatchCriteria['strategy']) => void;
  onFieldsChanged?: (fields: string[]) => void;
  // 🆕 初始匹配预设：用于"修改参数"时优先以步骤自身为准
  initialMatching?: MatchCriteria;
  // 🆕 XML上下文：用于智能增强匹配
  xmlContent?: string;
  // 🆕 可选的快照/绑定输入：当 node 为空时尝试恢复
  snapshotInput?: SnapshotResolveInput;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  onMatched,
  onApplyToStep,
  onApplyToStepComplete,
  onStrategyChanged,
  onFieldsChanged,
  initialMatching,
  xmlContent, // 🆕 XML内容用于增强匹配
  snapshotInput,
}) => {
  const { selectedDevice, matchElementByCriteria } = useAdb();

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<MatchCriteria['strategy']>('standard');
  const [values, setValues] = useState<Record<string, string>>({});
  const [includes, setIncludes] = useState<Record<string, string[]>>({});
  const [excludes, setExcludes] = useState<Record<string, string[]>>({});
  // “仅匹配关键词”开关：默认针对文本/描述开启
  const [keywordOnly, setKeywordOnly] = useState<Record<string, boolean>>({ text: true, 'content-desc': true });
  
  // 🆕 增强匹配分析状态
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<SmartMatchingConditions | null>(null);
  const [showEnhancedView, setShowEnhancedView] = useState(false);

  // 🆕 策略评分系统状态
  const [strategyRecommendations, setStrategyRecommendations] = useState<DetailedStrategyRecommendation[]>([]);
  const [showStrategyScoring, setShowStrategyScoring] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  
  // 🆕 模式切换状态
  const [currentMode, setCurrentMode] = useState<'intelligent' | 'static'>('intelligent');
  const [canSwitchMode, setCanSwitchMode] = useState(true);

  // 🆕 真实策略评分函数（使用智能策略系统适配器）
  const calculateStrategyScores = async (node: UiNode): Promise<DetailedStrategyRecommendation[]> => {
    try {
      setIsLoadingScores(true);
      console.log('🎯 开始计算策略评分', { node: node.tag, hasXml: !!xmlContent });
      
      // 🎯 使用模式感知的策略分析
      const recommendations = await strategySystemAdapter.analyzeElementByMode(node, xmlContent);
      
      console.log('✅ 策略评分计算完成', { 
        nodeTag: node.tag,
        recommendationsCount: recommendations.length,
        topStrategy: recommendations[0]?.strategy
      });
      
      return recommendations;
    } catch (error) {
      console.error('❌ 策略评分计算失败', error);
      
      // 回退到简化的默认评分
      return [{
        strategy: 'standard',
        score: {
          total: 0.7,
          performance: 0.7,
          stability: 0.8,
          compatibility: 0.9,
          uniqueness: 0.6,
          confidence: 0.7
        },
        confidence: 0.7,
        reason: `策略分析失败，使用默认推荐: ${error instanceof Error ? error.message : '未知错误'}`
      }];
    } finally {
      setIsLoadingScores(false);
    }
  };

  // 🔄 模式切换处理函数
  const handleModeSwitch = async (newMode: 'intelligent' | 'static') => {
    if (!canSwitchMode) {
      console.warn('⚠️ 模式切换已锁定');
      return;
    }

    console.log(`🔄 切换策略模式: ${currentMode} → ${newMode}`);
    
    // 切换适配器模式
    const success = strategySystemAdapter.switchMode(newMode);
    if (success) {
      setCurrentMode(newMode);
      
      // 如果当前有节点选中，重新分析
      if (node) {
        setIsLoadingScores(true);
        try {
          const newRecommendations = await calculateStrategyScores(node);
          setStrategyRecommendations(newRecommendations);
        } catch (error) {
          console.error('❌ 模式切换后重新分析失败', error);
        } finally {
          setIsLoadingScores(false);
        }
      }
    }
  };

  useEffect(() => { onStrategyChanged?.(strategy); }, [strategy]);
  useEffect(() => { onFieldsChanged?.(selectedFields); }, [selectedFields]);

  // 🆕 策略评分计算：当节点变化时触发
  useEffect(() => {
    if (!node) {
      setStrategyRecommendations([]);
      return;
    }

    const performScoring = async () => {
      setIsLoadingScores(true);
      try {
        const recommendations = await calculateStrategyScores(node);
        setStrategyRecommendations(recommendations);
        
        // 🚀 自动应用智能推荐的最佳策略（如果没有初始预设）
        if (recommendations.length > 0 && !initialMatching) {
          const bestStrategy = recommendations[0].strategy as MatchCriteria['strategy'];
          console.log('🎯 自动应用智能推荐策略:', bestStrategy);
          setStrategy(bestStrategy);
          
          // 应用推荐策略对应的预设字段
          const presetFields = PRESET_FIELDS[bestStrategy as any] || [];
          if (presetFields.length > 0) {
            setSelectedFields(presetFields);
            console.log('📋 自动应用推荐字段:', presetFields);
          }
        }
      } catch (error) {
        console.error('策略评分计算失败:', error);
        setStrategyRecommendations([]);
      } finally {
        setIsLoadingScores(false);
      }
    };

    performScoring();
  }, [node, initialMatching]);

  // 🆕 增强匹配分析：当节点或XML上下文变化时触发
  useEffect(() => {
    if (!node || !xmlContent) {
      setEnhancedAnalysis(null);
      return;
    }

    const performAnalysis = async () => {
      try {
        // 解析XML上下文
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        if (xmlDoc.documentElement.tagName === 'parsererror') {
          console.warn('XML解析失败，跳过增强分析');
          return;
        }

        // 查找当前节点对应的XML元素
        const findElementByAttrs = (doc: Document) => {
          const allElements = doc.querySelectorAll('*');
          for (const el of Array.from(allElements)) {
            // 简单匹配：通过resource-id或text查找
            const resourceId = el.getAttribute('resource-id');
            const text = el.getAttribute('text');
            const className = el.getAttribute('class');
            
            if (
              (resourceId && resourceId === node.attrs?.['resource-id']) ||
              (text && text === node.attrs?.['text']) ||
              (className && className === node.attrs?.['class'])
            ) {
              return el;
            }
          }
          return null;
        };

        const targetElement = findElementByAttrs(xmlDoc);
        if (!targetElement) {
          console.warn('在XML中未找到匹配的元素');
          return;
        }

        // 执行增强匹配分析
        const conditions = generateEnhancedMatching(targetElement, xmlDoc, {
          enableParentContext: true,
          enableChildContext: true,
          enableDescendantSearch: false,
          maxDepth: 2,
          prioritizeSemanticFields: true,
          excludePositionalFields: true
        });

        setEnhancedAnalysis(conditions);
        
      } catch (error) {
        console.warn('增强匹配分析失败:', error);
        setEnhancedAnalysis(null);
      }
    };

    performAnalysis();
  }, [node, xmlContent]);

  // 仅首次应用 initialMatching（若提供），避免用户操作被覆盖
  const appliedInitialRef = useRef<boolean>(false);

  // 若未直接提供 node，尝试根据快照/绑定恢复
  const effectiveNode: UiNode | null = useMemo(() => {
    if (node) return node;
    if (snapshotInput) {
      const resolved = resolveSnapshot(snapshotInput);
      return resolved.node;
    }
    return null;
  }, [node, snapshotInput]);

  // 当节点（来自节点树/屏幕预览/快照恢复）变化时，自动将“已选字段”的值回填为该节点的默认值
  useEffect(() => {
    const curNode = effectiveNode;
    if (!curNode) return;
    if (selectedFields.length === 0) {
      // 首次选择（或无字段已选）时：优先使用步骤传入的 initialMatching；否则恢复最近缓存；再否则使用 standard 预设
      if (!appliedInitialRef.current && initialMatching && Array.isArray(initialMatching.fields) && initialMatching.fields.length > 0) {
        appliedInitialRef.current = true;
        setStrategy(initialMatching.strategy);
        setSelectedFields(initialMatching.fields);
        setIncludes(initialMatching.includes || {});
        setExcludes(initialMatching.excludes || {});
        // 合并初始值与节点默认值：优先保留 initialMatching 中的非空值，
        // 仅当节点提供了非空值时才覆盖，以避免被“空节点属性”清空有效的初始匹配值
  const nodeDefaults = buildDefaultValues(curNode, initialMatching.fields);
        const merged: Record<string, string> = {};
        for (const f of initialMatching.fields) {
          const initVal = (initialMatching.values || {})[f];
          const nodeVal = nodeDefaults[f];
          const trimmedInit = (initVal ?? '').toString().trim();
          const trimmedNode = (nodeVal ?? '').toString().trim();
          merged[f] = trimmedNode !== '' ? trimmedNode : trimmedInit;
        }
        setValues(merged);
        onStrategyChanged?.(initialMatching.strategy);
        onFieldsChanged?.(initialMatching.fields);
      } else {
        const cached = loadLatestMatching();
        if (cached && Array.isArray(cached.fields) && cached.fields.length > 0) {
          setStrategy(cached.strategy as any);
          setSelectedFields(cached.fields);
          setValues(buildDefaultValues(curNode, cached.fields));
          onStrategyChanged?.(cached.strategy as any);
          onFieldsChanged?.(cached.fields);
        } else {
          // 使用统一构建器从节点属性推断默认匹配字段与值
          const built = buildDefaultMatchingFromElement({
            resource_id: curNode.attrs?.['resource-id'],
            text: curNode.attrs?.['text'],
            content_desc: curNode.attrs?.['content-desc'],
            class_name: curNode.attrs?.['class'],
            bounds: curNode.attrs?.['bounds'],
          });
          const effFields = (built.fields && built.fields.length > 0) ? built.fields : PRESET_FIELDS.standard;
          const effStrategy = (built.fields && built.fields.length > 0) ? (built.strategy as any) : 'standard';
          setStrategy(effStrategy);
          setSelectedFields(effFields);
          // 若构建器给出具体值，优先使用；否则按节点默认值回填
          if (built.fields && built.fields.length > 0) {
            setValues(built.values);
          } else {
            setValues(buildDefaultValues(curNode, effFields));
          }
          onStrategyChanged?.(effStrategy);
          onFieldsChanged?.(effFields);
        }
      }
      return;
    }
    setValues(buildDefaultValues(curNode, selectedFields));
  }, [effectiveNode]);

  const canSend = useMemo(() => !!(effectiveNode && selectedDevice && selectedFields.length > 0), [effectiveNode, selectedDevice, selectedFields]);

  const toggleField = (f: string) => {
    const removing = selectedFields.includes(f);
    setSelectedFields(prev => {
      const next = removing ? prev.filter(x => x !== f) : [...prev, f];
      const inferred = inferStrategyFromFields(next);
      // 当存在包含/排除条件时，无论字段集合是否与预设一致，都应视为自定义
      const hasTweaks = Object.keys(includes).some(k => (includes[k] || []).length > 0) ||
                        Object.keys(excludes).some(k => (excludes[k] || []).length > 0);
      setStrategy(hasTweaks ? 'custom' : inferred);
      return next;
    });
    setValues(prevVals => {
      const draft = { ...prevVals } as Record<string, string>;
      if (removing) {
        delete draft[f];
      } else if (node) {
        Object.assign(draft, buildDefaultValues(node, [f]));
      }
      return draft;
    });
  };

  const applyPreset = (presetCriteria: MatchCriteria) => {
  if (!effectiveNode) return;
    setSelectedFields(presetCriteria.fields);
    setStrategy(presetCriteria.strategy);
    setIncludes(presetCriteria.includes || {});
    setExcludes(presetCriteria.excludes || {});
    // 预设应用时，文本/描述保持默认开启，其它字段置为 false
    setKeywordOnly(prev => {
      const next: Record<string, boolean> = {};
      for (const f of presetCriteria.fields) {
        next[f] = f === 'text' || f === 'content-desc' ? (prev[f] ?? true) : false;
      }
      return { ...prev, ...next };
    });
  setValues(buildDefaultValues(effectiveNode, presetCriteria.fields));
    onStrategyChanged?.(presetCriteria.strategy);
    onFieldsChanged?.(presetCriteria.fields);
  };

  const sendToBackend = async () => {
  if (!node || !selectedDevice || selectedFields.length === 0) return;
    const normalized = normalizeFieldsAndValues(selectedFields, values);
    const backendStrategy = toBackendStrategy(strategy, normalized.fields, normalized.values);
    // 构造正则/匹配模式：当“仅匹配关键词”对文本字段开启时，默认使用正则 ^关键词$
    const matchMode: Record<string, 'equals' | 'contains' | 'regex'> = {};
    const regexIncludes: Record<string, string[]> = {};
    const textLike = ['text', 'content-desc'];
    for (const f of normalized.fields) {
      if (textLike.includes(f) && keywordOnly[f]) {
        const v = normalized.values[f];
        if (v && v.trim()) {
          matchMode[f] = 'regex';
          // 精确匹配该关键词（不包含前后缀）
          regexIncludes[f] = [`^${escapeRegex(v.trim())}$`];
        }
      }
    }
    const criteria: MatchCriteria = {
      strategy: backendStrategy,
      fields: normalized.fields,
      values: normalized.values,
      includes: normalizeIncludes(includes, normalized.fields),
      excludes: normalizeExcludes(excludes, normalized.fields),
      matchMode,
      regexIncludes,
    };
    try {
  const result = await matchElementByCriteria(selectedDevice.id, criteria as any);
      onMatched?.(result);
    } catch (err) {
      console.error('匹配失败:', err);
      onMatched?.({ ok: false, message: '匹配失败' });
    }
  };

  if (!effectiveNode) {
    return (
      <div className="flex items-center justify-center h-32 text-neutral-500">请在节点树或屏幕预览中选择一个元素</div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>节点详情</div>
      <div className={styles.panelContent}>
        <div className="mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button className={styles.btn} disabled={!canSend} onClick={sendToBackend} title={canSend ? '' : '请选择设备与匹配字段'}>
              发送匹配请求（真机查找）
            </button>
            {(onApplyToStepComplete || onApplyToStep) && (
              <NodeDetailSetElementButton
                node={effectiveNode}
                onApply={(completeCriteria) => {
                  console.log('🎯 [NodeDetailPanel] onApply 被调用，completeCriteria:', completeCriteria);
                  if (onApplyToStepComplete) {
                    console.log('🎯 [NodeDetailPanel] 调用 onApplyToStepComplete');
                    onApplyToStepComplete(completeCriteria);
                  } else if (onApplyToStep) {
                    console.log('🎯 [NodeDetailPanel] 调用 onApplyToStep (legacy)');
                    const legacy: MatchCriteria & { preview?: CompleteStepCriteria['preview'] } = {
                      strategy: completeCriteria.strategy,
                      fields: completeCriteria.fields,
                      values: completeCriteria.values,
                      includes: completeCriteria.includes,
                      excludes: completeCriteria.excludes,
                      preview: completeCriteria.preview,
                    };
                    onApplyToStep(legacy);
                  }
                }}
                strategy={strategy}
                fields={selectedFields}
                values={values}
                includes={includes}
                excludes={excludes}
                matchMode={(() => {
                  // 基于 keywordOnly + values 构建 matchMode
                  const mm: Record<string, 'equals' | 'contains' | 'regex'> = {};
                  const normalized = normalizeFieldsAndValues(selectedFields, values);
                  for (const f of normalized.fields) {
                    if ((f === 'text' || f === 'content-desc') && keywordOnly[f] && (normalized.values[f] || '').trim() !== '') {
                      mm[f] = 'regex';
                    }
                  }
                  return mm;
                })()}
                regexIncludes={(() => {
                  // 为 text/content-desc 在 keywordOnly 开启时注入精确正则 ^词$
                  const ri: Record<string, string[]> = {};
                  const normalized = normalizeFieldsAndValues(selectedFields, values);
                  for (const f of normalized.fields) {
                    if ((f === 'text' || f === 'content-desc') && keywordOnly[f]) {
                      const v = (normalized.values[f] || '').trim();
                      if (v) {
                        ri[f] = [`^${escapeRegex(v)}$`];
                      }
                    }
                  }
                  return ri;
                })()}
                regexExcludes={{}}
              />
            )}
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex items-center justify-between">
            <div>当前策略：{strategy} · 字段 {selectedFields.length} 个</div>
            {effectiveNode && (
              <div className="text-neutral-400">
                {effectiveNode.attrs?.['resource-id'] ? `ID: ${effectiveNode.attrs['resource-id'].split('/').pop()}` :
                 effectiveNode.attrs?.['text'] ? `文本: ${effectiveNode.attrs['text'].slice(0, 10)}${effectiveNode.attrs['text'].length > 10 ? '...' : ''}` :
                 `类名: ${(effectiveNode.attrs?.['class'] || '').split('.').pop() || '未知'}`}
              </div>
            )}
          </div>
        </div>

        {/* 元素级预设（例如：关注按钮） */}
        <ElementPresetsRow
          node={node}
          onApply={applyPreset}
          onPreviewFields={(fs) => setSelectedFields(fs)}
        />

        {/* 🆕 智能策略选择器（带评分徽章） */}
        <div className={styles.section}>
          <UnifiedStrategyConfigurator
            matchCriteria={{
              strategy,
              fields: selectedFields,
              values,
              includes: includes || {},
              excludes: excludes || {}
            }}
            onChange={(newCriteria) => {
              setStrategy(newCriteria.strategy);
              setSelectedFields(newCriteria.fields);
              setValues(newCriteria.values);
              setIncludes(newCriteria.includes || {});
              setExcludes(newCriteria.excludes || {});
            }}
            strategyScores={Object.fromEntries(
              strategyRecommendations.map(rec => [
                rec.strategy,
                {
                  score: rec.score.total,
                  isRecommended: rec === strategyRecommendations[0]
                }
              ])
            )}
            showScores={true}
            recommendedStrategy={strategyRecommendations[0]?.strategy as any}
            mode="full"
            referenceElement={node}
          />
        </div>

        {/* 策略级预设 */}
        <MatchPresetsRow node={node} onApply={applyPreset} activeStrategy={strategy} />

        {/* 🆕 智能策略推荐面板 */}
        {strategyRecommendations.length > 0 && (
          <div className={styles.section}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {currentMode === 'intelligent' ? '🧠 智能策略推荐' : '📋 静态策略推荐'}
                </span>
                {/* 🆕 模式切换控件 */}
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden text-xs">
                  <button
                    className={`px-2 py-1 transition-colors ${
                      currentMode === 'intelligent' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => handleModeSwitch('intelligent')}
                    disabled={!canSwitchMode}
                  >
                    智能
                  </button>
                  <button
                    className={`px-2 py-1 transition-colors ${
                      currentMode === 'static' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => handleModeSwitch('static')}
                    disabled={!canSwitchMode}
                  >
                    静态
                  </button>
                </div>
              </div>
              <button
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                onClick={() => setShowStrategyScoring(!showStrategyScoring)}
              >
                {showStrategyScoring ? '收起评分详情' : '查看评分详情'}
              </button>
            </div>
            
            {/* 紧凑模式的推荐显示 */}
            {!showStrategyScoring && (
              <StrategyRecommendationPanel
                recommendations={strategyRecommendations}
                currentStrategy={strategy}
                onStrategySelect={(newStrategy) => {
                  setStrategy(newStrategy);
                  // 应用对应的预设字段
                  const preset = PRESET_FIELDS[newStrategy as any] || [];
                  const nextFields = newStrategy === 'custom' ? selectedFields : preset;
                  setSelectedFields(nextFields);
                  if (node) {
                    setValues(buildDefaultValues(node, nextFields));
                  }
                }}
                compact={true}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
              />
            )}
            
            {/* 详细模式的评分显示 */}
            {showStrategyScoring && (
              <StrategyRecommendationPanel
                recommendations={strategyRecommendations}
                currentStrategy={strategy}
                onStrategySelect={(newStrategy) => {
                  setStrategy(newStrategy);
                  // 应用对应的预设字段
                  const preset = PRESET_FIELDS[newStrategy as any] || [];
                  const nextFields = newStrategy === 'custom' ? selectedFields : preset;
                  setSelectedFields(nextFields);
                  if (node) {
                    setValues(buildDefaultValues(node, nextFields));
                  }
                }}
                onWeightChange={(weights) => {
                  // TODO: 实时重新计算评分
                  console.log('权重调整:', weights);
                }}
                compact={false}
                className="border border-blue-200 dark:border-blue-800 rounded-lg p-4"
              />
            )}
            
            {isLoadingScores && (
              <div className="text-center py-4 text-neutral-500">
                正在分析策略评分...
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <SelectedFieldsChips
            selected={selectedFields}
            onToggle={toggleField}
          />
          <SelectedFieldsTable
            node={node}
            selected={selectedFields}
            values={values}
            onToggle={toggleField}
            onChangeValue={(field, v) => {
              setValues(prev => ({ ...prev, [field]: v }));
              // 任意值编辑都视为自定义
              setStrategy('custom');
            }}
            includes={includes}
            onChangeIncludes={(field, next) => {
              setIncludes(prev => ({ ...prev, [field]: next }));
              // 任意包含条件变化都意味着偏离预设，切换为自定义
              setStrategy('custom');
            }}
            excludes={excludes}
            onChangeExcludes={(field, next) => {
              setExcludes(prev => ({ ...prev, [field]: next }));
              // 任意排除条件变化都意味着偏离预设，切换为自定义
              setStrategy('custom');
            }}
            keywordOnly={keywordOnly}
            onToggleKeywordOnly={(field, val) => {
              setKeywordOnly(prev => ({ ...prev, [field]: val }));
              setStrategy('custom');
            }}
          />
        </div>

        {/* 增强匹配层级分析 */}
        {enhancedAnalysis && (
          <div className={styles.section}>
            <section className={styles.sectionHeader}>
              智能匹配分析
              <span className={styles.sectionSubtitle}>
                基于XML层级结构的字段关系分析
              </span>
            </section>
            <HierarchyFieldDisplay
              fields={enhancedAnalysis.hierarchy}
              analysis={enhancedAnalysis.analysis}
              onFieldSelect={(field) => {
                // 集成到现有的字段选择逻辑
                if (!selectedFields.includes(field.fieldName)) {
                  toggleField(field.fieldName);
                }
              }}
              selectedFields={selectedFields}
              showConfidence={true}
            />
          </div>
        )}

        <div className={styles.section}>
          <section className={styles.sectionHeader}>节点信息</section>
          <NodeDetail node={node} />
        </div>
      </div>
    </div>
  );
};

// 简单的正则转义工具，避免用户输入中的特殊字符破坏正则
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default NodeDetailPanel;
