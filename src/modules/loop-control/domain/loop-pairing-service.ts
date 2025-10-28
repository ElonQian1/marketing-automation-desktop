// src/modules/loop-control/domain/loop-pairing-service.ts
// module: loop-control | layer: domain | role: service
// summary: 循环配对服务 - 确保循环开始/结束卡片的唯一匹配

import type { SmartScriptStep } from '../../../types/smartScript';

/**
 * 循环配对信息
 */
export interface LoopPair {
  loopId: string;
  startStep: SmartScriptStep;
  endStep: SmartScriptStep;
  startIndex: number;
  endIndex: number;
  isValid: boolean; // 开始在前，结束在后
  needsSwap: boolean; // 需要交换角色
}

/**
 * 循环配对服务
 * 职责：
 * 1. 根据 loop_id 匹配循环开始/结束卡片
 * 2. 检测配对的有效性（位置关系）
 * 3. 处理循环嵌套的歧义
 */
export class LoopPairingService {
  /**
   * 查找所有循环配对
   * @param steps 所有步骤
   * @returns 循环配对列表
   */
  static findAllPairs(steps: SmartScriptStep[]): LoopPair[] {
    const pairs: LoopPair[] = [];
    const loopMap = new Map<string, { start?: { step: SmartScriptStep; index: number }; end?: { step: SmartScriptStep; index: number } }>();

    // 第一遍：收集所有循环步骤
    steps.forEach((step, index) => {
      const loopId = step.parameters?.loop_id as string;
      if (!loopId) return;

      if (step.step_type === 'loop_start') {
        const existing = loopMap.get(loopId) || {};
        loopMap.set(loopId, { ...existing, start: { step, index } });
      } else if (step.step_type === 'loop_end') {
        const existing = loopMap.get(loopId) || {};
        loopMap.set(loopId, { ...existing, end: { step, index } });
      }
    });

    // 第二遍：构建配对信息
    loopMap.forEach((value, loopId) => {
      if (value.start && value.end) {
        const startIndex = value.start.index;
        const endIndex = value.end.index;
        const isValid = startIndex < endIndex;

        pairs.push({
          loopId,
          startStep: value.start.step,
          endStep: value.end.step,
          startIndex,
          endIndex,
          isValid,
          needsSwap: !isValid, // 如果开始在后面，需要交换
        });
      }
    });

    return pairs;
  }

  /**
   * 查找指定 loop_id 的配对
   */
  static findPairByLoopId(steps: SmartScriptStep[], loopId: string): LoopPair | null {
    const pairs = this.findAllPairs(steps);
    return pairs.find(pair => pair.loopId === loopId) || null;
  }

  /**
   * 查找指定步骤所属的配对
   */
  static findPairByStepId(steps: SmartScriptStep[], stepId: string): LoopPair | null {
    const pairs = this.findAllPairs(steps);
    return pairs.find(pair => 
      pair.startStep.id === stepId || pair.endStep.id === stepId
    ) || null;
  }

  /**
   * 检查循环配对的有效性
   * @returns 错误信息数组，空数组表示无错误
   */
  static validatePairs(steps: SmartScriptStep[]): string[] {
    const errors: string[] = [];
    const pairs = this.findAllPairs(steps);

    pairs.forEach(pair => {
      if (!pair.isValid) {
        errors.push(
          `循环 "${pair.startStep.name}" (${pair.loopId}) 位置错误：结束卡片在开始卡片之前`
        );
      }
    });

    // 检查孤立的循环步骤（没有配对）
    steps.forEach((step, index) => {
      if (step.step_type === 'loop_start' || step.step_type === 'loop_end') {
        const loopId = step.parameters?.loop_id as string;
        const pair = pairs.find(p => p.loopId === loopId);
        if (!pair) {
          errors.push(
            `步骤 #${index + 1} "${step.name}" 是孤立的循环${step.step_type === 'loop_start' ? '开始' : '结束'}卡片，缺少配对`
          );
        }
      }
    });

    return errors;
  }

  /**
   * 检查是否存在循环嵌套
   */
  static hasNestedLoops(steps: SmartScriptStep[]): boolean {
    const pairs = this.findAllPairs(steps);
    
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const pair1 = pairs[i];
        const pair2 = pairs[j];
        
        // 检查是否嵌套（pair2 在 pair1 内部）
        if (
          pair2.startIndex > pair1.startIndex &&
          pair2.endIndex < pair1.endIndex
        ) {
          return true;
        }
      }
    }
    
    return false;
  }
}
