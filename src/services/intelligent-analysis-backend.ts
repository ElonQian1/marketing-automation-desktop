// src/services/intelligent-analysis-backend.ts
// module: services | layer: services | role: backend-service
// summary: 智能分析后端服务（V2系统），调用Tauri命令与Rust后端通信
//
// 🔄 [V2 传统智能分析系统 - 已升级到 V3]
// 
// ⚠️  重要提醒：此文件为 V2 传统系统，已有更先进的 V3 替代方案
// 
// V2 系统特征：
//   - ✅ 事件驱动架构 (analysis:progress, analysis:done)  
//   - ❌ 完整数据传输（300-500KB步骤数据）
//   - ❌ 顺序执行，无智能优化
//   - ✅ 稳定可靠，适合作为后备方案
//
// 🚀 V3 升级版本（推荐使用）：
//   📁 V3 服务层：src/services/intelligent-analysis-backend-v3.ts ✅ 已创建
//   📁 V3 类型定义：src/protocol/v3/types.ts ✅ 已完成
//   📁 V3 后端引擎：src-tauri/src/exec/v3/ ✅ 已实现
//   📁 特性开关：src/config/feature-flags.ts ✅ 已启用
//
// 🔄 V2 → V3 关键升级：
//   V2: startAnalysis() → start_intelligent_analysis
//   V3: executeChainV3() → execute_chain_test_v3 (90%数据精简)
//
//   V2: 完整步骤数据传输 (~500KB)  
//   V3: by-ref 引用传递 (~5KB) 
//
//   V2: 简单顺序执行
//   V3: 智能短路 + 自动回退 + 缓存优化
//
// 📋 迁移建议：
//   - 新功能开发：优先使用 V3 系统
//   - 现有功能：通过特性开关逐步迁移
//   - 兼容性：V2 系统保留作为后备方案
//   - 删除时间：待 V3 系统完全验证后（约 2-3 个月）
//
// ============================================

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { EVENTS } from '../shared/constants/events';
import type { UIElement } from '../api/universalUIAPI';
import type { StrategyCandidate, AnalysisResult, StrategyPerformance } from '../modules/universal-ui/types/intelligent-analysis-types';

/**
 * Tauri后端配置接口
 */
interface TauriAnalysisJobConfig {
  element_context: {
    snapshot_id: string;
    element_path: string;
    element_text?: string;
    element_bounds?: string;
    element_type?: string;
    key_attributes?: Record<string, string>;
    container_info?: {
      container_type: string;
      container_path: string;
      item_index?: number;
      total_items?: number;
    };
  };
  step_id?: string;
  lock_container: boolean;
  enable_smart_candidates: boolean;
  enable_static_candidates: boolean;
}

/**
 * Tauri后端响应接口
 */
interface TauriAnalysisJobResponse {
  job_id: string;
  selection_hash: string;
  state: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
}

/**
 * Tauri后端事件接口
 */
interface TauriAnalysisProgressEvent {
  job_id: string;
  progress: number; // 0-100 的百分比数字
  current_step: string;
  estimated_time_left?: number;
}

interface TauriAnalysisDoneEvent {
  job_id: string;
  selection_hash: string;
  result: {
    selection_hash: string;
    step_id?: string;
    smart_candidates: StrategyCandidate[];
    static_candidates: StrategyCandidate[];
    recommended_key: string;
    recommended_confidence: number;
    fallback_strategy: StrategyCandidate;
  };
}

interface TauriAnalysisErrorEvent {
  job_id: string;
  selection_hash: string;
  error: string;
}

/**
 * 智能分析后端服务类
 */
export class IntelligentAnalysisBackendService {
  private eventListeners: UnlistenFn[] = [];

  /**
   * 启动智能分析
   */
  async startAnalysis(
    element: UIElement,
    stepId?: string,
    options: {
      lockContainer?: boolean;
      enableSmartCandidates?: boolean;
      enableStaticCandidates?: boolean;
    } = {}
  ): Promise<TauriAnalysisJobResponse> {
    const {
      lockContainer = false,
      enableSmartCandidates = true,
      enableStaticCandidates = true,
    } = options;

    // 构建Tauri配置
    const config: TauriAnalysisJobConfig = {
      element_context: {
        snapshot_id: 'current',
        element_path: element.xpath || element.id || '',
        element_text: element.text,
        element_bounds: element.bounds ? JSON.stringify(element.bounds) : undefined,
        element_type: element.element_type || 'unknown',
        key_attributes: {
          'resource-id': element.resource_id || '',
          'content-desc': element.content_desc || '',
          'text': element.text || '',
          'class': element.class_name || '',
        },
      },
      step_id: stepId,
      lock_container: lockContainer,
      enable_smart_candidates: enableSmartCandidates,
      enable_static_candidates: enableStaticCandidates,
    };

    console.log('🚀 [BackendService] 启动智能分析', config);

    try {
      const response = await invoke<TauriAnalysisJobResponse>(
        'start_intelligent_analysis',
        { config }
      );

      console.log('✅ [BackendService] 分析任务已启动', response);
      return response;
    } catch (error) {
      console.error('❌ [BackendService] 启动分析失败', error);
      throw error;
    }
  }

  /**
   * 取消智能分析
   */
  async cancelAnalysis(jobId: string): Promise<void> {
    console.log('⏹️ [BackendService] 取消分析', jobId);

    try {
      await invoke('cancel_intelligent_analysis', { job_id: jobId });
      console.log('✅ [BackendService] 分析已取消');
    } catch (error) {
      console.error('❌ [BackendService] 取消分析失败', error);
      throw error;
    }
  }

  /**
   * 监听分析进度事件
   */
  async listenToAnalysisProgress(
    onProgress: (jobId: string, progress: number, step: string, estimatedTimeLeft?: number) => void
  ): Promise<UnlistenFn> {
    console.log('🔧 [BackendService] 设置进度事件监听器');
    const unlisten = await listen<TauriAnalysisProgressEvent>(
      EVENTS.ANALYSIS_PROGRESS,
      (event) => {
        console.log('📊 [BackendService] 收到分析进度更新', event.payload);
        onProgress(
          event.payload.job_id,
          event.payload.progress,
          event.payload.current_step,
          event.payload.estimated_time_left
        );
      }
    );

    this.eventListeners.push(unlisten);
    console.log('✅ [BackendService] 进度事件监听器已设置');
    return unlisten;
  }

  /**
   * 监听分析完成事件
   */
  async listenToAnalysisComplete(
    onComplete: (jobId: string, result: AnalysisResult) => void
  ): Promise<UnlistenFn> {
    console.log('🔧 [BackendService] 设置完成事件监听器');
    const unlisten = await listen<TauriAnalysisDoneEvent>(
      EVENTS.ANALYSIS_DONE,
      (event) => {
        console.log('✅ [BackendService] 收到分析完成事件', event.payload);
        
        // 转换结果格式并增强策略对象
        const enhanceStrategy = (strategy: StrategyCandidate): StrategyCandidate => ({
          ...strategy,
          // 为后端返回的策略添加默认的UI展示字段
          scenarios: strategy.scenarios || this.getDefaultScenarios(strategy.variant),
          pros: strategy.pros || this.getDefaultPros(strategy.variant),
          cons: strategy.cons || this.getDefaultCons(strategy.variant),
          performance: strategy.performance || this.getDefaultPerformance(strategy.variant),
        });

        const result: AnalysisResult = {
          selectionHash: event.payload.result.selection_hash,
          stepId: event.payload.result.step_id,
          smartCandidates: event.payload.result.smart_candidates.map(enhanceStrategy),
          staticCandidates: event.payload.result.static_candidates.map(enhanceStrategy),
          recommendedKey: event.payload.result.recommended_key,
          recommendedConfidence: event.payload.result.recommended_confidence,
          fallbackStrategy: enhanceStrategy(event.payload.result.fallback_strategy),
        };
        
        console.log('🔄 [BackendService] 转换后的结果', result);
        onComplete(event.payload.job_id, result);
      }
    );

    this.eventListeners.push(unlisten);
    console.log('✅ [BackendService] 完成事件监听器已设置');
    return unlisten;
  }

  /**
   * 监听分析错误事件
   */
  async listenToAnalysisError(
    onError: (error: string) => void
  ): Promise<UnlistenFn> {
    const unlisten = await listen<TauriAnalysisErrorEvent>(
      EVENTS.ANALYSIS_ERROR,
      (event) => {
        console.error('❌ [BackendService] 分析错误', event.payload);
        onError(event.payload.error);
      }
    );

    this.eventListeners.push(unlisten);
    return unlisten;
  }

  /**
   * 清理所有事件监听器
   */
  cleanup(): void {
    console.log('🧹 [BackendService] 清理事件监听器', this.eventListeners.length);
    this.eventListeners.forEach(unlisten => unlisten());
    this.eventListeners = [];
  }

  /**
   * 获取策略变体的默认适用场景
   */
  private getDefaultScenarios(variant: string): string[] {
    const scenarioMap: Record<string, string[]> = {
      'self_anchor': ['按钮操作', '表单输入', '菜单选择'],
      'child_driven': ['卡片组件', '列表项操作', '复合按钮'],
      'region_scoped': ['表格操作', '重复卡片', '分区内容'],
      'neighbor_relative': ['相对定位', '邻近元素', '布局依赖'],
      'index_fallback': ['兜底方案', '位置固定', '最后选择'],
    };
    return scenarioMap[variant] || ['通用场景'];
  }

  /**
   * 获取策略变体的默认优点
   */
  private getDefaultPros(variant: string): string[] {
    const prosMap: Record<string, string[]> = {
      'self_anchor': ['执行速度最快', '跨设备兼容性最好', '不依赖页面结构变化'],
      'child_driven': ['对复合组件效果好', '能处理动态结构', '稳定性较高'],
      'region_scoped': ['减少误匹配', '提高查找精度', '适用于重复结构'],
      'neighbor_relative': ['适应性强', '能处理布局变化', '定位相对准确'],
      'index_fallback': ['简单可靠', '兜底保障', '易于理解'],
    };
    return prosMap[variant] || ['由AI智能分析生成'];
  }

  /**
   * 获取策略变体的默认缺点
   */
  private getDefaultCons(variant: string): string[] {
    const consMap: Record<string, string[]> = {
      'self_anchor': ['需要元素具备唯一性特征', '对动态生成ID的处理较弱'],
      'child_driven': ['需要遍历子元素', '执行时间稍长'],
      'region_scoped': ['依赖容器稳定性', '可能受布局变化影响'],
      'neighbor_relative': ['受相邻元素影响', '在简单布局中可能过度复杂'],
      'index_fallback': ['脆弱性较高', '页面结构变化易失效'],
    };
    return consMap[variant] || ['具体限制需要实际测试确认'];
  }

  /**
   * 获取策略变体的默认性能指标
   */
  private getDefaultPerformance(variant: string): StrategyPerformance {
    const performanceMap = {
      'self_anchor': { speed: 'fast' as const, stability: 'high' as const, crossDevice: 'excellent' as const },
      'child_driven': { speed: 'medium' as const, stability: 'high' as const, crossDevice: 'good' as const },
      'region_scoped': { speed: 'medium' as const, stability: 'medium' as const, crossDevice: 'good' as const },
      'neighbor_relative': { speed: 'medium' as const, stability: 'medium' as const, crossDevice: 'fair' as const },
      'index_fallback': { speed: 'fast' as const, stability: 'low' as const, crossDevice: 'good' as const },
    };
    return performanceMap[variant as keyof typeof performanceMap] || { speed: 'medium', stability: 'medium', crossDevice: 'good' };
  }
}

/**
 * 单例后端服务实例
 */
export const intelligentAnalysisBackend = new IntelligentAnalysisBackendService();

/**
 * Hook friendly 接口
 */
export const useIntelligentAnalysisBackend = () => {
  return intelligentAnalysisBackend;
};
