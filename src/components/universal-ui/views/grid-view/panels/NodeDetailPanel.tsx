// src/components/universal-ui/views/grid-view/panels/NodeDetailPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

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
  SmartMatchingConditions
} from '../../../../../modules/enhanced-matching';

// 🆕 导入策略评分系统组件
import { 
  StrategyRecommendationPanel,
  type DetailedStrategyRecommendation,
  strategySystemAdapter
} from './node-detail';

// 🆕 导入统一策略配置器
import { UnifiedStrategyConfigurator } from '../../../strategy-selector';

// 🆕 策略置信度指示器组件
interface StrategyConfidenceIndicatorProps {
  strategy: MatchCriteria["strategy"];
  fields: string[];
  node: UiNode | null;
  evaluateFunction: (
    strategy: MatchCriteria["strategy"],
    fields: string[],
    node: UiNode
  ) => Promise<{
    confidence: number;
    issues: string[];
    suggestions: string[];
  }>;
}

const StrategyConfidenceIndicator: React.FC<StrategyConfidenceIndicatorProps> = ({
  strategy,
  fields,
  node,
  evaluateFunction
}) => {
  const [confidence, setConfidence] = useState<number>(0.8);
  const [issues, setIssues] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (!node) return;
    
    const evaluate = async () => {
      setIsEvaluating(true);
      try {
        const result = await evaluateFunction(strategy, fields, node);
        setConfidence(result.confidence);
        setIssues(result.issues);
        setSuggestions(result.suggestions);
      } catch (error) {
        console.error('置信度评估失败:', error);
        setConfidence(0.5);
        setIssues(['评估失败']);
        setSuggestions(['请检查策略配置']);
      } finally {
        setIsEvaluating(false);
      }
    };

    // 防抖评估
    const debounceTimer = setTimeout(evaluate, 300);
    return () => clearTimeout(debounceTimer);
  }, [strategy, fields, node, evaluateFunction]);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-100';
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return '高';
    if (conf >= 0.6) return '中';
    return '低';
  };

  return (
    <div className="flex items-center">
      <div 
        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          isEvaluating ? 'text-gray-500 bg-gray-100' : getConfidenceColor(confidence)
        }`}
        title={`置信度: ${(confidence * 100).toFixed(1)}%${issues.length > 0 ? ` | 问题: ${issues.join(', ')}` : ''}`}
      >
        {isEvaluating ? '评估中...' : `置信度: ${getConfidenceLabel(confidence)}`}
      </div>
      
      {/* 问题和建议的详细提示 */}
      {(issues.length > 0 || suggestions.length > 0) && !isEvaluating && (
        <div className="ml-1 relative group">
          <span className="text-xs text-amber-500 cursor-help">⚠️</span>
          <div className="hidden group-hover:block absolute top-6 left-0 z-10 w-64 p-2 bg-white border border-gray-200 rounded-md shadow-lg text-xs">
            {issues.length > 0 && (
              <div className="mb-2">
                <div className="font-medium text-red-600 mb-1">问题:</div>
                <ul className="list-disc list-inside text-red-500">
                  {issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {suggestions.length > 0 && (
              <div>
                <div className="font-medium text-blue-600 mb-1">建议:</div>
                <ul className="list-disc list-inside text-blue-500">
                  {suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [strategy, setStrategy] = useState<MatchCriteria['strategy']>('self-anchor'); // 🔄 默认使用智能策略
  const [values, setValues] = useState<Record<string, string>>({});
  const [includes, setIncludes] = useState<Record<string, string[]>>({});
  const [excludes, setExcludes] = useState<Record<string, string[]>>({});
  // “仅匹配关键词”开关：默认针对文本/描述开启
  const [keywordOnly, setKeywordOnly] = useState<Record<string, boolean>>({ text: true, 'content-desc': true });
  
  // 🆕 增强匹配分析状态
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<SmartMatchingConditions | null>(null);

  // 🆕 策略评分系统状态
  const [strategyRecommendations, setStrategyRecommendations] = useState<DetailedStrategyRecommendation[]>([]);
  const [showStrategyScoring, setShowStrategyScoring] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  
  // 🆕 模式切换状态
  const [currentMode, setCurrentMode] = useState<'intelligent' | 'static'>('intelligent');
  const [canSwitchMode] = useState(true);

  // 🆕 真实策略评分函数（使用智能策略系统适配器）
  const calculateStrategyScores = async (node: UiNode): Promise<DetailedStrategyRecommendation[]> => {
    try {
      setIsLoadingScores(true);
      console.log('🎯 开始计算策略评分', { 
        node: node.tag, 
        hasXml: !!xmlContent,
        mode: currentMode 
      });
      
      // 🎯 使用模式感知的策略分析
      const recommendations = await strategySystemAdapter.analyzeElementByMode(node, xmlContent);
      
      console.log('✅ 策略评分计算完成', { 
        nodeTag: node.tag,
        recommendationsCount: recommendations.length,
        topStrategy: recommendations[0]?.strategy,
        mode: currentMode
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

  // 🚀 动态最优策略选择器 - 基于元素特征智能推荐
  const selectOptimalStrategy = async (
    node: UiNode,
    recommendations: DetailedStrategyRecommendation[]
  ): Promise<{
    strategy: MatchCriteria["strategy"];
    confidence: number;
    reasoning: string;
  }> => {
    if (recommendations.length === 0) {
      return {
        strategy: "self-anchor", // 默认智能策略
        confidence: 0.5,
        reasoning: "无推荐数据，使用智能默认策略"
      };
    }

    // 按置信度和综合评分排序
    const sortedRecommendations = recommendations.sort((a, b) => {
      const scoreA = a.score.total * 0.6 + a.confidence * 0.4;
      const scoreB = b.score.total * 0.6 + b.confidence * 0.4;
      return scoreB - scoreA;
    });

    const optimal = sortedRecommendations[0];
    
    // 检查是否满足最低质量要求
    const minQualityThreshold = 0.65;
    const combinedScore = optimal.score.total * 0.6 + optimal.confidence * 0.4;
    
    if (combinedScore < minQualityThreshold) {
      // 低质量推荐，使用智能兜底策略
      return {
        strategy: "self-anchor",
        confidence: Math.max(combinedScore, 0.5),
        reasoning: `推荐质量不足(${combinedScore.toFixed(2)})，使用智能兜底策略`
      };
    }

    return {
      strategy: optimal.strategy as MatchCriteria["strategy"],
      confidence: optimal.confidence,
      reasoning: optimal.reason || "智能分析推荐的最佳策略"
    };
  };

  // 🔄 智能策略自动应用函数
  const applyIntelligentStrategy = async (
    node: UiNode,
    forceRefresh = false
  ) => {
    if (!node || (isLoadingScores && !forceRefresh)) return;

    try {
      setIsLoadingScores(true);
      console.log("🤖 开始智能策略自动应用", { 
        nodeTag: node.tag, 
        currentMode,
        forceRefresh 
      });

      // 计算策略推荐
      const recommendations = await calculateStrategyScores(node);
      setStrategyRecommendations(recommendations);

      // 选择最优策略
      const { strategy: optimalStrategy, confidence, reasoning } = 
        await selectOptimalStrategy(node, recommendations);

      console.log("🎯 智能策略选择结果", {
        strategy: optimalStrategy,
        confidence,
        reasoning
      });

      // 应用最优策略
      setStrategy(optimalStrategy);

      // 自动应用相应的字段预设
      const presetFields = PRESET_FIELDS[optimalStrategy as keyof typeof PRESET_FIELDS] || [];
      if (presetFields.length > 0) {
        setSelectedFields(presetFields);
        setValues(buildDefaultValues(node, presetFields));
        console.log("📋 自动应用智能字段预设", presetFields);
      }

      // 如果是智能模式，启用实时优化
      if (currentMode === "intelligent") {
        // 延迟执行二次优化
        setTimeout(() => {
          optimizeStrategyFields(node, optimalStrategy, presetFields);
        }, 500);
      }

    } catch (error) {
      console.error("❌ 智能策略应用失败", error);
    } finally {
      setIsLoadingScores(false);
    }
  };

  // 🔧 策略字段优化器 - 根据元素特征动态调整字段选择
  const optimizeStrategyFields = async (
    node: UiNode,
    strategy: MatchCriteria["strategy"],
    baseFields: string[]
  ) => {
    const attrs = node.attrs;
    const optimizedFields = [...baseFields];
    
    // 智能字段优化规则
    const fieldOptimizationRules = {
      // 文本优化：如果元素有明确文本，优先使用
      text: () => attrs.text && attrs.text.trim().length > 0 && attrs.text.length < 50,
      
      // 资源ID优化：如果有稳定的resource-id，高优先级
      "resource-id": () => attrs["resource-id"] && !attrs["resource-id"].includes("generated"),
      
      // 内容描述优化：辅助性描述字段
      "content-desc": () => attrs["content-desc"] && attrs["content-desc"].length > 0,
      
      // 类名优化：避免过于通用的类名
      "class": () => {
        const className = attrs.class || "";
        return className && !["View", "ViewGroup", "LinearLayout"].includes(className);
      }
    };

    // 应用优化规则
    Object.entries(fieldOptimizationRules).forEach(([field, shouldInclude]) => {
      if (shouldInclude() && !optimizedFields.includes(field)) {
        optimizedFields.push(field);
      } else if (!shouldInclude() && optimizedFields.includes(field)) {
        const index = optimizedFields.indexOf(field);
        optimizedFields.splice(index, 1);
      }
    });

    // 确保至少有一个可用字段
    if (optimizedFields.length === 0) {
      optimizedFields.push("class"); // 兜底字段
    }

    console.log("🔧 字段智能优化完成", {
      original: baseFields,
      optimized: optimizedFields,
      elementAttrs: Object.keys(attrs)
    });

    // 应用优化后的字段
    if (JSON.stringify(optimizedFields) !== JSON.stringify(selectedFields)) {
      setSelectedFields(optimizedFields);
      setValues(buildDefaultValues(node, optimizedFields));
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
        if (newMode === 'intelligent') {
          // 切换到智能模式：自动重新分析并应用最佳策略
          await applyIntelligentStrategy(node, true);
        } else {
          // 切换到静态模式：重新计算评分但保持当前选择
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
    }
  };

  // 🎯 手动策略选择处理函数（用于静态模式）
  const handleManualStrategySelect = (newStrategy: MatchCriteria["strategy"]) => {
    console.log(`📝 手动选择策略: ${strategy} → ${newStrategy}`);
    
    setStrategy(newStrategy);
    
    // 应用策略对应的预设字段
    const preset = PRESET_FIELDS[newStrategy as keyof typeof PRESET_FIELDS] || [];
    const nextFields = newStrategy === "custom" ? selectedFields : preset;
    setSelectedFields(nextFields);
    
    if (node) {
      setValues(buildDefaultValues(node, nextFields));
    }

    // 在静态模式下，更新当前策略但不自动重新评分
    if (currentMode === 'static') {
      console.log('🔧 静态模式：保持用户选择的策略');
    }
  };

  // 🔄 策略置信度实时评估
  const evaluateCurrentStrategyConfidence = async (
    currentStrategy: MatchCriteria["strategy"],
    currentFields: string[],
    currentNode: UiNode
  ): Promise<{
    confidence: number;
    issues: string[];
    suggestions: string[];
  }> => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 0.8; // 基础置信度

    const attrs = currentNode.attrs;

    // 评估字段选择的合理性
    if (currentFields.includes('text') && (!attrs.text || attrs.text.trim().length === 0)) {
      issues.push('选择了text字段但元素无文本内容');
      confidence -= 0.2;
      suggestions.push('考虑移除text字段或使用其他识别字段');
    }

    if (currentFields.includes('resource-id') && (!attrs['resource-id'] || attrs['resource-id'].includes('generated'))) {
      issues.push('resource-id可能不稳定');
      confidence -= 0.15;
      suggestions.push('考虑添加其他稳定的识别字段');
    }

    if (currentFields.length === 0) {
      issues.push('未选择任何匹配字段');
      confidence = 0.1;
      suggestions.push('至少选择一个有效的匹配字段');
    }

    // 评估策略适用性
    const strategyApplicability = {
      'xpath-direct': () => !!attrs.xpath,
      'strict': () => currentFields.length >= 2,
      'relaxed': () => currentFields.length >= 1,
      'self-anchor': () => !!(attrs.text || attrs['resource-id']),
      'standard': () => true
    };

    const isApplicable = strategyApplicability[currentStrategy as keyof typeof strategyApplicability];
    if (isApplicable && !isApplicable()) {
      issues.push(`当前策略(${currentStrategy})可能不适用于此元素`);
      confidence -= 0.3;
      suggestions.push('考虑切换到更适合的策略');
    }

    return {
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      issues,
      suggestions
    };
  };

  useEffect(() => { onStrategyChanged?.(strategy); }, [strategy]);
  useEffect(() => { onFieldsChanged?.(selectedFields); }, [selectedFields]);

  // 🆕 策略评分计算：当节点变化时触发
  useEffect(() => {
    if (!node) {
      setStrategyRecommendations([]);
      return;
    }

    const performIntelligentStrategy = async () => {
      // 🧠 在智能模式下，自动应用智能策略
      if (currentMode === 'intelligent') {
        console.log('🤖 智能模式：自动应用智能策略', { nodeTag: node.tag });
        
        try {
          setIsLoadingScores(true);
          
          // 计算策略推荐
          const recommendations = await calculateStrategyScores(node);
          setStrategyRecommendations(recommendations);

          // 选择最优策略
          if (recommendations.length > 0) {
            const sortedRecommendations = recommendations.sort((a, b) => {
              const scoreA = a.score.total * 0.6 + a.confidence * 0.4;
              const scoreB = b.score.total * 0.6 + b.confidence * 0.4;
              return scoreB - scoreA;
            });

            const optimalStrategy = sortedRecommendations[0].strategy as MatchCriteria['strategy'];
            
            console.log('🎯 自动应用智能推荐策略:', optimalStrategy);
            setStrategy(optimalStrategy);
            
            // 自动应用相应的字段预设
            const presetFields = PRESET_FIELDS[optimalStrategy as keyof typeof PRESET_FIELDS] || [];
            if (presetFields.length > 0) {
              setSelectedFields(presetFields);
              setValues(buildDefaultValues(node, presetFields));
              console.log('📋 自动应用智能字段预设:', presetFields);
            }
          }
        } catch (error) {
          console.error('智能策略应用失败:', error);
          setStrategyRecommendations([]);
        } finally {
          setIsLoadingScores(false);
        }
      } else {
        // 🔧 静态模式：只计算评分，不自动应用
        console.log('⚙️ 静态模式：仅计算策略评分');
        setIsLoadingScores(true);
        try {
          const recommendations = await calculateStrategyScores(node);
          setStrategyRecommendations(recommendations);
        } catch (error) {
          console.error('策略评分计算失败:', error);
          setStrategyRecommendations([]);
        } finally {
          setIsLoadingScores(false);
        }
      }
    };

    // 延迟执行，确保节点状态稳定
    const timer = setTimeout(performIntelligentStrategy, 100);
    return () => clearTimeout(timer);
  }, [node, currentMode]); // 🔄 依赖于 currentMode

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
        const conditions = await generateEnhancedMatching(targetElement, xmlDoc, {
          enableParentContext: true,
          enableChildContext: true,
          enableDescendantSearch: false,
          maxDepth: 2,
          prioritizeSemanticFields: true,
          excludePositionalFields: true
        });

        // 转换为SmartMatchingConditions格式
        const smartConditions: SmartMatchingConditions = {
          strategy: conditions.strategy,
          fields: conditions.fields,
          values: conditions.values,
          confidence: conditions.confidence,
          hierarchy: conditions.hierarchy,
          includes: {},
          excludes: {},
          analysis: {
            self: {},
            children: [],
            descendants: [],
            siblings: [],
            depth: 0,
            path: ''
          }
        };

        setEnhancedAnalysis(smartConditions);
        
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
                {/* 🆕 当前策略置信度指示器 */}
                <StrategyConfidenceIndicator 
                  strategy={strategy}
                  fields={selectedFields}
                  node={node}
                  evaluateFunction={evaluateCurrentStrategyConfidence}
                />
              </div>
              <button
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                onClick={() => setShowStrategyScoring(!showStrategyScoring)}
              >
                {showStrategyScoring ? '收起评分详情' : '查看评分详情'}
              </button>
            </div>
            
            {/* 🆕 模式说明和快速操作 */}
            {currentMode === 'intelligent' && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <div className="flex items-center gap-1 text-blue-700 mb-1">
                  <span>🎯</span>
                  <span className="font-medium">智能模式：系统自动选择最优策略</span>
                </div>
                <div className="text-blue-600">
                  系统会根据元素特征、上下文信息和历史成功率动态推荐最佳策略变体。
                  {strategyRecommendations[0] && (
                    <span className="ml-1">
                      当前推荐：<span className="font-medium">{strategyRecommendations[0].strategy}</span>
                      （置信度 {(strategyRecommendations[0].confidence * 100).toFixed(1)}%）
                    </span>
                  )}
                </div>
                {currentMode === 'intelligent' && node && (
                  <button
                    className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                    onClick={() => applyIntelligentStrategy(node, true)}
                    disabled={isLoadingScores}
                  >
                    {isLoadingScores ? '⏳ 重新分析中...' : '🔄 重新智能分析'}
                  </button>
                )}
              </div>
            )}
            
            {currentMode === 'static' && (
              <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                <div className="flex items-center gap-1 text-gray-700 mb-1">
                  <span>⚙️</span>
                  <span className="font-medium">静态模式：手动选择和调整策略</span>
                </div>
                <div className="text-gray-600">
                  您可以手动选择策略并调整匹配字段。系统仍会提供评分参考，但不会自动更改您的选择。
                </div>
              </div>
            )}
            
            {/* 紧凑模式的推荐显示 */}
            {!showStrategyScoring && (
              <StrategyRecommendationPanel
                recommendations={strategyRecommendations}
                currentStrategy={strategy}
                onStrategySelect={(newStrategy) => {
                  if (currentMode === 'intelligent') {
                    // 智能模式：应用选择并触发重新优化
                    setStrategy(newStrategy);
                    const preset = PRESET_FIELDS[newStrategy as keyof typeof PRESET_FIELDS] || [];
                    const nextFields = newStrategy === 'custom' ? selectedFields : preset;
                    setSelectedFields(nextFields);
                    if (node) {
                      setValues(buildDefaultValues(node, nextFields));
                      // 延迟优化
                      setTimeout(() => optimizeStrategyFields(node, newStrategy, nextFields), 300);
                    }
                  } else {
                    // 静态模式：直接应用选择
                    handleManualStrategySelect(newStrategy);
                  }
                }}
                onWeightChange={(weights) => {
                  // TODO: 实时重新计算评分
                  console.log("权重调整:", weights);
                }}
                compact={true}
                className="border border-blue-200 dark:border-blue-800 rounded-lg p-3"
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
