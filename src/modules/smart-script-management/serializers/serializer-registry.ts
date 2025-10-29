// src/modules/smart-script-management/serializers/serializer-registry.ts
// module: smart-script-management | layer: serializers | role: serializer-registry
// summary: 序列化器注册和管理系统

import { 
  IStepSerializer, 
  SerializerRegistration, 
  ExtendedStepData,
  SerializationContext,
  SerializationResult,
  SerializerConfig
} from '../types/serialization';
import { GenericStepSerializer } from './base-serializer';
import { LoopStartSerializer, LoopEndSerializer } from './loop-serializer';
import { SmartTapSerializer, SmartFindElementSerializer, BasicActionSerializer } from './smart-action-serializer';

/**
 * 序列化器注册中心 - 管理所有序列化器的注册、发现和调用
 */
export class SerializerRegistry {
  private static instance: SerializerRegistry;
  private registrations: Map<string, SerializerRegistration> = new Map();
  private typeToSerializerMap: Map<string, string[]> = new Map();
  private defaultSerializer: IStepSerializer;

  private constructor() {
    this.defaultSerializer = new GenericStepSerializer(['*']);
    this.registerBuiltinSerializers();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SerializerRegistry {
    if (!SerializerRegistry.instance) {
      SerializerRegistry.instance = new SerializerRegistry();
    }
    return SerializerRegistry.instance;
  }

  /**
   * 注册内置序列化器
   */
  private registerBuiltinSerializers(): void {
    console.log('🔧 [SerializerRegistry] 注册内置序列化器...');

    // 注册循环序列化器
    this.register({
      name: 'LoopStartSerializer',
      supportedTypes: ['loop_start', 'loop-start'],
      serializer: new LoopStartSerializer(),
      priority: 100, // 高优先级
      isDefault: false
    });

    this.register({
      name: 'LoopEndSerializer', 
      supportedTypes: ['loop_end', 'loop-end'],
      serializer: new LoopEndSerializer(),
      priority: 100, // 高优先级
      isDefault: false
    });

    // 注册智能操作序列化器
    this.register({
      name: 'SmartTapSerializer',
      supportedTypes: ['smart_tap', 'smart_click'],
      serializer: new SmartTapSerializer(),
      priority: 90,
      isDefault: false
    });

    this.register({
      name: 'SmartFindElementSerializer',
      supportedTypes: ['smart_find_element', 'find_element'],
      serializer: new SmartFindElementSerializer(),
      priority: 90,
      isDefault: false
    });

    // 注册基础操作序列化器
    this.register({
      name: 'BasicActionSerializer',
      supportedTypes: [
        'tap', 'click', 'input', 'type', 'wait', 'delay', 
        'swipe', 'screenshot', 'verify', 'navigation',
        'launch_app', 'start_app', 'recognize_page'
      ],
      serializer: new BasicActionSerializer(),
      priority: 50,
      isDefault: false
    });

    // 注册通用序列化器（作为fallback）
    this.register({
      name: 'GenericStepSerializer',
      supportedTypes: ['*'],
      serializer: this.defaultSerializer,
      priority: 0, // 最低优先级
      isDefault: true
    });

    console.log(`✅ [SerializerRegistry] 已注册 ${this.registrations.size} 个序列化器`);
  }

  /**
   * 注册序列化器
   */
  register(registration: SerializerRegistration): void {
    const { name, supportedTypes, serializer, priority = 50 } = registration;

    // 验证序列化器
    if (!serializer || typeof serializer.serialize !== 'function') {
      throw new Error(`无效的序列化器: ${name}`);
    }

    // 保存注册信息
    this.registrations.set(name, {
      ...registration,
      priority
    });

    // 更新类型映射
    for (const type of supportedTypes) {
      if (!this.typeToSerializerMap.has(type)) {
        this.typeToSerializerMap.set(type, []);
      }
      
      const serializerList = this.typeToSerializerMap.get(type)!;
      serializerList.push(name);
      
      // 按优先级排序（高优先级在前）
      serializerList.sort((a, b) => {
        const regA = this.registrations.get(a)!;
        const regB = this.registrations.get(b)!;
        return regB.priority - regA.priority;
      });
    }

    console.log(`📝 [SerializerRegistry] 已注册序列化器: ${name} (支持类型: ${supportedTypes.join(', ')}, 优先级: ${priority})`);
  }

  /**
   * 取消注册序列化器
   */
  unregister(name: string): boolean {
    const registration = this.registrations.get(name);
    if (!registration) {
      return false;
    }

    // 从类型映射中移除
    for (const type of registration.supportedTypes) {
      const serializerList = this.typeToSerializerMap.get(type);
      if (serializerList) {
        const index = serializerList.indexOf(name);
        if (index > -1) {
          serializerList.splice(index, 1);
        }
        
        // 如果列表为空，删除映射
        if (serializerList.length === 0) {
          this.typeToSerializerMap.delete(type);
        }
      }
    }

    // 删除注册信息
    this.registrations.delete(name);
    console.log(`🗑️ [SerializerRegistry] 已取消注册序列化器: ${name}`);
    return true;
  }

  /**
   * 根据步骤类型查找最适合的序列化器
   */
  findSerializer(stepType: string): IStepSerializer | null {
    // 1. 查找精确匹配的序列化器
    const exactMatches = this.typeToSerializerMap.get(stepType);
    if (exactMatches && exactMatches.length > 0) {
      const registration = this.registrations.get(exactMatches[0]);
      if (registration) {
        console.log(`🎯 [SerializerRegistry] 为类型 '${stepType}' 找到精确匹配序列化器: ${registration.name}`);
        return registration.serializer;
      }
    }

    // 2. 查找通配符序列化器
    const wildcardMatches = this.typeToSerializerMap.get('*');
    if (wildcardMatches && wildcardMatches.length > 0) {
      const registration = this.registrations.get(wildcardMatches[0]);
      if (registration) {
        console.log(`🔍 [SerializerRegistry] 为类型 '${stepType}' 使用通配符序列化器: ${registration.name}`);
        return registration.serializer;
      }
    }

    // 3. 使用默认序列化器
    console.log(`⚠️ [SerializerRegistry] 为类型 '${stepType}' 使用默认序列化器`);
    return this.defaultSerializer;
  }

  /**
   * 根据输入数据查找序列化器
   */
  findSerializerForData(data: ExtendedStepData): IStepSerializer | null {
    const stepType = data.stepType;
    
    // 先尝试精确匹配
    const candidates = this.typeToSerializerMap.get(stepType) || [];
    
    for (const candidateName of candidates) {
      const registration = this.registrations.get(candidateName);
      if (registration && registration.serializer.canHandle(data)) {
        console.log(`✨ [SerializerRegistry] 为数据找到匹配序列化器: ${registration.name} (类型: ${stepType})`);
        return registration.serializer;
      }
    }

    // 回退到通用序列化器
    return this.findSerializer(stepType);
  }

  /**
   * 序列化步骤数据
   */
  serialize(data: ExtendedStepData, context?: SerializationContext): SerializationResult {
    const serializer = this.findSerializerForData(data);
    
    if (!serializer) {
      return {
        data: null,
        success: false,
        error: `未找到适合类型 '${data.stepType}' 的序列化器`,
        warnings: []
      };
    }

    try {
      if (context && 'serializeWithContext' in serializer) {
        return (serializer as any).serializeWithContext(data, context);
      } else {
        const result = serializer.serialize(data, context?.currentIndex);
        return {
          data: result,
          success: true,
          warnings: [],
          metadata: {
            serializerUsed: serializer.constructor.name,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : '序列化失败',
        warnings: []
      };
    }
  }

  /**
   * 反序列化步骤数据
   */
  deserialize(serializedData: any, context?: SerializationContext): SerializationResult<ExtendedStepData> {
    const stepType = serializedData.step_type || serializedData.type;
    const serializer = this.findSerializer(stepType);
    
    if (!serializer) {
      return {
        data: null as any,
        success: false,
        error: `未找到适合类型 '${stepType}' 的序列化器`,
        warnings: []
      };
    }

    try {
      if (context && 'deserializeWithContext' in serializer) {
        return (serializer as any).deserializeWithContext(serializedData, context);
      } else {
        const result = serializer.deserialize(serializedData);
        return {
          data: result,
          success: true,
          warnings: [],
          metadata: {
            serializerUsed: serializer.constructor.name,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : '反序列化失败',
        warnings: []
      };
    }
  }

  /**
   * 获取所有注册的序列化器信息
   */
  getRegistrations(): SerializerRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * 获取支持指定类型的序列化器列表
   */
  getSerializersForType(stepType: string): SerializerRegistration[] {
    const serializerNames = this.typeToSerializerMap.get(stepType) || [];
    return serializerNames
      .map(name => this.registrations.get(name))
      .filter(Boolean) as SerializerRegistration[];
  }

  /**
   * 检查是否支持指定类型
   */
  isTypeSupported(stepType: string): boolean {
    return this.typeToSerializerMap.has(stepType) || this.typeToSerializerMap.has('*');
  }

  /**
   * 获取所有支持的类型
   */
  getSupportedTypes(): string[] {
    return Array.from(this.typeToSerializerMap.keys());
  }

  /**
   * 清空所有注册（主要用于测试）
   */
  clear(): void {
    this.registrations.clear();
    this.typeToSerializerMap.clear();
    console.log('🧹 [SerializerRegistry] 已清空所有注册');
  }

  /**
   * 重置为默认状态
   */
  reset(): void {
    this.clear();
    this.registerBuiltinSerializers();
    console.log('🔄 [SerializerRegistry] 已重置为默认状态');
  }
}

/**
 * 序列化器注册中心的全局实例
 */
export const serializerRegistry = SerializerRegistry.getInstance();

/**
 * 便捷的序列化函数
 */
export function serializeStep(data: ExtendedStepData, context?: SerializationContext): SerializationResult {
  return serializerRegistry.serialize(data, context);
}

/**
 * 便捷的反序列化函数
 */
export function deserializeStep(serializedData: any, context?: SerializationContext): SerializationResult<ExtendedStepData> {
  return serializerRegistry.deserialize(serializedData, context);
}