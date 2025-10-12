// src/modules/universal-ui/application/ports/StrategyProvider.ts
// module: universal-ui | layer: application | role: port
// summary: 智能策略提供方的端口接口（由 infrastructure 实现）

import type { ElementDescriptor, SmartStrategy } from '../../domain/public/selector/StrategyContracts';

/**
 * 策略提供方端口接口
 * 定义智能策略生成的标准接口，由具体适配器实现
 */
export interface StrategyProvider {
  /**
   * 根据元素描述符生成智能策略
   * @param input 包含元素信息的输入参数
   * @returns 生成的智能策略，无法生成时返回null
   */
  generate(input: { element: ElementDescriptor }): Promise<SmartStrategy | null>;

  /**
   * 提供方名称（用于调试和日志）
   */
  readonly name: string;

  /**
   * 提供方优先级（数值越高优先级越高）
   */
  readonly priority: number;

  /**
   * 是否可用（可用于运行时检查）
   */
  isAvailable(): Promise<boolean>;
}

/**
 * 策略提供方注册表接口
 * 用于管理多个策略提供方
 */
export interface StrategyProviderRegistry {
  /**
   * 注册策略提供方
   */
  register(provider: StrategyProvider): void;

  /**
   * 获取所有可用的提供方（按优先级排序）
   */
  getProviders(): StrategyProvider[];

  /**
   * 按名称获取特定提供方
   */
  getProvider(name: string): StrategyProvider | null;
}