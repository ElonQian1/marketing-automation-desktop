// src/modules/intelligent-strategy-system/scoring/stability-assessment/strategies/DeviceCompatibilityAnalyzer.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 设备兼容性分析策略
 * 
 * @description 处理不同设备间的兼容性评估
 */

import type { MatchStrategy } from '../../../types/StrategyTypes';
import type {
  DeviceProfile,
  DeviceCompatibilityResult,
  DeviceCompatibilityReport
} from '../types';

/**
 * 设备兼容性分析器
 */
export class DeviceCompatibilityAnalyzer {
  /**
   * 分析设备兼容性
   */
  async analyzeDeviceCompatibility(
    strategy: MatchStrategy,
    element: any,
    deviceProfiles: DeviceProfile[]
  ): Promise<number> {
    if (!deviceProfiles || deviceProfiles.length === 0) {
      return 0.5; // 默认中等兼容性
    }

    const compatibilityResults = await Promise.all(
      deviceProfiles.map(device => this.assessSingleDeviceCompatibility(strategy, element, device))
    );

    const compatibleDevices = compatibilityResults.filter(result => result.isCompatible).length;
    return compatibleDevices / deviceProfiles.length;
  }

  /**
   * 评估单个设备兼容性
   */
  async assessSingleDeviceCompatibility(
    strategy: MatchStrategy,
    element: any,
    device: DeviceProfile
  ): Promise<DeviceCompatibilityResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let compatibilityScore = 1.0;

    // 分析策略与设备特性的兼容性
    if (this.isPositionSensitiveStrategy(strategy)) {
      if (this.hasVariableLayout(device)) {
        issues.push('位置敏感策略在该设备上可能不稳定');
        compatibilityScore -= 0.3;
      }
    }

    if (this.isResolutionSensitive(strategy)) {
      if (this.hasNonStandardResolution(device)) {
        issues.push('分辨率相关匹配在该设备上可能失效');
        compatibilityScore -= 0.2;
      }
    }

    // 检查设备特有问题
    if (device.manufacturer.toLowerCase() === 'samsung') {
      if (this.usesSamsungSpecificElements(element)) {
        issues.push('Samsung设备特有UI元素');
        recommendations.push('考虑添加Samsung专用匹配条件');
      }
    }

    if (device.manufacturer.toLowerCase() === 'xiaomi') {
      if (this.usesMIUISpecificElements(element)) {
        issues.push('MIUI定制化界面元素');
        recommendations.push('添加MIUI兼容性处理');
      }
    }

    compatibilityScore = Math.max(0, Math.min(1, compatibilityScore));

    return {
      device: `${device.manufacturer} ${device.model}`,
      isCompatible: compatibilityScore >= 0.6,
      compatibilityScore,
      issues,
      recommendations
    };
  }

  /**
   * 生成设备兼容性报告
   */
  async generateCompatibilityReport(
    strategy: MatchStrategy,
    element: any,
    deviceProfiles: DeviceProfile[]
  ): Promise<DeviceCompatibilityReport> {
    const deviceResults = await Promise.all(
      deviceProfiles.map(device => this.assessSingleDeviceCompatibility(strategy, element, device))
    );

    const overallCompatibility = deviceResults.reduce(
      (sum, result) => sum + result.compatibilityScore, 0
    ) / deviceResults.length;

    const recommendedDevices = deviceResults
      .filter(result => result.compatibilityScore >= 0.8)
      .map(result => result.device);

    const problematicDevices = deviceResults
      .filter(result => result.compatibilityScore < 0.6)
      .map(result => result.device);

    const optimizationSuggestions = this.generateOptimizationSuggestions(deviceResults, strategy);

    return {
      strategy,
      overallCompatibility,
      deviceResults,
      recommendedDevices,
      problematicDevices,
      optimizationSuggestions
    };
  }

  // === 私有辅助方法 ===

  private isPositionSensitiveStrategy(strategy: MatchStrategy): boolean {
    return strategy === 'absolute' || strategy === 'strict';
  }

  private isResolutionSensitive(strategy: MatchStrategy): boolean {
    return strategy === 'absolute';
  }

  private hasVariableLayout(device: DeviceProfile): boolean {
    return device.characteristics.includes('variable-layout') ||
           device.characteristics.includes('adaptive-ui');
  }

  private hasNonStandardResolution(device: DeviceProfile): boolean {
    const standardResolutions = ['1080x1920', '1440x2560', '720x1280'];
    return !standardResolutions.includes(device.resolution);
  }

  private usesSamsungSpecificElements(element: any): boolean {
    if (!element || !element['resource-id']) return false;
    return element['resource-id'].includes('com.samsung');
  }

  private usesMIUISpecificElements(element: any): boolean {
    if (!element || !element['resource-id']) return false;
    return element['resource-id'].includes('com.miui') ||
           element['resource-id'].includes('com.xiaomi');
  }

  private generateOptimizationSuggestions(
    results: DeviceCompatibilityResult[],
    strategy: MatchStrategy
  ): string[] {
    const suggestions: string[] = [];
    
    const problemDevices = results.filter(r => r.compatibilityScore < 0.6);
    if (problemDevices.length > 0) {
      suggestions.push('考虑使用更通用的匹配策略（如relaxed或standard）');
      
      if (strategy === 'absolute') {
        suggestions.push('避免使用绝对定位，改用语义化匹配');
      }
      
      if (problemDevices.some(r => r.issues.some(i => i.includes('分辨率')))) {
        suggestions.push('添加分辨率自适应逻辑');
      }
    }

    return suggestions;
  }
}