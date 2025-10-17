// src/types/xml-cache.ts
// module: shared | layer: types | role: type-definition
// summary: XML 缓存元数据类型定义和上下文比对工具

/**
 * 缓存匹配策略配置
 */
export const XML_CACHE_MATCH_CONFIG = {
  /** 时间窗口（秒）：在此窗口内的缓存允许更宽松匹配 */
  RELAXED_TIME_WINDOW: 30,
  /** 严格匹配模式：所有元数据字段必须一致 */
  STRICT_MODE: true,
} as const;

/**
 * XML 设备元数据
 */
export interface XmlDeviceMeta {
  brand?: string;
  model?: string;
  resolution?: { width: number; height: number };
  sdk?: number;
  androidVersion?: string;
}

/**
 * XML 快照元数据
 * 
 * @remarks
 * 所有字段都是可选的，以兼容历史缓存数据
 */
export interface XmlSnapshotMeta {
  appPackage?: string;
  activity?: string;
  url?: string;
  pageSignature?: string;
  capturedAt?: number; // epoch ms
  device?: XmlDeviceMeta;
}

/**
 * XML 快照完整结构
 */
export interface XmlSnapshot {
  id: string;
  hash: string;
  xmlContent?: string; // 可选：完整 XML 内容
  metadata?: XmlSnapshotMeta;
  timestamp?: number;
}

/**
 * 步骤上下文信息（从 ExtendedSmartScriptStep 提取）
 * 
 * @remarks
 * 用于与 XML 快照元数据进行比对，确保同一页面/应用上下文
 */
export interface StepContext {
  appPackage?: string;
  activity?: string;
  url?: string;
  deviceModel?: string;
  resolution?: { width: number; height: number };
  pageSignature?: string;
}

/**
 * 检查时间戳是否在指定窗口内
 * 
 * @param timestamp - 待检查的时间戳（毫秒）
 * @param windowSeconds - 时间窗口大小（秒）
 * @returns 是否在窗口内
 */
export function isWithinTimeWindow(timestamp: number, windowSeconds: number): boolean {
  return Math.abs(Date.now() - timestamp) <= windowSeconds * 1000;
}

/**
 * 检查步骤上下文与 XML 快照是否匹配
 * 
 * @param ctx - 步骤上下文
 * @param snap - XML 快照（可能为 null/undefined）
 * @param options - 匹配选项
 * @returns 是否为同一上下文
 * 
 * @remarks
 * 匹配策略：
 * 1. 严格模式（默认）：所有提供的字段必须一致
 * 2. 宽松模式：在时间窗口内允许部分字段不一致
 * 
 * 优先级：pageSignature > appPackage + activity > url
 */
export function isSameContext(
  ctx: StepContext,
  snap?: XmlSnapshot | null,
  options?: { relaxed?: boolean }
): boolean {
  const m: XmlSnapshotMeta | undefined = snap?.metadata;
  if (!m) return false;

  // 🔒 严格匹配模式
  if (!options?.relaxed) {
    // 页面签名匹配（最高优先级）
    if (ctx.pageSignature && m.pageSignature) {
      return ctx.pageSignature === m.pageSignature;
    }

    // 应用包名 + Activity 匹配
    if (ctx.appPackage && m.appPackage && ctx.appPackage !== m.appPackage) {
      return false;
    }
    if (ctx.activity && m.activity && ctx.activity !== m.activity) {
      return false;
    }

    // Web URL 匹配
    if (ctx.url && m.url && ctx.url !== m.url) {
      return false;
    }

    // 设备型号匹配（可选）
    if (ctx.deviceModel && m.device?.model && ctx.deviceModel !== m.device.model) {
      return false;
    }

    // 分辨率匹配（可选）
    if (ctx.resolution && m.device?.resolution) {
      const a = ctx.resolution;
      const b = m.device.resolution;
      if (a.width !== b.width || a.height !== b.height) {
        return false;
      }
    }

    return true;
  }

  // 🌟 宽松匹配模式：在时间窗口内更宽松
  // 只要核心标识（pageSignature 或 appPackage）匹配即可
  if (ctx.pageSignature && m.pageSignature) {
    return ctx.pageSignature === m.pageSignature;
  }
  
  if (ctx.appPackage && m.appPackage) {
    return ctx.appPackage === m.appPackage;
  }
  
  // 宽松模式下，如果连核心标识都没有，则不匹配
  return false;
}

/**
 * 从步骤数据中提取上下文信息
 * 
 * @param step - 扩展步骤数据
 * @returns 步骤上下文
 * 
 * @remarks
 * 根据项目实际字段结构提取，需要根据 ExtendedSmartScriptStep 的真实定义调整
 */
export function deriveStepContext(step: any): StepContext {
  return {
    // 从 runtime 或 attachInfo 提取应用信息
    appPackage: step.runtime?.app?.packageName ?? step.attachInfo?.app?.packageName,
    activity: step.runtime?.activity,
    url: step.runtime?.web?.url,
    
    // 从 device 提取设备信息
    deviceModel: step.device?.model,
    resolution: step.device?.resolution,
    
    // 从 page 提取页面签名
    pageSignature: step.page?.signature,
  };
}
