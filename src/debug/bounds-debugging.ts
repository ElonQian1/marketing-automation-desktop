// src/debug/bounds-debugging.ts
// module: debug | layer: debug | role: bounds调试工具
// summary: 用于调试和验证bounds格式转换的工具

/**
 * Bounds调试工具
 * 用于验证菜单元素选择时bounds的正确性
 */

export interface DebugBoundsInfo {
  elementId: string;
  elementText?: string;
  expectedBounds: string; // 用户选择的真实bounds
  actualBounds: string;   // 系统传递给后端的bounds
  isCorrect: boolean;
  discrepancy?: {
    xDiff: number;
    yDiff: number;
    sizeDiff: number;
  };
}

export class BoundsDebuggingTool {
  private static debugLog: DebugBoundsInfo[] = [];

  /**
   * 记录bounds转换过程
   */
  static logBoundsConversion(
    elementId: string,
    elementText: string,
    expectedBounds: string,
    actualBounds: string
  ): void {
    const isCorrect = expectedBounds === actualBounds;
    
    const debugInfo: DebugBoundsInfo = {
      elementId,
      elementText,
      expectedBounds,
      actualBounds,
      isCorrect
    };

    if (!isCorrect) {
      const expected = this.parseBoundsString(expectedBounds);
      const actual = this.parseBoundsString(actualBounds);
      
      if (expected && actual) {
        debugInfo.discrepancy = {
          xDiff: Math.abs(expected.left - actual.left),
          yDiff: Math.abs(expected.top - actual.top),
          sizeDiff: Math.abs(
            (expected.right - expected.left) * (expected.bottom - expected.top) -
            (actual.right - actual.left) * (actual.bottom - actual.top)
          )
        };
      }
    }

    this.debugLog.push(debugInfo);
    
    console.log(`🔍 [BoundsDebug] ${isCorrect ? '✅' : '❌'} 元素bounds转换:`, {
      elementId: elementId.slice(-8),
      elementText,
      expected: expectedBounds,
      actual: actualBounds,
      discrepancy: debugInfo.discrepancy
    });
  }

  /**
   * 解析bounds字符串
   */
  private static parseBoundsString(bounds: string): { left: number; top: number; right: number; bottom: number } | null {
    // 尝试解析 [left,top][right,bottom] 格式
    const bracketMatch = bounds.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
    if (bracketMatch) {
      return {
        left: parseInt(bracketMatch[1]),
        top: parseInt(bracketMatch[2]),
        right: parseInt(bracketMatch[3]),
        bottom: parseInt(bracketMatch[4])
      };
    }
    
    // 尝试解析JSON格式
    try {
      return JSON.parse(bounds);
    } catch {
      return null;
    }
  }

  /**
   * 获取调试日志
   */
  static getDebugLog(): DebugBoundsInfo[] {
    return [...this.debugLog];
  }

  /**
   * 清除调试日志
   */
  static clearDebugLog(): void {
    this.debugLog = [];
  }

  /**
   * 获取错误的bounds转换
   */
  static getIncorrectConversions(): DebugBoundsInfo[] {
    return this.debugLog.filter(info => !info.isCorrect);
  }

  /**
   * 验证菜单元素的bounds是否正确
   * 
   * 根据XML分析，菜单元素的正确bounds应该是 [39,143][102,206]
   * 如果传递的是 [0,1246][1080,2240]，说明bounds被错误替换了
   */
  static validateMenuElementBounds(
    elementId: string,
    elementText: string | undefined,
    bounds: unknown
  ): {
    isValid: boolean;
    message: string;
    suggestedFix?: string;
  } {
    const expectedMenuBounds = '[39,143][102,206]';
    const wrongBounds = '[0,1246][1080,2240]';
    
    let boundsString = '';
    if (typeof bounds === 'string') {
      boundsString = bounds;
    } else if (typeof bounds === 'object' && bounds !== null) {
      const boundsObj = bounds as any;
      if ('left' in boundsObj && 'top' in boundsObj && 'right' in boundsObj && 'bottom' in boundsObj) {
        boundsString = `[${boundsObj.left},${boundsObj.top}][${boundsObj.right},${boundsObj.bottom}]`;
      }
    }
    
    // 检查是否是菜单元素
    const isMenuElement = elementText === '菜单' || 
                         elementId.includes('menu') || 
                         boundsString === expectedMenuBounds;
    
    if (!isMenuElement) {
      return {
        isValid: true,
        message: '非菜单元素，跳过验证'
      };
    }
    
    // 检查是否是错误的bounds
    if (boundsString === wrongBounds) {
      return {
        isValid: false,
        message: '检测到菜单元素使用了错误的bounds (覆盖屏幕下半部分)',
        suggestedFix: `应该使用菜单按钮的真实bounds: ${expectedMenuBounds}`
      };
    }
    
    // 检查是否是正确的bounds
    if (boundsString === expectedMenuBounds) {
      return {
        isValid: true,
        message: '菜单元素bounds正确'
      };
    }
    
    return {
      isValid: false,
      message: `菜单元素bounds不匹配预期值。当前: ${boundsString}, 预期: ${expectedMenuBounds}`
    };
  }

  /**
   * 生成调试报告
   */
  static generateDebugReport(): string {
    const log = this.getDebugLog();
    const incorrectConversions = this.getIncorrectConversions();
    
    const report = [
      '=== Bounds转换调试报告 ===',
      `总转换次数: ${log.length}`,
      `错误转换次数: ${incorrectConversions.length}`,
      '',
      '错误转换详情:',
      ...incorrectConversions.map(info => 
        `- 元素: ${info.elementText || info.elementId.slice(-8)}
         预期: ${info.expectedBounds}
         实际: ${info.actualBounds}
         差异: ${info.discrepancy ? `位置偏差(${info.discrepancy.xDiff}, ${info.discrepancy.yDiff}), 大小偏差${info.discrepancy.sizeDiff}` : '无法计算'}`
      ),
      '',
      '=== 报告结束 ==='
    ];
    
    return report.join('\n');
  }
}

/**
 * 便捷的调试函数
 */
export function debugBoundsConversion(
  elementId: string,
  elementText: string,
  expectedBounds: string,
  actualBounds: string
): void {
  BoundsDebuggingTool.logBoundsConversion(elementId, elementText, expectedBounds, actualBounds);
}

export function validateMenuBounds(
  elementId: string,
  elementText: string | undefined,
  bounds: unknown
): boolean {
  const result = BoundsDebuggingTool.validateMenuElementBounds(elementId, elementText, bounds);
  
  if (!result.isValid) {
    console.error('❌ [BoundsDebug] 菜单元素bounds验证失败:', result.message);
    if (result.suggestedFix) {
      console.log('💡 [BoundsDebug] 建议修复:', result.suggestedFix);
    }
  }
  
  return result.isValid;
}

// 默认导出
export default BoundsDebuggingTool;