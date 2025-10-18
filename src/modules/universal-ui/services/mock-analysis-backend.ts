// src/modules/universal-ui/services/mock-analysis-backend.ts
// module: universal-ui | layer: services | role: mock-backend
// summary: 模拟后端分析服务，用于开发和测试智能分析工作流

import type {
  ElementSelectionContext,
  AnalysisJob,
  AnalysisResult,
  StrategyCandidate,
  AnalysisProgressEvent,
  AnalysisDoneEvent,
  AnalysisErrorEvent
} from '../types/intelligent-analysis-types';

import { calculateSelectionHash } from '../utils/selection-hash';
import { EVENTS } from '../../../shared/constants/events';

/**
 * 模拟后端分析服务
 * 在实际项目中应该替换为真实的Tauri命令调用
 */
export class MockAnalysisBackend {
  private jobs = new Map<string, AnalysisJob>();
  private jobTimeouts = new Map<string, NodeJS.Timeout>();
  private eventCallbacks = new Map<string, ((payload: unknown) => void)[]>();
  
  /**
   * 监听事件
   */
  listen<T>(eventName: string, callback: (payload: T) => void): () => void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, []);
    }
    
    this.eventCallbacks.get(eventName)!.push(callback);
    
    // 返回取消监听函数
    return () => {
      const callbacks = this.eventCallbacks.get(eventName);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * 触发事件
   */
  private emit<T>(eventName: string, payload: T): void {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`事件回调执行失败 [${eventName}]:`, error);
        }
      });
    }
  }
  
  /**
   * 生成模拟策略候选
   */
  private generateMockCandidates(context: ElementSelectionContext): StrategyCandidate[] {
    const hasText = Boolean(context.elementText);
    const hasResourceId = Boolean(context.keyAttributes?.['resource-id']);
    const hasClass = Boolean(context.keyAttributes?.class);
    
    const candidates: StrategyCandidate[] = [];
    
    // 自我锚点策略
    if (hasResourceId || hasText) {
      candidates.push({
        key: 'self_anchor',
        name: '自我锚点',
        confidence: hasResourceId ? 95 : 88,
        description: hasResourceId ? '基于resource-id定位，稳定性最高' : '基于文本内容定位',
        variant: 'self_anchor',
        xpath: hasResourceId 
          ? `//*[@resource-id="${context.keyAttributes!['resource-id']}"]`
          : `//*[contains(@text,"${context.elementText}")]`,
        enabled: true,
        isRecommended: true
      });
    }
    
    // 子树锚点策略
    if (hasText || hasClass) {
      candidates.push({
        key: 'child_driven',
        name: '子树锚点',
        confidence: 87,
        description: '基于子元素特征定位',
        variant: 'child_driven',
        xpath: hasText 
          ? `//android.widget.LinearLayout[child::*[contains(@text,"${context.elementText}")]]`
          : `//android.widget.LinearLayout[child::*[@class="${context.keyAttributes!.class}"]]`,
        enabled: true,
        isRecommended: false
      });
    }
    
    // 区域限定策略
    candidates.push({
      key: 'region_scoped',
      name: '区域限定',
      confidence: 82,
      description: '在特定区域内定位',
      variant: 'region_scoped',
      xpath: context.containerInfo 
        ? `${context.containerInfo.containerPath}//*[@class="${context.keyAttributes?.class || 'android.widget.TextView'}"]`
        : `//android.widget.ScrollView//*[1]`,
      enabled: true,
      isRecommended: false
    });
    
    // 邻近相对定位
    if (context.containerInfo?.itemIndex !== undefined) {
      candidates.push({
        key: 'neighbor_relative',
        name: '邻近相对',
        confidence: 75,
        description: '基于邻近元素相对定位',
        variant: 'neighbor_relative',
        xpath: `${context.containerInfo.containerPath}/*[${context.containerInfo.itemIndex + 1}]`,
        enabled: true,
        isRecommended: false
      });
    }
    
    // 全局索引（兜底）
    candidates.push({
      key: 'index_fallback',
      name: '全局索引',
      confidence: 65,
      description: '绝对位置索引，受布局变化影响',
      variant: 'index_fallback',
      xpath: context.elementPath,
      enabled: true,
      isRecommended: false
    });
    
    return candidates.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 启动分析
   */
  async startAnalysis(payload: {
    snapshotId: string;
    elementCtxJson: string;
    stepId?: string;
  }): Promise<string> {
    const context: ElementSelectionContext = JSON.parse(payload.elementCtxJson);
    const selectionHash = calculateSelectionHash(context);
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查是否已有相同选择的活跃任务
    const existingJob = Array.from(this.jobs.values()).find(job => 
      job.selectionHash === selectionHash && 
      (job.state === 'queued' || job.state === 'running')
    );
    
    if (existingJob) {
      return existingJob.jobId;
    }
    
    // 创建分析任务
    const job: AnalysisJob = {
      jobId,
      selectionHash,
      stepId: payload.stepId,
      state: 'queued',
      progress: 0,
      startedAt: Date.now()
    };
    
    this.jobs.set(jobId, job);
    
    // 模拟分析过程
    this.simulateAnalysisProcess(jobId, context);
    
    return jobId;
  }
  
  /**
   * 模拟分析过程
   */
  private simulateAnalysisProcess(jobId: string, context: ElementSelectionContext): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    // 更新为运行状态
    job.state = 'running';
    
    const phases = [
      { progress: 10, message: '预处理XML快照', delay: 200 },
      { progress: 35, message: '静态候选生成与评估', delay: 300 },
      { progress: 75, message: '智能候选生成与评估', delay: 400 },
      { progress: 95, message: '汇总与推荐', delay: 200 },
      { progress: 100, message: '分析完成', delay: 100 }
    ];
    
    let currentPhase = 0;
    
    const executeNextPhase = () => {
      const job = this.jobs.get(jobId);
      if (!job || job.state === 'canceled') {
        return;
      }
      
      if (currentPhase >= phases.length) {
        // 分析完成
        const candidates = this.generateMockCandidates(context);
        const result: AnalysisResult = {
          selectionHash: job.selectionHash,
          stepId: job.stepId,
          smartCandidates: candidates.slice(0, -1), // 除了最后一个兜底策略
          staticCandidates: [candidates[candidates.length - 1]], // 兜底策略作为静态候选
          recommendedKey: candidates[0].key,
          recommendedConfidence: candidates[0].confidence,
          fallbackStrategy: candidates[candidates.length - 1]
        };
        
        job.state = 'completed';
        job.progress = 100;
        job.completedAt = Date.now();
        job.result = result;
        
        this.emit<AnalysisDoneEvent>(EVENTS.ANALYSIS_DONE, {
          jobId,
          result
        });
        
        return;
      }
      
      const phase = phases[currentPhase];
      job.progress = phase.progress;
      job.estimatedTimeLeft = (phases.length - currentPhase - 1) * 250;
      
      this.emit<AnalysisProgressEvent>(EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        progress: phase.progress,
        message: phase.message,
        estimatedTimeLeft: job.estimatedTimeLeft
      });
      
      currentPhase++;
      
      const timeout = setTimeout(executeNextPhase, phase.delay);
      this.jobTimeouts.set(jobId, timeout);
    };
    
    // 开始执行
    setTimeout(executeNextPhase, 100);
    
    // 设置总超时
    const totalTimeout = setTimeout(() => {
      const job = this.jobs.get(jobId);
      if (job && job.state === 'running') {
        job.state = 'failed';
        job.error = '分析超时';
        job.completedAt = Date.now();
        
        this.emit<AnalysisErrorEvent>(EVENTS.ANALYSIS_ERROR, {
          jobId,
          error: '分析超时',
          canRetry: true
        });
      }
    }, 10000);
    
    this.jobTimeouts.set(`${jobId}_total`, totalTimeout);
  }
  
  /**
   * 取消分析
   */
  async cancelAnalysis(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`分析任务不存在: ${jobId}`);
    }
    
    job.state = 'canceled';
    job.completedAt = Date.now();
    
    // 清理定时器
    const timeout = this.jobTimeouts.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.jobTimeouts.delete(jobId);
    }
    
    const totalTimeout = this.jobTimeouts.get(`${jobId}_total`);
    if (totalTimeout) {
      clearTimeout(totalTimeout);
      this.jobTimeouts.delete(`${jobId}_total`);
    }
    
    this.emit<AnalysisErrorEvent>(EVENTS.ANALYSIS_ERROR, {
      jobId,
      error: 'canceled',
      canRetry: false
    });
  }
  
  /**
   * 创建快速步骤卡片
   */
  async createStepCardQuick(payload: {
    snapshotId: string;
    elementCtxJson: string;
    lockContainer?: boolean;
  }): Promise<string> {
    const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 模拟创建延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 在实际实现中，这里会处理payload数据
    console.log(`创建步骤卡片: ${payload.snapshotId}, 锁定容器: ${payload.lockContainer}`);
    
    return stepId;
  }
  
  /**
   * 绑定分析结果到步骤
   */
  async bindAnalysisResultToStep(payload: {
    stepId: string;
    resultJson: string;
  }): Promise<void> {
    // 模拟绑定延迟
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // 在实际实现中，这里会将结果保存到步骤卡片中
    console.log(`绑定分析结果到步骤 ${payload.stepId}:`, JSON.parse(payload.resultJson));
  }
  
  /**
   * 切换活跃策略
   */
  async switchActiveStrategy(payload: {
    stepId: string;
    strategyKey: string;
    followSmart: boolean;
  }): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 20));
    
    console.log(`步骤 ${payload.stepId} 切换策略到 ${payload.strategyKey}`);
  }
  
  /**
   * 预览绝对XPath
   */
  async previewAbsoluteXPath(payload: {
    snapshotId: string;
    elementCtxJson: string;
  }): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const context: ElementSelectionContext = JSON.parse(payload.elementCtxJson);
    console.log(`预览XPath: ${context.elementPath}`);
  }
  
  /**
   * 清理资源
   */
  cleanup(): void {
    // 清理所有定时器
    this.jobTimeouts.forEach(timeout => clearTimeout(timeout));
    this.jobTimeouts.clear();
    
    // 清理作业
    this.jobs.clear();
    
    // 清理事件监听器
    this.eventCallbacks.clear();
  }
}

// 全局实例
export const mockAnalysisBackend = new MockAnalysisBackend();