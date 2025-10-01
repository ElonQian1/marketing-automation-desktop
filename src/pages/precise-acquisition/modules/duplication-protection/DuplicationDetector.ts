/**
 * 查重检测器 - 核心检测逻辑
 */

import type { 
  DuplicationRule, 
  DuplicationCheck, 
  DuplicationHistory,
  DuplicationEvent 
} from './types';

export class DuplicationDetector {
  private rules: Map<string, DuplicationRule> = new Map();
  private history: Map<string, DuplicationHistory> = new Map();
  private events: DuplicationEvent[] = [];
  private checks: DuplicationCheck[] = [];

  /**
   * 检查是否存在重复操作
   */
  async checkDuplication(
    targetId: string,
    targetType: 'user' | 'comment' | 'video',
    actionType: 'follow' | 'reply' | 'like' | 'share',
    deviceId: string,
    taskId?: string
  ): Promise<DuplicationCheck> {
    const checkId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 获取适用的规则（按优先级排序）
    const applicableRules = this.getApplicableRules(actionType, deviceId);
    
    let finalResult: DuplicationCheck['result'] = 'pass';
    let blockingReason = '';
    let confidence = 0;
    let triggeredRule: DuplicationRule | null = null;
    
    // 获取目标历史记录
    const targetHistory = this.getTargetHistory(targetId);
    
    // 逐个检查规则
    for (const rule of applicableRules) {
      const ruleCheck = this.checkAgainstRule(
        rule,
        targetId,
        targetType,
        actionType,
        deviceId,
        targetHistory
      );
      
      // 更新规则统计
      this.updateRuleStats(rule.id);
      
      if (ruleCheck.blocked) {
        finalResult = rule.actions.onDuplicationDetected as DuplicationCheck['result'];
        blockingReason = ruleCheck.reason;
        confidence = Math.max(confidence, ruleCheck.confidence);
        triggeredRule = rule;
        
        // 记录事件
        this.recordEvent({
          type: 'rule_triggered',
          ruleId: rule.id,
          ruleName: rule.name,
          targetId,
          deviceId,
          details: {
            originalAction: actionType,
            blockReason: ruleCheck.reason,
            impact: this.assessImpact(rule, ruleCheck),
            userNotified: false
          }
        });
        
        // 如果是阻断类型，停止后续检查
        if (finalResult === 'blocked') {
          break;
        }
      }
    }
    
    // 创建检查记录
    const check: DuplicationCheck = {
      id: checkId,
      ruleId: triggeredRule?.id || '',
      targetId,
      targetType,
      actionType,
      deviceId,
      taskId,
      result: finalResult,
      reason: blockingReason || '未检测到重复操作',
      confidence,
      details: {
        previousActions: this.getPreviousActions(targetId, deviceId),
        timeWindowUsed: triggeredRule ? this.formatTimeWindow(triggeredRule.timeWindow) : '',
        ruleTriggered: triggeredRule?.name || 'none',
        recommendedAction: this.getRecommendedAction(finalResult, triggeredRule)
      },
      actionTaken: 'proceeded', // 将在实际执行时更新
      timestamp: new Date().toISOString()
    };
    
    this.checks.push(check);
    
    // 限制检查记录数量
    if (this.checks.length > 10000) {
      this.checks = this.checks.slice(-5000);
    }
    
    return check;
  }

  /**
   * 记录操作结果
   */
  async recordAction(
    checkId: string,
    actionTaken: DuplicationCheck['actionTaken'],
    result: 'success' | 'failed' | 'blocked',
    content?: string
  ): Promise<void> {
    const check = this.checks.find(c => c.id === checkId);
    if (!check) return;
    
    check.actionTaken = actionTaken;
    
    // 更新目标历史
    this.updateTargetHistory(
      check.targetId,
      check.targetType,
      check.actionType,
      check.deviceId,
      result,
      content,
      check.taskId
    );
  }

  /**
   * 获取适用的规则
   */
  private getApplicableRules(actionType: string, deviceId: string): DuplicationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => {
        // 检查规则是否启用
        if (!rule.enabled) return false;
        
        // 检查动作类型
        if (rule.type !== actionType && rule.type !== 'interaction') return false;
        
        // 检查设备范围
        if (rule.deviceScope.type === 'specific') {
          return rule.deviceScope.devices?.includes(deviceId) || false;
        }
        
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 针对特定规则进行检查
   */
  private checkAgainstRule(
    rule: DuplicationRule,
    targetId: string,
    targetType: string,
    actionType: string,
    deviceId: string,
    targetHistory?: DuplicationHistory
  ): { blocked: boolean; reason: string; confidence: number } {
    if (!targetHistory) {
      return { blocked: false, reason: 'No history found', confidence: 0 };
    }
    
    const timeWindowMs = this.convertTimeWindowToMs(rule.timeWindow);
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    
    // 筛选时间窗口内的操作
    const recentActions = targetHistory.actions.filter(action => 
      new Date(action.timestamp) > cutoffTime
    );
    
    // 检查同一目标的操作次数
    const sameTargetActions = recentActions.filter(action => 
      action.type === actionType
    );
    
    const sameDeviceActions = sameTargetActions.filter(action => 
      action.deviceId === deviceId
    );
    
    // 检查是否超过单目标限制
    if (sameTargetActions.length >= rule.conditions.maxActionsPerTarget) {
      return {
        blocked: true,
        reason: `目标在${this.formatTimeWindow(rule.timeWindow)}内已被操作${sameTargetActions.length}次，超过限制${rule.conditions.maxActionsPerTarget}次`,
        confidence: 95
      };
    }
    
    // 检查是否超过设备限制
    if (sameDeviceActions.length >= rule.conditions.maxActionsPerTarget) {
      return {
        blocked: true,
        reason: `设备在${this.formatTimeWindow(rule.timeWindow)}内已对此目标操作${sameDeviceActions.length}次，超过限制`,
        confidence: 90
      };
    }
    
    // 检查时间窗口内总操作数
    if (recentActions.length >= rule.conditions.maxActionsPerTimeWindow) {
      return {
        blocked: true,
        reason: `${this.formatTimeWindow(rule.timeWindow)}内操作过于频繁，已达到${rule.conditions.maxActionsPerTimeWindow}次限制`,
        confidence: 85
      };
    }
    
    // 检查冷却期
    if (rule.conditions.cooldownPeriod) {
      const lastAction = targetHistory.actions
        .filter(a => a.deviceId === deviceId && a.type === actionType)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
      if (lastAction) {
        const cooldownMs = rule.conditions.cooldownPeriod * 60 * 60 * 1000;
        const timeSinceLastAction = Date.now() - new Date(lastAction.timestamp).getTime();
        
        if (timeSinceLastAction < cooldownMs) {
          const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastAction) / (60 * 1000));
          return {
            blocked: true,
            reason: `冷却期未结束，还需等待${remainingMinutes}分钟`,
            confidence: 100
          };
        }
      }
    }
    
    return { blocked: false, reason: 'Passed all checks', confidence: 0 };
  }

  /**
   * 获取目标历史记录
   */
  private getTargetHistory(targetId: string): DuplicationHistory | undefined {
    return this.history.get(targetId);
  }

  /**
   * 更新目标历史记录
   */
  private updateTargetHistory(
    targetId: string,
    targetType: 'user' | 'comment' | 'video',
    actionType: string,
    deviceId: string,
    result: 'success' | 'failed' | 'blocked',
    content?: string,
    taskId?: string
  ): void {
    let history = this.history.get(targetId);
    
    if (!history) {
      history = {
        id: `history_${targetId}`,
        targetId,
        targetType,
        targetInfo: {
          platform: 'xiaohongshu', // 默认平台
        },
        actions: [],
        totalActions: 0,
        uniqueDevices: 0,
        firstAction: new Date().toISOString(),
        lastAction: new Date().toISOString(),
        riskLevel: 'low',
        riskFactors: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.history.set(targetId, history);
    }
    
    // 添加新操作记录
    const actionRecord = {
      id: `action_${Date.now()}`,
      type: actionType as any,
      deviceId,
      content,
      timestamp: new Date().toISOString(),
      taskId,
      result
    };
    
    history.actions.push(actionRecord);
    history.totalActions = history.actions.length;
    history.lastAction = actionRecord.timestamp;
    history.updatedAt = new Date().toISOString();
    
    // 计算唯一设备数
    const uniqueDeviceIds = new Set(history.actions.map(a => a.deviceId));
    history.uniqueDevices = uniqueDeviceIds.size;
    
    // 评估风险级别
    history.riskLevel = this.assessRiskLevel(history);
    history.riskFactors = this.identifyRiskFactors(history);
    
    // 限制历史记录长度
    if (history.actions.length > 1000) {
      history.actions = history.actions.slice(-500);
    }
  }

  /**
   * 工具方法
   */
  private convertTimeWindowToMs(timeWindow: { value: number; unit: string }): number {
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000
    };
    
    return timeWindow.value * (multipliers[timeWindow.unit as keyof typeof multipliers] || multipliers.hours);
  }

  private formatTimeWindow(timeWindow: { value: number; unit: string }): string {
    const unitMap = {
      minutes: '分钟',
      hours: '小时',
      days: '天',
      weeks: '周'
    };
    
    return `${timeWindow.value}${unitMap[timeWindow.unit as keyof typeof unitMap] || '小时'}`;
  }

  private getPreviousActions(targetId: string, deviceId: string): Array<any> {
    const history = this.history.get(targetId);
    if (!history) return [];
    
    return history.actions
      .filter(action => action.deviceId === deviceId)
      .slice(-10) // 最近10次操作
      .map(action => ({
        actionType: action.type,
        targetId,
        deviceId: action.deviceId,
        timestamp: action.timestamp
      }));
  }

  private assessImpact(rule: DuplicationRule, check: any): 'high' | 'medium' | 'low' {
    if (rule.priority >= 8) return 'high';
    if (rule.priority >= 5) return 'medium';
    return 'low';
  }

  private getRecommendedAction(result: string, rule?: DuplicationRule): string {
    if (result === 'pass') return '继续执行';
    if (result === 'blocked') return '建议跳过或选择其他目标';
    if (result === 'delayed') return '建议稍后重试';
    if (result === 'warning') return '建议人工确认后执行';
    return '请人工处理';
  }

  private assessRiskLevel(history: DuplicationHistory): 'low' | 'medium' | 'high' | 'critical' {
    const recentActions = history.actions.filter(action => 
      new Date(action.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentActions.length > 20) return 'critical';
    if (recentActions.length > 10) return 'high';
    if (recentActions.length > 5) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(history: DuplicationHistory): string[] {
    const factors: string[] = [];
    
    if (history.uniqueDevices > 5) {
      factors.push('多设备频繁操作');
    }
    
    const recentActions = history.actions.filter(action => 
      new Date(action.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    );
    
    if (recentActions.length > 5) {
      factors.push('短时间内操作频繁');
    }
    
    const failedActions = history.actions.filter(action => action.result === 'failed');
    if (failedActions.length / history.totalActions > 0.3) {
      factors.push('失败率过高');
    }
    
    return factors;
  }

  private updateRuleStats(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.stats.totalChecks++;
      rule.stats.lastTriggered = new Date().toISOString();
    }
  }

  private recordEvent(event: Omit<DuplicationEvent, 'id' | 'timestamp' | 'acknowledged'>): void {
    const fullEvent: DuplicationEvent = {
      ...event,
      id: `event_${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.events.push(fullEvent);
    
    // 限制事件数量
    if (this.events.length > 5000) {
      this.events = this.events.slice(-2500);
    }
  }

  // 公共接口方法
  addRule(rule: DuplicationRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<DuplicationRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates, { updatedAt: new Date().toISOString() });
    }
  }

  getRules(): DuplicationRule[] {
    return Array.from(this.rules.values());
  }

  getEvents(limit: number = 100): DuplicationEvent[] {
    return this.events.slice(-limit);
  }

  getHistory(targetId?: string): DuplicationHistory[] {
    if (targetId) {
      const history = this.history.get(targetId);
      return history ? [history] : [];
    }
    return Array.from(this.history.values());
  }

  getChecks(limit: number = 100): DuplicationCheck[] {
    return this.checks.slice(-limit);
  }
}