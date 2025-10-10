import React, { useEffect, useRef, useMemo, useState } from 'react';
import { UiNode, AdvancedFilter, SearchOptions } from './types';
import type { MatchCriteria } from './panels/node-detail/types';
import { nodeLabel } from './utils';
import { buildXPath } from '../../../../utils/xpath';
import styles from './GridElementView.module.css';
import { MatchBadges } from './MatchBadges';
import { CopyChip } from './CopyChip';
import { matchesToXml, downloadText } from './exporters';
import { 
  MatchResultSetElementButton, 
  type CompleteStepCriteria, 
  StrategyRecommendationPanel,
  type DetailedStrategyRecommendation,
  strategySystemAdapter
} from './panels/node-detail';

export interface MatchResultsPanelProps {
  matches: UiNode[];
  matchIndex: number;
  keyword: string;
  onJump: (index: number, node: UiNode) => void;
  advFilter?: AdvancedFilter;
  onInsertXPath?: (xpath: string) => void;
  searchOptions?: Partial<SearchOptions>;
  highlightNode?: UiNode | null;
  onHoverNode?: (n: UiNode | null) => void;
  // 当在“修改参数”模式下允许从匹配结果选择一个元素并回填到步骤参数
  onSelectForStep?: (criteria: MatchCriteria | CompleteStepCriteria) => void;
  // 由上层透传的当前策略（跟随节点详情选择）
  currentStrategy?: 'absolute' | 'strict' | 'relaxed' | 'positionless' | 'standard' | 'custom';
  // 由上层透传的字段勾选集合（优先用于构建）
  currentFields?: string[];
  // 🆕 是否显示策略推荐面板
  showStrategyRecommendation?: boolean;
  // 🆕 策略推荐变更回调
  onStrategyChange?: (strategy: 'absolute' | 'strict' | 'relaxed' | 'positionless' | 'standard' | 'custom') => void;
}

const highlight = (text: string, kw: string, opts?: Partial<SearchOptions>): React.ReactNode => {
  const k = (kw || '').trim();
  if (!k) return text;
  try {
    const caseSensitive = !!opts?.caseSensitive;
    const useRegex = !!opts?.useRegex;
    const re = useRegex
      ? new RegExp(k, caseSensitive ? 'g' : 'ig')
      : new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'ig');
    const parts = text.split(re);
    const matches = text.match(re) || [];
    const res: React.ReactNode[] = [];
    parts.forEach((p, i) => {
      res.push(p);
      if (i < matches.length) res.push(<span key={i} className={styles.mark}>{matches[i]}</span>);
    });
    return <>{res}</>;
  } catch {
    return text;
  }
};

export const MatchResultsPanel: React.FC<MatchResultsPanelProps> = ({ 
  matches, 
  matchIndex, 
  keyword, 
  onJump, 
  advFilter, 
  onInsertXPath, 
  searchOptions, 
  highlightNode, 
  onHoverNode, 
  onSelectForStep, 
  currentStrategy, 
  currentFields,
  showStrategyRecommendation = false,
  onStrategyChange
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // 🆕 真实策略推荐数据（使用智能策略系统适配器）
  const realTimeRecommendations = useMemo(() => {
    if (!showStrategyRecommendation || matches.length === 0) return [];
    
    // 异步计算策略推荐
    const calculateRecommendations = async (): Promise<DetailedStrategyRecommendation[]> => {
      try {
        setIsLoadingRecommendations(true);
        setRecommendationError(null);
        
        // 分析第一个匹配元素作为代表
        const representativeElement = matches[0];
        console.log('📊 分析匹配结果的策略推荐', { 
          matchCount: matches.length, 
          element: representativeElement.tag 
        });
        
        const recommendations = await strategySystemAdapter.analyzeElement(representativeElement);
        
        // 基于匹配数量调整置信度
        const adjustedRecommendations = recommendations.map(rec => ({
          ...rec,
          confidence: rec.confidence * (matches.length > 10 ? 0.8 : matches.length < 3 ? 1.1 : 1.0),
          reason: `${rec.reason} (基于 ${matches.length} 个匹配结果)`
        }));
        
        return adjustedRecommendations;
      } catch (error) {
        console.error('❌ 匹配结果策略分析失败', error);
        setRecommendationError(error instanceof Error ? error.message : '分析失败');
        
        // 返回基于匹配数量的简化推荐
        const baseScore = Math.max(0.6, Math.min(0.95, 1 - matches.length / 100));
        return [{
          strategy: matches.length < 5 ? 'strict' : 'relaxed',
          score: {
            total: baseScore,
            performance: 0.7,
            stability: 0.8,
            compatibility: 0.9,
            uniqueness: matches.length < 5 ? 0.8 : 0.6
          },
          confidence: baseScore,
          reason: `基于 ${matches.length} 个匹配的简化推荐`
        }];
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    // 立即开始计算但不阻塞渲染
    calculateRecommendations();
    
    // 返回临时占位数据
    return [{
      strategy: 'standard',
      score: {
        total: 0.75,
        performance: 0.7,
        stability: 0.8,
        compatibility: 0.9,
        uniqueness: 0.7
      },
      confidence: 0.75,
      reason: '正在分析匹配结果...'
    }];
  }, [showStrategyRecommendation, matches.length]);

  // 🆕 监听匹配结果变化，重新计算推荐
  const [currentRecommendations, setCurrentRecommendations] = useState<DetailedStrategyRecommendation[]>([]);

  useEffect(() => {
    if (!showStrategyRecommendation || matches.length === 0) {
      setCurrentRecommendations([]);
      return;
    }

    const calculateAndSetRecommendations = async () => {
      try {
        setIsLoadingRecommendations(true);
        setRecommendationError(null);
        
        const representativeElement = matches[0];
        const recommendations = await strategySystemAdapter.analyzeElement(representativeElement);
        
        // 调整推荐基于匹配数量
        const adjustedRecommendations = recommendations.map(rec => ({
          ...rec,
          score: {
            ...rec.score,
            total: rec.score.total * (matches.length > 20 ? 0.7 : matches.length < 3 ? 1.1 : 1.0)
          },
          reason: `${rec.reason} (分析了 ${matches.length} 个匹配)`
        }));
        
        setCurrentRecommendations(adjustedRecommendations);
      } catch (error) {
        console.error('❌ 推荐计算失败', error);
        setRecommendationError(error instanceof Error ? error.message : '计算失败');
        setCurrentRecommendations([{
          strategy: 'standard',
          score: {
            total: 0.6,
            performance: 0.6,
            stability: 0.7,
            compatibility: 0.8,
            uniqueness: 0.5
          },
          confidence: 0.6,
          reason: '分析失败，使用默认推荐'
        }]);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    // 延迟计算避免频繁调用
    const timeoutId = setTimeout(calculateAndSetRecommendations, 300);
    return () => clearTimeout(timeoutId);
  }, [showStrategyRecommendation, matches.length]);

  useEffect(() => {
    if (!listRef.current || !highlightNode) return;
    const idx = matches.indexOf(highlightNode);
    if (idx >= 0) {
      const el = listRef.current.querySelector(`[data-match-item='${idx}']`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightNode, matches]);
  const onExport = () => {
    const data = matches.map(n => ({ tag: n.tag, attrs: n.attrs }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ui-matches.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const onExportXml = () => {
    const xml = matchesToXml(matches);
    downloadText(xml, 'ui-matches.xml', 'application/xml');
  };
  const onCopyAllXPaths = async () => {
    try {
      const lines = matches.map(n => buildXPath(n));
      await navigator.clipboard.writeText(lines.join('\n'));
      // 可选：轻提示，保持组件纯净暂不加入全局通知
    } catch {
      // 忽略
    }
  };

  // 🆕 生成策略推荐的模拟数据
  const mockRecommendations = useMemo(() => {
    // 已废弃：使用 currentRecommendations 替代此模拟数据
    return [];
  }, []);
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className="flex items-center justify-between">
          <span>匹配结果（{matches.length}）</span>
          {(advFilter?.enabled && (advFilter.resourceId || advFilter.text || advFilter.className)) ? (
            <span className={styles.badge}>高级过滤</span>
          ) : (
            <div className="flex items-center gap-2">
              <button className={styles.btn} onClick={onExport} style={{ padding: '2px 6px' }}>导出JSON</button>
              <button className={styles.btn} onClick={onExportXml} style={{ padding: '2px 6px' }}>导出XML</button>
              <button className={styles.btn} onClick={onCopyAllXPaths} style={{ padding: '2px 6px' }}>复制全部 XPath</button>
            </div>
          )}
        </div>
      </div>
      
      {/* 🆕 策略推荐面板 */}
      {showStrategyRecommendation && matches.length > 0 && (
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <StrategyRecommendationPanel
            recommendations={currentRecommendations}
            compact={true}
            className="bg-blue-50 dark:bg-blue-900/20"
            onStrategySelect={onStrategyChange}
            currentStrategy={currentStrategy}
            loading={isLoadingRecommendations}
            error={recommendationError}
          />
        </div>
      )}
      
      <div className={styles.cardBody} style={{ maxHeight: 240, overflow: 'auto' }} ref={listRef}>
        {matches.length === 0 ? (
          <div className="text-sm text-neutral-500">无匹配结果</div>
        ) : (
          <ul className="space-y-1">
            {matches.map((n, i) => (
              <li key={i} data-match-item={i} onMouseEnter={() => onHoverNode?.(n)} onMouseLeave={() => onHoverNode?.(null)}>
                <button
                  className={`w-full text-left px-2 py-1 rounded-md border ${n===highlightNode ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'} ${i === matchIndex ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
                  onClick={() => onJump(i, n)}
                  title={n.attrs['class'] || n.tag}
                >
                  <div className="text-sm truncate flex items-center gap-2">
                    <span className="truncate">{highlight(nodeLabel(n), keyword, searchOptions)}</span>
                    <MatchBadges node={n} keyword={keyword} advFilter={advFilter} />
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {(n.attrs['resource-id'] && `id:${n.attrs['resource-id'].split('/').pop()}`) || n.attrs['class'] || n.tag}
                  </div>
                </button>
                <div className="mt-1 flex items-center gap-2">
                  <CopyChip text={buildXPath(n)} label="复制 XPath" />
                  {onInsertXPath && (
                    <button className={styles.btn} style={{ padding: '2px 6px' }} onClick={() => onInsertXPath(buildXPath(n))}>仅插入</button>
                  )}
                  {onSelectForStep && (
                    <MatchResultSetElementButton
                      node={n}
                      onApply={(c) => onSelectForStep(c)}
                      currentStrategy={currentStrategy}
                      currentFields={currentFields}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
