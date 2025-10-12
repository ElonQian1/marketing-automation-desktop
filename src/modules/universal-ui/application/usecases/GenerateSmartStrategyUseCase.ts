// src/modules/universal-ui/application/usecases/GenerateSmartStrategyUseCase.ts
// module: universal-ui | layer: application | role: usecase
// summary: 聚合多个 provider：legacy > remote > local-llm > heuristic

import type { 
  ElementDescriptor, 
  SmartStrategy, 
  StrategyGenerationOptions,
  SmartMatchVariant 
} from '../../domain/public/selector/StrategyContracts';
import type { StrategyProvider } from '../ports/StrategyProvider';

/**
 * 生成智能策略用例
 * 按优先级依次尝试多个策略提供方，确保总能返回可用策略
 */
export class GenerateSmartStrategyUseCase {
  constructor(private providers: StrategyProvider[]) {
    // 按优先级排序（高到低）
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 执行策略生成
   * @param input 输入参数
   * @param options 生成选项
   * @returns 生成的智能策略（保证不为null）
   */
  async run(
    input: { element: ElementDescriptor },
    options?: StrategyGenerationOptions
  ): Promise<SmartStrategy> {
    const { element } = input;
    const opts = {
      minConfidence: 0.3,
      enableFallback: true,
      timeoutMs: 5000,
      ...options
    };

    console.log('🤖 GenerateSmartStrategyUseCase.run 开始，元素:', element.nodeId);

    // 依次尝试所有提供方
    for (const provider of this.providers) {
      try {
        console.log(`🔍 尝试策略提供方: ${provider.name}`);
        
        // 检查提供方是否可用
        const isAvailable = await Promise.race([
          provider.isAvailable(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('检查超时')), 1000)
          )
        ]);

        if (!isAvailable) {
          console.log(`⚠️ 提供方 ${provider.name} 不可用，跳过`);
          continue;
        }

        // 尝试生成策略
        const strategy = await Promise.race([
          provider.generate(input),
          new Promise<SmartStrategy | null>((_, reject) =>
            setTimeout(() => reject(new Error('生成超时')), opts.timeoutMs)
          )
        ]);

        if (strategy && this.isValidStrategy(strategy, opts)) {
          console.log(`✅ 成功使用提供方 ${provider.name} 生成策略:`, strategy.selector.variant);
          return strategy;
        } else {
          console.log(`❌ 提供方 ${provider.name} 生成策略失败或不符合要求`);
        }
      } catch (error) {
        console.warn(`⚠️ 提供方 ${provider.name} 执行出错:`, error);
        // 继续尝试下一个提供方
      }
    }

    // 所有提供方都失败，生成兜底策略
    console.log('🛡️ 所有提供方都失败，生成兜底策略');
    return this.generateFallbackStrategy(element);
  }

  /**
   * 验证策略是否符合要求
   */
  private isValidStrategy(
    strategy: SmartStrategy, 
    options: StrategyGenerationOptions
  ): boolean {
    // 检查置信度
    if (options.minConfidence && strategy.confidence && strategy.confidence < options.minConfidence) {
      return false;
    }

    // 检查选择器是否有效
    if (!strategy.selector.css && !strategy.selector.xpath) {
      return false;
    }

    // 检查是否有偏好变体限制
    if (options.preferredVariants && options.preferredVariants.length > 0) {
      return options.preferredVariants.includes(strategy.selector.variant);
    }

    return true;
  }

  /**
   * 生成兜底策略（index-fallback）
   * 确保总是能返回可用的策略
   */
  private generateFallbackStrategy(element: ElementDescriptor): SmartStrategy {
    const tagName = element.tagName?.toLowerCase() || 'div';
    const nthChild = element.nthChild ?? 1;
    
    // 生成基于索引的兜底选择器
    const css = `${tagName}:nth-child(${nthChild})`;
    const xpath = element.xpath || `//${tagName}[${nthChild}]`;

    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css,
        xpath,
        score: 0.65,
        rationale: '启发式兜底策略：基于元素标签和位置索引',
        variant: 'index-fallback',
        params: {
          variant: 'index-fallback',
          index: nthChild,
          of: tagName
        }
      },
      confidence: 0.65,
      generatedAt: Date.now()
    };
  }

  /**
   * 获取可用的提供方列表
   */
  async getAvailableProviders(): Promise<StrategyProvider[]> {
    const available: StrategyProvider[] = [];
    
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          available.push(provider);
        }
      } catch (error) {
        console.warn(`检查提供方 ${provider.name} 可用性时出错:`, error);
      }
    }
    
    return available;
  }

  /**
   * 刷新策略（重新生成）
   * @param element 元素描述符
   * @param forceProvider 强制使用特定提供方
   */
  async refresh(
    element: ElementDescriptor, 
    forceProvider?: string
  ): Promise<SmartStrategy> {
    if (forceProvider) {
      const provider = this.providers.find(p => p.name === forceProvider);
      if (provider) {
        try {
          const strategy = await provider.generate({ element });
          if (strategy) {
            return strategy;
          }
        } catch (error) {
          console.warn(`强制使用提供方 ${forceProvider} 失败:`, error);
        }
      }
    }

    // 正常流程重新生成
    return this.run({ element });
  }
}