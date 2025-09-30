/**
 * 步骤管理 Hook
 * 专门处理脚本步骤的验证、模板、拖拽等功能
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  ScriptStep,
  StepTemplate,
  StepValidation,
  DragOperation,
  StepType,
  TapStepParameters,
  InputStepParameters,
  SwipeStepParameters,
  WaitStepParameters,
  LoopStepParameters,
} from '../types';

/**
 * 步骤模板数据
 */
const STEP_TEMPLATES: StepTemplate[] = [
  {
    id: 'tap-basic',
    name: '基础点击',
    description: '点击指定元素',
    type: 'tap',
    category: '交互',
    isCommon: true,
    icon: 'TouchOutlined',
    parameters: {
      matching: {
        strategy: 'standard',
        fields: ['resource-id'],
        values: {},
      },
      delay: 1000,
      retries: 3,
      timeout: 10000,
    } as TapStepParameters,
  },
  {
    id: 'input-text',
    name: '文本输入',
    description: '在输入框中输入文本',
    type: 'input',
    category: '交互',
    isCommon: true,
    icon: 'EditOutlined',
    parameters: {
      text: '',
      clearFirst: true,
      inputMethod: 'type',
      hidden: false,
      matching: {
        strategy: 'standard',
        fields: ['resource-id'],
        values: {},
      },
      delay: 1000,
    } as InputStepParameters,
  },
  {
    id: 'swipe-vertical',
    name: '垂直滑动',
    description: '向上或向下滑动屏幕',
    type: 'swipe',
    category: '导航',
    isCommon: true,
    icon: 'SwapOutlined',
    parameters: {
      direction: 'down',
      distance: 500,
      duration: 1000,
      velocity: 'normal',
      delay: 1000,
    } as SwipeStepParameters,
  },
  {
    id: 'wait-time',
    name: '等待时间',
    description: '等待指定时间',
    type: 'wait',
    category: '控制',
    isCommon: true,
    icon: 'ClockCircleOutlined',
    parameters: {
      duration: 3000,
      delay: 0,
    } as WaitStepParameters,
  },
  {
    id: 'wait-element',
    name: '等待元素',
    description: '等待元素出现或消失',
    type: 'wait',
    category: '控制',
    isCommon: false,
    icon: 'EyeOutlined',
    parameters: {
      duration: 10000,
      condition: {
        type: 'element_visible',
        timeout: 10000,
      },
      matching: {
        strategy: 'standard',
        fields: ['resource-id'],
        values: {},
      },
      delay: 1000,
    } as WaitStepParameters,
  },
  {
    id: 'loop-basic',
    name: '简单循环',
    description: '重复执行指定次数',
    type: 'loop',
    category: '控制',
    isCommon: false,
    icon: 'ReloadOutlined',
    parameters: {
      iterations: 3,
      interval: 1000,
      delay: 1000,
    } as LoopStepParameters,
  },
  {
    id: 'screenshot',
    name: '截图',
    description: '保存当前屏幕截图',
    type: 'screenshot',
    category: '调试',
    isCommon: false,
    icon: 'CameraOutlined',
    parameters: {
      delay: 1000,
    },
  },
];

/**
 * 步骤验证规则
 */
const validateStep = (step: ScriptStep): StepValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 基础验证
  if (!step.name || step.name.trim() === '') {
    errors.push('步骤名称不能为空');
  }

  if (step.parameters.delay !== undefined && step.parameters.delay < 0) {
    errors.push('延迟时间不能为负数');
  }

  if (step.parameters.retries !== undefined && step.parameters.retries < 0) {
    errors.push('重试次数不能为负数');
  }

  if (step.parameters.timeout !== undefined && step.parameters.timeout <= 0) {
    errors.push('超时时间必须大于0');
  }

  // 特定类型验证
  switch (step.type) {
    case 'tap':
      const tapParams = step.parameters as TapStepParameters;
      if (!tapParams.matching && !tapParams.coordinates) {
        errors.push('点击步骤必须设置匹配条件或坐标');
      }
      if (tapParams.holdDuration !== undefined && tapParams.holdDuration < 0) {
        errors.push('按住时间不能为负数');
      }
      break;

    case 'input':
      const inputParams = step.parameters as InputStepParameters;
      if (!inputParams.text || inputParams.text.trim() === '') {
        errors.push('输入文本不能为空');
      }
      if (!inputParams.matching) {
        errors.push('输入步骤必须设置匹配条件');
      }
      break;

    case 'swipe':
      const swipeParams = step.parameters as SwipeStepParameters;
      if (!swipeParams.startCoordinates && !swipeParams.direction) {
        errors.push('滑动步骤必须设置起始坐标或滑动方向');
      }
      if (swipeParams.distance !== undefined && swipeParams.distance <= 0) {
        errors.push('滑动距离必须大于0');
      }
      if (swipeParams.duration !== undefined && swipeParams.duration <= 0) {
        errors.push('滑动持续时间必须大于0');
      }
      break;

    case 'wait':
      const waitParams = step.parameters as WaitStepParameters;
      if (waitParams.duration <= 0) {
        errors.push('等待时间必须大于0');
      }
      if (waitParams.condition?.type === 'element_visible' && !waitParams.matching) {
        errors.push('等待元素步骤必须设置匹配条件');
      }
      if (waitParams.duration > 60000) {
        warnings.push('等待时间超过60秒，可能会影响执行效率');
      }
      break;

    case 'loop':
      const loopParams = step.parameters as LoopStepParameters;
      if (loopParams.iterations !== undefined && loopParams.iterations <= 0) {
        errors.push('循环次数必须大于0');
      }
      if (loopParams.iterations !== undefined && loopParams.iterations > 100) {
        warnings.push('循环次数超过100次，请确认是否必要');
      }
      break;
  }

  // 性能建议
  if (step.parameters.delay !== undefined && step.parameters.delay < 500) {
    suggestions.push('建议延迟时间不少于500ms以确保稳定性');
  }

  if (step.parameters.retries !== undefined && step.parameters.retries > 5) {
    suggestions.push('过多的重试次数可能会延长执行时间');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
};

/**
 * 步骤管理 Hook
 */
export const useStepManagement = () => {
  // 拖拽状态
  const [dragOperation, setDragOperation] = useState<DragOperation | null>(null);

  // 获取步骤模板
  const getStepTemplates = useCallback((category?: string, onlyCommon?: boolean) => {
    let filtered = STEP_TEMPLATES;
    
    if (category) {
      filtered = filtered.filter(template => template.category === category);
    }
    
    if (onlyCommon) {
      filtered = filtered.filter(template => template.isCommon);
    }
    
    return filtered;
  }, []);

  // 获取模板分类
  const getTemplateCategories = useCallback(() => {
    const categories = new Set(STEP_TEMPLATES.map(template => template.category));
    return Array.from(categories);
  }, []);

  // 从模板创建步骤
  const createStepFromTemplate = useCallback((templateId: string, order: number): ScriptStep => {
    const template = STEP_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`);
    }

    return {
      id: Date.now().toString(),
      type: template.type,
      name: template.name,
      description: template.description,
      parameters: { ...template.parameters },
      status: 'pending',
      enabled: true,
      order,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  // 验证步骤
  const validateStepData = useCallback((step: ScriptStep): StepValidation => {
    return validateStep(step);
  }, []);

  // 批量验证步骤
  const validateSteps = useCallback((steps: ScriptStep[]): Map<string, StepValidation> => {
    const results = new Map<string, StepValidation>();
    
    steps.forEach(step => {
      const validation = validateStep(step);
      results.set(step.id, validation);
    });
    
    return results;
  }, []);

  // 开始拖拽
  const startDrag = useCallback((
    type: DragOperation['type'],
    data: ScriptStep | StepTemplate,
    sourceIndex: number
  ) => {
    setDragOperation({
      type,
      data,
      sourceIndex,
      isDragging: true,
    });
  }, []);

  // 拖拽移动
  const updateDrag = useCallback((targetIndex: number) => {
    setDragOperation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        targetIndex,
      };
    });
  }, []);

  // 结束拖拽
  const endDrag = useCallback(() => {
    const operation = dragOperation;
    setDragOperation(null);
    return operation;
  }, [dragOperation]);

  // 取消拖拽
  const cancelDrag = useCallback(() => {
    setDragOperation(null);
  }, []);

  // 检查步骤是否可以移动
  const canMoveStep = useCallback((
    step: ScriptStep,
    fromIndex: number,
    toIndex: number,
    steps: ScriptStep[]
  ): boolean => {
    // 基础边界检查
    if (toIndex < 0 || toIndex >= steps.length) {
      return false;
    }

    // 不能移动到自己的位置
    if (fromIndex === toIndex) {
      return false;
    }

    // 循环步骤的特殊规则
    if (step.type === 'loop') {
      // 循环步骤不能嵌套
      const targetStep = steps[toIndex];
      if (targetStep?.type === 'loop') {
        return false;
      }
    }

    return true;
  }, []);

  // 获取步骤依赖关系
  const getStepDependencies = useCallback((step: ScriptStep, allSteps: ScriptStep[]) => {
    const dependencies: string[] = [];
    
    // 检查是否依赖其他步骤的结果
    if (step.parameters.matching?.fields?.includes('previous-result')) {
      // 查找前面的步骤
      const currentIndex = allSteps.findIndex(s => s.id === step.id);
      const previousSteps = allSteps.slice(0, currentIndex);
      
      previousSteps.forEach(prevStep => {
        if (prevStep.type === 'screenshot' || prevStep.type === 'custom') {
          dependencies.push(prevStep.id);
        }
      });
    }
    
    return dependencies;
  }, []);

  // 计算步骤统计信息
  const getStepStatistics = useMemo(() => {
    return (steps: ScriptStep[]) => {
      const stats = {
        total: steps.length,
        byType: {} as Record<StepType, number>,
        byStatus: {} as Record<string, number>,
        enabled: 0,
        disabled: 0,
        avgDelay: 0,
        totalEstimatedTime: 0,
      };

      let totalDelay = 0;
      let delayCount = 0;

      steps.forEach(step => {
        // 按类型统计
        stats.byType[step.type] = (stats.byType[step.type] || 0) + 1;
        
        // 按状态统计
        stats.byStatus[step.status] = (stats.byStatus[step.status] || 0) + 1;
        
        // 启用/禁用统计
        if (step.enabled) {
          stats.enabled++;
        } else {
          stats.disabled++;
        }
        
        // 延迟统计
        if (step.parameters.delay) {
          totalDelay += step.parameters.delay;
          delayCount++;
        }
        
        // 估算执行时间
        const stepTime = step.parameters.delay || 1000;
        const retryTime = (step.parameters.retries || 0) * stepTime * 0.5; // 假设50%的重试概率
        stats.totalEstimatedTime += stepTime + retryTime;
      });

      stats.avgDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;

      return stats;
    };
  }, []);

  return {
    // 模板管理
    getStepTemplates,
    getTemplateCategories,
    createStepFromTemplate,
    
    // 验证功能
    validateStepData,
    validateSteps,
    
    // 拖拽功能
    dragOperation,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    
    // 移动和依赖
    canMoveStep,
    getStepDependencies,
    
    // 统计信息
    getStepStatistics,
  };
};