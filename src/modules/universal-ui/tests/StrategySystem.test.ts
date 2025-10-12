// src/modules/universal-ui/tests/StrategySystem.test.ts
// module: universal-ui | layer: test | role: unit-test
// summary: 策略系统核心功能单元测试

import { describe, it, expect, beforeEach } from 'vitest';
import type { ElementDescriptor, SmartStrategy, ManualStrategy } from '../domain/public/selector/StrategyContracts';
import { GenerateSmartStrategyUseCase } from '../application/usecases/GenerateSmartStrategyUseCase';
import { HeuristicProvider } from '../infrastructure/adapters/HeuristicProvider';
import { LegacyManualAdapter } from '../application/compat/LegacyManualAdapter';

/**
 * 测试用的模拟元素描述符
 */
const mockElement: ElementDescriptor = {
  nodeId: 'test-button',
  tagName: 'Button',
  text: '确认',
  xpath: '//android.widget.Button[@text="确认"]',
  cssPath: 'button[text="确认"]',
  resourceId: 'com.app:id/confirm_btn',
  clickable: true,
  attributes: {
    'class': 'android.widget.Button',
    'text': '确认',
    'clickable': 'true'
  }
};

describe('StrategySystem', () => {
  let useCase: GenerateSmartStrategyUseCase;
  let heuristicProvider: HeuristicProvider;
  let legacyAdapter: LegacyManualAdapter;

  beforeEach(() => {
    heuristicProvider = new HeuristicProvider();
    useCase = new GenerateSmartStrategyUseCase([heuristicProvider]);
    legacyAdapter = new LegacyManualAdapter();
  });

  describe('GenerateSmartStrategyUseCase', () => {
    it('应该能够生成智能策略', async () => {
      const strategy = await useCase.run({ element: mockElement });
      
      expect(strategy).toBeDefined();
      expect(strategy.kind).toBe('smart');
      expect(strategy.provider).toBeDefined();
      expect(strategy.selector.variant).toBeDefined();
      expect(strategy.confidence).toBeGreaterThan(0);
    });

    it('应该优先使用自我锚点策略（当元素有文本时）', async () => {
      const elementWithText: ElementDescriptor = {
        ...mockElement,
        text: '登录按钮'
      };

      const strategy = await useCase.run({ element: elementWithText });
      
      expect(strategy.selector.variant).toBe('self-anchor');
      expect(strategy.selector.params?.variant).toBe('self-anchor');
    });

    it('应该使用子锚点策略（当元素有resourceId时）', async () => {
      const elementWithResourceId: ElementDescriptor = {
        ...mockElement,
        text: '', // 清空文本，优先级会转到resourceId
        resourceId: 'com.app:id/submit_button'
      };

      const strategy = await useCase.run({ element: elementWithResourceId });
      
      expect(strategy.selector.variant).toBe('child-anchor');
    });

    it('应该使用父可点击策略（当元素可点击时）', async () => {
      const clickableElement: ElementDescriptor = {
        ...mockElement,
        text: '',
        resourceId: undefined,
        clickable: true,
        tagName: 'Button'
      };

      const strategy = await useCase.run({ element: clickableElement });
      
      expect(strategy.selector.variant).toBe('parent-clickable');
    });

    it('应该生成兜底策略（当其他条件都不满足时）', async () => {
      const minimalElement: ElementDescriptor = {
        nodeId: 'minimal-element',
        tagName: 'div'
      };

      const strategy = await useCase.run({ element: minimalElement });
      
      expect(strategy.selector.variant).toBe('index-fallback');
      expect(strategy.confidence).toBeGreaterThan(0);
    });
  });

  describe('HeuristicProvider', () => {
    it('应该始终可用', async () => {
      const isAvailable = await heuristicProvider.isAvailable();
      expect(isAvailable).toBe(true);
    });

    it('应该能够生成策略', async () => {
      const strategy = await heuristicProvider.generate({ element: mockElement });
      
      expect(strategy).toBeDefined();
      expect(strategy!.kind).toBe('smart');
      expect(strategy!.provider).toBe('heuristic');
      expect(strategy!.selector.variant).toBeDefined();
    });

    it('应该为不同元素类型生成不同的策略', async () => {
      // 文本元素
      const textElement: ElementDescriptor = {
        nodeId: 'text-1',
        text: '点击这里'
      };
      const textStrategy = await heuristicProvider.generate({ element: textElement });
      expect(textStrategy!.selector.variant).toBe('self-anchor');

      // 资源ID元素
      const resourceElement: ElementDescriptor = {
        nodeId: 'resource-1',
        resourceId: 'com.app:id/button'
      };
      const resourceStrategy = await heuristicProvider.generate({ element: resourceElement });
      expect(resourceStrategy!.selector.variant).toBe('child-anchor');
    });
  });

  describe('LegacyManualAdapter', () => {
    it('应该能够创建XPath直接策略', () => {
      const xpath = '//android.widget.Button[@text="确认"]';
      const strategy = LegacyManualAdapter.createXPathDirectStrategy(xpath);
      
      expect(strategy.kind).toBe('manual');
      expect(strategy.type).toBe('xpath-direct');
      expect(strategy.selector.xpath).toBe(xpath);
    });

    it('应该能够检测XPath直接策略', () => {
      const xpathStrategy = LegacyManualAdapter.createXPathDirectStrategy('//button');
      const isXPath = LegacyManualAdapter.isXPathDirectStrategy(xpathStrategy);
      
      expect(isXPath).toBe(true);
    });

    it('应该能够从元素描述符创建XPath策略', () => {
      const strategy = LegacyManualAdapter.fromElementDescriptor(mockElement);
      
      expect(strategy).toBeDefined();
      expect(strategy!.type).toBe('xpath-direct');
      expect(strategy!.selector.xpath).toBe(mockElement.xpath);
    });

    it('应该正确转换旧格式到新格式', () => {
      const legacyData = {
        strategy: 'xpath-direct',
        xpath: '//button[@id="test"]',
        name: '测试按钮'
      };

      const strategy = legacyAdapter.fromLegacy(legacyData);
      
      expect(strategy).toBeDefined();
      expect(strategy!.kind).toBe('manual');
      expect(strategy!.type).toBe('xpath-direct');
      expect(strategy!.selector.xpath).toBe(legacyData.xpath);
      expect(strategy!.name).toBe(legacyData.name);
    });

    it('应该正确转换新格式到旧格式', () => {
      const newStrategy: ManualStrategy = {
        kind: 'manual',
        name: '测试策略',
        type: 'xpath-direct',
        selector: {
          xpath: '//button[@id="test"]'
        },
        createdAt: Date.now()
      };

      const legacyData = legacyAdapter.toLegacy(newStrategy);
      
      expect(legacyData.strategy).toBe('xpath-direct');
      expect(legacyData.xpath).toBe(newStrategy.selector.xpath);
      expect(legacyData.name).toBe(newStrategy.name);
    });
  });

  describe('策略变体类型', () => {
    const expectedVariants = [
      'self-anchor',
      'child-anchor', 
      'parent-clickable',
      'region-scoped',
      'neighbor-relative',
      'index-fallback'
    ];

    it('应该支持所有6种智能策略变体', async () => {
      // 为每种变体创建合适的测试元素
      const testCases = [
        { element: { nodeId: '1', text: 'test' }, expectedVariant: 'self-anchor' },
        { element: { nodeId: '2', resourceId: 'test.id' }, expectedVariant: 'child-anchor' },
        { element: { nodeId: '3', clickable: true, tagName: 'Button' }, expectedVariant: 'parent-clickable' },
        { element: { nodeId: '4', contentDesc: 'description' }, expectedVariant: 'region-scoped' },
        { element: { nodeId: '5', cssPath: 'div > button' }, expectedVariant: 'neighbor-relative' },
        { element: { nodeId: '6', tagName: 'div' }, expectedVariant: 'index-fallback' }
      ];

      for (const testCase of testCases) {
        const strategy = await heuristicProvider.generate({ 
          element: testCase.element as ElementDescriptor 
        });
        
        expect(strategy).toBeDefined();
        expect(expectedVariants).toContain(strategy!.selector.variant);
      }
    });
  });

  describe('错误处理', () => {
    it('应该处理空元素描述符', async () => {
      const emptyElement: ElementDescriptor = {
        nodeId: 'empty'
      };

      const strategy = await useCase.run({ element: emptyElement });
      
      expect(strategy).toBeDefined();
      expect(strategy.selector.variant).toBe('index-fallback');
    });

    it('应该处理无效的旧数据格式', () => {
      const invalidData = null;
      const strategy = legacyAdapter.fromLegacy(invalidData as any);
      
      expect(strategy).toBeNull();
    });

    it('应该在所有提供方失败时生成兜底策略', async () => {
      // 创建一个会失败的提供方
      const failingProvider = {
        name: 'failing-provider',
        priority: 100,
        async isAvailable() { return false; },
        async generate() { throw new Error('Provider failed'); }
      };

      const useCaseWithFailingProvider = new GenerateSmartStrategyUseCase([
        failingProvider,
        heuristicProvider
      ]);

      const strategy = await useCaseWithFailingProvider.run({ element: mockElement });
      
      expect(strategy).toBeDefined();
      expect(strategy.provider).toBe('heuristic'); // 应该回退到启发式提供方
    });
  });
});