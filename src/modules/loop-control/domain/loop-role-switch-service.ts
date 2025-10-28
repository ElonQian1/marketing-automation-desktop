// src/modules/loop-control/domain/loop-role-switch-service.ts
// module: loop-control | layer: domain | role: service
// summary: 循环角色切换服务 - 根据位置自动切换开始/结束角色

import type { SmartScriptStep } from '../../../types/smartScript';
import { LoopPairingService, type LoopPair } from './loop-pairing-service';

/**
 * 角色切换结果
 */
export interface RoleSwitchResult {
  needsSwitch: boolean;
  switchedSteps: Array<{
    stepId: string;
    oldType: string;
    newType: string;
  }>;
  updatedSteps: SmartScriptStep[];
}

/**
 * 循环角色切换服务
 * 职责：
 * 1. 检测拖拽后的位置关系
 * 2. 自动切换 step_type（loop_start ↔ loop_end）
 * 3. 确保循环配对的正确性
 */
export class LoopRoleSwitchService {
  /**
   * 检测并执行自动角色切换
   * @param steps 当前所有步骤
   * @returns 切换结果
   */
  static autoSwitchRoles(steps: SmartScriptStep[]): RoleSwitchResult {
    const pairs = LoopPairingService.findAllPairs(steps);
    const switchedSteps: Array<{ stepId: string; oldType: string; newType: string }> = [];
    const updatedSteps = [...steps];

    pairs.forEach(pair => {
      if (pair.needsSwap) {
        // 找到需要交换的两个步骤
        const startStepIndex = updatedSteps.findIndex(s => s.id === pair.startStep.id);
        const endStepIndex = updatedSteps.findIndex(s => s.id === pair.endStep.id);

        if (startStepIndex !== -1 && endStepIndex !== -1) {
          // 交换 step_type
          const oldStartType = updatedSteps[startStepIndex].step_type;
          const oldEndType = updatedSteps[endStepIndex].step_type;

          updatedSteps[startStepIndex] = {
            ...updatedSteps[startStepIndex],
            step_type: 'loop_end',
          };

          updatedSteps[endStepIndex] = {
            ...updatedSteps[endStepIndex],
            step_type: 'loop_start',
          };

          switchedSteps.push(
            {
              stepId: pair.startStep.id,
              oldType: oldStartType,
              newType: 'loop_end',
            },
            {
              stepId: pair.endStep.id,
              oldType: oldEndType,
              newType: 'loop_start',
            }
          );
        }
      }
    });

    return {
      needsSwitch: switchedSteps.length > 0,
      switchedSteps,
      updatedSteps,
    };
  }

  /**
   * 检测指定循环配对是否需要切换
   */
  static needsSwitchForPair(pair: LoopPair): boolean {
    return pair.needsSwap;
  }

  /**
   * 手动切换指定配对的角色
   */
  static switchPairRoles(steps: SmartScriptStep[], loopId: string): SmartScriptStep[] {
    const pair = LoopPairingService.findPairByLoopId(steps, loopId);
    if (!pair) {
      console.warn(`[LoopRoleSwitchService] 未找到 loop_id=${loopId} 的配对`);
      return steps;
    }

    const updatedSteps = [...steps];
    const startIndex = updatedSteps.findIndex(s => s.id === pair.startStep.id);
    const endIndex = updatedSteps.findIndex(s => s.id === pair.endStep.id);

    if (startIndex !== -1 && endIndex !== -1) {
      // 交换 step_type
      updatedSteps[startIndex] = {
        ...updatedSteps[startIndex],
        step_type: 'loop_end',
      };

      updatedSteps[endIndex] = {
        ...updatedSteps[endIndex],
        step_type: 'loop_start',
      };
    }

    return updatedSteps;
  }

  /**
   * 验证角色切换后的步骤是否有效
   */
  static validateAfterSwitch(steps: SmartScriptStep[]): boolean {
    const errors = LoopPairingService.validatePairs(steps);
    return errors.length === 0;
  }
}
