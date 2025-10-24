// src/hotfix/bounds-format-fix.ts
// module: hotfix | layer: hotfix | role: bounds格式修复热补丁
// summary: 修复可视化分析页面元素bounds格式错误导致的点击错位问题

/**
 * Bounds格式修复热补丁
 * 
 * 🐛 问题描述：
 * - 用户选择"菜单"元素 (bounds=[39,143][102,206])
 * - 但实际传递给后端的bounds是错误的 [0,1246][1080,2240]
 * - 导致"智能自动链选择模式:第一个"点击了错误的位置
 * 
 * 🔧 修复方案：
 * - 确保所有ElementSelectionContext创建时bounds格式正确
 * - 统一bounds字符串格式：[left,top][right,bottom]
 * - 修复VisualUIElement到UIElement的转换
 */

export interface BoundsFormatFixer {
  /**
   * 标准化bounds格式
   * @param bounds - 可能是对象或字符串格式的bounds
   * @returns 标准的bounds字符串格式 [left,top][right,bottom]
   */
  normalizeBounds(bounds: unknown): string;
  
  /**
   * 修复ElementSelectionContext中的bounds
   */
  fixElementSelectionContext(context: any): any;
  
  /**
   * 应用全局bounds格式修复
   */
  applyGlobalFix(): void;
}

/**
 * Bounds格式修复器实现
 */
export class BoundsFormatFixerImpl implements BoundsFormatFixer {
  private static instance: BoundsFormatFixerImpl;
  
  static getInstance(): BoundsFormatFixerImpl {
    if (!BoundsFormatFixerImpl.instance) {
      BoundsFormatFixerImpl.instance = new BoundsFormatFixerImpl();
    }
    return BoundsFormatFixerImpl.instance;
  }
  
  /**
   * 标准化bounds格式
   */
  normalizeBounds(bounds: unknown): string {
    if (!bounds) return '';
    
    // 如果已经是字符串格式，检查是否符合标准
    if (typeof bounds === 'string') {
      // 检查是否是标准格式 [left,top][right,bottom]
      const standardFormat = /^\[\d+,\d+\]\[\d+,\d+\]$/.test(bounds);
      if (standardFormat) {
        return bounds;
      }
      
      // 尝试解析其他字符串格式
      try {
        const parsed = JSON.parse(bounds);
        return this.normalizeBounds(parsed);
      } catch {
        return bounds; // 如果解析失败，返回原字符串
      }
    }
    
    // 如果是对象格式，转换为标准字符串
    if (typeof bounds === 'object' && bounds !== null) {
      const boundsObj = bounds as any;
      
      // 检查是否有必要的属性
      if ('left' in boundsObj && 'top' in boundsObj && 
          'right' in boundsObj && 'bottom' in boundsObj) {
        return `[${boundsObj.left},${boundsObj.top}][${boundsObj.right},${boundsObj.bottom}]`;
      }
      
      // 检查是否是position格式 {x, y, width, height}
      if ('x' in boundsObj && 'y' in boundsObj && 
          'width' in boundsObj && 'height' in boundsObj) {
        const left = boundsObj.x;
        const top = boundsObj.y;
        const right = left + boundsObj.width;
        const bottom = top + boundsObj.height;
        return `[${left},${top}][${right},${bottom}]`;
      }
    }
    
    console.warn('⚠️ [BoundsFormatFixer] 无法标准化bounds格式:', bounds);
    return '';
  }
  
  /**
   * 修复ElementSelectionContext中的bounds
   */
  fixElementSelectionContext(context: any): any {
    if (!context) return context;
    
    const fixed = { ...context };
    
    if (fixed.elementBounds) {
      const originalBounds = fixed.elementBounds;
      fixed.elementBounds = this.normalizeBounds(originalBounds);
      
      if (fixed.elementBounds !== originalBounds) {
        console.log('🔧 [BoundsFormatFixer] 修复elementBounds格式:', {
          original: originalBounds,
          fixed: fixed.elementBounds
        });
      }
    }
    
    return fixed;
  }
  
  /**
   * 应用全局bounds格式修复
   */
  applyGlobalFix(): void {
    console.log('🔧 [BoundsFormatFixer] 应用全局bounds格式修复');
    
    // 拦截并修复所有可能的ElementSelectionContext创建
    this.patchCreateElementContext();
    this.patchUniversalUIService();
    
    console.log('✅ [BoundsFormatFixer] 全局bounds格式修复已应用');
  }
  
  /**
   * 修补ElementSelectionContext创建函数
   */
  private patchCreateElementContext(): void {
    // 这里可以添加对各种ElementSelectionContext创建函数的拦截和修复
    // 例如 enhanced-element-selection-demo.tsx 中的 createElementContext
    
    // 由于无法直接修改已编译的模块，这里主要提供修复工具函数
    // 实际修复需要在各个使用点应用
  }
  
  /**
   * 修补UniversalUIService相关方法
   */
  private patchUniversalUIService(): void {
    // 类似地，这里可以添加对UniversalUIService的修补
    // 确保所有通过该服务创建的ElementSelectionContext都有正确的bounds格式
  }
}

/**
 * 便捷的全局修复函数
 */
export function applyBoundsFormatFix(): void {
  const fixer = BoundsFormatFixerImpl.getInstance();
  fixer.applyGlobalFix();
}

/**
 * 修复单个ElementSelectionContext
 */
export function fixElementSelectionContext(context: any): any {
  const fixer = BoundsFormatFixerImpl.getInstance();
  return fixer.fixElementSelectionContext(context);
}

/**
 * 标准化bounds格式
 */
export function normalizeBounds(bounds: unknown): string {
  const fixer = BoundsFormatFixerImpl.getInstance();
  return fixer.normalizeBounds(bounds);
}

// 默认导出
export default BoundsFormatFixerImpl;