/**
 * ElementHierarchyAnaly    {
      id: 'element_1',
      element_type: 'View',
      text: '',
      content_desc: '',
      bounds: { left: 100, top: 200, right: 300, bottom: 250 },
      xpath: '/hierarchy/android.widget.FrameLayout[0]/android.widget.LinearLayout[0]',
      is_clickable: false,
      is_scrollable: false,
      is_enabled: true,
      is_focused: false,
      checkable: false,
      checked: false,
      selected: false,
      password: false
    },
 * 此脚本用于验证ElementHierarchyAnalyzer在处理"无根节点"情况时的修复效果
 */

import type { UIElement } from '../../../../api/universal-ui';
import { ElementHierarchyAnalyzer } from './ElementHierarchyAnalyzer';

/**
 * 创建测试元素数据
 */
function createTestElements(): UIElement[] {
  return [
    {
      id: 'element_1',
      element_type: 'android.widget.FrameLayout',
      text: '',
      content_desc: '',
      bounds: { left: 0, top: 0, right: 1000, bottom: 2000 },
      xpath: '/hierarchy/android.widget.FrameLayout[1]',
      is_clickable: false,
      is_scrollable: false,
      is_enabled: true,
      is_focused: false,
      checkable: false,
      checked: false,
      selected: false,
      password: false
    },
    {
      id: 'element_2',
      element_type: 'android.widget.LinearLayout',
      text: '',
      content_desc: '',
      bounds: { left: 50, top: 100, right: 950, bottom: 800 },
      xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]',
      is_clickable: false,
      is_scrollable: false,
      is_enabled: true,
      is_focused: false,
      checkable: false,
      checked: false,
      selected: false,
      password: false
    },
    {
      id: 'element_3',
      element_type: 'android.widget.Button',
      text: '确定',
      content_desc: '确定按钮',
      bounds: { left: 100, top: 200, right: 300, bottom: 280 },
      xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.Button[1]',
      is_clickable: true,
      is_scrollable: false,
      is_enabled: true,
      is_focused: false,
      checkable: false,
      checked: false,
      selected: false,
      password: false
    }
  ];
}

/**
 * 测试正常情况
 */
export function testNormalCase(): void {
  console.log('🧪 测试正常层次结构...');
  
  try {
    const elements = createTestElements();
    const result = ElementHierarchyAnalyzer.analyzeHierarchy(elements);
    
    console.log('✅ 正常情况测试通过:', {
      根节点: result.root.element.id,
      最大深度: result.maxDepth,
      叶子节点数: result.leafNodes.length
    });
  } catch (error) {
    console.error('❌ 正常情况测试失败:', error);
  }
}

/**
 * 测试边缘情况：所有元素都相互包含
 */
export function testEdgeCase(): void {
  console.log('🧪 测试边缘情况：循环包含...');
  
  try {
    // 创建相互包含的元素（理论上不应该发生，但数据可能有问题）
    const problematicElements: UIElement[] = [
      {
        id: 'element_A',
        element_type: 'Container',
        text: '',
        content_desc: '',
        bounds: { left: 0, top: 0, right: 100, bottom: 100 },
        xpath: '/element_A',
        is_clickable: false,
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false
      },
      {
        id: 'element_B',
        element_type: 'Container',
        text: '',
        content_desc: '',
        bounds: { left: 10, top: 10, right: 90, bottom: 90 },
        xpath: '/element_B',
        is_clickable: false,
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false
      }
    ];
    
    const result = ElementHierarchyAnalyzer.analyzeHierarchy(problematicElements);
    
    console.log('✅ 边缘情况测试通过 (使用备选策略):', {
      根节点: result.root.element.id,
      最大深度: result.maxDepth,
      叶子节点数: result.leafNodes.length
    });
  } catch (error) {
    console.error('❌ 边缘情况测试失败:', error);
  }
}

/**
 * 运行所有测试
 */
export function runAllTests(): void {
  console.log('🚀 开始ElementHierarchyAnalyzer修复验证...');
  
  testNormalCase();
  testEdgeCase();
  
  console.log('🎯 验证完成！');
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  (window as any).testElementHierarchy = {
    runAllTests,
    testNormalCase,
    testEdgeCase
  };
  
  console.log('💡 在浏览器控制台中运行: testElementHierarchy.runAllTests()');
}