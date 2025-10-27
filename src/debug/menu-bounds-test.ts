// src/debug/menu-bounds-test.ts
// module: debug | layer: debug | role: 菜单bounds测试
// summary: 测试菜单元素bounds转换是否正常

import type { UIElement } from '../api/universalUIAPI';
import type { SmartScriptStep } from '../types/smartScript';
import { BoundsDebuggingTool } from './bounds-debugging';

/**
 * 菜单元素bounds测试工具
 */
export class MenuBoundsTest {
  
  /**
   * 创建模拟的菜单元素
   */
  static createMockMenuElement(): UIElement {
    return {
      id: 'element_element_71',
      text: '菜单',
      resource_id: '',
      content_desc: '',
      class_name: 'android.widget.TextView',
      bounds: '[39,143][102,206]', // 正确的菜单bounds
      xpath: '//*[@class="android.widget.TextView" and @text="菜单"]',
      element_type: 'tap',
      attributes: {
        'text': '菜单',
        'class': 'android.widget.TextView',
        'clickable': 'true'
      }
    };
  }

  /**
   * 创建错误bounds的菜单元素（模拟当前bug）
   */
  static createBuggyMenuElement(): UIElement {
    return {
      id: 'element_element_71',
      text: '菜单',
      resource_id: '',
      content_desc: '',
      class_name: 'android.widget.TextView',
      bounds: {
        left: 0,
        top: 1246,
        right: 1080,
        bottom: 2240
      }, // 错误的bounds - 覆盖屏幕下半部分
      xpath: '//*[@class="android.widget.TextView" and @text="菜单"]',
      element_type: 'tap',
      attributes: {
        'text': '菜单',
        'class': 'android.widget.TextView',
        'clickable': 'true'
      }
    };
  }

  /**
   * 测试bounds转换流程 
   */
  static testBoundsConversion() {
    console.log('🧪 [菜单测试] 开始bounds转换测试...');
    
    // 测试正确的bounds
    const correctElement = this.createMockMenuElement();
    console.log('✅ [菜单测试] 正确的菜单元素:', {
      id: correctElement.id,
      text: correctElement.text,
      bounds: correctElement.bounds
    });

    // 测试错误的bounds
    const buggyElement = this.createBuggyMenuElement();
    console.log('❌ [菜单测试] 错误的菜单元素:', {
      id: buggyElement.id,
      text: buggyElement.text,
      bounds: buggyElement.bounds
    });

    // 模拟bounds转换
    this.simulateBoundsConversion(correctElement, '正确元素');
    this.simulateBoundsConversion(buggyElement, '错误元素');
  }

  /**
   * 模拟bounds转换过程
   */
  private static simulateBoundsConversion(element: UIElement, testCase: string) {
    console.log(`\n🔧 [菜单测试 - ${testCase}] 模拟bounds转换:`);
    
    // 模拟 convertElementToContext 中的bounds转换
    let boundsString = '';
    if (element.bounds) {
      if (typeof element.bounds === 'string') {
        boundsString = element.bounds;
        console.log(`  📝 字符串bounds: ${boundsString}`);
      } else if (typeof element.bounds === 'object' && 'left' in element.bounds) {
        const bounds = element.bounds as { left: number; top: number; right: number; bottom: number };
        boundsString = `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
        console.log(`  📝 对象转字符串bounds: ${boundsString}`);
      }
    }

    // 模拟 SmartScriptStep 中的bounds参数
    const stepBounds = element.bounds ? JSON.stringify(element.bounds) : '';
    console.log(`  📋 Step参数bounds: ${stepBounds}`);

    // 模拟 parseBoundsFromParams 解析
    try {
      let parsedBounds: { left: number; top: number; right: number; bottom: number };
      
      if (typeof element.bounds === 'string') {
        // 尝试解析括号格式
        const bracketFormat = element.bounds.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
        if (bracketFormat) {
          parsedBounds = {
            left: parseInt(bracketFormat[1]),
            top: parseInt(bracketFormat[2]),
            right: parseInt(bracketFormat[3]),
            bottom: parseInt(bracketFormat[4]),
          };
          console.log(`  ✅ 解析括号格式成功:`, parsedBounds);
        } else {
          parsedBounds = JSON.parse(element.bounds);
          console.log(`  ✅ 解析JSON格式成功:`, parsedBounds);
        }
      } else if (typeof element.bounds === 'object') {
        parsedBounds = element.bounds as { left: number; top: number; right: number; bottom: number };
        console.log(`  ✅ 直接使用对象格式:`, parsedBounds);
      } else {
        console.log(`  ❌ 无法解析bounds类型:`, typeof element.bounds);
        return;
      }

      // 转换为V2引擎格式
      const v2Bounds = {
        x: parsedBounds.left || 0,
        y: parsedBounds.top || 0,
        width: (parsedBounds.right || 100) - (parsedBounds.left || 0),
        height: (parsedBounds.bottom || 50) - (parsedBounds.top || 0),
      };
      console.log(`  🎯 V2引擎bounds:`, v2Bounds);

      // 验证菜单bounds
      const validation = BoundsDebuggingTool.validateMenuElementBounds(element.id, element.text, parsedBounds);
      console.log(`  🔍 验证结果:`, validation);

    } catch (error) {
      console.error(`  ❌ bounds解析失败:`, error);
    }
  }

  /**
   * 测试智能选择模式的bounds传递
   */
  static testIntelligentSelectionBounds() {
    console.log('\n🧠 [智能选择测试] 测试"智能自动链选择模式:第一个"...');
    
    const menuElement = this.createMockMenuElement();
    
    // 模拟创建SmartScriptStep
    const mockStep: Partial<SmartScriptStep> = {
      id: 'step_1761310026344',
      name: '智能点击菜单',
      step_type: 'smart_find_element',
      parameters: {
        element_selector: menuElement.xpath,
        text: menuElement.text,
        bounds: JSON.stringify(menuElement.bounds), // 关键：这里的bounds如何被处理？
        resource_id: menuElement.resource_id,
        content_desc: menuElement.content_desc,
      }
    };

    console.log('📋 [智能选择测试] 模拟Step参数:', {
      stepId: mockStep.id,
      bounds: mockStep.parameters?.bounds,
      expectedResult: '应该解析为 [39,143][102,206]'
    });

    // 验证bounds参数
    if (mockStep.parameters?.bounds) {
      try {
        const boundsValue = JSON.parse(mockStep.parameters.bounds);
        console.log('🔍 [智能选择测试] 解析后的bounds:', boundsValue);
        
        if (typeof boundsValue === 'string' && boundsValue === '[39,143][102,206]') {
          console.log('✅ [智能选择测试] bounds格式正确！');
        } else if (typeof boundsValue === 'object' && boundsValue.left === 39) {
          console.log('✅ [智能选择测试] bounds内容正确（对象格式）');
        } else {
          console.warn('⚠️ [智能选择测试] bounds可能有问题:', boundsValue);
        }
      } catch (error) {
        console.error('❌ [智能选择测试] bounds解析失败:', error);
      }
    }
  }
}

/**
 * 运行完整的菜单bounds测试
 */
export function runMenuBoundsTest() {
  console.log('🚀 启动菜单bounds测试套件...\n');
  
  MenuBoundsTest.testBoundsConversion();
  MenuBoundsTest.testIntelligentSelectionBounds();
  
  console.log('\n✅ 菜单bounds测试完成！');
}

// 自动执行测试（在开发环境）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 延迟执行，避免阻塞页面加载
  setTimeout(() => {
    console.log('\n🔧 [开发模式] 自动执行菜单bounds测试...');
    runMenuBoundsTest();
  }, 2000);
}