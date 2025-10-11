// src/pages/precise-acquisition/modules/duplication-protection/DuplicationRuleManager.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 查重规则管理器
 */

import type { DuplicationRule } from "./types";

export class DuplicationRuleManager {
  private rules: Map<string, DuplicationRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 创建新规则
   */
  createRule(config: Partial<DuplicationRule>): DuplicationRule {
    const rule: DuplicationRule = {
      id: config.id || `rule_${Date.now()}`,
      name: config.name || "未命名规则",
      description: config.description || "",
      type: config.type || "follow",
      enabled: config.enabled !== false,
      priority: config.priority || 5,

      timeWindow: config.timeWindow || {
        value: 24,
        unit: "hours",
      },

      deviceScope: config.deviceScope || {
        type: "all",
      },

      conditions: {
        maxActionsPerTarget: 1,
        maxActionsPerTimeWindow: 10,
        checkUserLevel: true,
        respectPlatformLimits: true,
        ...config.conditions,
      },

      actions: {
        onDuplicationDetected: "block",
        warningMessage: "检测到重复操作，已自动阻止",
        fallbackStrategy: "skip",
        ...config.actions,
      },

      stats: {
        totalChecks: 0,
        duplicationsDetected: 0,
        actionsBlocked: 0,
      },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
    };

    this.rules.set(rule.id, rule);
    return rule;
  }

  /**
   * 更新规则
   */
  updateRule(
    ruleId: string,
    updates: Partial<DuplicationRule>
  ): DuplicationRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    Object.assign(rule, updates, {
      updatedAt: new Date().toISOString(),
    });

    return rule;
  }

  /**
   * 删除规则
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * 获取所有规则
   */
  getAllRules(): DuplicationRule[] {
    return Array.from(this.rules.values()).sort(
      (a, b) => b.priority - a.priority
    );
  }

  /**
   * 获取特定规则
   */
  getRule(ruleId: string): DuplicationRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * 启用/禁用规则
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      rule.updatedAt = new Date().toISOString();
    }
  }

  /**
   * 获取规则模板
   */
  getRuleTemplates(): Array<Partial<DuplicationRule>> {
    return [
      {
        name: "基础关注查重",
        description: "防止24小时内重复关注同一用户",
        type: "follow",
        priority: 8,
        timeWindow: { value: 24, unit: "hours" },
        conditions: {
          maxActionsPerTarget: 1,
          maxActionsPerTimeWindow: 50,
          cooldownPeriod: 24,
        },
        actions: {
          onDuplicationDetected: "block",
          warningMessage: "24小时内已关注过此用户",
        },
      },
      {
        name: "回复防重复",
        description: "防止重复回复同一条评论",
        type: "reply",
        priority: 9,
        timeWindow: { value: 7, unit: "days" },
        conditions: {
          maxActionsPerTarget: 1,
          maxActionsPerTimeWindow: 100,
          checkContentSimilarity: true,
        },
        actions: {
          onDuplicationDetected: "block",
          warningMessage: "已回复过此评论",
        },
      },
      {
        name: "频率限制",
        description: "限制设备操作频率",
        type: "interaction",
        priority: 6,
        timeWindow: { value: 1, unit: "hours" },
        conditions: {
          maxActionsPerTarget: 5,
          maxActionsPerTimeWindow: 30,
          respectPlatformLimits: true,
        },
        actions: {
          onDuplicationDetected: "delay",
          delayMinutes: 30,
          warningMessage: "操作过于频繁，延迟执行",
        },
      },
      {
        name: "冷却期保护",
        description: "强制操作间隔冷却期",
        type: "interaction",
        priority: 7,
        timeWindow: { value: 6, unit: "hours" },
        conditions: {
          maxActionsPerTarget: 3,
          cooldownPeriod: 2,
          maxActionsPerTimeWindow: 20,
        },
        actions: {
          onDuplicationDetected: "delay",
          delayMinutes: 120,
          warningMessage: "冷却期未结束",
        },
      },
    ];
  }

  /**
   * 验证规则配置
   */
  validateRule(rule: Partial<DuplicationRule>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!rule.name || rule.name.trim().length === 0) {
      errors.push("规则名称不能为空");
    }

    if (!rule.type || !["follow", "reply", "interaction"].includes(rule.type)) {
      errors.push("规则类型无效");
    }

    if (
      rule.priority !== undefined &&
      (rule.priority < 1 || rule.priority > 10)
    ) {
      errors.push("优先级必须在1-10之间");
    }

    if (rule.timeWindow) {
      if (!rule.timeWindow.value || rule.timeWindow.value <= 0) {
        errors.push("时间窗口值必须大于0");
      }
      if (
        !["minutes", "hours", "days", "weeks"].includes(rule.timeWindow.unit)
      ) {
        errors.push("时间单位无效");
      }
    }

    if (rule.conditions) {
      if (
        rule.conditions.maxActionsPerTarget !== undefined &&
        rule.conditions.maxActionsPerTarget < 1
      ) {
        errors.push("每目标最大操作次数必须≥1");
      }
      if (
        rule.conditions.maxActionsPerTimeWindow !== undefined &&
        rule.conditions.maxActionsPerTimeWindow < 1
      ) {
        errors.push("时间窗口内最大操作次数必须≥1");
      }
      if (
        rule.conditions.cooldownPeriod !== undefined &&
        rule.conditions.cooldownPeriod < 0
      ) {
        errors.push("冷却期不能为负数");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 导入规则
   */
  importRules(rules: DuplicationRule[]): {
    imported: number;
    errors: string[];
  } {
    let imported = 0;
    const errors: string[] = [];

    for (const rule of rules) {
      const validation = this.validateRule(rule);
      if (validation.valid) {
        this.rules.set(rule.id, rule);
        imported++;
      } else {
        errors.push(`规则 "${rule.name}": ${validation.errors.join(", ")}`);
      }
    }

    return { imported, errors };
  }

  /**
   * 导出规则
   */
  exportRules(): DuplicationRule[] {
    return this.getAllRules();
  }

  /**
   * 获取规则统计
   */
  getRuleStats(): {
    totalRules: number;
    enabledRules: number;
    rulesByType: Record<string, number>;
    rulesByPriority: Record<string, number>;
  } {
    const rules = this.getAllRules();

    return {
      totalRules: rules.length,
      enabledRules: rules.filter((r) => r.enabled).length,
      rulesByType: this.groupBy(rules, "type"),
      rulesByPriority: this.groupBy(rules, (r) => {
        if (r.priority >= 8) return "high";
        if (r.priority >= 5) return "medium";
        return "low";
      }),
    };
  }

  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    const defaultRules = this.getRuleTemplates();

    defaultRules.forEach((template, index) => {
      const rule = this.createRule({
        ...template,
        id: `default_${template.type}_${index}`,
        createdBy: "system",
      });
    });
  }

  /**
   * 工具方法：分组统计
   */
  private groupBy<T>(
    array: T[],
    keySelector: string | ((item: T) => string)
  ): Record<string, number> {
    const groups: Record<string, number> = {};

    for (const item of array) {
      const key =
        typeof keySelector === "string"
          ? (item as any)[keySelector]
          : keySelector(item);

      groups[key] = (groups[key] || 0) + 1;
    }

    return groups;
  }

  /**
   * 智能规则推荐
   */
  suggestRules(context: {
    deviceCount: number;
    avgDailyActions: number;
    platformLimits: Record<string, number>;
    riskTolerance: "low" | "medium" | "high";
  }): Array<Partial<DuplicationRule>> {
    const suggestions: Array<Partial<DuplicationRule>> = [];

    // 基于设备数量的建议
    if (context.deviceCount > 5) {
      suggestions.push({
        name: "多设备协调保护",
        description: "防止多设备同时操作同一目标",
        type: "interaction",
        priority: 8,
        conditions: {
          maxActionsPerTarget: Math.max(1, Math.floor(context.deviceCount / 3)),
          maxActionsPerTimeWindow: context.deviceCount * 5,
        },
      });
    }

    // 基于日均操作量的建议
    if (context.avgDailyActions > 100) {
      suggestions.push({
        name: "高频操作限制",
        description: "限制高频操作避免触发平台限制",
        type: "interaction",
        priority: 7,
        timeWindow: { value: 1, unit: "hours" },
        conditions: {
          maxActionsPerTarget: 3, // 添加缺失的必需属性
          maxActionsPerTimeWindow: Math.floor(context.avgDailyActions / 20),
          respectPlatformLimits: true,
        },
        actions: {
          onDuplicationDetected: "delay",
          delayMinutes: 60,
        },
      });
    }

    // 基于风险容忍度的建议
    if (context.riskTolerance === "low") {
      suggestions.push({
        name: "保守操作策略",
        description: "保守的操作频率限制",
        type: "interaction",
        priority: 9,
        conditions: {
          maxActionsPerTarget: 1,
          cooldownPeriod: 6,
          maxActionsPerTimeWindow: 10,
        },
      });
    }

    return suggestions;
  }
}
