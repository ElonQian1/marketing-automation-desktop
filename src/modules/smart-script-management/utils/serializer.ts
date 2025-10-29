// src/modules/smart-script-management/utils/serializer.ts
// module: script-builder | layer: application | role: module-component
// summary: 模块组件

// 智能脚本管理模块 - 步骤序列化工具

import {
  SmartScriptStep,
  StepActionType,
  StepParams,
  ScriptConfig,
} from "../types";

/**
 * 步骤序列化器 - 负责将UI状态转换为可保存的数据结构
 */
export class StepSerializer {
  /**
   * 序列化单个步骤 - 通用版本（原样保存，不做类型转换）
   */
  static serializeStep(step: any, index: number): SmartScriptStep {
    // 🔥 关键修复：严格保持原始 step_type，绝不转换
    const originalStepType = step.step_type || step.type;

    console.log("📝 [StepSerializer] 序列化步骤:", {
      stepId: step.id,
      stepName: step.name,
      originalStepType,
      hasParameters: !!step.parameters,
      parametersKeys: step.parameters ? Object.keys(step.parameters) : [],
    });

    // 🔥 关键修复：保持所有参数原样，完全不处理
    const originalParameters = {
      // 保留所有原始参数，一个不少
      ...(step.parameters || step.params || {}),
      // 只添加缺失的基础字段，不覆盖现有字段
      ...(!(step.parameters || step.params || {}).timeout_ms && {
        timeout_ms: 10000,
      }),
      ...(!(step.parameters || step.params || {}).retry_count && {
        retry_count: 3,
      }),
      ...(!(step.parameters || step.params || {}).screenshot_on_error && {
        screenshot_on_error: true,
      }),
    };

    const baseStep: SmartScriptStep = {
      id: step.id || `step_${Date.now()}_${index}`,
      step_type: originalStepType, // 🔥 严格保持原始类型
      name: step.name || `步骤 ${index + 1}`,
      description: step.description || "",
      parameters: originalParameters, // 🔥 严格保持原始参数
      enabled: step.enabled !== false,
      order: step.order !== undefined ? step.order : index,
      status: step.status || "active",
    };

    // 🔥 关键修复：保存所有顶级字段，特别是循环相关字段
    const preserveFields = [
      "conditions",
      "error_handling",
      "ui_state",
      "loopId",
      "loopLevel",
      "inLoop",
      "parentLoopId",
      "loop_config",
      // 添加更多可能的字段
      "loop_id",
      "loop_name",
      "loop_count",
      "loop_enabled",
    ];

    preserveFields.forEach((field) => {
      if (step[field] !== undefined) {
        (baseStep as any)[field] = step[field];
      }
    });

    // 保存UI状态
    if (step.ui_state) {
      baseStep.ui_state = {
        collapsed: step.ui_state.collapsed || false,
        edited_at: new Date().toISOString(),
        notes: step.ui_state.notes || "",
      };
    }

    console.log("✅ [StepSerializer] 序列化完成:", {
      stepId: baseStep.id,
      stepType: baseStep.step_type,
      parametersCount: Object.keys(baseStep.parameters).length,
    });

    return baseStep;
  }

  /**
   * 序列化步骤数组
   */
  static serializeSteps(steps: any[]): SmartScriptStep[] {
    return steps.map((step, index) => this.serializeStep(step, index));
  }

  /**
   * 反序列化步骤为UI状态
   */
  static deserializeStep(step: SmartScriptStep): any {
    const params = step.parameters as any; // 使用 any 类型以访问额外属性

    return {
      id: step.id,
      step_type: step.step_type,
      type: step.step_type, // 兼容性
      name: step.name,
      description: step.description,
      parameters: step.parameters,
      params: step.parameters, // 兼容性
      enabled: step.enabled,
      order: step.order,
      status: step.status || "active",
      conditions: step.conditions,
      error_handling: step.error_handling,
      ui_state: step.ui_state || { collapsed: false },

      // ✅ 确保所有参数都被正确传递，特别是智能分析数据
      ...params,

      // 显式传递关键字段，防止嵌套丢失
      smartAnalysis: params?.smartAnalysis,
      smartDescription: params?.smartDescription,
      bounds: params?.bounds,
      content_desc: params?.content_desc,
      element_text: params?.element_text,
      element_type: params?.element_type,
      text: params?.text,
    };
  }

  /**
   * 反序列化步骤数组
   */
  static deserializeSteps(steps: SmartScriptStep[]): any[] {
    return steps
      .sort((a, b) => a.order - b.order)
      .map((step) => this.deserializeStep(step));
  }

  /**
   * 标准化步骤类型
   */
  private static normalizeStepType(type: any): StepActionType {
    if (typeof type === "string") {
      const normalizedType = type.toLowerCase().replace(/[-_\s]/g, "_");

      switch (normalizedType) {
        case "tap":
        case "click":
          return StepActionType.TAP;
        case "input":
        case "type":
          return StepActionType.INPUT;
        case "wait":
        case "delay":
          return StepActionType.WAIT;
        case "smart_tap":
        case "smart_click":
          return StepActionType.SMART_TAP;
        case "smart_find_element":
        case "find_element":
          return StepActionType.SMART_FIND_ELEMENT;
        case "recognize_page":
        case "page_recognition":
          return StepActionType.RECOGNIZE_PAGE;
        case "launch_app":
        case "start_app":
          return StepActionType.LAUNCH_APP;
        case "navigation":
        case "navigate":
          return StepActionType.NAVIGATION;
        case "screenshot":
          return StepActionType.SCREENSHOT;
        case "swipe":
          return StepActionType.SWIPE;
        case "verify":
        case "verification":
          return StepActionType.VERIFY;
        case "loop_start":
        case "loop-start":
          return "loop_start" as StepActionType;
        case "loop_end":
        case "loop-end":
          return "loop_end" as StepActionType;
        default:
          console.warn(`Unknown step type: ${type}, defaulting to TAP`);
          return StepActionType.TAP;
      }
    }

    return type as StepActionType;
  }

  /**
   * 序列化步骤参数
   */
  private static serializeParameters(
    params: any,
    stepType: StepActionType | string
  ): StepParams {
    const baseParams = {
      timeout_ms: params.timeout_ms || params.timeout || 10000,
      retry_count: params.retry_count || 3,
      screenshot_on_error: params.screenshot_on_error !== false,
      verification_enabled: params.verification_enabled || false,
      description: params.description || "",
    };

    switch (this.normalizeStepType(stepType)) {
      case StepActionType.TAP:
        return {
          ...baseParams,
          x: params.x || 0,
          y: params.y || 0,
          hold_duration_ms: params.hold_duration_ms || 100,
        };

      case StepActionType.INPUT:
        return {
          ...baseParams,
          x: params.x || 0,
          y: params.y || 0,
          text: params.text || "",
          clear_before_input: params.clear_before_input !== false,
        };

      case StepActionType.WAIT:
        return {
          ...baseParams,
          duration_ms: params.duration_ms || params.duration || 1000,
          wait_for_element: params.wait_for_element,
        };

      case StepActionType.SMART_TAP:
        return {
          ...baseParams,
          element_description:
            params.element_description || params.description || "",
          fallback_coordinates: params.fallback_coordinates || { x: 0, y: 0 },
          search_area: params.search_area,

          // ✅ 保存完整的智能分析数据
          smartAnalysis: params.smartAnalysis,
          smartDescription: params.smartDescription,
          bounds: params.bounds,
          content_desc: params.content_desc,
          element_text: params.element_text,
          element_type: params.element_type,
          text: params.text,

          // 保存所有原始参数，确保不丢失任何信息
          ...params,
        };

      case StepActionType.SMART_FIND_ELEMENT:
        return {
          ...baseParams,
          element_description:
            params.element_description || params.description || "",
          find_multiple: params.find_multiple || false,
          return_coordinates: params.return_coordinates || true,

          // ✅ 保存完整的智能分析数据
          smartAnalysis: params.smartAnalysis,
          smartDescription: params.smartDescription,
          bounds: params.bounds,
          content_desc: params.content_desc,
          element_text: params.element_text,
          element_type: params.element_type,
          text: params.text,

          // 保存所有原始参数，确保不丢失任何信息
          ...params,
        };

      case StepActionType.RECOGNIZE_PAGE:
        return {
          ...baseParams,
          expected_page: params.expected_page || "",
          confidence_threshold: params.confidence_threshold || 0.8,
        };

      case StepActionType.LAUNCH_APP:
        return {
          ...baseParams,
          package_name: params.package_name || params.app_package || "",
          activity_name: params.activity_name,
          wait_for_launch: params.wait_for_launch !== false,
        };

      case StepActionType.NAVIGATION:
        return {
          ...baseParams,
          navigation_type: params.navigation_type || params.nav_type || "",
          target_page: params.target_page || "",
          method: params.method || "click",
        };

      default:
        return baseParams as StepParams;
    }
  }
}

/**
 * 脚本配置序列化器
 */
export class ConfigSerializer {
  /**
   * 序列化脚本配置
   */
  static serializeConfig(config: any): ScriptConfig {
    return {
      // 执行控制
      continue_on_error:
        config.continue_on_error || config.smart_recovery_enabled || true,
      auto_verification_enabled: config.auto_verification_enabled || true,
      smart_recovery_enabled: config.smart_recovery_enabled || true,
      detailed_logging: config.detailed_logging || true,

      // 时间设置
      default_timeout_ms: config.default_timeout_ms || 10000,
      default_retry_count: config.default_retry_count || 3,

      // 功能开关
      page_recognition_enabled: config.page_recognition_enabled !== false,
      screenshot_on_error: config.screenshot_on_error !== false,

      // 高级设置
      parallel_execution: config.parallel_execution || false,
      execution_delay_ms: config.execution_delay_ms || 0,
      device_specific: config.device_specific || false,
    };
  }

  /**
   * 反序列化脚本配置
   */
  static deserializeConfig(config: ScriptConfig): any {
    return {
      // 兼容旧格式
      continue_on_error: config.continue_on_error,
      auto_verification_enabled: config.auto_verification_enabled,
      smart_recovery_enabled: config.smart_recovery_enabled,
      detailed_logging: config.detailed_logging,
      default_timeout_ms: config.default_timeout_ms,
      default_retry_count: config.default_retry_count,
      page_recognition_enabled: config.page_recognition_enabled,
      screenshot_on_error: config.screenshot_on_error,

      // 新字段
      parallel_execution: config.parallel_execution,
      execution_delay_ms: config.execution_delay_ms,
      device_specific: config.device_specific,
    };
  }
}

/**
 * 完整脚本序列化器
 */
export class ScriptSerializer {
  /**
   * 将UI状态序列化为完整脚本
   */
  static serializeScript(
    name: string,
    description: string,
    steps: any[],
    config: any,
    metadata: any = {}
  ): any {
    const currentTime = new Date().toISOString();
    const scriptId = metadata.id || `script_${Date.now()}`;
    // 设备无关：不持久化设备列表（target_devices），仅保留其他元数据
    const { target_devices, ...restMetadata } = metadata || {};

    return {
      id: scriptId,
      name: name || `智能脚本_${new Date().toLocaleString()}`,
      description: description || `包含 ${steps.length} 个步骤的自动化脚本`,
      version: metadata.version || "1.0.0",

      created_at: metadata.created_at || currentTime,
      updated_at: currentTime,
      last_executed_at: metadata.last_executed_at,

      author: metadata.author || "用户",
      category: metadata.category || "通用",
      tags: metadata.tags || ["智能脚本", "自动化"],

      steps: StepSerializer.serializeSteps(steps),
      config: ConfigSerializer.serializeConfig(config),

      metadata: {
        execution_count: metadata.execution_count || 0,
        success_rate: metadata.success_rate || 0,
        average_duration_ms: metadata.average_duration_ms || 0,
        // 设备无关：不写入 target_devices 字段
        dependencies: metadata.dependencies || [],
        ...restMetadata,
      },
    };
  }

  /**
   * 反序列化脚本到UI状态
   */
  static deserializeScript(script: any): {
    steps: any[];
    config: any;
    metadata: any;
  } {
    return {
      steps: StepSerializer.deserializeSteps(script.steps || []),
      config: ConfigSerializer.deserializeConfig(script.config || {}),
      metadata: {
        id: script.id,
        name: script.name,
        description: script.description,
        version: script.version,
        created_at: script.created_at,
        updated_at: script.updated_at,
        last_executed_at: script.last_executed_at,
        author: script.author,
        category: script.category,
        tags: script.tags,
        ...script.metadata,
      },
    };
  }
}
