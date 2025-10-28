// src/modules/loop-control/ui/loop-card-performance-wrapper.tsx
// module: loop-control | layer: ui | role: component
// summary: 循环卡片性能优化包装器 - 使用 React.memo 避免不必要的重渲染

import React, { useMemo, useCallback } from 'react';
import type { LoopConfig } from '../../../types/loopScript';
import type { SmartScriptStep } from '../../../types/smartScript';

export interface LoopCardPerformanceWrapperProps {
  /** 步骤数据 */
  step: SmartScriptStep;
  /** 步骤索引 */
  index: number;
  /** 循环配置 */
  loopConfig?: LoopConfig;
  /** 是否正在拖拽 */
  isDragging?: boolean;
  /** 更新循环配置 */
  onLoopConfigUpdate: (config: LoopConfig) => void;
  /** 删除循环 */
  onDeleteLoop: (loopId: string) => void;
  /** 渲染函数 */
  children: (props: {
    step: SmartScriptStep;
    index: number;
    loopConfig?: LoopConfig;
    isDragging?: boolean;
    onLoopConfigUpdate: (config: LoopConfig) => void;
    onDeleteLoop: (loopId: string) => void;
  }) => React.ReactNode;
}

/**
 * 循环卡片性能优化包装器
 * 
 * 优化策略：
 * 1. 使用 React.memo 避免不必要的重渲染
 * 2. 使用 useMemo 缓存计算结果
 * 3. 使用 useCallback 稳定回调函数引用
 * 4. 拖拽状态与数据状态分离
 * 
 * @example
 * ```tsx
 * <LoopCardPerformanceWrapper
 *   step={step}
 *   index={index}
 *   loopConfig={loopConfig}
 *   isDragging={isDragging}
 *   onLoopConfigUpdate={handleUpdate}
 *   onDeleteLoop={handleDelete}
 * >
 *   {(props) => <LoopStartCard {...props} />}
 * </LoopCardPerformanceWrapper>
 * ```
 */
const LoopCardPerformanceWrapperComponent: React.FC<LoopCardPerformanceWrapperProps> = ({
  step,
  index,
  loopConfig,
  isDragging,
  onLoopConfigUpdate,
  onDeleteLoop,
  children,
}) => {
  // 🎯 性能优化：缓存 loopConfig 计算
  const memoizedLoopConfig = useMemo(() => {
    return loopConfig || {
      loopId: (step.parameters?.loop_id as string) || `loop_${step.id}`,
      name: (step.parameters?.loop_name as string) || step.name,
      iterations: (step.parameters?.loop_count as number) || 1,
      enabled: step.enabled,
    };
  }, [loopConfig, step.parameters?.loop_id, step.parameters?.loop_name, step.parameters?.loop_count, step.enabled, step.id, step.name]);

  // 🎯 性能优化：稳定回调函数引用
  const handleLoopConfigUpdate = useCallback(
    (config: LoopConfig) => {
      onLoopConfigUpdate(config);
    },
    [onLoopConfigUpdate]
  );

  const handleDeleteLoop = useCallback(
    (loopId: string) => {
      onDeleteLoop(loopId);
    },
    [onDeleteLoop]
  );

  return (
    <>
      {children({
        step,
        index,
        loopConfig: memoizedLoopConfig,
        isDragging,
        onLoopConfigUpdate: handleLoopConfigUpdate,
        onDeleteLoop: handleDeleteLoop,
      })}
    </>
  );
};

/**
 * 性能优化的比较函数
 * 只在关键 props 变化时才重新渲染
 */
const arePropsEqual = (
  prev: LoopCardPerformanceWrapperProps,
  next: LoopCardPerformanceWrapperProps
): boolean => {
  // 拖拽状态变化时总是重新渲染（视觉反馈）
  if (prev.isDragging !== next.isDragging) {
    return false;
  }

  // 步骤 ID 变化时重新渲染
  if (prev.step.id !== next.step.id) {
    return false;
  }

  // 索引变化时重新渲染（位置变化）
  if (prev.index !== next.index) {
    return false;
  }

  // 循环配置的关键字段变化时重新渲染
  const prevLoopConfig = prev.loopConfig;
  const nextLoopConfig = next.loopConfig;
  const prevParams = prev.step.parameters;
  const nextParams = next.step.parameters;

  // 比较循环次数
  const prevIterations = prevLoopConfig?.iterations || (prevParams?.loop_count as number);
  const nextIterations = nextLoopConfig?.iterations || (nextParams?.loop_count as number);
  
  // 比较循环名称
  const prevName = prevLoopConfig?.name || (prevParams?.loop_name as string);
  const nextName = nextLoopConfig?.name || (nextParams?.loop_name as string);

  if (
    prevIterations !== nextIterations ||
    prevName !== nextName ||
    prev.step.enabled !== next.step.enabled
  ) {
    return false;
  }

  // 其他情况跳过重新渲染
  return true;
};

/**
 * 使用 React.memo 包装组件
 */
export const LoopCardPerformanceWrapper = React.memo(
  LoopCardPerformanceWrapperComponent,
  arePropsEqual
);

/**
 * 使用示例：
 * 
 * ```tsx
 * // 在父组件中使用
 * const ParentComponent = () => {
 *   const [steps, setSteps] = useState<SmartScriptStep[]>([]);
 * 
 *   // 🎯 使用 useCallback 稳定回调
 *   const handleLoopConfigUpdate = useCallback((config: LoopConfig) => {
 *     // 更新步骤...
 *   }, []);
 * 
 *   const handleDeleteLoop = useCallback((loopId: string) => {
 *     // 删除循环...
 *   }, []);
 * 
 *   return (
 *     <>
 *       {steps.map((step, index) => (
 *         <LoopCardPerformanceWrapper
 *           key={step.id}
 *           step={step}
 *           index={index}
 *           onLoopConfigUpdate={handleLoopConfigUpdate}
 *           onDeleteLoop={handleDeleteLoop}
 *         >
 *           {(props) => (
 *             step.step_type === 'loop_start' 
 *               ? <LoopStartCard {...props} />
 *               : <LoopEndCard {...props} />
 *           )}
 *         </LoopCardPerformanceWrapper>
 *       ))}
 *     </>
 *   );
 * };
 * ```
 */
