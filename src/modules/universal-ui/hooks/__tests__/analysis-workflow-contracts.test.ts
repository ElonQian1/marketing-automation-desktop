// src/modules/universal-ui/hooks/__tests__/analysis-workflow-contracts.test.ts
// module: universal-ui | layer: tests | role: workflow-logic-tests
// summary: 智能分析工作流核心逻辑合同测试，防止"30%残影"问题

import { describe, it, expect } from 'vitest';

/**
 * 模拟分析作业状态管理
 */
interface MockAnalysisJob {
  jobId: string;
  state: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  completedAt?: number;
}

/**
 * 模拟步骤卡片状态
 */
interface MockStepCard {
  stepId: string;
  analysisJobId?: string;
  analysisState: 'idle' | 'analyzing' | 'analysis_completed' | 'analysis_failed';
  analysisProgress: number;
}

/**
 * 模拟工作流状态管理器
 */
class MockWorkflowManager {
  private jobs = new Map<string, MockAnalysisJob>();
  private stepCards: MockStepCard[] = [];

  // 处理进度更新
  handleProgressUpdate(jobId: string, progress: number) {
    const job = this.jobs.get(jobId);
    if (job && job.state === 'running') {
      // ✅ 只更新运行中的作业
      job.progress = progress;
      
      // 更新对应的步骤卡片
      this.stepCards.forEach(card => {
        if (card.analysisJobId === jobId && card.analysisState === 'analyzing') {
          card.analysisProgress = progress;
        }
      });
    }
    // ⚠️ 如果作业已完成或失败，忽略进度更新
  }

  // 处理完成事件
  handleCompleteEvent(jobId: string, result: { selectionHash: string }) {
    const job = this.jobs.get(jobId);
    if (job) {
      // 🎯 强制设置为已完成状态
      job.state = 'completed';
      job.progress = 100; // 强制100%
      job.completedAt = Date.now();
      
      // 更新步骤卡片并清除jobId引用
      this.stepCards.forEach(card => {
        if (card.analysisJobId === jobId) {
          card.analysisState = 'analysis_completed';
          card.analysisProgress = 100; // 强制100%
          card.analysisJobId = undefined; // 🔒 清除引用防止后续误匹配
        }
      });
    }
  }

  // 辅助方法
  addJob(jobId: string, stepId: string) {
    this.jobs.set(jobId, {
      jobId,
      state: 'running',
      progress: 0
    });
    
    this.stepCards.push({
      stepId,
      analysisJobId: jobId,
      analysisState: 'analyzing',
      analysisProgress: 0
    });
  }

  getJob(jobId: string) {
    return this.jobs.get(jobId);
  }

  getStepCard(stepId: string) {
    return this.stepCards.find(c => c.stepId === stepId);
  }

  isAnalyzing() {
    return Array.from(this.jobs.values()).some(job => 
      job.state === 'queued' || job.state === 'running'
    );
  }
}

describe('智能分析工作流核心逻辑合同测试', () => {
  describe('🔒 合同1: 不同jobId的进度不得串台', () => {
    it('只更新匹配jobId的作业进度', () => {
      const manager = new MockWorkflowManager();
      
      // 创建两个作业
      manager.addJob('job-1', 'step-1');
      manager.addJob('job-2', 'step-2');
      
      // 更新第一个作业进度
      manager.handleProgressUpdate('job-1', 45);
      
      // 验证：只有job-1被更新
      expect(manager.getJob('job-1')?.progress).toBe(45);
      expect(manager.getJob('job-2')?.progress).toBe(0);
    });

    it('只更新匹配jobId的步骤卡片进度', () => {
      const manager = new MockWorkflowManager();
      
      // 创建两个步骤
      manager.addJob('job-alpha', 'step-alpha');
      manager.addJob('job-beta', 'step-beta');
      
      // 更新第一个步骤进度
      manager.handleProgressUpdate('job-alpha', 60);
      
      // 验证：只有alpha步骤被更新
      expect(manager.getStepCard('step-alpha')?.analysisProgress).toBe(60);
      expect(manager.getStepCard('step-beta')?.analysisProgress).toBe(0);
    });
  });

  describe('🚀 合同2: completed强制progress=100且清理loading状态', () => {
    it('完成事件必须强制progress=100', () => {
      const manager = new MockWorkflowManager();
      
      // 创建作业并更新到中间进度
      manager.addJob('job-123', 'step-123');
      manager.handleProgressUpdate('job-123', 73);
      
      // 验证中间状态
      expect(manager.getJob('job-123')?.progress).toBe(73);
      expect(manager.isAnalyzing()).toBe(true);
      
      // 发送完成事件
      manager.handleCompleteEvent('job-123', { selectionHash: 'hash-123' });
      
      // 🎯 验证：进度强制为100%，loading清除
      const job = manager.getJob('job-123');
      expect(job?.state).toBe('completed');
      expect(job?.progress).toBe(100); // 强制100%
      expect(manager.isAnalyzing()).toBe(false); // loading清除
    });

    it('完成事件必须清除步骤卡片的analysisJobId', () => {
      const manager = new MockWorkflowManager();
      
      // 创建步骤
      manager.addJob('job-456', 'step-456');
      
      // 验证初始绑定
      let step = manager.getStepCard('step-456');
      expect(step?.analysisJobId).toBe('job-456');
      expect(step?.analysisState).toBe('analyzing');
      
      // 完成分析
      manager.handleCompleteEvent('job-456', { selectionHash: 'hash-456' });
      
      // 🔒 验证：jobId被清除，状态更新
      step = manager.getStepCard('step-456');
      expect(step?.analysisJobId).toBeUndefined(); // 必须清除
      expect(step?.analysisState).toBe('analysis_completed');
      expect(step?.analysisProgress).toBe(100);
    });
  });

  describe('🛡️ 合同3: completed后到来的旧progress必须被忽略', () => {
    it('已完成作业不响应任何进度更新', () => {
      const manager = new MockWorkflowManager();
      
      // 创建并完成作业
      manager.addJob('job-789', 'step-789');
      manager.handleCompleteEvent('job-789', { selectionHash: 'hash-789' });
      
      // 验证已完成
      expect(manager.getJob('job-789')?.state).toBe('completed');
      expect(manager.getJob('job-789')?.progress).toBe(100);
      
      // ⚠️ 尝试发送过时的进度更新
      manager.handleProgressUpdate('job-789', 30);
      
      // 🛡️ 验证：进度不被倒退
      const job = manager.getJob('job-789');
      expect(job?.progress).toBe(100); // 保持100%
      expect(job?.state).toBe('completed'); // 保持完成状态
    });

    it('步骤卡片jobId清除后不响应进度更新', () => {
      const manager = new MockWorkflowManager();
      
      // 创建并完成步骤
      manager.addJob('job-clear', 'step-clear');
      manager.handleCompleteEvent('job-clear', { selectionHash: 'hash-clear' });
      
      // 验证jobId已清除
      let step = manager.getStepCard('step-clear');
      expect(step?.analysisJobId).toBeUndefined();
      expect(step?.analysisProgress).toBe(100);
      
      // 尝试发送该jobId的进度更新
      manager.handleProgressUpdate('job-clear', 50);
      
      // 🔒 验证：步骤卡片不受影响（因为jobId已清除）
      step = manager.getStepCard('step-clear');
      expect(step?.analysisProgress).toBe(100); // 保持100%
      expect(step?.analysisState).toBe('analysis_completed');
    });

    it('多作业环境下完成的作业独立保护', () => {
      const manager = new MockWorkflowManager();
      
      // 创建三个作业
      manager.addJob('job-1', 'step-1');
      manager.addJob('job-2', 'step-2');
      manager.addJob('job-3', 'step-3');
      
      // 更新各作业到不同进度
      manager.handleProgressUpdate('job-1', 20);
      manager.handleProgressUpdate('job-2', 40);
      manager.handleProgressUpdate('job-3', 60);
      
      // 完成第二个作业
      manager.handleCompleteEvent('job-2', { selectionHash: 'hash-2' });
      
      // 验证第二个作业已完成
      expect(manager.getJob('job-2')?.state).toBe('completed');
      expect(manager.getJob('job-2')?.progress).toBe(100);
      
      // 尝试更新已完成的作业
      manager.handleProgressUpdate('job-2', 75);
      
      // 验证：已完成的作业不受影响
      expect(manager.getJob('job-2')?.progress).toBe(100);
      
      // 验证：其他作业仍可正常更新
      manager.handleProgressUpdate('job-1', 85);
      manager.handleProgressUpdate('job-3', 90);
      
      expect(manager.getJob('job-1')?.progress).toBe(85);
      expect(manager.getJob('job-3')?.progress).toBe(90);
    });
  });

  describe('🔄 综合场景：竞态条件和边界情况', () => {
    it('快速progress->complete->progress序列正确处理', () => {
      const manager = new MockWorkflowManager();
      
      // 创建作业
      manager.addJob('job-race', 'step-race');
      
      // 快速序列操作
      manager.handleProgressUpdate('job-race', 90);
      manager.handleCompleteEvent('job-race', { selectionHash: 'hash-race' });
      manager.handleProgressUpdate('job-race', 95); // 应该被忽略
      
      // 验证最终状态正确
      const job = manager.getJob('job-race');
      expect(job?.state).toBe('completed');
      expect(job?.progress).toBe(100); // 不是95%
      expect(manager.isAnalyzing()).toBe(false);
    });

    it('重复完成事件的幂等性', () => {
      const manager = new MockWorkflowManager();
      
      // 创建作业
      manager.addJob('job-idempotent', 'step-idempotent');
      
      // 第一次完成
      manager.handleCompleteEvent('job-idempotent', { selectionHash: 'hash-1' });
      const firstCompleteTime = manager.getJob('job-idempotent')?.completedAt;
      
      // 第二次完成（重复事件）
      manager.handleCompleteEvent('job-idempotent', { selectionHash: 'hash-2' });
      
      // 验证：状态保持一致，时间戳可能更新但状态不变
      const job = manager.getJob('job-idempotent');
      expect(job?.state).toBe('completed');
      expect(job?.progress).toBe(100);
      
      // 步骤卡片状态保持一致
      const step = manager.getStepCard('step-idempotent');
      expect(step?.analysisState).toBe('analysis_completed');
      expect(step?.analysisJobId).toBeUndefined();
    });
  });
});